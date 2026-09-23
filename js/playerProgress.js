// 玩家經驗值與升等系統

// 玩家等級門檻 (100 星消費 = 1 EXP)
const PLAYER_LEVEL_THRESHOLDS = [
  { level: 1, requiredExp: 0, requiredSpentStars: 0 },
  { level: 2, requiredExp: 20, requiredSpentStars: 2000 },
  { level: 3, requiredExp: 50, requiredSpentStars: 5000 },
  { level: 4, requiredExp: 90, requiredSpentStars: 9000 },
  { level: 5, requiredExp: 140, requiredSpentStars: 14000 },
  { level: 6, requiredExp: 200, requiredSpentStars: 20000 },
  { level: 7, requiredExp: 280, requiredSpentStars: 28000 },
  { level: 8, requiredExp: 380, requiredSpentStars: 38000 },
  { level: 9, requiredExp: 500, requiredSpentStars: 50000 },
  { level: 10, requiredExp: 650, requiredSpentStars: 65000 },
  { level: 11, requiredExp: 820, requiredSpentStars: 82000 },
  { level: 12, requiredExp: 1020, requiredSpentStars: 102000 },
  { level: 13, requiredExp: 1250, requiredSpentStars: 125000 },
  { level: 14, requiredExp: 1510, requiredSpentStars: 151000 },
  { level: 15, requiredExp: 1800, requiredSpentStars: 180000 },
  { level: 16, requiredExp: 2130, requiredSpentStars: 213000 },
  { level: 17, requiredExp: 2500, requiredSpentStars: 250000 },
  { level: 18, requiredExp: 2910, requiredSpentStars: 291000 },
  { level: 19, requiredExp: 3360, requiredSpentStars: 336000 },
  { level: 20, requiredExp: 3850, requiredSpentStars: 385000 },
  { level: 21, requiredExp: 4380, requiredSpentStars: 438000 },
  { level: 22, requiredExp: 4950, requiredSpentStars: 495000 },
  { level: 23, requiredExp: 5560, requiredSpentStars: 556000 },
  { level: 24, requiredExp: 6210, requiredSpentStars: 621000 },
  { level: 25, requiredExp: 6900, requiredSpentStars: 690000 },
  { level: 26, requiredExp: 7630, requiredSpentStars: 763000 },
  { level: 27, requiredExp: 8400, requiredSpentStars: 840000 },
  { level: 28, requiredExp: 9210, requiredSpentStars: 921000 },
  { level: 29, requiredExp: 10060, requiredSpentStars: 1006000 },
  { level: 30, requiredExp: 10950, requiredSpentStars: 1095000 }
];

// 升等獎勵
const LEVEL_REWARDS = {
  2: { goldCoins: 500, badge: null },
  3: { goldCoins: 1000, badge: null },
  4: { goldCoins: 1500, badge: null },
  5: { goldCoins: 2000, badge: 'special' },
  6: { goldCoins: 3000, badge: null },
  7: { goldCoins: 0, badge: 'avatar' },
  8: { goldCoins: 5000, badge: null },
  9: { goldCoins: 0, badge: 'card-frame' },
  10: { goldCoins: 10000, badge: 'max-level' },
  11: { goldCoins: 12000, badge: null },
  12: { goldCoins: 15000, badge: null },
  13: { goldCoins: 18000, badge: null },
  14: { goldCoins: 22000, badge: null },
  15: { goldCoins: 27000, badge: 'special' },
  16: { goldCoins: 33000, badge: null },
  17: { goldCoins: 40000, badge: null },
  18: { goldCoins: 48000, badge: null },
  19: { goldCoins: 57000, badge: null },
  20: { goldCoins: 68000, badge: 'max-level' },
  21: { goldCoins: 80000, badge: null },
  22: { goldCoins: 94000, badge: null },
  23: { goldCoins: 110000, badge: null },
  24: { goldCoins: 128000, badge: null },
  25: { goldCoins: 148000, badge: 'special' },
  26: { goldCoins: 170000, badge: null },
  27: { goldCoins: 195000, badge: null },
  28: { goldCoins: 222000, badge: null },
  29: { goldCoins: 250000, badge: null },
  30: { goldCoins: 280000, badge: 'max-level' }
};

