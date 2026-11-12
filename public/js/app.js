// Biscuit UI. Plain DOM, no framework: render functions write HTML strings, one delegated click handler
// routes every [data-act] element to ACT[name].
(function () {
  'use strict';
  const { LIMITS, DECORATIONS, EFFECTS, FONTS } = globalThis.BiscuitCore;
  const EM = globalThis.BiscuitEmoji, MD = globalThis.BiscuitMarkdown, GIF = globalThis.BiscuitGif, store = globalThis.BiscuitApi.store;
  const esc = MD.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  // ------------------------------------------------------------------ icons
  const P = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    reply: '<path d="M9 17 4 12l5-5M20 18v-2a4 4 0 0 0-4-4H4"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>',
    menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
    crown: '<path d="M2 18h20L19 7l-5 5-2-7-2 7-5-5z"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    wand: '<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  };
  const ic = (n, cls) => `<svg class="i ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  // ------------------------------------------------------------------ state
  const S = {
    b: null, me: null, users: {}, servers: {}, channels: {}, messages: {}, hasMore: {}, emojis: {},
    botId: '', hqId: '', route: { sid: '@me', cid: null, page: 'friends' }, typing: {}, pending: [], replyTo: null,
    editing: null, lastRead: {}, connected: true, drafts: {}, stick: true, friendsTab: 'online', gifTab: null,
  };
  const prefs = Object.assign({
    theme: 'dark', compact: false, fontScale: 100, notify: false, sound: true, reduceMotion: false,
    lastChannel: {}, recentEmoji: ['👍', '😂', '❤️', '🔥', '🍪', '🎉', '👀', '😭'], serverOrder: [],
  }, (() => { try { return JSON.parse(store.get('biscuit.prefs') || '{}'); } catch { return {}; } })());
  const savePrefs = () => store.set('biscuit.prefs', JSON.stringify(prefs));

  // ------------------------------------------------------------------ helpers
  function hashColor(s) {
    let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
    return ['#e8a33d', '#5865f2', '#3ba55d', '#eb459e', '#ed4245', '#1abc9c', '#9b59b6', '#f47b67'][Math.abs(h) % 8];
  }
  const avCache = new Map();
  function defaultAvatar(u) {
    const key = u.id + (u.accent || '') + (u.displayName || '');
    if (avCache.has(key)) return avCache.get(key);
    const c = u.accent || hashColor(u.id);
    const letter = u.bot ? '🍪' : ([...(u.displayName || u.username || '?')][0] || '?').toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='${c}'/><text x='40' y='${u.bot ? 54 : 53}' font-family='Segoe UI,Arial,sans-serif' font-size='${u.bot ? 40 : 36}' font-weight='700' fill='white' text-anchor='middle'>${esc(letter)}</text></svg>`;
    const url = 'data:image/svg+xml,' + encodeURIComponent(svg);
    avCache.set(key, url);
    return url;
  }
  const avatarUrl = u => (u && u.avatar) || defaultAvatar(u || { id: '?', displayName: '?' });
  const user = id => S.users[id] || { id, username: 'unknown', displayName: 'Unknown user', presence: 'offline', status: 'offline', customStatus: {}, decoration: 'none', theme: ['', ''] };
  const dname = u => (u && (u.displayName || u.username)) || 'Unknown';
  function nameStyle(u) {
    if (u.nameColor && u.nameColor2) return `background-image:linear-gradient(90deg,${u.nameColor},${u.nameColor2});-webkit-background-clip:text;background-clip:text;color:transparent`;
    if (u.nameColor) return `color:${u.nameColor}`;
    return '';
  }
  const nameHTML = (u, extra) => `<span class="uname font-${esc(u.nameFont || 'default')} ${extra || ''}" style="${nameStyle(u)}" data-act="profile" data-uid="${esc(u.id)}">${esc(dname(u))}</span>`;
  function avatarHTML(u, size, opts) {
    opts = opts || {};
    const st = opts.status === false ? '' : `<i class="st st-${esc(opts.presence || u.presence || 'offline')}"></i>`;
    const deco = opts.deco === false || !u.decoration || u.decoration === 'none' ? '' : ` deco deco-${esc(u.decoration)}`;
    return `<div class="av s${size}${deco}" ${opts.noact ? '' : `data-act="profile" data-uid="${esc(u.id)}"`}><img src="${esc(avatarUrl(u))}" alt="" draggable="false" loading="lazy">${st}</div>`;
  }
  const statusLabel = s => ({ online: 'Online', idle: 'Idle', dnd: 'Do Not Disturb', invisible: 'Invisible', offline: 'Offline' }[s] || 'Offline');
  function customStatusHTML(u) {
    const cs = u.customStatus || {};
    if (!cs.emoji && !cs.text) return '';
    return `<span class="cstatus">${cs.emoji ? `<span class="cs-emoji">${renderEmojiToken(cs.emoji)}</span>` : ''}${esc(cs.text || '')}</span>`;
  }
  function renderEmojiToken(tok) {
    const m = /^<a?:([A-Za-z0-9_]+):([A-Za-z0-9-]+)>$/.exec(tok || '');
    if (m) { const e = S.emojis[m[2]]; return e ? `<img class="cemoji" src="${esc(e.url)}" alt=":${esc(m[1])}:">` : ''; }
    return esc(tok || '');
  }
  const mdCtx = () => ({ user: id => S.users[id], emoji: id => S.emojis[id], meId: S.me && S.me.id });
  const md = s => MD.render(s, mdCtx());
  const plain = s => String(s || '').replace(/<@([A-Za-z0-9-]+)>/g, (_, id) => '@' + dname(S.users[id])).replace(/<a?:([A-Za-z0-9_]+):[A-Za-z0-9-]+>/g, ':$1:').replace(/[*_~`|>#]/g, '');
  function fmtTime(t) { return new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  function fmtStamp(t) {
    const d = new Date(t), now = new Date();
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return 'Today at ' + fmtTime(t);
    if (d.toDateString() === y.toDateString()) return 'Yesterday at ' + fmtTime(t);
    return d.toLocaleDateString() + ' ' + fmtTime(t);
  }
  const fmtDay = t => new Date(t).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fmtSize = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
  const myServers = () => {
    const ids = Object.keys(S.servers);
    const order = prefs.serverOrder.filter(id => S.servers[id]);
    ids.forEach(id => { if (!order.includes(id)) order.push(id); });
    if (order.includes(S.hqId)) { order.splice(order.indexOf(S.hqId), 1); order.unshift(S.hqId); }
    return order.map(id => S.servers[id]);
  };
  const dmOther = ch => user(ch.members.find(m => m !== S.me.id) || S.me.id);
  const chName = ch => ch.type === 'dm' ? dname(dmOther(ch)) : ch.name;
  const myDMs = () => Object.values(S.channels).filter(c => c.type === 'dm').sort((a, b) => (b.lastMessageId || b.createdAt) > (a.lastMessageId || a.createdAt) ? 1 : -1);
  const isOwner = sv => sv && S.me && sv.ownerId === S.me.id;

  function toast(msg, kind) {
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    $('#toasts').append(el);
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3700);
  }
  async function call(method, args, quiet) {
    try { return await S.b.call(method, args); }
    catch (e) { if (!quiet) toast(e.message || 'Something went wrong', 'err'); throw e; }
  }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('Copied!', 'ok'), () => {
      const t = document.createElement('textarea'); t.value = text; document.body.append(t); t.select();
      try { document.execCommand('copy'); toast('Copied!', 'ok'); } catch { toast('Copy failed'); }
      t.remove();
    });
  }
  function pickFile(accept, multiple) {
    return new Promise(resolve => {
      const i = document.createElement('input');
      i.type = 'file'; i.accept = accept || ''; i.multiple = !!multiple;
      i.onchange = () => resolve([...i.files]);
      i.click();
    });
  }
  function imageSize(file) {
    return new Promise(resolve => {
      if (!/^image\//.test(file.type)) return resolve({ w: 0, h: 0 });
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(url); };
      img.src = url;
    });
  }
  async function uploadImage(accept) {
    const [file] = await pickFile(accept || 'image/*');
    if (!file) return null;
    if (!/^image\//.test(file.type)) { toast('Pick an image file', 'err'); return null; }
    toast('Uploading…');
    try { return await S.b.upload(file); } catch (e) { toast(e.message, 'err'); return null; }
  }
  const inviteLink = code => location.origin + location.pathname + '#/invite/' + code;

  // ------------------------------------------------------------------ popovers & modals
  const pops = [];
  function popover(anchor, html, o) {
    o = o || {};
    if (!o.keep) closePopovers();
    const el = document.createElement('div');
    el.className = 'popover ' + (o.cls || '');
    el.innerHTML = html;
    $('#layer').append(el);
    el._anchor = anchor;
    el._onClose = o.onClose;
    pops.push(el);
    placePop(el, anchor, o.place || 'top');
    if (o.onMount) o.onMount(el);
    return el;
  }
  function placePop(el, anchor, place) {
    const vw = innerWidth, vh = innerHeight;
    if (vw < 640 && el.classList.contains('sheetable')) { el.classList.add('sheet'); return; }
    const r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: vw / 2, right: vw / 2, top: vh / 2, bottom: vh / 2, width: 0, height: 0 };
    const w = el.offsetWidth, h = el.offsetHeight, m = 8;
    let x, y;
    if (place === 'right') { x = r.right + m; y = r.top; }
    else if (place === 'left') { x = r.left - w - m; y = r.top; }
    else if (place === 'bottom') { x = r.left; y = r.bottom + m; }
    else { x = r.right - w; y = r.top - h - m; }
    if (place === 'top' && y < m) y = r.bottom + m;
    if (place === 'right' && x + w > vw - m) x = r.left - w - m;
    x = Math.max(m, Math.min(x, vw - w - m));
    y = Math.max(m, Math.min(y, vh - h - m));
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }
  function closePop(el) {
    const i = pops.indexOf(el);
    if (i >= 0) pops.splice(i, 1);
    if (el._onClose) el._onClose();
    el.remove();
  }
  function closePopovers() { while (pops.length) closePop(pops[pops.length - 1]); }
  document.addEventListener('mousedown', e => {
    const top = pops[pops.length - 1];
    if (top && !top.contains(e.target) && !(top._anchor && top._anchor.contains && top._anchor.contains(e.target))) closePop(top);
  });

  const modals = [];
  function modal(html, o) {
    o = o || {};
    const back = document.createElement('div');
    back.className = 'modal-back ' + (o.backCls || '');
    back.innerHTML = `<div class="modal ${o.cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
    $('#layer').append(back);
    const m = { el: back.firstElementChild, back, close: () => { const i = modals.indexOf(m); if (i >= 0) modals.splice(i, 1); back.classList.add('out'); setTimeout(() => back.remove(), 150); if (o.onClose) o.onClose(); } };
    back.addEventListener('mousedown', e => { if (e.target === back) m.close(); });
    modals.push(m);
    if (o.onMount) o.onMount(m.el, m);
    const f = m.el.querySelector('[autofocus]');
    if (f) setTimeout(() => f.focus(), 30);
    return m;
  }
  const topModal = () => modals[modals.length - 1];
  function confirmBox(title, body, ok, danger) {
    return new Promise(resolve => {
      let done = false;
      const m = modal(`<div class="m-head"><h2>${esc(title)}</h2></div><div class="m-body"><p>${body}</p></div>
        <div class="m-foot"><button class="btn ghost" data-close>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok autofocus>${esc(ok || 'OK')}</button></div>`,
        { cls: 'small', onClose: () => { if (!done) resolve(false); } });
      m.el.querySelector('[data-close]').onclick = () => m.close();
      m.el.querySelector('[data-ok]').onclick = () => { done = true; resolve(true); m.close(); };
    });
  }
  function prompt2(title, label, value, okLabel, extra) {
    return new Promise(resolve => {
      let done = false;
      const m = modal(`<div class="m-head"><h2>${esc(title)}</h2></div><form class="m-body"><label class="field"><span>${esc(label)}</span><input name="v" value="${esc(value || '')}" autofocus maxlength="100"></label>${extra || ''}</form>
        <div class="m-foot"><button class="btn ghost" data-close>Cancel</button><button class="btn primary" data-ok>${esc(okLabel || 'Save')}</button></div>`,
        { cls: 'small', onClose: () => { if (!done) resolve(null); } });
      const finish = () => { done = true; resolve(m.el.querySelector('input').value); m.close(); };
      m.el.querySelector('form').onsubmit = e => { e.preventDefault(); finish(); };
      m.el.querySelector('[data-ok]').onclick = finish;
      m.el.querySelector('[data-close]').onclick = () => m.close();
    });
  }

  // ------------------------------------------------------------------ boot / auth
  async function boot() {
    applyPrefs();
    try { S.b = await globalThis.BiscuitApi.create(); }
    catch (e) { $('#boot .boot-text').textContent = 'Biscuit could not start: ' + e.message; return; }
    S.b.on(onEvent);
    const m = /^#\/invite\/([^/]+)/.exec(location.hash);
    if (m) store.set('biscuit.pendingInvite', m[1]);
    if (S.b.loggedIn) await enter();
    else showAuth('login');
    $('#boot').classList.add('gone');
    setTimeout(() => $('#boot').remove(), 400);
  }

  let authMode = 'login';
  function showAuth(mode) {
    authMode = mode || 'login';
    $('#shell').hidden = true;
    $('#auth').hidden = false;
    const reg = authMode === 'register';
    $('#auth-title').textContent = reg ? 'Create an account' : 'Welcome back!';
    $('#auth-sub').textContent = reg ? 'Pick a username. Everything else is free. 🍪' : "We're so excited to see you again!";
    $('#f-display').hidden = !reg;
    $('#auth-submit').textContent = reg ? 'Continue' : 'Log In';
    $('#auth-switch-text').textContent = reg ? 'Already have an account?' : 'Need an account?';
    $('#auth-switch').textContent = reg ? 'Log In' : 'Register';
    $('#auth-form [name=password]').autocomplete = reg ? 'new-password' : 'current-password';
    $('#auth-error').hidden = true;
    const local = $('#auth-local');
    if (S.b.mode === 'local') {
      const accts = S.b.accounts();
      local.hidden = false;
      local.innerHTML = `<div class="local-note"><b>Browser mode.</b> Your account and chats are saved in this browser, so it works instantly with nothing to install. To chat with friends on other devices, run Biscuit on a server (see the README).</div>` +
        (accts.length && !reg ? `<div class="acct-list">${accts.map(u => `<button class="acct" data-act="auth-pick" data-name="${esc(u.username)}">${avatarHTML(Object.assign({}, u, { presence: 'offline' }), 32, { status: false, noact: true })}<span>${esc(dname(u))}<small>@${esc(u.username)}</small></span></button>`).join('')}</div>` : '');
    } else local.hidden = true;
    setTimeout(() => $(reg ? '#auth-form [name=displayName]' : '#auth-form [name=username]').focus(), 50);
  }
  $('#auth-switch').addEventListener('click', e => { e.preventDefault(); showAuth(authMode === 'login' ? 'register' : 'login'); });
  $('#auth-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, btn = $('#auth-submit');
    btn.disabled = true;
    try {
      if (authMode === 'register') await S.b.register(f.username.value, f.password.value, f.displayName.value);
      else await S.b.login(f.username.value, f.password.value);
      f.reset();
      await enter();
    } catch (err) {
      $('#auth-error').textContent = err.message;
      $('#auth-error').hidden = false;
    } finally { btn.disabled = false; }
  });

  async function enter() {
    let st;
    try { st = await S.b.state(); }
    catch (e) { if (e.code === 401) S.b.forget && S.b.forget(); return showAuth('login'); }
    load(st);
    S.b.connect();
    $('#auth').hidden = true;
    $('#shell').hidden = false;
    const inv = store.get('biscuit.pendingInvite');
    if (inv) { store.set('biscuit.pendingInvite', null); await joinInvite(inv); return; }
    applyRoute();
  }

  function load(st) {
    S.me = st.me;
    S.users = st.users;
    S.users[S.me.id] = S.me;
    S.servers = {}; st.servers.forEach(s => { S.servers[s.id] = s; });
    S.channels = {}; st.channels.forEach(c => { S.channels[c.id] = c; });
    S.messages = st.messages; S.hasMore = st.hasMore;
    S.emojis = {}; st.emojis.forEach(e => { S.emojis[e.id] = e; });
    S.botId = st.botId; S.hqId = st.hqId;
    const raw = store.get('biscuit.read.' + S.me.id);
    S.lastRead = raw ? JSON.parse(raw) : null;
    if (!S.lastRead) { S.lastRead = {}; Object.values(S.channels).forEach(c => { S.lastRead[c.id] = c.lastMessageId || ''; }); saveRead(); }
  }
  const saveRead = () => store.set('biscuit.read.' + S.me.id, JSON.stringify(S.lastRead));

  // ------------------------------------------------------------------ routing
  function go(sid, cid) {
    const h = '#/' + sid + (cid ? '/' + cid : '');
    if (location.hash === h) applyRoute(); else location.hash = h;
  }
  window.addEventListener('hashchange', () => { if (S.me) applyRoute(); });
  function applyRoute() {
    const [a, b] = location.hash.replace(/^#\/?/, '').split('/');
    if (a === 'invite' && b) { joinInvite(b); return; }
    const prevCid = S.route.cid;
    if (a && a !== '@me' && S.servers[a]) {
      const sv = S.servers[a];
      let cid = b && S.channels[b] && S.channels[b].serverId === a ? b : null;
      if (!cid) {
        const last = prefs.lastChannel[a];
        cid = last && sv.channels.includes(last) ? last : sv.channels[0];
        history.replaceState(null, '', '#/' + a + '/' + cid);
      }
      prefs.lastChannel[a] = cid; savePrefs();
      S.route = { sid: a, cid, page: 'chat' };
    } else if (b === 'golden') S.route = { sid: '@me', cid: null, page: 'golden' };
    else if (b && S.channels[b] && S.channels[b].type === 'dm') S.route = { sid: '@me', cid: b, page: 'chat' };
    else {
      S.route = { sid: '@me', cid: null, page: 'friends' };
      if (a && a !== '@me') history.replaceState(null, '', '#/@me');
    }
    if (prevCid !== S.route.cid) { S.replyTo = null; S.editing = null; S.pending = []; }
    document.body.classList.remove('members-open');
    renderAll(true);
  }
  async function joinInvite(code) {
    try {
      const r = await call('joinServer', { code });
      const st = await S.b.state(); load(st);
      toast('Joined ' + (S.servers[r.serverId] ? S.servers[r.serverId].name : 'server') + '!', 'ok');
      go(r.serverId, r.channelId);
    } catch { go('@me'); }
  }

  // ------------------------------------------------------------------ unread
  const unread = ch => !!ch.lastMessageId && ch.lastMessageId > (S.lastRead[ch.id] || '') && ch.lastAuthorId !== S.me.id;
  function mentionCount(ch) {
    const lr = S.lastRead[ch.id] || '';
    const list = S.messages[ch.id] || [];
    let n = 0;
    for (let i = list.length - 1; i >= 0 && list[i].id > lr; i--) {
      const m = list[i];
      if (m.authorId !== S.me.id && (ch.type === 'dm' || (m.mentions || []).includes(S.me.id))) n++;
    }
    return n;
  }
  function markRead(cid) {
    const ch = S.channels[cid];
    if (!ch || (S.lastRead[cid] || '') >= (ch.lastMessageId || '')) return;
    S.lastRead[cid] = ch.lastMessageId;
    saveRead();
    renderRail(); renderSidebar(); updateTitle();
  }
  function updateTitle() {
    let n = 0;
    for (const ch of Object.values(S.channels)) n += mentionCount(ch);
    document.title = (n ? `(${n}) ` : '') + 'Biscuit';
  }

  // ------------------------------------------------------------------ render: rail
  function renderAll(viewChanged) {
    renderRail(); renderSidebar(); renderUserPanel(); renderHead(); renderView(viewChanged); renderMembers(); updateTitle();
  }
  function serverIcon(sv, size) {
    if (sv.icon) return `<img src="${esc(sv.icon)}" alt="" draggable="false">`;
    const initials = sv.name.split(/\s+/).map(w => [...w][0] || '').join('').slice(0, 3);
    return `<span class="sv-initials" style="font-size:${initials.length > 2 ? 12 : 16}px">${esc(initials)}</span>`;
  }
  function renderRail() {
    if (!S.me) return;
    let dmBadges = '';
    for (const ch of myDMs()) {
      const n = mentionCount(ch);
      if (n && S.route.cid !== ch.id) dmBadges += `<div class="rail-item" data-act="go" data-sid="@me" data-cid="${ch.id}" title="${esc(chName(ch))}"><div class="rail-ic round">${avatarHTML(dmOther(ch), 48, { status: false, noact: true })}</div><span class="badge">${n}</span></div>`;
    }
    const servers = myServers().map(sv => {
      const active = S.route.sid === sv.id;
      const chs = sv.channels.map(id => S.channels[id]).filter(Boolean);
      const un = chs.some(unread), mentions = chs.reduce((a, c) => a + mentionCount(c), 0);
      return `<div class="rail-item ${active ? 'active' : ''} ${un ? 'unread' : ''}" data-act="go" data-sid="${sv.id}" title="${esc(sv.name)}" draggable="true" data-drag="${sv.id}">
        <span class="pill"></span><div class="rail-ic">${serverIcon(sv)}</div>${mentions ? `<span class="badge">${mentions}</span>` : ''}</div>`;
    }).join('');
    $('#rail').innerHTML = `
      <div class="rail-item home ${S.route.sid === '@me' ? 'active' : ''}" data-act="go" data-sid="@me" title="Direct Messages"><span class="pill"></span><div class="rail-ic brand">🍪</div></div>
      ${dmBadges}<div class="rail-sep"></div>${servers}
      <div class="rail-item" data-act="add-server" title="Add a server"><div class="rail-ic action">${ic('plus')}</div></div>
      <div class="rail-item" data-act="join-server" title="Join with an invite"><div class="rail-ic action">${ic('compass')}</div></div>`;
  }

  // ------------------------------------------------------------------ render: sidebar
  function renderSidebar() {
    if (!S.me) return;
    const head = $('#sidebar-head'), body = $('#sidebar-body');
    if (S.route.sid === '@me') {
      head.className = 'sidebar-head search-head';
      head.innerHTML = `<button class="fake-search" data-act="quick-dm">Find or start a conversation</button>`;
      const dms = myDMs();
      body.innerHTML = `
        <div class="nav-item ${S.route.page === 'friends' ? 'active' : ''}" data-act="go" data-sid="@me">${ic('users')}<span>Friends</span></div>
        <div class="nav-item golden ${S.route.page === 'golden' ? 'active' : ''}" data-act="go" data-sid="@me" data-cid="golden">${ic('sparkle')}<span>Golden Biscuit</span><span class="free-pill">FREE</span></div>
        <div class="sb-label"><span>Direct Messages</span><button class="icon-btn" data-act="quick-dm" title="Create DM">${ic('plus')}</button></div>
        ${dms.length ? dms.map(ch => {
          const o = dmOther(ch), n = mentionCount(ch);
          return `<div class="dm-item ${S.route.cid === ch.id ? 'active' : ''} ${unread(ch) ? 'unread' : ''}" data-act="go" data-sid="@me" data-cid="${ch.id}">
            ${avatarHTML(o, 32, { noact: true })}<div class="dm-text"><span class="dm-name">${esc(dname(o))}${o.bot ? ' <span class="tag-bot">BOT</span>' : ''}</span>${customStatusHTML(o) ? `<span class="dm-sub">${customStatusHTML(o)}</span>` : ''}</div>
            ${n ? `<span class="badge inline">${n}</span>` : ''}</div>`;
        }).join('') : `<div class="sb-empty">No conversations yet. Click <b>+</b> to message someone.</div>`}`;
      return;
    }
    const sv = S.servers[S.route.sid];
    if (!sv) return;
    const bannerStyle = sv.banner ? `background-image:url('${esc(sv.banner)}')` : sv.bannerColor ? `background:${sv.bannerColor}` : '';
    head.className = 'sidebar-head server-head' + (bannerStyle ? ' has-banner' : '');
    head.innerHTML = `${bannerStyle ? `<div class="sv-banner" style="${bannerStyle}"></div>` : ''}<button class="sv-name" data-act="server-menu"><span>${esc(sv.name)}</span>${ic('chevron')}</button>`;
    const own = isOwner(sv);
    body.innerHTML = `
      <div class="sb-label"><span>Text Channels</span>${own ? `<button class="icon-btn" data-act="new-channel" title="Create channel">${ic('plus')}</button>` : ''}</div>
      ${sv.channels.map(id => S.channels[id]).filter(Boolean).map(ch => {
        const n = mentionCount(ch);
        return `<div class="ch-item ${S.route.cid === ch.id ? 'active' : ''} ${unread(ch) ? 'unread' : ''}" data-act="go" data-sid="${sv.id}" data-cid="${ch.id}">
          ${ic('hash', 'ch-hash')}<span class="ch-name">${esc(ch.name)}</span>${n ? `<span class="badge inline">${n}</span>` : ''}
          ${own ? `<button class="icon-btn ch-gear" data-act="edit-channel" data-cid="${ch.id}" title="Edit channel">${ic('gear')}</button>` : ''}</div>`;
      }).join('')}
      <button class="invite-cta" data-act="invite">${ic('users')}<span>Invite people</span></button>`;
  }

  function renderUserPanel() {
    if (!S.me) return;
    const u = S.me;
    $('#userpanel').innerHTML = `
      <button class="up-me" data-act="status-menu" title="Set status">${avatarHTML(Object.assign({}, u, { presence: u.status === 'invisible' ? 'offline' : u.status }), 32, { noact: true })}
        <span class="up-text"><span class="up-name" style="${nameStyle(u)}">${esc(dname(u))}</span><span class="up-sub">${customStatusHTML(u) || esc(statusLabel(u.status))}</span></span></button>
      <button class="icon-btn" data-act="settings" data-tab="profiles" title="Edit profile">${ic('edit')}</button>
      <button class="icon-btn" data-act="settings" title="User Settings">${ic('gear')}</button>`;
  }

  // ------------------------------------------------------------------ render: header
  function renderHead() {
    if (!S.me) return;
    const h = $('#chat-head');
    const burger = `<button class="icon-btn burger" data-act="open-drawer" title="Menu">${ic('menu')}</button>`;
    const offline = S.connected ? '' : '<span class="conn-warn">Reconnecting…</span>';
    if (S.route.page === 'friends') {
      h.innerHTML = `${burger}${ic('users', 'head-ic')}<b>Friends</b><span class="head-div"></span>
        ${['online', 'all'].map(t => `<button class="tab ${S.friendsTab === t ? 'active' : ''}" data-act="friends-tab" data-tab="${t}">${t === 'online' ? 'Online' : 'All'}</button>`).join('')}
        <button class="tab add" data-act="quick-dm">Start a chat</button>${offline}`;
      return;
    }
    if (S.route.page === 'golden') { h.innerHTML = `${burger}${ic('sparkle', 'head-ic gold')}<b>Golden Biscuit</b><span class="head-topic">Every perk, free for everyone</span>${offline}`; return; }
    const ch = S.channels[S.route.cid];
    if (!ch) { h.innerHTML = burger; return; }
    if (ch.type === 'dm') {
      const o = dmOther(ch);
      h.innerHTML = `${burger}${ic('at', 'head-ic')}${nameHTML(o, 'head-name')}<i class="st-inline st-${o.presence}"></i>${customStatusHTML(o) ? `<span class="head-div"></span><span class="head-topic">${customStatusHTML(o)}</span>` : ''}
        <div class="head-tools">${offline}<button class="icon-btn ${S.showMembers !== false ? 'on' : ''}" data-act="toggle-members" title="Show profile">${ic('users')}</button></div>`;
      return;
    }
    h.innerHTML = `${burger}${ic('hash', 'head-ic')}<b class="head-name">${esc(ch.name)}</b>${ch.topic ? `<span class="head-div"></span><span class="head-topic" title="${esc(ch.topic)}">${md(ch.topic)}</span>` : ''}
      <div class="head-tools">${offline}<button class="icon-btn" data-act="invite" title="Invite people">${ic('link')}</button><button class="icon-btn ${S.showMembers !== false ? 'on' : ''}" data-act="toggle-members" title="Member list">${ic('users')}</button></div>`;
  }

  // ------------------------------------------------------------------ render: view
  let viewKey = '';
  function renderView(force) {
    if (!S.me) return;
    const key = S.route.page + ':' + (S.route.cid || '');
    const v = $('#view');
    if (S.route.page === 'friends') { v.innerHTML = friendsHTML(); viewKey = key; return; }
    if (S.route.page === 'golden') { if (key !== viewKey || force) v.innerHTML = goldenHTML(); viewKey = key; return; }
    if (key !== viewKey || !$('#input')) {
      viewKey = key;
      const ch = S.channels[S.route.cid];
      const ph = ch.type === 'dm' ? '@' + dname(dmOther(ch)) : '#' + ch.name;
      v.innerHTML = `
        <div class="messages" id="msgs"><div id="msg-list"></div></div>
        <div class="composer-wrap">
          <div id="typing" class="typing"></div>
          <div class="composer-box">
            <div id="reply-bar"></div>
            <div id="tray" class="tray"></div>
            <div class="composer">
              <button type="button" class="cbtn plus" data-act="attach-menu" title="Upload a file, take a screenshot or make a GIF">${ic('plus')}</button>
              <textarea id="input" rows="1" placeholder="Message ${esc(ph)}" maxlength="${LIMITS.message}" aria-label="Message"></textarea>
              <button type="button" class="cbtn gif" data-act="gif-picker" title="GIFs">GIF</button>
              <button type="button" class="cbtn" data-act="emoji-picker" title="Emoji">${ic('smile')}</button>
              <button type="button" class="cbtn send" data-act="send" title="Send">${ic('send')}</button>
            </div>
          </div>
          <div id="ac" class="autocomplete" hidden></div>
          <div id="charcount" class="charcount"></div>
        </div>`;
      bindComposer();
      $('#input').value = S.drafts[S.route.cid] || '';
      autosize();
      S.stick = true;
      renderMessages({ bottom: true });
      renderTray(); renderReplyBar(); renderTyping();
      if (innerWidth > 860) setTimeout(() => $('#input') && $('#input').focus(), 0);
      return;
    }
    renderMessages();
  }

  function friendsHTML() {
    const ids = new Set();
    Object.values(S.servers).forEach(sv => sv.members.forEach(m => ids.add(m)));
    myDMs().forEach(c => c.members.forEach(m => ids.add(m)));
    ids.delete(S.me.id);
    let people = [...ids].map(user).sort((a, b) => dname(a).localeCompare(dname(b)));
    if (S.friendsTab === 'online') people = people.filter(u => u.presence !== 'offline');
    return `<div class="friends">
      <form class="add-friend" data-form="start-dm">
        <h3>Start a conversation</h3><p class="muted">Message anyone on Biscuit by their username.</p>
        <div class="add-row"><input name="username" placeholder="Enter a username, like biscuit" autocomplete="off" spellcheck="false"><button class="btn primary">Send Message</button></div>
      </form>
      <div class="sb-label big">${S.friendsTab === 'online' ? 'Online' : 'Everyone you know'} — ${people.length}</div>
      ${people.length ? people.map(u => `<div class="friend-row" data-act="profile" data-uid="${u.id}">
          ${avatarHTML(u, 40, { noact: true })}<div class="fr-text"><span class="fr-name">${esc(dname(u))}${u.bot ? ' <span class="tag-bot">BOT</span>' : ''} <small>@${esc(u.username)}</small></span><span class="fr-sub">${customStatusHTML(u) || statusLabel(u.presence)}</span></div>
          <button class="round-btn" data-act="dm" data-uid="${u.id}" title="Message">${ic('msg')}</button></div>`).join('')
        : `<div class="empty-state"><div class="empty-art">🍪</div><p>${S.friendsTab === 'online' ? 'Nobody else is online right now. Biscuit the bot is always around: say hi in Biscuit HQ!' : 'Join a server or start a DM to meet people.'}</p></div>`}
    </div>`;
  }

  function goldenHTML() {
    const perks = [
      ['🎞️', 'Animated avatars & banners', 'Upload a GIF as your avatar, banner or server icon and it plays everywhere.', 'profiles'],
      ['🎨', 'Profile themes', 'Paint your whole profile card with two colors of your choice.', 'profiles'],
      ['💫', 'Avatar decorations', 'Fire, neon, rainbow, crowns, cat ears and more around your avatar.', 'profiles'],
      ['🎆', 'Profile effects', 'Confetti, snow, stars, hearts and embers float over your profile.', 'profiles'],
      ['🖋️', 'Styled display names', 'Gradient name colors and custom fonts in chat and on your profile.', 'profiles'],
      ['😀', 'Custom emoji everywhere', 'Use any custom emoji from any of your servers in every chat.', null],
      ['💥', 'Super reactions', 'Reactions that burst across the screen. Unlimited.', null],
      ['📎', '100 MB uploads', 'Share big files, screenshots and videos. Messages up to 4,000 characters.', null],
      ['🌈', 'App themes', 'Sunset, Aurora, Ocean, Grape, Sakura and more gradient themes.', 'appearance'],
      ['🔗', 'Vanity invites', 'Pick your own invite link for servers you own.', null],
      ['🎬', 'GIF Maker', 'Turn any emoji and caption into an animated GIF in seconds.', null],
      ['🏷️', 'Golden badge', 'Every account shows the Golden Biscuit badge. Because everyone deserves it.', null],
    ];
    return `<div class="golden-page">
      <div class="golden-hero"><div class="gh-glow"></div><div class="gh-cookie">🍪</div><h1>Golden Biscuit</h1>
        <p>Everything other chat apps charge for, free for everyone, forever. No trial, no card, no catch.</p>
        <div class="gh-status">✨ Active on your account</div>
        <button class="btn gold" data-act="settings" data-tab="profiles">Customize my profile</button></div>
      <div class="perk-grid">${perks.map(p => `<div class="perk" ${p[3] ? `data-act="settings" data-tab="${p[3]}"` : ''}><div class="perk-ic">${p[0]}</div><h3>${p[1]}</h3><p>${p[2]}</p></div>`).join('')}</div>
    </div>`;
  }

  // ------------------------------------------------------------------ messages
  function channelIntro(ch) {
    if (ch.type === 'dm') {
      const o = dmOther(ch);
      return `<div class="ch-intro">${avatarHTML(o, 80)}<h1>${esc(dname(o))}</h1><p class="muted">This is the beginning of your direct message history with <b>@${esc(o.username)}</b>.${o.bot ? ' Try typing <code>!help</code>.' : ''}</p></div>`;
    }
    return `<div class="ch-intro"><div class="intro-hash">${ic('hash')}</div><h1>Welcome to #${esc(ch.name)}!</h1><p class="muted">This is the start of the #${esc(ch.name)} channel.${ch.topic ? ' ' + esc(ch.topic) : ''}</p></div>`;
  }
  function renderMessages(o) {
    o = o || {};
    const el = $('#msgs');
    if (!el) return;
    const ch = S.channels[S.route.cid];
    const list = S.messages[ch.id] || [];
    const prevH = el.scrollHeight, prevTop = el.scrollTop;
    const atBottom = S.stick;
    let html = S.hasMore[ch.id] ? `<div class="load-more"><button class="btn ghost small" data-act="load-more">Load older messages</button></div>` : channelIntro(ch);
    let prev = null;
    const lr = S.lastRead[ch.id] || '';
    let newMarked = false;
    for (const m of list) {
      const day = new Date(m.createdAt).toDateString();
      if (!prev || new Date(prev.createdAt).toDateString() !== day) html += `<div class="day-div"><span>${fmtDay(m.createdAt)}</span></div>`;
      if (!newMarked && o.newLine && m.id > lr && m.authorId !== S.me.id && prev) { html += `<div class="new-div"><span>NEW</span></div>`; newMarked = true; }
      const grouped = prev && prev.authorId === m.authorId && m.createdAt - prev.createdAt < 7 * 60000 && !m.reply && !m.system && !prev.system && new Date(prev.createdAt).toDateString() === day;
      html += messageHTML(m, grouped);
      prev = m;
    }
    // keep an in-progress edit across re-renders
    const editing = S.editing && $(`#m-${CSS.escape(S.editing)} .edit-input`);
    const draft = editing ? { v: editing.value, a: editing.selectionStart, b: editing.selectionEnd, f: document.activeElement === editing } : null;
    $('#msg-list').innerHTML = html;
    if (draft) {
      const ta = $(`#m-${CSS.escape(S.editing)} .edit-input`);
      if (ta) { ta.value = draft.v; bindEditBox(ta); if (draft.f) { ta.focus(); ta.setSelectionRange(draft.a, draft.b); } }
    }
    if (o.prepend) el.scrollTop = el.scrollHeight - prevH + prevTop;
    else if (atBottom || o.bottom) el.scrollTop = el.scrollHeight;
  }

  function messageHTML(m, grouped) {
    const u = user(m.authorId);
    const mine = m.authorId === S.me.id;
    const mentioned = (m.mentions || []).includes(S.me.id);
    if (m.system) {
      return `<div class="msg system" data-mid="${m.id}"><span class="sys-ic">→</span><div class="msg-body"><div class="msg-content">${md(m.content)} <time>${fmtStamp(m.createdAt)}</time></div></div></div>`;
    }
    let reply = '';
    if (m.reply) {
      const ru = user(m.reply.authorId);
      reply = `<div class="reply-ref" data-act="jump" data-mid="${m.reply.id}">${avatarHTML(ru, 16, { status: false, deco: false, noact: true })}<span class="rr-name" style="${nameStyle(ru)}">@${esc(dname(ru))}</span><span class="rr-text">${esc(plain(m.reply.content)) || (m.reply.hasMedia ? '<i>Click to see attachment</i>' : '')}</span></div>`;
    }
    const editing = S.editing === m.id;
    const jumbo = !m.attachments.length && !m.gif && MD.isJumbo(m.content);
    const content = editing
      ? `<div class="edit-box"><textarea class="edit-input" rows="1">${esc(toEditable(m.content))}</textarea><div class="edit-hint">escape to <a href="#" data-act="cancel-edit">cancel</a> • enter to <a href="#" data-act="save-edit">save</a></div></div>`
      : (m.content ? `<div class="msg-content ${jumbo ? 'jumbo' : ''}">${md(m.content)}${m.editedAt ? '<span class="edited" title="' + esc(fmtStamp(m.editedAt)) + '">(edited)</span>' : ''}</div>` : '');
    return `<div class="msg ${grouped ? 'grouped' : ''} ${mentioned ? 'mentioned' : ''} ${editing ? 'editing' : ''} ${S.replyTo === m.id ? 'replying' : ''}" data-mid="${m.id}" id="m-${m.id}">
      ${reply}
      <div class="msg-row">
        ${grouped ? `<time class="side-time">${fmtTime(m.createdAt)}</time>` : `<div class="msg-av">${avatarHTML(u, 40, { status: false })}</div>`}
        <div class="msg-body">
          ${grouped ? '' : `<div class="msg-head">${nameHTML(u)}${u.bot ? '<span class="tag-bot">BOT</span>' : ''}<time title="${new Date(m.createdAt).toLocaleString()}">${fmtStamp(m.createdAt)}</time></div>`}
          ${content}${attachmentsHTML(m)}${reactionsHTML(m)}
        </div>
      </div>
      <div class="msg-tools">
        <button data-act="quick-react" data-emoji="👍" title="React 👍">👍</button>
        <button data-act="quick-react" data-emoji="😂" title="React 😂">😂</button>
        <button data-act="react-picker" title="Add reaction">${ic('smile')}</button>
        <button data-act="react-picker" data-super="1" title="Super reaction" class="super-btn">${ic('sparkle')}</button>
        <button data-act="reply" title="Reply">${ic('reply')}</button>
        ${mine ? `<button data-act="edit" title="Edit">${ic('edit')}</button>` : ''}
        <button data-act="copy-msg" title="Copy text">${ic('copy')}</button>
        ${mine || isOwner(S.servers[S.route.sid]) ? `<button data-act="delete" title="Delete" class="danger">${ic('trash')}</button>` : ''}
      </div>
    </div>`;
  }

  function fitBox(w, h, mw, mh) {
    if (!w || !h) return '';
    const k = Math.min(1, mw / w, mh / h);
    return `width:${Math.round(w * k)}px;aspect-ratio:${w}/${h}`;
  }
  function gifFav(url) { return (S.me.favGifs || []).some(g => g.url === url); }
  function attachmentsHTML(m) {
    let out = '';
    const items = m.attachments || [];
    const media = items.filter(a => /^image\//.test(a.type));
    if (media.length) {
      out += `<div class="att-grid n${Math.min(media.length, 4)}">` + media.map(a => {
        const isGif = a.type === 'image/gif';
        return `<div class="att-img ${a.spoiler ? 'spoilered' : ''}" ${media.length === 1 ? `style="${fitBox(a.w, a.h, 420, 320)}"` : ''}>
          <img src="${esc(a.url)}" alt="${esc(a.name)}" loading="lazy" data-act="lightbox" data-src="${esc(a.url)}" data-name="${esc(a.name)}" ${a.w ? `width="${a.w}" height="${a.h}"` : ''}>
          ${a.spoiler ? '<button class="spoiler-cover" data-act="reveal">SPOILER</button>' : ''}
          ${isGif ? `<button class="fav-star ${gifFav(a.url) ? 'on' : ''}" data-act="fav-gif" data-url="${esc(a.url)}" data-w="${a.w}" data-h="${a.h}" title="Favorite GIF">${ic('star')}</button><span class="gif-tag">GIF</span>` : ''}
        </div>`;
      }).join('') + '</div>';
    }
    for (const a of items) {
      if (/^image\//.test(a.type)) continue;
      if (/^video\//.test(a.type)) out += `<div class="att-video ${a.spoiler ? 'spoilered' : ''}"><video src="${esc(a.url)}" controls preload="metadata" ${a.w ? `style="${fitBox(a.w, a.h, 480, 320)}"` : ''}></video>${a.spoiler ? '<button class="spoiler-cover" data-act="reveal">SPOILER</button>' : ''}</div>`;
      else if (/^audio\//.test(a.type)) out += `<div class="att-file"><div class="af-ic">🎵</div><div class="af-text"><a href="${esc(a.url)}" download="${esc(a.name)}">${esc(a.name)}</a><small>${fmtSize(a.size)}</small><audio src="${esc(a.url)}" controls preload="none"></audio></div></div>`;
      else out += `<div class="att-file"><div class="af-ic">${ic('file')}</div><div class="af-text"><a href="${esc(a.url)}" download="${esc(a.name)}" target="_blank" rel="noopener">${esc(a.name)}</a><small>${fmtSize(a.size)}</small></div><a class="icon-btn" href="${esc(a.url)}" download="${esc(a.name)}" title="Download">${ic('download')}</a></div>`;
    }
    if (m.gif && m.gif.url) {
      out += `<div class="att-img gif-embed" style="${fitBox(m.gif.w, m.gif.h, 360, 300)}"><img src="${esc(m.gif.url)}" alt="${esc(m.gif.title || 'GIF')}" loading="lazy" data-act="lightbox" data-src="${esc(m.gif.url)}" data-name="${esc(m.gif.title || 'GIF')}.gif" ${m.gif.w ? `width="${m.gif.w}" height="${m.gif.h}"` : ''}>
        <button class="fav-star ${gifFav(m.gif.url) ? 'on' : ''}" data-act="fav-gif" data-url="${esc(m.gif.url)}" data-w="${m.gif.w}" data-h="${m.gif.h}" title="Favorite GIF">${ic('star')}</button><span class="gif-tag">GIF</span></div>`;
    }
    for (const url of MD.mediaLinks(m.content)) {
      out += `<div class="att-img link-embed"><img src="${esc(url)}" alt="" loading="lazy" data-act="lightbox" data-src="${esc(url)}" referrerpolicy="no-referrer">
        ${/\.gif|giphy|tenor/i.test(url) ? `<button class="fav-star ${gifFav(url) ? 'on' : ''}" data-act="fav-gif" data-url="${esc(url)}" data-w="0" data-h="0" title="Favorite GIF">${ic('star')}</button>` : ''}</div>`;
    }
    return out;
  }
  function reactionEmoji(r) {
    if (r.key.startsWith('c:')) {
      const e = S.emojis[r.key.slice(2)];
      const url = e ? e.url : r.url;
      return url ? `<img class="cemoji" src="${esc(url)}" alt=":${esc(r.name)}:">` : `:${esc(r.name)}:`;
    }
    return esc(r.key);
  }
  function reactionsHTML(m) {
    if (!m.reactions || !m.reactions.length) return '';
    return `<div class="reactions">${m.reactions.map(r => {
      const mine = r.users.includes(S.me.id);
      const who = r.users.slice(0, 8).map(id => dname(user(id))).join(', ') + (r.users.length > 8 ? ` and ${r.users.length - 8} more` : '');
      return `<button class="react ${r.super ? 'super' : ''} ${mine ? 'mine' : ''}" data-act="toggle-react" data-key="${esc(r.key)}" data-super="${r.super ? 1 : ''}" title="${esc(who)}${r.super ? ' (super reaction)' : ''}">${reactionEmoji(r)}<b>${r.users.length}</b></button>`;
    }).join('')}<button class="react add" data-act="react-picker" title="Add reaction">${ic('smile')}${ic('plus', 'tiny')}</button></div>`;
  }

  function addMessage(m) {
    const list = S.messages[m.channelId] || (S.messages[m.channelId] = []);
    if (list.some(x => x.id === m.id)) return false;
    let i = list.length;
    while (i > 0 && list[i - 1].id > m.id) i--;
    list.splice(i, 0, m);
    const ch = S.channels[m.channelId];
    if (ch && (!ch.lastMessageId || m.id >= ch.lastMessageId)) { ch.lastMessageId = m.id; ch.lastAuthorId = m.authorId; }
    return true;
  }
  const findMsg = (cid, id) => (S.messages[cid] || []).find(m => m.id === id);
  const visibleChannel = cid => S.route.cid === cid && document.visibilityState === 'visible';

  // ------------------------------------------------------------------ live events
  let refreshTimer = null;
  function onEvent(ev) {
    if (!S.me && ev.t !== 'connection') return;
    switch (ev.t) {
      case 'connection': S.connected = ev.ok; if (S.me) renderHead(); break;
      case 'refresh':
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(async () => {
          try { const st = await S.b.state(); load(st); applyRouteSoft(); } catch {}
        }, 150);
        break;
      case 'user': {
        const u = ev.user;
        if (u.id === S.me.id) S.me = u;
        S.users[u.id] = u;
        renderRail(); renderSidebar(); renderUserPanel(); renderHead(); renderMembers();
        if (S.route.page === 'friends') renderView(); else if (S.route.page === 'chat') renderMessages();
        break;
      }
      case 'server':
        S.servers[ev.server.id] = ev.server;
        (ev.users || []).forEach(u => { S.users[u.id] = u; });
        renderRail(); renderSidebar(); renderMembers(); renderHead();
        break;
      case 'server-remove':
        for (const c of Object.values(S.channels)) if (c.serverId === ev.id) delete S.channels[c.id];
        delete S.servers[ev.id];
        if (S.route.sid === ev.id) go('@me'); else { renderRail(); }
        break;
      case 'channel': {
        const old = S.channels[ev.channel.id];
        S.channels[ev.channel.id] = Object.assign({}, ev.channel, old ? { lastMessageId: old.lastMessageId > ev.channel.lastMessageId ? old.lastMessageId : ev.channel.lastMessageId } : {});
        (ev.users || []).forEach(u => { S.users[u.id] = u; });
        if (!S.messages[ev.channel.id]) S.messages[ev.channel.id] = [];
        renderSidebar(); if (S.route.cid === ev.channel.id) renderHead();
        break;
      }
      case 'channel-remove':
        delete S.channels[ev.id];
        if (S.route.cid === ev.id) go(ev.serverId); else renderSidebar();
        break;
      case 'emoji': S.emojis[ev.emoji.id] = ev.emoji; if (S.route.page === 'chat') renderMessages(); break;
      case 'emoji-remove': delete S.emojis[ev.id]; if (S.route.page === 'chat') renderMessages(); break;
      case 'message': {
        const m = ev.message;
        if (!S.channels[m.channelId]) return;
        if (!addMessage(m)) return;
        if (S.typing[m.channelId]) delete S.typing[m.channelId][m.authorId];
        if (S.route.cid === m.channelId) {
          if (m.authorId === S.me.id) S.stick = true;
          renderMessages(); renderTyping();
          if (visibleChannel(m.channelId) && S.stick) markRead(m.channelId);
        }
        if (m.authorId !== S.me.id) {
          const ch = S.channels[m.channelId];
          const important = ch.type === 'dm' || (m.mentions || []).includes(S.me.id);
          if (important && !(visibleChannel(m.channelId) && S.stick)) { notify(m); ding(); }
        }
        renderRail(); renderSidebar(); updateTitle();
        break;
      }
      case 'message-update': {
        const list = S.messages[ev.message.channelId] || [];
        const i = list.findIndex(x => x.id === ev.message.id);
        if (i < 0) return;
        list[i] = ev.message;
        if (S.route.cid === ev.message.channelId) {
          renderMessages();
          if (ev.reacted && ev.reacted.super) {
            const btn = $(`#m-${CSS.escape(ev.message.id)} .react.super[data-key="${CSS.escape(ev.reacted.key)}"]`);
            if (btn) burst(btn, reactionEmoji({ key: ev.reacted.key, name: '', url: (ev.message.reactions.find(r => r.key === ev.reacted.key) || {}).url }));
          }
        }
        break;
      }
      case 'message-remove': {
        const list = S.messages[ev.channelId];
        if (list) { const i = list.findIndex(x => x.id === ev.id); if (i >= 0) list.splice(i, 1); }
        const ch = S.channels[ev.channelId];
        if (ch && ch.lastMessageId === ev.id) { const last = list && list[list.length - 1]; ch.lastMessageId = last ? last.id : ''; ch.lastAuthorId = last ? last.authorId : ''; }
        if (S.route.cid === ev.channelId) renderMessages();
        renderRail(); renderSidebar(); updateTitle();
        break;
      }
      case 'typing':
        (S.typing[ev.channelId] = S.typing[ev.channelId] || {})[ev.userId] = Date.now() + 7000;
        if (S.route.cid === ev.channelId) renderTyping();
        break;
    }
  }
  function applyRouteSoft() {
    const { sid, cid } = S.route;
    if (sid !== '@me' && !S.servers[sid]) return go('@me');
    if (cid && !S.channels[cid] && S.route.page === 'chat') return go(sid);
    renderAll();
  }
  setInterval(() => {
    if (!S.me) return;
    const now = Date.now();
    let changed = false;
    for (const cid in S.typing) for (const uid in S.typing[cid]) if (S.typing[cid][uid] < now) { delete S.typing[cid][uid]; changed = true; }
    if (changed) renderTyping();
  }, 1000);
  function renderTyping() {
    const el = $('#typing');
    if (!el) return;
    const who = Object.keys(S.typing[S.route.cid] || {}).filter(id => id !== S.me.id).map(id => `<b>${esc(dname(user(id)))}</b>`);
    el.innerHTML = who.length ? `<span class="dots"><i></i><i></i><i></i></span>${who.length > 3 ? 'Several people are typing…' : who.join(who.length === 2 ? ' and ' : ', ') + (who.length > 1 ? ' are typing…' : ' is typing…')}` : '';
  }

  // notifications + sound
  function notify(m) {
    if (!prefs.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
    const u = user(m.authorId), ch = S.channels[m.channelId];
    try {
      const n = new Notification(ch.type === 'dm' ? dname(u) : `${dname(u)} (#${ch.name})`, { body: plain(m.content).slice(0, 140) || 'Sent an attachment', tag: m.channelId, icon: u.avatar && !u.avatar.startsWith('data:') ? u.avatar : undefined });
      n.onclick = () => { window.focus(); go(ch.type === 'dm' ? '@me' : ch.serverId, ch.id); };
    } catch {}
  }
  let audioCtx = null;
  function ding() {
    if (!prefs.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      [880, 1320].forEach((f, i) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = f; o.type = 'sine';
        g.gain.setValueAtTime(0.0001, t + i * 0.09); g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.09 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.25);
        o.connect(g).connect(audioCtx.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.3);
      });
    } catch {}
  }
  function burst(anchor, emojiHTML) {
    if (prefs.reduceMotion) return;
    const r = anchor.getBoundingClientRect();
    const box = document.createElement('div');
    box.className = 'burst';
    box.style.left = r.left + r.width / 2 + 'px';
    box.style.top = r.top + r.height / 2 + 'px';
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('span');
      const a = (i / 14) * Math.PI * 2, d = 60 + Math.random() * 70;
      p.style.setProperty('--dx', Math.cos(a) * d + 'px');
      p.style.setProperty('--dy', Math.sin(a) * d - 30 + 'px');
      p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDelay = Math.random() * 0.08 + 's';
      p.innerHTML = emojiHTML;
      box.append(p);
    }
    const big = document.createElement('b');
    big.className = 'burst-big';
    big.innerHTML = emojiHTML;
    box.append(big);
    document.body.append(box);
    setTimeout(() => box.remove(), 1300);
  }

  // ------------------------------------------------------------------ members panel
  function renderMembers() {
    const el = $('#members');
    if (!S.me) return;
    const show = S.route.page === 'chat' && S.showMembers !== false;
    document.body.classList.toggle('no-members', !show);
    if (S.route.page !== 'chat') { el.innerHTML = ''; return; }
    const ch = S.channels[S.route.cid];
    if (!ch) return;
    if (ch.type === 'dm') {
      const o = dmOther(ch);
      el.innerHTML = `<div class="dm-profile">${profileCardHTML(o, { compact: true })}</div>`;
      return;
    }
    const sv = S.servers[ch.serverId];
    const members = sv.members.map(user);
    const on = members.filter(u => u.presence !== 'offline').sort((a, b) => dname(a).localeCompare(dname(b)));
    const off = members.filter(u => u.presence === 'offline').sort((a, b) => dname(a).localeCompare(dname(b)));
    const row = u => `<div class="member ${u.presence === 'offline' ? 'off' : ''}" data-act="profile" data-uid="${u.id}">
      ${avatarHTML(u, 32, { noact: true })}<div class="mem-text"><span class="mem-name">${nameHTML(u)}${u.id === sv.ownerId ? `<span class="owner" title="Server owner">${ic('crown')}</span>` : ''}${u.bot ? '<span class="tag-bot">BOT</span>' : ''}</span>${customStatusHTML(u) ? `<span class="mem-sub">${customStatusHTML(u)}</span>` : ''}</div></div>`;
    el.innerHTML = `<div class="sb-label">Online — ${on.length}</div>${on.map(row).join('')}${off.length ? `<div class="sb-label">Offline — ${off.length}</div>${off.map(row).join('')}` : ''}`;
  }

  // ------------------------------------------------------------------ profile card
  const BADGES = u => [
    u.bot ? ['🤖', 'Biscuit Bot'] : null,
    u.golden ? ['🍪', 'Golden Biscuit member'] : null,
    u.createdAt && Date.now() - u.createdAt < 7 * 864e5 && !u.bot ? ['🌱', 'New to Biscuit'] : null,
    Object.values(S.servers).some(s => s.ownerId === u.id) ? ['👑', 'Server owner'] : null,
    u.decoration && u.decoration !== 'none' ? ['💫', 'Decorated'] : null,
  ].filter(Boolean);
  function profileCardHTML(u, o) {
    o = o || {};
    const themed = u.theme && u.theme[0] && u.theme[1];
    const style = themed ? `--p1:${u.theme[0]};--p2:${u.theme[1]}` : '';
    const banner = u.banner ? `background-image:url('${esc(u.banner)}')` : `background:${u.bannerColor || u.accent || hashColor(u.id)}`;
    const presence = o.preview ? (u.status === 'invisible' ? 'offline' : u.status) : u.presence;
    const isMe = S.me && u.id === S.me.id;
    return `<div class="pcard ${themed ? 'themed' : ''} ${o.compact ? 'compact' : ''} fx-${esc(u.effect || 'none')}" style="${style}">
      <div class="pc-banner" style="${banner}"></div>
      <div class="pc-top">
        ${avatarHTML(Object.assign({}, u, { presence }), 80, { noact: !!o.preview })}
        <div class="pc-badges">${BADGES(u).map(b => `<span class="badge-ic" title="${esc(b[1])}">${b[0]}</span>`).join('')}</div>
      </div>
      <div class="pc-body">
        <div class="pc-name">${nameHTML(u, 'big')}</div>
        <div class="pc-user">${esc(u.username)}${u.pronouns ? ` <span class="dot">•</span> ${esc(u.pronouns)}` : ''}${u.bot ? ' <span class="tag-bot">BOT</span>' : ''}</div>
        ${customStatusHTML(u) ? `<div class="pc-status">${customStatusHTML(u)}</div>` : ''}
        ${u.bio ? `<div class="pc-sec"><h4>About Me</h4><div class="pc-bio">${md(u.bio)}</div></div>` : ''}
        <div class="pc-sec"><h4>Member Since</h4><div>🍪 ${new Date(u.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div></div>
        ${o.preview ? '' : isMe ? `<button class="btn primary block" data-act="settings" data-tab="profiles">${ic('edit')} Edit Profile</button>` : `<button class="btn primary block" data-act="dm" data-uid="${u.id}">${ic('msg')} Message</button>`}
      </div>
      <div class="pc-fx" aria-hidden="true"></div>
    </div>`;
  }
  function showProfile(uid, anchor) {
    const u = S.users[uid];
    if (!u) return;
    const inSide = anchor.closest('#members') || anchor.closest('.member');
    popover(anchor, profileCardHTML(u), { cls: 'profile-pop sheetable', place: inSide ? 'left' : 'right' });
  }

  // ------------------------------------------------------------------ composer
  let typingSent = 0;
  function autosize() {
    const t = $('#input');
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, innerHeight * 0.4) + 'px';
    const n = t.value.length;
    const cc = $('#charcount');
    cc.textContent = n > LIMITS.message - 500 ? `${LIMITS.message - n}` : '';
    cc.classList.toggle('over', n > LIMITS.message);
  }
  function bindComposer() {
    const t = $('#input');
    t.addEventListener('input', () => {
      autosize();
      S.drafts[S.route.cid] = t.value;
      if (t.value && Date.now() - typingSent > 6000) { typingSent = Date.now(); S.b.call('typing', { channelId: S.route.cid }).catch(() => {}); }
      updateAutocomplete();
    });
    t.addEventListener('keydown', e => {
      const ac = $('#ac');
      if (!ac.hidden) {
        const items = $$('.ac-item', ac);
        let i = items.findIndex(x => x.classList.contains('sel'));
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (items[i]) items[i].classList.remove('sel');
          i = (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
          items[i].classList.add('sel'); items[i].scrollIntoView({ block: 'nearest' });
          return;
        }
        if ((e.key === 'Enter' || e.key === 'Tab') && items[i]) { e.preventDefault(); pickAutocomplete(items[i]); return; }
        if (e.key === 'Escape') { ac.hidden = true; e.stopPropagation(); return; }
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !(innerWidth < 640 && 'ontouchstart' in window)) { e.preventDefault(); send(); return; }
      if (e.key === 'ArrowUp' && !t.value) {
        const mine = (S.messages[S.route.cid] || []).filter(m => m.authorId === S.me.id && !m.system).pop();
        if (mine) { e.preventDefault(); startEdit(mine.id); }
      }
      if (e.key === 'Escape' && S.replyTo) { S.replyTo = null; renderReplyBar(); renderMessages(); }
    });
    t.addEventListener('paste', e => {
      const files = [...(e.clipboardData && e.clipboardData.files || [])];
      if (files.length) {
        e.preventDefault();
        addFiles(files.map((f, i) => f.name && f.name !== 'image.png' ? f : new File([f], `screenshot-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}${files.length > 1 ? '-' + (i + 1) : ''}.${(f.type.split('/')[1] || 'png').replace('jpeg', 'jpg')}`, { type: f.type })));
      }
    });
    t.addEventListener('blur', () => setTimeout(() => { const ac = $('#ac'); if (ac && document.activeElement !== t) ac.hidden = true; }, 150));
    const msgs = $('#msgs');
    msgs.addEventListener('scroll', () => {
      S.stick = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 60;
      if (S.stick) markRead(S.route.cid);
      if (msgs.scrollTop < 200 && S.hasMore[S.route.cid] && !S.loadingMore) loadMore();
    }, { passive: true });
  }
  // images finishing loading shouldn't knock you off the bottom
  document.addEventListener('load', e => {
    if (e.target.tagName === 'IMG' && S.stick && e.target.closest('#msgs')) { const m = $('#msgs'); m.scrollTop = m.scrollHeight; }
  }, true);

  async function loadMore() {
    const cid = S.route.cid, list = S.messages[cid] || [];
    S.loadingMore = true;
    try {
      const r = await call('getMessages', { channelId: cid, before: list[0] && list[0].id });
      S.messages[cid] = r.messages.concat(list.filter(m => !r.messages.some(x => x.id === m.id)));
      S.hasMore[cid] = r.hasMore;
      if (S.route.cid === cid) renderMessages({ prepend: true });
    } catch {} finally { S.loadingMore = false; }
  }

  function codeSafe(text, fn) {
    return text.split(/(```[\s\S]*?```|`[^`\n]+`)/).map((part, i) => i % 2 ? part : fn(part)).join('');
  }
  function findCustomEmoji(name) {
    const all = Object.values(S.emojis).filter(e => S.servers[e.serverId]);
    return all.find(e => e.name === name && e.serverId === S.route.sid) || all.find(e => e.name === name) || all.find(e => e.name.toLowerCase() === name.toLowerCase());
  }
  function prepareOutgoing(text) {
    return codeSafe(text, part => part
      .replace(/:([A-Za-z0-9_+-]{2,32}):/g, (all, name) => {
        const ce = findCustomEmoji(name);
        if (ce) return `<:${ce.name}:${ce.id}>`;
        const e = EM.byName[name.toLowerCase()];
        return e ? e.char : all;
      })
      .replace(/(^|[^\w<])@([a-z0-9_.]{2,32})/gi, (all, pre, name) => {
        const u = Object.values(S.users).find(x => x.username === name.toLowerCase());
        return u ? `${pre}<@${u.id}>` : all;
      }));
  }
  function toEditable(text) {
    return String(text || '').replace(/<@([A-Za-z0-9-]+)>/g, (all, id) => S.users[id] ? '@' + S.users[id].username : all).replace(/<a?:([A-Za-z0-9_]+):[A-Za-z0-9-]+>/g, ':$1:');
  }

  async function send() {
    const t = $('#input');
    if (!t) return;
    if (S.pending.some(p => p.status === 'uploading')) { toast('Hang on, still uploading…'); return; }
    const raw = t.value.trim();
    const attachments = S.pending.filter(p => p.status === 'done').map(p => ({ url: p.url, name: p.name, type: p.type, size: p.size, w: p.w, h: p.h, spoiler: p.spoiler }));
    if (!raw && !attachments.length) return;
    if (raw.length > LIMITS.message) { toast(`Messages can be up to ${LIMITS.message} characters`, 'err'); return; }
    const content = prepareOutgoing(raw);
    const cid = S.route.cid, replyTo = S.replyTo;
    const keepPending = S.pending;
    t.value = ''; S.drafts[cid] = ''; autosize();
    S.pending = []; S.replyTo = null; renderTray(); renderReplyBar();
    $('#ac').hidden = true;
    S.stick = true;
    try {
      const m = await call('sendMessage', { channelId: cid, content, attachments, replyTo });
      if (m && addMessage(m) && S.route.cid === cid) { renderMessages({ bottom: true }); }
      markRead(cid);
    } catch {
      if (S.route.cid === cid) { t.value = raw; S.pending = keepPending; renderTray(); autosize(); }
    }
  }
  async function sendGif(g) {
    const cid = S.route.cid;
    if (!cid) return;
    closePopovers();
    try {
      let url = g.url;
      if (g.blob) url = await uploadBuiltin(g);
      const m = await call('sendMessage', { channelId: cid, gif: { url, w: g.w || 0, h: g.h || 0, title: g.title || '' }, replyTo: S.replyTo });
      S.replyTo = null; renderReplyBar();
      S.stick = true;
      if (m && addMessage(m) && S.route.cid === cid) renderMessages({ bottom: true });
    } catch {}
  }
  const gifUploadCache = (() => { try { return JSON.parse(store.get('biscuit.gifcache') || '{}'); } catch { return {}; } })();
  async function uploadBuiltin(g) {
    const key = g.cacheKey;
    if (key && S.b.mode === 'server' && gifUploadCache[key]) return gifUploadCache[key];
    const file = new File([g.blob], (g.title || 'biscuit').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.gif', { type: 'image/gif' });
    const r = await S.b.upload(file);
    if (key && S.b.mode === 'server') { gifUploadCache[key] = r.url; store.set('biscuit.gifcache', JSON.stringify(gifUploadCache)); }
    return r.url;
  }

  // attachments tray
  async function addFiles(files) {
    if (!S.route.cid || S.route.page !== 'chat') { toast('Open a channel first'); return; }
    for (const file of files) {
      if (S.pending.length >= LIMITS.attachments) { toast(`Up to ${LIMITS.attachments} files per message`, 'err'); break; }
      const p = { id: Math.random().toString(36).slice(2), name: file.name || 'file', type: file.type || 'application/octet-stream', size: file.size, status: 'uploading', progress: 0, spoiler: false, w: 0, h: 0, preview: /^image\//.test(file.type) ? URL.createObjectURL(file) : '' };
      S.pending.push(p);
      renderTray();
      Object.assign(p, await imageSize(file));
      S.b.upload(file, f => { p.progress = f; const bar = $(`#tray [data-pid="${p.id}"] .tray-bar i`); if (bar) bar.style.width = Math.round(f * 100) + '%'; })
        .then(r => { p.status = 'done'; p.url = r.url; renderTray(); })
        .catch(e => { toast(e.message, 'err'); S.pending = S.pending.filter(x => x !== p); renderTray(); });
    }
    $('#input') && $('#input').focus();
  }
  function renderTray() {
    const el = $('#tray');
    if (!el) return;
    el.hidden = !S.pending.length;
    el.innerHTML = S.pending.map(p => `<div class="tray-item ${p.spoiler ? 'spoil' : ''}" data-pid="${p.id}">
      <div class="tray-prev">${p.preview ? `<img src="${esc(p.preview)}" alt="">` : `<div class="tray-file">${ic('file')}</div>`}${p.spoiler ? '<span class="tray-spoil">SPOILER</span>' : ''}</div>
      <div class="tray-name" title="${esc(p.name)}">${esc(p.name)}</div><div class="tray-size">${fmtSize(p.size)}</div>
      ${p.status === 'uploading' ? `<div class="tray-bar"><i style="width:${Math.round(p.progress * 100)}%"></i></div>` : ''}
      <div class="tray-tools"><button class="icon-btn" data-act="tray-spoiler" title="Mark as spoiler">${ic('eye')}</button><button class="icon-btn danger" data-act="tray-remove" title="Remove">${ic('trash')}</button></div>
    </div>`).join('');
  }
  function renderReplyBar() {
    const el = $('#reply-bar');
    if (!el) return;
    const m = S.replyTo && findMsg(S.route.cid, S.replyTo);
    el.hidden = !m;
    el.innerHTML = m ? `<span>Replying to <b style="${nameStyle(user(m.authorId))}">${esc(dname(user(m.authorId)))}</b></span><button class="icon-btn" data-act="cancel-reply" title="Cancel reply">${ic('x')}</button>` : '';
  }

  // screenshot straight from the screen
  async function captureScreen() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) { toast('Screen capture is not supported here. Paste a screenshot with Ctrl+V instead.', 'err'); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 5 }, audio: false }); }
    catch { return; }
    try {
      const video = document.createElement('video');
      video.srcObject = stream; video.muted = true; video.playsInline = true;
      await video.play();
      await new Promise(r => setTimeout(r, 350));
      const c = document.createElement('canvas');
      c.width = video.videoWidth; c.height = video.videoHeight;
      c.getContext('2d').drawImage(video, 0, 0);
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      const name = `screenshot-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.png`;
      addFiles([new File([blob], name, { type: 'image/png' })]);
      toast('Screenshot attached 📸', 'ok');
    } finally { stream.getTracks().forEach(t => t.stop()); }
  }

  // autocomplete for :emoji: and @mentions
  function updateAutocomplete() {
    const t = $('#input'), ac = $('#ac');
    const before = t.value.slice(0, t.selectionStart);
    const m = /(^|\s)([:@])([\w.+-]*)$/.exec(before);
    if (!m || (m[2] === ':' && m[3].length < 2)) { ac.hidden = true; return; }
    const q = m[3].toLowerCase();
    let items = [];
    if (m[2] === ':') {
      const custom = Object.values(S.emojis).filter(e => S.servers[e.serverId] && e.name.toLowerCase().includes(q)).slice(0, 8)
        .map(e => ({ ins: `:${e.name}: `, html: `<img class="cemoji" src="${esc(e.url)}" alt=""><span>:${esc(e.name)}:</span><small>${esc(S.servers[e.serverId].name)}</small>` }));
      const uni = EM.search(q, 12).map(e => ({ ins: e.char + ' ', html: `<span class="ac-emoji">${e.char}</span><span>:${esc(e.name)}:</span>` }));
      items = custom.concat(uni).slice(0, 14);
    } else {
      const ch = S.channels[S.route.cid];
      const ids = ch.type === 'dm' ? ch.members : (S.servers[ch.serverId] || { members: [] }).members;
      items = ids.map(user).filter(u => u.username.includes(q) || dname(u).toLowerCase().includes(q)).slice(0, 10)
        .map(u => ({ ins: `@${u.username} `, html: `${avatarHTML(u, 24, { noact: true })}<span>${esc(dname(u))}</span><small>@${esc(u.username)}</small>` }));
    }
    if (!items.length) { ac.hidden = true; return; }
    ac.dataset.start = before.length - m[2].length - m[3].length;
    ac.innerHTML = `<div class="ac-title">${m[2] === ':' ? 'Emoji matching' : 'Members matching'} <b>${esc(m[2] + m[3])}</b></div>` +
      items.map((it, i) => `<div class="ac-item ${i ? '' : 'sel'}" data-ins="${esc(it.ins)}">${it.html}</div>`).join('');
    ac.hidden = false;
  }
  function pickAutocomplete(item) {
    const t = $('#input'), ac = $('#ac');
    const start = +ac.dataset.start, end = t.selectionStart;
    insertAt(t, item.dataset.ins, start, end);
    ac.hidden = true;
  }
  $('#layer').parentNode.addEventListener('mousedown', e => {
    const it = e.target.closest && e.target.closest('.ac-item');
    if (it) { e.preventDefault(); pickAutocomplete(it); }
  });
  function insertAt(t, text, start, end) {
    start = start == null ? t.selectionStart : start; end = end == null ? t.selectionEnd : end;
    t.value = t.value.slice(0, start) + text + t.value.slice(end);
    const pos = start + text.length;
    t.focus(); t.setSelectionRange(pos, pos);
    t.dispatchEvent(new Event('input'));
  }

  // editing
  function startEdit(mid) {
    S.editing = mid;
    renderMessages();
    const ta = $(`#m-${CSS.escape(mid)} .edit-input`);
    if (!ta) return;
    bindEditBox(ta);
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  }
  function bindEditBox(ta) {
    const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
    fit();
    ta.addEventListener('input', fit);
    ta.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); cancelEdit(); }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
    });
  }
  function cancelEdit() { S.editing = null; renderMessages(); $('#input') && $('#input').focus(); }
  async function saveEdit() {
    const mid = S.editing, ta = $(`#m-${CSS.escape(mid)} .edit-input`);
    if (!ta) return;
    const m = findMsg(S.route.cid, mid);
    const content = prepareOutgoing(ta.value.trim());
    if (!content && m && !m.attachments.length && !m.gif) { S.editing = null; return deleteMessage(mid); }
    try {
      const r = await call('editMessage', { channelId: S.route.cid, messageId: mid, content });
      const list = S.messages[S.route.cid]; const i = list.findIndex(x => x.id === mid); if (i >= 0) list[i] = r;
      cancelEdit();
    } catch {}
  }
  async function deleteMessage(mid, skipConfirm) {
    const m = findMsg(S.route.cid, mid);
    if (!m) return;
    if (!skipConfirm) {
      const ok = await confirmBox('Delete Message', 'Are you sure you want to delete this message?<div class="confirm-preview">' + (m.content ? md(m.content) : '<i>attachment</i>') + '</div><small class="muted">Tip: hold Shift when clicking delete to skip this.</small>', 'Delete', true);
      if (!ok) return;
    }
    call('deleteMessage', { channelId: S.route.cid, messageId: mid }).catch(() => {});
  }

  // ------------------------------------------------------------------ emoji picker
  function emojiPicker(anchor, onPick, o) {
    o = o || {};
    const servers = myServers().map(sv => ({ sv, list: Object.values(S.emojis).filter(e => e.serverId === sv.id) })).filter(x => x.list.length);
    const recent = prefs.recentEmoji.slice(0, 24);
    const btn = e => `<button class="em" data-ch="${esc(e.char)}" data-name="${esc(e.name)}">${e.char}</button>`;
    const cbtn = e => `<button class="em" data-cid="${e.id}" data-name="${esc(e.name)}"><img src="${esc(e.url)}" alt=":${esc(e.name)}:" loading="lazy"></button>`;
    const recentBtn = k => {
      if (k.startsWith('c:')) { const e = S.emojis[k.slice(2)]; return e && S.servers[e.serverId] ? cbtn(e) : ''; }
      const e = EM.all.find(x => x.char === k);
      return btn(e || { char: k, name: '' });
    };
    const sections = [
      `<section data-sec="recent"><h5>Frequently Used</h5><div class="em-grid">${recent.map(recentBtn).join('')}</div></section>`,
      ...servers.map(x => `<section data-sec="srv-${x.sv.id}"><h5>${esc(x.sv.name)}</h5><div class="em-grid">${x.list.map(cbtn).join('')}</div></section>`),
      ...EM.categories.map(c => `<section data-sec="${c.id}"><h5>${esc(c.name)}</h5><div class="em-grid">${c.list.map(btn).join('')}</div></section>`),
    ].join('');
    const nav = [`<button data-jump="recent" title="Frequently used">🕘</button>`]
      .concat(servers.map(x => `<button data-jump="srv-${x.sv.id}" title="${esc(x.sv.name)}" class="nav-srv">${x.sv.icon ? `<img src="${esc(x.sv.icon)}" alt="">` : esc([...x.sv.name][0])}</button>`))
      .concat(EM.categories.map(c => `<button data-jump="${c.id}" title="${esc(c.name)}">${c.icon}</button>`)).join('');
    const el = popover(anchor, `
      <div class="ep">
        <div class="ep-top">${o.super ? '<div class="ep-super">✨ Super Reaction: free and unlimited</div>' : ''}<input class="ep-search" placeholder="Find the perfect emoji" autocomplete="off"></div>
        <div class="ep-main"><nav class="ep-nav">${nav}</nav><div class="ep-scroll">${sections}<section class="ep-results" hidden><h5>Search results</h5><div class="em-grid"></div></section></div></div>
        <div class="ep-foot"><span class="ep-prev">🍪</span><span class="ep-name">:cookie:</span>${servers.length ? '' : '<span class="ep-tip">Add custom emoji in Server Settings → Emoji</span>'}</div>
      </div>`, { cls: 'emoji-pop sheetable', place: o.place || 'top', keep: o.keep });
    const search = $('.ep-search', el), scroll = $('.ep-scroll', el), results = $('.ep-results', el);
    setTimeout(() => innerWidth > 640 && search.focus(), 0);
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      $$('section:not(.ep-results)', scroll).forEach(s => { s.hidden = !!q; });
      results.hidden = !q;
      if (!q) return;
      const custom = servers.flatMap(x => x.list).filter(e => e.name.toLowerCase().includes(q));
      $('.em-grid', results).innerHTML = custom.map(cbtn).join('') + EM.search(q, 120).map(btn).join('') || '<p class="muted pad">No emoji found 🥲</p>';
    });
    search.addEventListener('keydown', e => { if (e.key === 'Enter') { const first = $('.ep-results .em', el); if (first) first.click(); } });
    el.addEventListener('click', e => {
      const j = e.target.closest('[data-jump]');
      if (j) { const s = $(`[data-sec="${j.dataset.jump}"]`, el); if (s) scroll.scrollTop = s.offsetTop - scroll.offsetTop; return; }
      const b = e.target.closest('.em');
      if (!b) return;
      const pick = b.dataset.cid ? { custom: S.emojis[b.dataset.cid] } : { char: b.dataset.ch, name: b.dataset.name };
      const key = b.dataset.cid ? 'c:' + b.dataset.cid : b.dataset.ch;
      prefs.recentEmoji = [key].concat(prefs.recentEmoji.filter(k => k !== key)).slice(0, 32); savePrefs();
      onPick(pick, e);
      if (!e.shiftKey && !o.stayOpen) closePop(el);
    });
    el.addEventListener('mouseover', e => {
      const b = e.target.closest('.em');
      if (!b) return;
      $('.ep-prev', el).innerHTML = b.innerHTML;
      $('.ep-name', el).textContent = ':' + (b.dataset.name || '') + ':';
    });
    return el;
  }

  // ------------------------------------------------------------------ GIF picker
  function gifPicker(anchor) {
    const tabs = [['favorites', '⭐ Favorites'], ['biscuit', '🍪 Biscuit GIFs'], ['search', '🔍 Search'], ['make', '✨ GIF Maker']];
    S.gifTab = S.gifTab || ((S.me.favGifs || []).length ? 'favorites' : 'biscuit');
    const el = popover(anchor, `<div class="gp">
      <div class="gp-top"><input class="gp-search" placeholder="Search GIFs" autocomplete="off"><button class="btn ghost small" data-gp="upload">${ic('upload')} Upload GIF</button></div>
      <div class="gp-tabs">${tabs.map(([id, l]) => `<button data-gtab="${id}" class="${S.gifTab === id ? 'active' : ''}">${l}</button>`).join('')}</div>
      <div class="gp-body"></div></div>`, { cls: 'gif-pop sheetable', place: 'top' });
    const body = $('.gp-body', el), search = $('.gp-search', el);
    let searchTimer;
    const tile = (g, i) => `<div class="gp-item" data-i="${i}" style="${g.w && g.h ? `aspect-ratio:${g.w}/${g.h}` : ''}"><img src="${esc(g.preview || g.url)}" alt="${esc(g.title || 'GIF')}" loading="lazy"><button class="fav-star ${gifFav(g.url) ? 'on' : ''}" data-gfav="${i}" title="Favorite">${ic('star')}</button></div>`;
    let current = [];
    const show = list => { current = list; body.innerHTML = list.length ? `<div class="gp-grid">${list.map(tile).join('')}</div>` : ''; };
    async function open(tab) {
      S.gifTab = tab;
      $$('[data-gtab]', el).forEach(b => b.classList.toggle('active', b.dataset.gtab === tab));
      const q = search.value.trim().toLowerCase();
      if (tab === 'favorites') {
        const favs = (S.me.favGifs || []).map(g => ({ url: g.url, w: g.w, h: g.h, title: 'Favorite' }));
        show(favs);
        if (!favs.length) body.innerHTML = `<div class="gp-empty"><div>⭐</div><p>No favorites yet. Click the star on any GIF, in here or in chat, to save it.</p></div>`;
      } else if (tab === 'biscuit') {
        const list = GIF.BUILTINS.filter(b => !q || b.tags.includes(q) || b.title.toLowerCase().includes(q));
        body.innerHTML = `<div class="gp-grid">${list.map(b => `<div class="gp-item loading" data-b="${b.id}" style="aspect-ratio:4/3"><span class="gp-ph" style="background:linear-gradient(135deg,${b.bg[0]},${b.bg[1]})">${b.emoji}</span></div>`).join('')}</div>` +
          `<p class="gp-note">Biscuit GIFs are generated right in your browser: no account, key or internet needed.</p>`;
        current = [];
        for (const b of list) {
          const g = await GIF.builtin(b.id);
          if (S.gifTab !== 'biscuit' || !el.isConnected) return;
          const item = $(`[data-b="${b.id}"]`, body);
          if (!item) continue;
          const idx = current.push({ blob: g.blob, url: g.url, w: g.w, h: g.h, title: b.title, cacheKey: 'builtin:' + b.id }) - 1;
          item.classList.remove('loading');
          item.dataset.i = idx;
          item.innerHTML = `<img src="${g.url}" alt="${esc(b.title)}"><button class="fav-star" data-gfav="${idx}" title="Favorite">${ic('star')}</button>`;
        }
      } else if (tab === 'search') {
        if (!S.b.canSearchGifs) {
          body.innerHTML = `<div class="gp-empty"><div>🔍</div><p>Search millions of GIFs by adding a free GIPHY API key in <a href="#" data-act="settings" data-tab="gifs">Settings → GIFs</a>${S.b.mode === 'server' ? ', or start the server with <code>GIPHY_API_KEY</code>' : ''}.</p><p class="muted">Until then, use Biscuit GIFs, the GIF Maker, upload your own, or paste any GIF link into chat.</p></div>`;
          return;
        }
        body.innerHTML = '<div class="gp-empty"><div class="spin">🍪</div></div>';
        try { const r = await S.b.gifs(q, 0); if (S.gifTab === 'search') { show(r || []); if (!r || !r.length) body.innerHTML = '<div class="gp-empty"><p>No GIFs found.</p></div>'; } }
        catch (e) { body.innerHTML = `<div class="gp-empty"><p>${esc(e.message)}</p></div>`; }
      } else if (tab === 'make') gifMaker(body);
    }
    el.addEventListener('click', async e => {
      const t = e.target.closest('[data-gtab]');
      if (t) return open(t.dataset.gtab);
      if (e.target.closest('[data-gp="upload"]')) {
        const [file] = await pickFile('image/gif,image/webp,image/png');
        if (!file) return;
        try {
          toast('Uploading GIF…');
          const size = await imageSize(file);
          const r = await S.b.upload(file);
          sendGif({ url: r.url, w: size.w, h: size.h, title: file.name.replace(/\.\w+$/, '') });
        } catch (err) { toast(err.message, 'err'); }
        return;
      }
      const fav = e.target.closest('[data-gfav]');
      if (fav) { e.stopPropagation(); const g = current[+fav.dataset.gfav]; if (g) { await toggleFav(g); fav.classList.toggle('on', gifFav(g.uploadedUrl || g.url)); } return; }
      const item = e.target.closest('.gp-item');
      if (item && item.dataset.i != null && current[+item.dataset.i]) sendGif(current[+item.dataset.i]);
    });
    search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        if (S.gifTab === 'favorites' || S.gifTab === 'make') S.gifTab = S.b.canSearchGifs ? 'search' : 'biscuit';
        open(S.gifTab);
      }, 300);
    });
    setTimeout(() => innerWidth > 640 && search.focus(), 0);
    open(S.gifTab);
  }
  async function toggleFav(g) {
    let url = g.url;
    if (g.blob) { url = await uploadBuiltin(g); g.uploadedUrl = url; }
    const favs = (S.me.favGifs || []).slice();
    const i = favs.findIndex(f => f.url === url);
    if (i >= 0) favs.splice(i, 1); else favs.unshift({ url, w: g.w || 0, h: g.h || 0 });
    try {
      S.me = await call('updateProfile', { favGifs: favs });
      S.users[S.me.id] = S.me;
      toast(i >= 0 ? 'Removed from favorites' : 'Added to favorites ⭐', 'ok');
      if (S.route.page === 'chat') renderMessages();
    } catch {}
  }

  function gifMaker(body, o) {
    o = o || {};
    const st = Object.assign({ emoji: '🍪', text: 'BISCUIT', anim: 'bounce', c1: '#f6c46a', c2: '#a0522d', tc: '#ffffff' }, S.makerState || {});
    S.makerState = st;
    body.innerHTML = `<div class="maker">
      <div class="maker-prev"><img alt="GIF preview"><span class="maker-busy">Rendering…</span></div>
      <div class="maker-form">
        <div class="row2"><button class="maker-emoji" data-mk="emoji" title="Pick an emoji">${esc(st.emoji)}</button><input data-mk="text" maxlength="28" placeholder="Caption" value="${esc(st.text)}"></div>
        <label class="mini">Animation<select data-mk="anim">${Object.entries(GIF.ANIMS).map(([k, v]) => `<option value="${k}" ${k === st.anim ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <div class="row3"><label class="mini">Background<input type="color" data-mk="c1" value="${st.c1}"></label><label class="mini">&nbsp;<input type="color" data-mk="c2" value="${st.c2}"></label><label class="mini">Text<input type="color" data-mk="tc" value="${st.tc}"></label></div>
        <div class="maker-btns">${o.noSend ? '' : '<button class="btn primary" data-mk="send">Send</button>'}<button class="btn ghost" data-mk="fav">⭐ Save</button><button class="btn ghost" data-mk="dl">${ic('download')}</button></div>
      </div></div>`;
    let gif = null, timer;
    const img = $('img', body), busy = $('.maker-busy', body);
    const rerender = () => {
      clearTimeout(timer);
      busy.hidden = false;
      timer = setTimeout(() => {
        const blob = GIF.render({ emoji: st.emoji, text: st.text, anim: st.anim, bg: [st.c1, st.c2], textColor: st.tc });
        if (gif) URL.revokeObjectURL(gif.url);
        gif = { blob, url: URL.createObjectURL(blob), w: 240, h: 180, title: st.text || 'GIF' };
        img.src = gif.url;
        busy.hidden = true;
      }, 120);
    };
    body.addEventListener('input', e => { const k = e.target.dataset.mk; if (k && k in st) { st[k] = e.target.value; rerender(); } });
    body.addEventListener('change', e => { const k = e.target.dataset.mk; if (k && k in st) { st[k] = e.target.value; rerender(); } });
    body.addEventListener('click', e => {
      const b = e.target.closest('[data-mk]');
      if (!b) return;
      const k = b.dataset.mk;
      if (k === 'emoji') emojiPicker(b, p => { if (p.char) { st.emoji = p.char; b.textContent = p.char; rerender(); } else toast('Pick a standard emoji for GIFs'); }, { keep: true, place: 'right' });
      if (k === 'send' && gif) sendGif(gif);
      if (k === 'fav' && gif) toggleFav(Object.assign({}, gif));
      if (k === 'dl' && gif) { const a = document.createElement('a'); a.href = gif.url; a.download = (st.text || 'biscuit').replace(/[^\w-]+/g, '-') + '.gif'; a.click(); }
    });
    rerender();
  }

  // ------------------------------------------------------------------ lightbox
  function lightbox(src, name) {
    const m = modal(`<div class="lb-inner"><img src="${esc(src)}" alt="${esc(name || '')}"><div class="lb-bar"><a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Open original</a><a href="${esc(src)}" download="${esc(name || 'image')}">${ic('download')} Download</a></div></div>`, { cls: 'lightbox', backCls: 'dark' });
    m.el.addEventListener('click', e => { if (e.target === m.el || e.target.tagName === 'IMG') m.close(); });
  }

  // ------------------------------------------------------------------ settings
  const THEMES = [
    ['dark', 'Dark', ['#313338', '#2b2d31']], ['midnight', 'Midnight', ['#000', '#0b0b0d']], ['light', 'Light', ['#fff', '#f2f3f5']],
    ['sunset', 'Sunset ✨', ['#ff7e5f', '#7b2ff7']], ['aurora', 'Aurora ✨', ['#00c9a7', '#3d348b']], ['ocean', 'Ocean ✨', ['#2193b0', '#1c2541']],
    ['grape', 'Grape ✨', ['#8e2de2', '#3a1c71']], ['sakura', 'Sakura ✨', ['#f9a8d4', '#7c3a5c']], ['biscuit', 'Biscuit ✨', ['#e8a33d', '#5b3a1e']],
    ['forest', 'Forest ✨', ['#56ab2f', '#1e3a2b']], ['neon', 'Neon Nights ✨', ['#ff00cc', '#333399']],
  ];
  const DECO_NAMES = { none: 'None', rainbow: 'Rainbow', fire: 'Fire', neon: 'Neon', gold: 'Gold', sparkle: 'Sparkle', crown: 'Crown', hearts: 'Hearts', catears: 'Cat Ears', halo: 'Halo', glitch: 'Glitch' };
  const FX_NAMES = { none: 'None', confetti: 'Confetti', snow: 'Snow', stars: 'Starry', hearts: 'Hearts', bubbles: 'Bubbles', aurora: 'Aurora', embers: 'Embers' };
  const FONT_NAMES = { default: 'Default', serif: 'Serif', mono: 'Mono', rounded: 'Rounded', script: 'Script', chunky: 'Chunky' };
  const THEME_PRESETS = [['#f6c46a', '#a0522d'], ['#ff9a9e', '#a18cd1'], ['#43cea2', '#185a9d'], ['#ff512f', '#dd2476'], ['#1f1c2c', '#928dab'], ['#00f260', '#0575e6'], ['#fceabb', '#f8b500'], ['#141e30', '#243b55']];

  function applyPrefs() {
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.classList.toggle('compact', !!prefs.compact);
    document.documentElement.classList.toggle('reduce-motion', !!prefs.reduceMotion);
    document.documentElement.style.setProperty('--font-scale', prefs.fontScale / 100);
    const meta = $('meta[name=theme-color]');
    if (meta) meta.content = prefs.theme === 'light' ? '#e3e5e8' : '#1e1f22';
  }

  let settingsModal = null;
  function openSettings(tab) {
    closePopovers();
    if (settingsModal) settingsModal.close();
    const nav = [['account', 'My Account'], ['profiles', 'Profiles'], ['golden', 'Golden Biscuit ✨'], null, ['appearance', 'Appearance'], ['notifications', 'Notifications'], ['gifs', 'GIFs']];
    settingsModal = modal(`<div class="settings">
      <nav class="set-nav"><div class="set-nav-inner">
        <h6>User Settings</h6>${nav.map(n => n ? `<button data-stab="${n[0]}">${n[1]}</button>` : '<div class="set-sep"></div><h6>App Settings</h6>').join('')}
        <div class="set-sep"></div><button class="danger" data-act="logout">${ic('logout')} Log Out</button>
        <p class="set-ver">Biscuit 1.0 · ${S.b.mode === 'server' ? 'Server mode' : 'Local mode'}</p>
      </div></nav>
      <div class="set-main"><div class="set-content"></div><button class="set-close" data-act="close-modal" title="Close (Esc)">${ic('x')}<span>ESC</span></button></div>
    </div>`, { cls: 'full', onClose: () => { settingsModal = null; S.profileDraft = null; } });
    const el = settingsModal.el;
    el.addEventListener('click', e => { const b = e.target.closest('[data-stab]'); if (b) showSettingsTab(b.dataset.stab); });
    showSettingsTab(tab || 'account');
  }
  function showSettingsTab(tab) {
    const el = settingsModal.el;
    $$('[data-stab]', el).forEach(b => b.classList.toggle('active', b.dataset.stab === tab));
    const c = $('.set-content', el);
    c.scrollTop = 0;
    el.querySelector('.settings').dataset.tab = tab;
    const u = S.me;
    if (tab === 'account') {
      c.innerHTML = `<h2>My Account</h2>
        <div class="acct-card">${profileCardHTML(u, { preview: true })}</div>
        <div class="set-group"><h3>Username</h3><form class="inline-form" data-form="username"><input name="username" value="${esc(u.username)}" maxlength="32" autocapitalize="none" spellcheck="false"><button class="btn primary">Save</button></form>
        <p class="hint">2–32 characters: letters, numbers, <code>_</code> and <code>.</code></p></div>
        <div class="set-group"><h3>Password</h3><form class="pw-form" data-form="password"><input type="password" name="current" placeholder="Current password" autocomplete="current-password"><input type="password" name="next" placeholder="New password (6+ characters)" autocomplete="new-password"><button class="btn primary">Change Password</button></form></div>
        <div class="set-group"><h3>Where your data lives</h3><p class="hint">${S.b.mode === 'server' ? 'You are connected to a Biscuit server. Your account, messages and uploads live on that server.' : 'Local mode: no server is running, so everything is stored in this browser only. Start the Biscuit server (<code>npm start</code>) to chat with friends on other devices.'}</p></div>`;
    } else if (tab === 'profiles') {
      profileEditor(c);
    } else if (tab === 'golden') {
      c.innerHTML = `<h2>Golden Biscuit</h2>${goldenHTML()}`;
    } else if (tab === 'appearance') {
      c.innerHTML = `<h2>Appearance</h2>
        <div class="set-group"><h3>Theme</h3><div class="theme-grid">${THEMES.map(([id, name, g]) => `<button class="theme-sw ${prefs.theme === id ? 'active' : ''}" data-theme-pick="${id}"><span style="background:linear-gradient(135deg,${g[0]},${g[1]})"></span>${name}</button>`).join('')}</div>
        <p class="hint">✨ Gradient themes are a Golden Biscuit perk, free for everyone.</p></div>
        <div class="set-group"><h3>Message display</h3><div class="seg"><button data-pref="compact" data-val="" class="${prefs.compact ? '' : 'active'}">Cozy</button><button data-pref="compact" data-val="1" class="${prefs.compact ? 'active' : ''}">Compact</button></div></div>
        <div class="set-group"><h3>Chat font scaling: <b id="fs-val">${prefs.fontScale}%</b></h3><input type="range" min="80" max="130" step="5" value="${prefs.fontScale}" data-range="fontScale"></div>
        <div class="set-group"><label class="toggle"><input type="checkbox" data-check="reduceMotion" ${prefs.reduceMotion ? 'checked' : ''}><span></span>Reduce motion (turns off decorations, effects and super-reaction bursts)</label></div>`;
    } else if (tab === 'notifications') {
      const perm = 'Notification' in window ? Notification.permission : 'unsupported';
      c.innerHTML = `<h2>Notifications</h2>
        <div class="set-group"><label class="toggle"><input type="checkbox" data-check="notify" ${prefs.notify ? 'checked' : ''}><span></span>Desktop notifications for DMs and @mentions</label><p class="hint">Browser permission: <b>${perm}</b></p></div>
        <div class="set-group"><label class="toggle"><input type="checkbox" data-check="sound" ${prefs.sound ? 'checked' : ''}><span></span>Play a sound for DMs and @mentions</label></div>`;
    } else if (tab === 'gifs') {
      c.innerHTML = `<h2>GIFs</h2>
        <div class="set-group"><h3>Built in, no setup</h3><p class="hint">🍪 Biscuit GIFs and the ✨ GIF Maker are generated in your browser. You can also upload any GIF file, paste GIF links into chat, and star GIFs to keep them in Favorites.</p></div>
        <div class="set-group"><h3>GIF search (optional)</h3>
          <p class="hint">${S.b.mode === 'server' && S.b.config.gifSearch ? '✅ This server already has GIF search turned on.' : 'To search GIPHY, paste a free API key from <a href="https://developers.giphy.com/dashboard/" target="_blank" rel="noopener">developers.giphy.com</a>. It is saved in this browser only.'}</p>
          <form class="inline-form" data-form="giphy"><input name="key" type="password" placeholder="GIPHY API key" value="${esc(store.get('biscuit.giphyKey') || '')}" autocomplete="off"><button class="btn primary">Save</button></form></div>`;
    }
  }

  // ---- profile editor (live preview, unsaved-changes bar)
  const PROFILE_FIELDS = ['displayName', 'pronouns', 'avatar', 'banner', 'bannerColor', 'accent', 'theme', 'bio', 'decoration', 'effect', 'nameColor', 'nameColor2', 'nameFont', 'customStatus'];
  function profileEditor(c) {
    const d = S.profileDraft || (S.profileDraft = JSON.parse(JSON.stringify(Object.assign({}, S.me))));
    const decoPrev = id => `<button class="pick ${d.decoration === id ? 'active' : ''}" data-pf-set="decoration" data-val="${id}">${avatarHTML(Object.assign({}, d, { decoration: id, presence: 'online' }), 48, { status: false, noact: true })}<span>${DECO_NAMES[id]}</span></button>`;
    const fxPrev = id => `<button class="pick fx-pick ${d.effect === id ? 'active' : ''}" data-pf-set="effect" data-val="${id}"><div class="fx-swatch fx-${id}"><div class="pc-fx"></div></div><span>${FX_NAMES[id]}</span></button>`;
    const colorField = (label, field, idx) => {
      const v = idx == null ? d[field] : d[field][idx];
      return `<label class="color-field"><span>${label}</span><span class="cf-row"><input type="color" value="${v || '#e8a33d'}" data-pf-color="${field}" ${idx != null ? `data-idx="${idx}"` : ''}><button type="button" class="icon-btn" data-pf-clear="${field}" ${idx != null ? `data-idx="${idx}"` : ''} title="Clear">${ic('x')}</button>${v ? '' : '<small>off</small>'}</span></label>`;
    };
    c.innerHTML = `<h2>Profiles</h2>
      <div class="pf-golden">✨ Every option on this page is a Golden Biscuit perk, and they're all free.</div>
      <div class="pf-layout">
        <div class="pf-form">
          <div class="set-group"><h3>Display Name</h3><input data-pf="displayName" value="${esc(d.displayName)}" maxlength="${LIMITS.displayName}"></div>
          <div class="set-group"><h3>Pronouns</h3><input data-pf="pronouns" value="${esc(d.pronouns)}" maxlength="${LIMITS.pronouns}" placeholder="Add your pronouns"></div>
          <div class="set-group"><h3>Avatar</h3><div class="btn-row"><button class="btn primary" data-pf-upload="avatar">${ic('upload')} Change Avatar</button>${d.avatar ? '<button class="btn ghost" data-pf-remove="avatar">Remove Avatar</button>' : ''}</div><p class="hint">PNG, JPG, WEBP or an <b>animated GIF</b>. GIFs animate everywhere.</p></div>
          <div class="set-group"><h3>Avatar Decoration</h3><div class="pick-grid">${DECORATIONS.map(decoPrev).join('')}</div></div>
          <div class="set-group"><h3>Profile Effect</h3><div class="pick-grid">${EFFECTS.map(fxPrev).join('')}</div></div>
          <div class="set-group"><h3>Banner</h3><div class="btn-row"><button class="btn primary" data-pf-upload="banner">${ic('upload')} Change Banner</button>${d.banner ? '<button class="btn ghost" data-pf-remove="banner">Remove Banner</button>' : ''}</div><p class="hint">Recommended 600×240. Animated GIFs work.</p>${colorField('Banner color (used when there is no banner image)', 'bannerColor')}</div>
          <div class="set-group"><h3>Profile Theme</h3><div class="row2">${colorField('Primary', 'theme', 0)}${colorField('Accent', 'theme', 1)}</div>
            <div class="preset-row">${THEME_PRESETS.map(p => `<button class="preset" data-preset="${p[0]},${p[1]}" style="background:linear-gradient(135deg,${p[0]},${p[1]})" title="${p[0]} → ${p[1]}"></button>`).join('')}</div></div>
          <div class="set-group"><h3>Display Name Style</h3><div class="row2">${colorField('Color', 'nameColor')}${colorField('Gradient end', 'nameColor2')}</div>
            <div class="chip-row">${FONTS.map(f => `<button class="chip font-${f} ${d.nameFont === f ? 'active' : ''}" data-pf-set="nameFont" data-val="${f}">${FONT_NAMES[f]}</button>`).join('')}</div></div>
          <div class="set-group"><h3>Custom Status</h3><div class="row-status"><button class="maker-emoji" data-pf-status-emoji title="Pick an emoji">${d.customStatus.emoji ? renderEmojiToken(d.customStatus.emoji) : '😶'}</button><input data-pf-status value="${esc(d.customStatus.text)}" maxlength="${LIMITS.status}" placeholder="What's happening?"></div></div>
          <div class="set-group"><h3>About Me</h3><textarea data-pf="bio" rows="5" maxlength="${LIMITS.bio}" placeholder="Tell everyone about yourself. Markdown and emoji work!">${esc(d.bio)}</textarea><p class="hint right"><span id="bio-count">${LIMITS.bio - d.bio.length}</span> left</p></div>
        </div>
        <div class="pf-preview"><h3>Preview</h3><div id="pf-card">${profileCardHTML(d, { preview: true })}</div>
          <div class="pf-chat-prev"><h3>In chat</h3><div class="msg"><div class="msg-row"><div class="msg-av">${avatarHTML(d, 40, { status: false, noact: true })}</div><div class="msg-body"><div class="msg-head">${nameHTML(d)}<time>Today at ${fmtTime(Date.now())}</time></div><div class="msg-content">Look at my new profile ✨</div></div></div></div></div>
        </div>
      </div>
      <div class="savebar" hidden><span>Careful, you have unsaved changes!</span><button class="btn link" data-pf-reset>Reset</button><button class="btn ok" data-pf-save>Save Changes</button></div>`;
    bindProfileEditor(c);
    updateDirty(c);
  }
  function profileDiff() {
    const d = S.profileDraft, out = {};
    if (!d) return out;
    for (const k of PROFILE_FIELDS) if (JSON.stringify(d[k]) !== JSON.stringify(S.me[k])) out[k] = d[k];
    return out;
  }
  function updateDirty(c) {
    const dirty = Object.keys(profileDiff()).length > 0;
    const bar = $('.savebar', c);
    if (bar) bar.hidden = !dirty;
  }
  function refreshPreview(c, full) {
    if (full) { const top = c.scrollTop; profileEditor(c); c.scrollTop = top; return; }
    $('#pf-card', c).innerHTML = profileCardHTML(S.profileDraft, { preview: true });
    const prev = $('.pf-chat-prev .msg-row', c);
    if (prev) { $('.msg-av', prev).innerHTML = avatarHTML(S.profileDraft, 40, { status: false, noact: true }); $('.msg-head .uname', prev).outerHTML = nameHTML(S.profileDraft); }
    updateDirty(c);
  }
  function bindProfileEditor(c) {
    if (c._bound) return;
    c._bound = true;
    c.addEventListener('input', e => {
      const d = S.profileDraft;
      if (!d || settingsModal.el.querySelector('.settings').dataset.tab !== 'profiles') return;
      const t = e.target;
      if (t.dataset.pf) { d[t.dataset.pf] = t.value; if (t.dataset.pf === 'bio') $('#bio-count', c).textContent = LIMITS.bio - t.value.length; refreshPreview(c); }
      if (t.dataset.pfColor) {
        const f = t.dataset.pfColor;
        if (t.dataset.idx != null) { d[f] = d[f].slice(); d[f][+t.dataset.idx] = t.value; if (!d[f][1 - t.dataset.idx]) d[f][1 - t.dataset.idx] = t.value; }
        else d[f] = t.value;
        refreshPreview(c);
      }
      if ('pfStatus' in t.dataset) { d.customStatus = Object.assign({}, d.customStatus, { text: t.value }); refreshPreview(c); }
    });
    c.addEventListener('change', e => { if (e.target.dataset.pfColor) refreshPreview(c, true); });
    c.addEventListener('click', async e => {
      const d = S.profileDraft;
      if (!d || settingsModal.el.querySelector('.settings').dataset.tab !== 'profiles') return;
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.pfSet) { d[b.dataset.pfSet] = b.dataset.val; refreshPreview(c, true); }
      else if (b.dataset.pfClear) { const f = b.dataset.pfClear; if (b.dataset.idx != null) d[f] = ['', '']; else d[f] = ''; refreshPreview(c, true); }
      else if (b.dataset.preset) { d.theme = b.dataset.preset.split(','); refreshPreview(c, true); }
      else if (b.dataset.pfUpload) { const r = await uploadImage('image/*'); if (r) { d[b.dataset.pfUpload] = r.url; refreshPreview(c, true); toast('Looking good! Remember to save.', 'ok'); } }
      else if (b.dataset.pfRemove) { d[b.dataset.pfRemove] = ''; refreshPreview(c, true); }
      else if ('pfStatusEmoji' in b.dataset) {
        emojiPicker(b, p => { d.customStatus = Object.assign({}, d.customStatus, { emoji: p.custom ? `<:${p.custom.name}:${p.custom.id}>` : p.char }); refreshPreview(c, true); }, { keep: true, place: 'bottom' });
      } else if ('pfReset' in b.dataset) { S.profileDraft = null; profileEditor(c); }
      else if ('pfSave' in b.dataset) {
        const diff = profileDiff();
        b.disabled = true;
        try {
          S.me = await call('updateProfile', diff);
          S.users[S.me.id] = S.me;
          S.profileDraft = null;
          profileEditor(c);
          toast('Profile saved ✨', 'ok');
          renderAll();
        } catch {} finally { b.disabled = false; }
      }
    });
  }

  // ------------------------------------------------------------------ server modals
  function addServerModal(startJoin) {
    const m = modal(`<div class="m-head center"><h2>${startJoin ? 'Join a Server' : 'Create Your Server'}</h2><p class="muted">${startJoin ? 'Enter an invite code or link below.' : 'Your server is where you and your friends hang out. Make yours and start talking.'}</p></div>
      <div class="m-body">
        ${startJoin ? `<form data-form="join"><label class="field"><span>Invite link or code</span><input name="code" placeholder="biscuit  or  ${esc(inviteLink('hTKzmak'))}" autofocus></label><button class="btn primary block">Join Server</button></form>`
        : `<form data-form="create"><div class="icon-up" data-act="cs-icon"><div class="iu-circle">${ic('upload')}<span>UPLOAD</span></div></div><input type="hidden" name="icon">
            <label class="field"><span>Server name</span><input name="name" value="${esc(dname(S.me))}'s server" maxlength="100" autofocus></label>
            <button class="btn primary block">Create</button></form>
           <div class="m-or"><span>Have an invite already?</span><button class="btn ghost block" data-swap>Join a Server</button></div>`}
      </div>`, { cls: 'small' });
    const swap = m.el.querySelector('[data-swap]');
    if (swap) swap.onclick = () => { m.close(); addServerModal(true); };
    m.el.addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.target;
      try {
        if (f.dataset.form === 'join') {
          m.close();
          await joinInvite(f.code.value.trim());
        } else {
          const r = await call('createServer', { name: f.name.value, icon: f.icon.value });
          m.close();
          const st = await S.b.state(); load(st);
          prefs.serverOrder.push(r.serverId); savePrefs();
          go(r.serverId, r.channelId);
          toast('Server created! Invite your friends 🎉', 'ok');
        }
      } catch {}
    });
    m.el.addEventListener('click', async e => {
      if (e.target.closest('[data-act="cs-icon"]')) {
        e.stopPropagation();
        const r = await uploadImage('image/*');
        if (r) { m.el.querySelector('[name=icon]').value = r.url; m.el.querySelector('.iu-circle').innerHTML = `<img src="${esc(r.url)}" alt="">`; }
      }
    }, true);
  }
  function inviteModal() {
    const sv = S.servers[S.route.sid];
    if (!sv) return;
    const link = inviteLink(sv.invite);
    const m = modal(`<div class="m-head"><h2>Invite friends to ${esc(sv.name)}</h2></div><div class="m-body">
      <label class="field"><span>Send a server invite link to a friend</span><div class="copy-row"><input readonly value="${esc(link)}"><button class="btn primary" data-copy>Copy</button></div></label>
      <p class="hint">Invite code: <code>${esc(sv.invite)}</code>. Friends can also paste the code in <b>Join a Server</b>.${S.b.mode === 'local' ? '<br><b>Local mode:</b> invites only work in this browser. Run the Biscuit server to invite friends on other devices.' : ''}</p>
      ${isOwner(sv) ? '<p class="hint">✨ Want a custom link? Set a vanity invite in <a href="#" data-act="server-settings" data-tab="invites">Server Settings → Invites</a>.</p>' : ''}</div>`, { cls: 'small' });
    m.el.querySelector('[data-copy]').onclick = () => copy(link);
  }

  let serverModal = null;
  function openServerSettings(tab) {
    const sv = S.servers[S.route.sid];
    if (!sv || !isOwner(sv)) return;
    closePopovers();
    if (serverModal) serverModal.close();
    serverModal = modal(`<div class="settings">
      <nav class="set-nav"><div class="set-nav-inner"><h6>${esc(sv.name)}</h6>
        ${[['overview', 'Overview'], ['emoji', 'Emoji'], ['channels', 'Channels'], ['invites', 'Invites']].map(([id, l]) => `<button data-svtab="${id}">${l}</button>`).join('')}
        ${sv.id !== S.hqId ? `<div class="set-sep"></div><button class="danger" data-sv-delete>Delete Server ${ic('trash')}</button>` : ''}
      </div></nav>
      <div class="set-main"><div class="set-content"></div><button class="set-close" data-act="close-modal">${ic('x')}<span>ESC</span></button></div></div>`, { cls: 'full', onClose: () => { serverModal = null; } });
    const el = serverModal.el;
    el.addEventListener('click', async e => {
      const t = e.target.closest('[data-svtab]');
      if (t) return serverTab(t.dataset.svtab);
      if (e.target.closest('[data-sv-delete]')) {
        if (await confirmBox(`Delete '${sv.name}'`, `Are you sure you want to delete <b>${esc(sv.name)}</b>? This cannot be undone.`, 'Delete Server', true)) {
          try { await call('deleteServer', { serverId: sv.id }); serverModal.close(); go('@me'); toast('Server deleted'); } catch {}
        }
      }
    });
    serverTab(tab || 'overview');
  }
  function serverTab(tab) {
    const el = serverModal.el, c = $('.set-content', el), sv = S.servers[S.route.sid];
    if (!sv) return serverModal.close();
    $$('[data-svtab]', el).forEach(b => b.classList.toggle('active', b.dataset.svtab === tab));
    const save = async patch => { try { await call('updateServer', Object.assign({ serverId: sv.id }, patch)); toast('Saved', 'ok'); setTimeout(() => serverTab(tab), 50); } catch {} };
    if (tab === 'overview') {
      c.innerHTML = `<h2>Server Overview</h2>
        <div class="sv-over"><div class="sv-icon-big rail-ic">${serverIcon(sv)}</div><div><p class="hint">We recommend an image of at least 512×512. <b>Animated GIF icons</b> are free ✨</p><div class="btn-row"><button class="btn primary" data-up="icon">${ic('upload')} Upload Image</button>${sv.icon ? '<button class="btn ghost" data-rm="icon">Remove</button>' : ''}</div></div></div>
        <div class="set-group"><h3>Server Name</h3><form class="inline-form" data-sv-name><input name="name" value="${esc(sv.name)}" maxlength="100"><button class="btn primary">Save</button></form></div>
        <div class="set-group"><h3>Description</h3><form class="inline-form" data-sv-desc><input name="description" value="${esc(sv.description || '')}" maxlength="300" placeholder="What's this server about?"><button class="btn primary">Save</button></form></div>
        <div class="set-group"><h3>Server Banner ✨</h3>${sv.banner ? `<div class="sv-banner-prev" style="background-image:url('${esc(sv.banner)}')"></div>` : ''}<div class="btn-row"><button class="btn primary" data-up="banner">${ic('upload')} Upload Banner</button>${sv.banner ? '<button class="btn ghost" data-rm="banner">Remove</button>' : ''}</div>
          <label class="color-field"><span>Banner color</span><span class="cf-row"><input type="color" value="${sv.bannerColor || '#e8a33d'}" data-svcolor><button class="icon-btn" data-rm="bannerColor">${ic('x')}</button>${sv.bannerColor ? '' : '<small>off</small>'}</span></label></div>`;
    } else if (tab === 'emoji') {
      const list = Object.values(S.emojis).filter(e => e.serverId === sv.id);
      c.innerHTML = `<h2>Emoji</h2><p class="hint">Add up to ${LIMITS.emojisPerServer} custom emoji. Anyone in the server can use them, <b>in any server and any DM</b> (a Golden Biscuit perk, free). Animated GIF emoji work too.</p>
        <form class="emoji-add" data-emoji-add><button type="button" class="btn primary" data-pick-emoji>${ic('upload')} Choose image</button><img class="ea-prev" hidden alt=""><input name="name" placeholder="emoji_name" maxlength="32" pattern="[A-Za-z0-9_]{2,32}"><input type="hidden" name="url"><button class="btn ok">Add Emoji</button></form>
        <div class="emoji-table">${list.length ? list.map(e => `<div class="et-row"><img src="${esc(e.url)}" alt=""><code>:${esc(e.name)}:</code><span class="muted">${esc(dname(user(e.by)))}</span><button class="icon-btn danger" data-rm-emoji="${e.id}" title="Delete">${ic('trash')}</button></div>`).join('') : '<p class="muted">No custom emoji yet.</p>'}</div>`;
    } else if (tab === 'channels') {
      c.innerHTML = `<h2>Channels</h2><div class="ch-table">${sv.channels.map(id => S.channels[id]).filter(Boolean).map(ch => `<div class="ct-row">${ic('hash')}<b>${esc(ch.name)}</b><span class="muted">${esc(ch.topic || '')}</span><button class="icon-btn" data-act="edit-channel" data-cid="${ch.id}">${ic('edit')}</button></div>`).join('')}</div>
        <button class="btn primary" data-act="new-channel">${ic('plus')} Create Channel</button>`;
    } else if (tab === 'invites') {
      c.innerHTML = `<h2>Invites</h2>
        <div class="set-group"><h3>Invite link</h3><div class="copy-row"><input readonly value="${esc(inviteLink(sv.invite))}"><button class="btn primary" data-copy-inv>Copy</button></div></div>
        <div class="set-group"><h3>Vanity invite ✨</h3><p class="hint">Choose your own code: 3–32 lowercase letters, numbers or dashes.</p><form class="inline-form" data-sv-vanity><input name="invite" value="${esc(sv.invite)}" maxlength="32"><button class="btn primary">Save</button></form></div>
        <div class="set-group"><h3>Reset</h3><p class="hint">Make a new random code. The old link stops working.</p><button class="btn danger" data-reset-inv>Reset Invite</button></div>`;
    }
    c.onsubmit = async e => {
      e.preventDefault();
      const f = e.target;
      if ('svName' in f.dataset) save({ name: f.name.value });
      if ('svDesc' in f.dataset) save({ description: f.description.value });
      if ('svVanity' in f.dataset) save({ invite: f.invite.value });
      if ('emojiAdd' in f.dataset) {
        if (!f.url.value) return toast('Choose an image first', 'err');
        try { await call('addEmoji', { serverId: sv.id, name: f.name.value, url: f.url.value, animated: /gif/i.test(f.dataset.type || '') }); toast(`Added :${f.name.value}:`, 'ok'); setTimeout(() => serverTab('emoji'), 50); } catch {}
      }
    };
    c.onchange = e => { if ('svcolor' in e.target.dataset) save({ bannerColor: e.target.value }); };
    c.onclick = async e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.up) { const r = await uploadImage('image/*'); if (r) save({ [b.dataset.up]: r.url }); }
      if (b.dataset.rm) save({ [b.dataset.rm]: '' });
      if ('copyInv' in b.dataset) copy(inviteLink(sv.invite));
      if ('resetInv' in b.dataset) { try { await call('resetInvite', { serverId: sv.id }); setTimeout(() => serverTab('invites'), 50); } catch {} }
      if (b.dataset.rmEmoji) { try { await call('removeEmoji', { emojiId: b.dataset.rmEmoji }); setTimeout(() => serverTab('emoji'), 50); } catch {} }
      if ('pickEmoji' in b.dataset) {
        const [file] = await pickFile('image/png,image/gif,image/webp,image/jpeg');
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return toast('Emoji images can be up to 2 MB', 'err');
        try {
          const r = await S.b.upload(file);
          const f = b.form;
          f.url.value = r.url; f.dataset.type = file.type;
          const pv = $('.ea-prev', f); pv.src = r.url; pv.hidden = false;
          if (!f.name.value) f.name.value = file.name.replace(/\.\w+$/, '').replace(/[^A-Za-z0-9_]/g, '_').slice(0, 32);
        } catch (err) { toast(err.message, 'err'); }
      }
    };
  }
  async function editChannel(cid) {
    const ch = S.channels[cid];
    if (!ch) return;
    const m = modal(`<div class="m-head"><h2>Edit #${esc(ch.name)}</h2></div><form class="m-body">
      <label class="field"><span>Channel name</span><input name="name" value="${esc(ch.name)}" maxlength="100" autofocus></label>
      <label class="field"><span>Topic</span><textarea name="topic" rows="3" maxlength="1024">${esc(ch.topic || '')}</textarea></label></form>
      <div class="m-foot"><button class="btn danger left" data-del>Delete Channel</button><button class="btn ghost" data-close>Cancel</button><button class="btn primary" data-save>Save</button></div>`, { cls: 'small' });
    const f = m.el.querySelector('form');
    const save = async () => { try { await call('updateChannel', { channelId: cid, name: f.name.value, topic: f.topic.value }); m.close(); } catch {} };
    f.onsubmit = e => { e.preventDefault(); save(); };
    m.el.querySelector('[data-save]').onclick = save;
    m.el.querySelector('[data-close]').onclick = () => m.close();
    m.el.querySelector('[data-del]').onclick = async () => {
      if (await confirmBox('Delete Channel', `Delete <b>#${esc(ch.name)}</b> and all of its messages?`, 'Delete Channel', true)) { try { await call('deleteChannel', { channelId: cid }); m.close(); } catch {} }
    };
  }

  // ------------------------------------------------------------------ menus
  function serverMenu(anchor) {
    const sv = S.servers[S.route.sid];
    const own = isOwner(sv);
    const el = popover(anchor, `<div class="menu">
      <button data-m="invite" class="accent">Invite People ${ic('users')}</button>
      ${own ? `<button data-m="settings">Server Settings ${ic('gear')}</button><button data-m="channel">Create Channel ${ic('plus')}</button><button data-m="emoji">Add Emoji ${ic('smile')}</button>` : ''}
      <div class="menu-sep"></div>
      <button data-m="copy">Copy Invite Code ${ic('copy')}</button>
      <button data-m="read">Mark As Read ${ic('eye')}</button>
      ${!own ? `<div class="menu-sep"></div><button data-m="leave" class="danger">Leave Server ${ic('logout')}</button>` : ''}
    </div>`, { cls: 'menu-pop', place: 'bottom' });
    el.style.width = anchor.offsetWidth - 16 + 'px';
    el.style.left = anchor.getBoundingClientRect().left + 8 + 'px';
    el.onclick = async e => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      closePop(el);
      const k = b.dataset.m;
      if (k === 'invite') inviteModal();
      if (k === 'settings') openServerSettings();
      if (k === 'emoji') openServerSettings('emoji');
      if (k === 'channel') ACT['new-channel']();
      if (k === 'copy') copy(sv.invite);
      if (k === 'read') sv.channels.forEach(markRead);
      if (k === 'leave' && await confirmBox(`Leave '${sv.name}'`, `Are you sure you want to leave <b>${esc(sv.name)}</b>?`, 'Leave Server', true)) {
        try { await call('leaveServer', { serverId: sv.id }); go('@me'); } catch {}
      }
    };
  }
  function statusMenu(anchor) {
    const u = S.me;
    const opts = [['online', 'Online', ''], ['idle', 'Idle', ''], ['dnd', 'Do Not Disturb', 'You will not receive desktop notifications'], ['invisible', 'Invisible', 'You will appear offline']];
    const el = popover(anchor, `<div class="menu status-menu">
      <div class="sm-card">${avatarHTML(Object.assign({}, u, { presence: u.status === 'invisible' ? 'offline' : u.status }), 48, { noact: true })}<div><b style="${nameStyle(u)}">${esc(dname(u))}</b><small>@${esc(u.username)}</small></div></div>
      <button data-cs>${customStatusHTML(u) ? `${customStatusHTML(u)} <span class="muted small">(edit)</span>` : '😶 Set a custom status'}</button>
      <div class="menu-sep"></div>
      ${opts.map(([id, l, sub]) => `<button data-st="${id}" class="${u.status === id ? 'sel' : ''}"><i class="st-inline st-${id === 'invisible' ? 'offline' : id}"></i><span>${l}${sub ? `<small>${sub}</small>` : ''}</span></button>`).join('')}
      <div class="menu-sep"></div>
      <button data-act="settings" data-tab="profiles">${ic('edit')} Edit Profile</button>
      <button data-copyid>${ic('copy')} Copy Username</button>
      ${S.b.mode === 'local' ? `<button data-act="logout">${ic('users')} Switch Accounts</button>` : ''}
    </div>`, { cls: 'menu-pop', place: 'top' });
    el.onclick = async e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.st) { closePop(el); try { S.me = await call('updateProfile', { status: b.dataset.st }); S.users[S.me.id] = S.me; renderUserPanel(); } catch {} }
      if ('cs' in b.dataset) { closePop(el); customStatusModal(); }
      if ('copyid' in b.dataset) { closePop(el); copy(u.username); }
    };
  }
  function customStatusModal() {
    const cs = Object.assign({ emoji: '', text: '' }, S.me.customStatus);
    const m = modal(`<div class="m-head center"><div class="cs-art">💭</div><h2>Set a custom status</h2></div><form class="m-body">
      <label class="field"><span>What's cookin', ${esc(dname(S.me))}?</span><div class="row-status"><button type="button" class="maker-emoji" data-e>${cs.emoji ? renderEmojiToken(cs.emoji) : '😶'}</button><input name="text" value="${esc(cs.text)}" maxlength="${LIMITS.status}" placeholder="Support has arrived!" autofocus></div></label>
      <div class="chip-row">${['🍪 Snacking', '🎮 Gaming', '📚 Studying', '💻 Coding', '🎧 Vibing', '😴 Sleeping'].map(s => `<button type="button" class="chip" data-q="${s}">${s}</button>`).join('')}</div></form>
      <div class="m-foot"><button class="btn link left" data-clear>Clear status</button><button class="btn ghost" data-close>Cancel</button><button class="btn primary" data-save>Save</button></div>`, { cls: 'small' });
    const f = m.el.querySelector('form');
    const save = async () => { try { S.me = await call('updateProfile', { customStatus: { emoji: cs.emoji, text: f.text.value } }); S.users[S.me.id] = S.me; renderAll(); m.close(); } catch {} };
    f.onsubmit = e => { e.preventDefault(); save(); };
    m.el.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      if ('e' in b.dataset) emojiPicker(b, p => { cs.emoji = p.custom ? `<:${p.custom.name}:${p.custom.id}>` : p.char; b.innerHTML = renderEmojiToken(cs.emoji); }, { keep: true, place: 'bottom' });
      if (b.dataset.q) { const [e1, ...rest] = b.dataset.q.split(' '); cs.emoji = e1; f.text.value = rest.join(' '); $('[data-e]', m.el).textContent = e1; }
      if ('save' in b.dataset) save();
      if ('close' in b.dataset) m.close();
      if ('clear' in b.dataset) { cs.emoji = ''; f.text.value = ''; save(); }
    };
  }
  function quickDM() {
    const people = Object.values(S.users).filter(u => u.id !== S.me.id).sort((a, b) => dname(a).localeCompare(dname(b)));
    const m = modal(`<div class="m-head"><h2>Start a conversation</h2><p class="muted">Type a username, or pick someone you know.</p></div>
      <form class="m-body"><input name="q" placeholder="Username" autocomplete="off" autofocus spellcheck="false"><div class="qd-list">${people.map(u => `<button type="button" class="qd-item" data-uid="${u.id}" data-s="${esc((u.username + ' ' + dname(u)).toLowerCase())}">${avatarHTML(u, 32, { noact: true })}<span>${esc(dname(u))}</span><small>@${esc(u.username)}</small></button>`).join('')}</div></form>`, { cls: 'small' });
    const f = m.el.querySelector('form');
    f.q.oninput = () => { const q = f.q.value.toLowerCase().replace(/^@/, ''); $$('.qd-item', m.el).forEach(b => { b.hidden = !!q && !b.dataset.s.includes(q); }); };
    f.onsubmit = async e => { e.preventDefault(); const vis = $$('.qd-item', m.el).filter(b => !b.hidden); if (vis.length === 1) return openDM({ userId: vis[0].dataset.uid }, m); openDM({ username: f.q.value }, m); };
    m.el.onclick = e => { const b = e.target.closest('.qd-item'); if (b) openDM({ userId: b.dataset.uid }, m); };
  }
  async function openDM(args, m) {
    try {
      const ch = await call('openDM', args);
      if (m) m.close();
      closePopovers();
      if (!S.channels[ch.id]) { const st = await S.b.state(); load(st); }
      document.body.classList.remove('drawer-open');
      go('@me', ch.id);
    } catch {}
  }

  // ------------------------------------------------------------------ actions
  const msgOf = el => { const m = el.closest('.msg'); return m && m.dataset.mid; };
  const ACT = {
    go: el => {
      // on phones the server rail keeps the drawer open so you can pick a channel next
      if (el.dataset.cid || el.closest('.sidebar') || el.closest('.view')) document.body.classList.remove('drawer-open');
      go(el.dataset.sid, el.dataset.cid);
    },
    profile: el => showProfile(el.dataset.uid, el),
    dm: el => openDM({ userId: el.dataset.uid }),
    'add-server': () => addServerModal(false),
    'join-server': () => addServerModal(true),
    'quick-dm': () => quickDM(),
    'server-menu': el => serverMenu(el),
    'status-menu': el => statusMenu(el),
    settings: el => openSettings(el.dataset.tab),
    'server-settings': el => { if (topModal()) topModal().close(); openServerSettings(el.dataset.tab); },
    'close-modal': () => { const m = topModal(); if (m) m.close(); },
    invite: () => inviteModal(),
    'new-channel': async () => {
      const name = await prompt2('Create Channel', 'Channel name', '', 'Create Channel');
      if (!name) return;
      try { const ch = await call('createChannel', { serverId: S.route.sid, name }); go(S.route.sid, ch.id); } catch {}
    },
    'edit-channel': (el, e) => { e.stopPropagation(); editChannel(el.dataset.cid); },
    'friends-tab': el => { S.friendsTab = el.dataset.tab; renderHead(); renderView(); },
    'toggle-members': () => {
      if (innerWidth <= 1100) document.body.classList.toggle('members-open');
      else { S.showMembers = S.showMembers === false; renderHead(); renderMembers(); }
    },
    'open-drawer': () => document.body.classList.add('drawer-open'),
    'close-drawers': () => document.body.classList.remove('drawer-open', 'members-open'),
    send: () => send(),
    'attach-menu': el => {
      const p = popover(el, `<div class="menu attach-menu">
        <button data-a="file">${ic('upload')} Upload a File</button>
        <button data-a="shot">${ic('monitor')} Take a Screenshot</button>
        <button data-a="image">${ic('image')} Upload a Photo</button>
        <button data-a="gif">${ic('wand')} Make a GIF</button>
        <p class="menu-hint">Tip: paste a screenshot with Ctrl+V, or drop files anywhere.</p></div>`, { cls: 'menu-pop', place: 'top' });
      p.style.left = el.getBoundingClientRect().left + 'px';
      p.onclick = async e => {
        const b = e.target.closest('[data-a]');
        if (!b) return;
        closePop(p);
        if (b.dataset.a === 'file') addFiles(await pickFile('', true));
        if (b.dataset.a === 'image') addFiles(await pickFile('image/*,video/*', true));
        if (b.dataset.a === 'shot') captureScreen();
        if (b.dataset.a === 'gif') { S.gifTab = 'make'; gifPicker($('[data-act="gif-picker"]')); }
      };
    },
    'emoji-picker': el => emojiPicker(el, p => {
      const t = $('#input');
      insertAt(t, p.custom ? `:${p.custom.name}: ` : p.char);
    }),
    'gif-picker': el => gifPicker(el),
    'tray-remove': el => { const id = el.closest('[data-pid]').dataset.pid; S.pending = S.pending.filter(p => p.id !== id); renderTray(); },
    'tray-spoiler': el => { const p = S.pending.find(x => x.id === el.closest('[data-pid]').dataset.pid); if (p) { p.spoiler = !p.spoiler; renderTray(); } },
    'cancel-reply': () => { S.replyTo = null; renderReplyBar(); renderMessages(); },
    reply: el => { S.replyTo = msgOf(el); renderReplyBar(); renderMessages(); $('#input').focus(); },
    edit: el => startEdit(msgOf(el)),
    'cancel-edit': () => cancelEdit(),
    'save-edit': () => saveEdit(),
    delete: (el, e) => deleteMessage(msgOf(el), e.shiftKey),
    'copy-msg': el => { const m = findMsg(S.route.cid, msgOf(el)); if (m) copy(toEditable(m.content)); },
    'quick-react': el => call('react', { channelId: S.route.cid, messageId: msgOf(el), emoji: el.dataset.emoji }).catch(() => {}),
    'react-picker': el => {
      const mid = msgOf(el), sup = !!el.dataset.super;
      emojiPicker(el, p => call('react', { channelId: S.route.cid, messageId: mid, emoji: p.char, emojiId: p.custom && p.custom.id, super: sup }).catch(() => {}), { super: sup, place: 'left' });
    },
    'toggle-react': el => {
      const key = el.dataset.key;
      call('react', { channelId: S.route.cid, messageId: msgOf(el), emoji: key.startsWith('c:') ? '' : key, emojiId: key.startsWith('c:') ? key.slice(2) : '', super: !!el.dataset.super }).catch(() => {});
    },
    jump: el => {
      const t = $('#m-' + CSS.escape(el.dataset.mid));
      if (t) { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 1600); }
      else toast('That message is too far back. Scroll up to load it.');
    },
    'load-more': () => loadMore(),
    lightbox: el => lightbox(el.dataset.src, el.dataset.name),
    reveal: el => el.closest('.spoilered').classList.remove('spoilered'),
    spoiler: el => el.classList.add('revealed'),
    'fav-gif': async (el, e) => { e.stopPropagation(); await toggleFav({ url: el.dataset.url, w: +el.dataset.w, h: +el.dataset.h }); },
    logout: async () => {
      if (settingsModal) settingsModal.close();
      closePopovers();
      await S.b.logout();
      S.me = null;
      location.hash = '';
      showAuth('login');
    },
    'auth-pick': el => { $('#auth-form [name=username]').value = el.dataset.name; $('#auth-form [name=password]').focus(); },
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (!t || t.closest('[data-noact]')) return;
    const fn = ACT[t.dataset.act];
    if (!fn) return;
    if (t.tagName === 'A' || t.tagName === 'BUTTON') e.preventDefault();
    fn(t, e);
  });
  document.addEventListener('submit', async e => {
    const f = e.target;
    const kind = f.dataset && f.dataset.form;
    if (!kind) return;
    e.preventDefault();
    if (kind === 'start-dm') { if (f.username.value.trim()) openDM({ username: f.username.value.trim() }); }
    if (kind === 'username') { try { S.me = await call('updateProfile', { username: f.username.value }); S.users[S.me.id] = S.me; toast('Username updated', 'ok'); renderAll(); } catch {} }
    if (kind === 'password') { try { await S.b.changePassword(f.current.value, f.next.value); f.reset(); toast('Password changed', 'ok'); } catch (err) { toast(err.message, 'err'); } }
    if (kind === 'giphy') { store.set('biscuit.giphyKey', f.key.value.trim() || null); toast(f.key.value.trim() ? 'GIF search is on 🎉' : 'GIPHY key removed', 'ok'); }
  });
  document.addEventListener('click', e => {
    const tp = e.target.closest('[data-theme-pick]');
    if (tp) { prefs.theme = tp.dataset.themePick; savePrefs(); applyPrefs(); $$('[data-theme-pick]').forEach(b => b.classList.toggle('active', b === tp)); }
    const pf = e.target.closest('[data-pref]');
    if (pf) { prefs[pf.dataset.pref] = !!pf.dataset.val; savePrefs(); applyPrefs(); $$(`[data-pref="${pf.dataset.pref}"]`).forEach(b => b.classList.toggle('active', b === pf)); }
  });
  document.addEventListener('input', e => {
    const r = e.target.dataset && e.target.dataset.range;
    if (r) { prefs[r] = +e.target.value; savePrefs(); applyPrefs(); const v = $('#fs-val'); if (v) v.textContent = e.target.value + '%'; }
  });
  document.addEventListener('change', async e => {
    const k = e.target.dataset && e.target.dataset.check;
    if (!k) return;
    prefs[k] = e.target.checked;
    if (k === 'notify' && e.target.checked && 'Notification' in window && Notification.permission !== 'granted') {
      const p = await Notification.requestPermission();
      if (p !== 'granted') { prefs.notify = false; e.target.checked = false; toast('Notifications are blocked by your browser', 'err'); }
    }
    savePrefs(); applyPrefs();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (pops.length) { closePop(pops[pops.length - 1]); return; }
      if (modals.length) { modals[modals.length - 1].close(); return; }
      if (S.editing) cancelEdit();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && S.me) { e.preventDefault(); quickDM(); }
    // typing anywhere focuses the composer
    if (S.me && !modals.length && !pops.length && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && $('#input') && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) $('#input').focus();
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.me && S.route.cid && S.stick) markRead(S.route.cid); });

  // drag & drop files anywhere
  let dragDepth = 0;
  const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  window.addEventListener('dragenter', e => {
    if (!hasFiles(e) || !S.me || S.route.page !== 'chat') return;
    dragDepth++;
    const ch = S.channels[S.route.cid];
    $('#dz-target').textContent = ch ? (ch.type === 'dm' ? 'to @' + dname(dmOther(ch)) : 'to #' + ch.name) : '';
    $('#dropzone').hidden = false;
  });
  window.addEventListener('dragleave', e => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('#dropzone').hidden = true; });
  window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    $('#dropzone').hidden = true;
    if (S.me && S.route.page === 'chat') addFiles([...e.dataTransfer.files]);
  });
  // drag servers to reorder
  let dragSid = null;
  document.addEventListener('dragstart', e => { const t = e.target.closest && e.target.closest('[data-drag]'); if (t) { dragSid = t.dataset.drag; e.dataTransfer.effectAllowed = 'move'; } });
  document.addEventListener('dragover', e => { if (dragSid && e.target.closest && e.target.closest('[data-drag]')) e.preventDefault(); });
  document.addEventListener('drop', e => {
    const t = dragSid && e.target.closest && e.target.closest('[data-drag]');
    if (!t) { dragSid = null; return; }
    e.preventDefault();
    const order = myServers().map(s => s.id).filter(id => id !== dragSid);
    order.splice(order.indexOf(t.dataset.drag), 0, dragSid);
    prefs.serverOrder = order; savePrefs(); dragSid = null; renderRail();
  });

  window.addEventListener('resize', () => { if (innerWidth > 860) document.body.classList.remove('drawer-open'); });

  boot();
})();
