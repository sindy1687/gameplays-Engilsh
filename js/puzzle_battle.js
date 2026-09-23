// puzzle_battle.js - 轉珠冒險戰鬥系統

console.log('🔮 轉珠冒險系統載入中...');

// ===============================
// 全局配置
// ===============================
const CONFIG = {
    BOARD_ROWS: 5,
    BOARD_COLS: 6,
    DRAG_TIME: 5.0, // 拖珠時間（秒）
    MAX_TEAM_SIZE: 5,
    STAR_COST: 100, // 戰鬥消耗星星
    MIN_MATCH: 3, // 最低消除數量
    ORB_TYPES: ['fire', 'water', 'wood', 'light', 'dark', 'heart'],
    ORB_ICONS: {
        fire: '🔥',
        water: '💧',
        wood: '🌿',
        light: '⚡',
        dark: '🌙',
        heart: '❤️'
    },
    ELEMENT_ICONS: {
        fire: '🔥',
        water: '💧',
        wood: '🌿',
        light: '⚡',
        dark: '🌙'
    },
    ELEMENT_NAMES: {
        fire: '火',
        water: '水',
        wood: '木',
        light: '光',
        dark: '暗'
    }
};

// 珠子統一配置
const ORB_CONFIG = {
    fire: {
        icon: '🔥',
        name: '火'
    },
    water: {
        icon: '💧',
        name: '水'
    },
    wood: {
        icon: '🌿',
        name: '木'
    },
    light: {
        icon: '✨',
        name: '光'
    },
    dark: {
        icon: '🌑',
        name: '暗'
    },
    heart: {
        icon: '❤️',
        name: '心'
    }
};

// ===============================
// 遊戲狀態
// ===============================
const gameState = {
    currentScreen: 'stage', // stage, team, battle, result
    currentStage: 1,
    unlockedStages: 1,
    team: [], // 目前使用的隊伍（卡片ID陣列）
    battleTeams: {
        team1: [],
        team2: [],
        team3: []
    }, // 3組隊伍
    selectedTeam: 'team1', // 目前選中的隊伍
    teamNames: {
        team1: '隊伍1',
        team2: '隊伍2',
        team3: '隊伍3'
    }, // 隊伍自訂名稱
    battle: {
        wave: 1,
        maxWaves: 3,
        turn: 1,
        enemies: [],
        playerCards: [],
        board: [], // 5x6 陣列
        isDragging: false,
        timerStarted: false,
        timerRemaining: CONFIG.DRAG_TIME,
        combo: 0,
        isResolving: false,
        turnMatchSummary: null, // 回合消除摘要
        allMatchedGroups: [], // 所有消除群組（包含天降）
        battlePhase: 'PLAYER_INPUT', // 戰鬥階段
        teamMaxHp: 0, // 隊伍最大HP
        teamCurrentHp: 0, // 隊伍當前HP
        selectedEnemyId: null, // 選中的敵人ID
        isAttackResolving: false, // 玩家攻擊中
        isEnemyTurnResolving: false // 敵人回合中
    },
    firstFreeUsed: false
};

// ===============================
// LocalStorage 鍵值
// ===============================
const STORAGE_KEYS = {
    PUZZLE_PROGRESS: 'puzzleAdventureProgress',
    PUZZLE_TEAM: 'puzzleBattleTeam', // 舊版單一隊伍（保留用於遷移）
    PUZZLE_TEAMS: 'puzzleBattleTeams', // 新版3組隊伍
    PUZZLE_SELECTED_TEAM: 'puzzleSelectedTeam', // 目前選中的隊伍
    PUZZLE_TEAM_NAMES: 'puzzleTeamNames', // 隊伍自訂名稱
    PUZZLE_FIRST_FREE: 'puzzleBattleFirstFreeUsed',
    OWNED_CARDS: 'ownedCards',
    TOTAL_STARS: 'totalStars'
};

// ===============================
// 工具函數
// ===============================

/**
 * 穩定的 Hash 函數 - 用於固定分配卡片屬性
 * @param {string} str - 輸入字串
 * @returns {number} 0-5 的數字
 */
function stableHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 轉為 32-bit 整數
    }
    return Math.abs(hash);
}

// ===============================
// 卡片屬性系統
// ===============================

/**
 * 正規化卡片屬性
 * @param {string} element - 原始屬性
 * @returns {string} 正規化後的屬性
 */
function normalizeCardElement(element) {
    if (!element) return null;
    
    const elementMap = {
        'FIRE': 'fire',
        'fire': 'fire',
        'WATER': 'water',
        'water': 'water',
        'WOOD': 'wood',
        'wood': 'wood',
        'NATURE': 'wood',
        'nature': 'wood',
        'EARTH': 'wood',
        'earth': 'wood',
        'LIGHT': 'light',
        'light': 'light',
        'LIGHTNING': 'light',
        'lightning': 'light',
        'DARK': 'dark',
        'dark': 'dark',
        'SHADOW': 'dark',
        'shadow': 'dark'
    };
    
    return elementMap[element] || null;
}

/**
 * 根據卡片唯一ID產生穩定屬性
 * @param {object} card - 卡片物件
 * @returns {string} 屬性
 */
function getStableCardElement(card) {
    const key = card.id || card.word || card.zh || card.en || '';
    
    const hash = stableHash(key);
    const elements = ['fire', 'water', 'wood', 'light', 'dark'];
    return elements[hash % elements.length];
}

/**
 * 取得卡片屬性（統一函數）
 * @param {object} card - 卡片物件
 * @returns {string} 屬性
 */
function getCardElement(card) {
    if (!card) return null;
    
    // 優先使用卡片原本的屬性
    if (card.element) {
        const normalized = normalizeCardElement(card.element);
        if (normalized) return normalized;
    }
    
    // 如果沒有屬性，使用穩定計算
    return getStableCardElement(card);
}

/**
 * 取得屬性克制倍率
 * @param {string} attackerElement - 攻擊者屬性
 * @param {string} defenderElement - 防禦者屬性
 * @returns {number} 倍率
 */
function getElementMultiplier(attackerElement, defenderElement) {
    const advantageMap = {
        'fire': 'wood',    // 火克木
        'wood': 'water',   // 木克水
        'water': 'fire',   // 水克火
        'light': 'dark',   // 光克暗
        'dark': 'light'    // 暗克光
    };
    
    if (!attackerElement || !defenderElement) return 1;
    
    // 攻擊者克制防禦者
    if (advantageMap[attackerElement] === defenderElement) {
        return 1.5;
    }
    
    // 防禦者克制攻擊者（被克制）
    if (advantageMap[defenderElement] === attackerElement) {
        return 0.75;
    }
    
    return 1;
}

/**
 * 建立空的消除資料
 * @returns {Object} 空的消除資料
 */
function createEmptyMatchData() {
    return {
        groups: 0,
        maxGroupSize: 0,
        totalOrbs: 0,
        hasAOE: false
    };
}

/**
 * 建立回合消除摘要
 * @param {Array} matchedGroups - 消除群組陣列
 * @returns {Object} 回合消除摘要
 */
function buildTurnMatchSummary(matchedGroups) {
    const summary = {
        fire: createEmptyMatchData(),
        water: createEmptyMatchData(),
        wood: createEmptyMatchData(),
        light: createEmptyMatchData(),
        dark: createEmptyMatchData(),
        heart: createEmptyMatchData()
    };
    
    matchedGroups.forEach(group => {
        const data = summary[group.type];
        if (!data) return;
        
        data.groups += 1;
        data.totalOrbs += group.count;
        data.maxGroupSize = Math.max(data.maxGroupSize, group.count);
        
        // 只有非心珠且單一群組達到5顆以上才算全體攻擊
        if (group.type !== 'heart' && group.count >= 5) {
            data.hasAOE = true;
        }
    });
    
    return summary;
}

/**
 * 取得卡片唯一 ID
 * @param {object} card - 卡片物件
 * @returns {string} 唯一 ID
 */
function getCardUniqueId(card) {
    return card.id || card.word || card.zh;
}

/**
 * 判斷卡片是否為影片卡片
 * @param {object} card - 卡片物件
 * @returns {boolean}
 */
function isVideoCard(card) {
    const src = card.image || card.media || '';
    return /\.mp4($|\?)/i.test(src);
}

/**
 * 取得卡片媒體來源
 * @param {object} card - 卡片物件
 * @returns {string} 媒體 URL
 */
function getCardMediaSrc(card) {
    return card.image || card.media || '';
}

/**
 * 處理卡片媒體載入錯誤
 * @param {HTMLElement} mediaElement - 媒體元素
 * @param {boolean} isVideo - 是否為影片
 */
function handleCardMediaError(mediaElement, isVideo) {
    console.warn('卡片媒體載入失敗，使用預設圖片');
    
    const fallbackSrc = 'img/shop boss.png';
    const parent = mediaElement.parentElement;
    
    if (parent) {
        // 移除失敗的媒體元素
        mediaElement.remove();
        
        // 創建預設圖片
        const fallbackImg = document.createElement('img');
        fallbackImg.src = fallbackSrc;
        fallbackImg.className = 'card-media card-image';
        fallbackImg.alt = '預設卡片';
        fallbackImg.onerror = function() {
            // 如果預設圖片也失敗，顯示文字
            this.remove();
            const textDiv = document.createElement('div');
            textDiv.className = 'card-media card-fallback';
            textDiv.textContent = '📷';
            textDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:2rem;';
            parent.appendChild(textDiv);
        };
        
        parent.appendChild(fallbackImg);
    }
}

/**
 * 創建卡片媒體元素（統一處理圖片和影片）
 * @param {object} card - 卡片物件
 * @param {object} options - 選項
 * @returns {HTMLElement} 媒體元素
 */
function createCardMedia(card, options = {}) {
    const {
        context = 'library', // library | team | battle | detail
        autoplay = false
    } = options;
    
    const src = getCardMediaSrc(card);
    const isVideo = isVideoCard(card);
    const container = document.createElement('div');
    container.className = 'card-media-container';
    
    if (isVideo) {
        const video = document.createElement('video');
        video.className = 'card-media card-video';
        video.src = src;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'metadata';
        
        // 根據 context 設定播放行為
        if (context === 'battle') {
            video.autoplay = true;
            video.play().catch(err => console.log('影片自動播放失敗:', err));
        } else if (context === 'detail') {
            video.autoplay = true;
            video.play().catch(err => console.log('影片自動播放失敗:', err));
        } else if (context === 'library') {
            // 桌面版 hover 播放，手機版 IntersectionObserver 控制
            if (!isMobile()) {
                video.addEventListener('mouseenter', () => {
                    video.play().catch(err => console.log('影片播放失敗:', err));
                });
                video.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0;
                });
            }
        } else if (context === 'team') {
            // 隊伍編輯時預覽
            if (!isMobile()) {
                video.addEventListener('mouseenter', () => {
                    video.play().catch(err => console.log('影片播放失敗:', err));
                });
                video.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0;
                });
            }
        }
        
        // 載入錯誤處理
        video.onerror = () => handleCardMediaError(video, true);
        
        container.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.className = 'card-media card-image';
        img.src = src;
        img.alt = card.word || card.zh || '卡片';
        
        // 載入錯誤處理
        img.onerror = () => handleCardMediaError(img, false);
        
        container.appendChild(img);
    }
    
    return container;
}

/**
 * 判斷是否為手機裝置
 * @returns {boolean}
 */
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 暫停所有卡片影片
 */
function pauseAllCardVideos() {
    const videos = document.querySelectorAll('.card-video');
    videos.forEach(video => {
        video.pause();
    });
}

/**
 * 恢復可見範圍內的卡片影片播放
 */
function resumeVisibleCardVideos() {
    if (isMobile()) {
        const videos = document.querySelectorAll('.card-video');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    video.play().catch(err => console.log('影片播放失敗:', err));
                } else {
                    video.pause();
                }
            });
        }, {
            threshold: 0.1
        });
        
        videos.forEach(video => {
            observer.observe(video);
        });
        
        // 保存 observer 以便後清理
        window.cardVideoObserver = observer;
    }
}

/**
 * 清理影片 Observer
 */
function cleanupCardVideoObserver() {
    if (window.cardVideoObserver) {
        window.cardVideoObserver.disconnect();
        window.cardVideoObserver = null;
    }
}

/**
 * 取得卡片屬性（基於穩定 Hash）
 * @param {object} card - 卡片物件
 * @returns {string} 屬性名稱
 */
function getCardElement(card) {
    const uniqueId = getCardUniqueId(card);
    const hashIndex = stableHash(uniqueId);
    return CONFIG.ORB_TYPES[hashIndex];
}

/**
 * 取得星星數量
 * @returns {number}
 */
function getStars() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_STARS) || '0', 10);
}

/**
 * 扣除星星
 * @param {number} amount - 扣除數量
 */
function deductStars(amount) {
    const current = getStars();
    const newAmount = Math.max(0, current - amount);
    localStorage.setItem(STORAGE_KEYS.TOTAL_STARS, newAmount.toString());
    updateStarsDisplay();
}

/**
 * 更新星星顯示
 */
function updateStarsDisplay() {
    const display = document.getElementById('stars-display');
    if (display) {
        display.textContent = getStars();
    }
}

// ===============================
// 卡片系統
// ===============================

/**
 * 取得已解鎖的戰鬥卡片
 * @returns {Array} 已解鎖卡片陣列
 */
function getUnlockedBattleCards() {
    try {
        const ownedCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.OWNED_CARDS) || '{}');
        const allCards = typeof baseCards !== 'undefined' ? baseCards : [];
        
        // 過濾出已解鎖的卡片
        const unlockedCards = allCards.filter(card => {
            const uniqueId = getCardUniqueId(card);
            return ownedCards[uniqueId];
        });
        
        // 為每張卡片添加屬性資訊
        return unlockedCards.map(card => ({
            ...card,
            uniqueId: getCardUniqueId(card),
            element: getCardElement(card),
            hp: 1000, // 基礎 HP
            attack: 100, // 基礎攻擊
            skillCooldown: 5 // 技能冷卻
        }));
    } catch (error) {
        console.error('取得已解鎖卡片失敗:', error);
        return [];
    }
}

