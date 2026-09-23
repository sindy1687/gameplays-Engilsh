/**
 * 統一關卡進度系統 (Unified Stage Progress System)
 * 
 * 此系統管理所有關卡的進度狀態，包括：
 * - stageUnlocked: 關卡是否可以進入
 * - stageCleared: 關卡是否已經通關
 * - collectionUnlocked: 對應圖鑑是否已解鎖
 * 
 * 三個狀態必須獨立保存、獨立顯示、獨立由 GM 設定。
 */

// =================================================================================
// 正式關卡資料定義 (Official Stage Data Definitions)
// =================================================================================

/**
 * 十二星座關卡資料
 */
const ZODIAC_STAGES = [
  { id: 'aries', name: '白羊座 Aries', order: 1 },
  { id: 'taurus', name: '金牛座 Taurus', order: 2 },
  { id: 'gemini', name: '雙子座 Gemini', order: 3 },
  { id: 'cancer', name: '巨蟹座 Cancer', order: 4 },
  { id: 'leo', name: '獅子座 Leo', order: 5 },
  { id: 'virgo', name: '處女座 Virgo', order: 6 },
  { id: 'libra', name: '天秤座 Libra', order: 7 },
  { id: 'scorpio', name: '天蠍座 Scorpio', order: 8 },
  { id: 'sagittarius', name: '射手座 Sagittarius', order: 9 },
  { id: 'capricorn', name: '摩羯座 Capricorn', order: 10 },
  { id: 'aquarius', name: '水瓶座 Aquarius', order: 11 },
  { id: 'pisces', name: '雙魚座 Pisces', order: 12 },
  { id: 'andromeda', name: '仙女座 Andromeda', order: 13 },
  { id: 'cygnus', name: '天鵝座 Cygnus', order: 14 },
  { id: 'orion', name: '獵戶座 Orion', order: 15 },
  { id: 'pegasus', name: '飛馬座 Pegasus', order: 16 },
  { id: 'cassiopeia', name: '仙后座 Cassiopeia', order: 17 },
  { id: 'scorpius', name: '天蠍座 Scorpius', order: 18 },
  { id: 'phoenix', name: '鳳凰座 Phoenix', order: 19 },
  { id: 'vela', name: '船帆座 Vela', order: 20 }
];

/**
 * 希臘神祇關卡資料
 */
const GREEK_GOD_STAGES = [
  { id: 'zeus', name: '宙斯 Zeus', order: 1 },
  { id: 'hera', name: '赫拉 Hera', order: 2 },
  { id: 'poseidon', name: '波塞頓 Poseidon', order: 3 },
  { id: 'demeter', name: '得墨忒耳 Demeter', order: 4 },
  { id: 'athena', name: '雅典娜 Athena', order: 5 },
  { id: 'apollo', name: '阿波羅 Apollo', order: 6 },
  { id: 'artemis', name: '阿爾忒彌斯 Artemis', order: 7 },
  { id: 'ares', name: '阿瑞斯 Ares', order: 8 },
  { id: 'aphrodite', name: '阿芙蘿黛蒂 Aphrodite', order: 9 },
  { id: 'hephaestus', name: '赫菲斯托斯 Hephaestus', order: 10 },
  { id: 'hermes', name: '赫耳墨斯 Hermes', order: 11 },
  { id: 'hestia', name: '赫斯提亞 Hestia', order: 12 },
  { id: 'dionysus', name: '狄俄尼索斯 Dionysus', order: 13 },
  { id: 'hades', name: '哈迪斯 Hades', order: 14 },
  { id: 'persephone', name: '珀爾塞福涅 Persephone', order: 15 },
  { id: 'eros', name: '厄洛斯 Eros', order: 16 },
  { id: 'nike', name: '尼刻 Nike', order: 17 },
  { id: 'gaia', name: '蓋婭 Gaia', order: 18 },
  { id: 'atlas', name: '阿特拉斯 Atlas', order: 19 },
  { id: 'cronus', name: '克洛諾斯 Cronus', order: 20 },
  { id: 'rhea', name: '瑞亞 Rhea', order: 21 },
  { id: 'prometheus', name: '普羅米修斯 Prometheus', order: 22 }
];

/**
 * 取得正式關卡資料
 */
function getOfficialStages(category) {
  switch (category) {
    case 'zodiac':
      return ZODIAC_STAGES;
    case 'greek':
      return GREEK_GOD_STAGES;
    default:
      return [];
  }
}

/**
 * 取得關卡總數
 */
function getTotalStageCount(category) {
  return getOfficialStages(category).length;
}

/**
 * 根據希臘神祇名稱取得 ID
 * 用於舊系統和新系統之間的轉換
 */
