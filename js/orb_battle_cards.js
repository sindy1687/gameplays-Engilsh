// 轉珠戰鬥卡片系統 - 直接讀取 cards.js 並轉換為戰鬥卡

// ===============================
// 戰鬥數值配置
// ===============================
const RARITY_BATTLE_STATS = {
    '普通': {
        hp: 1200,
        attack: 600,
        recovery: 150
    },
    '稀有': {
        hp: 1800,
        attack: 850,
        recovery: 200
    },
    '超稀有': {
        hp: 2400,
        attack: 1150,
        recovery: 260
    }
};

// 屬性定義
const BATTLE_ATTRIBUTES = ['fire', 'water', 'wood', 'light', 'dark'];
const ATTRIBUTE_SYMBOLS = {
    fire: '🔥',
    water: '💧',
    wood: '🌿',
    light: '✦',
    dark: '🌑'
};

// 屬性名稱
const ATTRIBUTE_NAMES = {
    fire: '火',
    water: '水',
    wood: '木',
    light: '光',
    dark: '暗'
};

// 弱點屬性
const ATTRIBUTE_WEAKNESS = {
    fire: 'wood',
    water: 'fire',
    wood: 'water',
    light: 'dark',
    dark: 'light'
};

// 戰鬥卡片配置（人工指定重要卡片能力）
const battleCardConfig = {};

// ===============================
// 媒體判斷函式
// ===============================
function isVideoSource(src) {
    if (!src) return false;
    return /\.mp4($|\?)/i.test(src);
}

// ===============================
// 取得玩家擁有的卡片（用於戰鬥）
// ===============================
function getOwnedCardsForBattle() {
    // 取得所有正式卡片
    const allCards = getAllCards();
    if (!allCards || allCards.length === 0) {
        console.warn('無法取得卡片資料');
        return [];
    }

    // 取得玩家已擁有的卡片 ID
    const ownedCardIds = getOwnedCardIds();
    if (!ownedCardIds || ownedCardIds.length === 0) {
        console.log('玩家尚未擁有任何卡片');
        return [];
    }

    // 過濾出玩家擁有的卡片
    const ownedCards = allCards.filter(card => {
        const cardId = getCardId(card);
        return ownedCardIds.includes(cardId);
    });

    console.log(`取得 ${ownedCards.length} 張可用戰鬥卡片`);
    return ownedCards;
}

// ===============================
// 取得所有卡片
// ===============================
function getAllCards() {
    if (typeof baseCards !== 'undefined' && Array.isArray(baseCards)) {
        return baseCards;
    }
    
    if (typeof window.baseCards !== 'undefined' && Array.isArray(window.baseCards)) {
        return window.baseCards;
    }
    
    console.error('無法找到卡片資料來源');
    return [];
}

// ===============================
// 取得卡片 ID
// ===============================
function getCardId(card) {
    if (!card) return null;
    
    // 優先使用 word 欄位
    if (card.word) return card.word;
    
    // 備用欄位
    if (card.id) return card.id;
    if (card.cardId) return card.cardId;
    if (card.name) return card.name;
    
    return null;
}

// ===============================
// 取得玩家已擁有的卡片 ID
// ===============================
function getOwnedCardIds() {
    // 優先使用 CardStorage 系統
    if (typeof window.CardStorage !== 'undefined' && typeof window.CardStorage.getOwnedCards === 'function') {
        const ownedCards = window.CardStorage.getOwnedCards();
        return Object.keys(ownedCards || {});
    }
    
    // 備用方案：直接讀取 localStorage
    try {
        const ownedCardsStr = localStorage.getItem('ownedCards');
        if (ownedCardsStr) {
            const ownedCards = JSON.parse(ownedCardsStr);
            return Object.keys(ownedCards || {});
        }
    } catch (error) {
        console.error('讀取已擁有卡片失敗:', error);
    }
    
    return [];
}

// ===============================
// 檢查卡片是否已擁有
// ===============================
function isCardOwned(cardId) {
    const ownedIds = getOwnedCardIds();
    return ownedIds.includes(cardId);
}

// ===============================
// 將卡片轉換為戰鬥格式
// ===============================
function normalizeBattleCard(card) {
    if (!card) return null;
    
    const cardId = getCardId(card);
    if (!cardId) {
        console.error('卡片沒有 ID:', card);
        return null;
    }
    
    // 檢查是否有人工配置
    const config = battleCardConfig[cardId];
    
    return {
        id: cardId,
        name: card.zh || card.name || card.word || '未知角色',
        englishName: card.word || '',
        image: card.image || '',
        video: card.video || '',
        rarity: card.rarity || '普通',
        category: card.category || '未分類',
        description: card.description || '',
        role: card.role || '',
        
        // 戰鬥屬性
        attribute: config?.attribute || getBattleAttribute(card),
        
        // 戰鬥數值
        hp: config?.hp || getBattleHp(card),
        attack: config?.attack || getBattleAttack(card),
        recovery: config?.recovery || getBattleRecovery(card),
        
        // 技能
        skill: config?.skill || getBattleSkill(card),
        leaderSkill: config?.leaderSkill || getLeaderSkill(card),
        
        // 原始卡片（保留參考）
        originalCard: card
    };
}

