// Renders every dashboard page against fixture data in a stub DOM and reports exceptions.
const fs = require('fs'), vm = require('vm');
const els = {}; const mk = id => els[id] || (els[id] = { id, innerHTML: '', textContent: '', style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => true }, querySelector: () => mk('q'), addEventListener() {}, set onclick(v) {}, set onsubmit(v) {}, set oninput(v) {} });
const fix = {
  '/api/patients': [{ id: 'P1', name: 'Ravi', room: '101', bed: '2', condition: 'c', doctor: 'd', nurse: 'n', priority: 'Normal', status: 'Normal', communication: ['x'] }],
  '/api/alerts': [{ id: 'A1', timestamp: new Date().toISOString(), patientId: 'P1', patient: 'Ravi', room: '101', bed: '2', gesture: 'g', requirement: 'Water', message: 'm', confidence: 90, priority: 'attention', status: 'pending', type: 'hand_gesture' }, { id: 'A2', timestamp: new Date().toISOString(), patientId: 'P1', patient: 'Ravi', room: '101', bed: '2', gesture: 'g', requirement: 'Help', message: 'm', confidence: 90, priority: 'emergency', status: 'resolved', resolvedAt: new Date().toISOString() }],
  '/api/rooms': [{ room: '101', bed: '1', occupied: false, patient: null }, { room: '101', bed: '2', occupied: true, patient: { id: 'P1', name: 'Ravi', condition: 'c', priority: 'Normal' } }],
  '/api/appointments': [{ id: 'AP1', patientId: 'P1', patientName: 'Ravi', room: '101', bed: '2', doctor: 'D', specialty: 's', date: '2026-01-01', time: '10:00', reason: 'r', status: 'Scheduled' }],
  '/api/reports': [], '/api/stats': { patients: 1, pending: 1, acknowledged: 0, resolved: 1, emergency: 1 }, '/api/detection-metrics': { byModality: {} }, '/api/system-health': {}, '/api/settings': { gestures: [{ name: 'a', meaning: 'b', mode: 'Hand' }] }, '/api/audit': [], '/api/users': [{ username: 'admin', name: 'A', role: 'admin' }]
};
const ctx = { console, setTimeout, clearTimeout, URL, Blob: class {}, confirm: () => true, history: { replaceState() {} }, location: { hash: '', href: '' }, window: { scrollTo() {}, addEventListener() {} }, EventSource: class { },
  localStorage: { getItem: k => k === 'patientToken' ? 't' : JSON.stringify({ role: 'admin', name: 'Admin' }), clear() {} },
  document: { getElementById: mk, querySelector: () => mk('q'), querySelectorAll: () => [], createElement: () => mk('c') },
  fetch: async (u) => ({ ok: true, status: 200, json: async () => fix[u.split('?')[0]] ?? {} }) };
ctx.window.addEventListener = () => {}; ctx.addEventListener = () => {}; ctx.window.scrollTo = () => {};
vm.createContext(ctx);
let src = fs.readFileSync(__dirname + '/../public/js/dashboard.js', 'utf8').replace(/^render\(\);$/m, '').replace(/^const (\w+) =/gm, 'var $1 =').replace(/^let (\w+)/gm, 'var $1');
vm.runInContext(src, ctx);
(async () => {
  let bad = 0;
  for (const p of ['dashboard', 'monitor', 'patients', 'rooms', 'appointments', 'alerts', 'history', 'reports', 'settings', 'admin']) {
    vm.runInContext(`state.page='${p}'`, ctx);
    els.page = undefined; const page = mk('page');
    await vm.runInContext('render()', ctx);
    const len = page.innerHTML.length; const ok = len > 200 && !/Could not load data/.test(page.innerHTML);
    if (!ok) { bad++; console.log('✗', p, page.innerHTML.slice(0, 300)); } else console.log('✓', p.padEnd(13), len, 'chars');
  }
  process.exit(bad ? 1 : 0);
})();
