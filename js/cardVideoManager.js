// Local video overrides shared by the catalog and its management page.
(function () {
  'use strict';
  const key = 'cardVideoOverrides';
  let overrides;
  try { overrides = JSON.parse(localStorage.getItem(key) || '{}'); } catch { overrides = {}; }
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) overrides = {};
  const cards = window.allCards || [];
  const defaults = new Map(cards.map(card => [card.word, { video: card.video, video_url: card.video_url }]));
  function apply(card) {
    if (Object.prototype.hasOwnProperty.call(overrides, card.word)) {
      card.video = overrides[card.word];
      card.video_url = overrides[card.word];
    }
  }
  cards.forEach(apply);
  function save(word, value) {
    const card = cards.find(item => item.word === word);
    if (!card) return false;
    const next = { ...overrides, [word]: value };
    try { localStorage.setItem(key, JSON.stringify(next)); }
    catch { return false; }
    overrides = next;
    apply(card);
    return true;
  }
  window.addVideoToCard = function (word, value) {
    try {
      const url = new URL(value);
      if (!['https:', 'http:'].includes(url.protocol) ||
          !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) return false;
      return save(word, url.href);
    } catch { return false; }
  };
  window.removeVideoFromCard = word => save(word, null);
  window.checkVideoCards = () => cards.filter(card => card.video);
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    let next;
    try { next = JSON.parse(event.newValue || '{}'); } catch { return; }
    if (!next || typeof next !== 'object' || Array.isArray(next)) return;
    overrides = next;
    cards.forEach(card => { Object.assign(card, defaults.get(card.word)); apply(card); });
  });
})();
