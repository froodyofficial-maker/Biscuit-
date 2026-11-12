// Biscuit on Cloudflare Workers (free plan).
// The app's static files are served straight from public/. Everything under /api and /uploads goes to one
// Durable Object, "BiscuitHub", which runs the same chat core as server.mjs and keeps all data in its SQLite storage.
// Live updates use hibernating WebSockets, so an idle server costs nothing.
import '../public/js/core.js';

const { Core, BiscuitError, RPC, LIMITS } = globalThis.BiscuitCore;
const UPLOAD_MB = 25;
const CHUNK = 1024 * 1024; // files are stored in 1 MB rows
const ENC = new TextEncoder();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
      const hub = env.HUB.get(env.HUB.idFromName('biscuit'));
      return hub.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const randomHex = n => hex(crypto.getRandomValues(new Uint8Array(n)));
async function hashPassword(pw, salt) {
  const key = await crypto.subtle.importKey('raw', ENC.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: ENC.encode(salt), iterations: 100000 }, key, 256));
}
function sameString(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const INLINE = /^(image\/(png|jpeg|gif|webp|avif)|video\/(mp4|webm|quicktime)|audio\/(mpeg|ogg|wav))$/;
const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'video/mp4': '.mp4', 'video/webm': '.webm', 'audio/mpeg': '.mp3' };