// ===============================
// 取得戰鬥屬性（穩定 hash）
// ===============================
function getBattleAttribute(card) {
    const cardId = getCardId(card);
    if (!cardId) return 'light';
    
    // 使用穩定 hash 產生屬性
    let hash = 0;
    for (let i = 0; i < cardId.length; i++) {
        hash = ((hash << 5) - hash) + cardId.charCodeAt(i);
        hash |= 0;
    }
    
    const index = Math.abs(hash) % BATTLE_ATTRIBUTES.length;
    return BATTLE_ATTRIBUTES[index];
}

// ===============================
// 取得戰鬥 HP
// ===============================
function getBattleHp(card) {
    const rarity = card.rarity || '普通';
    const baseStats = RARITY_BATTLE_STATS[rarity] || RARITY_BATTLE_STATS['普通'];
    
    // 使用穩定 hash 做小幅差異（±10%）
    const cardId = getCardId(card);
    const variance = getStableVariance(cardId, 0.9, 1.1);
    
    return Math.floor(baseStats.hp * variance);
}

// ===============================
// 取得戰鬥攻擊
// ===============================
function getBattleAttack(card) {
    const rarity = card.rarity || '普通';
    const baseStats = RARITY_BATTLE_STATS[rarity] || RARITY_BATTLE_STATS['普通'];
    
    const cardId = getCardId(card);
    const variance = getStableVariance(cardId, 0.9, 1.1);
    
    return Math.floor(baseStats.attack * variance);
}

// ===============================
// 取得戰鬥回復
// ===============================
function getBattleRecovery(card) {
    const rarity = card.rarity || '普通';
    const baseStats = RARITY_BATTLE_STATS[rarity] || RARITY_BATTLE_STATS['普通'];
    
    const cardId = getCardId(card);
    const variance = getStableVariance(cardId, 0.9, 1.1);
    
    return Math.floor(baseStats.recovery * variance);
}

// ===============================
// 穩定差異值（同一張卡永遠相同）
// ===============================
function getStableVariance(cardId, min, max) {
    let hash = 0;
    for (let i = 0; i < cardId.length; i++) {
        hash = ((hash << 5) - hash) + cardId.charCodeAt(i);
        hash |= 0;
    }
    
    const normalized = Math.abs(hash) / 2147483647; // 正規化到 0-1
    return min + normalized * (max - min);
}

// ===============================
// 取得戰鬥技能
// ===============================
function getBattleSkill(card) {
    const attribute = getBattleAttribute(card);
    const rarity = card.rarity || '普通';
    const cardId = getCardId(card);
    
    // 根據屬性和稀有度配置技能
    const skillTemplates = {
        fire: [
            { name: '火焰轉換', description: '將木符石轉成火符石', cooldown: 5, type: 'convert', from: 'wood', to: 'fire' },
            { name: '火屬增幅', description: '火屬攻擊 ×2，持續3回合', cooldown: 6, type: 'attack_boost', attribute: 'fire', multiplier: 2, turns: 3 },
            { name: '烈焰爆破', description: '炸掉所有水符石', cooldown: 7, type: 'destroy', targetType: 'water' }
        ],
        water: [
            { name: '水流轉換', description: '將火符石轉成水符石', cooldown: 5, type: 'convert', from: 'fire', to: 'water' },
            { name: '治療之泉', description: '恢復最大HP的30%', cooldown: 6, type: 'heal', amount: '30%' },
            { name: '水盾', description: '減傷50%，持續2回合', cooldown: 7, type: 'shield', reduction: 50, turns: 2 }
        ],
        wood: [
            { name: '木葉轉換', description: '將水符石轉成木符石', cooldown: 5, type: 'convert', from: 'water', to: 'wood' },
            { name: '延長時間', description: '操作時間+3秒，持續3回合', cooldown: 6, type: 'move_time', value: 3, turns: 3 },
            { name: '木屬增幅', description: '木屬攻擊 ×2', cooldown: 6, type: 'attack_boost', attribute: 'wood', multiplier: 2, turns: 3 }
        ],
        light: [
            { name: '聖光轉換', description: '將暗符石轉成光符石', cooldown: 5, type: 'convert', from: 'dark', to: 'light' },
            { name: '全隊回復', description: '恢復最大HP的20%', cooldown: 5, type: 'heal', amount: '20%' },
            { name: '光之祝福', description: 'Combo數+2', cooldown: 8, type: 'combo_boost', value: 2 }
        ],
        dark: [
            { name: '暗影轉換', description: '將光符石轉成暗符石', cooldown: 5, type: 'convert', from: 'light', to: 'dark' },
            { name: '暗屬增幅', description: '暗屬攻擊 ×2.5', cooldown: 7, type: 'attack_boost', attribute: 'dark', multiplier: 2.5, turns: 3 },
            { name: '無視防禦', description: '本次攻擊無視敵人防禦', cooldown: 8, type: 'pierce_defense' }
        ]
    };
    
    const templates = skillTemplates[attribute] || skillTemplates.light;
    
    // 根據稀有度選擇技能
    let skillIndex = 0;
    if (rarity === '稀有') {
        skillIndex = 1;
    } else if (rarity === '超稀有') {
        skillIndex = 2;
    }
    
    // 使用穩定 hash 選擇技能（確保同一張卡永遠相同）
    const hashIndex = getStableVariance(cardId, 0, templates.length);
    const template = templates[Math.floor(hashIndex * templates.length)];
    
    return {
        ...template,
        currentCooldown: template.cooldown
    };
}

