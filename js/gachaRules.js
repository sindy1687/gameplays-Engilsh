(function (root) {
  'use strict';
  const count = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
  function draw({ cards, wish = null, pity = 0, wishPity = 0, random = Math.random }) {
    if (!Array.isArray(cards) || !cards.length) throw new Error('卡池尚未載入');
    const ssr = cards.filter(card => card.rarity === '超稀有');
    const others = cards.filter(card => card.rarity !== '超稀有');
    const target = wish && ssr.find(card => card.word === wish.word);
    const nextPity = count(pity) + 1;
    const nextWish = target ? count(wishPity) + 1 : 0;
    const pick = list => list[Math.min(list.length - 1, Math.floor(random() * list.length))];
    let card;
    if (target && nextWish >= 70) card = target;
    else if (ssr.length && nextPity >= 50) card = pick(ssr);
    else if (target && random() < 0.02) card = target;
    else card = random() < 0.03 && ssr.length ? pick(ssr) : pick(others.length ? others : cards);
    const isWishSuccess = Boolean(target && card.word === target.word);
    return { card, isWishSuccess, pity: card.rarity === '超稀有' ? 0 : nextPity,
      wishPity: isWishSuccess ? 0 : nextWish };
  }
  const api = { draw, count };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GachaRules = api;
})(typeof window === 'undefined' ? globalThis : window);
