/**
 * 全站共用星星系統
 * 統一管理所有星星的讀取、寫入、增加、扣除
 * 防止重複加星星、防止不同步問題
 */

(function(window) {
  'use strict';

  // ================================
  // 基礎星星管理函式
  // ================================

  /**
   * 取得總星星數
   * @returns {number} 總星星數
   */
  function getTotalStars() {
    return Number(localStorage.getItem('totalStars') || 0);
  }

  /**
   * 設定總星星數
   * @param {number} value - 星星數量
   * @returns {number} 設定後的星星數
   */
  function setTotalStars(value) {
    const nextValue = Math.max(0, Number(value || 0));
    localStorage.setItem('totalStars', String(nextValue));
    updateAllStarDisplays();
    return nextValue;
  }

  /**
   * 增加總星星數
   * @param {number} amount - 增加的星星數量
   * @param {string} reason - 增加原因（用於紀錄）
   * @returns {number} 增加後的總星星數
   */
  function addTotalStars(amount, reason = '') {
    const addValue = Number(amount || 0);

    if (!Number.isFinite(addValue) || addValue <= 0) {
      return getTotalStars();
    }

    const current = getTotalStars();
    const nextValue = setTotalStars(current + addValue);

    // 紀錄星星交易
    logStarTransaction('add', addValue, reason);

    console.log('[星星系統] 增加星星:', {
      amount: addValue,
      reason,
      before: current,
      after: nextValue
    });

    return nextValue;
  }

  /**
   * 扣除總星星數
   * @param {number} amount - 扣除的星星數量
   * @param {string} reason - 扣除原因（用於紀錄）
   * @returns {Object} { ok: boolean, totalStars: number, reason: string }
   */
  function spendTotalStars(amount, reason = '') {
    const spendValue = Number(amount || 0);

    if (!Number.isFinite(spendValue) || spendValue <= 0) {
      return {
        ok: false,
        totalStars: getTotalStars(),
        reason: '扣除星星數量不正確'
      };
    }

    const current = getTotalStars();

    if (current < spendValue) {
      return {
        ok: false,
        totalStars: current,
        reason: '星星不足'
      };
    }

    const nextValue = setTotalStars(current - spendValue);

    // 紀錄星星交易
    logStarTransaction('spend', spendValue, reason);

    console.log('[星星系統] 扣除星星:', {
      amount: spendValue,
      reason,
      before: current,
      after: nextValue
    });

    return {
      ok: true,
      totalStars: nextValue,
      reason: '扣除成功'
    };
  }

  // ================================
  // 關卡星星管理函式
  // ================================

  /**
   * 取得每關最高星數
   * @param {string} levelId - 關卡 ID
   * @returns {number} 該關卡的最高星數
   */
  function getLevelBestStars(levelId) {
    const data = JSON.parse(localStorage.getItem('levelBestStars') || '{}');
    return Number(data[String(levelId)] || 0);
  }

  /**
   * 設定每關最高星數
   * @param {string} levelId - 關卡 ID
   * @param {number} stars - 星星數量
   * @returns {number} 設定後的星星數
   */
  function setLevelBestStars(levelId, stars) {
    const data = JSON.parse(localStorage.getItem('levelBestStars') || '{}');
    const oldStars = Number(data[String(levelId)] || 0);
    const nextStars = Math.max(oldStars, Number(stars || 0));

    data[String(levelId)] = nextStars;
    localStorage.setItem('levelBestStars', JSON.stringify(data));

    return nextStars;
  }

  /**
   * 計算本關星數（基於答對率）
   * @param {number} correctCount - 答對題數
   * @param {number} totalCount - 總題數
   * @returns {number} 星星數量（0-3）
   */
  function calculateStars(correctCount, totalCount) {
    if (!totalCount || totalCount <= 0) return 0;

    const accuracy = correctCount / totalCount;

    if (accuracy >= 0.95) return 3;
    if (accuracy >= 0.8) return 2;
    if (accuracy >= 0.75) return 1;

    return 0;
  }

  /**
   * 套用關卡星星（只補差額）
   * @param {string} levelId - 關卡 ID
   * @param {number} newStars - 本次獲得的星數
   * @param {Object} options - 選項
   * @param {boolean} options.isPracticeMode - 是否為錯題練習模式
   * @param {boolean} options.isCompleted - 是否通關
   * @returns {Object} { addedStars, oldStars, newBestStars, totalStars, reason }
   */
  function applyLevelStars(levelId, newStars, options = {}) {
    const {
      isPracticeMode = false,
      isCompleted = true
    } = options;

    const oldStars = getLevelBestStars(levelId);

    if (isPracticeMode) {
      console.log('[星星系統] 錯題練習不更新星星');
      return {
        addedStars: 0,
        oldStars,
        newBestStars: oldStars,
        totalStars: getTotalStars(),
        reason: '錯題練習不更新星星'
      };
    }

    if (!isCompleted || newStars <= 0) {
      console.log('[星星系統] 未通關或沒有獲得星星');
      return {
        addedStars: 0,
        oldStars,
        newBestStars: oldStars,
        totalStars: getTotalStars(),
        reason: '未通關或沒有獲得星星'
      };
    }

    const addedStars = Math.max(0, Number(newStars || 0) - oldStars);

    if (addedStars > 0) {
      setLevelBestStars(levelId, newStars);
      addTotalStars(addedStars, `第 ${levelId} 關刷新星數`);
    } else {
      console.log(`[星星系統] 沒有超過歷史最高星數，不加星星（舊紀錄 ${oldStars} 星，本次 ${newStars} 星）`);
    }

    return {
      addedStars,
      oldStars,
      newBestStars: Math.max(oldStars, newStars),
      totalStars: getTotalStars(),
      reason: addedStars > 0
        ? '補差額星星'
        : '沒有超過歷史最高星數，不重複加星星'
    };
  }

  // ================================
  // 顯示更新函式
  // ================================

  /**
   * 更新所有星星顯示元素
   */
  function updateAllStarDisplays() {
    const total = getTotalStars();

    // 更新常見的星星顯示元素
    const selectors = [
      '[data-star-display]',
      '#totalStarsDisplay',
      '#starCount',
      '#starsDisplay',
      '#totalStarsCount',
      '#totalStarCount',
      '.stars-display',
      '.stars-count'
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.textContent = total;
      });
    });
  }

  // ================================
  // 交易紀錄函式
  // ================================

  /**
   * 紀錄星星交易
   * @param {string} type - 交易類型（add/spend）
   * @param {number} amount - 交易數量
   * @param {string} reason - 交易原因
   * @param {Object} meta - 其他資訊
   */
  function logStarTransaction(type, amount, reason, meta = {}) {
    const key = 'starTransactions';
    const list = JSON.parse(localStorage.getItem(key) || '[]');

    list.unshift({
      id: `star_tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      amount,
      reason,
      totalStars: getTotalStars(),
      createdAt: new Date().toISOString(),
      meta
    });

    // 只保留最近 100 筆
    localStorage.setItem(key, JSON.stringify(list.slice(0, 100)));
  }

  /**
   * 取得星星交易紀錄
   * @returns {Array} 交易紀錄陣列
   */
  function getStarTransactions() {
    return JSON.parse(localStorage.getItem('starTransactions') || '[]');
  }

  // ================================
  // 舊系統相容函式
  // ================================

  /**
   * 舊系統相容：addStars
   * @deprecated 請使用 addTotalStars
   */
  function addStars(amount) {
    return addTotalStars(amount, '舊系統相容');
  }

  /**
   * 舊系統相容：getPlayerStars
   * @deprecated 請使用 getTotalStars
   */
  function getPlayerStars() {
    return getTotalStars();
  }

  /**
   * 舊系統相容：setPlayerStars
   * @deprecated 請使用 setTotalStars
   */
  function setPlayerStars(value) {
    return setTotalStars(value);
  }

  // ================================
  // Debug 工具
  // ================================

  /**
   * Debug 工具：顯示星星資訊
   */
  function debugStars() {
    console.group('[星星系統 Debug]');
    console.table(getStarTransactions());
    console.log('totalStars:', localStorage.getItem('totalStars'));
    console.log('levelBestStars:', localStorage.getItem('levelBestStars'));
    console.groupEnd();
  }

  // ================================
  // 匯出到全域
  // ================================

  window.StarSystem = {
    // 基礎函式
    getTotalStars,
    setTotalStars,
    addTotalStars,
    spendTotalStars,

    // 關卡函式
    getLevelBestStars,
    setLevelBestStars,
    calculateStars,
    applyLevelStars,

    // 顯示函式
    updateAllStarDisplays,

    // 紀錄函式
    logStarTransaction,
    getStarTransactions,

    // 舊系統相容
    addStars,
    getPlayerStars,
    setPlayerStars,

    // Debug
    debugStars
  };

  // 全域 debug 函式
  window.debugStars = debugStars;

  // 頁面載入時更新顯示
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAllStarDisplays);
  } else {
    updateAllStarDisplays();
  }

  console.log('[星星系統] 已載入全站共用星星系統');

})(typeof window !== 'undefined' ? window : this);
