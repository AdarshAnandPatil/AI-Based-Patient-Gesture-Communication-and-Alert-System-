// Loads the browser-style engines into a Node vm context so they can be unit-tested.
const fs = require('fs'), path = require('path'), vm = require('vm');
function loadEngines() {
  const ctx = { console, Math, Date, JSON, localStorage: { getItem: () => '', removeItem() {}, setItem() {} }, window: {}, document: {}, fetch: async () => ({ ok: true }), location: {} };
  vm.createContext(ctx);
  const dir = path.join(__dirname, '..', 'public', 'js');
  for (const f of ['state.js', 'gestures.js', 'face_head.js']) {
    if (!fs.existsSync(path.join(dir, f))) continue;
    let src = fs.readFileSync(path.join(dir, f), 'utf8').replace(/^const (\w+) =/gm, 'var $1 =');
    vm.runInContext(src, ctx, { filename: f });
  }
  return ctx;
}
module.exports = { loadEngines };