// ===============================
// 隊伍系統
// ===============================

/**
 * 載入隊伍（包含舊資料遷移和卡片失效處理）
 */
function loadTeam() {
    try {
        // 檢查是否需要遷移舊資料
        const oldTeam = localStorage.getItem(STORAGE_KEYS.PUZZLE_TEAM);
        const newTeams = localStorage.getItem(STORAGE_KEYS.PUZZLE_TEAMS);
        
        if (oldTeam && !newTeams) {
            // 遷移舊資料到team1
            const migratedTeams = {
                team1: JSON.parse(oldTeam),
                team2: [],
                team3: []
            };
            localStorage.setItem(STORAGE_KEYS.PUZZLE_TEAMS, JSON.stringify(migratedTeams));
            localStorage.setItem(STORAGE_KEYS.PUZZLE_SELECTED_TEAM, 'team1');
            localStorage.setItem(STORAGE_KEYS.PUZZLE_TEAM_NAMES, JSON.stringify({
                team1: '隊伍1',
                team2: '隊伍2',
                team3: '隊伍3'
            }));
            console.log('舊隊伍資料已遷移到team1');
        }
        
        // 載入3組隊伍
        const teamsData = localStorage.getItem(STORAGE_KEYS.PUZZLE_TEAMS);
        if (teamsData) {
            gameState.battleTeams = JSON.parse(teamsData);
        } else {
            // 初始化空隊伍
            gameState.battleTeams = {
                team1: [],
                team2: [],
                team3: []
            };
            localStorage.setItem(STORAGE_KEYS.PUZZLE_TEAMS, JSON.stringify(gameState.battleTeams));
        }
        
        // 載入選中的隊伍
        const selectedTeam = localStorage.getItem(STORAGE_KEYS.PUZZLE_SELECTED_TEAM) || 'team1';
        gameState.selectedTeam = selectedTeam;
        
        // 載入隊伍名稱
        const teamNames = localStorage.getItem(STORAGE_KEYS.PUZZLE_TEAM_NAMES);
        if (teamNames) {
            gameState.teamNames = JSON.parse(teamNames);
        } else {
            gameState.teamNames = {
                team1: '隊伍1',
                team2: '隊伍2',
                team3: '隊伍3'
            };
            localStorage.setItem(STORAGE_KEYS.PUZZLE_TEAM_NAMES, JSON.stringify(gameState.teamNames));
        }
        
        // 處理卡片失效
        cleanupInvalidCards();
        
        // 設定目前使用的隊伍
        gameState.team = gameState.battleTeams[gameState.selectedTeam] || [];
    } catch (error) {
        console.error('載入隊伍失敗:', error);
        gameState.team = [];
        gameState.battleTeams = {
            team1: [],
            team2: [],
            team3: []
        };
    }
}

/**
 * 清理失效卡片
 */
function cleanupInvalidCards() {
    const unlockedCards = getUnlockedBattleCards();
    const unlockedCardIds = new Set(unlockedCards.map(c => c.uniqueId));
    
    let hasChanges = false;
    
    ['team1', 'team2', 'team3'].forEach(teamId => {
        const team = gameState.battleTeams[teamId] || [];
        const validTeam = team.filter(cardId => cardId && unlockedCardIds.has(cardId));
        
        if (validTeam.length !== team.length) {
            gameState.battleTeams[teamId] = validTeam;
            hasChanges = true;
            console.log(`隊伍${teamId}清理了${team.length - validTeam.length}張失效卡片`);
        }
    });
    
    if (hasChanges) {
        saveTeam();
    }
}

/**
 * 保存隊伍
 */
function saveTeam() {
    try {
        // 保存3組隊伍
        localStorage.setItem(STORAGE_KEYS.PUZZLE_TEAMS, JSON.stringify(gameState.battleTeams));
        // 保存選中的隊伍
        localStorage.setItem(STORAGE_KEYS.PUZZLE_SELECTED_TEAM, gameState.selectedTeam);
        // 保存隊伍名稱
        localStorage.setItem(STORAGE_KEYS.PUZZLE_TEAM_NAMES, JSON.stringify(gameState.teamNames));
    } catch (error) {
        console.error('保存隊伍失敗:', error);
    }
}

/**
 * 切換隊伍
 * @param {string} teamId - 隊伍ID (team1, team2, team3)
 */
function selectTeam(teamId) {
    if (!gameState.battleTeams[teamId]) return;
    
    gameState.selectedTeam = teamId;
    gameState.team = gameState.battleTeams[teamId] || [];
    
    saveTeam();
    renderTeamScreen();
}

/**
 * 取得隊伍名稱
 * @param {string} teamId - 隊伍ID
 * @returns {string} 隊伍名稱
 */
function getTeamName(teamId) {
    return gameState.teamNames[teamId] || `隊伍${teamId.replace('team', '')}`;
}

/**
 * 設定隊伍名稱
 * @param {string} teamId - 隊伍ID
 * @param {string} name - 新名稱
 */
function setTeamName(teamId, name) {
    gameState.teamNames[teamId] = name;
    saveTeam();
}

/**
 * 複製隊伍
 * @param {string} sourceTeamId - 來源隊伍ID
 * @param {string} targetTeamId - 目標隊伍ID
 */
function copyTeam(sourceTeamId, targetTeamId) {
    if (!gameState.battleTeams[sourceTeamId] || !gameState.battleTeams[targetTeamId]) return;
    
    gameState.battleTeams[targetTeamId] = [...gameState.battleTeams[sourceTeamId]];
    saveTeam();
}

/**
 * 清空隊伍
 * @param {string} teamId - 隊伍ID
 */
function clearTeam(teamId) {
    if (!gameState.battleTeams[teamId]) return;
    
    gameState.battleTeams[teamId] = [];
    saveTeam();
}

/**
 * 設為隊長
 * @param {string} teamId - 隊伍ID
 * @param {number} index - 卡片索引
 */
function setAsLeader(teamId, index) {
    if (!gameState.battleTeams[teamId] || index < 0 || index >= gameState.battleTeams[teamId].length) return;
    
    const team = gameState.battleTeams[teamId];
    const leaderCard = team[index];
    
    // 移除該卡片
    team.splice(index, 1);
    // 插入到隊長位置
    team.unshift(leaderCard);
    
    saveTeam();
}

/**
 * 渲染隊伍編成畫面
 */
function renderTeamScreen() {
    const currentTeamDiv = document.getElementById('current-team');
    const unlockedCardsDiv = document.getElementById('unlocked-cards');
    
    // 清空現有內容
    currentTeamDiv.innerHTML = '';
    unlockedCardsDiv.innerHTML = '';
    
    // 清理舊的影片 observer
    cleanupCardVideoObserver();
    
    // 渲染隊伍切換按鈕
    const teamSelectorDiv = document.createElement('div');
    teamSelectorDiv.className = 'team-selector';
    teamSelectorDiv.style.cssText = 'display:flex;gap:10px;margin-bottom:20px;justify-content:center;';
    
    ['team1', 'team2', 'team3'].forEach(teamId => {
        const btn = document.createElement('button');
        btn.className = 'team-select-btn';
        btn.textContent = getTeamName(teamId);
        btn.style.cssText = `
            padding:10px 20px;
            border:2px solid ${gameState.selectedTeam === teamId ? '#ffd700' : '#666'};
            background:${gameState.selectedTeam === teamId ? '#ffd700' : '#333'};
            color:${gameState.selectedTeam === teamId ? '#000' : '#fff'};
            border-radius:8px;
            cursor:pointer;
            font-weight:bold;
        `;
        btn.onclick = () => selectTeam(teamId);
        teamSelectorDiv.appendChild(btn);
    });
    
    currentTeamDiv.appendChild(teamSelectorDiv);
    
    // 渲染隊伍操作按鈕
    const teamActionsDiv = document.createElement('div');
    teamActionsDiv.className = 'team-actions';
    teamActionsDiv.style.cssText = 'display:flex;gap:10px;margin-bottom:15px;justify-content:center;';
    
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '複製隊伍';
    copyBtn.style.cssText = 'padding:8px 16px;background:#44ff44;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:bold;';
    copyBtn.onclick = () => showCopyTeamDialog();
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '清空隊伍';
    clearBtn.style.cssText = 'padding:8px 16px;background:#ff4444;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;';
    clearBtn.onclick = () => showClearTeamDialog();
    
    const renameBtn = document.createElement('button');
    renameBtn.textContent = '修改名稱';
    renameBtn.style.cssText = 'padding:8px 16px;background:#ffd700;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:bold;';
    renameBtn.onclick = () => showRenameTeamDialog();
    
    teamActionsDiv.appendChild(copyBtn);
    teamActionsDiv.appendChild(clearBtn);
    teamActionsDiv.appendChild(renameBtn);
    
    currentTeamDiv.appendChild(teamActionsDiv);
    
    // 渲染隊伍資訊
    const teamInfoDiv = document.createElement('div');
    teamInfoDiv.className = 'team-info';
    teamInfoDiv.style.cssText = 'background:#222;padding:15px;border-radius:8px;margin-bottom:20px;color:#fff;';
    
    const currentTeam = gameState.battleTeams[gameState.selectedTeam] || [];
    const unlockedCards = getUnlockedBattleCards();
    
    // 計算隊伍統計
    let totalHp = 0;
    let totalAttack = 0;
    const elementCount = { fire: 0, water: 0, wood: 0, light: 0, dark: 0 };
    
    currentTeam.forEach(cardId => {
        const card = unlockedCards.find(c => c.uniqueId === cardId);
        if (card) {
            totalHp += card.hp;
            totalAttack += card.attack;
            const element = getCardElement(card);
            if (elementCount[element] !== undefined) {
                elementCount[element]++;
            }
        }
    });
    
    teamInfoDiv.innerHTML = `
        <h3 style="margin:0 0 10px 0;">${getTeamName(gameState.selectedTeam)}</h3>
        <p style="margin:5px 0;">HP：${totalHp}</p>
        <p style="margin:5px 0;">戰力：${totalAttack}</p>
        <p style="margin:5px 0;">屬性：${CONFIG.ELEMENT_ICONS.fire}×${elementCount.fire} ${CONFIG.ELEMENT_ICONS.water}×${elementCount.water} ${CONFIG.ELEMENT_ICONS.wood}×${elementCount.wood} ${CONFIG.ELEMENT_ICONS.light}×${elementCount.light} ${CONFIG.ELEMENT_ICONS.dark}×${elementCount.dark}</p>
    `;
    
    currentTeamDiv.appendChild(teamInfoDiv);
    
    // 渲染隊伍槽位
    const teamSlotsDiv = document.createElement('div');
    teamSlotsDiv.className = 'team-slots';
    teamSlotsDiv.style.cssText = 'display:flex;gap:10px;margin-bottom:20px;justify-content:center;';
    
    for (let i = 0; i < CONFIG.MAX_TEAM_SIZE; i++) {
        const slot = document.createElement('div');
        slot.className = 'team-slot';
        slot.style.cssText = 'width:80px;height:100px;border:2px dashed #666;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:#222;position:relative;overflow:hidden;';
        
        if (currentTeam[i]) {
            const card = unlockedCards.find(c => c.uniqueId === currentTeam[i]);
            if (card) {
                slot.style.border = '2px solid #ffd700';
                
                // 使用統一的媒體創建函數
                const mediaContainer = createCardMedia(card, { context: 'team' });
                mediaContainer.style.cssText = 'width:100%;height:100%;border-radius:6px;overflow:hidden;';
                
                // 使用統一的屬性函數
                const element = getCardElement(card);
                const elementBadge = document.createElement('div');
                elementBadge.className = 'card-element';
                elementBadge.textContent = CONFIG.ELEMENT_ICONS[element];
                elementBadge.style.cssText = 'position:absolute;top:3px;right:3px;background:rgba(0,0,0,0.7);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;z-index:10;';
                
                const positionLabel = document.createElement('div');
                positionLabel.textContent = i === 0 ? '隊長' : `${i + 1}`;
                positionLabel.style.cssText = 'position:absolute;bottom:3px;left:3px;background:rgba(0,0,0,0.7);color:#fff;padding:2px 6px;border-radius:4px;font-size:0.6rem;z-index:10;';
                
                slot.appendChild(mediaContainer);
                slot.appendChild(elementBadge);
                slot.appendChild(positionLabel);
                slot.onclick = () => showCardOptions(gameState.selectedTeam, i);
            }
        } else {
            slot.textContent = '+';
            slot.style.color = '#666';
            slot.style.fontSize = '2rem';
            slot.onclick = () => showCardSelector(gameState.selectedTeam, i);
        }
        
        teamSlotsDiv.appendChild(slot);
    }
    
    currentTeamDiv.appendChild(teamSlotsDiv);
    
    // 渲染屬性篩選器
    const filterDiv = document.createElement('div');
    filterDiv.className = 'element-filter';
    filterDiv.style.cssText = 'display:flex;gap:10px;margin-bottom:15px;justify-content:center;flex-wrap:wrap;';
    
    const filterOptions = [
        { id: 'all', label: '全部' },
        { id: 'fire', label: '🔥 火' },
        { id: 'water', label: '💧 水' },
        { id: 'wood', label: '🌿 木' },
        { id: 'light', label: '✨ 光' },
        { id: 'dark', label: '🌑 暗' }
    ];
    
    filterOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = option.label;
        btn.style.cssText = `
            padding:8px 16px;
            border:2px solid #666;
            background:#333;
            color:#fff;
            border-radius:6px;
            cursor:pointer;
            font-size:0.9rem;
        `;
        btn.onclick = () => {
            // 更新篩選狀態
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.style.borderColor = '#666';
                b.style.background = '#333';
            });
            btn.style.borderColor = '#ffd700';
            btn.style.background = '#ffd700';
            btn.style.color = '#000';
            
            // 重新渲染卡片列表
            renderUnlockedCards(option.id);
        };
        
        if (option.id === 'all') {
            btn.style.borderColor = '#ffd700';
            btn.style.background = '#ffd700';
            btn.style.color = '#000';
        }
        
        filterDiv.appendChild(btn);
    });
    
    currentTeamDiv.appendChild(filterDiv);
    
    // 渲染已解鎖卡片
    const unlockedCardsListDiv = document.createElement('div');
    unlockedCardsListDiv.id = 'unlocked-cards-list';
    unlockedCardsListDiv.className = 'unlocked-cards-list';
    unlockedCardsListDiv.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px;';
    
    renderUnlockedCards('all');
    
    unlockedCardsDiv.appendChild(unlockedCardsListDiv);
}

