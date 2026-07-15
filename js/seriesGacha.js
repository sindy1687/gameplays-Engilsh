// js/seriesGacha.js
// 系列抽卡池系統

console.log('seriesGacha.js 載入測試');

/**
 * 取得所有系列（從 allCards 的 category 自動產生）
 * @returns {string[]} 系列名稱陣列
 */
function getAllSeries() {
  if (!window.allCards || !Array.isArray(window.allCards)) {
    console.warn('allCards 尚未載入');
    return [];
  }
  
  const seriesSet = new Set();
  window.allCards.forEach(card => {
    if (card.category && typeof card.category === 'string') {
      seriesSet.add(card.category.trim());
    }
  });
  
  return Array.from(seriesSet).sort();
}

/**
 * 初始化系列抽卡券資料結構
 * @returns {object} 系列抽卡券物件
 */
function initSeriesGachaTickets() {
  const series = getAllSeries();
  const seriesTickets = {};
  
  series.forEach(s => {
    seriesTickets[s] = 0;
  });
  
  return seriesTickets;
}

/**
 * 取得完整的抽卡券資料結構
 * @returns {object} { normal: number, series: object }
 */
function getGachaTicketsData() {
  // 讀取舊的普通抽卡券（相容性）
  const normalTickets = parseInt(localStorage.getItem('gachaTickets') || '0');
  
  // 讀取系列抽卡券
  let seriesTicketsData = localStorage.getItem('seriesGachaTickets');
  let seriesTickets = {};
  
  if (seriesTicketsData) {
    try {
      seriesTickets = JSON.parse(seriesTicketsData);
    } catch (e) {
      console.error('解析系列抽卡券資料失敗:', e);
      seriesTickets = initSeriesGachaTickets();
    }
  } else {
    seriesTickets = initSeriesGachaTickets();
  }
  
  // 檢查是否有新系列，自動加入
  const allSeries = getAllSeries();
  let hasNewSeries = false;
  
  allSeries.forEach(s => {
    if (!(s in seriesTickets)) {
      seriesTickets[s] = 0;
      hasNewSeries = true;
    }
  });
  
  if (hasNewSeries) {
    localStorage.setItem('seriesGachaTickets', JSON.stringify(seriesTickets));
  }
  
  return {
    normal: normalTickets,
    series: seriesTickets
  };
}

/**
 * 儲存抽卡券資料
 * @param {object} ticketsData { normal: number, series: object }
 */
function saveGachaTicketsData(ticketsData) {
  // 儲存普通抽卡券（相容性）
  localStorage.setItem('gachaTickets', ticketsData.normal.toString());
  
  // 儲存系列抽卡券
  localStorage.setItem('seriesGachaTickets', JSON.stringify(ticketsData.series));
}

/**
 * 取得指定系列的抽卡券數量
 * @param {string} seriesName 系列名稱
 * @returns {number} 抽卡券數量
 */
function getSeriesTicketCount(seriesName) {
  const ticketsData = getGachaTicketsData();
  return ticketsData.series[seriesName] || 0;
}

/**
 * 增加指定系列的抽卡券
 * @param {string} seriesName 系列名稱
 * @param {number} amount 數量
 */
function addSeriesTicket(seriesName, amount) {
  const ticketsData = getGachaTicketsData();
  
  if (!(seriesName in ticketsData.series)) {
    ticketsData.series[seriesName] = 0;
  }
  
  ticketsData.series[seriesName] += amount;
  saveGachaTicketsData(ticketsData);
  
  console.log(`增加 ${seriesName} 抽卡券 ${amount} 張，當前：${ticketsData.series[seriesName]}`);
}

/**
 * 扣除指定系列的抽卡券
 * @param {string} seriesName 系列名稱
 * @param {number} amount 數量
 * @returns {boolean} 是否成功扣除
 */
function deductSeriesTicket(seriesName, amount) {
  const ticketsData = getGachaTicketsData();
  
  if (!(seriesName in ticketsData.series)) {
    console.warn(`系列 ${seriesName} 不存在`);
    return false;
  }
  
  if (ticketsData.series[seriesName] < amount) {
    console.warn(`${seriesName} 抽卡券不足，需要 ${amount} 張，當前：${ticketsData.series[seriesName]}`);
    return false;
  }
  
  ticketsData.series[seriesName] -= amount;
  saveGachaTicketsData(ticketsData);
  
  console.log(`扣除 ${seriesName} 抽卡券 ${amount} 張，當前：${ticketsData.series[seriesName]}`);
  return true;
}

/**
 * 取得指定系列的卡片
 * @param {string} seriesName 系列名稱
 * @returns {array} 該系列的卡片陣列
 */
function getSeriesCards(seriesName) {
  if (!window.allCards || !Array.isArray(window.allCards)) {
    console.warn('allCards 尚未載入');
    return [];
  }
  
  return window.allCards.filter(card => 
    card.category === seriesName || 
    card.series === seriesName
  );
}

/**
 * 記錄系列抽卡紀錄
 * @param {string} seriesName 系列名稱
 * @param {number} costTicket 消耗抽卡券數量
 * @param {object} resultCard 抽到的卡片
 */
function recordSeriesGachaHistory(seriesName, costTicket, resultCard) {
  const historyKey = 'seriesGachaHistory';
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  
  history.push({
    type: 'seriesGacha',
    series: seriesName,
    costTicket: costTicket,
    resultCardId: resultCard.word || resultCard.id,
    resultCardName: resultCard.zh || resultCard.name,
    resultCardSeries: resultCard.category || resultCard.series,
    resultCardRarity: resultCard.rarity,
    createdAt: new Date().toISOString()
  });
  
  // 只保留最近 100 筆紀錄
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }
  
  localStorage.setItem(historyKey, JSON.stringify(history));
}

/**
 * 記錄系列抽卡券購買紀錄
 * @param {string} seriesName 系列名稱
 * @param {number} amount 數量
 * @param {number} costStars 消耗星星
 */
function recordSeriesTicketPurchase(seriesName, amount, costStars) {
  const historyKey = 'purchaseHistory';
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  
  history.push({
    type: 'seriesGachaTicket',
    series: seriesName,
    amount: amount,
    costStars: costStars,
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem(historyKey, JSON.stringify(history));
}

// 將函數暴露到 window 物件，供其他頁面使用
if (typeof window !== 'undefined') {
  window.SeriesGachaSystem = {
    getAllSeries,
    initSeriesGachaTickets,
    getGachaTicketsData,
    saveGachaTicketsData,
    getSeriesTicketCount,
    addSeriesTicket,
    deductSeriesTicket,
    getSeriesCards,
    recordSeriesGachaHistory,
    recordSeriesTicketPurchase
  };
  
  console.log('>> SeriesGachaSystem 已設定');
}