function getGreekGodIdByName(name) {
  const god = GREEK_GOD_STAGES.find(stage => stage.name === name);
  return god ? god.id : name.toLowerCase();
}

/**
 * 根據希臘神祇 ID 取得名稱
 */
function getGreekGodNameById(id) {
  const god = GREEK_GOD_STAGES.find(stage => stage.id === id);
  return god ? god.name : id;
}

// =================================================================================
// 關卡進度資料結構 (Stage Progress Data Structure)
// =================================================================================

/**
 * 預設關卡進度資料
 */
function getDefaultStageProgress() {
  return {
    stageUnlocked: false,
    stageCleared: false,
    collectionUnlocked: false,
    bestScore: 0,
    stars: 0, // 關卡評價星星 (0-3)
    clearCount: 0,
    firstClearedAt: null,
    lastClearedAt: null,
    firstClearRewardClaimed: false
  };
}

/**
 * 正規化舊版進度資料
 * 將舊版的不同欄位名稱轉換為新版統一格式
 */
function normalizeStageProgress(oldData = {}) {
  return {
    stageUnlocked:
      oldData.stageUnlocked === true ||
      oldData.unlocked === true ||
      oldData.isUnlocked === true ||
      oldData.completed === true, // 舊版 completed 視為已解鎖

    stageCleared:
      oldData.stageCleared === true ||
      oldData.cleared === true ||
      oldData.completed === true ||
      oldData.passed === true ||
      oldData.isCleared === true,

    collectionUnlocked:
      oldData.collectionUnlocked === true ||
      oldData.collection === true ||
      oldData.obtained === true ||
      oldData.unlocked === true, // 舊版 unlocked 視為圖鑑已解鎖

    bestScore: Number(oldData.bestScore) || 0,
    stars: Math.max(0, Math.min(3, Number(oldData.stars) || 0)), // 關卡評價星星 (0-3)
    clearCount: Number(oldData.clearCount) || 0,
    firstClearedAt: oldData.firstClearedAt || null,
    lastClearedAt: oldData.lastClearedAt || null,
    firstClearRewardClaimed: oldData.firstClearRewardClaimed === true
  };
}

// =================================================================================
// localStorage 管理 (localStorage Management)
// =================================================================================

/**
 * 正式關卡進度 localStorage key
 */
const STAGE_PROGRESS_KEY = 'stageProgress';

/**
 * 載入關卡進度資料
 */
