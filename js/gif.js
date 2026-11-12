// Biscuit GIFs: a small animated-GIF encoder, a pack of built-in reaction GIFs and the GIF Maker.
// Everything is drawn on a canvas and encoded in the browser, so GIFs work with no API key and offline.
(function () {
  'use strict';

  // ---------- encoder ----------
  // frames: array of ImageData-like {data: Uint8ClampedArray} all w x h. delay in 1/100 s.
  function encode(frames, w, h, delay) {
    const { palette, index } = buildPalette(frames);
    const out = new ByteOut();
    out.str('GIF89a');
    out.u16(w); out.u16(h);
    out.byte(0xf7); out.byte(0); out.byte(0); // global table, 256 colors
    for (let i = 0; i < 256; i++) { const c = palette[i] || 0; out.byte(c >> 16 & 255); out.byte(c >> 8 & 255); out.byte(c & 255); }
    out.bytes([0x21, 0xff, 0x0b]); out.str('NETSCAPE2.0'); out.bytes([3, 1, 0, 0, 0]); // loop forever
    for (const f of frames) {
      out.bytes([0x21, 0xf9, 4, 0x04]); out.u16(delay); out.bytes([0, 0]);
      out.byte(0x2c); out.u16(0); out.u16(0); out.u16(w); out.u16(h); out.byte(0);
      const px = new Uint8Array(w * h);
      const d = f.data;
      for (let i = 0, p = 0; i < px.length; i++, p += 4) px[i] = index(d[p], d[p + 1], d[p + 2]);
      out.byte(8);
      const lzw = lzwEncode(8, px);
      for (let i = 0; i < lzw.length; i += 255) {
        const n = Math.min(255, lzw.length - i);
        out.byte(n);
        for (let j = 0; j < n; j++) out.byte(lzw[i + j]);
      }
      out.byte(0);
    }
    out.byte(0x3b);
    return new Blob([out.result()], { type: 'image/gif' });
  }

  class ByteOut {
    constructor() { this.buf = new Uint8Array(1 << 16); this.n = 0; }
    byte(b) { if (this.n >= this.buf.length) { const nb = new Uint8Array(this.buf.length * 2); nb.set(this.buf); this.buf = nb; } this.buf[this.n++] = b; }
    bytes(a) { for (const b of a) this.byte(b); }
    u16(v) { this.byte(v & 255); this.byte(v >> 8 & 255); }
    str(s) { for (let i = 0; i < s.length; i++) this.byte(s.charCodeAt(i)); }
    result() { return this.buf.subarray(0, this.n); }
  }

  // Popularity palette over 15-bit color bins, then nearest-color lookups cached per bin.
  function buildPalette(frames) {
    const hist = new Uint32Array(32768);
    for (const f of frames) {
      const d = f.data;
      for (let p = 0; p < d.length; p += 8) hist[(d[p] >> 3) << 10 | (d[p + 1] >> 3) << 5 | (d[p + 2] >> 3)]++;
    }
    const bins = [];
    for (let i = 0; i < 32768; i++) if (hist[i]) bins.push(i);
    bins.sort((a, b) => hist[b] - hist[a]);
    const chosen = [];
    // greedy: take popular colors but skip ones too close to an already chosen color
    const close = (a, b, t) => {
      const dr = (a >> 10) - (b >> 10), dg = (a >> 5 & 31) - (b >> 5 & 31), db = (a & 31) - (b & 31);
      return dr * dr + dg * dg + db * db <= t;
    };
    for (const t of [3, 1, 0]) {
      for (const b of bins) {
        if (chosen.length >= 256) break;
        if (!chosen.some(c => close(c, b, t))) chosen.push(b);
      }
      if (chosen.length >= 256) break;
    }
    const palette = chosen.map(b => ((b >> 10) << 19 | 0x40000) | ((b >> 5 & 31) << 11 | 0x400) | ((b & 31) << 3 | 4));
    const cache = new Int16Array(32768).fill(-1);
    const pr = palette.map(c => c >> 16 & 255), pg = palette.map(c => c >> 8 & 255), pb = palette.map(c => c & 255);
    function index(r, g, b) {
      const key = (r >> 3) << 10 | (g >> 3) << 5 | (b >> 3);
      let v = cache[key];
      if (v >= 0) return v;
      let best = 0, bd = 1e9;
      for (let i = 0; i < palette.length; i++) {
        const dr = r - pr[i], dg = g - pg[i], db = b - pb[i];
        const dd = dr * dr * 2 + dg * dg * 4 + db * db * 3;
        if (dd < bd) { bd = dd; best = i; }
      }
      cache[key] = best;
      return best;
    }
    return { palette, index };
  }

  function lzwEncode(minCode, px) {
    const out = [];
    let cur = 0, bits = 0;
    const clear = 1 << minCode, eoi = clear + 1;
    let size = minCode + 1, next = eoi + 1;
    let dict = new Map();
    const put = code => {
      cur |= code << bits; bits += size;
      while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; }
    };
    put(clear);
    let prefix = px[0];
    for (let i = 1; i < px.length; i++) {
      const k = px[i];
      const key = prefix << 8 | k;
      const hit = dict.get(key);
      if (hit !== undefined) { prefix = hit; continue; }
      put(prefix);
      if (next < 4096) {
        dict.set(key, next++);
        if (next > (1 << size) && size < 12) size++;
      } else {
        put(clear);
        dict = new Map();
        size = minCode + 1;
        next = eoi + 1;
      }
      prefix = k;
    }
    put(prefix);
    put(eoi);
    if (bits > 0) out.push(cur & 255);
    return out;
  }

  // ---------- drawing ----------
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
  const TEXT_FONT = '900 {s}px Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif';
  const ANIMS = {
    bounce: 'Bounce', shake: 'Shake', spin: 'Spin', wave: 'Wave', pulse: 'Pulse', zoom: 'Zoom in',
    tilt: 'Tilt', slide: 'Fly by', confetti: 'Confetti', rain: 'Rain', rainbow: 'Rainbow', hearts: 'Hearts', glitch: 'Glitch',
  };

  function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  function drawFrame(ctx, o, t) {
    const { w, h } = o;
    const T = Math.PI * 2;
    // background
    let c1 = o.bg[0], c2 = o.bg[1];
    if (o.anim === 'rainbow') { c1 = `hsl(${t * 360},85%,55%)`; c2 = `hsl(${t * 360 + 120},85%,45%)`; }
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // background particles
    const r = rng(7);
    if (o.anim === 'confetti' || o.anim === 'rain' || o.anim === 'hearts') {
      for (let i = 0; i < 26; i++) {
        const x = r() * w, sp = 0.6 + r() * 0.8, y = ((r() + t * sp) % 1) * (h + 20) - 10;
        if (o.anim === 'confetti') {
          ctx.save(); ctx.translate(x + Math.sin((t + i) * T) * 6, y); ctx.rotate((t * 3 + r()) * T);
          ctx.fillStyle = `hsl(${r() * 360},90%,60%)`; ctx.fillRect(-4, -2, 8, 4); ctx.restore();
        } else if (o.anim === 'rain') {
          ctx.strokeStyle = 'rgba(180,210,255,.75)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 10); ctx.stroke();
        } else {
          const yy = h - y;
          ctx.font = `${12 + r() * 10}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.globalAlpha = 0.8; ctx.fillText('💖', x, yy); ctx.globalAlpha = 1;
        }
      }
    }
    // the emoji
    const size = o.emojiSize || Math.round(h * 0.45);
    let x = w / 2, y = o.text ? h * 0.42 : h / 2, rot = 0, sx = 1, sy = 1, alpha = 1;
    const s = Math.sin(t * T);
    switch (o.anim) {
      case 'bounce': { const b = Math.abs(Math.sin(t * T)); y -= b * h * 0.16; sy = 1 - (1 - b) * 0.12; sx = 1 + (1 - b) * 0.1; break; }
      case 'shake': x += Math.sin(t * T * 4) * 7; rot = Math.sin(t * T * 4) * 0.12; break;
      case 'spin': rot = t * T; break;
      case 'wave': rot = s * 0.45; break;
      case 'pulse': case 'hearts': sx = sy = 1 + 0.22 * Math.abs(s); break;
      case 'zoom': { const k = t < 0.8 ? t / 0.8 : 1; sx = sy = 0.35 + k * 0.9; break; }
      case 'tilt': rot = s * 0.25; x += s * 4; break;
      case 'slide': x = -size + (w + size * 2) * t; rot = s * 0.15; break;
      case 'glitch': x += (Math.floor(t * 20) % 3 - 1) * 4; break;
    }
    ctx.save();
    ctx.translate(x, y + size * (o.anim === 'wave' ? 0.4 : 0));
    ctx.rotate(rot);
    ctx.scale(sx, sy);
    ctx.globalAlpha = alpha;
    ctx.font = `${size}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (o.anim === 'glitch') {
      ctx.globalAlpha = 0.6; ctx.fillStyle = 'red'; ctx.fillText(o.emoji, -3, o.anim === 'wave' ? -size * 0.4 : 0);
      ctx.fillStyle = 'cyan'; ctx.fillText(o.emoji, 3, 0); ctx.globalAlpha = 1;
    }
    ctx.fillText(o.emoji, 0, o.anim === 'wave' ? -size * 0.4 : 0);
    ctx.restore();
    // caption
    if (o.text) {
      let fs = Math.round(h * 0.17);
      ctx.font = TEXT_FONT.replace('{s}', fs);
      while (ctx.measureText(o.text).width > w * 0.92 && fs > 10) { fs -= 1; ctx.font = TEXT_FONT.replace('{s}', fs); }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const ty = h * 0.84 + (o.anim === 'bounce' ? Math.sin(t * T * 2) * 2 : 0);
      ctx.lineWidth = Math.max(3, fs / 6);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,.85)';
      ctx.strokeText(o.text, w / 2, ty);
      ctx.fillStyle = o.anim === 'rainbow' || o.anim === 'glitch' ? `hsl(${(t * 360 + 180) % 360},100%,75%)` : (o.textColor || '#fff');
      ctx.fillText(o.text, w / 2, ty);
    }
  }

  function render(o) {
    o = Object.assign({ w: 240, h: 180, frames: 24, delay: 5, bg: ['#e8a33d', '#a0522d'], anim: 'bounce', emoji: '🍪', text: '' }, o);
    const canvas = document.createElement('canvas');
    canvas.width = o.w; canvas.height = o.h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const frames = [];
    for (let i = 0; i < o.frames; i++) {
      ctx.clearRect(0, 0, o.w, o.h);
      drawFrame(ctx, o, i / o.frames);
      frames.push(ctx.getImageData(0, 0, o.w, o.h));
    }
    return encode(frames, o.w, o.h, o.delay);
  }

  const BUILTINS = [
    { id: 'hype', title: 'HYPE', emoji: '🔥', anim: 'bounce', bg: ['#ff512f', '#f09819'], tags: 'hype fire lit lets go' },
    { id: 'lol', title: 'LMAO', emoji: '😂', anim: 'shake', bg: ['#f7971e', '#ffd200'], tags: 'lol lmao funny laugh' },
    { id: 'gg', title: 'GG', emoji: '🏆', anim: 'pulse', bg: ['#1d976c', '#93f9b9'], tags: 'gg win good game trophy' },
    { id: 'hi', title: 'HEY!', emoji: '👋', anim: 'wave', bg: ['#4facfe', '#00c6fb'], tags: 'hi hello hey wave' },
    { id: 'love', title: 'LOVE IT', emoji: '😍', anim: 'hearts', bg: ['#ee0979', '#ff6a00'], tags: 'love heart cute aww' },
    { id: 'party', title: 'PARTY TIME', emoji: '🥳', anim: 'confetti', bg: ['#8e2de2', '#4a00e0'], tags: 'party celebrate yay birthday' },
    { id: 'sad', title: 'NOOOO', emoji: '😭', anim: 'rain', bg: ['#536976', '#292e49'], tags: 'sad cry no' },
    { id: 'omg', title: 'OMG', emoji: '😱', anim: 'zoom', bg: ['#c31432', '#240b36'], tags: 'omg shock wow scream' },
    { id: 'hmm', title: 'hmm...', emoji: '🤔', anim: 'tilt', bg: ['#3a6073', '#16222a'], tags: 'hmm thinking think sus' },
    { id: 'cookie', title: 'BISCUIT TIME', emoji: '🍪', anim: 'spin', bg: ['#f6c46a', '#a0522d'], tags: 'biscuit cookie snack' },
    { id: 'yes', title: 'YES!', emoji: '👍', anim: 'bounce', bg: ['#11998e', '#38ef7d'], tags: 'yes ok agree thumbs' },
    { id: 'bye', title: 'BYE', emoji: '🫡', anim: 'slide', bg: ['#373b44', '#4286f4'], tags: 'bye goodbye cya salute' },
    { id: 'cool', title: 'COOL', emoji: '😎', anim: 'rainbow', bg: ['#000', '#000'], tags: 'cool nice sunglasses' },
    { id: 'rip', title: 'RIP', emoji: '💀', anim: 'glitch', bg: ['#232526', '#414345'], tags: 'rip dead skull dying' },
    { id: 'clap', title: 'BRAVO', emoji: '👏', anim: 'pulse', bg: ['#fc4a1a', '#f7b733'], tags: 'clap bravo applause' },
    { id: 'sleep', title: 'gn', emoji: '😴', anim: 'tilt', bg: ['#0f2027', '#2c5364'], tags: 'sleep tired gn night' },
  ];

  const cache = new Map();
  async function builtin(id) {
    if (cache.has(id)) return cache.get(id);
    const b = BUILTINS.find(x => x.id === id);
    if (!b) return null;
    await new Promise(r => setTimeout(r, 0)); // yield so the picker can paint
    const blob = render({ emoji: b.emoji, text: b.title, anim: b.anim, bg: b.bg });
    const out = { blob, url: URL.createObjectURL(blob), w: 240, h: 180, title: b.title };
    cache.set(id, out);
    return out;
  }

  globalThis.BiscuitGif = { encode, render, builtin, BUILTINS, ANIMS };
})();
