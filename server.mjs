// Biscuit server: zero dependencies, Node 18+.
//   node server.mjs            -> http://localhost:3000
//   PORT=8080 DATA_DIR=./data GIPHY_API_KEY=... node server.mjs
// Accounts, servers and messages are kept in DATA_DIR/db.json; uploads in DATA_DIR/uploads.
// Live updates use Server-Sent Events, so it runs anywhere plain HTTP does.
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const PORT = +(process.env.PORT || process.argv[2] || 3000);
const DATA = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const UPLOADS = path.join(DATA, 'uploads');
const DB_FILE = path.join(DATA, 'db.json');
const GIPHY = process.env.GIPHY_API_KEY || '';
const TENOR = process.env.TENOR_API_KEY || '';

await import('./public/js/core.js');
const { Core, BiscuitError, RPC, LIMITS } = globalThis.BiscuitCore;

fs.mkdirSync(UPLOADS, { recursive: true });
let db = { core: null, credentials: {}, sessions: {} };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch {}

// ---------- live connections ----------
const clients = new Map(); // userId -> Set<res>
function emit(ev, audience) {
  const line = `data: ${JSON.stringify(ev)}\n\n`;
  const targets = audience ? audience.map(id => clients.get(id)).filter(Boolean) : [...clients.values()];
  for (const set of targets) for (const res of set) res.write(line);
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const tmp = DB_FILE + '.tmp';
    await fsp.writeFile(tmp, JSON.stringify({ core: core.s, credentials: db.credentials, sessions: db.sessions }));
    await fsp.rename(tmp, DB_FILE);
  }, 400);
}
const core = new Core(db.core, { emit, changed: save, allowDataUrls: false });
save();

// ---------- auth ----------
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
function newSession(uid) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[token] = { uid, at: Date.now() };
  save();
  return token;
}
function auth(req, url) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : (url && url.searchParams.get('token')) || '';
  const s = token && db.sessions[token];
  if (!s || !core.s.users[s.uid]) throw new BiscuitError('Please log in again', 401);
  return { uid: s.uid, token };
}
// Any password is allowed, as long as there is one.
function checkPassword(pw) {
  if (typeof pw !== 'string' || !pw.length) throw new BiscuitError('Type a password');
  if (pw.length > 1000) throw new BiscuitError('That password is too long');
}

// ---------- http helpers ----------
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.zip': 'application/zip', '.webmanifest': 'application/manifest+json',
};
const INLINE = /^(image\/(png|jpeg|gif|webp|avif)|video\/(mp4|webm|quicktime)|audio\/(mpeg|ogg|wav))$/;
const EXT_FOR = Object.fromEntries(Object.entries(TYPES).map(([e, t]) => [t.split(';')[0], e]));

function send(res, code, body, headers) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(code, Object.assign({
    'Content-Type': typeof body === 'string' || Buffer.isBuffer(body) ? 'text/plain; charset=utf-8' : 'application/json',
    'Cache-Control': 'no-store',
  }, headers));
  res.end(data);
}
function readJSON(req, limit = 1 << 20) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new BiscuitError('Request too large', 413)); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(new BiscuitError('Bad JSON')); } });
    req.on('error', reject);
  });
}
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
};

async function serveFile(res, file, extra) {
  const st = await fsp.stat(file);
  if (!st.isFile()) throw new Error('not a file');
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, Object.assign({ 'Content-Type': type, 'Content-Length': st.size }, SECURITY, extra));
  fs.createReadStream(file).pipe(res);
}

async function handleUpload(req, res) {
  auth(req);
  const type = String(req.headers['content-type'] || 'application/octet-stream').split(';')[0].trim().toLowerCase();
  let name = decodeURIComponent(String(req.headers['x-filename'] || 'file')).replace(/[^\w.\- ()]/g, '_').slice(0, 120) || 'file';
  let ext = (path.extname(name) || EXT_FOR[type] || '.bin').toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 10) || '.bin';
  const id = crypto.randomBytes(12).toString('hex') + ext;
  const file = path.join(UPLOADS, id);
  const max = LIMITS.uploadMB * 1024 * 1024;
  if (+req.headers['content-length'] > max) throw new BiscuitError(`Files can be up to ${LIMITS.uploadMB} MB`, 413);
  let size = 0;
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(file);
    req.on('data', c => {
      size += c.length;
      if (size > max) { out.destroy(); req.destroy(); fs.rm(file, () => {}); reject(new BiscuitError(`Files can be up to ${LIMITS.uploadMB} MB`, 413)); }
    });
    req.pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
    req.on('error', reject);
  });
  send(res, 200, { url: '/uploads/' + id, name, type, size });
}

