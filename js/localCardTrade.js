// js/localCardTrade.js - 本地卡片交易市場系統
// 完全使用 localStorage，不依賴 Google Sheet / Apps Script / fetch

(function () {
  'use strict';

  // =====================================================
  // 集中設定
  // =====================================================
  const CONFIG = {
    STORAGE_KEYS: {
      MARKET: 'cardTradeMarket',
      HISTORY: 'cardTradeHistory',
      CLAIMABLE: 'cardTradeClaimableStars',
      LAST_NPC_CHECK: 'cardTradeLastNpcCheck',
      DAILY_MARKET: 'cardTradeDailyMarket',
    },
    KEEP_LAST_COPY: false,
    NPC_INTERVAL: 10 * 60 * 1000,
    HISTORY_LIMIT: 200,
    MAX_LISTING_MULTIPLIER: 3,
    BUYER_NAMES: [
      '神秘收藏家', '卡片獵人', '稀有卡研究員', '旅行商人',
      '收藏家小明', '黃金卡商', '幸運玩家', '卡牌大師'
    ],
    // 稀有度價格區間：SSR 約 1-2 萬，R/A 約 5-10 倍便宜
    CARD_PRICE_RANGES: {
      '超稀有': { min: 10000, max: 22000 },
      'SSR':    { min: 10000, max: 22000 },
      '稀有':   { min: 1500, max: 5000 },
      'R':      { min: 1500, max: 5000 },
      'SR':     { min: 4000, max: 10000 },
      '普通':   { min: 800,  max: 3000 },
      'N':      { min: 800,  max: 3000 },
      'A':      { min: 800,  max: 3000 },
      '節日限定': { min: 12000, max: 30000 }
    },
    // 立即出售收購率
    INSTANT_SELL_RATES: {
      '超稀有': 0.50,
      'SSR':    0.50,
      '稀有':   0.55,
      'R':      0.55,
      'SR':     0.52,
      '普通':   0.60,
      'N':      0.60,
      'A':      0.60,
      '節日限定': 0.50
    },
    // 稀有度成交率加成
    RARITY_BONUS: {
      '普通': 0,
      'N': 0,
      'A': 0,
      '稀有': 0.05,
      'R': 0.05,
      'SR': 0.05,
      '超稀有': 0.10,
      'SSR': 0.10,
      '節日限定': 0.12
    },
    // 系列加成
    SERIES_BONUS: {
      '海賊王': 1.05,
      '航海王': 1.05,
      '希臘神話': 1.02
    },
    // 特殊卡手動定價
    SPECIAL_CARD_PRICES: {
      'Kaido': 190000,
      'Satoru Gojo': 180000
    }
  };

  // =====================================================
  // 工具函式
  // =====================================================
  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getPlayerId() {
    return localStorage.getItem('playerId') || localStorage.getItem('currentUser') || 'player';
  }

  function getPlayerName() {
    return localStorage.getItem('playerName') || localStorage.getItem('currentUser') || '玩家';
  }

  function getOwnedCards() {
    return LinkageSystem && LinkageSystem.cards && LinkageSystem.cards.getOwnedCards
      ? LinkageSystem.cards.getOwnedCards()
      : JSON.parse(localStorage.getItem('ownedCards') || '{}');
  }

  function setOwnedCards(cards) {
    if (LinkageSystem && LinkageSystem.cards && LinkageSystem.cards.setOwnedCards) {
      LinkageSystem.cards.setOwnedCards(cards);
    } else {
      localStorage.setItem('ownedCards', JSON.stringify(cards));
    }
  }

  function getCardCount(owned, cardWord) {
    const v = owned[cardWord];
    if (v === true) return 1;
    return Number(v) || 0;
  }

  function setCardCount(owned, cardWord, count) {
    if (count <= 0) {
      delete owned[cardWord];
    } else if (count === 1) {
      owned[cardWord] = true;
    } else {
      owned[cardWord] = count;
    }
  }

  function getUrlMediaType(url) {
    if (!url) return 'none';
    const l = String(url).toLowerCase();
    if (l.endsWith('.mp4') || l.endsWith('.webm')) return 'video';
    if (l.endsWith('.jpg') || l.endsWith('.jpeg') || l.endsWith('.png') || l.endsWith('.webp') || l.endsWith('.gif')) return 'image';
    return 'image';
  }

  function getCardMedia(item) {
    if (!item) return { type: 'none', src: '' };
    if (item.mediaType && item.mediaUrl) return { type: item.mediaType, src: item.mediaUrl };
    if (item.mediaUrl) return { type: item.mediaType || getUrlMediaType(item.mediaUrl), src: item.mediaUrl };
    const src = item.videoUrl || item.video || item.imageUrl || item.img || item.image || item.cardImage || item.cardVideo || '';
    const type = item.mediaType || ((item.videoUrl || item.video) ? 'video' : '') || getUrlMediaType(src);
    return { type, src };
  }

  function safeLSRead(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      console.warn('[LocalCardTrade] 讀取 localStorage 失敗:', key, e);
      return defaultValue;
    }
  }

  function safeLSWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[LocalCardTrade] 寫入 localStorage 失敗:', key, e);
      return false;
    }
  }

  // 字串轉穩定整數 hash
  function hashString(str) {
    let hash = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // 價格漂亮化整數
  function roundTradePrice(price) {
    const p = Number(price) || 0;
    if (p < 1000) return Math.round(p / 10) * 10;
    if (p < 10000) return Math.round(p / 50) * 50;
    if (p < 100000) return Math.round(p / 500) * 500;
    return Math.round(p / 1000) * 1000;
  }

  function formatStars(n) {
    return Number(n || 0).toLocaleString() + ' ⭐';
  }

  function getRarityRange(rarity) {
    const r = String(rarity || '').trim().toUpperCase();
    const mapping = {
      '超稀有': '超稀有', 'SSR': '超稀有',
      '稀有': '稀有', 'R': '稀有', 'SR': 'SR',
      '普通': '普通', 'N': '普通', 'A': '普通',
      '節日限定': '節日限定'
    };
    const key = mapping[r] || r;
    return CONFIG.CARD_PRICE_RANGES[key] || CONFIG.CARD_PRICE_RANGES['普通'];
  }

  function getInstantSellRate(rarity) {
    const r = String(rarity || '').trim().toUpperCase();
    const mapping = {
      '超稀有': '超稀有', 'SSR': '超稀有',
      '稀有': '稀有', 'R': '稀有', 'SR': 'SR',
      '普通': '普通', 'N': '普通', 'A': '普通',
      '節日限定': '節日限定'
    };
    const key = mapping[r] || r;
    return CONFIG.INSTANT_SELL_RATES[key] || 0.70;
  }

  // 日期種子亂數
  function seededRandom(seed) {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i);
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  // =====================================================
  // LocalCardTrade 主體
  // =====================================================
  const LocalCardTrade = {
    CONFIG: CONFIG,

    // -------- 市場讀寫 --------
    getMarket() {
      return safeLSRead(CONFIG.STORAGE_KEYS.MARKET, []);
    },
    saveMarket(market) {
      return safeLSWrite(CONFIG.STORAGE_KEYS.MARKET, market);
    },

    getHistory() {
      return safeLSRead(CONFIG.STORAGE_KEYS.HISTORY, []);
    },
    addHistory(record) {
      const history = this.getHistory();
      history.unshift(record);
      if (history.length > CONFIG.HISTORY_LIMIT) history.length = CONFIG.HISTORY_LIMIT;
      safeLSWrite(CONFIG.STORAGE_KEYS.HISTORY, history);
    },

    getClaimableStars() {
      return Number(safeLSRead(CONFIG.STORAGE_KEYS.CLAIMABLE, 0)) || 0;
    },
    addClaimableStars(amount) {
      const current = this.getClaimableStars();
      safeLSWrite(CONFIG.STORAGE_KEYS.CLAIMABLE, current + Number(amount || 0));
    },
    clearClaimableStars() {
      safeLSWrite(CONFIG.STORAGE_KEYS.CLAIMABLE, 0);
    },

    // -------- 價格系統 --------
    hashString,
    roundTradePrice,
    formatStars,

    getCardBasePrice(card) {
      if (!card) return 100;

      // 1. 手動市場價
      if (card.marketPrice && Number(card.marketPrice) > 0) return roundTradePrice(card.marketPrice);
      if (card.basePrice && Number(card.basePrice) > 0) return roundTradePrice(card.basePrice);

      // 2. 特殊卡手動定價
      const sp = CONFIG.SPECIAL_CARD_PRICES[card.word] || CONFIG.SPECIAL_CARD_PRICES[card.zh];
      if (sp) return roundTradePrice(sp);

      // 3. 依稀有度區間 + hash
      const range = getRarityRange(card.rarity);
      const seed = String(card.id || card.cardId || card.word || card.zh || 'unknown');
      const hash = hashString(seed);

      // SSR 內部再分 4 層
      let tierMin = range.min;
      let tierMax = range.max;
      const isSSR = (String(card.rarity).trim().toUpperCase() === 'SSR' ||
                     String(card.rarity).trim() === '超稀有');

      if (isSSR) {
        const tier = hash % 4;
        if (tier === 0) { tierMax = Math.min(range.max, 30000); }
        else if (tier === 1) { tierMin = 30000; tierMax = 80000; }
        else if (tier === 2) { tierMin = 80000; tierMax = 140000; }
        else { tierMin = 140000; }
      }

      const posHash = hashString(seed + '_pos');
      const ratio = (posHash % 10000) / 9999;
      const price = tierMin + (tierMax - tierMin) * ratio;
      return roundTradePrice(price);
    },

    getDailyMarketPrice(card) {
      if (!card) return 100;
      const base = this.getCardBasePrice(card);
      const range = getRarityRange(card.rarity);
      const today = getTodayStr();
      const seed = `${today}_${card.id || card.cardId || card.word || card.zh || 'unknown'}`;
      const hash = hashString(seed);
      const ratio = (hash % 1000) / 999;
      const multiplier = 0.85 + (ratio * 0.15);

      let price = base * multiplier;

      // 系列加成
      const series = card.category || card.series;
      if (series && CONFIG.SERIES_BONUS[series]) {
        price *= CONFIG.SERIES_BONUS[series];
      }

      // NEW 加成
      const newCards = safeLSRead('recentlyObtainedCards', []);
      if (newCards.includes(card.word)) {
        price *= 1.05;
      }

      // 最後 clamp 在稀有度範圍內
      price = Math.max(range.min, Math.min(range.max, price));
      return roundTradePrice(price);
    },

    getMarketValue(card) {
      return this.getDailyMarketPrice(card);
    },

    getInstantSellPrice(card) {
      return this.getBuybackPrices(card).instant;
    },

    getBuybackPrices(card) {
      const rarity = String(card.rarity || '').trim().toUpperCase();
      const bounds = ['SSR', '超稀有', '節日限定'].includes(rarity)
        ? [500, 800, 1000, 1500]
        : ['R', 'SR', '稀有'].includes(rarity) ? [60, 100, 120, 180] : [20, 40, 50, 80];
      const range = getRarityRange(card.rarity);
      const value = this.getCardBasePrice(card);
      const ratio = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
      const interpolate = (min, max) => Math.round((min + (max - min) * ratio) / 10) * 10;
      return { instant: interpolate(bounds[0], bounds[1]), max: interpolate(bounds[2], bounds[3]) };
    },

    getDailyPriceChange(card) {
      const base = this.getCardBasePrice(card);
      const daily = this.getMarketValue(card);
      if (base <= 0) return { diff: 0, percent: 0 };
      const diff = daily - base;
      const percent = (diff / base) * 100;
      return { diff, percent };
    },

    // 自訂售價提示
    getPriceHint(price, marketValue) {
      const ratio = marketValue > 0 ? price / marketValue : 1;
      if (ratio <= 0.70) return { emoji: '🔥', text: '超級便宜，很容易成交' };
      if (ratio <= 1.00) return { emoji: '✨', text: '好價格，成交機率高' };
      if (ratio <= 1.30) return { emoji: '👍', text: '合理價格' };
      if (ratio <= 1.70) return { emoji: '⚠️', text: '價格偏高，可能需要等待' };
      return { emoji: '🐢', text: '非常昂貴，成交機率很低' };
    },

    // -------- 排行榜 / 收藏總價值 --------
    getCollectionValue() {
      const owned = getOwnedCards();
      let total = 0;
      let count = 0;
      Object.keys(owned).forEach(word => {
        const card = (window.allCards || []).find(c => c.word === word);
        if (card) {
          const qty = getCardCount(owned, word);
          total += this.getMarketValue(card) * qty;
          count += qty;
        }
      });
      return { total, count };
    },

    getTopValuableCards(limit = 10) {
      const cards = (window.allCards || []).slice();
      cards.sort((a, b) => this.getMarketValue(b) - this.getMarketValue(a));
      return cards.slice(0, limit);
    },

    getBestDeals(limit = 5) {
      const market = this.getMarket().filter(l => l.status === 'active');
      const enriched = market.map(l => {
        const card = (window.allCards || []).find(c => c.word === l.cardId);
        const marketValue = card ? this.getMarketValue(card) : l.marketValue;
        const ratio = marketValue > 0 ? l.price / marketValue : 1;
        return { ...l, marketValue, ratio };
      });
      enriched.sort((a, b) => a.ratio - b.ratio);
      return enriched.slice(0, limit);
    },

    // -------- 每日行情（市場景氣、熱門系列） --------
    getDailyMarket(force = false) {
      let daily = safeLSRead(CONFIG.STORAGE_KEYS.DAILY_MARKET, null);
      const today = getTodayStr();
      if (!force && daily && daily.date === today) return daily;

      const r = seededRandom(today);
      const roll = r();
      let multiplier, mood, level;
      if (roll < 0.20) { multiplier = 0.85; mood = '低迷'; level = 'slump'; }
      else if (roll < 0.50) { multiplier = 1.00; mood = '普通'; level = 'normal'; }
      else if (roll < 0.80) { multiplier = 1.10; mood = '熱絡'; level = 'active'; }
      else { multiplier = 1.20; mood = '火熱'; level = 'hot'; }

      const allCategories = (window.allCards || []).map(c => c.category).filter(Boolean);
      const uniqueCategories = Array.from(new Set(allCategories));
      const hotSeries = uniqueCategories.length
        ? uniqueCategories[Math.floor(r() * uniqueCategories.length)]
        : '';

      daily = { date: today, multiplier, mood, level, hotSeries };
      safeLSWrite(CONFIG.STORAGE_KEYS.DAILY_MARKET, daily);
      return daily;
    },

    // -------- 列出 / 修改 / 取消 --------
    isCardListed(cardWord) {
      const market = this.getMarket();
      return market.some(l => l.cardId === cardWord && l.status === 'active');
    },

    getActiveListing(cardWord) {
      return this.getMarket().find(l => l.cardId === cardWord && l.status === 'active');
    },

    createListing(card, price) {
      const owned = getOwnedCards();
      const count = getCardCount(owned, card.word);
      if (count < 1) return { success: false, message: '你沒有這張卡片' };
      if (this.isCardListed(card.word)) return { success: false, message: '此卡片已經上架中' };

      const marketValue = this.getMarketValue(card);
      const basePrice = this.getCardBasePrice(card);
      const maxPrice = Math.max(1, basePrice * CONFIG.MAX_LISTING_MULTIPLIER);

      const listing = {
        listingId: 'LST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
        sellerId: getPlayerId(),
        sellerName: getPlayerName(),
        cardId: card.word,
        cardName: card.zh || card.word,
        cardImage: card.image || '',
        rarity: card.rarity || '',
        series: card.category || '',
        basePrice: basePrice,
        marketValue: marketValue,
        price: Number(price) || 1,
        previousPrice: null,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        soldAt: null,
        buyerId: null,
        buyerName: null
      };

      const market = this.getMarket();
      market.push(listing);
      this.saveMarket(market);

      this.addHistory({
        type: 'market_list',
        cardName: card.zh || card.word,
        cardId: card.word,
        price: listing.price,
        time: Date.now()
      });

      return { success: true, listing: listing };
    },

    updateListingPrice(listingId, newPrice) {
      const market = this.getMarket();
      const idx = market.findIndex(l => l.listingId === listingId);
      if (idx === -1) return { success: false, message: '找不到上架記錄' };
      const l = market[idx];
      if (l.status !== 'active') return { success: false, message: '此交易已結束' };

      l.previousPrice = l.price;
      l.price = Number(newPrice) || 1;
      l.updatedAt = Date.now();
      this.saveMarket(market);

      this.addHistory({
        type: 'market_update',
        cardName: l.cardName,
        cardId: l.cardId,
        price: l.price,
        previousPrice: l.previousPrice,
        time: Date.now()
      });

      return { success: true, listing: l };
    },

    cancelListing(listingId) {
      const market = this.getMarket();
      const idx = market.findIndex(l => l.listingId === listingId);
      if (idx === -1) return { success: false, message: '找不到上架記錄' };
      if (market[idx].status !== 'active') return { success: false, message: '此交易已結束' };

      market[idx].status = 'cancelled';
      this.saveMarket(market);

      this.addHistory({
        type: 'market_cancel',
        cardName: market[idx].cardName,
        cardId: market[idx].cardId,
        price: market[idx].price,
        time: Date.now()
      });

      return { success: true };
    },

    // -------- 立即出售 --------
    instantSell(card, confirmed = false) {
      const owned = getOwnedCards();
      const count = getCardCount(owned, card.word);

      if (count < 1) return { success: false, message: '你沒有這張卡片' };

      if (CONFIG.KEEP_LAST_COPY && count === 1) {
        return { success: false, message: '已保留最後一張收藏' };
      }

      const price = this.getInstantSellPrice(card);
      if (!confirmed) return { success: false, price, message: 'need_confirm' };

      // 扣除卡片
      setCardCount(owned, card.word, count - 1);
      setOwnedCards(owned);

      // 加星星
      const finalStars = StarManager && StarManager.addStars
        ? StarManager.addStars(price, 'instant_sell_' + card.word)
        : (parseInt(localStorage.getItem('totalStars') || '0') + price);
      if (!(StarManager && StarManager.addStars)) {
        window.StarSystem.setTotalStars(String(finalStars));
      }

      this.addHistory({
        type: 'instant_sell',
        cardName: card.zh || card.word,
        cardId: card.word,
        price,
        time: Date.now()
      });

      return { success: true, price, finalStars };
    },

    // -------- 與 AI 老闆議價 --------
    sellToAI(card, price) {
      const owned = getOwnedCards();
      const count = getCardCount(owned, card.word);

      if (count < 1) return { success: false, message: '你沒有這張卡片' };
      if (CONFIG.KEEP_LAST_COPY && count === 1) {
        return { success: false, message: '已保留最後一張收藏' };
      }

      const finalPrice = Number(price);
      if (!Number.isSafeInteger(finalPrice) || finalPrice <= 0) {
        return { success: false, message: '議價金額無效' };
      }
      const limits = this.getBuybackPrices(card);
      if (finalPrice <= limits.instant || finalPrice > limits.max) {
        return { success: false, message: '報價已超出收購範圍，請重新議價' };
      }

      setCardCount(owned, card.word, count - 1);
      setOwnedCards(owned);

      const finalStars = StarManager && StarManager.addStars
        ? StarManager.addStars(finalPrice, 'ai_sell_' + card.word)
        : (parseInt(localStorage.getItem('totalStars') || '0') + finalPrice);
      if (!(StarManager && StarManager.addStars)) {
        window.StarSystem.setTotalStars(String(finalStars));
      }

      const recordedDeals = this.getHistory().filter(entry => entry.type === 'ai_sell').length;
      const dealCount = Math.max(Number(localStorage.getItem('aiNegotiationCompleted')) || 0, recordedDeals);
      localStorage.setItem('aiNegotiationCompleted', String(dealCount + 1));
      this.addHistory({
        type: 'ai_sell',
        cardName: card.zh || card.word,
        cardId: card.word,
        price: finalPrice,
        time: Date.now()
      });

      return { success: true, price: finalPrice, finalStars };
    },

    // 出售重複卡（數量 > 1 的多餘部分）
    sellDuplicates(confirm = false) {
      const owned = getOwnedCards();
      const duplicates = [];
      let total = 0;

      Object.keys(owned).forEach(word => {
        if (this.isCardListed(word)) return;
        const count = getCardCount(owned, word);
        if (count > 1) {
          const card = (window.allCards || []).find(c => c.word === word);
          if (card) {
            const qty = count - 1;
            const price = this.getInstantSellPrice(card);
            duplicates.push({ word, card, qty, price: price * qty });
            total += price * qty;
          }
        }
      });

      if (!confirm) return { success: false, duplicates, total, message: 'need_confirm' };

      duplicates.forEach(({ word, card, qty }) => {
        const current = getCardCount(owned, word);
        setCardCount(owned, word, Math.max(1, current - qty));
      });
      setOwnedCards(owned);

      if (StarManager && StarManager.addStars) {
        StarManager.addStars(total, 'bulk_instant_sell');
      } else {
        const current = parseInt(localStorage.getItem('totalStars') || '0') + total;
        window.StarSystem.setTotalStars(String(current));
      }

      this.addHistory({
        type: 'bulk_instant_sell',
        cards: duplicates.map(d => d.word),
        total,
        time: Date.now()
      });

      return { success: true, total };
    },

    // -------- 領取收益 --------
    claimRevenue() {
      const amount = this.getClaimableStars();
      if (amount <= 0) return { success: false, message: '沒有待領收益' };

      this.clearClaimableStars();

      if (StarManager && StarManager.addStars) {
        StarManager.addStars(amount, 'market_revenue');
      } else {
        const current = parseInt(localStorage.getItem('totalStars') || '0') + amount;
        window.StarSystem.setTotalStars(String(current));
      }

      this.addHistory({
        type: 'claim_revenue',
        amount,
        time: Date.now()
      });

      return { success: true, amount };
    },

    // -------- NPC 購買判定 --------
    getNpcBuyProbability(listing) {
      const card = (window.allCards || []).find(c => c.word === listing.cardId);
      const limits = this.getBuybackPrices(card || {
        word: listing.cardId, rarity: listing.rarity, basePrice: listing.basePrice
      });
      const marketValue = limits.max;
      const price = Number(listing.price);
      if (!Number.isSafeInteger(price) || price <= 0 || price > limits.max) return 0;
      const ratio = price / marketValue;

      let prob;
      if (ratio <= 0.70) prob = 0.90;
      else if (ratio <= 0.90) prob = 0.75;
      else if (ratio <= 1.10) prob = 0.55;
      else if (ratio <= 1.30) prob = 0.35;
      else if (ratio <= 1.60) prob = 0.15;
      else prob = 0.05;

      // 稀有度加成
      prob += CONFIG.RARITY_BONUS[listing.rarity] || 0;

      // SSR 再 +5%
      const r = String(listing.rarity).trim().toUpperCase();
      if (r === 'SSR' || r === '超稀有') prob += 0.05;

      // 熱門系列加成
      const daily = this.getDailyMarket();
      if (daily.hotSeries && listing.series === daily.hotSeries) {
        prob += 0.10;
      }

      return Math.max(0.03, Math.min(0.95, prob));
    },

    checkNpcPurchases(force = false) {
      const now = Date.now();
      const last = Number(localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_NPC_CHECK) || '0');
      if (!force && now - last < CONFIG.NPC_INTERVAL) return { sold: 0, checked: false };

      localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_NPC_CHECK, String(now));

      const market = this.getMarket();
      const myId = getPlayerId();
      const owned = getOwnedCards();
      let soldCount = 0;

      market.forEach(l => {
        if (l.status !== 'active' || l.sellerId !== myId) return;

        const prob = this.getNpcBuyProbability(l);
        if (prob > 0 && getCardCount(owned, l.cardId) > 0 && Math.random() < prob) {
          // NPC 買走
          l.status = 'sold';
          l.soldAt = Date.now();
          l.buyerId = 'npc_' + Math.random().toString(36).substr(2, 6);
          l.buyerName = CONFIG.BUYER_NAMES[Math.floor(Math.random() * CONFIG.BUYER_NAMES.length)];

          // 成交後才從 ownedCards 扣除
          if (owned[l.cardId]) {
            const count = getCardCount(owned, l.cardId);
            setCardCount(owned, l.cardId, count - 1);
          }

          // 收益待領
          this.addClaimableStars(l.price);

          this.addHistory({
            type: 'market_sell',
            cardName: l.cardName,
            cardId: l.cardId,
            price: l.price,
            buyer: l.buyerName,
            time: Date.now()
          });

          soldCount++;
        }
      });

      this.saveMarket(market);
      if (soldCount > 0) setOwnedCards(owned);

      return { sold: soldCount, checked: true };
    },

    getSoldNotifications() {
      const market = this.getMarket();
      const myId = getPlayerId();
      return market.filter(l => l.sellerId === myId && l.status === 'sold' && !l.notified);
    },

    markNotified(listingId) {
      const market = this.getMarket();
      const l = market.find(x => x.listingId === listingId);
      if (l) {
        l.notified = true;
        this.saveMarket(market);
      }
    },

    // 初始化
    init() {
      this.getDailyMarket(); // 預先產生當日行情
      this.checkNpcPurchases(); // 載入時檢查一次

      // 定時檢查 NPC
      setInterval(() => this.checkNpcPurchases(), CONFIG.NPC_INTERVAL);
    }
  };

  window.LocalCardTrade = LocalCardTrade;
})();