export class BiscuitHub {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.sql = ctx.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT);
      CREATE TABLE IF NOT EXISTS creds (uid TEXT PRIMARY KEY, salt TEXT, hash TEXT);
      CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, uid TEXT, at INTEGER);
      CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, cid TEXT, body TEXT);
      CREATE INDEX IF NOT EXISTS messages_cid ON messages (cid, id);
      CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, type TEXT, name TEXT, size INTEGER);
      CREATE TABLE IF NOT EXISTS chunks (id TEXT, idx INTEGER, data BLOB, PRIMARY KEY (id, idx));
    `);
    // keep connections alive without waking the object
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    this.load();
  }

  // ---------- storage ----------
  load() {
    const row = this.sql.exec("SELECT v FROM kv WHERE k = 'meta'").toArray()[0];
    const meta = row ? JSON.parse(row.v) : null;
    let state = null;
    if (meta) {
      state = Object.assign(meta, { messages: {} });
      for (const cid of Object.keys(meta.channels)) state.messages[cid] = [];
      const keep = LIMITS.keepMessages;
      for (const r of this.sql.exec('SELECT cid, body FROM messages ORDER BY id')) {
        const list = state.messages[r.cid];
        if (list) list.push(JSON.parse(r.body));
      }
      for (const [cid, list] of Object.entries(state.messages)) {
        if (list.length > keep) {
          const cut = list[list.length - keep].id;
          this.sql.exec('DELETE FROM messages WHERE cid = ? AND id < ?', cid, cut);
          state.messages[cid] = list.slice(-keep);
        }
      }
    }
    this.metaDirty = false;
    this.core = new Core(state, { emit: (ev, audience) => this.onEmit(ev, audience), changed: () => this.markDirty(), allowDataUrls: false });
    // after waking from hibernation, anyone still connected is online
    for (const ws of this.ctx.getWebSockets()) {
      const uid = this.ctx.getTags(ws)[0];
      if (uid) this.core.online.add(uid);
    }
    this.flush();
  }
  markDirty() {
    if (this.metaDirty) return;
    this.metaDirty = true;
    queueMicrotask(() => this.flush());
  }
  flush() {
    if (!this.metaDirty && this.sql.exec("SELECT 1 FROM kv WHERE k = 'meta'").toArray().length) return;
    this.metaDirty = false;
    const s = this.core.s;
    const meta = { users: s.users, servers: s.servers, channels: s.channels, emojis: s.emojis, invites: s.invites };
    this.sql.exec("INSERT OR REPLACE INTO kv (k, v) VALUES ('meta', ?)", JSON.stringify(meta));
  }
  persistEvent(ev) {
    switch (ev.t) {
      case 'message': case 'message-update':
        this.sql.exec('INSERT OR REPLACE INTO messages (id, cid, body) VALUES (?, ?, ?)', ev.message.id, ev.message.channelId, JSON.stringify(ev.message));
        break;
      case 'message-remove':
        this.sql.exec('DELETE FROM messages WHERE id = ?', ev.id);
        break;
      case 'channel-remove':
        this.sql.exec('DELETE FROM messages WHERE cid = ?', ev.id);
        break;
      case 'server-remove': {
        const live = Object.keys(this.core.s.channels);
        const rows = this.sql.exec('SELECT DISTINCT cid FROM messages').toArray();
        for (const r of rows) if (!live.includes(r.cid)) this.sql.exec('DELETE FROM messages WHERE cid = ?', r.cid);
        break;
      }
    }
  }
  onEmit(ev, audience) {
    this.persistEvent(ev);
    if (ev.t !== 'typing') this.markDirty();
    const data = JSON.stringify(ev);
    const sockets = audience ? audience.flatMap(uid => this.ctx.getWebSockets(uid)) : this.ctx.getWebSockets();
    for (const ws of sockets) { try { ws.send(data); } catch {} }
  }

  // ---------- auth ----------
  session(request, url) {
    const h = request.headers.get('Authorization') || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : (url && url.searchParams.get('token')) || '';
    const row = token && this.sql.exec('SELECT uid FROM sessions WHERE token = ?', token).toArray()[0];
    if (!row || !this.core.s.users[row.uid]) throw new BiscuitError('Please log in again', 401);
    return { uid: row.uid, token };
  }
  newSession(uid) {
    const token = randomHex(32);
    this.sql.exec('INSERT INTO sessions (token, uid, at) VALUES (?, ?, ?)', token, uid, Date.now());
    return token;
  }
  checkPassword(pw) {
    if (typeof pw !== 'string' || !pw.length) throw new BiscuitError('Type a password');
    if (pw.length > 1000) throw new BiscuitError('That password is too long');
  }
  async body(request) {
    const text = await request.text();
    if (text.length > 1 << 20) throw new BiscuitError('Request too large', 413);
    try { return text ? JSON.parse(text) : {}; } catch { throw new BiscuitError('Bad JSON'); }
  }

  // ---------- http ----------
  async fetch(request) {
    const url = new URL(request.url);
    const p = url.pathname;
    try {
      if (p === '/api/config') return json({ mode: 'server', realtime: 'ws', gifSearch: !!this.env.GIPHY_API_KEY, limits: Object.assign({}, LIMITS, { uploadMB: UPLOAD_MB }) });
      if (p === '/api/register' && request.method === 'POST') {
        const b = await this.body(request);
        this.checkPassword(b.password);
        const u = this.core.createUser(b.username, b.displayName);
        const salt = randomHex(16);
        this.sql.exec('INSERT OR REPLACE INTO creds (uid, salt, hash) VALUES (?, ?, ?)', u.id, salt, await hashPassword(b.password, salt));
        return json({ token: this.newSession(u.id) });
      }
      if (p === '/api/login' && request.method === 'POST') {
        const b = await this.body(request);
        const u = this.core.findUserByUsername(b.username);
        const c = u && this.sql.exec('SELECT salt, hash FROM creds WHERE uid = ?', u.id).toArray()[0];
        if (!c || !sameString(await hashPassword(String(b.password ?? ''), c.salt), c.hash)) throw new BiscuitError('Wrong username or password', 401);
        return json({ token: this.newSession(u.id) });
      }
      if (p === '/api/logout' && request.method === 'POST') {
        const { token } = this.session(request);
        this.sql.exec('DELETE FROM sessions WHERE token = ?', token);
        return json({ ok: true });
      }
      if (p === '/api/password' && request.method === 'POST') {
        const { uid } = this.session(request);
        const b = await this.body(request);
        const c = this.sql.exec('SELECT salt, hash FROM creds WHERE uid = ?', uid).toArray()[0];
        if (!c || !sameString(await hashPassword(String(b.current ?? ''), c.salt), c.hash)) throw new BiscuitError('Your current password is wrong', 403);
        this.checkPassword(b.next);
        const salt = randomHex(16);
        this.sql.exec('UPDATE creds SET salt = ?, hash = ? WHERE uid = ?', salt, await hashPassword(b.next, salt), uid);
        return json({ ok: true });
      }
      if (p === '/api/state') { const { uid } = this.session(request); return json(this.core.viewFor(uid)); }
      if (p === '/api/ws') {
        if (request.headers.get('Upgrade') !== 'websocket') throw new BiscuitError('Expected a WebSocket', 426);
        const { uid } = this.session(request, url);
        const pair = new WebSocketPair();
        this.ctx.acceptWebSocket(pair[1], [uid]);
        this.core.setOnline(uid, true);
        return new Response(null, { status: 101, webSocket: pair[0] });
      }
      if (p.startsWith('/api/rpc/') && request.method === 'POST') {
        const method = p.slice(9);
        if (!RPC.has(method)) throw new BiscuitError('Unknown action', 404);
        const { uid } = this.session(request);
        const args = await this.body(request);
        return json({ data: this.core[method](uid, args) });
      }
      if (p === '/api/upload' && request.method === 'POST') return await this.upload(request);
      if (p === '/api/gifs') { this.session(request); return json({ results: await this.gifs(url) }); }
      if (p.startsWith('/uploads/')) return this.serveFile(p.slice(9));
      throw new BiscuitError('Not found', 404);
    } catch (e) {
      const code = e instanceof BiscuitError ? e.code : 500;
      if (code === 500) console.error(e && e.stack || e);
      return json({ error: code === 500 ? 'Something went wrong on the server' : e.message }, code);
    }
  }

  async upload(request) {
    this.session(request);
    const max = UPLOAD_MB * 1024 * 1024;
    if (+request.headers.get('Content-Length') > max) throw new BiscuitError(`Files can be up to ${UPLOAD_MB} MB`, 413);
    const type = (request.headers.get('Content-Type') || 'application/octet-stream').split(';')[0].trim().toLowerCase();
    let name = 'file';
    try { name = decodeURIComponent(request.headers.get('X-Filename') || 'file'); } catch {}
    name = name.replace(/[^\w.\- ()]/g, '_').slice(0, 120) || 'file';
    const ext = ((name.match(/\.[A-Za-z0-9]{1,8}$/) || [])[0] || EXT[type] || '.bin').toLowerCase();
    const id = randomHex(12) + ext;
    const buf = new Uint8Array(await request.arrayBuffer());
    if (buf.length > max) throw new BiscuitError(`Files can be up to ${UPLOAD_MB} MB`, 413);
    for (let i = 0, idx = 0; i < buf.length || idx === 0; i += CHUNK, idx++) {
      this.sql.exec('INSERT INTO chunks (id, idx, data) VALUES (?, ?, ?)', id, idx, buf.subarray(i, i + CHUNK));
    }
    this.sql.exec('INSERT INTO files (id, type, name, size) VALUES (?, ?, ?, ?)', id, type, name, buf.length);
    return json({ url: '/uploads/' + id, name, type, size: buf.length });
  }
  serveFile(id) {
    const f = /^[a-f0-9]{24}\.[a-z0-9]{1,8}$/.test(id) && this.sql.exec('SELECT type, name, size FROM files WHERE id = ?', id).toArray()[0];
    if (!f) return new Response('not found', { status: 404 });
    const parts = this.sql.exec('SELECT data FROM chunks WHERE id = ? ORDER BY idx', id).toArray().map(r => new Uint8Array(r.data));
    const inline = INLINE.test(f.type);
    return new Response(new Blob(parts), {
      headers: {
        'Content-Type': inline ? f.type : 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox",
        ...(inline ? {} : { 'Content-Disposition': 'attachment' }),
      },
    });
  }
  async gifs(url) {
    const key = this.env.GIPHY_API_KEY;
    if (!key) return [];
    const q = (url.searchParams.get('q') || '').slice(0, 100);
    const offset = Math.max(0, Math.min(4000, +url.searchParams.get('offset') || 0));
    const u = q
      ? `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=30&offset=${offset}&rating=pg-13`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=30&offset=${offset}&rating=pg-13`;
    const j = await (await fetch(u)).json();
    return (j.data || []).map(g => ({ url: g.images.original.url, preview: (g.images.fixed_width || g.images.original).url, w: +g.images.original.width, h: +g.images.original.height, title: g.title || '' }));
  }

  // ---------- websockets ----------
  webSocketMessage() {}
  webSocketClose(ws) { this.dropSocket(ws); }
  webSocketError(ws) { this.dropSocket(ws); }
  dropSocket(ws) {
    const uid = this.ctx.getTags(ws)[0];
    try { ws.close(1000, 'bye'); } catch {}
    if (!uid) return;
    const still = this.ctx.getWebSockets(uid).filter(s => s !== ws && s.readyState === 1);
    if (!still.length) this.core.setOnline(uid, false);
  }
}
