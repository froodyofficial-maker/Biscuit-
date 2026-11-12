// Two ways to run Biscuit, same interface:
//  * ServerBackend: talks to server.mjs (real multi-user chat across devices).
//  * LocalBackend:  no server at all; the core runs in this browser and saves to IndexedDB.
//    Used when the page is opened from disk or a static host such as GitHub Pages.
(function () {
  'use strict';
  const { Core, LIMITS } = globalThis.BiscuitCore;
  const TOKEN_KEY = 'biscuit.token';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };

  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error('Could not read that file'));
      r.readAsDataURL(file);
    });
  }

  async function giphyDirect(q, offset) {
    const key = store.get('biscuit.giphyKey');
    if (!key) return null;
    const u = q
      ? `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&limit=30&offset=${offset || 0}&rating=pg-13`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(key)}&limit=30&offset=${offset || 0}&rating=pg-13`;
    const j = await (await fetch(u)).json();
    if (j.meta && j.meta.status >= 400) throw new Error('GIPHY rejected that key: ' + (j.meta.msg || j.meta.status));
    return (j.data || []).map(g => ({
      url: g.images.original.url, preview: (g.images.fixed_width || g.images.original).url,
      w: +g.images.original.width, h: +g.images.original.height, title: g.title || '',
    }));
  }

  // ---------------------------------------------------------------- server
  class ServerBackend {
    constructor(config) { this.mode = 'server'; this.config = config; this.token = store.get(TOKEN_KEY); this.listeners = new Set(); }
    get loggedIn() { return !!this.token; }
    async req(path, body, method) {
      const r = await fetch(path, {
        method: method || (body ? 'POST' : 'GET'),
        headers: Object.assign({ 'Content-Type': 'application/json' }, this.token ? { Authorization: 'Bearer ' + this.token } : {}),
        body: body ? JSON.stringify(body) : undefined,
      });
      let j = {};
      try { j = await r.json(); } catch {}
      if (!r.ok) {
        const e = new Error(j.error || `Request failed (${r.status})`);
        e.code = r.status;
        if (r.status === 401 && this.token && !/login|register/.test(path)) this.forget();
        throw e;
      }
      return j;
    }
    forget() { this.token = null; store.set(TOKEN_KEY, null); this.close(); }
    async register(username, password, displayName) { const j = await this.req('/api/register', { username, password, displayName }); this.token = j.token; store.set(TOKEN_KEY, j.token); }
    async login(username, password) { const j = await this.req('/api/login', { username, password }); this.token = j.token; store.set(TOKEN_KEY, j.token); }
    async logout() { try { await this.req('/api/logout', {}); } catch {} this.forget(); }
    async changePassword(current, next) { await this.req('/api/password', { current, next }); }
    state() { return this.req('/api/state'); }
    async call(method, args) { return (await this.req('/api/rpc/' + method, args || {})).data; }
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    connect() {
      this.close();
      const es = new EventSource('/api/events?token=' + encodeURIComponent(this.token));
      this.es = es;
      let opened = false;
      es.onopen = () => {
        // after a reconnect, re-sync so nothing missed while offline is lost
        if (opened) this.listeners.forEach(fn => fn({ t: 'refresh' }));
        opened = true;
        this.listeners.forEach(fn => fn({ t: 'connection', ok: true }));
      };
      es.onmessage = e => { let ev; try { ev = JSON.parse(e.data); } catch { return; } this.listeners.forEach(fn => fn(ev)); };
      es.onerror = () => this.listeners.forEach(fn => fn({ t: 'connection', ok: false }));
    }
    close() { if (this.es) { this.es.close(); this.es = null; } }
    upload(file, onProgress) {
      const max = LIMITS.uploadMB * 1024 * 1024;
      if (file.size > max) return Promise.reject(new Error(`${file.name} is over ${LIMITS.uploadMB} MB`));
      return new Promise((resolve, reject) => {
        const x = new XMLHttpRequest();
        x.open('POST', '/api/upload');
        x.setRequestHeader('Authorization', 'Bearer ' + this.token);
        x.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        x.setRequestHeader('X-Filename', encodeURIComponent(file.name || 'file'));
        x.upload.onprogress = e => onProgress && e.lengthComputable && onProgress(e.loaded / e.total);
        x.onload = () => {
          let j = {};
          try { j = JSON.parse(x.responseText); } catch {}
          x.status === 200 ? resolve(j) : reject(new Error(j.error || 'Upload failed'));
        };
        x.onerror = () => reject(new Error('Upload failed. Check your connection.'));
        x.send(file);
      });
    }
    async gifs(q, offset) {
      if (this.config.gifSearch) return (await this.req('/api/gifs?q=' + encodeURIComponent(q || '') + '&offset=' + (offset || 0))).results;
      return giphyDirect(q, offset);
    }
    get canSearchGifs() { return !!(this.config.gifSearch || store.get('biscuit.giphyKey')); }
  }

  // ---------------------------------------------------------------- local
  const DB_NAME = 'biscuit-local', DB_STORE = 'kv';
  function idb() {
    return new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) return reject(new Error('no indexedDB'));
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(DB_STORE);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async function idbGet(db, k) {
    return new Promise((resolve, reject) => { const r = db.transaction(DB_STORE).objectStore(DB_STORE).get(k); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  }
  async function idbSet(db, k, v) {
    return new Promise((resolve, reject) => { const t = db.transaction(DB_STORE, 'readwrite'); t.objectStore(DB_STORE).put(v, k); t.oncomplete = () => resolve(); t.onerror = () => reject(t.error); });
  }
  async function sha(text) {
    if (globalThis.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return 'f' + (h >>> 0).toString(16);
  }

  class LocalBackend {
    constructor() { this.mode = 'local'; this.listeners = new Set(); this.uid = null; this.tab = Math.random().toString(36).slice(2); }
    async init() {
      try { this.db = await idb(); } catch { this.db = null; }
      await this.load();
      this.uid = store.get('biscuit.localUser');
      if (this.uid && !this.core.s.users[this.uid]) this.uid = null;
      try {
        this.bc = new BroadcastChannel('biscuit-local');
        this.bc.onmessage = async e => {
          if (e.data && e.data.from !== this.tab) {
            await this.load();
            this.listeners.forEach(fn => fn({ t: 'refresh' }));
          }
        };
      } catch {}
    }
    async load() {
      let data = null;
      try { data = this.db ? await idbGet(this.db, 'data') : JSON.parse(store.get('biscuit.localData') || 'null'); } catch {}
      data = data || { core: null, credentials: {} };
      this.credentials = data.credentials || {};
      const prevOnline = this.core ? this.core.online : null;
      this.core = new Core(data.core, {
        allowDataUrls: true,
        emit: (ev, audience) => {
          if (!this.uid || (audience && !audience.includes(this.uid))) return;
          const copy = JSON.parse(JSON.stringify(ev));
          setTimeout(() => this.listeners.forEach(fn => fn(copy)), 0);
        },
        changed: () => this.save(),
      });
      if (prevOnline) this.core.online = prevOnline;
      if (!data.core) this.save();
    }
    // Write right away (coalescing changes made in the same tick) so nothing is lost on reload.
    save() {
      if (this.savePending) return;
      this.savePending = true;
      queueMicrotask(async () => {
        this.savePending = false;
        const data = { core: this.core.s, credentials: this.credentials };
        try {
          if (this.db) await idbSet(this.db, 'data', data);
          else store.set('biscuit.localData', JSON.stringify(data));
          if (this.bc) this.bc.postMessage({ from: this.tab });
        } catch (e) { console.warn('Biscuit could not save', e); }
      });
    }
    get loggedIn() { return !!this.uid; }
    async register(username, password, displayName) {
      if (!password || password.length < 6) throw new Error('Passwords need at least 6 characters');
      const u = this.core.createUser(username, displayName);
      const salt = Math.random().toString(36).slice(2);
      this.credentials[u.id] = { salt, hash: await sha(salt + password) };
      this.save();
      this.setUser(u.id);
    }
    async login(username, password) {
      const u = this.core.findUserByUsername(username);
      const c = u && this.credentials[u.id];
      if (!c || c.hash !== await sha(c.salt + String(password || ''))) throw new Error('Wrong username or password');
      this.setUser(u.id);
    }
    setUser(id) { this.uid = id; store.set('biscuit.localUser', id); }
    async logout() { if (this.uid) this.core.setOnline(this.uid, false); this.uid = null; store.set('biscuit.localUser', null); }
    async changePassword(current, next) {
      const c = this.credentials[this.uid];
      if (!c || c.hash !== await sha(c.salt + current)) throw new Error('Your current password is wrong');
      if (!next || next.length < 6) throw new Error('Passwords need at least 6 characters');
      c.hash = await sha(c.salt + next);
      this.save();
    }
    accounts() { return Object.values(this.core.s.users).filter(u => !u.bot && this.credentials[u.id]); }
    async state() { return JSON.parse(JSON.stringify(this.core.viewFor(this.uid))); }
    async call(method, args) {
      if (!globalThis.BiscuitCore.RPC.has(method)) throw new Error('Unknown action');
      return JSON.parse(JSON.stringify(this.core[method](this.uid, args || {}) ?? null));
    }
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    connect() { this.core.setOnline(this.uid, true); setTimeout(() => this.listeners.forEach(fn => fn({ t: 'connection', ok: true })), 0); }
    close() {}
    async upload(file, onProgress) {
      const max = LIMITS.localUploadMB * 1024 * 1024;
      if (file.size > max) throw new Error(`In local mode files can be up to ${LIMITS.localUploadMB} MB. Run the Biscuit server for up to ${LIMITS.uploadMB} MB.`);
      onProgress && onProgress(0.3);
      const url = await readAsDataURL(file);
      onProgress && onProgress(1);
      return { url, name: file.name || 'file', type: file.type || 'application/octet-stream', size: file.size };
    }
    gifs(q, offset) { return giphyDirect(q, offset); }
    get canSearchGifs() { return !!store.get('biscuit.giphyKey'); }
  }

  async function create() {
    if (/^https?:$/.test(location.protocol)) {
      try {
        const r = await fetch('/api/config', { cache: 'no-store' });
        if (r.ok) {
          const cfg = await r.json();
          if (cfg && cfg.mode === 'server') return new ServerBackend(cfg);
        }
      } catch {}
    }
    const b = new LocalBackend();
    await b.init();
    return b;
  }

  globalThis.BiscuitApi = { create, store };
})();