// 玩家進度資料 key
const PLAYER_PROGRESS_KEY = 'playerProgress';

// 取得預設玩家進度
function getDefaultPlayerProgress() {
  return {
    totalSpentStars: 0,
    level: 1,
    rewardedClears: [],
    rewardedBestRecords: [],
    claimedLevelRewards: [],
    spendingTransactions: [],
    updatedAt: null
  };
}

// 讀取玩家進度
function getPlayerProgress() {
  try {
    const rawValue = localStorage.getItem(PLAYER_PROGRESS_KEY);
    if (!rawValue) {
      return getDefaultPlayerProgress();
    }
    const parsedValue = JSON.parse(rawValue);
    return {
      ...getDefaultPlayerProgress(),
      ...parsedValue,
      totalSpentStars: Math.max(0, Number(parsedValue.totalSpentStars) || 0),
      level: Math.max(1, Number(parsedValue.level) || 1),
      rewardedClears: Array.isArray(parsedValue.rewardedClears) ? parsedValue.rewardedClears : [],
      rewardedBestRecords: Array.isArray(parsedValue.rewardedBestRecords) ? parsedValue.rewardedBestRecords : [],
      claimedLevelRewards: Array.isArray(parsedValue.claimedLevelRewards) ? parsedValue.claimedLevelRewards : [],
      spendingTransactions: Array.isArray(parsedValue.spendingTransactions) ? parsedValue.spendingTransactions : []
    };
  } catch (error) {
    console.warn('[Player Progress] 進度資料讀取失敗：', error);
    return getDefaultPlayerProgress();
  }
}

// 計算玩家等級
function calculatePlayerLevel(totalSpentStars) {
  const safeSpentStars = Math.max(0, Number(totalSpentStars) || 0);
  let currentLevel = 1;
  PLAYER_LEVEL_THRESHOLDS.forEach(item => {
    if (safeSpentStars >= item.requiredSpentStars) {
      currentLevel = item.level;
    }
  });
  return currentLevel;
}

// 計算經驗值 (100 星 = 1 EXP)
function calculateExperience(totalSpentStars) {
  return Math.max(0, Number(totalSpentStars) || 0) / 100;
}

// 取得目前玩家等級
function getCurrentPlayerLevel() {
  const progress = getPlayerProgress();
  return calculatePlayerLevel(progress.totalSpentStars);
}