// ===============================
// 取得隊長技能
// ===============================
function getLeaderSkill(card) {
    const attribute = getBattleAttribute(card);
    const rarity = card.rarity || '普通';
    
    let multiplier = 1.5;
    if (rarity === '稀有') {
        multiplier = 2.0;
    } else if (rarity === '超稀有') {
        multiplier = 2.5;
    }
    
    return {
        name: `${ATTRIBUTE_NAMES[attribute]}屬強化`,
        description: `${ATTRIBUTE_NAMES[attribute]}屬性攻擊 ×${multiplier}`,
        attribute: attribute,
        multiplier: multiplier
    };
}

// ===============================
// 建立卡片媒體元素
// ===============================
function createCardMedia(card, options = {}) {
    const src = card.image || '';
    const { autoplay = true, muted = true, loop = true, playsInline = true } = options;
    
    if (isVideoSource(src)) {
        const video = document.createElement('video');
        video.src = src;
        video.autoplay = autoplay;
        video.loop = loop;
        video.muted = muted;
        video.playsInline = playsInline;
        
        if (autoplay) {
            video.play().catch(() => {
                console.log('影片自動播放失敗:', src);
            });
        }
        
        return video;
    }
    
    const img = document.createElement('img');
    img.src = src;
    img.alt = card.zh || card.word || '角色卡';
    img.loading = 'lazy';
    
    return img;
}

// ===============================
// 取得屬性符號
// ===============================
function getAttributeSymbol(attribute) {
    return ATTRIBUTE_SYMBOLS[attribute] || '✦';
}

// ===============================
// 取得屬性名稱
// ===============================
function getAttributeName(attribute) {
    return ATTRIBUTE_NAMES[attribute] || attribute;
}

// ===============================
// 取得弱點屬性
// ===============================
function getWeakAttribute(attribute) {
    return ATTRIBUTE_WEAKNESS[attribute] || 'heart';
}

// ===============================
// 根據 ID 取得戰鬥卡片
// ===============================
function getBattleCardById(cardId) {
    const allCards = getAllCards();
    const card = allCards.find(c => getCardId(c) === cardId);
    
    if (!card) {
        console.warn('找不到卡片:', cardId);
        return null;
    }
    
    return normalizeBattleCard(card);
}

// ===============================
// 批量取得戰鬥卡片
// ===============================
function getBattleCardsByIds(cardIds) {
    if (!Array.isArray(cardIds)) return [];
    
    const battleCards = [];
    for (const cardId of cardIds) {
        const battleCard = getBattleCardById(cardId);
        if (battleCard) {
            battleCards.push(battleCard);
        }
    }
    
    return battleCards;
}

// ===============================
// 清理隊伍資料（移除不存在的卡片）
// ===============================
function cleanTeamCardIds(cardIds) {
    if (!Array.isArray(cardIds)) return [];
    
    const allCards = getAllCards();
    const allCardIds = allCards.map(c => getCardId(c));
    
    return cardIds.filter(cardId => {
        const exists = allCardIds.includes(cardId);
        if (!exists) {
            console.log('移除不存在的卡片:', cardId);
        }
        return exists;
    });
}

// ===============================
// 初始化
// ===============================
console.log('🎮 轉珠戰鬥卡片系統載入完成');
