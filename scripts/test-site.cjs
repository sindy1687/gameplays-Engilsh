const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createServer } = require('../server.js');
const root = path.resolve(__dirname, '..');
function sandbox(shared = new Map()) {
  const handlers = new Map(); const elements = new Map();
  const context = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: { getItem: k => shared.get(k) ?? null, setItem: (k, v) => shared.set(k, String(v)) },
    document: { readyState: 'loading', hidden: false, addEventListener() {}, querySelectorAll: selector => elements.get(selector) || [] },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    addEventListener(type, fn) { handlers.set(type, [...(handlers.get(type) || []), fn]); },
    dispatchEvent(event) { (handlers.get(event.type) || []).forEach(fn => fn(event)); },
    setTimeout: () => 1, clearTimeout() {}, URL, URLSearchParams,
    fetch() { throw new Error('Tests must not contact cloud services'); }
  };
  context.window = context;
  vm.createContext(context);
  const load = file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  return { context, load, elements, handlers };
}
async function main() {
  const data = new Map(); const a = sandbox(data); const b = sandbox(data);
  a.load('js/stars.js'); a.load('js/userData.js'); a.load('js/starManager.js'); b.load('js/stars.js');
  const { StarSystem: stars, LinkageSystem: linkage, StarManager: manager } = a.context;
  let legacyEvents = 0, globalEvents = 0;
  a.context.addEventListener('starsChanged', () => legacyEvents++);
  a.context.addEventListener('globalStarsChanged', () => globalEvents++);
  stars.setTotalStars(100);
  assert.equal(legacyEvents, 1); assert.equal(globalEvents, 1);
  linkage.stars.add('25'); assert.equal(manager.getStars(), 125);
  assert.equal(manager.deductStars(30).success, true); assert.equal(stars.getTotalStars(), 95);
  assert.equal(linkage.stars.subtract(-10), false); assert.equal(manager.deductStars(999).success, false);
  assert.equal(stars.getTotalStars(), 95);
  for (const value of [NaN, Infinity, 'not-a-number']) stars.setTotalStars(value);
  assert.equal(stars.getTotalStars(), 95);
  assert.equal(b.context.StarSystem.getTotalStars(), 95);
  const leaf = { tagName: 'SPAN', children: [], textContent: '' };
  const container = { tagName: 'DIV', children: [{}], textContent: 'keep icons and labels' };
  const canvas = { tagName: 'CANVAS', children: [], textContent: 'keep canvas' };
  a.elements.set('[data-asset-value="stars"]', [leaf]);
  a.elements.set('.stars-display', [container]); a.elements.set('#stars', [canvas]);
  stars.updateAllStarDisplays();
  assert.equal(leaf.textContent, '95'); assert.equal(container.textContent, 'keep icons and labels'); assert.equal(canvas.textContent, 'keep canvas');
  data.set('starTransactions', 'broken json'); stars.addTotalStars(1);
  assert.equal(stars.getStarTransactions().length, 1);
  assert.equal(stars.applyLevelStars('test-stage', 2).addedStars, 2);
  assert.equal(stars.applyLevelStars('test-stage', 2).addedStars, 0);
  assert.equal(stars.applyLevelStars('test-stage', 3).addedStars, 1);
  assert.equal(stars.applyLevelStars('practice', 3, { isPracticeMode: true }).addedStars, 0);
  const before = a.handlers.get('storage').length; a.load('js/stars.js');
  assert.equal(a.handlers.get('storage').length, before);
  b.context.StarSystem.setTotalStars(200);
  a.context.dispatchEvent({ type: 'storage', key: 'totalStars' }); assert.equal(leaf.textContent, '200');
  const videos = sandbox(); videos.context.allCards = [{ word: 'test', video: 'original' }];
  videos.load('js/cardVideoManager.js');
  assert.equal(videos.context.addVideoToCard('test', 'https://youtube.com.evil.example/watch?v=1'), false);
  assert.equal(videos.context.addVideoToCard('test', 'https://youtu.be/abc'), true);
  assert.equal(videos.context.allCards[0].video, 'https://youtu.be/abc');
  assert.equal(videos.context.removeVideoFromCard('test'), true);
  assert.equal(videos.context.allCards[0].video, null);
  const server = createServer(root);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const home = await fetch(base + '/'); assert.equal(home.status, 200);
    assert.equal(await home.text(), fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
    const quiz = await fetch(base + '/quiz.html?category=aries'); assert.equal(quiz.status, 200);
    assert.match(quiz.headers.get('content-type'), /text\/html/);
    const head = await fetch(base + '/shop.html', { method: 'HEAD' }); assert.equal(await head.text(), '');
    assert.equal((await fetch(base + '/missing-page.html')).status, 404);
    assert.equal((await fetch(base + '/.cleanup-backup-path')).status, 403);
    assert.equal((await fetch(base + '/%')).status, 400);
    const pages = fs.readdirSync(root).filter(file => /\.html$/i.test(file));
    for (const file of pages) {
      const response = await fetch(base + '/' + encodeURIComponent(file));
      assert.equal(response.status, 200, file);
      assert.equal(await response.text(), fs.readFileSync(path.join(root, file), 'utf8'), file);
    }
    console.log(`PASS: all ${pages.length} HTML routes return their own content.`);
  } finally { await new Promise(resolve => server.close(resolve)); }
  console.log('PASS: shared stars, legacy adapters, events, saved rewards, DOM preservation, video overrides, local routes.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
