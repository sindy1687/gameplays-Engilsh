// 星座排行榜與交易市場 Google Apps Script 程式碼
// 請將此程式碼複製到您的 Google Apps Script 專案的 Code.gs 中

const SPREADSHEET_ID = '1OA0NwILo8LdRNm0EiQmeBLmemjZaW1yxWcMELrEnvBw';
const SHEET_NAME = 'Quiz排行榜';

// JSON 回應輔助函式
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// 處理 GET 請求 - 與 doPost 共用相同邏輯
function doGet(e) {
  return doPost(e);
}

// 處理 OPTIONS 預檢請求（Apps Script 不一定支援，保留備用）
function doOptions(e) {
  return jsonResponse({ success: true });
}

// 主要的 doPost 函式 - 接收前端 POST 和 GET 請求
function doPost(e) {
  try {
    // 支援從 URL 參數或 body 中取得 action
    let action;
    let payload = {};

    Logger.log('doPost called');
    Logger.log('e.parameter: ' + JSON.stringify(e.parameter || {}));
    Logger.log('e.postData: ' + (e.postData ? 'yes' : 'no'));

    // 先從 URL 參數取得所有參數
    if (e.parameter) {
      var paramKeys = Object.keys(e.parameter);
      for (var i = 0; i < paramKeys.length; i++) {
        var key = paramKeys[i];
        if (key !== 'action') {
          payload[key] = e.parameter[key];
        }
      }
    }

    Logger.log('Payload from params: ' + JSON.stringify(payload));

    if (e.postData && e.postData.contents) {
      try {
        const bodyData = JSON.parse(e.postData.contents);
        action = bodyData.action || e.parameter.action;
        // body 資料覆蓋 URL 參數
        var bodyKeys = Object.keys(bodyData);
        for (var i = 0; i < bodyKeys.length; i++) {
          var key = bodyKeys[i];
          if (key !== 'action') {
            payload[key] = bodyData[key];
          }
        }
      } catch (error) {
        action = e.parameter.action;
      }
    } else {
      action = e.parameter.action;
    }

    Logger.log('Final action: ' + action);
    Logger.log('Final payload: ' + JSON.stringify(payload));

    action = String(action || '');

    // 處理各種 action
    let result;

    switch (action) {
      case 'submitScore':
        result = handleSubmitScore(payload, e.parameter);
        break;
      case 'upsertPlayer':
        result = handleUpsertPlayer(payload, e.parameter);
        break;
      case 'getPlayerBalance':
        result = handleGetPlayerBalance(payload, e.parameter);
        break;
      case 'syncPlayerCards':
        result = handleSyncPlayerCards(payload, e.parameter);
        break;
      case 'listMyCards':
        result = handleListMyCards(payload, e.parameter);
        break;
      case 'syncPlayerName':
        result = handleSyncPlayerName(payload, e.parameter);
        break;
      case 'sellCard':
      case 'createTradeListing':
        result = handleSellCard(payload);
        break;
      case 'getMarketListings':
        result = handleGetMarketListings(payload);
        break;
      case 'getMyListings':
        result = handleGetMyListings(payload);
        break;
      case 'cancelTrade':
      case 'cancelTradeListing':
        result = handleCancelTrade(payload);
        break;
      case 'buyCard':
      case 'buyTradeListing':
        result = handleBuyCard(payload);
        break;
      case 'getSellerClaimableTrades':
        result = handleGetSellerClaimableTrades(payload);
        break;
      case 'claimSoldCardStars':
      case 'claimTradeRevenue':
        result = handleClaimSoldCardStars(payload);
        break;
      case 'claimAllSoldCardStars':
      case 'claimAllTradeRevenue':
        result = handleClaimAllSoldCardStars(payload);
        break;
      default:
        result = {
          success: false,
          message: '未知的 action',
          action: action
        };
    }

    return jsonResponse(result);

  } catch (error) {
    return jsonResponse({
      success: false,
      message: String(error && error.message ? error.message : error)
    });
  }
}

// ===== 星座排行榜功能 =====

function handleSubmitScore(payload, params) {
  const playerName = String(params.playerName || payload.playerName || '').trim();
  const level = String(params.level || payload.level || '').trim().toLowerCase();
  const score = Number(params.score || payload.score || 0);
  const correct = Number(params.correct || payload.correct || 0);
  const totalTime = Number(params.totalTime || payload.totalTime || 0);
  const averageTime = Number(params.averageTime || payload.averageTime || 0);

  if (!playerName) {
    return {
      success: false,
      error: 'playerName_missing'
    };
  }

  if (!level) {
    return {
      success: false,
      error: 'level_missing'
    };
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    return {
      success: false,
      error: 'sheet_not_found',
      sheetName: SHEET_NAME
    };
  }

  const now = new Date();

  sheet.appendRow([
    now,
    playerName,
    level,
    score,
    correct,
    totalTime,
    averageTime,
    now
  ]);

  SpreadsheetApp.flush();

  return {
    success: true,
    message: 'score_saved',
    playerName: playerName,
    level: level,
    score: score
  };
}