/**
 * 渲染已解鎖卡片（支援屬性篩選）
 * @param {string} filter - 篩選條件
 */
function renderUnlockedCards(filter = 'all') {
    const unlockedCardsListDiv = document.getElementById('unlocked-cards-list');
    if (!unlockedCardsListDiv) return;
    
    unlockedCardsListDiv.innerHTML = '';
    
    const unlockedCards = getUnlockedBattleCards();
    const currentTeam = gameState.battleTeams[gameState.selectedTeam] || [];
    
    // 根據篩選條件過濾卡片
    const filteredCards = filter === 'all' 
        ? unlockedCards 
        : unlockedCards.filter(card => {
            const element = getCardElement(card);
            return element === filter;
        });
    
    filteredCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'battle-card';
        cardDiv.style.cssText = 'position:relative;cursor:pointer;border-radius:8px;overflow:hidden;background:#222;';
        
        const isInTeam = currentTeam.includes(card.uniqueId);
        if (isInTeam) {
            cardDiv.style.border = '2px solid #ffd700';
        }
        
        // 使用統一的媒體創建函數
        const mediaContainer = createCardMedia(card, { context: 'library' });
        mediaContainer.style.cssText = 'width:100%;height:100%;';
        
        // 使用統一的屬性函數
        const element = getCardElement(card);
        const elementBadge = document.createElement('div');
        elementBadge.className = 'card-element';
        elementBadge.textContent = CONFIG.ELEMENT_ICONS[element];
        elementBadge.style.cssText = 'position:absolute;top:3px;right:3px;background:rgba(0,0,0,0.7);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;z-index:10;';
        
        cardDiv.appendChild(mediaContainer);
        cardDiv.appendChild(elementBadge);
        
        cardDiv.onclick = () => {
            if (isInTeam) {
                const index = currentTeam.indexOf(card.uniqueId);
                if (index !== -1) {
                    showCardOptions(gameState.selectedTeam, index);
                }
            } else {
                // 找到第一個空位加入
                const emptyIndex = currentTeam.findIndex(id => !id);
                if (emptyIndex !== -1) {
                    addToTeam(gameState.selectedTeam, emptyIndex, card.uniqueId);
                } else {
                    alert('隊伍已滿！');
                }
            }
        };
        
        unlockedCardsListDiv.appendChild(cardDiv);
    });
}

/**
 * 顯示卡片選擇器
 * @param {string} teamId - 隊伍ID
 * @param {number} slotIndex - 槽位索引
 */
function showCardSelector(teamId, slotIndex) {
    const unlockedCards = getUnlockedBattleCards();
    const currentTeam = gameState.battleTeams[teamId] || [];
    
    // 建立選擇器彈窗
    const modal = document.createElement('div');
    modal.className = 'card-selector-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:#222;padding:20px;border-radius:12px;max-width:90%;max-height:80%;overflow-y:auto;';
    
    modalContent.innerHTML = `
        <h2 style="color:#fff;margin:0 0 15px 0;">選擇卡片</h2>
        <input type="text" id="card-search" placeholder="搜尋卡片名稱..." style="width:100%;padding:10px;margin-bottom:15px;background:#333;color:#fff;border:1px solid #666;border-radius:6px;">
        <div id="card-selector-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px;"></div>
        <button id="close-selector" style="margin-top:15px;padding:10px 20px;background:#666;color:#fff;border:none;border-radius:8px;cursor:pointer;">關閉</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 渲染卡片列表
    renderCardSelectorList(unlockedCards, currentTeam, teamId, slotIndex);
    
    // 搜尋功能
    document.getElementById('card-search').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCards = unlockedCards.filter(card => 
            card.name.toLowerCase().includes(searchTerm)
        );
        renderCardSelectorList(filteredCards, currentTeam, teamId, slotIndex);
    });
    
    // 關閉按鈕
    document.getElementById('close-selector').onclick = () => modal.remove();
}

/**
 * 渲染卡片選擇器列表
 * @param {Array} cards - 卡片陣列
 * @param {Array} currentTeam - 目前隊伍
 * @param {string} teamId - 隊伍ID
 * @param {number} slotIndex - 槽位索引
 */
function renderCardSelectorList(cards, currentTeam, teamId, slotIndex) {
    const cardList = document.getElementById('card-selector-list');
    if (!cardList) return;
    
    cardList.innerHTML = '';
    
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'battle-card';
        cardDiv.style.cssText = 'position:relative;cursor:pointer;border-radius:8px;overflow:hidden;background:#222;border:2px solid #666;';
        
        // 檢查是否已在隊伍中
        const isInTeam = currentTeam.includes(card.uniqueId);
        if (isInTeam) {
            cardDiv.style.opacity = '0.5';
            cardDiv.style.borderColor = '#ff4444';
        }
        
        // 使用統一的媒體創建函數
        const mediaContainer = createCardMedia(card, { context: 'library' });
        mediaContainer.style.cssText = 'width:100%;height:100%;';
        
        // 使用統一的屬性函數
        const element = getCardElement(card);
        const elementBadge = document.createElement('div');
        elementBadge.className = 'card-element';
        elementBadge.textContent = CONFIG.ELEMENT_ICONS[element];
        elementBadge.style.cssText = 'position:absolute;top:3px;right:3px;background:rgba(0,0,0,0.7);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;z-index:10;';
        
        // 卡片名稱
        const nameLabel = document.createElement('div');
        nameLabel.textContent = card.name;
        nameLabel.style.cssText = 'position:absolute;bottom:3px;left:3px;background:rgba(0,0,0,0.7);color:#fff;padding:2px 6px;border-radius:4px;font-size:0.6rem;z-index:10;max-width:90%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        
        cardDiv.appendChild(mediaContainer);
        cardDiv.appendChild(elementBadge);
        cardDiv.appendChild(nameLabel);
        
        if (isInTeam) {
            cardDiv.onclick = () => {
                alert('此卡片已在隊伍中！');
            };
        } else {
            cardDiv.onclick = () => {
                addToTeam(teamId, slotIndex, card.uniqueId);
                document.querySelector('.card-selector-modal').remove();
            };
        }
        
        cardList.appendChild(cardDiv);
    });
}

/**
 * 顯示卡片選項
 * @param {string} teamId - 隊伍ID
 * @param {number} slotIndex - 槽位索引
 */
function showCardOptions(teamId, slotIndex) {
    const currentTeam = gameState.battleTeams[teamId] || [];
    const cardId = currentTeam[slotIndex];
    
    if (!cardId) return;
    
    const modal = document.createElement('div');
    modal.className = 'card-options-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:#222;padding:20px;border-radius:12px;min-width:300px;';
    
    modalContent.innerHTML = `
        <h2 style="color:#fff;margin:0 0 15px 0;">卡片選項</h2>
        <button id="replace-card" style="display:block;width:100%;padding:10px;margin-bottom:10px;background:#ffd700;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">更換卡片</button>
        <button id="remove-card" style="display:block;width:100%;padding:10px;margin-bottom:10px;background:#ff4444;color:#fff;border:none;border-radius:8px;cursor:pointer;">移除卡片</button>
        ${slotIndex > 0 ? '<button id="set-leader" style="display:block;width:100%;padding:10px;margin-bottom:10px;background:#44ff44;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">設為隊長</button>' : ''}
        ${slotIndex > 0 ? '<button id="move-left" style="display:block;width:100%;padding:10px;margin-bottom:10px;background:#666;color:#fff;border:none;border-radius:8px;cursor:pointer;">左移</button>' : ''}
        ${slotIndex < currentTeam.length - 1 ? '<button id="move-right" style="display:block;width:100%;padding:10px;margin-bottom:10px;background:#666;color:#fff;border:none;border-radius:8px;cursor:pointer;">右移</button>' : ''}
        <button id="close-options" style="display:block;width:100%;padding:10px;background:#666;color:#fff;border:none;border-radius:8px;cursor:pointer;">關閉</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 更換卡片
    document.getElementById('replace-card').onclick = () => {
        modal.remove();
        showCardSelector(teamId, slotIndex);
    };
    
    // 移除卡片
    document.getElementById('remove-card').onclick = () => {
        removeFromTeam(teamId, slotIndex);
        modal.remove();
    };
    
    // 設為隊長
    if (slotIndex > 0) {
        document.getElementById('set-leader').onclick = () => {
            setAsLeader(teamId, slotIndex);
            modal.remove();
            renderTeamScreen();
        };
    }
    
    // 左移
    if (slotIndex > 0) {
        document.getElementById('move-left').onclick = () => {
            moveCard(teamId, slotIndex, slotIndex - 1);
            modal.remove();
            renderTeamScreen();
        };
    }
    
    // 右移
    if (slotIndex < currentTeam.length - 1) {
        document.getElementById('move-right').onclick = () => {
            moveCard(teamId, slotIndex, slotIndex + 1);
            modal.remove();
            renderTeamScreen();
        };
    }
    
    // 關閉
    document.getElementById('close-options').onclick = () => modal.remove();
}

/**
 * 移動卡片位置
 * @param {string} teamId - 隊伍ID
 * @param {number} fromIndex - 來源索引
 * @param {number} toIndex - 目標索引
 */
function moveCard(teamId, fromIndex, toIndex) {
    if (!gameState.battleTeams[teamId]) return;
    
    const team = gameState.battleTeams[teamId];
    if (fromIndex < 0 || fromIndex >= team.length || toIndex < 0 || toIndex >= team.length) return;
    
    // 交換位置
    const temp = team[fromIndex];
    team[fromIndex] = team[toIndex];
    team[toIndex] = temp;
    
    saveTeam();
}

/**
 * 加入卡片到隊伍
 * @param {string} teamId - 隊伍ID
 * @param {number} slotIndex - 槽位索引
 * @param {string} cardId - 卡片ID
 */
function addToTeam(teamId, slotIndex, cardId) {
    if (!gameState.battleTeams[teamId]) return;
    
    const team = gameState.battleTeams[teamId];
    
    // 檢查同隊是否重複
    if (team.includes(cardId)) {
        alert('此卡片已在隊伍中！');
        return;
    }
    
    team[slotIndex] = cardId;
    saveTeam();
    renderTeamScreen();
}

/**
 * 從隊伍移除卡片
 * @param {string} teamId - 隊伍ID
 * @param {number} slotIndex - 槽位索引
 */
function removeFromTeam(teamId, slotIndex) {
    if (!gameState.battleTeams[teamId]) return;
    
    const team = gameState.battleTeams[teamId];
    
    // 移除卡片並自動整理
    team.splice(slotIndex, 1);
    
    saveTeam();
    renderTeamScreen();
}

/**
 * 顯示複製隊伍對話框
 */