function loadStageProgress() {
  try {
    const data = localStorage.getItem(STAGE_PROGRESS_KEY);
    if (!data) {
      return initializeStageProgress();
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('載入關卡進度失敗:', error);
    return initializeStageProgress();
  }
}

/**
 * 儲存關卡進度資料
 */
function saveStageProgress(progress) {
  try {
    localStorage.setItem(STAGE_PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch (error) {
    console.error('儲存關卡進度失敗:', error);
    return false;
  }
}

/**
 * 初始化關卡進度資料
 * 為所有關卡建立預設進度，第一關預設解鎖
 */
function initializeStageProgress() {
  const progress = {
    zodiac: {},
    greek: {}
  };

  // 初始化十二星座
  ZODIAC_STAGES.forEach((stage, index) => {
    progress.zodiac[stage.id] = {
      ...getDefaultStageProgress(),
      stageUnlocked: index === 0 // 第一關預設解鎖
    };
  });

  // 初始化希臘神祇
  GREEK_GOD_STAGES.forEach((stage, index) => {
    progress.greek[stage.id] = {
      ...getDefaultStageProgress(),
      stageUnlocked: index === 0 // 第一關預設解鎖
    };
  });

  saveStageProgress(progress);
  return progress;
}

/**
 * 從舊版資料遷移 (Migration from Old Data)
 * 一次性將舊版 localStorage 資料轉換為新版格式
 */
function migrateOldStageData() {
  try {
    // 檢查是否已經遷移過
    if (localStorage.getItem('stageProgressMigrated')) {
      return;
    }

    const progress = loadStageProgress();

    // 遷移十二星座舊資料
    const oldUnlocked = JSON.parse(localStorage.getItem('unlocked') || '[]');
    const oldPassedAtlas = JSON.parse(localStorage.getItem('passed_atlas') || '[]');

    ZODIAC_STAGES.forEach(stage => {
      if (progress.zodiac[stage.id]) {
        // 舊版 unlocked 視為 stageUnlocked 和 collectionUnlocked
        if (oldUnlocked.includes(stage.id)) {
          progress.zodiac[stage.id].stageUnlocked = true;
          progress.zodiac[stage.id].collectionUnlocked = true;
        }
        // 舊版 passed_atlas 視為 stageCleared
        if (oldPassedAtlas.includes(stage.id)) {
          progress.zodiac[stage.id].stageCleared = true;
        }
      }
    });

    // 遷移希臘神祇舊資料
    const oldUnlockedGreek = JSON.parse(localStorage.getItem('unlockedGreek') || '[]');
    const oldPassedFlipcard = JSON.parse(localStorage.getItem('passed_flipcard') || '[]');

    GREEK_GOD_STAGES.forEach(stage => {
      if (progress.greek[stage.id]) {
        // 舊版 unlockedGreek 視為 stageUnlocked 和 collectionUnlocked
        if (oldUnlockedGreek.includes(stage.name)) {
          progress.greek[stage.id].stageUnlocked = true;
          progress.greek[stage.id].collectionUnlocked = true;
        }
        // 舊版 passed_flipcard 視為 stageCleared
        if (oldPassedFlipcard.includes(stage.name)) {
          progress.greek[stage.id].stageCleared = true;
        }
      }
    });

    saveStageProgress(progress);
    localStorage.setItem('stageProgressMigrated', 'true');
    console.log('舊版關卡資料遷移完成');
  } catch (error) {
    console.error('遷移舊版關卡資料失敗:', error);
  }
}

// =================================================================================
// 關卡進度查詢 (Stage Progress Query)
// =================================================================================

/**
 * 取得關卡進度
 */
function getStageProgress(category, stageId) {
  const progress = loadStageProgress();
  if (!progress[category] || !progress[category][stageId]) {
    return getDefaultStageProgress();
  }
  return progress[category][stageId];
}

/**
 * 判斷關卡是否解鎖
 */
function isStageUnlocked(category, stageId) {
  const progress = getStageProgress(category, stageId);
  return progress.stageUnlocked === true;
}

/**
 * 判斷關卡是否通關
 */
function isStageCleared(category, stageId) {
  const progress = getStageProgress(category, stageId);
  return progress.stageCleared === true;
}

/**
 * 判斷圖鑑是否解鎖
 */
function isCollectionUnlocked(category, stageId) {
  const progress = getStageProgress(category, stageId);
  return progress.collectionUnlocked === true;
}

/**
 * 取得統計數據
 */
function getStageStatistics(category) {
  const stages = getOfficialStages(category);
  const progress = loadStageProgress();

  const stats = {
    total: stages.length,
    stageUnlocked: 0,
    stageCleared: 0,
    collectionUnlocked: 0
  };

  stages.forEach(stage => {
    const stageProgress = progress[category]?.[stage.id];
    if (stageProgress) {
      if (stageProgress.stageUnlocked) stats.stageUnlocked++;
      if (stageProgress.stageCleared) stats.stageCleared++;
      if (stageProgress.collectionUnlocked) stats.collectionUnlocked++;
    }
  });

  return stats;
}

// =================================================================================
// 關卡進度更新 (Stage Progress Update)
// =================================================================================

/**
 * 更新關卡進度
 */
function updateStageProgress(category, stageId, updates) {
  const progress = loadStageProgress();
  
  if (!progress[category]) {
    progress[category] = {};
  }
  
  if (!progress[category][stageId]) {
    progress[category][stageId] = getDefaultStageProgress();
  }

  // 合併更新
  Object.assign(progress[category][stageId], updates);
  
  saveStageProgress(progress);
  return progress[category][stageId];
}

/**
 * 設定關卡解鎖狀態
 */
function setStageUnlocked(category, stageId, unlocked) {
  return updateStageProgress(category, stageId, {
    stageUnlocked: unlocked
  });
}

/**
 * 設定關卡通關狀態
 */
function setStageCleared(category, stageId, cleared) {
  return updateStageProgress(category, stageId, {
    stageCleared: cleared
  });
}

/**
 * 設定圖鑑解鎖狀態
 */
function setCollectionUnlocked(category, stageId, unlocked) {
  return updateStageProgress(category, stageId, {
    collectionUnlocked: unlocked
  });
}

/**
 * 解鎖下一關
 * 當關卡第一次通關時，自動解鎖下一關
 */
function unlockNextStage(category, currentStageId) {
  const stages = getOfficialStages(category);
  const currentIndex = stages.findIndex(stage => stage.id === currentStageId);

  if (currentIndex < 0 || currentIndex >= stages.length - 1) {
    return; // 沒有下一關
  }

  const nextStage = stages[currentIndex + 1];
  setStageUnlocked(category, nextStage.id, true);
  
  console.log(`已解鎖下一關: ${nextStage.name}`);
}

// =================================================================================
// 關卡完成處理 (Stage Completion Handling)
// =================================================================================

/**
 * 計算關卡評價星星 (0-3)
 * 根據準確率計算星等
 */
function calculateStageStars(result = {}) {
  const accuracy = Number(result.accuracy) || 0;
  const passed = result.passed === true;

  // 未通關不給星星
  if (!passed) {
    return 0;
  }

  // 通關規則：
  // 1 星: 準確率 >= 60%
  // 2 星: 準確率 >= 80%
  // 3 星: 準確率 >= 90%
  if (accuracy >= 90) {
    return 3;
  } else if (accuracy >= 80) {
    return 2;
  } else if (accuracy >= 60) {
    return 1;
  }

  return 0;
}

/**
 * 計算通關獎勵星星（差額補發）
 * 根據舊星等和新星等計算實際應發放的玩家星星
 */
function calculateClearReward(oldStars, newStars) {
  const safeOldStars = Math.max(0, Math.min(3, Number(oldStars) || 0));
  const safeNewStars = Math.max(0, Math.min(3, Number(newStars) || 0));

  const oldReward = safeOldStars * 100;
  const newReward = safeNewStars * 100;

  return Math.max(0, newReward - oldReward);
}

/**
 * 完成關卡
 * 當玩家真正達到關卡勝利條件時呼叫
 */
function completeStage(category, stageId, result = {}) {
  const current = getStageProgress(category, stageId);
  const now = new Date().toISOString();
  const wasCleared = current.stageCleared === true;

  // 計算分數
  const score = Number(result.score) || 0;
  const newBestScore = Math.max(Number(current.bestScore) || 0, score);
  const newClearCount = (Number(current.clearCount) || 0) + 1;

  // 計算本次關卡評價星星 (0-3)
  const currentStars = calculateStageStars(result);

  // 更新進度
  updateStageProgress(category, stageId, {
    stageUnlocked: true,
    stageCleared: true,
    collectionUnlocked: true,
    bestScore: newBestScore,
    stars: Math.max(Number(current.stars) || 0, currentStars), // 保留最高星等
    clearCount: newClearCount,
    firstClearedAt: current.firstClearedAt || now,
    lastClearedAt: now
  });

  // 第一次通關時，解鎖下一關（只有當星星 >= 1 時才會呼叫此函式）
  if (!wasCleared) {
    unlockNextStage(category, stageId);
  }

  // 通知其他頁面資料已變更
  notifyStageDataChanged();

  console.log(`關卡完成: ${category}/${stageId}, 分數: ${score}, 星等: ${currentStars}`);
}

/**
 * 檢查並發放首次通關獎勵
 */
function claimFirstClearReward(category, stageId) {
  const current = getStageProgress(category, stageId);
  
  if (!current.firstClearRewardClaimed && current.stageCleared) {
    // 發放獎勵
    grantStageReward(category, stageId);
    
    // 標記已領取
    updateStageProgress(category, stageId, {
      firstClearRewardClaimed: true
    });
    
    return true;
  }
  
  return false;
}

/**
 * 發放關卡獎勵 (由各系統自行實現)
 */
function grantStageReward(category, stageId) {
  // 這裡可以整合星星系統、抽卡券等
  console.log(`發放關卡獎勵: ${category}/${stageId}`);
  
  // 範例：增加星星
  if (typeof addSafeStars === 'function') {
    addSafeStars(10);
  }
}

// =================================================================================
// 跨頁同步 (Cross-Page Synchronization)
// =================================================================================

/**
 * 通知其他頁面資料已變更
 */
function notifyStageDataChanged() {
  localStorage.setItem('stageProgressLastUpdated', new Date().toISOString());
}

/**
 * 監聽跨頁資料變更
 */
function setupStageDataSync() {
  window.addEventListener('storage', (event) => {
    if (event.key === 'stageProgress' || event.key === 'stageProgressLastUpdated') {
      console.log('檢測到關卡進度變更，重新載入');
      refreshAllStageProgressUI();
    }
  });
}

/**
 * 刷新所有關卡進度 UI
 */
function refreshAllStageProgressUI() {
  // 刷新各頁面的進度顯示
  if (typeof updateProgress1 === 'function') updateProgress1(); // 十二星座
  if (typeof updateProgress3 === 'function') updateProgress3(); // 希臘神祇
  if (typeof renderGMStageList === 'function') renderGMStageList(); // GM 關卡管理
  if (typeof renderGMGreekGods === 'function') renderGMGreekGods(); // GM 希臘神祇
  if (typeof renderGMZodiac === 'function') renderGMZodiac(); // GM 十二星座
}

// =================================================================================
// 初始化 (Initialization)
// =================================================================================

/**
 * 初始化關卡進度系統
 */
function initStageProgressSystem() {
  // 嘗試遷移舊版資料
  migrateOldStageData();
  
  // 確保進度資料存在
  loadStageProgress();
  
  // 設置跨頁同步
  setupStageDataSync();
  
  console.log('關卡進度系統初始化完成');
}

// 頁面載入時自動初始化
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initStageProgressSystem);
}
