(function () {
  const DEFAULT_SCRIPT_URL = localStorage.getItem('googleSheetApiUrl') || window.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzx6eM_OyYsJgCGM942WT0U1q7g4vpcUg1IslWC_luRkzJExPRWSeyh11GUd4ESuFx62Q/exec';

  function getScriptUrl() {
    return (localStorage.getItem('googleSheetApiUrl') || window.GOOGLE_SCRIPT_URL || DEFAULT_SCRIPT_URL || '').trim();
  }

  function setScriptUrl(url) {
    const normalized = String(url || '').trim();
    if (normalized) {
      localStorage.setItem('googleSheetApiUrl', normalized);
    }
    return normalized;
  }

  function ensureScriptUrl() {
    const url = getScriptUrl();
    if (!url) {
      throw new Error('請先設定 Google Apps Script Web App URL');
    }
    return url;
  }

  function getCurrentPlayerName() {
    const name = localStorage.getItem('playerName');
    return name && name.trim() ? name.trim() : '玩家';
  }

  function getOrCreatePlayerId() {
    let playerId = localStorage.getItem('playerId');
    if (!playerId) {
      playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('playerId', playerId);
    }
    return playerId;
  }

  function getLocalPlayerStars() {
    const totalStars = Number(localStorage.getItem('totalStars') || '0');
    const playerStars = Number(localStorage.getItem('playerStars') || totalStars || 0);
    return Number.isFinite(playerStars) && playerStars >= 0 ? Math.floor(playerStars) : 0;
  }

  function saveLocalPlayerStars(stars) {
    const normalized = Number.isFinite(Number(stars)) && Number(stars) >= 0 ? Math.floor(Number(stars)) : 0;
    localStorage.setItem('playerStars', String(normalized));
    localStorage.setItem('totalStars', String(normalized));
    return normalized;
  }

  function getOwnedCardsMap() {
    try {
      return JSON.parse(localStorage.getItem('ownedCards') || '{}') || {};
    } catch (error) {
      return {};
    }
  }

  function saveOwnedCardsMap(cards) {
    localStorage.setItem('ownedCards', JSON.stringify(cards || {}));
  }

  function addCardToLocalCollection(cardId) {
    const owned = getOwnedCardsMap();
    owned[cardId] = true;
    saveOwnedCardsMap(owned);
    return owned;
  }

  function removeCardFromLocalCollection(cardId) {
    const owned = getOwnedCardsMap();
    delete owned[cardId];
    saveOwnedCardsMap(owned);
    return owned;
  }

  function getListedCardsMap() {
    try {
      return JSON.parse(localStorage.getItem('tradeListedCards') || '{}') || {};
    } catch (error) {
      return {};
    }
  }

  function saveListedCardsMap(cards) {
    localStorage.setItem('tradeListedCards', JSON.stringify(cards || {}));
  }

  function markCardAsListed(cardId, tradeId) {
    const listed = getListedCardsMap();
    listed[cardId] = {
      tradeId: tradeId || '',
      listedAt: new Date().toISOString()
    };
    saveListedCardsMap(listed);
    return listed;
  }

  function unmarkCardAsListed(cardId) {
    const listed = getListedCardsMap();
    delete listed[cardId];
    saveListedCardsMap(listed);
    return listed;
  }

  function isCardListed(cardId) {
    const listed = getListedCardsMap();
    return Boolean(cardId && listed[cardId]);
  }

  function getCardMeta(cardId) {
    const allCards = Array.isArray(window.allCards) ? window.allCards : [];
    const card = allCards.find(item => item.word === cardId || item.id === cardId || item.cardId === cardId);
    if (!card) return null;

    return {
      cardId: card.word || card.id || card.cardId || cardId,
      cardName: card.zh || card.name || card.cardName || card.title || cardId,
      rarity: card.rarity === '超稀有' ? 'SSR' : card.rarity === '稀有' ? 'R' : card.rarity === '普通' ? 'A' : (card.rarity || ''),
      imageUrl: card.image || ''
    };
  }

  function buildPlayerCardPayload(cardIds) {
    const ids = Array.isArray(cardIds) ? cardIds : Object.keys(getOwnedCardsMap());
    return ids.map(cardId => {
      const meta = getCardMeta(cardId) || {
        cardId,
        cardName: cardId,
        rarity: '',
        imageUrl: ''
      };

      return {
        id: `${getOrCreatePlayerId()}_${meta.cardId}`,
        playerId: getOrCreatePlayerId(),
        cardId: meta.cardId,
        cardName: meta.cardName,
        rarity: meta.rarity,
        imageUrl: meta.imageUrl,
        quantity: 1,
        locked: false
      };
    });
  }

  async function sheetGet(action, params = {}) {
    const scriptUrl = ensureScriptUrl();
    const url = new URL(scriptUrl);
    url.searchParams.set('action', action);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      mode: 'cors'
    });

    const rawText = await response.text();
    let json;

    try {
      json = JSON.parse(rawText);
    } catch (error) {
      throw new Error(`Google Sheet 回傳格式錯誤：${rawText.slice(0, 120) || '空白回應'}`);
    }

    if (!response.ok) {
      throw new Error(json.message || `讀取失敗 (${response.status})`);
    }

    if (json && json.success === false) {
      throw new Error(json.message || 'Google Sheet 讀取失敗');
    }

    return json;
  }

  async function sheetPost(action, data = {}) {
    const scriptUrl = ensureScriptUrl();
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify({
        action,
        ...data
      })
    });

    const rawText = await response.text();
    let json;

    try {
      json = JSON.parse(rawText);
    } catch (error) {
      throw new Error(`Google Sheet 回傳格式錯誤：${rawText.slice(0, 120) || '空白回應'}`);
    }

    if (!response.ok) {
      throw new Error(json.message || `請求失敗 (${response.status})`);
    }

    if (json && json.success === false) {
      throw new Error(json.message || 'Google Sheet 寫入失敗');
    }

    return json;
  }

  async function ensurePlayerProfile() {
    return sheetPost('upsertPlayer', {
      playerId: getOrCreatePlayerId(),
      playerName: getCurrentPlayerName(),
      initialStars: getLocalPlayerStars()
    });
  }

  async function getPlayerBalance() {
    return sheetGet('getPlayerBalance', {
      playerId: getOrCreatePlayerId(),
      playerName: getCurrentPlayerName()
    });
  }

  async function syncPlayerCards(cardIds) {
    const payload = buildPlayerCardPayload(cardIds);
    return sheetPost('syncPlayerCards', {
      playerId: getOrCreatePlayerId(),
      playerName: getCurrentPlayerName(),
      cards: payload
    });
  }

  async function listMyCards() {
    return sheetGet('listMyCards', { playerId: getOrCreatePlayerId() });
  }

  async function getMarketCards() {
    return sheetGet('getMarketCards');
  }

  async function getMyOrders() {
    return sheetGet('getMyOrders', { playerId: getOrCreatePlayerId() });
  }

  async function getSellerOrders() {
    return sheetGet('getSellerOrders', { playerId: getOrCreatePlayerId() });
  }

  async function sellCard(card, price) {
    const meta = card?.cardId ? card : getCardMeta(card?.word || card?.cardId || card);
    if (!meta || !meta.cardId) {
      throw new Error('找不到卡片資料');
    }

    return sheetPost('sellCard', {
      playerId: getOrCreatePlayerId(),
      playerName: getCurrentPlayerName(),
      cardId: meta.cardId,
      cardName: meta.cardName,
      rarity: meta.rarity,
      imageUrl: meta.imageUrl,
      price: Number(price)
    });
  }

  async function cancelTrade(tradeId) {
    return sheetPost('cancelTrade', {
      tradeId,
      playerId: getOrCreatePlayerId(),
      playerName: getCurrentPlayerName()
    });
  }

  async function buyCard(tradeId) {
    return sheetPost('buyCard', {
      tradeId,
      buyerId: getOrCreatePlayerId(),
      buyerName: getCurrentPlayerName(),
      initialStars: getLocalPlayerStars()
    });
  }

  async function getSellerClaimableTrades(sellerId) {
    return sheetGet('getSellerClaimableTrades', { sellerId });
  }

  async function claimSoldCardStars(tradeId) {
    return sheetPost('claimSoldCardStars', {
      tradeId,
      sellerId: getOrCreatePlayerId(),
      sellerName: getCurrentPlayerName()
    });
  }

  async function claimAllSoldCardStars() {
    return sheetPost('claimAllSoldCardStars', {
      sellerId: getOrCreatePlayerId(),
      sellerName: getCurrentPlayerName()
    });
  }

  async function syncPlayerName(newName) {
    return sheetPost('syncPlayerName', {
      playerId: getOrCreatePlayerId(),
      playerName: newName
    });
  }

  window.GoogleSheetTradeApi = {
    getScriptUrl,
    setScriptUrl,
    getCurrentPlayerName,
    getOrCreatePlayerId,
    getLocalPlayerStars,
    saveLocalPlayerStars,
    getOwnedCardsMap,
    saveOwnedCardsMap,
    addCardToLocalCollection,
    removeCardFromLocalCollection,
    getListedCardsMap,
    saveListedCardsMap,
    markCardAsListed,
    unmarkCardAsListed,
    isCardListed,
    getCardMeta,
    buildPlayerCardPayload,
    sheetGet,
    sheetPost,
    ensurePlayerProfile,
    getPlayerBalance,
    syncPlayerCards,
    listMyCards,
    getMarketCards,
    getMyOrders,
    getSellerOrders,
    sellCard,
    cancelTrade,
    buyCard,
    getSellerClaimableTrades,
    claimSoldCardStars,
    claimAllSoldCardStars,
    syncPlayerName
  };
})();