// 增加消費星星 (100 星 = 1 EXP)
function addSpentStars(amount, source = 'unknown', gameId = null) {
  const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
  if (safeAmount <= 0) {
    return { addedStars: 0, addedExp: 0, leveledUp: false };
  }

  const progress = getPlayerProgress();
  const previousLevel = calculatePlayerLevel(progress.totalSpentStars);
  const nextSpentStars = progress.totalSpentStars + safeAmount;
  const nextLevel = calculatePlayerLevel(nextSpentStars);
  const addedExp = safeAmount / 100;

  // 記錄交易
  const transaction = {
    id: `${source}-${gameId || 'unknown'}-${Date.now()}`,
    amount: safeAmount,
    expEarned: addedExp,
    source,
    gameId,
    createdAt: new Date().toISOString()
  };

  const nextProgress = {
    ...progress,
    totalSpentStars: nextSpentStars,
    level: nextLevel,
    spendingTransactions: [transaction, ...progress.spendingTransactions].slice(0, 100),
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(PLAYER_PROGRESS_KEY, JSON.stringify(nextProgress));

  const result = {
    addedStars: safeAmount,
    addedExp,
    previousLevel,
    currentLevel: nextLevel,
    leveledUp: nextLevel > previousLevel,
    source
  };

  window.dispatchEvent(new CustomEvent('playerProgressUpdated', {
    detail: { ...nextProgress, ...result }
  }));

  if (result.leveledUp) {
    window.dispatchEvent(new CustomEvent('playerLevelUpdated', {
      detail: result
    }));
  }

  return result;
}

// 向後相容：保留舊函式名稱
function addPlayerExperience(amount, source = 'unknown') {
  return addSpentStars(amount, source);
}

// 建立通關獎勵 key
function createPlayerClearRewardKey(stageType, stageId) {
  return [String(stageType || '').trim().toLowerCase(), String(stageId || '').trim().toLowerCase()].join('::');
}

// 第一次通關獎勵
function rewardFirstStageClear(stageType, stageId, rewardExp) {
  const progress = getPlayerProgress();
  const rewardKey = createPlayerClearRewardKey(stageType, stageId);

  if (progress.rewardedClears.includes(rewardKey)) {
    return {
      rewarded: false,
      addedExp: 0,
      reason: 'first-clear-already-rewarded'
    };
  }

  const nextProgress = {
    ...progress,
    rewardedClears: [...progress.rewardedClears, rewardKey]
  };

  localStorage.setItem(PLAYER_PROGRESS_KEY, JSON.stringify(nextProgress));

  const expResult = addPlayerExperience(rewardExp, `first-clear:${rewardKey}`);

  return {
    rewarded: true,
    ...expResult
  };
}

// 星座關卡第一次通關
function rewardFirstZodiacClear(stageId) {
  return rewardFirstStageClear('zodiac', stageId, 100);
}

// 希臘關卡第一次通關
function rewardFirstGreekClear(stageId) {
  return rewardFirstStageClear('greek', stageId, 150);
}

// 刷新最佳紀錄獎勵
function rewardBestRecord(stageType, stageId) {
  const progress = getPlayerProgress();
  const rewardKey = createPlayerClearRewardKey(stageType, stageId) + '::best-record';

  if (progress.rewardedBestRecords.includes(rewardKey)) {
    return {
      rewarded: false,
      addedExp: 0,
      reason: 'best-record-already-rewarded'
    };
  }

  const nextProgress = {
    ...progress,
    rewardedBestRecords: [...progress.rewardedBestRecords, rewardKey]
  };

  localStorage.setItem(PLAYER_PROGRESS_KEY, JSON.stringify(nextProgress));

  const expResult = addPlayerExperience(20, `best-record:${rewardKey}`);

  return {
    rewarded: true,
    ...expResult
  };
}

// 取得等級進度
function getPlayerLevelProgress() {
  const progress = getPlayerProgress();
  const currentLevel = calculatePlayerLevel(progress.totalSpentStars);
  const currentExp = calculateExperience(progress.totalSpentStars);
  const currentThreshold = PLAYER_LEVEL_THRESHOLDS.find(item => item.level === currentLevel)?.requiredExp || 0;
  const nextThreshold = PLAYER_LEVEL_THRESHOLDS.find(item => item.level === currentLevel + 1)?.requiredExp;

  if (typeof nextThreshold !== 'number') {
    return {
      currentLevel,
      currentExp,
      totalSpentStars: progress.totalSpentStars,
      nextLevel: null,
      currentLevelExp: 0,
      requiredLevelExp: 0,
      percent: 100,
      isMaxLevel: true
    };
  }

  const currentLevelExp = currentExp - currentThreshold;
  const requiredLevelExp = nextThreshold - currentThreshold;

  return {
    currentLevel,
    currentExp,
    totalSpentStars: progress.totalSpentStars,
    nextLevel: currentLevel + 1,
    currentLevelExp,
    requiredLevelExp,
    percent: Math.min(100, Math.round(currentLevelExp / requiredLevelExp * 100)),
    isMaxLevel: false
  };
}

// 取得等級門檻
function getMinimumExperienceForLevel(level) {
  return PLAYER_LEVEL_THRESHOLDS.find(item => item.level === level)?.requiredExp || 0;
}

// 取得等級獎勵
function getLevelReward(level) {
  return LEVEL_REWARDS[level] || null;
}

// 領取等級獎勵
function claimLevelReward(level) {
  const progress = getPlayerProgress();
  
  if (progress.claimedLevelRewards.includes(level)) {
    return {
      claimed: false,
      reason: 'already-claimed'
    };
  }
  
  const reward = getLevelReward(level);
  if (!reward) {
    return {
      claimed: false,
      reason: 'no-reward'
    };
  }
  
  const nextProgress = {
    ...progress,
    claimedLevelRewards: [...progress.claimedLevelRewards, level]
  };
  
  localStorage.setItem(PLAYER_PROGRESS_KEY, JSON.stringify(nextProgress));
  
  return {
    claimed: true,
    reward
  };
}
