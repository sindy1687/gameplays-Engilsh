(function () {
  'use strict';

  // 取得目前頁面設定的 Apps Script Web App URL
  const DEFAULT_SCRIPT_URL = localStorage.getItem('googleSheetApiUrl') || window.GOOGLE_SCRIPT_URL || window.GAS_WEB_APP_URL || '';

  function getScriptUrl() {
    return (localStorage.getItem('googleSheetApiUrl') || window.GOOGLE_SCRIPT_URL || window.GAS_WEB_APP_URL || DEFAULT_SCRIPT_URL || '').trim();
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
    return normalized;
  }

  function addCardToLocalCollection(cardId) {
    if (!cardId) return;
    try {
      const owned = JSON.parse(localStorage.getItem('ownedCards') || '{}');
      owned[cardId] = (Number(owned[cardId]) || 0) + 1;
      localStorage.setItem('ownedCards', JSON.stringify(owned));
    } catch (error) {
      console.warn('[GoogleSheetApi] addCardToLocalCollection 失敗:', error);
    }
  }

  const LISTED_CARDS_KEY = 'listedCards';

  function getListedCards() {
    try {
      return JSON.parse(localStorage.getItem(LISTED_CARDS_KEY) || '{}');
    } catch (error) {
      return {};
    }
  }

  function markCardAsListed(cardWord, tradeId) {
    if (!cardWord) return;
    try {
      const listed = getListedCards();
      listed[cardWord] = { tradeId: tradeId || true, listedAt: Date.now() };
      localStorage.setItem(LISTED_CARDS_KEY, JSON.stringify(listed));
    } catch (error) {
      console.warn('[GoogleSheetApi] markCardAsListed 失敗:', error);
    }
  }

  function unmarkCardAsListed(cardWord) {
    if (!cardWord) return;
    try {
      const listed = getListedCards();
      delete listed[cardWord];
      localStorage.setItem(LISTED_CARDS_KEY, JSON.stringify(listed));
    } catch (error) {
      console.warn('[GoogleSheetApi] unmarkCardAsListed 失敗:', error);
    }
  }

  function isCardListed(cardWord) {
    if (!cardWord) return false;
    const listed = getListedCards();
    return listed[cardWord] !== undefined;
  }

  // 取得原生 fetch，避免被其他 wrapper（例如 Live Server 注入的 main.js）攔截
  const nativeFetch = (typeof window !== 'undefined' && window.fetch)
    ? window.fetch.bind(window)
    : (typeof globalThis !== 'undefined' && globalThis.fetch)
      ? globalThis.fetch.bind(globalThis)
      : undefined;

  if (!nativeFetch) {
    throw new Error('瀏覽器不支援 fetch');
  }

  // 通用 GET 請求（使用原生 fetch，避免任何 wrapper 加入自訂 header）
  async function sheetGet(action, params) {
    const url = ensureScriptUrl();
    const query = new URLSearchParams();
    query.append('action', action);
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          query.append(key, value);
        }
      });
    }
    const fullUrl = url + (url.indexOf('?') >= 0 ? '&' : '?') + query.toString();
    console.log('[sheetGet] action:', action, 'URL:', fullUrl);

    const response = await nativeFetch(fullUrl);

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const data = await response.json();
    console.log('[sheetGet] response:', data);
    return data;
  }

  // 通用 POST 請求（text/plain 避免 preflight，無自訂 header）
  async function sheetPost(action, payload) {
    const url = ensureScriptUrl();
    const body = Object.assign({}, payload || {}, { action: action });
    console.log('[sheetPost] action:', action, 'payload:', body);

    const response = await nativeFetch(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const data = await response.json();
    console.log('[sheetPost] response:', data);
    return data;
  }

  // CORS 最小測試函式
  async function testGoogleSheetCors() {
    const url = ensureScriptUrl() + '?action=getMarketListings';
    console.log('[CORS TEST] URL:', url);

    try {
      const response = await nativeFetch(url);
      console.log('[CORS TEST] status:', response.status);
      const text = await response.text();
      console.log('[CORS TEST] body:', text);
      return { status: response.status, body: text };
    } catch (error) {
      console.error('[CORS TEST] 失敗:', error);
      return { error: error.message || error };
    }
  }

  // 玩家資料 - 本地優先，避免無網路時無法運作
  async function ensurePlayerProfile() {
    const playerId = getOrCreatePlayerId();
    const playerName = getCurrentPlayerName();
    const localStars = getLocalPlayerStars();
    try {
      await sheetPost('upsertPlayer', {
        playerId: playerId,
        playerName: playerName,
        initialStars: localStars
      });
    } catch (error) {
      console.warn('[GoogleSheetApi] ensurePlayerProfile 同步失敗，使用本地資料:', error);
    }
    return { playerId, playerName, stars: localStars };
  }

  async function syncPlayerName(playerName) {
    if (!playerName) return;
    const playerId = getOrCreatePlayerId();
    localStorage.setItem('playerName', playerName.trim());
    try {
      return await sheetPost('syncPlayerName', {
        playerId: playerId,
        playerName: playerName.trim()
      });
    } catch (error) {
      console.warn('[GoogleSheetApi] syncPlayerName 失敗:', error);
      return { success: true, playerId, playerName };
    }
  }

  async function syncPlayerCards(cardWords) {
    const playerId = getOrCreatePlayerId();
    try {
      return await sheetPost('syncPlayerCards', {
        playerId: playerId,
        cards: Array.isArray(cardWords) ? JSON.stringify(cardWords) : cardWords
      });
    } catch (error) {
      console.warn('[GoogleSheetApi] syncPlayerCards 失敗:', error);
      return { success: true, playerId, message: '卡片已同步（本地）' };
    }
  }

  async function getPlayerBalance() {
    const playerId = getOrCreatePlayerId();
    try {
      const result = await sheetGet('getPlayerBalance', { playerId });
      if (typeof result.stars === 'number') {
        saveLocalPlayerStars(result.stars);
      }
      return result;
    } catch (error) {
      console.warn('[GoogleSheetApi] getPlayerBalance 失敗，使用本地資料:', error);
      return { success: true, playerId, stars: getLocalPlayerStars() };
    }
  }

  // ===== 交易市場 API =====

  async function sellCard(card, price) {
    if (!card) throw new Error('缺少卡片資料');
    const playerId = getOrCreatePlayerId();
    const playerName = getCurrentPlayerName();

    return await sheetPost('createTradeListing', {
      sellerId: playerId,
      sellerName: playerName,
      playerId: playerId,
      playerName: playerName,
      cardId: String(card.word || card.id || ''),
      cardName: String(card.zh || card.word || ''),
      cardImage: String(card.image || ''),
      imageUrl: String(card.image || ''),
      rarity: String(card.rarity || ''),
      price: Number(price) || 0,
      quantity: 1
    });
  }

  async function getMarketListings() {
    const result = await sheetGet('getMarketListings', {});
    console.log('[交易市場] API RAW (getMarketListings):', result);
    return result;
  }

  async function getMyListings(playerId) {
    const id = String(playerId || getOrCreatePlayerId()).trim();
    const result = await sheetGet('getMyListings', { playerId: id });
    console.log('[交易市場] API RAW (getMyListings):', result);
    return result;
  }

  async function getSellerClaimableTrades(sellerId) {
    const id = String(sellerId || getOrCreatePlayerId()).trim();
    return await sheetGet('getSellerClaimableTrades', { sellerId: id });
  }

  async function claimSoldCardStars(tradeId) {
    const sellerId = getOrCreatePlayerId();
    const sellerName = getCurrentPlayerName();
    return await sheetPost('claimTradeRevenue', {
      tradeId: String(tradeId || ''),
      sellerId: sellerId,
      sellerName: sellerName
    });
  }

  async function claimAllSoldCardStars() {
    const sellerId = getOrCreatePlayerId();
    const sellerName = getCurrentPlayerName();
    return await sheetPost('claimAllTradeRevenue', {
      sellerId: sellerId,
      sellerName: sellerName
    });
  }

  async function buyCard(tradeId) {
    const buyerId = getOrCreatePlayerId();
    const buyerName = getCurrentPlayerName();
    const localStars = getLocalPlayerStars();
    return await sheetPost('buyTradeListing', {
      tradeId: String(tradeId || ''),
      buyerId: buyerId,
      buyerName: buyerName,
      initialStars: localStars
    });
  }

  async function cancelTrade(tradeId) {
    const playerId = getOrCreatePlayerId();
    const playerName = getCurrentPlayerName();
    return await sheetPost('cancelTradeListing', {
      tradeId: String(tradeId || ''),
      playerId: playerId,
      playerName: playerName
    });
  }

  // ===== 公開 API =====

  // 提供 shop.html / cards.html 慣用的方法名稱與別名
  const GoogleSheetTradeApi = {
    getScriptUrl,
    setScriptUrl,
    getCurrentPlayerName,
    getOrCreatePlayerId,
    getLocalPlayerStars,
    saveLocalPlayerStars,
    addCardToLocalCollection,
    markCardAsListed,
    unmarkCardAsListed,
    isCardListed,
    ensurePlayerProfile,
    syncPlayerName,
    syncPlayerCards,
    getPlayerBalance,

    // 交易市場 - 統一正式名稱
    createTradeListing: sellCard,
    buyTradeListing: buyCard,
    cancelTradeListing: cancelTrade,
    claimTradeRevenue: claimSoldCardStars,
    claimAllTradeRevenue: claimAllSoldCardStars,

    // 交易市場 - 舊名稱（向後相容）
    sellCard,
    buyCard,
    cancelTrade,

    // 讀取
    getMarketListings,
    getMyListings,
    getSellerClaimableTrades,
    claimSoldCardStars,
    claimAllSoldCardStars,

    // 相容 shop.html 舊方法名稱
    getMarketCards: getMarketListings,
    getMyOrders: getMyListings,
    getSellerOrders: getMyListings,

    // 原始工具（進階使用）
    sheetGet,
    sheetPost,
    testGoogleSheetCors
  };

  // 同時提供 GoogleSheetApi 名稱向後相容
  window.GoogleSheetTradeApi = GoogleSheetTradeApi;
  window.GoogleSheetApi = GoogleSheetTradeApi;
})();