// ===== 玩家資料 stub =====

function handleUpsertPlayer(payload, params) {
  const playerId = String(params.playerId || payload.playerId || '').trim();
  const playerName = String(params.playerName || payload.playerName || '').trim();
  const initialStars = Number(params.initialStars || payload.initialStars || 0);

  if (!playerId) {
    return { success: false, message: '缺少玩家 ID' };
  }

  return {
    success: true,
    playerId: playerId,
    playerName: playerName,
    stars: initialStars
  };
}

function handleGetPlayerBalance(payload, params) {
  const playerId = String(params.playerId || payload.playerId || '').trim();

  if (!playerId) {
    return { success: false, message: '缺少玩家 ID' };
  }

  return {
    success: true,
    playerId: playerId,
    stars: 0
  };
}

function handleSyncPlayerCards(payload, params) {
  const playerId = String(params.playerId || payload.playerId || '').trim();

  if (!playerId) {
    return { success: false, message: '缺少玩家 ID' };
  }

  return {
    success: true,
    playerId: playerId,
    message: '卡片已同步'
  };
}

function handleListMyCards(payload, params) {
  const playerId = String(params.playerId || payload.playerId || '').trim();

  if (!playerId) {
    return { success: false, message: '缺少玩家 ID' };
  }

  return {
    success: true,
    playerId: playerId,
    cards: []
  };
}

function handleSyncPlayerName(payload, params) {
  const playerId = String(params.playerId || payload.playerId || '').trim();
  const playerName = String(params.playerName || payload.playerName || '').trim();

  if (!playerId) {
    return { success: false, message: '缺少玩家 ID' };
  }

  return {
    success: true,
    playerId: playerId,
    playerName: playerName
  };
}

// ===== 交易市場功能 =====

function getTradeMarketSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('TradeMarket');

  if (!sheet) {
    sheet = ss.insertSheet('TradeMarket');
    sheet.appendRow([
      'listingId',
      'sellerId',
      'sellerName',
      'cardId',
      'cardName',
      'cardImage',
      'rarity',
      'series',
      'price',
      'quantity',
      'status',
      'createdAt',
      'updatedAt'
    ]);
    sheet.getRange(1, 1, 1, 13).setFontWeight('bold');
    sheet.getRange(1, 1, 1, 13).setBackground('#4285f4');
    sheet.getRange(1, 1, 1, 13).setFontColor('white');
    sheet.autoResizeColumns(1, 13);
  }

  return sheet;
}

function handleSellCard(payload) {
  const playerId = String(payload.sellerId || payload.playerId || '').trim();
  const playerName = String(payload.sellerName || payload.playerName || '').trim();
  const cardId = String(payload.cardId || '').trim();
  const cardName = String(payload.cardName || '').trim();
  const cardImage = String(payload.cardImage || payload.imageUrl || '').trim();
  const rarity = String(payload.rarity || '').trim();
  const price = Number(payload.price || 0);

  if (!playerId) {
    return { success: false, message: '缺少玩家 ID' };
  }

  if (!cardId) {
    return { success: false, message: '缺少卡片 ID' };
  }

  if (!cardName) {
    return { success: false, message: '缺少卡片名稱' };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return { success: false, message: '價格必須大於 0' };
  }

  const sheet = getTradeMarketSheet_();
  const listingId = Utilities.getUuid();

  sheet.appendRow([
    listingId,
    playerId,
    playerName,
    cardId,
    cardName,
    cardImage,
    rarity,
    '',
    price,
    1,
    'active',
    new Date(),
    new Date()
  ]);

  return {
    success: true,
    tradeId: listingId,
    listingId: listingId,
    message: '上架成功'
  };
}

