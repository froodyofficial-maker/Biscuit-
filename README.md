# 🍪 Biscuit

A chat app for you and your friends: servers, channels, DMs, GIFs, emoji, screenshots and fully customizable profiles.
Everything other chat apps charge for is free here. We call it the **Golden Biscuit**, and every account has it.

## ▶️ [Open Biscuit](https://froodyofficial-maker.github.io/Biscuit-/)

The link above runs Biscuit right in your browser. Accounts and chats are saved in that browser, so you can try everything instantly.
To chat with friends on **other devices**, host the server (one click, free):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/froodyofficial-maker/Biscuit-)

![Biscuit chat](docs/screenshots/chat.jpg)

## Run it yourself

You need [Node.js](https://nodejs.org) 18 or newer. There is nothing to install: Biscuit has no dependencies.

```bash
npm start
```

Then open <http://localhost:3000>. Friends on your network can join at `http://<your-computer's-ip>:3000`.

**No server?** Open `public/index.html` straight from disk, or host the `public/` folder on any static host such as GitHub Pages.
Biscuit then runs in **browser mode**: accounts and chats are saved in that browser only. Everything else works the same.
The [website](https://froodyofficial-maker.github.io/Biscuit-/) is served by GitHub Pages from the `main` branch: the root `index.html` opens the app in `public/`.

| Setting | What it does |
| --- | --- |
| `PORT=8080` | Port to listen on (default `3000`). |
| `DATA_DIR=./data` | Where accounts, messages (`db.json`) and uploads are kept. |
| `GIPHY_API_KEY=…` or `TENOR_API_KEY=…` | Optional. Turns on GIF search for everyone on the server. |

## Features

### Accounts
- Pick **any username and any password**: spaces, capitals, symbols and emoji all work. Usernames are unique, ignoring upper/lower case.

### Chat
- **Anyone can create servers**: start from scratch or a template (Gaming, Friends, Study Group, School Club, Artists & Creators, Local Community)
- Servers with text channels, invite links and a member list with live online / idle / do-not-disturb / invisible status
- Direct messages with anyone, by username
- Replies, editing (press ↑ to edit your last message), deleting, typing indicators, unread dots and mention badges
- Markdown: `**bold**`, `*italic*`, `__underline__`, `~~strike~~`, `||spoilers||`, `` `code` ``, code blocks, `> quotes`, `# headings`
- `@mentions` with autocomplete, desktop notifications and a sound for DMs and mentions
- **Biscuit the bot** lives in Biscuit HQ and in your DMs: `!help`, `!roll 2d6`, `!poll`, `!8ball`, `!joke` and more

### GIFs
- **Biscuit GIFs**: a pack of animated reaction GIFs generated in your browser. No account, API key or internet needed.
- **GIF Maker**: pick any emoji, a caption, an animation (bounce, spin, rainbow, confetti, glitch…) and colors, and get a real animated GIF
- Upload your own GIFs, paste any GIF link into chat, and ⭐ star GIFs to keep them in **Favorites**
- Optional GIPHY / Tenor search (set a key on the server, or paste a free GIPHY key in **Settings → GIFs**)

| GIF picker | GIF Maker |
| --- | --- |
| ![GIF picker](docs/screenshots/gif-picker.jpg) | ![GIF Maker](docs/screenshots/gif-maker.jpg) |

### Emoji
- Full emoji picker with search, categories and frequently used
- `:shortcode:` autocomplete as you type (`:fire` → 🔥)
- **Custom server emoji** (PNG or animated GIF) that work in every server and every DM
- Reactions, plus **super reactions** that burst across the screen

| Emoji picker | Super reactions |
| --- | --- |
| ![Emoji picker](docs/screenshots/emoji-picker.jpg) | ![Super reaction](docs/screenshots/super-reaction.jpg) |

### Screenshots and files
- **Paste a screenshot** with Ctrl+V / ⌘V and it's attached
- **Take a screenshot** of your screen or a window straight from the ＋ menu
- Drag and drop files anywhere, up to 10 per message and 100 MB each, with upload progress
- Images, videos and audio play inline. Mark any attachment as a spoiler. Click an image to view it full size.

![Screenshot attached](docs/screenshots/screenshot-attach.jpg)

### Profiles
Open **User Settings → Profiles** (the ✏️ next to your name). The preview updates live as you edit.
- Avatar and banner, including **animated GIFs**
- **Avatar decorations**: rainbow, fire, neon, gold, sparkle, crown, hearts, cat ears, halo, glitch
- **Profile effects**: confetti, snow, stars, hearts, bubbles, aurora, embers
- **Profile themes**: paint your whole card with two colors
- **Display name style**: a color or gradient, plus six fonts
- Pronouns, About Me (with markdown), custom status with emoji, and badges

| Profile editor | Profile card |
| --- | --- |
| ![Profile editor](docs/screenshots/profile-editor.jpg) | ![Profile card](docs/screenshots/profile-card.jpg) |

### Golden Biscuit: every perk, free
Animated avatars, banners and server icons · profile themes, decorations and effects · styled names · custom emoji everywhere ·
super reactions · 100 MB uploads · 4,000-character messages · gradient app themes · vanity invite links · the GIF Maker.

| Sunset theme | Light theme |
| --- | --- |
| ![Sunset theme](docs/screenshots/theme-sunset.jpg) | ![Light theme](docs/screenshots/theme-light.jpg) |

Biscuit also works on phones:

![Mobile](docs/screenshots/mobile.jpg)

## How it's built

```
server.mjs              HTTP server: accounts, uploads, live updates (Server-Sent Events), GIF search proxy
public/index.html       app shell
public/css/app.css      all styling: themes, decorations, profile effects
public/js/core.js       the chat model (users, servers, messages, reactions, emoji, bot). Runs on the server AND in the browser
public/js/api.js        server mode / local mode
public/js/app.js        the UI
public/js/gif.js        animated-GIF encoder, built-in GIFs and the GIF Maker
public/js/emoji-data.js emoji set
public/js/markdown.js   safe chat markdown
tools/check.mjs         syntax check + core smoke test (npm run check)
```

Passwords are hashed with scrypt. Uploaded files that aren't images, video or audio are always served as downloads.
