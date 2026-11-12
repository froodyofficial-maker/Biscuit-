// Syntax-checks every script and runs a quick smoke test of the chat core.
import { readdirSync, readFileSync } from 'node:fs';
import vm from 'node:vm';
const dir = new URL('../public/js/', import.meta.url);
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.js')) continue;
  new vm.Script(readFileSync(new URL(f, dir), 'utf8'), { filename: f });
  console.log('ok  ', f);
}
await import('../public/js/core.js');
const { Core } = globalThis.BiscuitCore;
const events = [];
const core = new Core(null, { emit: e => events.push(e), botDelay: 0 });
const a = core.createUser('alice'), b = core.createUser('bob');
const s = core.createServer(a.id, { name: 'Test' });
core.joinServer(b.id, { code: core.s.servers[s.serverId].invite });
const m = core.sendMessage(b.id, { channelId: s.channelId, content: `hi <@${a.id}> :)` });
if (!m.mentions.includes(a.id)) throw new Error('mention not parsed');
core.react(a.id, { channelId: s.channelId, messageId: m.id, emoji: '🍪', super: true });
const dm = core.openDM(a.id, { username: 'biscuit' });
core.sendMessage(a.id, { channelId: dm.id, content: '!roll 2d6' });
if (core.s.messages[dm.id].length !== 2) throw new Error('bot did not reply');
core.updateProfile(a.id, { decoration: 'fire', effect: 'snow', theme: ['#112233', '#445566'], bio: 'hello' });
console.log('ok   core smoke test (' + events.length + ' events)');