async function gifSearch(url) {
  const q = (url.searchParams.get('q') || '').slice(0, 100);
  const offset = Math.max(0, Math.min(4000, +url.searchParams.get('offset') || 0));
  if (GIPHY) {
    const u = q
      ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY}&q=${encodeURIComponent(q)}&limit=30&offset=${offset}&rating=pg-13`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY}&limit=30&offset=${offset}&rating=pg-13`;
    const j = await (await fetch(u)).json();
    return (j.data || []).map(g => ({
      url: g.images.original.url, preview: (g.images.fixed_width || g.images.original).url,
      w: +g.images.original.width, h: +g.images.original.height, title: g.title || '',
    }));
  }
  if (TENOR) {
    const u = `https://tenor.googleapis.com/v2/${q ? 'search' : 'featured'}?key=${TENOR}&client_key=biscuit&limit=30&media_filter=gif,tinygif${q ? '&q=' + encodeURIComponent(q) : ''}`;
    const j = await (await fetch(u)).json();
    return (j.results || []).map(g => ({
      url: g.media_formats.gif.url, preview: (g.media_formats.tinygif || g.media_formats.gif).url,
      w: g.media_formats.gif.dims[0], h: g.media_formats.gif.dims[1], title: g.content_description || '',
    }));
  }
  return [];
}

// ---------- routes ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  try {
    if (p === '/api/config') return send(res, 200, { mode: 'server', gifSearch: !!(GIPHY || TENOR), limits: LIMITS });

    if (p === '/api/register' && req.method === 'POST') {
      const b = await readJSON(req);
      checkPassword(b.password);
      const u = core.createUser(b.username, b.displayName);
      const salt = crypto.randomBytes(16).toString('hex');
      db.credentials[u.id] = { salt, hash: hash(b.password, salt) };
      return send(res, 200, { token: newSession(u.id) });
    }
    if (p === '/api/login' && req.method === 'POST') {
      const b = await readJSON(req);
      const u = core.findUserByUsername(b.username);
      const c = u && db.credentials[u.id];
      const ok = c && crypto.timingSafeEqual(Buffer.from(hash(String(b.password || ''), c.salt), 'hex'), Buffer.from(c.hash, 'hex'));
      if (!ok) throw new BiscuitError('Wrong username or password', 401);
      return send(res, 200, { token: newSession(u.id) });
    }
    if (p === '/api/logout' && req.method === 'POST') {
      const { token } = auth(req);
      delete db.sessions[token];
      save();
      return send(res, 200, { ok: true });
    }
    if (p === '/api/password' && req.method === 'POST') {
      const { uid } = auth(req);
      const b = await readJSON(req);
      const c = db.credentials[uid];
      if (!c || hash(String(b.current || ''), c.salt) !== c.hash) throw new BiscuitError('Your current password is wrong', 403);
      checkPassword(b.next);
      const salt = crypto.randomBytes(16).toString('hex');
      db.credentials[uid] = { salt, hash: hash(b.next, salt) };
      save();
      return send(res, 200, { ok: true });
    }
    if (p === '/api/state') {
      const { uid } = auth(req);
      return send(res, 200, core.viewFor(uid));
    }
    if (p === '/api/events') {
      const { uid } = auth(req, url);
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 2000\n\n');
      if (!clients.has(uid)) clients.set(uid, new Set());
      clients.get(uid).add(res);
      core.setOnline(uid, true);
      const ping = setInterval(() => res.write(': ping\n\n'), 25000);
      req.on('close', () => {
        clearInterval(ping);
        const set = clients.get(uid);
        set.delete(res);
        if (!set.size) {
          clients.delete(uid);
          setTimeout(() => { if (!clients.has(uid)) core.setOnline(uid, false); }, 4000);
        }
      });
      return;
    }
    if (p.startsWith('/api/rpc/') && req.method === 'POST') {
      const method = p.slice(9);
      if (!RPC.has(method)) throw new BiscuitError('Unknown action', 404);
      const { uid } = auth(req);
      const args = await readJSON(req);
      return send(res, 200, { data: core[method](uid, args) });
    }
    if (p === '/api/upload' && req.method === 'POST') return await handleUpload(req, res);
    if (p === '/api/gifs') { auth(req); return send(res, 200, { results: await gifSearch(url) }); }
    if (p.startsWith('/api/')) throw new BiscuitError('Not found', 404);

    if (p.startsWith('/uploads/')) {
      const name = p.slice(9);
      if (!/^[a-f0-9]{24}\.[a-z0-9]{1,10}$/.test(name)) return send(res, 404, 'not found');
      const type = TYPES['.' + name.split('.').pop()] || 'application/octet-stream';
      const inline = INLINE.test(type.split(';')[0]);
      return await serveFile(res, path.join(UPLOADS, name), {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox",
        ...(inline ? {} : { 'Content-Disposition': 'attachment', 'Content-Type': 'application/octet-stream' }),
      });
    }

    // static files, falling back to the app shell
    let rel = decodeURIComponent(p);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.normalize(path.join(PUBLIC, rel));
    if (!file.startsWith(PUBLIC)) return send(res, 404, 'not found');
    try { await serveFile(res, file, { 'Cache-Control': 'no-cache' }); }
    catch { await serveFile(res, path.join(PUBLIC, 'index.html'), { 'Cache-Control': 'no-cache' }); }
  } catch (e) {
    if (res.headersSent) { res.end(); return; }
    const code = e instanceof BiscuitError ? e.code : 500;
    if (code === 500) console.error(e);
    send(res, code, { error: code === 500 ? 'Something went wrong on the server' : e.message });
  }
});

server.listen(PORT, () => console.log(`🍪 Biscuit is running at http://localhost:${PORT}`));
