// js/item_database.js
// 共用道具資料庫

/**
 * 道具資料庫
 * 所有道具的基本資訊都定義在這裡
 */
window.ITEM_DATABASE = {
  normal_gacha_ticket: {
    id: "normal_gacha_ticket",
    name: "普通抽卡券",
    icon: "🎟️",
    description: "可用於普通抽卡。",
    stackable: true,
    usable: true,
    type: "gacha_ticket",
    category: "gacha"
  },
  rename_card: {
    id: "rename_card",
    name: "改名卡",
    icon: "✏️",
    description: "使用後可以修改一次玩家名稱。",
    stackable: true,
    usable: true,
    type: "rename",
    category: "special"
  },
  exp_card_small: {
    id: "exp_card_small",
    name: "小經驗幫",
    icon: "📘",
    description: "獲得 100 EXP，快速提升玩家等級。",
    stackable: true,
    usable: true,
    type: "exp",
    expValue: 100,
    category: "exp"
  },
  exp_card_medium: {
    id: "exp_card_medium",
    name: "中經驗幫",
    icon: "📗",
    description: "獲得 500 EXP，快速提升玩家等級。",
    stackable: true,
    usable: true,
    type: "exp",
    expValue: 500,
    category: "exp"
  },
  exp_card_large: {
    id: "exp_card_large",
    name: "大經驗幫",
    icon: "📙",
    description: "獲得 1000 EXP，快速提升玩家等級。",
    stackable: true,
    usable: true,
    type: "exp",
    expValue: 1000,
    category: "exp"
  },
  reading_key_stage_2: {
    id: "reading_key_stage_2",
    name: "文章第 2 關鑰匙",
    icon: "🔑",
    description: "用來解鎖文章練習第 2 關。",
    stackable: false,
    usable: true,
    type: "stage_key",
    stageNumber: 2,
    category: "key"
  },
  reading_key_stage_3: {
    id: "reading_key_stage_3",
    name: "文章第 3 關鑰匙",
    icon: "🔑",
    description: "用來解鎖文章練習第 3 關。",
    stackable: false,
    usable: true,
    type: "stage_key",
    stageNumber: 3,
    category: "key"
  },
  reading_key_stage_4: {
    id: "reading_key_stage_4",
    name: "文章第 4 關鑰匙",
    icon: "🔑",
    description: "用來解鎖文章練習第 4 關。",
    stackable: false,
    usable: true,
    type: "stage_key",
    stageNumber: 4,
    category: "key"
  },
  reading_key_stage_5: {
    id: "reading_key_stage_5",
    name: "文章第 5 關鑰匙",
    icon: "🔑",
    description: "用來解鎖文章練習第 5 關。",
    stackable: false,
    usable: true,
    type: "stage_key",
    stageNumber: 5,
    category: "key"
  },
  bag_expand_5: {
    id: "bag_expand_5",
    name: "背包擴充券",
    icon: "🎒",
    description: "使用後可以增加 5 格背包容量。",
    stackable: true,
    usable: true,
    type: "bag_expand",
    expandValue: 5,
    category: "special"
  },
  time_freeze_potion: {
    id: "time_freeze_potion",
    name: "時間暫停藥水",
    icon: "⏸️",
    description: "在遊戲中暫停計時 5 秒。",
    stackable: true,
    usable: false,
    type: "consumable",
    effect: "pause_time",
    value: 5,
    category: "special"
  },
  heart_shield: {
    id: "heart_shield",
    name: "愛心護盾",
    icon: "🛡️",
    description: "答錯、超時或跳過時自動抵銷一次愛心扣除。",
    stackable: true,
    usable: false,
    type: "consumable",
    effect: "no_heart_loss",
    value: 1,
    category: "special"
  },
  hint_potion: {
    id: "hint_potion",
    name: "三字母提示藥水",
    icon: "💡",
    description: "顯示正確答案的前三個字母作為提示。",
    stackable: true,
    usable: false,
    type: "consumable",
    effect: "hint_3_letters",
    value: 3,
    category: "special"
  }
};

/**
 * 動態建立系列抽卡券道具定義
 * @param {string} seriesName 系列名稱
 * @returns {object} 道具定義
 */
function createSeriesTicketItem(seriesName) {
  return {
    id: `series_ticket_${seriesName}`,
    name: `${seriesName}抽卡券`,
    icon: "🎫",
    description: `可用於${seriesName}系列抽卡池專用抽卡。`,
    stackable: true,
    usable: true,
    type: "series_gacha_ticket",
    series: seriesName,
    category: "gacha"
  };
}

/**
 * 取得或建立系列抽卡券道具定義
 * @param {string} seriesName 系列名稱
 * @returns {object} 道具定義
 */
