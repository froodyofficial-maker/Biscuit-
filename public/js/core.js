// Biscuit core: the whole chat model (users, servers, channels, messages, reactions, emoji, the bot).
// It is a classic script so it runs unchanged in three places:
//   * the Node server (server.mjs imports it and drives it over HTTP),
//   * the browser in "local mode" (no server: data lives in this browser),
//   * plain <script> tags opened straight from disk.
// It never touches the network or storage itself; the host passes in emit() and changed() callbacks.
(function () {
  'use strict';

  const LIMITS = {
    message: 4000,          // 2x the usual cap: a Golden Biscuit perk, free for everyone
    attachments: 10,
    uploadMB: 100,          // server mode
    localUploadMB: 25,      // local mode keeps files in the browser
    bio: 400,
    displayName: 32,
    username: 100,
    pronouns: 40,
    status: 128,
    serverName: 100,
    channelName: 100,
    topic: 1024,
    emojisPerServer: 250,
    favGifs: 200,
    reactionsPerMessage: 20,
    keepMessages: 5000,
  };

  const DECORATIONS = ['none', 'rainbow', 'fire', 'neon', 'gold', 'sparkle', 'crown', 'hearts', 'catears', 'halo', 'glitch'];
  const EFFECTS = ['none', 'confetti', 'snow', 'stars', 'hearts', 'bubbles', 'aurora', 'embers'];
  const FONTS = ['default', 'serif', 'mono', 'rounded', 'script', 'chunky'];
  const STATUSES = ['online', 'idle', 'dnd', 'invisible'];
  const BOT_ID = 'u-biscuit-bot';
  const TEMPLATES = {
    custom: [['general', 'Say hi!'], ['memes', 'GIFs and screenshots']],
    gaming: [['general', 'Talk about anything'], ['looking-for-group', 'Find people to play with'], ['clips-and-highlights', 'Show off your best plays'], ['memes', 'GIFs and screenshots']],
    friends: [['general', 'Hang out'], ['plans', 'What are we doing this weekend?'], ['photos', 'Pics or it didn\'t happen'], ['memes', 'GIFs and screenshots']],
    study: [['welcome-and-rules', 'Read me first'], ['general', 'Chat'], ['homework-help', 'Ask questions, share answers'], ['resources', 'Notes, links and files'], ['off-topic', 'Take a break']],
    club: [['announcements', 'News from the club'], ['general', 'Chat'], ['events', 'Meetups and dates'], ['ideas', 'Pitch your ideas']],
    creators: [['showcase', 'Share what you made'], ['general', 'Chat'], ['feedback', 'Ask for feedback'], ['inspiration', 'References and mood boards']],
    community: [['welcome', 'Say hi and introduce yourself'], ['general', 'Chat'], ['events', 'What\'s happening'], ['off-topic', 'Anything goes']],
  };
  const HQ_ID = 's-biscuit-hq';

  class BiscuitError extends Error {
    constructor(message, code) { super(message); this.code = code || 400; }
  }
  const fail = (msg, code) => { throw new BiscuitError(msg, code); };

  // Time-sortable ids: comparing two ids as strings compares their creation time.
  let lastT = 0, seq = 0;
  function newId(prefix) {
    const t = Date.now();
    seq = t === lastT ? seq + 1 : 0;
    lastT = t;
    const rand = Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0');
    return (prefix || '') + t.toString(36).padStart(9, '0') + seq.toString(36).padStart(2, '0') + rand;
  }
  function randomCode(n) {
    const a = 'abcdefghijkmnopqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }

  function text(v, max, name, opts) {
    if (v == null) return '';
    if (typeof v !== 'string') fail(`${name} must be text`);
    v = (opts && opts.keepLines) ? v.replace(/\r\n?/g, '\n').replace(/^\s*\n|\s+$/g, '') : v.replace(/\s+/g, ' ').trim();
    if (v.length > max) fail(`${name} is too long (max ${max} characters)`);
    return v;
  }
  const HEX = /^#[0-9a-f]{6}$/i;
  function color(v) {
    if (v == null || v === '') return '';
    if (typeof v !== 'string' || !HEX.test(v)) fail('Colors must look like #ff8800');
    return v.toLowerCase();
  }
  function oneOf(v, list, name) {
    if (!list.includes(v)) fail(`Unknown ${name}`);
    return v;
  }
  function num(v, min, max) {
    v = Number(v);
    return Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : 0;
  }

  class Core {
    constructor(state, opts) {
      opts = opts || {};
      this.s = state && state.users ? state : { users: {}, servers: {}, channels: {}, messages: {}, emojis: {}, invites: {} };
      for (const k of ['users', 'servers', 'channels', 'messages', 'emojis', 'invites']) this.s[k] = this.s[k] || {};
      this.emitFn = opts.emit || (() => {});
      this.changedFn = opts.changed || (() => {});
      this.allowDataUrls = !!opts.allowDataUrls;
      this.botDelay = opts.botDelay == null ? 700 : opts.botDelay;
      this.online = new Set();
      this.ensureHQ();
    }

    // ---------- helpers ----------
    emit(ev, audience) { this.emitFn(ev, audience ? [...audience] : null); }
    changed() { this.changedFn(); }

    url(u, name) {
      if (u == null || u === '') return '';
      if (typeof u !== 'string') fail(`${name || 'Link'} is invalid`);
      if (/^\/uploads\/[A-Za-z0-9._-]{1,120}$/.test(u)) return u;
      if (/^https:\/\/[^\s"'<>()\\`]{3,2000}$/.test(u)) return u;
      if (this.allowDataUrls && /^data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/i.test(u)) return u;
      fail(`${name || 'Link'} is invalid`);
    }
    user(id) { return this.s.users[id] || fail('That user does not exist', 404); }
    server(id) { return this.s.servers[id] || fail('That server does not exist', 404); }
    channel(id) { return this.s.channels[id] || fail('That channel does not exist', 404); }
    memberIds(ch) {
      if (ch.type === 'dm') return ch.members;
      const sv = this.s.servers[ch.serverId];
      return sv ? sv.members : [];
    }
    canSee(uid, ch) { return this.memberIds(ch).includes(uid); }
    seeChannel(uid, id) {
      const ch = this.channel(id);
      if (!this.canSee(uid, ch)) fail('You do not have access to that channel', 403);
      return ch;
    }
    ownServer(uid, id) {
      const sv = this.server(id);
      if (sv.ownerId !== uid) fail('Only the server owner can do that', 403);
      return sv;
    }
    knownUsers(uid) {
      const out = new Set([uid]);
      for (const sv of Object.values(this.s.servers)) if (sv.members.includes(uid)) sv.members.forEach(m => out.add(m));
      for (const ch of Object.values(this.s.channels)) if (ch.type === 'dm' && ch.members.includes(uid)) ch.members.forEach(m => out.add(m));
      return out;
    }
    presence(u) {
      if (u.bot) return 'online';
      if (!this.online.has(u.id) || u.status === 'invisible') return 'offline';
      return u.status;
    }
    publicUser(u, viewer) {
      const p = this.presence(u);
      const out = Object.assign({}, u, { presence: p });
      if (viewer !== u.id) { out.status = p; delete out.favGifs; }
      return out;
    }
    emitUser(u) {
      const others = this.knownUsers(u.id);
      others.delete(u.id);
      this.emit({ t: 'user', user: this.publicUser(u, null) }, others);
      this.emit({ t: 'user', user: this.publicUser(u, u.id) }, [u.id]);
    }
    usersFor(ids, viewer) { return ids.map(id => this.s.users[id]).filter(Boolean).map(u => this.publicUser(u, viewer)); }

    // ---------- bootstrap ----------
    ensureHQ() {
      if (!this.s.users[BOT_ID]) {
        const bot = this.blankUser(BOT_ID, 'biscuit', 'Biscuit');
        Object.assign(bot, {
          bot: true, accent: '#e8a33d', bannerColor: '#e8a33d', theme: ['#f6c46a', '#a0522d'], decoration: 'gold', effect: 'embers',
          pronouns: 'it/crumbs', bio: "Hi! I'm Biscuit, the house bot. Type **!help** anywhere I live and I'll show you what I can do. 🍪",
          customStatus: { emoji: '🍪', text: 'Freshly baked' },
        });
        this.s.users[BOT_ID] = bot;
      }
      if (!this.s.servers[HQ_ID]) {
        const sv = {
          id: HQ_ID, name: 'Biscuit HQ', icon: '', banner: '', bannerColor: '#e8a33d', ownerId: BOT_ID,
          members: [BOT_ID], channels: [], invite: 'biscuit', createdAt: Date.now(), description: 'The official home of Biscuit.',
        };
        this.s.servers[HQ_ID] = sv;
        this.s.invites.biscuit = HQ_ID;
        const mk = (name, topic) => {
          const ch = { id: newId('c-'), serverId: HQ_ID, type: 'text', name, topic, createdAt: Date.now(), lastMessageId: '', lastAuthorId: '' };
          this.s.channels[ch.id] = ch;
          sv.channels.push(ch.id);
          this.s.messages[ch.id] = [];
          return ch;
        };
        const welcome = mk('welcome', 'Start here!');
        mk('general', 'Talk about anything');
        mk('memes', 'GIFs, screenshots and chaos');
        mk('show-your-profile', 'Show off your banner, decoration and profile effect');
        this.post(BOT_ID, welcome, {
          content:
            '# Welcome to Biscuit! 🍪\n' +
            'Everything that would usually cost extra is **free** here. That is the Golden Biscuit:\n' +
            '> 🎞️ animated avatars, banners and server icons\n' +
            '> 🎨 profile themes, avatar decorations and profile effects\n' +
            '> 😀 custom emoji in every server, plus super reactions\n' +
            '> 📎 uploads up to 100 MB and 4,000-character messages\n' +
            '> 🌈 gradient app themes and styled display names\n\n' +
            'Open **User Settings → Profiles** (the ⚙️ next to your name) to make your profile yours. ' +
            'Type `!help` to see what I can do.',
        });
      }
    }

    blankUser(id, username, displayName) {
      return {
        id, username, displayName: displayName || username, avatar: '', banner: '', bannerColor: '', accent: '',
        theme: ['', ''], bio: '', pronouns: '', status: 'online', customStatus: { emoji: '', text: '' },
        decoration: 'none', effect: 'none', nameColor: '', nameColor2: '', nameFont: 'default',
        favGifs: [], bot: false, golden: true, createdAt: Date.now(),
      };
    }

    // Usernames can be anything. Matching ignores upper/lower case, and "@name" also finds "name".
    findUserByUsername(name) {
      const key = String(name == null ? '' : name).trim().replace(/\s+/g, ' ').toLowerCase();
      if (!key) return null;
      const all = Object.values(this.s.users);
      return all.find(u => u.username.toLowerCase() === key) ||
        (key.startsWith('@') ? all.find(u => u.username.toLowerCase() === key.slice(1)) : null) || null;
    }

    validUsername(name) {
      name = String(name == null ? '' : name).trim().replace(/\s+/g, ' ');
      if (!name) fail('Type a username');
      if (name.length > LIMITS.username) fail(`That username is too long (max ${LIMITS.username} characters)`);
      return name;
    }

    createUser(username, displayName) {
      username = this.validUsername(username);
      if (this.findUserByUsername(username)) fail('That username is taken', 409);
      const u = this.blankUser(newId('u-'), username, text(displayName, LIMITS.displayName, 'Display name') || username);
      const palette = ['#e8a33d', '#5865f2', '#3ba55d', '#eb459e', '#ed4245', '#1abc9c', '#9b59b6', '#f47b67'];
      u.accent = palette[Math.floor(Math.random() * palette.length)];
      this.s.users[u.id] = u;
      // Everyone lands in Biscuit HQ so the app is never empty.
      const hq = this.s.servers[HQ_ID];
      if (hq && !hq.members.includes(u.id)) {
        hq.members.push(u.id);
        this.emit({ t: 'server', server: hq, users: [this.publicUser(u, null)] }, hq.members.filter(m => m !== u.id));
        const general = hq.channels.map(id => this.s.channels[id]).find(c => c && c.name === 'general');
        if (general) {
          const lines = [
            `Welcome to Biscuit HQ, <@${u.id}>! Grab a biscuit 🍪`,
            `<@${u.id}> just showed up. Everyone act natural 👀`,
            `A wild <@${u.id}> appeared! 🎉`,
            `<@${u.id}> joined the party. Who brought the tea? ☕`,
          ];
          this.post(BOT_ID, general, { content: lines[Math.floor(Math.random() * lines.length)] });
        }
      }
      this.changed();
      return u;
    }

    setOnline(uid, on) {
      const u = this.s.users[uid];
      if (!u) return;
      const before = this.presence(u);
      if (on) this.online.add(uid); else this.online.delete(uid);
      if (before !== this.presence(u)) this.emitUser(u);
    }

    viewFor(uid) {
      const me = this.user(uid);
      const servers = [], channels = [], messages = {}, hasMore = {};
      for (const sv of Object.values(this.s.servers)) {
        if (!sv.members.includes(uid)) continue;
        servers.push(sv);
        for (const cid of sv.channels) if (this.s.channels[cid]) channels.push(this.s.channels[cid]);
      }
      for (const ch of Object.values(this.s.channels)) if (ch.type === 'dm' && ch.members.includes(uid)) channels.push(ch);
      for (const ch of channels) {
        const all = this.s.messages[ch.id] || [];
        messages[ch.id] = all.slice(-60);
        hasMore[ch.id] = all.length > 60;
      }
      const users = {};
      for (const id of this.knownUsers(uid)) if (this.s.users[id]) users[id] = this.publicUser(this.s.users[id], uid);
      return {
        me: this.publicUser(me, uid), users, servers, channels, messages, hasMore,
        emojis: Object.values(this.s.emojis), limits: LIMITS, botId: BOT_ID, hqId: HQ_ID,
      };
    }

    // ---------- profile ----------
    updateProfile(uid, p) {
      const u = this.user(uid);
      if (!p || typeof p !== 'object') fail('Nothing to update');
      const next = {};
      if ('username' in p) {
        const name = this.validUsername(p.username);
        const other = this.findUserByUsername(name);
        if (other && other.id !== uid) fail('That username is taken', 409);
        next.username = name;
      }
      if ('displayName' in p) next.displayName = text(p.displayName, LIMITS.displayName, 'Display name') || (next.username || u.username);
      if ('avatar' in p) next.avatar = this.url(p.avatar, 'Avatar');
      if ('banner' in p) next.banner = this.url(p.banner, 'Banner');
      if ('bannerColor' in p) next.bannerColor = color(p.bannerColor);
      if ('accent' in p) next.accent = color(p.accent);
      if ('theme' in p) {
        if (!Array.isArray(p.theme) || p.theme.length !== 2) fail('A profile theme needs two colors');
        next.theme = [color(p.theme[0]), color(p.theme[1])];
      }
      if ('bio' in p) next.bio = text(p.bio, LIMITS.bio, 'About me', { keepLines: true });
      if ('pronouns' in p) next.pronouns = text(p.pronouns, LIMITS.pronouns, 'Pronouns');
      if ('status' in p) next.status = oneOf(p.status, STATUSES, 'status');
      if ('customStatus' in p) {
        const cs = p.customStatus || {};
        next.customStatus = { emoji: text(cs.emoji, 64, 'Status emoji'), text: text(cs.text, LIMITS.status, 'Custom status') };
      }
      if ('decoration' in p) next.decoration = oneOf(p.decoration, DECORATIONS, 'decoration');
      if ('effect' in p) next.effect = oneOf(p.effect, EFFECTS, 'profile effect');
      if ('nameColor' in p) next.nameColor = color(p.nameColor);
      if ('nameColor2' in p) next.nameColor2 = color(p.nameColor2);
      if ('nameFont' in p) next.nameFont = oneOf(p.nameFont, FONTS, 'font');
      if ('favGifs' in p) {
        if (!Array.isArray(p.favGifs)) fail('Favorites must be a list');
        next.favGifs = p.favGifs.slice(0, LIMITS.favGifs).map(g => ({
          url: this.url(g && g.url, 'GIF'), w: num(g.w, 0, 4096), h: num(g.h, 0, 4096),
        }));
      }
      Object.assign(u, next);
      this.emitUser(u);
      this.changed();
      return this.publicUser(u, uid);
    }

    // ---------- servers ----------
    createServer(uid, p) {
      this.user(uid);
      const name = text(p && p.name, LIMITS.serverName, 'Server name');
      if (!name) fail('Give your server a name');
      const sv = {
        id: newId('s-'), name, icon: this.url(p.icon, 'Icon'), banner: '', bannerColor: '', ownerId: uid,
        members: [uid], channels: [], invite: '', createdAt: Date.now(), description: '',
      };
      sv.invite = this.freeInvite();
      this.s.invites[sv.invite] = sv.id;
      this.s.servers[sv.id] = sv;
      for (const [n, t] of TEMPLATES[p.template] || TEMPLATES.custom) {
        const ch = { id: newId('c-'), serverId: sv.id, type: 'text', name: n, topic: t, createdAt: Date.now(), lastMessageId: '', lastAuthorId: '' };
        this.s.channels[ch.id] = ch;
        this.s.messages[ch.id] = [];
        sv.channels.push(ch.id);
      }
      this.changed();
      this.emit({ t: 'refresh' }, [uid]);
      return { serverId: sv.id, channelId: sv.channels[0] };
    }
    freeInvite() {
      let code;
      do code = randomCode(8); while (this.s.invites[code]);
      return code;
    }
    updateServer(uid, p) {
      const sv = this.ownServer(uid, p && p.serverId);
      if ('name' in p) { const n = text(p.name, LIMITS.serverName, 'Server name'); if (!n) fail('Server name cannot be empty'); sv.name = n; }
      if ('icon' in p) sv.icon = this.url(p.icon, 'Icon');
      if ('banner' in p) sv.banner = this.url(p.banner, 'Banner');
      if ('bannerColor' in p) sv.bannerColor = color(p.bannerColor);
      if ('description' in p) sv.description = text(p.description, 300, 'Description');
      if ('invite' in p) {
        // Vanity invite links: a Golden Biscuit perk.
        const code = String(p.invite || '').trim().toLowerCase();
        if (!/^[a-z0-9-]{3,32}$/.test(code)) fail('Invite codes are 3–32 characters: letters, numbers and -');
        if (this.s.invites[code] && this.s.invites[code] !== sv.id) fail('That invite code is taken', 409);
        delete this.s.invites[sv.invite];
        sv.invite = code;
        this.s.invites[code] = sv.id;
      }
      this.emit({ t: 'server', server: sv }, sv.members);
      this.changed();
      return sv;
    }
    resetInvite(uid, p) {
      const sv = this.ownServer(uid, p && p.serverId);
      delete this.s.invites[sv.invite];
      sv.invite = this.freeInvite();
      this.s.invites[sv.invite] = sv.id;
      this.emit({ t: 'server', server: sv }, sv.members);
      this.changed();
      return sv;
    }
    deleteServer(uid, p) {
      const sv = this.ownServer(uid, p && p.serverId);
      if (sv.id === HQ_ID) fail('Biscuit HQ cannot be deleted');
      for (const cid of sv.channels) { delete this.s.channels[cid]; delete this.s.messages[cid]; }
      for (const e of Object.values(this.s.emojis)) if (e.serverId === sv.id) delete this.s.emojis[e.id];
      delete this.s.invites[sv.invite];
      delete this.s.servers[sv.id];
      this.emit({ t: 'server-remove', id: sv.id }, sv.members);
      this.changed();
      return true;
    }
    leaveServer(uid, p) {
      const sv = this.server(p && p.serverId);
      if (sv.ownerId === uid) fail('Owners cannot leave their own server. Delete it instead.');
      if (!sv.members.includes(uid)) return true;
      sv.members = sv.members.filter(m => m !== uid);
      this.emit({ t: 'server-remove', id: sv.id }, [uid]);
      this.emit({ t: 'server', server: sv }, sv.members);
      this.changed();
      return true;
    }
    joinServer(uid, p) {
      this.user(uid);
      let code = String((p && p.code) || '').trim();
      code = code.split(/[/#]/).filter(Boolean).pop() || '';
      code = code.toLowerCase();
      const sid = this.s.invites[code];
      const sv = sid && this.s.servers[sid];
      if (!sv) fail('That invite is invalid or has expired', 404);
      if (!sv.members.includes(uid)) {
        sv.members.push(uid);
        this.emit({ t: 'server', server: sv, users: [this.publicUser(this.s.users[uid], null)] }, sv.members.filter(m => m !== uid));
        this.emit({ t: 'refresh' }, [uid]);
        const first = this.s.channels[sv.channels[0]];
        if (first) this.post(BOT_ID, first, { content: `👋 <@${uid}> joined **${sv.name}**.`, system: true }, true);
        this.changed();
      }
      return { serverId: sv.id, channelId: sv.channels[0] || '' };
    }

    // ---------- channels ----------
    channelName(n) {
      n = String(n || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '').replace(/-+/g, '-').slice(0, LIMITS.channelName);
      if (!n) fail('Give the channel a name');
      return n;
    }
    createChannel(uid, p) {
      const sv = this.ownServer(uid, p && p.serverId);
      if (sv.channels.length >= 200) fail('That server has too many channels');
      const ch = {
        id: newId('c-'), serverId: sv.id, type: 'text', name: this.channelName(p.name), topic: text(p.topic, LIMITS.topic, 'Topic'),
        createdAt: Date.now(), lastMessageId: '', lastAuthorId: '',
      };
      this.s.channels[ch.id] = ch;
      this.s.messages[ch.id] = [];
      sv.channels.push(ch.id);
      this.emit({ t: 'channel', channel: ch }, sv.members);
      this.emit({ t: 'server', server: sv }, sv.members);
      this.changed();
      return ch;
    }
    updateChannel(uid, p) {
      const ch = this.channel(p && p.channelId);
      if (ch.type !== 'text') fail('That channel cannot be edited');
      this.ownServer(uid, ch.serverId);
      if ('name' in p) ch.name = this.channelName(p.name);
      if ('topic' in p) ch.topic = text(p.topic, LIMITS.topic, 'Topic');
      this.emit({ t: 'channel', channel: ch }, this.memberIds(ch));
      this.changed();
      return ch;
    }
    deleteChannel(uid, p) {
      const ch = this.channel(p && p.channelId);
      if (ch.type !== 'text') fail('That channel cannot be deleted');
      const sv = this.ownServer(uid, ch.serverId);
      if (sv.channels.length <= 1) fail('A server needs at least one channel');
      sv.channels = sv.channels.filter(c => c !== ch.id);
      delete this.s.channels[ch.id];
      delete this.s.messages[ch.id];
      this.emit({ t: 'channel-remove', id: ch.id, serverId: sv.id }, sv.members);
      this.emit({ t: 'server', server: sv }, sv.members);
      this.changed();
      return true;
    }
    openDM(uid, p) {
      this.user(uid);
      const other = p.userId ? this.user(p.userId) : this.findUserByUsername(p.username);
      if (!other) fail(`Nobody is called "${String(p.username || '').replace(/^@/, '')}"`, 404);
      if (other.id === uid) fail("That's you! Try messaging someone else.");
      let ch = Object.values(this.s.channels).find(c => c.type === 'dm' && c.members.includes(uid) && c.members.includes(other.id));
      if (!ch) {
        ch = { id: newId('d-'), type: 'dm', members: [uid, other.id], createdAt: Date.now(), lastMessageId: '', lastAuthorId: '' };
        this.s.channels[ch.id] = ch;
        this.s.messages[ch.id] = [];
        for (const m of ch.members) {
          this.emit({ t: 'channel', channel: ch, users: this.usersFor(ch.members, m) }, [m]);
        }
        this.changed();
      }
      return ch;
    }

    // ---------- emoji ----------
    addEmoji(uid, p) {
      const sv = this.ownServer(uid, p && p.serverId);
      const name = String(p.name || '').trim().replace(/^:|:$/g, '');
      if (!/^[A-Za-z0-9_]{2,32}$/.test(name)) fail('Emoji names are 2–32 characters: letters, numbers and _');
      const mine = Object.values(this.s.emojis).filter(e => e.serverId === sv.id);
      if (mine.length >= LIMITS.emojisPerServer) fail('This server is out of emoji slots');
      if (mine.some(e => e.name.toLowerCase() === name.toLowerCase())) fail('This server already has an emoji with that name');
      const url = this.url(p.url, 'Emoji image');
      if (!url) fail('Upload an image for the emoji');
      const e = { id: newId('e-'), serverId: sv.id, name, url, animated: !!p.animated, by: uid, createdAt: Date.now() };
      this.s.emojis[e.id] = e;
      this.emit({ t: 'emoji', emoji: e }, null);
      this.changed();
      return e;
    }
    removeEmoji(uid, p) {
      const e = this.s.emojis[p && p.emojiId] || fail('That emoji does not exist', 404);
      this.ownServer(uid, e.serverId);
      delete this.s.emojis[e.id];
      this.emit({ t: 'emoji-remove', id: e.id }, null);
      this.changed();
      return true;
    }

    // ---------- messages ----------
    findMessage(ch, id) {
      const list = this.s.messages[ch.id] || [];
      for (let i = list.length - 1; i >= 0; i--) if (list[i].id === id) return list[i];
      return null;
    }
    cleanAttachments(list) {
      if (list == null) return [];
      if (!Array.isArray(list)) fail('Attachments must be a list');
      if (list.length > LIMITS.attachments) fail(`You can attach up to ${LIMITS.attachments} files`);
      return list.map(a => ({
        url: this.url(a && a.url, 'Attachment'),
        name: text(String((a && a.name) || 'file').slice(0, 200), 200, 'File name') || 'file',
        type: /^[a-z]+\/[a-z0-9.+-]+$/i.test(a.type || '') ? a.type.toLowerCase() : 'application/octet-stream',
        size: num(a.size, 0, 1e10), w: num(a.w, 0, 20000), h: num(a.h, 0, 20000), spoiler: !!a.spoiler,
      })).filter(a => a.url);
    }
    post(authorId, ch, m, silentEmit) {
      const msg = {
        id: newId('m-'), channelId: ch.id, authorId, content: m.content || '', attachments: m.attachments || [],
        gif: m.gif || null, reply: m.reply || null, reactions: [], mentions: [], createdAt: Date.now(), editedAt: 0,
        system: !!m.system,
      };
      msg.mentions = [...new Set((msg.content.match(/<@([A-Za-z0-9-]+)>/g) || []).map(s => s.slice(2, -1)))].filter(id => this.s.users[id]);
      const list = this.s.messages[ch.id] || (this.s.messages[ch.id] = []);
      list.push(msg);
      if (list.length > LIMITS.keepMessages) list.splice(0, list.length - LIMITS.keepMessages);
      ch.lastMessageId = msg.id;
      ch.lastAuthorId = authorId;
      this.emit({ t: 'message', message: msg }, this.memberIds(ch));
      if (!silentEmit) this.changed();
      return msg;
    }
    sendMessage(uid, p) {
      const ch = this.seeChannel(uid, p && p.channelId);
      const content = text(p.content, LIMITS.message, 'Message', { keepLines: true });
      const attachments = this.cleanAttachments(p.attachments);
      let gif = null;
      if (p.gif) gif = { url: this.url(p.gif.url, 'GIF'), w: num(p.gif.w, 0, 4096), h: num(p.gif.h, 0, 4096), title: text(String(p.gif.title || '').slice(0, 100), 100, 'GIF title') };
      if (!content && !attachments.length && !(gif && gif.url)) fail('Your message is empty');
      let reply = null;
      if (p.replyTo) {
        const r = this.findMessage(ch, p.replyTo);
        if (r) reply = { id: r.id, authorId: r.authorId, content: r.content.slice(0, 160), hasMedia: !!(r.attachments.length || r.gif) };
      }
      const msg = this.post(uid, ch, { content, attachments, gif, reply });
      this.maybeBot(ch, msg);
      return msg;
    }
    editMessage(uid, p) {
      const ch = this.seeChannel(uid, p && p.channelId);
      const m = this.findMessage(ch, p.messageId) || fail('That message does not exist', 404);
      if (m.authorId !== uid) fail('You can only edit your own messages', 403);
      const content = text(p.content, LIMITS.message, 'Message', { keepLines: true });
      if (!content && !m.attachments.length && !m.gif) fail('A message cannot be empty. Delete it instead.');
      m.content = content;
      m.mentions = [...new Set((content.match(/<@([A-Za-z0-9-]+)>/g) || []).map(s => s.slice(2, -1)))].filter(id => this.s.users[id]);
      m.editedAt = Date.now();
      this.emit({ t: 'message-update', message: m }, this.memberIds(ch));
      this.changed();
      return m;
    }
    deleteMessage(uid, p) {
      const ch = this.seeChannel(uid, p && p.channelId);
      const list = this.s.messages[ch.id] || [];
      const i = list.findIndex(m => m.id === p.messageId);
      if (i < 0) fail('That message does not exist', 404);
      const m = list[i];
      const owner = ch.type === 'text' && this.s.servers[ch.serverId] && this.s.servers[ch.serverId].ownerId === uid;
      if (m.authorId !== uid && !owner) fail('You can only delete your own messages', 403);
      list.splice(i, 1);
      if (ch.lastMessageId === m.id) {
        const last = list[list.length - 1];
        ch.lastMessageId = last ? last.id : '';
        ch.lastAuthorId = last ? last.authorId : '';
      }
      this.emit({ t: 'message-remove', channelId: ch.id, id: m.id }, this.memberIds(ch));
      this.changed();
      return true;
    }
    react(uid, p) {
      const ch = this.seeChannel(uid, p && p.channelId);
      const m = this.findMessage(ch, p.messageId) || fail('That message does not exist', 404);
      let key, name = '', url = '';
      if (p.emojiId) {
        const e = this.s.emojis[p.emojiId] || fail('That emoji does not exist', 404);
        key = 'c:' + e.id; name = e.name; url = e.url;
      } else {
        const e = String(p.emoji || '');
        if (!e || e.length > 32 || /[<>"'&\s]/.test(e)) fail('That is not an emoji');
        key = e;
      }
      const sup = !!p.super;
      let r = m.reactions.find(x => x.key === key && !!x.super === sup);
      if (!r) {
        if (m.reactions.length >= LIMITS.reactionsPerMessage) fail('That message has too many reactions');
        r = { key, name, url, super: sup, users: [] };
        m.reactions.push(r);
      }
      const i = r.users.indexOf(uid);
      if (i >= 0) r.users.splice(i, 1); else r.users.push(uid);
      if (!r.users.length) m.reactions = m.reactions.filter(x => x !== r);
      this.emit({ t: 'message-update', message: m, reacted: i < 0 ? { key, super: sup, by: uid } : null }, this.memberIds(ch));
      this.changed();
      return m;
    }
    typing(uid, p) {
      const ch = this.seeChannel(uid, p && p.channelId);
      this.emit({ t: 'typing', channelId: ch.id, userId: uid }, this.memberIds(ch).filter(m => m !== uid));
      return true;
    }
    getMessages(uid, p) {
      const ch = this.seeChannel(uid, p && p.channelId);
      const list = this.s.messages[ch.id] || [];
      let end = list.length;
      if (p.before) { end = list.findIndex(m => m.id >= p.before); if (end < 0) end = list.length; }
      const start = Math.max(0, end - 60);
      return { messages: list.slice(start, end), hasMore: start > 0 };
    }
    getUser(uid, p) {
      return this.publicUser(this.user(p && p.userId), uid);
    }

    // ---------- the bot ----------
    maybeBot(ch, msg) {
      if (msg.authorId === BOT_ID || !this.memberIds(ch).includes(BOT_ID)) return;
      const isDM = ch.type === 'dm';
      const text0 = msg.content.replace(/<@[A-Za-z0-9-]+>/g, '').trim();
      if (!isDM && !msg.mentions.includes(BOT_ID) && !text0.startsWith('!')) return;
      const reply = this.botReply(text0, msg);
      if (!reply) return;
      const go = () => {
        if (!this.s.channels[ch.id]) return;
        this.post(BOT_ID, ch, Object.assign({ reply: { id: msg.id, authorId: msg.authorId, content: msg.content.slice(0, 160), hasMedia: !!(msg.attachments.length || msg.gif) } }, reply));
      };
      if (this.botDelay) {
        setTimeout(() => this.emit({ t: 'typing', channelId: ch.id, userId: BOT_ID }, this.memberIds(ch)), 150);
        setTimeout(go, this.botDelay + Math.random() * 500);
      } else go();
    }
    botReply(t, msg) {
      const pick = a => a[Math.floor(Math.random() * a.length)];
      const me = `<@${msg.authorId}>`;
      const [cmd0, ...rest] = t.split(/\s+/);
      const cmd = (cmd0 || '').toLowerCase();
      const arg = rest.join(' ');
      switch (cmd) {
        case '!help': return { content:
          '**Things I can do** 🍪\n' +
          '`!roll 2d6` roll dice\n`!flip` flip a coin\n`!8ball <question>` ask the magic biscuit\n' +
          '`!choose pizza, tacos` I pick for you\n`!joke` a terrible joke\n`!hug @someone` spread love\n' +
          '`!avatar` show your avatar\n`!golden` list every free perk\n`!poll question | a | b` start a quick poll\n\n' +
          'You can also just DM me or @mention me.' };
        case '!roll': {
          const m = /^(\d{1,2})?d(\d{1,4})$/i.exec(arg || 'd6');
          if (!m) return { content: 'Try `!roll 2d6` 🎲' };
          const n = Math.max(1, Math.min(20, +(m[1] || 1))), sides = Math.max(2, +m[2]);
          const rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * sides));
          return { content: `🎲 ${me} rolled **${rolls.reduce((a, b) => a + b, 0)}**${n > 1 ? ` (${rolls.join(' + ')})` : ''}` };
        }
        case '!flip': return { content: `🪙 ${pick(['**Heads!**', '**Tails!**'])}` };
        case '!8ball': return { content: arg ? `🎱 ${pick(['It is certain.', 'Without a doubt.', 'Ask again after a biscuit.', 'Signs point to yes.', 'My crumbs say no.', 'Very doubtful.', 'Absolutely, 100%.', 'Not today.', 'Better not tell you now 👀'])}` : 'Ask me a question: `!8ball will it rain?`' };
        case '!choose': {
          const opts = arg.split(/,|\bor\b|\|/).map(s => s.trim()).filter(Boolean);
          return { content: opts.length > 1 ? `🤔 I choose **${pick(opts).replace(/[*_`~|]/g, '')}**` : 'Give me choices: `!choose pizza, tacos, sushi`' };
        }
        case '!joke': return { content: pick([
          'Why did the biscuit go to the doctor? It was feeling crummy. 🍪',
          'What do you call a sad biscuit? A crumble-bee. 😔',
          "I'd tell you a UDP joke, but you might not get it.",
          'Why do programmers prefer dark mode? Because light attracts bugs. 🐛',
          'What did the cookie say to the biscuit? "You\'re one smart cookie… wait."',
          "There are 10 kinds of people: those who understand binary and those who don't.",
        ]) };
        case '!hug': return { content: msg.mentions.filter(id => id !== BOT_ID).length ? `🤗 ${me} hugs ${msg.mentions.filter(id => id !== BOT_ID).map(id => `<@${id}>`).join(' ')}!` : `🤗 *hugs ${me}*` };
        case '!avatar': {
          const u = this.s.users[msg.authorId];
          if (!u || !u.avatar) return { content: `${me} you don't have an avatar yet. Upload one in **Settings → Profiles**!` };
          return { content: `Here's ${me}'s avatar ✨`, attachments: [{ url: u.avatar, name: 'avatar', type: /\.gif$|image\/gif/.test(u.avatar) ? 'image/gif' : 'image/png', size: 0, w: 256, h: 256, spoiler: false }] };
        }
        case '!golden': case '!nitro': case '!perks': return { content:
          '**Golden Biscuit perks: all free, always** ✨\n' +
          '• Animated avatars, banners and server icons\n• Profile themes, avatar decorations and profile effects\n' +
          '• Styled display names: colors, gradients and fonts\n• Custom emoji from any server, everywhere\n' +
          '• Super reactions\n• 100 MB uploads and 4,000-character messages\n• Gradient app themes\n• Vanity invite links' };
        case '!poll': {
          const parts = arg.split('|').map(s => s.trim()).filter(Boolean);
          if (parts.length < 3) return { content: 'Usage: `!poll Best snack? | Biscuits | Cookies | Crackers`' };
          const nums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
          return { content: `📊 **${parts[0]}**\n` + parts.slice(1, 10).map((o, i) => `${nums[i]} ${o}`).join('\n') + '\n\n*React to vote!*' };
        }
      }
      if (cmd.startsWith('!')) return { content: `I don't know \`${cmd.slice(0, 20).replace(/`/g, '')}\`. Try \`!help\` 🍪` };
      const low = t.toLowerCase();
      if (/\b(hi|hey|hello|yo|sup|hiya)\b/.test(low)) return { content: pick([`Hey ${me}! 👋`, `Hiya ${me}! Want a biscuit? 🍪`, `Hello hello ${me} ✨`]) };
      if (/\b(thanks|thank you|ty|thx)\b/.test(low)) return { content: pick(['Anytime! 💛', 'You got it 🍪', 'Happy to help!']) };
      if (/\b(love|cute|best)\b/.test(low)) return { content: pick(['🥹 stop it, I\'m crumbling', 'You\'re the best ' + me + ' 💛']) };
      if (/\?$/.test(low)) return { content: pick(['Great question. My answer: biscuits. 🍪', 'Hmm… try `!8ball` for the real answer.', 'I asked the oven and it said "maybe".']) };
      return { content: pick([`*crunches thoughtfully* 🍪`, `Noted, ${me}!`, `Type \`!help\` to see my tricks ✨`, 'Beep boop, biscuit mode activated 🤖🍪']) };
    }
  }

  const RPC = new Set([
    'updateProfile', 'createServer', 'updateServer', 'resetInvite', 'deleteServer', 'leaveServer', 'joinServer',
    'createChannel', 'updateChannel', 'deleteChannel', 'openDM', 'addEmoji', 'removeEmoji',
    'sendMessage', 'editMessage', 'deleteMessage', 'react', 'typing', 'getMessages', 'getUser',
  ]);

  globalThis.BiscuitCore = { TEMPLATES, Core, BiscuitError, LIMITS, DECORATIONS, EFFECTS, FONTS, STATUSES, RPC, BOT_ID, HQ_ID, newId };
})();
