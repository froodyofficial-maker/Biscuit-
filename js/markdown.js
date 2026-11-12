// Chat markdown: **bold** *italic* __underline__ ~~strike~~ ||spoiler|| `code` ```blocks``` > quotes # headings,
// links, <@user> mentions and <:name:id> custom emoji. Input is escaped first, so nothing a user types becomes HTML.
(function () {
  'use strict';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PICT = /\p{Extended_Pictographic}/u;
  const EMOJI_ONLY = /^(?:\s|\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣|[0-9#*](?=️?⃣))+$/u;

  // ctx: { user(id) -> {displayName}|null, emoji(id) -> {url,name}|null, meId }
  function render(src, ctx) {
    src = String(src || '').replace(/[]/g, '');
    const tokens = [];
    const hold = html => '' + (tokens.push(html) - 1) + '';

    // code first: nothing inside code is formatted
    src = src.replace(/```(?:([\w+-]{1,20})\n)?([\s\S]*?)```/g, (_, lang, code) =>
      hold(`<pre class="codeblock"><code>${esc(code.replace(/^\n|\n$/g, ''))}</code></pre>`));
    src = src.replace(/`([^`\n]+)`/g, (_, code) => hold(`<code class="inline">${esc(code)}</code>`));
    src = src.replace(/<@([A-Za-z0-9-]{1,64})>/g, (_, id) => {
      const u = ctx && ctx.user(id);
      return hold(`<span class="mention${ctx && id === ctx.meId ? ' me' : ''}" data-act="profile" data-uid="${esc(id)}">@${esc(u ? u.displayName : 'unknown-user')}</span>`);
    });
    src = src.replace(/<a?:([A-Za-z0-9_]{2,32}):([A-Za-z0-9-]{1,64})>/g, (_, name, id) => {
      const e = ctx && ctx.emoji(id);
      return e ? hold(`<img class="cemoji" src="${esc(e.url)}" alt=":${esc(name)}:" title=":${esc(name)}:" draggable="false">`) : `:${name}:`;
    });
    src = src.replace(/https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/g, url =>
      hold(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow">${esc(url)}</a>`));

    let h = esc(src);
    h = h.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="spoiler" data-act="spoiler">$1</span>');
    h = h.replace(/\*\*\*([\s\S]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    h = h.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/__([\s\S]+?)__/g, '<u>$1</u>');
    h = h.replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1<em>$2</em>');
    h = h.replace(/(^|[^\w])_(?!\s)([^_\n]+?)_(?!\w)/g, '$1<em>$2</em>');
    h = h.replace(/~~([\s\S]+?)~~/g, '<s>$1</s>');

    // block level: headings, quotes, lists
    const lines = h.split('\n');
    const out = [];
    let quote = [];
    const flushQuote = () => { if (quote.length) { out.push(`<blockquote>${quote.join('<br>')}</blockquote>`); quote = []; } };
    for (const line of lines) {
      let m;
      if ((m = /^&gt; ?(.*)$/.exec(line))) { quote.push(m[1]); continue; }
      flushQuote();
      if ((m = /^(#{1,3}) (.+)$/.exec(line))) out.push(`<span class="md-h${m[1].length}">${m[2]}</span>`);
      else if ((m = /^[-*] (.+)$/.exec(line))) out.push(`<span class="md-li">${m[1]}</span>`);
      else if ((m = /^-# (.+)$/.exec(line))) out.push(`<span class="md-sub">${m[1]}</span>`);
      else out.push(line + '\n');
    }
    flushQuote();
    h = out.join('').replace(/\n$/, '').replace(/\n/g, '<br>');
    h = h.replace(/(<\/(?:blockquote|span)>)<br>/g, '$1');

    // put the held pieces back (they can nest, so loop)
    for (let i = 0; i < 4 && //.test(h); i++) h = h.replace(/(\d+)/g, (_, n) => tokens[+n]);
    return h;
  }

  function isJumbo(src) {
    const stripped = String(src || '').replace(/<a?:[A-Za-z0-9_]{2,32}:[A-Za-z0-9-]{1,64}>/g, '⭐').trim();
    if (!stripped || !PICT.test(stripped) || !EMOJI_ONLY.test(stripped)) return false;
    return [...stripped.replace(/\s/g, '')].filter(c => PICT.test(c)).length <= 27;
  }

  // image links in a message get shown inline, like an embed
  function mediaLinks(src) {
    const out = [];
    const re = /https:\/\/[^\s<>"']+?\.(?:gif|png|jpe?g|webp)(?:\?[^\s<>"']*)?(?=\s|$)|https:\/\/(?:media\d?\.giphy\.com|media\.tenor\.com|i\.giphy\.com)\/[^\s<>"']+/gi;
    let m;
    while ((m = re.exec(String(src || ''))) && out.length < 4) out.push(m[0]);
    return out;
  }

  globalThis.BiscuitMarkdown = { render, isJumbo, esc, mediaLinks };
})();