function showCopyTeamDialog() {
    const modal = document.createElement('div');
    modal.className = 'copy-team-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:#222;padding:20px;border-radius:12px;min-width:300px;';
    
    modalContent.innerHTML = `
        <h2 style="color:#fff;margin:0 0 15px 0;">複製隊伍</h2>
        <p style="color:#fff;margin-bottom:15px;">將「${getTeamName(gameState.selectedTeam)}」複製到：</p>
        <div id="copy-target-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:15px;"></div>
        <button id="close-copy-dialog" style="padding:10px 20px;background:#666;color:#fff;border:none;border-radius:8px;cursor:pointer;">取消</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 渲染目標隊伍列表
    const targetList = document.getElementById('copy-target-list');
    ['team1', 'team2', 'team3'].forEach(teamId => {
        if (teamId === gameState.selectedTeam) return;
        
        const teamDiv = document.createElement('div');
        teamDiv.className = 'copy-target-option';
        teamDiv.style.cssText = 'padding:10px;border:2px solid #666;background:#333;border-radius:6px;cursor:pointer;color:#fff;';
        teamDiv.textContent = getTeamName(teamId);
        
        teamDiv.onclick = () => {
            if (confirm(`確定要覆蓋「${getTeamName(teamId)}」嗎？`)) {
                copyTeam(gameState.selectedTeam, teamId);
                modal.remove();
                renderTeamScreen();
            }
        };
        
        targetList.appendChild(teamDiv);
    });
    
    // 關閉按鈕
    document.getElementById('close-copy-dialog').onclick = () => modal.remove();
}

/**
 * 顯示清空隊伍對話框
 */
function showClearTeamDialog() {
    if (confirm(`確定要清空「${getTeamName(gameState.selectedTeam)}」嗎？`)) {
        clearTeam(gameState.selectedTeam);
        renderTeamScreen();
    }
}

/**
 * 顯示修改隊伍名稱對話框
 */
function showRenameTeamDialog() {
    const newName = prompt('請輸入新的隊伍名稱：', getTeamName(gameState.selectedTeam));
    if (newName && newName.trim()) {
        setTeamName(gameState.selectedTeam, newName.trim());
        renderTeamScreen();
    }
}

// 啟動手機版影片可見性控制
resumeVisibleCardVideos();

// ===============================
// 關卡系統
// ===============================

/**
 * 載入關卡進度
 */
function loadProgress() {
    try {
        const progress = localStorage.getItem(STORAGE_KEYS.PUZZLE_PROGRESS);
        if (progress) {
            const data = JSON.parse(progress);
            gameState.unlockedStages = data.unlockedStages || 1;
        }
    } catch (error) {
        console.error('載入關卡進度失敗:', error);
    }
}

/**
 * 保存關卡進度
 */
function saveProgress() {
    try {
        localStorage.setItem(STORAGE_KEYS.PUZZLE_PROGRESS, JSON.stringify({
            unlockedStages: gameState.unlockedStages
        }));
    } catch (error) {
        console.error('保存關卡進度失敗:', error);
    }
}

/**
 * 渲染關卡地圖
 */
function renderStageMap() {
    const stageMap = document.getElementById('stage-map');
    stageMap.innerHTML = '';
    
    // 顯示出戰隊伍資訊
    renderCurrentTeamInfo(stageMap);
    
    const totalStages = 20;
    const chapters = 4;
    const stagesPerChapter = totalStages / chapters;
    
    for (let chapter = 1; chapter <= chapters; chapter++) {
        const chapterDiv = document.createElement('div');
        chapterDiv.style.marginBottom = '30px';
        chapterDiv.innerHTML = `<h3 style="color:var(--glow-cyan);text-align:center;">第 ${chapter} 章</h3>`;
        
        const chapterStages = document.createElement('div');
        chapterStages.style.display = 'flex';
        chapterStages.style.gap = '15px';
        chapterStages.style.justifyContent = 'center';
        chapterStages.style.flexWrap = 'wrap';
        
        for (let i = 1; i <= stagesPerChapter; i++) {
            const stageNum = (chapter - 1) * stagesPerChapter + i;
            const isBoss = i === stagesPerChapter;
            const isUnlocked = stageNum <= gameState.unlockedStages;
            const isAvailable = stageNum === gameState.unlockedStages;
            
            const stageNode = document.createElement('div');
            stageNode.className = 'stage-node';
            
            if (isBoss) {
                stageNode.classList.add('boss');
            }
            
            if (!isUnlocked) {
                stageNode.classList.add('locked');
                stageNode.textContent = '🔒';
            } else if (isAvailable) {
                stageNode.classList.add('available');
                stageNode.textContent = stageNum;
                stageNode.onclick = () => startStage(stageNum);
            } else {
                stageNode.classList.add('cleared');
                stageNode.textContent = stageNum;
                stageNode.onclick = () => startStage(stageNum);
            }
            
            chapterStages.appendChild(stageNode);
        }
        
        chapterDiv.appendChild(chapterStages);
        stageMap.appendChild(chapterDiv);
    }
}

/**
 * 顯示出戰隊伍資訊
 * @param {HTMLElement} container - 容器元素
 */
function renderCurrentTeamInfo(container) {
    const currentTeam = gameState.battleTeams[gameState.selectedTeam] || [];
    const unlockedCards = getUnlockedBattleCards();
    
    // 計算隊伍統計
    let totalHp = 0;
    let totalAttack = 0;
    let leaderCard = null;
    const elementCount = { fire: 0, water: 0, wood: 0, light: 0, dark: 0 };
    
    currentTeam.forEach((cardId, index) => {
        const card = unlockedCards.find(c => c.uniqueId === cardId);
        if (card) {
            totalHp += card.hp;
            totalAttack += card.attack;
            const element = getCardElement(card);
            if (elementCount[element] !== undefined) {
                elementCount[element]++;
            }
            if (index === 0) {
                leaderCard = card;
            }
        }
    });
    
    const teamInfoDiv = document.createElement('div');
    teamInfoDiv.className = 'current-team-info';
    teamInfoDiv.style.cssText = 'background:#222;padding:20px;border-radius:12px;margin-bottom:30px;color:#fff;border:2px solid #ffd700;';
    
    teamInfoDiv.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
            <h3 style="margin:0;color:#ffd700;">出戰隊伍：${getTeamName(gameState.selectedTeam)}</h3>
            <button id="quick-switch-team" style="padding:8px 16px;background:#ffd700;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">切換隊伍</button>
        </div>
        ${leaderCard ? `
            <div style="margin-bottom:10px;">
                <span style="color:#ffd700;">隊長：</span>
                <span>${CONFIG.ELEMENT_ICONS[getCardElement(leaderCard)]} ${leaderCard.name}</span>
            </div>
        ` : '<div style="margin-bottom:10px;color:#ff4444;">請設定隊長</div>'}
        <div style="display:flex;gap:20px;margin-bottom:10px;">
            <div><span style="color:#ffd700;">HP：</span>${totalHp}</div>
            <div><span style="color:#ffd700;">戰力：</span>${totalAttack}</div>
        </div>
        <div>
            <span style="color:#ffd700;">屬性：</span>
            ${CONFIG.ELEMENT_ICONS.fire}×${elementCount.fire} 
            ${CONFIG.ELEMENT_ICONS.water}×${elementCount.water} 
            ${CONFIG.ELEMENT_ICONS.wood}×${elementCount.wood} 
            ${CONFIG.ELEMENT_ICONS.light}×${elementCount.light} 
            ${CONFIG.ELEMENT_ICONS.dark}×${elementCount.dark}
        </div>
    `;
    
    container.appendChild(teamInfoDiv);
    
    // 快速切換隊伍按鈕
    document.getElementById('quick-switch-team').onclick = () => showQuickTeamSwitch();
}

/**
 * 顯示快速切換隊伍
 */
function showQuickTeamSwitch() {
    const modal = document.createElement('div');
    modal.className = 'quick-team-switch-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:#222;padding:20px;border-radius:12px;min-width:300px;';
    
    modalContent.innerHTML = `
        <h2 style="color:#fff;margin:0 0 15px 0;">選擇出戰隊伍</h2>
        <div id="quick-team-list" style="display:flex;flex-direction:column;gap:10px;"></div>
        <button id="close-quick-switch" style="margin-top:15px;padding:10px 20px;background:#666;color:#fff;border:none;border-radius:8px;cursor:pointer;">關閉</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // 渲染隊伍列表
    const teamList = document.getElementById('quick-team-list');
    ['team1', 'team2', 'team3'].forEach(teamId => {
        const team = gameState.battleTeams[teamId] || [];
        const unlockedCards = getUnlockedBattleCards();
        
        let totalHp = 0;
        let totalAttack = 0;
        let leaderName = '無隊長';
        
        team.forEach((cardId, index) => {
            const card = unlockedCards.find(c => c.uniqueId === cardId);
            if (card) {
                totalHp += card.hp;
                totalAttack += card.attack;
                if (index === 0) {
                    leaderName = card.name;
                }
            }
        });
        
        const teamDiv = document.createElement('div');
        teamDiv.className = 'quick-team-option';
        teamDiv.style.cssText = `
            padding:15px;
            border:2px solid ${gameState.selectedTeam === teamId ? '#ffd700' : '#666'};
            background:${gameState.selectedTeam === teamId ? '#333' : '#222'};
            border-radius:8px;
            cursor:pointer;
            color:#fff;
        `;
        
        teamDiv.innerHTML = `
            <div style="font-weight:bold;margin-bottom:5px;">${getTeamName(teamId)}</div>
            <div style="font-size:0.9rem;">隊長：${leaderName}</div>
            <div style="font-size:0.9rem;">HP：${totalHp} | 戰力：${totalAttack}</div>
        `;
        
        teamDiv.onclick = () => {
            selectTeam(teamId);
            modal.remove();
            renderStageMap();
        };
        
        teamList.appendChild(teamDiv);
    });
    
    // 關閉按鈕
    document.getElementById('close-quick-switch').onclick = () => modal.remove();
}

// ===============================
// 戰鬥系統
// ===============================

/**
 * 開始關卡
 * @param {number} stageNum - 關卡編號
 */
function startStage(stageNum) {
    // 確保使用目前選中的隊伍
    gameState.team = gameState.battleTeams[gameState.selectedTeam] || [];
    
    // 檢查隊伍是否為空
    if (gameState.team.length === 0 || gameState.team.every(id => !id)) {
        alert('請先編輯隊伍！');
        showScreen('team');
        return;
    }
    
    // 檢查是否有隊長
    if (!gameState.team[0]) {
        alert('請設定隊長！');
        showScreen('team');
        return;
    }
    
    // 檢查星星
    const stars = getStars();
    const isFirstFree = !gameState.firstFreeUsed;
    
    if (!isFirstFree && stars < CONFIG.STAR_COST) {
        alert(`星星不足！需要 ${CONFIG.STAR_COST} 顆星星。`);
        return;
    }
    
    // 扣除星星
    if (!isFirstFree) {
        deductStars(CONFIG.STAR_COST);
    } else {
        gameState.firstFreeUsed = true;
        localStorage.setItem(STORAGE_KEYS.PUZZLE_FIRST_FREE, 'true');
    }
    
    // 初始化戰鬥
    gameState.currentStage = stageNum;
    gameState.battle.wave = 1;
    gameState.battle.turn = 1;
    gameState.battle.combo = 0;
    gameState.battle.turnMatchSummary = null;
    gameState.battle.allMatchedGroups = [];
    gameState.battle.battlePhase = 'PLAYER_INPUT';
    gameState.battle.selectedEnemyId = null;
    gameState.battle.isAttackResolving = false;
    gameState.battle.isEnemyTurnResolving = false;
    
    // 確保使用目前選中的隊伍
    gameState.team = gameState.battleTeams[gameState.selectedTeam] || [];
    
    // 初始化玩家隊伍
    const unlockedCards = getUnlockedBattleCards();
    gameState.battle.playerCards = gameState.team.map(cardId => {
        const card = unlockedCards.find(c => c.uniqueId === cardId);
        return {
            ...card,
            currentHp: card.hp,
            skillCd: 0
        };
    });
    
    // 計算隊伍共用HP
    gameState.battle.teamMaxHp = gameState.battle.playerCards.reduce((sum, card) => sum + card.hp, 0);
    gameState.battle.teamCurrentHp = gameState.battle.teamMaxHp;
    
    // 初始化敵人
    gameState.battle.enemies = generateEnemies(stageNum);
    
    // 初始化盤面
    gameState.battle.board = generateBoard();
    
    // 顯示戰鬥畫面
    showScreen('battle');
    renderBattle();
}

/**
 * 生成敵人
 * @param {number} stageNum - 關卡編號
 * @returns {Array} 敵人陣列
 */
function generateEnemies(stageNum) {
    const enemies = [];
    const enemyCount = stageNum % 5 === 0 ? 2 : 1; // 每5關有2個敵人
    const elements = ['fire', 'water', 'wood', 'light', 'dark'];
    
    for (let i = 0; i < enemyCount; i++) {
        // 根據關卡和敵人索引固定分配屬性
        const elementIndex = (stageNum + i) % elements.length;
        const element = elements[elementIndex];
        
        enemies.push({
            id: `enemy_${stageNum}_${i}`,
            name: `敵人 ${i + 1}`,
            hp: 5000 + (stageNum * 500),
            maxHp: 5000 + (stageNum * 500),
            attack: 200 + (stageNum * 20),
            attackCooldown: 3,
            currentAttackCooldown: 3,
            element: element
        });
    }
    
    return enemies;
}

/**
 * 生成初始盤面（確保不會自動消除）
 * @returns {Array} 5x6 盤面陣列
 */
function generateBoard() {
    const board = [];
    
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
            let orbType;
            let attempts = 0;
            
            // 嘗試生成不會造成消除的珠子
            do {
                orbType = CONFIG.ORB_TYPES[Math.floor(Math.random() * CONFIG.ORB_TYPES.length)];
                attempts++;
            } while (attempts < 10 && wouldCreateMatch(board, row, col, orbType));
            
            board[row][col] = orbType;
        }
    }
    
    return board;
}

/**
 * 檢查放置珠子是否會造成消除
 * @param {Array} board - 盤面
 * @param {number} row - 行
 * @param {number} col - 列
 * @param {string} orbType - 珠子類型
 * @returns {boolean}
 */
function wouldCreateMatch(board, row, col, orbType) {
    // 檢查水平
    let horizontalCount = 1;
    if (col >= 2 && board[row][col-1] === orbType && board[row][col-2] === orbType) {
        return true;
    }
    
    // 檢查垂直
    if (row >= 2 && board[row-1][col] === orbType && board[row-2][col] === orbType) {
        return true;
    }
    
    return false;
}

/**
 * 渲染戰鬥畫面
 */
function renderBattle() {
    // 更新戰鬥資訊
    document.getElementById('battle-stage').textContent = `第${Math.ceil(gameState.currentStage / 5)}-${(gameState.currentStage - 1) % 5 + 1}關`;
    document.getElementById('battle-wave').textContent = `Wave ${gameState.battle.wave}/${gameState.battle.maxWaves}`;
    document.getElementById('battle-turn').textContent = `回合 ${gameState.battle.turn}`;
    
    // 渲染敵人
    renderEnemies();
    
    // 渲染玩家隊伍
    renderPlayerTeam();
    
    // 渲染盤面
    renderBoard();
    
    // 渲染技能按鈕
    renderSkillButtons();
}

/**
 * 渲染敵人
 */
function renderEnemies() {
    const enemyArea = document.getElementById('enemy-area');
    enemyArea.innerHTML = '';
    
    gameState.battle.enemies.forEach((enemy, index) => {
        const enemyDiv = document.createElement('div');
        enemyDiv.className = 'enemy-card';
        
        const hpPercent = (enemy.hp / enemy.maxHp) * 100;
        const elementIcon = enemy.element ? CONFIG.ELEMENT_ICONS[enemy.element] : '';
        
        enemyDiv.innerHTML = `
            <div style="font-weight:bold;margin-bottom:5px;">${elementIcon} ${enemy.name}</div>
            <div class="enemy-hp-bar">
                <div class="enemy-hp-fill" style="width:${hpPercent}%;"></div>
            </div>
            <div style="font-size:0.8rem;margin-top:5px;">HP: ${enemy.hp}/${enemy.maxHp}</div>
            <div class="enemy-attack-cd">攻擊: ${enemy.currentAttackCd}</div>
        `;
        
        enemyArea.appendChild(enemyDiv);
    });
}

/**
 * 渲染玩家隊伍
 */
function renderPlayerTeam() {
    const playerTeamDiv = document.getElementById('player-team');
    playerTeamDiv.innerHTML = '';
    
    // 顯示隊伍共用HP
    const teamHpBar = document.createElement('div');
    teamHpBar.className = 'team-hp-bar';
    const teamHpPercent = (gameState.battle.teamCurrentHp / gameState.battle.teamMaxHp) * 100;
    teamHpBar.style.cssText = 'width:100%;height:8px;background:#333;border-radius:4px;margin-bottom:10px;overflow:hidden;position:relative;';
    
    const teamHpFill = document.createElement('div');
    teamHpFill.className = 'team-hp-fill';
    teamHpFill.style.cssText = `height:100%;background:linear-gradient(90deg, #44ff44, #88ff88);transition:width 0.3s ease;width:${teamHpPercent}%;`;
    
    const teamHpText = document.createElement('div');
    teamHpText.className = 'team-hp-text';
    teamHpText.textContent = `${gameState.battle.teamCurrentHp} / ${gameState.battle.teamMaxHp}`;
    teamHpText.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:0.7rem;font-weight:bold;text-shadow:1px 1px 2px rgba(0,0,0,0.8);';
    
    teamHpBar.appendChild(teamHpFill);
    teamHpBar.appendChild(teamHpText);
    playerTeamDiv.appendChild(teamHpBar);
    
    gameState.battle.playerCards.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'player-card';
        
        if (card.currentHp <= 0) {
            cardDiv.classList.add('dead');
        }
        
        // 使用統一的媒體創建函數
        const mediaContainer = createCardMedia(card, { context: 'battle' });
        mediaContainer.style.cssText = 'width:100%;height:60px;object-fit:cover;border-radius:4px;overflow:hidden;';
        
        // 使用統一的屬性函數
        const element = getCardElement(card);
        const elementBadge = document.createElement('div');
        elementBadge.className = 'card-element';
        elementBadge.textContent = CONFIG.ELEMENT_ICONS[element];
        elementBadge.style.cssText = 'position:absolute;top:2px;left:2px;background:rgba(0,0,0,0.7);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;';
        
        const skillCd = document.createElement('div');
        skillCd.className = 'player-skill-cd';
        skillCd.style.cssText = 'position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.7);color:#ffd700;padding:1px 4px;border-radius:3px;font-size:0.7rem;font-weight:bold;';
        skillCd.textContent = card.skillCd > 0 ? card.skillCd : '✓';
        
        cardDiv.appendChild(mediaContainer);
        cardDiv.appendChild(elementBadge);
        cardDiv.appendChild(skillCd);
        
        // 點擊事件綁定在外層容器，避免影片攔截
        cardDiv.onclick = () => useSkill(index);
        
        playerTeamDiv.appendChild(cardDiv);
    });
}