function handleGetMarketListings(payload) {
  const sheet = getTradeMarketSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      success: true,
      cards: []
    };
  }

  const headers = values[0];
  const listingIdCol = headers.indexOf('listingId');
  const sellerIdCol = headers.indexOf('sellerId');
  const sellerNameCol = headers.indexOf('sellerName');
  const cardIdCol = headers.indexOf('cardId');
  const cardNameCol = headers.indexOf('cardName');
  const cardImageCol = headers.indexOf('cardImage');
  const rarityCol = headers.indexOf('rarity');
  const seriesCol = headers.indexOf('series');
  const priceCol = headers.indexOf('price');
  const quantityCol = headers.indexOf('quantity');
  const statusCol = headers.indexOf('status');
  const createdAtCol = headers.indexOf('createdAt');

  const cards = [];

  for (let i = 1; i < values.length; i++) {
    const status = String(values[i][statusCol] || '').trim();

    if (status === 'active') {
      cards.push({
        tradeId: values[i][listingIdCol],
        listingId: values[i][listingIdCol],
        sellerId: values[i][sellerIdCol],
        sellerName: values[i][sellerNameCol],
        playerId: values[i][sellerIdCol],
        cardId: values[i][cardIdCol],
        cardName: values[i][cardNameCol],
        word: values[i][cardIdCol],
        imageUrl: values[i][cardImageCol],
        image: values[i][cardImageCol],
        rarity: values[i][rarityCol],
        series: values[i][seriesCol],
        price: Number(values[i][priceCol] || 0),
        quantity: Number(values[i][quantityCol] || 1),
        status: status,
        createdAt: values[i][createdAtCol],
        listingDate: values[i][createdAtCol]
      });
    }
  }

  return {
    success: true,
    trades: cards
  };
}

function handleGetMyListings(payload) {
  const playerId = String(payload.playerId || payload.sellerId || '').trim();

  if (!playerId) {
    return { success: false, message: '缺少玩家 ID' };
  }

  const sheet = getTradeMarketSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      success: true,
      orders: []
    };
  }

  const headers = values[0];
  const listingIdCol = headers.indexOf('listingId');
  const sellerIdCol = headers.indexOf('sellerId');
  const cardIdCol = headers.indexOf('cardId');
  const cardNameCol = headers.indexOf('cardName');
  const priceCol = headers.indexOf('price');
  const statusCol = headers.indexOf('status');
  const createdAtCol = headers.indexOf('createdAt');

  const orders = [];

  for (let i = 1; i < values.length; i++) {
    const rowSellerId = String(values[i][sellerIdCol] || '').trim();

    if (rowSellerId === playerId) {
      orders.push({
        tradeId: values[i][listingIdCol],
        cardId: values[i][cardIdCol],
        cardName: values[i][cardNameCol],
        price: Number(values[i][priceCol] || 0),
        status: values[i][statusCol],
        createdAt: values[i][createdAtCol]
      });
    }
  }

  return {
    success: true,
    trades: orders
  };
}

function handleCancelTrade(payload) {
  const tradeId = String(payload.tradeId || '').trim();
  const playerId = String(payload.playerId || '').trim();
  const playerName = String(payload.playerName || '').trim();

  if (!tradeId) {
    return { success: false, message: '缺少交易 ID' };
  }

  if (!playerId) {
    return { success: false, message: '缺少玩家 ID' };
  }

  const sheet = getTradeMarketSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return { success: false, message: '找不到交易商品' };
  }

  const headers = values[0];
  const listingIdCol = headers.indexOf('listingId');
  const sellerIdCol = headers.indexOf('sellerId');
  const priceCol = headers.indexOf('price');
  const statusCol = headers.indexOf('status');
  const updatedAtCol = headers.indexOf('updatedAt');

  let targetRow = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][listingIdCol] || '') === tradeId) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, message: '找不到此交易商品' };
  }

  const rowSellerId = String(values[targetRow - 1][sellerIdCol] || '');

  if (rowSellerId !== playerId) {
    return { success: false, message: '只能取消自己的上架商品' };
  }

  sheet.getRange(targetRow, statusCol + 1).setValue('cancelled');
  if (updatedAtCol >= 0) {
    sheet.getRange(targetRow, updatedAtCol + 1).setValue(new Date());
  }

  return {
    success: true,
    message: '已取消上架',
    tradeId: tradeId
  };
}

function handleBuyCard(payload) {
  const tradeId = String(payload.tradeId || '').trim();
  const buyerId = String(payload.buyerId || '').trim();
  const buyerName = String(payload.buyerName || '').trim();
  const initialStars = Number(payload.initialStars || 0);

  if (!tradeId) {
    return { success: false, message: '缺少交易 ID' };
  }

  if (!buyerId) {
    return { success: false, message: '缺少買家 ID' };
  }

  const sheet = getTradeMarketSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return { success: false, message: '找不到交易商品' };
  }

  const headers = values[0];
  const listingIdCol = headers.indexOf('listingId');
  const sellerIdCol = headers.indexOf('sellerId');
  const priceCol = headers.indexOf('price');
  const statusCol = headers.indexOf('status');
  const updatedAtCol = headers.indexOf('updatedAt');

  let targetRow = -1;
  let sellerId = '';
  let price = 0;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][listingIdCol] || '') === tradeId) {
      targetRow = i + 1;
      sellerId = String(values[i][sellerIdCol] || '');
      price = Number(values[i][priceCol] || 0);
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, message: '找不到此交易商品' };
  }

  if (sellerId === buyerId) {
    return { success: false, message: '不能購買自己的卡片' };
  }

  if (initialStars < price) {
    return { success: false, message: '星星不足' };
  }

  sheet.getRange(targetRow, statusCol + 1).setValue('sold');
  if (updatedAtCol >= 0) {
    sheet.getRange(targetRow, updatedAtCol + 1).setValue(new Date());
  }

  return {
    success: true,
    message: '購買成功',
    tradeId: tradeId,
    price: price
  };
}

