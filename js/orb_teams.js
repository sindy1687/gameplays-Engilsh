// 轉珠戰鬥隊伍系統 - 三組隊伍管理

const ORB_TEAMS_STORAGE_KEY = 'orbBattleTeams';
const ORB_ACTIVE_TEAM_KEY = 'orbBattleActiveTeam';

// 預設隊伍資料
const DEFAULT_TEAMS = {
    1: [],
    2: [],
    3: []
};

// 取得隊伍資料
function getOrbTeams() {
    try {
        const data = localStorage.getItem(ORB_TEAMS_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Migration: 如果有舊的單一隊伍格式，轉換成新格式
            if (parsed.team1 && !parsed[1]) {
                return {
                    1: parsed.team1 || [],
                    2: [],
                    3: []
                };
            }
            return parsed;
        }
    } catch (error) {
        console.error('讀取隊伍資料失敗:', error);
    }
    return JSON.parse(JSON.stringify(DEFAULT_TEAMS));
}

// 儲存隊伍資料
function saveOrbTeams(teams) {
    try {
        localStorage.setItem(ORB_TEAMS_STORAGE_KEY, JSON.stringify(teams));
        return true;
    } catch (error) {
        console.error('儲存隊伍資料失敗:', error);
        return false;
    }
}

// 取得目前使用的隊伍編號
function getActiveTeamNumber() {
    try {
        const data = localStorage.getItem(ORB_ACTIVE_TEAM_KEY);
        return data ? parseInt(data) : 1;
    } catch (error) {
        console.error('讀取使用隊伍失敗:', error);
        return 1;
    }
}

// 設定目前使用的隊伍編號
function setActiveTeamNumber(teamNumber) {
    try {
        if (teamNumber < 1 || teamNumber > 3) {
            console.error('隊伍編號必須為 1-3');
            return false;
        }
        localStorage.setItem(ORB_ACTIVE_TEAM_KEY, String(teamNumber));
        return true;
    } catch (error) {
        console.error('設定使用隊伍失敗:', error);
        return false;
    }
}

// 取得目前使用的隊伍
function getActiveTeam() {
    const teamNumber = getActiveTeamNumber();
    const teams = getOrbTeams();
    return teams[teamNumber] || [];
}

// 設定隊伍
function setTeam(teamNumber, cardIds) {
    const teams = getOrbTeams();
    
    // 驗證卡片ID是否存在且已解鎖
    const validCardIds = validateCardIds(cardIds);
    
    if (validCardIds.length > 5) {
        console.error('隊伍最多只能有5張卡片');
        return false;
    }
    
    teams[teamNumber] = validCardIds;
    return saveOrbTeams(teams);
}

// 驗證卡片ID是否有效且已解鎖
function validateCardIds(cardIds) {
    if (!Array.isArray(cardIds)) return [];
    
    const validIds = [];
    const seenIds = new Set();
    
    for (const cardId of cardIds) {
        if (!cardId || typeof cardId !== 'string') continue;
        if (seenIds.has(cardId)) continue; // 防止重複
        
        // 檢查卡片是否已解鎖
        if (!isCardOwned(cardId)) continue;
        
        seenIds.add(cardId);
        validIds.push(cardId);
    }
    
    return validIds;
}

// 取得隊伍的完整戰鬥卡片資料
function getTeamCardData(teamNumber) {
    const teams = getOrbTeams();
    const cardIds = teams[teamNumber] || [];
    
    // 使用 orb_battle_cards.js 的函式
    if (typeof getBattleCardsByIds === 'function') {
        return getBattleCardsByIds(cardIds);
    }
    
    return [];
}

// 檢查隊伍是否有效（至少有一張卡片）
function isTeamValid(teamNumber) {
    const teams = getOrbTeams();
    const cardIds = teams[teamNumber] || [];
    return cardIds.length > 0;
}

// 移除不存在的卡片ID
function cleanTeamData() {
    const teams = getOrbTeams();
    let cleaned = false;
    
    for (const teamNumber in teams) {
        const originalIds = teams[teamNumber];
        
        // 使用 orb_battle_cards.js 的清理函式
        if (typeof cleanTeamCardIds === 'function') {
            const validIds = cleanTeamCardIds(originalIds);
            
            if (originalIds.length !== validIds.length) {
                teams[teamNumber] = validIds;
                cleaned = true;
            }
        }
    }
    
    if (cleaned) {
        saveOrbTeams(teams);
    }
    
    return cleaned;
}

// Migration：從舊格式轉換
function migrateOrbBattleData() {
    const teams = getOrbTeams();
    
    // 檢查是否需要 migration
    if (teams.team1 && !teams[1]) {
        console.log('執行隊伍資料 migration...');
        const newTeams = {
            1: teams.team1 || [],
            2: [],
            3: []
        };
        saveOrbTeams(newTeams);
        console.log('Migration 完成');
    }
    
    // 清理不存在的卡片
    cleanTeamData();
}

// 初始化時執行 migration
migrateOrbBattleData();