/**
 * 渲染盤面
 */
function renderBoard() {
    const boardDiv = document.getElementById('puzzle-board');
    boardDiv.innerHTML = '';
    
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
            const orbType = gameState.battle.board[row][col];
            const orb = document.createElement('div');
            orb.dataset.row = row;
            orb.dataset.col = col;
            
            // 如果是空位
            if (orbType === null || orbType === undefined) {
                orb.className = 'puzzle-orb empty-slot';
                orb.textContent = '';
            } else {
                // 取得珠子配置
                const orbConfig = ORB_CONFIG[orbType];
                if (!orbConfig) {
                    console.warn('Unknown orb type:', orbType);
                    orb.className = 'puzzle-orb';
                    orb.textContent = '';
                } else {
                    orb.className = `puzzle-orb orb-${orbType}`;
                    orb.textContent = orbConfig.icon || '';
                }
            }
            
            boardDiv.appendChild(orb);
        }
    }
}

/**
 * 渲染技能按鈕
 */
function renderSkillButtons() {
    const skillButtonsDiv = document.getElementById('skill-buttons');
    skillButtonsDiv.innerHTML = '';
    
    gameState.battle.playerCards.forEach((card, index) => {
        const btn = document.createElement('button');
        btn.className = 'skill-btn';
        
        if (card.skillCd === 0) {
            btn.classList.add('ready');
            btn.disabled = false;
        } else {
            btn.disabled = true;
        }
        
        btn.innerHTML = `${CONFIG.ELEMENT_ICONS[card.element]}${card.skillCd > 0 ? `<span class="skill-cd">${card.skillCd}</span>` : ''}`;
        
        btn.onclick = () => useSkill(index);
        
        skillButtonsDiv.appendChild(btn);
    });
}

/**
 * 使用技能
 * @param {number} cardIndex - 卡片索引
 */
function useSkill(cardIndex) {
    const card = gameState.battle.playerCards[cardIndex];
    
    if (card.skillCd > 0) {
        alert('技能冷卻中！');
        return;
    }
    
    // 使用統一的屬性函數
    const targetElement = getCardElement(card);
    const changes = [];
    
    // 技能：將隨機 3 顆珠子變為卡片屬性
    for (let i = 0; i < 3; i++) {
        const row = Math.floor(Math.random() * CONFIG.BOARD_ROWS);
        const col = Math.floor(Math.random() * CONFIG.BOARD_COLS);
        
        if (gameState.battle.board[row][col] !== targetElement) {
            gameState.battle.board[row][col] = targetElement;
            changes.push({ row, col });
        }
    }
    
    // 設定冷卻
    card.skillCd = card.skillCooldown;
    
    // 播放技能改盤面動畫
    if (changes.length > 0) {
        playSkillChangeAnimation(changes, targetElement);
    }
    
    // 重新渲染
    setTimeout(() => {
        renderBoard();
        renderPlayerTeam();
        renderSkillButtons();
    }, 300);
}

/**
 * 播放技能改盤面動畫
 * @param {Array} changes - 改變的珠子位置
 * @param {string} element - 目標屬性
 */
function playSkillChangeAnimation(changes, element) {
    changes.forEach((change, index) => {
        setTimeout(() => {
            const orb = document.querySelector(`.puzzle-orb[data-row="${change.row}"][data-col="${change.col}"]`);
            if (orb) {
                orb.style.transition = 'all 0.2s ease';
                orb.style.transform = 'scale(1.2)';
                orb.style.filter = 'brightness(1.5)';
                
                setTimeout(() => {
                    orb.style.transform = 'scale(1)';
                    orb.style.filter = 'brightness(1)';
                }, 200);
            }
        }, index * 50);
    });
}

// ===============================
// 轉珠系統
// ===============================

let dragState = {
    isDragging: false,
    heldOrb: null, // 玩家手上拿著的珠子
    emptyRow: -1, // 目前空位行
    emptyCol: -1, // 目前空位列
    lastPointerX: 0,
    lastPointerY: 0,
    timerInterval: null,
    pointerId: null,
    ghostOrb: null,
    startTime: 0
};

/**
 * 初始化轉珠事件
 */
function initPuzzleEvents() {
    const board = document.getElementById('puzzle-board');
    
    // 使用 Pointer Events 統一處理滑鼠和觸控
    board.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    
    // 設定 touch-action 避免手機滑動整個頁面
    board.style.touchAction = 'none';
}

/**
 * 處理 Pointer Down
 */
function handlePointerDown(e) {
    e.preventDefault();
    
    // 檢查戰鬥階段，只有PLAYER_INPUT階段才能拖珠
    if (gameState.battle.battlePhase !== 'PLAYER_INPUT') return;
    if (gameState.battle.isResolving) return;
    if (gameState.battle.isAttackResolving || gameState.battle.isEnemyTurnResolving) return;
    
    const target = e.target.closest('.puzzle-orb');
    if (!target) return;
    
    const row = parseInt(target.dataset.row);
    const col = parseInt(target.dataset.col);
    
    // 抓起珠子
    dragState.isDragging = true;
    dragState.heldOrb = gameState.battle.board[row][col];
    dragState.emptyRow = row;
    dragState.emptyCol = col;
    dragState.lastPointerX = e.clientX;
    dragState.lastPointerY = e.clientY;
    dragState.pointerId = e.pointerId;
    dragState.startTime = Date.now();
    
    // 盤面該位置變成空位
    gameState.battle.board[row][col] = null;
    
    // 使用 setPointerCapture 確保拖動不會斷掉
    target.setPointerCapture(e.pointerId);
    
    // 啟動計時器
    gameState.battle.timerStarted = true;
    gameState.battle.timerRemaining = CONFIG.DRAG_TIME;
    startTimer();
    
    // 更新該格顯示為空位
    updateOrbCell(row, col);
    
    // 降低其他區塊亮度
    const battleScreen = document.getElementById('battle-screen');
    if (battleScreen) {
        battleScreen.classList.add('dragging');
    }
    
    // 創建 ghost orb
    createGhostOrb(target, e.clientX, e.clientY);
    
    // 手機震動
    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
}

/**
 * 創建 Ghost Orb
 */
function createGhostOrb(originalOrb, x, y) {
    const ghost = originalOrb.cloneNode(true);
    ghost.classList.add('dragging-orb-ghost');
    ghost.classList.remove('orb-dragging');
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
    ghost.style.width = '60px';
    ghost.style.height = '60px';
    ghost.style.transform = 'translate(-50%, -50%) scale(1.15)';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.position = 'fixed';
    document.body.appendChild(ghost);
    dragState.ghostOrb = ghost;
}

/**
 * 更新 Ghost Orb 位置
 */
function updateGhostOrb(x, y) {
    if (dragState.ghostOrb) {
        dragState.ghostOrb.style.left = x + 'px';
        dragState.ghostOrb.style.top = y + 'px';
    }
}

/**
 * 移除 Ghost Orb
 */
function removeGhostOrb() {
    if (dragState.ghostOrb) {
        dragState.ghostOrb.remove();
        dragState.ghostOrb = null;
    }
}

/**
 * 處理 Pointer Move
 */
function handlePointerMove(e) {
    if (!dragState.isDragging || e.pointerId !== dragState.pointerId) return;
    
    e.preventDefault();
    
    // 更新 ghost orb 位置
    updateGhostOrb(e.clientX, e.clientY);
    
    // 路徑插值：檢查移動距離，避免跳過中間格
    const dx = e.clientX - dragState.lastPointerX;
    const dy = e.clientY - dragState.lastPointerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 如果移動距離太大，進行插值
    if (distance > 30) {
        const steps = Math.ceil(distance / 30);
        for (let i = 1; i <= steps; i++) {
            const interpX = dragState.lastPointerX + (dx * i / steps);
            const interpY = dragState.lastPointerY + (dy * i / steps);
            processDragPosition(interpX, interpY);
        }
    } else {
        processDragPosition(e.clientX, e.clientY);
    }
    
    dragState.lastPointerX = e.clientX;
    dragState.lastPointerY = e.clientY;
}

/**
 * 處理拖動位置
 */
function processDragPosition(x, y) {
    // 使用 elementFromPoint 找到下方的格子
    const target = document.elementFromPoint(x, y);
    const orb = target ? target.closest('.puzzle-orb') : null;
    
    if (!orb) return;
    
    const targetRow = parseInt(orb.dataset.row);
    const targetCol = parseInt(orb.dataset.col);
    
    // 檢查是否為空位的相鄰位置（四方向）
    const isAdjacent = (Math.abs(targetRow - dragState.emptyRow) + Math.abs(targetCol - dragState.emptyCol)) === 1;
    
    if (isAdjacent && (targetRow !== dragState.emptyRow || targetCol !== dragState.emptyCol)) {
        // 將目標格的珠子移到空位
        const targetOrbType = gameState.battle.board[targetRow][targetCol];
        gameState.battle.board[dragState.emptyRow][dragState.emptyCol] = targetOrbType;
        gameState.battle.board[targetRow][targetCol] = null;
        
        // 更新空位位置
        const oldEmptyRow = dragState.emptyRow;
        const oldEmptyCol = dragState.emptyCol;
        dragState.emptyRow = targetRow;
        dragState.emptyCol = targetCol;
        
        // 添加滑動動畫
        const movingOrb = document.querySelector(`.puzzle-orb[data-row="${oldEmptyRow}"][data-col="${oldEmptyCol}"]`);
        if (movingOrb) {
            movingOrb.style.transition = 'transform 0.1s ease-out';
            movingOrb.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                movingOrb.style.transform = 'scale(1)';
                movingOrb.style.transition = '';
            }, 100);
        }
        
        // 更新視覺
        updateOrbCell(oldEmptyRow, oldEmptyCol);
        updateOrbCell(targetRow, targetCol);
        
        // 播放交換音效
        playSwapSound();
        
        // 手機震動
        if ('vibrate' in navigator) {
            navigator.vibrate(5);
        }
    }
}

/**
 * 處理 Pointer Up
 */
function handlePointerUp(e) {
    if (!dragState.isDragging || e.pointerId !== dragState.pointerId) return;
    
    dragState.isDragging = false;
    
    // 將手上的珠子放回空位
    gameState.battle.board[dragState.emptyRow][dragState.emptyCol] = dragState.heldOrb;
    
    // 更新空位顯示
    updateOrbCell(dragState.emptyRow, dragState.emptyCol);
    
    // 釋放 pointer capture
    const emptyOrb = document.querySelector(`.puzzle-orb[data-row="${dragState.emptyRow}"][data-col="${dragState.emptyCol}"]`);
    if (emptyOrb) {
        emptyOrb.releasePointerCapture(dragState.pointerId);
    }
    
    // 移除 ghost orb
    removeGhostOrb();
    
    // 恢復其他區塊亮度
    const battleScreen = document.getElementById('battle-screen');
    if (battleScreen) {
        battleScreen.classList.remove('dragging');
    }
    
    // 停止計時器
    stopTimer();
    
    // 清空 dragState
    dragState.heldOrb = null;
    dragState.emptyRow = -1;
    dragState.emptyCol = -1;
    
    // 消除前停頓
    setTimeout(() => {
        resolveBoard();
    }, 120);
    
    // 手機震動
    if ('vibrate' in navigator) {
        navigator.vibrate(15);
    }
}