function handleGetSellerClaimableTrades(payload) {
  const sellerId = String(payload.sellerId || '').trim();

  if (!sellerId) {
    return { success: false, message: '缺少賣家 ID' };
  }

  const sheet = getTradeMarketSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      success: true,
      trades: []
    };
  }

  const headers = values[0];
  const listingIdCol = headers.indexOf('listingId');
  const sellerIdCol = headers.indexOf('sellerId');
  const cardIdCol = headers.indexOf('cardId');
  const priceCol = headers.indexOf('price');
  const statusCol = headers.indexOf('status');
  const createdAtCol = headers.indexOf('createdAt');

  const trades = [];
  let totalAmount = 0;

  for (let i = 1; i < values.length; i++) {
    const rowSellerId = String(values[i][sellerIdCol] || '').trim();
    const status = String(values[i][statusCol] || '').trim();

    if (rowSellerId === sellerId && status === 'sold') {
      const price = Number(values[i][priceCol] || 0);
      trades.push({
        tradeId: values[i][listingIdCol],
        cardId: values[i][cardIdCol],
        price: price,
        status: status,
        createdAt: values[i][createdAtCol]
      });
      totalAmount += price;
    }
  }

  return {
    success: true,
    trades: trades,
    totalAmount: totalAmount,
    count: trades.length
  };
}

function handleClaimSoldCardStars(payload) {
  const tradeId = String(payload.tradeId || '').trim();
  const sellerId = String(payload.sellerId || '').trim();
  const sellerName = String(payload.sellerName || '').trim();

  if (!tradeId) {
    return { success: false, message: '缺少交易 ID' };
  }

  if (!sellerId) {
    return { success: false, message: '缺少賣家 ID' };
  }

  const sheet = getTradeMarketSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return { success: false, message: '找不到交易商品' };
  }

  const headers = values[0];
  const listingIdCol = headers.indexOf('listingId');
  const sellerIdCol = headers.indexOf('sellerId');
  const priceCol = headers.indexOf('price');
  const statusCol = headers.indexOf('status');

  let targetRow = -1;
  let price = 0;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][listingIdCol] || '') === tradeId) {
      targetRow = i + 1;
      price = Number(values[i][priceCol] || 0);
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, message: '找不到此交易商品' };
  }

  sheet.getRange(targetRow, statusCol + 1).setValue('claimed');

  // TODO: 更新玩家星星（需要 Players 工作表）
  return {
    success: true,
    message: '已領取星星',
    tradeId: tradeId,
    amount: price
  };
}

function handleClaimAllSoldCardStars(payload) {
  const sellerId = String(payload.sellerId || '').trim();
  const sellerName = String(payload.sellerName || '').trim();

  if (!sellerId) {
    return { success: false, message: '缺少賣家 ID' };
  }

  const result = handleGetSellerClaimableTrades({ sellerId: sellerId });
  const trades = result.trades || [];
  let claimedCount = 0;
  let totalAmount = 0;

  for (let i = 0; i < trades.length; i++) {
    const claimResult = handleClaimSoldCardStars({
      tradeId: trades[i].tradeId,
      sellerId: sellerId,
      sellerName: sellerName
    });

    if (claimResult.success) {
      claimedCount++;
      totalAmount += claimResult.amount || 0;
    }
  }

  return {
    success: true,
    message: '全部領取完成',
    claimedCount: claimedCount,
    totalAmount: totalAmount
  };
}

// 測試函式 - 直接寫入 Google Sheet
function testWrite() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  const now = new Date();

  sheet.appendRow([
    now,
    'APITest',
    'aries',
    88,
    4,
    50,
    10,
    now
  ]);

  SpreadsheetApp.flush();

  Logger.log('testWrite 完成，請檢查 Google Sheet 是否新增 APITest 列');
}

// 測試函式 - 檢查 Sheet 存取權限
function testSheetAccess() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  Logger.log('Sheet 名稱: ' + sheet.getName());
  Logger.log('Sheet 最後一行: ' + sheet.getLastRow());
}