function getSeriesTicketItem(seriesName) {
  const itemId = `series_ticket_${seriesName}`;
  
  // 如果道具資料庫中沒有，動態建立
  if (!window.ITEM_DATABASE[itemId]) {
    window.ITEM_DATABASE[itemId] = createSeriesTicketItem(seriesName);
  }
  
  return window.ITEM_DATABASE[itemId];
}

/**
 * 取得道具資訊
 * @param {string} itemId - 道具 ID
 * @returns {object|null} 道具資訊
 */
function getItemInfo(itemId) {
  return window.ITEM_DATABASE[itemId] || null;
}

/**
 * 取得所有道具 ID
 * @returns {string[]} 道具 ID 陣列
 */
function getAllItemIds() {
  return Object.keys(window.ITEM_DATABASE);
}

/**
 * 動態建立文章關卡鑰匙道具定義
 * @param {number} stageNumber 關卡編號
 * @returns {object} 道具定義
 */
function createReadingStageKeyItem(stageNumber) {
  return {
    id: `reading_key_stage_${stageNumber}`,
    name: `文章第 ${stageNumber} 關鑰匙`,
    icon: "🔑",
    description: `用來解鎖文章練習第 ${stageNumber} 關。`,
    stackable: false,
    usable: true,
    type: "stage_key",
    category: "key",
    stageNumber: stageNumber
  };
}

/**
 * 取得或建立文章關卡鑰匙道具定義
 * @param {number} stageNumber 關卡編號
 * @returns {object} 道具定義
 */
function getReadingStageKeyItem(stageNumber) {
  const itemId = `reading_key_stage_${stageNumber}`;
  
  // 如果道具資料庫中沒有，動態建立
  if (!window.ITEM_DATABASE[itemId]) {
    window.ITEM_DATABASE[itemId] = createReadingStageKeyItem(stageNumber);
  }
  
  return window.ITEM_DATABASE[itemId];
}

/**
 * 取得目前缺少的文章關卡鑰匙
 * @returns {Array} 缺少的鑰匙資訊陣列
 */
function getMissingReadingStageKeys() {
  const missingKeys = [];
  const totalLevels = typeof articleLevels !== 'undefined' ? articleLevels.length : (window.ARTICLE_LEVEL_COUNT || 45);

  // 檢查第 2 關開始（第 1 關預設解鎖）
  for (let stageNumber = 2; stageNumber <= totalLevels; stageNumber++) {
    const unlockKey = `level_${stageNumber}_unlocked`;
    const isUnlocked = localStorage.getItem(unlockKey) === 'true';

    // 如果關卡未解鎖，檢查是否已有鑰匙
    if (!isUnlocked) {
      const keyItemId = `reading_key_stage_${stageNumber}`;
      const hasKey = getItemCount && typeof getItemCount === 'function' ? getItemCount(keyItemId) : 0;

      if (hasKey === 0) {
        missingKeys.push({
          stageNumber: stageNumber,
          keyId: keyItemId,
          keyItem: getReadingStageKeyItem(stageNumber)
        });
      }
    }
  }

  return missingKeys;
}

/**
 * 發放缺少的文章關卡鑰匙
 * @returns {Object} 發放結果
 */
function grantMissingReadingStageKeys() {
  const missingKeys = getMissingReadingStageKeys();
  const grantedKeys = [];
  const failedKeys = [];
  
  if (missingKeys.length === 0) {
    return {
      success: true,
      grantedKeys: [],
      message: '目前沒有缺少的文章關卡鑰匙'
    };
  }
  
  missingKeys.forEach(keyInfo => {
    try {
      if (typeof addItem === 'function') {
        addItem(keyInfo.keyId, 1);
        grantedKeys.push(keyInfo);
      } else {
        console.warn('addItem 函式不可用，無法發放鑰匙:', keyInfo.keyId);
        failedKeys.push(keyInfo);
      }
    } catch (error) {
      console.error('發放鑰匙失敗:', keyInfo.keyId, error);
      failedKeys.push(keyInfo);
    }
  });
  
  return {
    success: failedKeys.length === 0,
    grantedKeys: grantedKeys,
    failedKeys: failedKeys,
    message: `成功發放 ${grantedKeys.length} 把鑰匙${failedKeys.length > 0 ? `，失敗 ${failedKeys.length} 把` : ''}`
  };
}

/**
 * 文章練習總關卡數
 * 用於商城、鑰匙圈、GM 等全站同步
 */
const ARTICLE_LEVEL_COUNT = 45;
window.ARTICLE_LEVEL_COUNT = ARTICLE_LEVEL_COUNT;

// 預先建立所有文章關卡鑰匙定義，確保 GM、背包、商城都能識別
for (let stageNumber = 2; stageNumber <= ARTICLE_LEVEL_COUNT; stageNumber++) {
  getReadingStageKeyItem(stageNumber);
}