/**
 * 交換珠子
 * @param {number} row1 - 第一顆珠子行
 * @param {number} col1 - 第一顆珠子列
 * @param {number} row2 - 第二顆珠子行
 * @param {number} col2 - 第二顆珠子列
 */
function swapOrbs(row1, col1, row2, col2) {
    // 交換資料
    const temp = gameState.battle.board[row1][col1];
    gameState.battle.board[row1][col1] = gameState.battle.board[row2][col2];
    gameState.battle.board[row2][col2] = temp;
    
    // 只更新兩顆珠子的視覺狀態（不重建DOM）
    updateOrbCell(row1, col1);
    updateOrbCell(row2, col2);
}

/**
 * 更新單顆珠子的視覺狀態（不重建DOM）
 * @param {number} row - 行
 * @param {number} col - 列
 */
function updateOrbCell(row, col) {
    const orb = document.querySelector(`.puzzle-orb[data-row="${row}"][data-col="${col}"]`);
    if (!orb) return;
    
    const orbType = gameState.battle.board[row][col];
    
    // 如果是空位
    if (orbType === null || orbType === undefined) {
        orb.className = 'puzzle-orb empty-slot';
        orb.textContent = '';
        orb.style.opacity = '1';
        return;
    }
    
    // 取得珠子配置
    const orbConfig = ORB_CONFIG[orbType];
    if (!orbConfig) {
        console.warn('Unknown orb type:', orbType);
        orb.className = 'puzzle-orb';
        orb.textContent = '';
        return;
    }
    
    // 更新 class
    orb.className = `puzzle-orb orb-${orbType}`;
    
    // 更新內容
    orb.textContent = orbConfig.icon || '';
    
    // 恢復正常透明度
    orb.style.opacity = '1';
}

/**
 * 播放交換音效
 */
function playSwapSound() {
    // 簡單的音效播放（可以替換為實際音效檔案）
    // const audio = new Audio('sound/swap.mp3');
    // audio.volume = 0.3;
    // audio.play().catch(() => {});
}

/**
 * 播放 Combo 音效
 * @param {number} combo - Combo 數量
 */
function playComboSound(combo) {
    // 根據 Combo 數量調整音調
    const playbackRate = Math.min(1.0 + (combo * 0.05), 1.5);
    
    // const audio = new Audio('sound/combo.mp3');
    // audio.volume = 0.4;
    // audio.playbackRate = playbackRate;
    // audio.play().catch(() => {});
}

/**
 * 更新單顆珠子的視覺狀態
 * @param {number} row - 行
 * @param {number} col - 列
 */
function updateOrbVisual(row, col) {
    const board = document.getElementById('puzzle-board');
    const index = row * CONFIG.BOARD_COLS + col;
    const orb = board.children[index];
    
    if (orb) {
        orb.className = `puzzle-orb ${gameState.battle.board[row][col]}`;
        orb.textContent = CONFIG.ORB_ICONS[gameState.battle.board[row][col]];
    }
}

/**
 * 啟動計時器
 */
function startTimer() {
    const timerDisplay = document.getElementById('puzzle-timer');
    const progressBar = document.getElementById('timer-progress-bar');
    const progressFill = document.getElementById('timer-progress-fill');
    
    // 創建進度條（如果不存在）
    if (!progressBar) {
        const bar = document.createElement('div');
        bar.className = 'timer-progress-bar';
        bar.id = 'timer-progress-bar';
        
        const fill = document.createElement('div');
        fill.className = 'timer-progress-fill high';
        fill.id = 'timer-progress-fill';
        fill.style.width = '100%';
        
        bar.appendChild(fill);
        timerDisplay.parentElement.appendChild(bar);
    }
    
    dragState.timerInterval = setInterval(() => {
        gameState.battle.timerRemaining -= 0.1;
        
        if (gameState.battle.timerRemaining <= 0) {
            gameState.battle.timerRemaining = 0;
            stopTimer();
            handlePointerUp({ pointerId: dragState.pointerId });
        }
        
        // 更新文字顯示
        timerDisplay.textContent = `${gameState.battle.timerRemaining.toFixed(1)}秒`;
        
        // 更新進度條
        const percent = (gameState.battle.timerRemaining / CONFIG.DRAG_TIME) * 100;
        const fill = document.getElementById('timer-progress-fill');
        if (fill) {
            fill.style.width = `${percent}%`;
            
            // 根據時間改變顏色
            fill.className = 'timer-progress-fill';
            if (gameState.battle.timerRemaining > 3) {
                fill.classList.add('high');
            } else if (gameState.battle.timerRemaining > 1) {
                fill.classList.add('medium');
            } else {
                fill.classList.add('low');
            }
        }
    }, 100);
}

/**
 * 停止計時器
 */
function stopTimer() {
    if (dragState.timerInterval) {
        clearInterval(dragState.timerInterval);
        dragState.timerInterval = null;
    }
}

/**
 * 解析盤面（消除判定）
 */
function resolveBoard() {
    gameState.battle.isResolving = true;
    gameState.battle.combo = 0;
    
    resolveBoardRecursive();
}

/**
 * 遞迴解析盤面
 */
function resolveBoardRecursive() {
    const matches = findMatches();
    
    if (matches.length === 0) {
        // 沒有消除，結束
        gameState.battle.isResolving = false;
        processBattleResults();
        return;
    }
    
    // 累積所有消除群組
    matches.forEach(match => {
        gameState.battle.allMatchedGroups.push({
            type: match.type,
            count: match.cells.length
        });
    });
    
    // 增加Combo
    gameState.battle.combo++;
    showComboDisplay(gameState.battle.combo);
    playComboSound(gameState.battle.combo);
    
    // 手機震動
    if ('vibrate' in navigator) {
        if (gameState.battle.combo >= 5) {
            navigator.vibrate([20, 30, 20]);
        } else {
            navigator.vibrate(20);
        }
    }
    
    // 標記消除的珠子並添加動畫
    matches.forEach(match => {
        match.cells.forEach(cell => {
            const orb = document.querySelector(`.puzzle-orb[data-row="${cell.row}"][data-col="${cell.col}"]`);
            if (orb) {
                // 根據屬性添加不同的消除動畫
                orb.classList.add('orb-clearing', match.type);
            }
            gameState.battle.board[cell.row][cell.col] = null;
        });
    });
    
    // 延遲後天降
    setTimeout(() => {
        dropOrbs();
        fillBoard();
        renderBoard();
        
        // 檢查是否有天降
        const newMatches = findMatches();
        if (newMatches.length > 0) {
            showSkyfallDisplay();
        }
        
        // 繼續檢查消除
        setTimeout(() => {
            resolveBoardRecursive();
        }, 300);
    }, 300);
}

/**
 * 顯示 Combo
 * @param {number} combo - Combo 數量
 */
function showComboDisplay(combo) {
    // 移除舊的 Combo 顯示
    const oldCombo = document.querySelector('.combo-display');
    if (oldCombo) oldCombo.remove();
    
    const comboDiv = document.createElement('div');
    comboDiv.className = 'combo-display';
    comboDiv.textContent = `${combo} COMBO`;
    
    // 根據 Combo 數量設定顏色
    if (combo >= 10) {
        comboDiv.classList.add('combo-10-plus');
    } else if (combo >= 7) {
        comboDiv.classList.add('combo-7-9');
    } else if (combo >= 4) {
        comboDiv.classList.add('combo-4-6');
    } else {
        comboDiv.classList.add('combo-1-3');
    }
    
    document.body.appendChild(comboDiv);
    
    // 動畫結束後移除
    setTimeout(() => {
        comboDiv.remove();
    }, 500);
}

/**
 * 顯示天降提示
 */
function showSkyfallDisplay() {
    const skyfallDiv = document.createElement('div');
    skyfallDiv.className = 'skyfall-display';
    skyfallDiv.textContent = '✨ SKYFALL';
    document.body.appendChild(skyfallDiv);
    
    setTimeout(() => {
        skyfallDiv.remove();
    }, 500);
}

/**
 * 尋找消除
 * @returns {Array} 消除陣列
 */
function findMatches() {
    const matches = [];
    const visited = new Set();
    
    // 找出所有橫向3顆以上的連線
    const horizontalMatches = [];
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        for (let col = 0; col < CONFIG.BOARD_COLS - CONFIG.MIN_MATCH + 1; col++) {
            const type = gameState.battle.board[row][col];
            if (!type) continue;
            
            let matchLength = 1;
            while (col + matchLength < CONFIG.BOARD_COLS && gameState.battle.board[row][col + matchLength] === type) {
                matchLength++;
            }
            
            if (matchLength >= CONFIG.MIN_MATCH) {
                const cells = [];
                for (let i = 0; i < matchLength; i++) {
                    cells.push({ row, col: col + i });
                }
                horizontalMatches.push({ type, cells });
                col += matchLength - 1;
            }
        }
    }
    
    // 找出所有直向3顆以上的連線
    const verticalMatches = [];
    for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
        for (let row = 0; row < CONFIG.BOARD_ROWS - CONFIG.MIN_MATCH + 1; row++) {
            const type = gameState.battle.board[row][col];
            if (!type) continue;
            
            let matchLength = 1;
            while (row + matchLength < CONFIG.BOARD_ROWS && gameState.battle.board[row + matchLength][col] === type) {
                matchLength++;
            }
            
            if (matchLength >= CONFIG.MIN_MATCH) {
                const cells = [];
                for (let i = 0; i < matchLength; i++) {
                    cells.push({ row: row + i, col });
                }
                verticalMatches.push({ type, cells });
                row += matchLength - 1;
            }
        }
    }
    
    // 合併橫向和直向的連線，找出相連的同色群組
    const allCells = new Map(); // key: "row,col", value: { row, col, type }
    
    // 收集所有符合條件的格子
    [...horizontalMatches, ...verticalMatches].forEach(match => {
        match.cells.forEach(cell => {
            const key = `${cell.row},${cell.col}`;
            if (!allCells.has(key)) {
                allCells.set(key, { ...cell, type: match.type });
            }
        });
    });
    
    // 使用 BFS 找出相連的同色群組
    allCells.forEach((startCell, startKey) => {
        if (visited.has(startKey)) return;
        
        const type = startCell.type;
        const group = [];
        const queue = [startCell];
        const groupVisited = new Set([startKey]);
        
        while (queue.length > 0) {
            const current = queue.shift();
            group.push(current);
            visited.add(`${current.row},${current.col}`);
            
            // 檢查四個相鄰方向
            const directions = [
                { dr: -1, dc: 0 }, // 上
                { dr: 1, dc: 0 },  // 下
                { dr: 0, dc: -1 }, // 左
                { dr: 0, dc: 1 }   // 右
            ];
            
            directions.forEach(({ dr, dc }) => {
                const newRow = current.row + dr;
                const newCol = current.col + dc;
                const newKey = `${newRow},${newCol}`;
                
                if (allCells.has(newKey) && !groupVisited.has(newKey)) {
                    const neighbor = allCells.get(newKey);
                    if (neighbor.type === type) {
                        groupVisited.add(newKey);
                        queue.push(neighbor);
                    }
                }
            });
        }
        
        // 檢查群組是否至少有一條橫向或直向的3顆以上連線
        if (group.length >= CONFIG.MIN_MATCH && hasValidLine(group)) {
            matches.push({ type, cells: group });
        }
    });
    
    return matches;
}

/**
 * 檢查群組是否至少有一條橫向或直向的3顆以上連線
 * @param {Array} group - 群組格子陣列
 * @returns {boolean} 是否有有效連線
 */
function hasValidLine(group) {
    // 檢查橫向
    const rows = {};
    group.forEach(cell => {
        if (!rows[cell.row]) rows[cell.row] = [];
        rows[cell.row].push(cell.col);
    });
    
    for (const row in rows) {
        const cols = rows[row].sort((a, b) => a - b);
        let consecutive = 1;
        for (let i = 1; i < cols.length; i++) {
            if (cols[i] === cols[i - 1] + 1) {
                consecutive++;
                if (consecutive >= CONFIG.MIN_MATCH) return true;
            } else {
                consecutive = 1;
            }
        }
    }
    
    // 檢查直向
    const cols = {};
    group.forEach(cell => {
        if (!cols[cell.col]) cols[cell.col] = [];
        cols[cell.col].push(cell.row);
    });
    
    for (const col in cols) {
        const rows = cols[col].sort((a, b) => a - b);
        let consecutive = 1;
        for (let i = 1; i < rows.length; i++) {
            if (rows[i] === rows[i - 1] + 1) {
                consecutive++;
                if (consecutive >= CONFIG.MIN_MATCH) return true;
            } else {
                consecutive = 1;
            }
        }
    }
    
    return false;
}

/**
 * 珠子下降
 */
function dropOrbs() {
    for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
        let emptyRow = CONFIG.BOARD_ROWS - 1;
        
        for (let row = CONFIG.BOARD_ROWS - 1; row >= 0; row--) {
            if (gameState.battle.board[row][col] !== null) {
                if (row !== emptyRow) {
                    gameState.battle.board[emptyRow][col] = gameState.battle.board[row][col];
                    gameState.battle.board[row][col] = null;
                }
                emptyRow--;
            }
        }
    }
}

/**
 * 填充空位
 */
function fillBoard() {
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
            if (gameState.battle.board[row][col] === null) {
                gameState.battle.board[row][col] = CONFIG.ORB_TYPES[Math.floor(Math.random() * CONFIG.ORB_TYPES.length)];
            }
        }
    }
}

