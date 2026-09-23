// 轉珠戰鬥通關進度系統 - 十二星座通關資料

const ORB_PROGRESS_STORAGE_KEY = 'orbBattleProgress';

// 十二星座關卡 ID 列表
const ZODIAC_STAGE_IDS = [
    'zodiac-aries',
    'zodiac-taurus',
    'zodiac-gemini',
    'zodiac-cancer',
    'zodiac-leo',
    'zodiac-virgo',
    'zodiac-libra',
    'zodiac-scorpio',
    'zodiac-sagittarius',
    'zodiac-capricorn',
    'zodiac-aquarius',
    'zodiac-pisces'
];

// 預設進度資料
const DEFAULT_PROGRESS = {};

// 初始化進度資料
function initializeProgress() {
    for (const stageId of ZODIAC_STAGE_IDS) {
        DEFAULT_PROGRESS[stageId] = {
            cleared: false,
            firstClearAt: null,
            bestCombo: 0,
            bestTurns: Infinity,
            totalClears: 0,
            firstClearRewardClaimed: false
        };
    }
}

// 取得通關進度
function getOrbProgress() {
    try {
        const data = localStorage.getItem(ORB_PROGRESS_STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('讀取通關進度失敗:', error);
    }
    
    initializeProgress();
    return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
}

// 儲存通關進度
function saveOrbProgress(progress) {
    try {
        localStorage.setItem(ORB_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
        return true;
    } catch (error) {
        console.error('儲存通關進度失敗:', error);
        return false;
    }
}

// 檢查關卡是否已通關
function isStageCleared(stageId) {
    const progress = getOrbProgress();
    return progress[stageId]?.cleared || false;
}

// 記錄通關
function recordStageClear(stageId, combo, turns) {
    const progress = getOrbProgress();
    
    if (!progress[stageId]) {
        progress[stageId] = {
            cleared: false,
            firstClearAt: null,
            bestCombo: 0,
            bestTurns: Infinity,
            totalClears: 0,
            firstClearRewardClaimed: false
        };
    }
    
    const stageProgress = progress[stageId];
    
    // 更新通關狀態
    if (!stageProgress.cleared) {
        stageProgress.cleared = true;
        stageProgress.firstClearAt = new Date().toISOString();
    }
    
    // 更新最佳紀錄
    if (combo > stageProgress.bestCombo) {
        stageProgress.bestCombo = combo;
    }
    
    if (turns < stageProgress.bestTurns) {
        stageProgress.bestTurns = turns;
    }
    
    // 增加通關次數
    stageProgress.totalClears++;
    
    saveOrbProgress(progress);
    
    return stageProgress;
}

// 取得關卡進度資料
function getStageProgress(stageId) {
    const progress = getOrbProgress();
    return progress[stageId] || null;
}

// 檢查是否已領取首次通關獎勵
function isFirstClearRewardClaimed(stageId) {
    const progress = getOrbProgress();
    return progress[stageId]?.firstClearRewardClaimed || false;
}

// 標記首次通關獎勵已領取
function claimFirstClearReward(stageId) {
    const progress = getOrbProgress();
    
    if (progress[stageId]) {
        progress[stageId].firstClearRewardClaimed = true;
        saveOrbProgress(progress);
        return true;
    }
    
    return false;
}

// 取得下一個未解鎖的關卡
function getNextUnlockedStage() {
    for (const stageId of ZODIAC_STAGE_IDS) {
        if (!isStageCleared(stageId)) {
            return stageId;
        }
    }
    return null; // 全部通關
}

// 檢查關卡是否解鎖
function isStageUnlocked(stageId) {
    const progress = getOrbProgress();
    const stageIndex = ZODIAC_STAGE_IDS.indexOf(stageId);
    
    // 第一關預設解鎖
    if (stageIndex === 0) return true;
    
    // 檢查上一關是否通關
    if (stageIndex > 0) {
        const prevStageId = ZODIAC_STAGE_IDS[stageIndex - 1];
        return progress[prevStageId]?.cleared || false;
    }
    
    return false;
}

// 取得已通關關卡數量
function getClearedStageCount() {
    const progress = getOrbProgress();
    let count = 0;
    
    for (const stageId of ZODIAC_STAGE_IDS) {
        if (progress[stageId]?.cleared) {
            count++;
        }
    }
    
    return count;
}

// 取得總通關次數
function getTotalClearCount() {
    const progress = getOrbProgress();
    let total = 0;
    
    for (const stageId of ZODIAC_STAGE_IDS) {
        total += progress[stageId]?.totalClears || 0;
    }
    
    return total;
}

// GM 同步：設定關卡通關狀態
function gmSetStageCleared(stageId, cleared) {
    const progress = getOrbProgress();
    
    if (!progress[stageId]) {
        progress[stageId] = {
            cleared: false,
            firstClearAt: null,
            bestCombo: 0,
            bestTurns: Infinity,
            totalClears: 0,
            firstClearRewardClaimed: false
        };
    }
    
    progress[stageId].cleared = cleared;
    
    if (cleared && !progress[stageId].firstClearAt) {
        progress[stageId].firstClearAt = new Date().toISOString();
    }
    
    saveOrbProgress(progress);
    
    // 同步到 GM 系統（如果存在）
    if (typeof gmSetZodiacCleared === 'function') {
        gmSetZodiacCleared(stageId, cleared);
    }
    
    return true;
}

// GM 同步：取得所有關卡通關狀態
function gmGetAllStageStatus() {
    const progress = getOrbProgress();
    const status = {};
    
    for (const stageId of ZODIAC_STAGE_IDS) {
        status[stageId] = progress[stageId]?.cleared || false;
    }
    
    return status;
}

// 重置所有進度（僅供 GM 使用）
function resetAllProgress() {
    initializeProgress();
    saveOrbProgress(DEFAULT_PROGRESS);
    return true;
}

// 重置單一關卡進度（僅供 GM 使用）
function resetStageProgress(stageId) {
    const progress = getOrbProgress();
    
    if (progress[stageId]) {
        progress[stageId] = {
            cleared: false,
            firstClearAt: null,
            bestCombo: 0,
            bestTurns: Infinity,
            totalClears: 0,
            firstClearRewardClaimed: false
        };
        
        saveOrbProgress(progress);
        return true;
    }
    
    return false;
}

// 初始化
initializeProgress();

// 監聽 localStorage 變化（跨頁面同步）
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === ORB_PROGRESS_STORAGE_KEY) {
            // 重新載入進度並更新顯示
            const newProgress = JSON.parse(event.newValue);
            // 這裡可以加入更新 UI 的邏輯
            console.log('通關進度已更新');
        }
    });
}
