const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const rules = require('../js/gachaRules.js');
const other = { word: 'other', zh: '其他 SSR', rarity: '超稀有' };
const wish = { word: 'wish', zh: '目標', rarity: '超稀有' };
const common = { word: 'common', rarity: '普通' };
const cards = [other, wish, common];
assert.throws(() => rules.draw({ cards: [] }));
assert.equal(rules.count('bad'), 0);
assert.equal(rules.draw({ cards, pity: 49, random: () => 0 }).card, other);
assert.equal(rules.draw({ cards, wish, pity: 49, wishPity: 69, random: () => .9 }).card, wish);
const normalSSR = rules.draw({ cards, wish, pity: 49, wishPity: 38, random: () => 0 });
assert.equal(normalSSR.pity, 0); assert.equal(normalSSR.wishPity, 39);
const naturalWish = rules.draw({ cards, wish, random: () => 0 });
assert.equal(naturalWish.isWishSuccess, true); assert.equal(naturalWish.wishPity, 0);
let state = { pity: 0, wishPity: 0 };
for (let i = 1; i <= 70; i++) {
  const result = rules.draw({ cards, wish, ...state, random: () => .4 });
  assert.equal(result.isWishSuccess, i === 70);
  state = result;
}
assert.equal(rules.draw({ cards, wishPity: 50, random: () => .8 }).wishPity, 0);
const source = fs.readFileSync(path.join(__dirname, '../gacha.html'), 'utf8');
function body(name) {
  const matches = [...source.matchAll(new RegExp('^    function ' + name + '\\([^\\n]*\\) \\{(?:[^\\n]*\\}|[\\s\\S]*?^    \\}[ \\t]*$)', 'gm'))];
  assert.equal(matches.length, 1, `${name} must have one implementation`);
  return matches[0][0];
}
const nodes = new Map();
for (const id of ['currentWish', 'setWishBtn', 'clearWishBtn', 'wishPoolSSR', 'wishSearchGlobal', 'wishSettings', 'wishPoolNotice']) {
  nodes.set(id, { value: '', textContent: '', classList: { toggle() {} } });
}
const saved = new Map(); const owned = new Set();
const c = vm.createContext({ allCards: cards, currentWishCard: null, wishPityCounter: 0,
  isDrawTransactionActive: false, isGachaAnimating: false, isSSRAnimationPlaying: false,
  currentPool: 'normal', WISH_PITY_THRESHOLD: 70,
  localStorage: { setItem: (k, v) => saved.set(k, v), removeItem: k => saved.delete(k) },
  document: { getElementById: id => nodes.get(id) }, savePityCounters() {},
  LinkageSystem: { cards: { isCardOwned: word => owned.has(word) }, notifications: { show() {} } } });
for (const name of ['getCurrentWishCard', 'updateWishDisplay', 'setWishCard', 'clearWishCard']) vm.runInContext(body(name), c);
nodes.get('wishPoolSSR').value = wish.word;
c.updateWishDisplay(); assert.equal(c.currentWishCard, null); assert.match(nodes.get('currentWish').textContent, /尚未設定/);
c.setWishCard(); assert.equal(c.currentWishCard.word, wish.word);
nodes.get('wishPoolSSR').value = other.word; c.updateWishDisplay();
assert.match(nodes.get('currentWish').textContent, /目標/); assert.equal(c.currentWishCard.word, wish.word);
c.wishPityCounter = 15; c.setWishCard(); assert.equal(c.wishPityCounter, 15);
c.currentPool = 'series'; c.updateWishDisplay(); assert.equal(nodes.get('setWishBtn').disabled, true);
c.currentPool = 'normal'; c.isDrawTransactionActive = true; c.clearWishCard(); assert.ok(c.currentWishCard);
c.isDrawTransactionActive = false; c.clearWishCard(); assert.equal(c.currentWishCard, null); assert.equal(c.wishPityCounter, 0);
c.currentWishCard = wish; owned.add(wish.word); c.updateWishDisplay(); assert.equal(c.currentWishCard, null);
// Integration: all ten rewards must be persisted before an unresolved animation;
// a second click must neither spend currency nor grant another batch.
let grants = 0, spent = 0;
const drawContext = vm.createContext({
  isDrawTransactionActive: false, isGachaAnimating: false, isSSRAnimationPlaying: false,
  allCards: cards, stars: 1500, document: { getElementById: () => null },
  LinkageSystem: { stars: { get: () => 1500 - spent, subtract: n => { spent += n; return true; } }, notifications: { show() {} } },
  pauseBGM() {}, rollNormalCard: () => ({ selectedCard: common, isWishSuccess: false }),
  processDraw: card => { grants++; return { type: 'new_card_unlocked', card }; },
  recordGachaDraw() {}, updateWishDisplay() {}, setGachaControlsLocked() {}, isSSRCard: () => false,
  showCardAsync: () => new Promise(() => {}), console
});
vm.runInContext(body('drawTen'), drawContext);
drawContext.drawTen(); assert.equal(grants, 10); assert.equal(spent, 1500);
drawContext.drawTen(); assert.equal(grants, 10); assert.equal(spent, 1500);
assert.equal(drawContext.isDrawTransactionActive, true);
for (const name of ['fillWishSelect', 'updateWishPreview']) body(name);
console.log('PASS: 50/70 pity boundaries, wish persistence, draft versus saved state, series restriction, cancellation, ten-draw precommit and double-click guard.');