/**
 * 渲染盤面（帶動畫）
 */
function renderBoard() {
    const boardDiv = document.getElementById('puzzle-board');
    boardDiv.innerHTML = '';
    
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
            const orb = document.createElement('div');
            orb.className = `puzzle-orb ${gameState.battle.board[row][col]}`;
            orb.dataset.row = row;
            orb.dataset.col = col;
            orb.textContent = CONFIG.ORB_ICONS[gameState.battle.board[row][col]];
            
            // 添加掉落動畫（如果是新珠子）
            if (gameState.battle.isResolving) {
                orb.classList.add('orb-dropping');
            }
            
            boardDiv.appendChild(orb);
        }
    }
}

/**
 * 更新Combo顯示
 */
function updateComboDisplay() {
    const comboDisplay = document.getElementById('combo-display');
    comboDisplay.textContent = `${gameState.battle.combo} COMBO`;
    comboDisplay.classList.add('active');
    
    setTimeout(() => {
        comboDisplay.classList.remove('active');
    }, 1000);
}

/**
 * 處理戰鬥結果
 */
function processBattleResults() {
    // 建立回合消除摘要
    gameState.battle.turnMatchSummary = buildTurnMatchSummary(gameState.battle.allMatchedGroups);
    
    // 顯示屬性結果
    showElementResult();
    
    // 延遲後進入玩家攻擊階段
    setTimeout(() => {
        executePlayerAttackPhase();
    }, 400);
}

/**
 * 執行玩家攻擊階段
 */
async function executePlayerAttackPhase() {
    if (gameState.battle.isAttackResolving) return;
    gameState.battle.isAttackResolving = true;
    gameState.battle.battlePhase = 'PLAYER_ATTACK';
    
    const summary = gameState.battle.turnMatchSummary;
    if (!summary) {
        gameState.battle.isAttackResolving = false;
        return;
    }
    
    const aliveEnemies = gameState.battle.enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) {
        // 所有敵人死亡，進入Wave清理
        await cleanupDefeatedEnemies();
        await checkBattleResult();
        gameState.battle.isAttackResolving = false;
        return;
    }
    
    // 依序執行玩家卡片攻擊
    for (let i = 0; i < gameState.battle.playerCards.length; i++) {
        const card = gameState.battle.playerCards[i];
        if (card.currentHp <= 0) continue;
        
        const cardElement = getCardElement(card);
        const matchData = summary[cardElement];
        
        // 如果該屬性沒有消除，跳過
        if (!matchData || matchData.groups === 0) continue;
        
        // 執行卡片攻擊
        await performCardAttack(card, matchData, aliveEnemies);
        
        // 檢查是否所有敵人死亡
        const remainingEnemies = gameState.battle.enemies.filter(e => e.hp > 0);
        if (remainingEnemies.length === 0) {
            break;
        }
    }
    
    // 清理死亡敵人
    await cleanupDefeatedEnemies();
    
    // 檢查戰鬥結果
    await checkBattleResult();
    
    gameState.battle.isAttackResolving = false;
}

/**
 * 執行卡片攻擊
 * @param {object} card - 卡片物件
 * @param {object} matchData - 消除資料
 * @param {Array} aliveEnemies - 存活敵人陣列
 */
async function performCardAttack(card, matchData, aliveEnemies) {
    const cardElement = getCardElement(card);
    const comboMultiplier = Math.min(1 + (gameState.battle.combo * 0.25), 3);
    
    // 計算珠子數量倍率
    function getOrbMultiplier(count) {
        if (count === 3) return 1.0;
        if (count === 4) return 1.2;
        if (count === 5) return 1.5;
        if (count === 6) return 1.7;
        return 1.8 + (count - 7) * 0.1;
    }
    
    const orbMultiplier = getOrbMultiplier(matchData.maxGroupSize);
    const baseDamage = card.attack * matchData.totalOrbs;
    const isAOE = matchData.hasAOE;
    
    if (isAOE) {
        // 全體攻擊
        await performAOEAttack(card, cardElement, baseDamage, comboMultiplier, orbMultiplier, aliveEnemies);
    } else {
        // 單體攻擊
        await performSingleTargetAttack(card, cardElement, baseDamage, comboMultiplier, orbMultiplier, aliveEnemies);
    }
}

/**
 * 執行單體攻擊
 * @param {object} card - 卡片物件
 * @param {string} cardElement - 卡片屬性
 * @param {number} baseDamage - 基礎傷害
 * @param {number} comboMultiplier - Combo倍率
 * @param {number} orbMultiplier - 珠子倍率
 * @param {Array} aliveEnemies - 存活敵人陣列
 */
async function performSingleTargetAttack(card, cardElement, baseDamage, comboMultiplier, orbMultiplier, aliveEnemies) {
    // 選擇目標敵人
    let target = aliveEnemies[0];
    if (gameState.battle.selectedEnemyId) {
        const selectedEnemy = aliveEnemies.find(e => e.id === gameState.battle.selectedEnemyId);
        if (selectedEnemy) {
            target = selectedEnemy;
        }
    }
    
    const oldHp = target.hp;
    const elementMultiplier = getElementMultiplier(cardElement, target.element);
    const finalDamage = Math.floor(baseDamage * comboMultiplier * orbMultiplier * elementMultiplier);
    
    target.hp -= finalDamage;
    if (target.hp < 0) target.hp = 0;
    
    // 播放攻擊動畫
    playCardAttackAnimation(gameState.battle.playerCards.indexOf(card));
    
    // 等待動畫
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 顯示傷害數字
    let damageType = 'normal';
    if (elementMultiplier > 1) damageType = 'critical';
    else if (elementMultiplier < 1) damageType = 'resist';
    
    showDamageNumber(target, finalDamage, damageType);
    playEnemyHitAnimation(target);
    renderEnemies();
    
    // 檢查是否擊殺
    if (target.hp === 0 && oldHp > 0) {
        await showDefeatedAnimation(target);
    }
}

/**
 * 執行全體攻擊
 * @param {object} card - 卡片物件
 * @param {string} cardElement - 卡片屬性
 * @param {number} baseDamage - 基礎傷害
 * @param {number} comboMultiplier - Combo倍率
 * @param {number} orbMultiplier - 珠子倍率
 * @param {Array} aliveEnemies - 存活敵人陣列
 */
async function performAOEAttack(card, cardElement, baseDamage, comboMultiplier, orbMultiplier, aliveEnemies) {
    // 播放攻擊動畫
    playCardAttackAnimation(gameState.battle.playerCards.indexOf(card));
    
    // 等待動畫
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 對所有敵人攻擊
    for (let i = 0; i < aliveEnemies.length; i++) {
        const target = aliveEnemies[i];
        const oldHp = target.hp;
        
        const elementMultiplier = getElementMultiplier(cardElement, target.element);
        const finalDamage = Math.floor(baseDamage * comboMultiplier * orbMultiplier * elementMultiplier);
        
        target.hp -= finalDamage;
        if (target.hp < 0) target.hp = 0;
        
        // 顯示傷害數字
        let damageType = 'normal';
        if (elementMultiplier > 1) damageType = 'critical';
        else if (elementMultiplier < 1) damageType = 'resist';
        
        showDamageNumber(target, finalDamage, damageType);
        playEnemyHitAnimation(target);
        
        // 檢查是否擊殺
        if (target.hp === 0 && oldHp > 0) {
            await showDefeatedAnimation(target);
        }
        
        // 延遲避免動畫重疊
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    renderEnemies();
}

/**
 * 清理死亡敵人
 */
async function cleanupDefeatedEnemies() {
    const defeatedEnemies = gameState.battle.enemies.filter(e => e.hp <= 0);
    
    for (const enemy of defeatedEnemies) {
        await showDefeatedAnimation(enemy);
    }
    
    // 移除死亡敵人
    gameState.battle.enemies = gameState.battle.enemies.filter(e => e.hp > 0);
    
    // 如果選中的敵人死亡，清除選擇
    if (gameState.battle.selectedEnemyId) {
        const selectedExists = gameState.battle.enemies.find(e => e.id === gameState.battle.selectedEnemyId);
        if (!selectedExists) {
            gameState.battle.selectedEnemyId = null;
        }
    }
    
    renderEnemies();
}

/**
 * 執行敵人回合
 */
async function executeEnemyTurn() {
    if (gameState.battle.isEnemyTurnResolving) return;
    gameState.battle.isEnemyTurnResolving = true;
    gameState.battle.battlePhase = 'ENEMY_TURN';
    
    const aliveEnemies = gameState.battle.enemies.filter(e => e.hp > 0);
    
    // 依序執行敵人攻擊
    for (const enemy of aliveEnemies) {
        // 更新CD
        enemy.currentAttackCooldown--;
        
        // 如果CD歸零，執行攻擊
        if (enemy.currentAttackCooldown <= 0) {
            await performEnemyAttack(enemy);
            
            // 檢查玩家是否死亡
            if (gameState.battle.teamCurrentHp <= 0) {
                gameState.battle.battlePhase = 'DEFEAT';
                gameState.battle.isEnemyTurnResolving = false;
                await showDefeatScreen();
                return;
            }
            
            // 重置CD
            enemy.currentAttackCooldown = enemy.attackCooldown;
        }
    }
    
    // 敵人回合結束
    gameState.battle.isEnemyTurnResolving = false;
    gameState.battle.battlePhase = 'TURN_END';
    
    // 減少技能CD
    gameState.battle.playerCards.forEach(card => {
        if (card.skillCd > 0) {
            card.skillCd--;
        }
    });
    
    // 進入下一回合
    await startNextTurn();
}

/**
 * 執行敵人攻擊
 * @param {object} enemy - 敵人物件
 */
async function performEnemyAttack(enemy) {
    const damage = enemy.attack;
    
    // 扣除玩家隊伍HP
    const oldHp = gameState.battle.teamCurrentHp;
    gameState.battle.teamCurrentHp -= damage;
    if (gameState.battle.teamCurrentHp < 0) gameState.battle.teamCurrentHp = 0;
    
    // 播放敵人攻擊動畫
    playEnemyAttackAnimation(enemy);
    
    // 等待動畫
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 顯示傷害數字
    showTeamDamageNumber(damage);
    
    // 更新玩家HP顯示
    renderPlayerTeam();
}

/**
 * 開始下一回合
 */
async function startNextTurn() {
    gameState.battle.turn++;
    gameState.battle.combo = 0;
    gameState.battle.turnMatchSummary = null;
    gameState.battle.allMatchedGroups = [];
    gameState.battle.battlePhase = 'PLAYER_INPUT';
    
    // 重新渲染
    renderBattle();
    renderSkillButtons();
}

/**
 * 顯示快速戰鬥結果
 */
function showQuickBattleResult() {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'battle-result-quick';
    
    const comboMultiplier = Math.min(1 + (gameState.battle.combo * 0.25), 3);
    const summary = gameState.battle.turnMatchSummary;
    
    let elementInfo = '';
    if (summary) {
        const elements = ['fire', 'water', 'wood', 'light', 'dark'];
        elements.forEach(element => {
            const data = summary[element];
            if (data && data.groups > 0) {
                const icon = CONFIG.ELEMENT_ICONS[element];
                const aoeText = data.hasAOE ? ' AOE' : '';
                elementInfo += `<p>${icon} ×${data.groups}${aoeText}</p>`;
            }
        });
    }
    
    resultDiv.innerHTML = `
        <h3>轉珠結果</h3>
        <p>${gameState.battle.combo} COMBO</p>
        <p>倍率 ×${comboMultiplier.toFixed(2)}</p>
        ${elementInfo}
    `;
    
    document.body.appendChild(resultDiv);
    
    setTimeout(() => {
        resultDiv.remove();
    }, 800);
}

/**
 * 顯示屬性結果
 */
function showElementResult() {
    // 統計消除的珠子類型
    const orbCounts = {};
    for (let row = 0; row < CONFIG.BOARD_ROWS; row++) {
        for (let col = 0; col < CONFIG.BOARD_COLS; col++) {
            const type = gameState.battle.board[row][col];
            if (type && type !== 'heart') {
                orbCounts[type] = (orbCounts[type] || 0) + 1;
            }
        }
    }
    
    // 如果沒有消除，不顯示
    if (Object.keys(orbCounts).length === 0) return;
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'element-result';
    
    Object.entries(orbCounts).forEach(([type, count]) => {
        const item = document.createElement('div');
        item.className = 'element-result-item';
        item.textContent = `${CONFIG.ELEMENT_ICONS[type]} ×${count}`;
        resultDiv.appendChild(item);
    });
    
    document.body.appendChild(resultDiv);
    
    setTimeout(() => {
        resultDiv.remove();
    }, 400);
}

/**
 * 計算傷害（舊函數，已由新系統取代）
 * 此函數現在只處理心珠回血
 */
function calculateDamage() {
    const summary = gameState.battle.turnMatchSummary;
    if (!summary) return;
    
    // 計算Combo加成
    const comboMultiplier = Math.min(1 + (gameState.battle.combo * 0.25), 3);
    
    // 計算珠子數量倍率
    function getOrbMultiplier(count) {
        if (count === 3) return 1.0;
        if (count === 4) return 1.2;
        if (count === 5) return 1.5;
        if (count === 6) return 1.7;
        return 1.8 + (count - 7) * 0.1;
    }
    
    // 心珠回血
    if (summary.heart && summary.heart.groups > 0) {
        const orbMultiplier = getOrbMultiplier(summary.heart.maxGroupSize);
        const healAmount = Math.floor(summary.heart.totalOrbs * 50 * comboMultiplier * orbMultiplier);
        
        const oldHp = gameState.battle.teamCurrentHp;
        gameState.battle.teamCurrentHp = Math.min(gameState.battle.teamMaxHp, gameState.battle.teamCurrentHp + healAmount);
        const actualHeal = gameState.battle.teamCurrentHp - oldHp;
        
        if (actualHeal > 0) {
            showTeamHealNumber(actualHeal);
            renderPlayerTeam();
        }
    }
}

/**
 * 播放卡片攻擊動畫
 * @param {number} cardIndex - 卡片索引
 */
function playCardAttackAnimation(cardIndex) {
    const cardElements = document.querySelectorAll('.player-card');
    if (cardElements[cardIndex]) {
        cardElements[cardIndex].classList.add('attacking');
        setTimeout(() => {
            cardElements[cardIndex].classList.remove('attacking');
        }, 300);
    }
}

/**
 * 播放敵人受擊動畫
 * @param {object} enemy - 敵人物件
 */
function playEnemyHitAnimation(enemy) {
    const enemyElements = document.querySelectorAll('.enemy-card');
    const enemyIndex = gameState.battle.enemies.indexOf(enemy);
    if (enemyElements[enemyIndex]) {
        enemyElements[enemyIndex].classList.add('hit');
        setTimeout(() => {
            enemyElements[enemyIndex].classList.remove('hit');
        }, 200);
    }
}

/**
 * 播放敵人攻擊動畫
 * @param {object} enemy - 敵人物件
 */
function playEnemyAttackAnimation(enemy) {
    const enemyElements = document.querySelectorAll('.enemy-card');
    const enemyIndex = gameState.battle.enemies.indexOf(enemy);
    if (enemyElements[enemyIndex]) {
        enemyElements[enemyIndex].classList.add('attacking');
        setTimeout(() => {
            enemyElements[enemyIndex].classList.remove('attacking');
        }, 300);
    }
}

/**
 * 顯示隊伍傷害數字
 * @param {number} damage - 傷害數值
 */
function showTeamDamageNumber(damage) {
    const playerTeamDiv = document.getElementById('player-team');
    if (!playerTeamDiv) return;
    
    const damageDiv = document.createElement('div');
    damageDiv.className = 'damage-number team-damage';
    damageDiv.textContent = `-${damage}`;
    damageDiv.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#ff4444;font-size:2rem;font-weight:bold;text-shadow:2px 2px 4px rgba(0,0,0,0.8);z-index:100;animation:floatUp 1s ease-out forwards;';
    
    playerTeamDiv.appendChild(damageDiv);
    
    setTimeout(() => {
        damageDiv.remove();
    }, 1000);
}

/**
 * 顯示隊伍回血數字
 * @param {number} heal - 回血數值
 */
function showTeamHealNumber(heal) {
    const playerTeamDiv = document.getElementById('player-team');
    if (!playerTeamDiv) return;
    
    const healDiv = document.createElement('div');
    healDiv.className = 'heal-number team-heal';
    healDiv.textContent = `+${heal}`;
    healDiv.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#44ff44;font-size:2rem;font-weight:bold;text-shadow:2px 2px 4px rgba(0,0,0,0.8);z-index:100;animation:floatUp 1s ease-out forwards;';
    
    playerTeamDiv.appendChild(healDiv);
    
    setTimeout(() => {
        healDiv.remove();
    }, 1000);
}

/**
 * 顯示勝利畫面
 */
async function showVictoryScreen() {
    const victoryDiv = document.createElement('div');
    victoryDiv.className = 'victory-screen';
    victoryDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2000;';
    
    victoryDiv.innerHTML = `
        <h1 style="color:#ffd700;font-size:3rem;margin-bottom:20px;">VICTORY!</h1>
        <p style="color:#fff;font-size:1.5rem;">Stage ${gameState.currentStage} Clear!</p>
        <button onclick="location.reload()" style="margin-top:30px;padding:15px 30px;font-size:1.2rem;background:#ffd700;border:none;border-radius:10px;cursor:pointer;">返回</button>
    `;
    
    document.body.appendChild(victoryDiv);
}

/**
 * 顯示失敗畫面
 */
async function showDefeatScreen() {
    const defeatDiv = document.createElement('div');
    defeatDiv.className = 'defeat-screen';
    defeatDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2000;';
    
    defeatDiv.innerHTML = `
        <h1 style="color:#ff4444;font-size:3rem;margin-bottom:20px;">DEFEAT</h1>
        <p style="color:#fff;font-size:1.5rem;">Stage ${gameState.currentStage} Failed</p>
        <button onclick="location.reload()" style="margin-top:30px;padding:15px 30px;font-size:1.2rem;background:#ff4444;border:none;border-radius:10px;cursor:pointer;color:#fff;">重試</button>
    `;
    
    document.body.appendChild(defeatDiv);
}

/**
 * 顯示傷害數字
 * @param {object} enemy - 敵人物件
 * @param {number} damage - 傷害數值
 * @param {string} type - 傷害類型
 */
function showDamageNumber(enemy, damage, type = 'normal') {
    const enemyElements = document.querySelectorAll('.enemy-card');
    const enemyIndex = gameState.battle.enemies.indexOf(enemy);
    
    if (enemyElements[enemyIndex]) {
        const rect = enemyElements[enemyIndex].getBoundingClientRect();
        
        const damageDiv = document.createElement('div');
        damageDiv.className = `damage-number ${type}`;
        damageDiv.textContent = damage;
        damageDiv.style.left = (rect.left + rect.width / 2) + 'px';
        damageDiv.style.top = rect.top + 'px';
        
        document.body.appendChild(damageDiv);
        
        setTimeout(() => {
            damageDiv.remove();
        }, 800);
    }
}

/**
 * 顯示回血數字
 * @param {number} cardIndex - 卡片索引
 * @param {number} heal - 回血數值
 */
function showHealNumber(cardIndex, heal) {
    const cardElements = document.querySelectorAll('.player-card');
    
    if (cardElements[cardIndex]) {
        const rect = cardElements[cardIndex].getBoundingClientRect();
        
        const healDiv = document.createElement('div');
        healDiv.className = 'heal-number';
        healDiv.textContent = `+${heal}`;
        healDiv.style.left = (rect.left + rect.width / 2) + 'px';
        healDiv.style.top = rect.top + 'px';
        
        document.body.appendChild(healDiv);
        
        setTimeout(() => {
            healDiv.remove();
        }, 800);
    }
}

/**
 * 顯示擊殺動畫
 * @param {object} enemy - 敵人物件
 */
function showDefeatedAnimation(enemy) {
    const enemyElements = document.querySelectorAll('.enemy-card');
    const enemyIndex = gameState.battle.enemies.indexOf(enemy);
    
    if (enemyElements[enemyIndex]) {
        enemyElements[enemyIndex].classList.add('defeated');
        
        const rect = enemyElements[enemyIndex].getBoundingClientRect();
        
        const defeatedText = document.createElement('div');
        defeatedText.className = 'defeated-text';
        defeatedText.textContent = 'DEFEATED';
        defeatedText.style.left = rect.left + 'px';
        defeatedText.style.top = rect.top + 'px';
        defeatedText.style.width = rect.width + 'px';
        defeatedText.style.height = rect.height + 'px';
        
        document.body.appendChild(defeatedText);
        
        setTimeout(() => {
            defeatedText.remove();
        }, 500);
    }
}

/**
 * 檢查戰鬥結果
 */
async function checkBattleResult() {
    const allEnemiesDead = gameState.battle.enemies.every(e => e.hp <= 0);
    
    if (allEnemiesDead) {
        // 敵人全滅，檢查Wave
        if (gameState.battle.wave < gameState.battle.maxWaves) {
            // 進入下一Wave
            await nextWave();
        } else {
            // 勝利
            gameState.battle.battlePhase = 'VICTORY';
            await showVictoryScreen();
        }
    } else {
        // 還有敵人，進入敵人回合
        await executeEnemyTurn();
    }
}

/**
 * 進入下一Wave
 */
async function nextWave() {
    gameState.battle.wave++;
    
    // 顯示Wave Clear
    showWaveClearDisplay();
    
    // 延遲後載入下一Wave
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 生成新敵人
    gameState.battle.enemies = generateEnemies(gameState.currentStage);
    
    // 重置回合狀態
    gameState.battle.turn++;
    gameState.battle.combo = 0;
    gameState.battle.turnMatchSummary = null;
    gameState.battle.allMatchedGroups = [];
    gameState.battle.battlePhase = 'PLAYER_INPUT';
    
    // 重新渲染
    renderBattle();
    renderSkillButtons();
}

/**
 * 顯示Wave Clear
 */
function showWaveClearDisplay() {
    const display = document.createElement('div');
    display.className = 'wave-clear-display';
    display.textContent = `Wave ${gameState.battle.wave - 1} Clear!`;
    display.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#ffd700;padding:20px 40px;border-radius:10px;font-size:2rem;font-weight:bold;z-index:1000;';
    
    document.body.appendChild(display);
    
    setTimeout(() => {
        display.remove();
    }, 500);
}

/**
 * 敵人攻擊
 */
function enemyAttack() {
    gameState.battle.enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        
        enemy.currentAttackCd--;
        
        if (enemy.currentAttackCd <= 0) {
            // 攻擊玩家
            const alivePlayers = gameState.battle.playerCards.filter(c => c.currentHp > 0);
            if (alivePlayers.length > 0) {
                const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                target.currentHp -= enemy.attack;
                if (target.currentHp < 0) target.currentHp = 0;
            }
            
            // 重置冷卻
            enemy.currentAttackCd = enemy.attackCd;
        }
    });
    
    // 增加回合
    gameState.battle.turn++;
    
    // 重置計時器
    gameState.battle.timerStarted = false;
    gameState.battle.timerRemaining = CONFIG.DRAG_TIME;
    
    // 重新渲染
    renderBattle();
    
    // 檢查是否全滅
    const allPlayersDead = gameState.battle.playerCards.every(c => c.currentHp <= 0);
    if (allPlayersDead) {
        endBattle(false);
    }
}

/**
 * 結束戰鬥
 * @param {boolean} isVictory - 是否勝利
 */
function endBattle(isVictory) {
    showScreen('result');
    
    const resultTitle = document.getElementById('result-title');
    const resultContent = document.getElementById('result-content');
    
    if (isVictory) {
        resultTitle.textContent = '🎉 勝利！';
        resultTitle.style.color = '#00ff00';
        
        // 解鎖下一關
        if (gameState.currentStage === gameState.unlockedStages && gameState.currentStage < 20) {
            gameState.unlockedStages++;
            saveProgress();
        }
        
        resultContent.innerHTML = `
            <h3>戰鬥結果</h3>
            <p>關卡: 第${Math.ceil(gameState.currentStage / 5)}-${(gameState.currentStage - 1) % 5 + 1}關</p>
            <p>Combo: ${gameState.battle.combo}</p>
            <p>回合數: ${gameState.battle.turn}</p>
        `;
        
        // 顯示下一關按鈕
        document.getElementById('next-stage').style.display = 'inline-block';
        document.getElementById('retry-stage').style.display = 'inline-block';
    } else {
        resultTitle.textContent = '💀 失敗';
        resultTitle.style.color = '#ff0000';
        
        resultContent.innerHTML = `
            <h3>戰鬥結果</h3>
            <p>關卡: 第${Math.ceil(gameState.currentStage / 5)}-${(gameState.currentStage - 1) % 5 + 1}關</p>
            <p>隊伍全滅</p>
        `;
        
        // 隱藏下一關按鈕
        document.getElementById('next-stage').style.display = 'none';
        document.getElementById('retry-stage').style.display = 'inline-block';
    }
}

// ===============================
// 畫面切換
// ===============================

/**
 * 顯示指定畫面
 * @param {string} screenName - 畫面名稱
 */
function showScreen(screenName) {
    // 離開當前畫面時清理影片
    if (gameState.currentScreen === 'team') {
        pauseAllCardVideos();
        cleanupCardVideoObserver();
    }
    
    // 隱藏所有畫面
    document.querySelectorAll('.game-screen').forEach(screen => {
        screen.style.display = 'none';
    });
    
    // 顯示目標畫面
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.style.display = 'block';
    }
    
    gameState.currentScreen = screenName;
    
    // 根據畫面執行初始化
    switch (screenName) {
        case 'stage':
            renderStageMap();
            break;
        case 'team':
            renderTeamScreen();
            break;
        case 'battle':
            initPuzzleEvents();
            break;
        case 'result':
            // 結果畫面暫停所有影片
            pauseAllCardVideos();
            cleanupCardVideoObserver();
            break;
    }
}

// ===============================
// 初始化
// ===============================

/**
 * 初始化系統
 */
function init() {
    console.log('🔮 初始化轉珠冒險系統...');
    
    // 載入資料
    loadProgress();
    loadTeam();
    
    // 檢查是否第一次免費已使用
    gameState.firstFreeUsed = localStorage.getItem(STORAGE_KEYS.PUZZLE_FIRST_FREE) === 'true';
    
    // 更新星星顯示
    updateStarsDisplay();
    
    // 綁定事件
    document.getElementById('back-to-home').onclick = () => {
        window.location.href = 'index.html';
    };
    
    document.getElementById('save-team').onclick = () => {
        saveTeam();
        alert('隊伍已保存！');
    };
    
    document.getElementById('back-to-stage').onclick = () => {
        showScreen('stage');
    };
    
    document.getElementById('abandon-battle').onclick = () => {
        if (confirm('確定要放棄戰鬥嗎？星星不會退還。')) {
            showScreen('stage');
        }
    };
    
    document.getElementById('next-stage').onclick = () => {
        if (gameState.currentStage < 20) {
            startStage(gameState.currentStage + 1);
        } else {
            alert('已通過所有關卡！');
            showScreen('stage');
        }
    };
    
    document.getElementById('retry-stage').onclick = () => {
        startStage(gameState.currentStage);
    };
    
    document.getElementById('back-to-map').onclick = () => {
        showScreen('stage');
    };
    
    // 顯示關卡地圖
    showScreen('stage');
    
    console.log('✅ 轉珠冒險系統初始化完成');
}

// 頁面載入後初始化
window.addEventListener('DOMContentLoaded', init);
