// cardStorage.js - 卡片儲存管理系統

// ===============================
// 文字標準化函式
// ===============================
function normalizeText(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase();
}

function normalizeSeriesName(value) {
  return normalizeText(value)
    .replace('系列', '')
    .replace('套卡', '');
}

function normalizeCardId(value) {
  return normalizeText(value);
}

function normalizeRewardCode(code) {
  if (!code) return '';
  return String(code)
    .trim()
    .replace(/\s+/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(char) {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    })
    .toUpperCase();
}

// 邀請碼標準化函式（與 rewardCode 相同，但命名更清晰）
function normalizeInviteCode(code) {
  if (!code) return '';
  return String(code)
    .trim()
    .replace(/\s+/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(char) {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    })
    .toUpperCase();
}

// 系列名稱標準化函式（用於 localStorage key）
function normalizeSeriesKey(seriesName) {
  if (!seriesName) return '';
  return String(seriesName)
    .trim()
    .replace(/\s+/g, '')
    .replace(/系列/g, '')
    .replace(/套卡/g, '')
    .toUpperCase();
}

const CardStorage = {
    // 基本儲存鍵值
    STORAGE_KEYS: {
        OWNED_CARDS: 'ownedCards',
        RECENT_CARDS: 'recentlyObtainedCards',
        CARD_TIMESTAMPS: 'newCardTimestamps',
        CARD_STATS: 'cardStats',
        WISH_CARD: 'currentWishCard',
        CARD_BACKUP: 'cardDataBackup',
        CARD_PROTECTION_ENABLED: 'cardProtectionEnabled',
        LAST_CARD_OPERATION: 'lastCardOperation',
        SERIES_REWARD_CODES: 'seriesRewardCodes',
        USED_SERIES_REWARD_CODES: 'usedSeriesRewardCodes',
        COMPLETED_SERIES: 'completedSeries'
    },

    // 初始化儲存系統
    init() {
        console.log('🔧 初始化卡片儲存系統...');
        
        // 檢查現有資料
        const existingOwnedCards = localStorage.getItem(this.STORAGE_KEYS.OWNED_CARDS);
        const existingShards = localStorage.getItem(this.STORAGE_KEYS.CARD_SHARDS);
        
        console.log('📊 現有已擁有卡片:', existingOwnedCards);
        console.log('💎 現有碎片資料:', existingShards);
        
        // 只有在完全沒有資料時才初始化空物件
        if (!existingOwnedCards) {
            console.log('🆕 初始化已擁有卡片資料');
            localStorage.setItem(this.STORAGE_KEYS.OWNED_CARDS, '{}');
        }
        if (!existingShards) {
            console.log('🆕 初始化碎片資料');
            localStorage.setItem(this.STORAGE_KEYS.CARD_SHARDS, '{}');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.RECENT_CARDS)) {
            localStorage.setItem(this.STORAGE_KEYS.RECENT_CARDS, '[]');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.CARD_TIMESTAMPS)) {
            localStorage.setItem(this.STORAGE_KEYS.CARD_TIMESTAMPS, '{}');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.CARD_STATS)) {
            localStorage.setItem(this.STORAGE_KEYS.CARD_STATS, '{}');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.WISH_CARD)) {
            localStorage.setItem(this.STORAGE_KEYS.WISH_CARD, 'null');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.SERIES_REWARD_CODES)) {
            localStorage.setItem(this.STORAGE_KEYS.SERIES_REWARD_CODES, '{}');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.USED_SERIES_REWARD_CODES)) {
            localStorage.setItem(this.STORAGE_KEYS.USED_SERIES_REWARD_CODES, '[]');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.COMPLETED_SERIES)) {
            localStorage.setItem(this.STORAGE_KEYS.COMPLETED_SERIES, '{}');
        }

        // 初始化卡片統計
        this.initCardStats();
        
        // 預設啟用卡片保護
        if (localStorage.getItem(this.STORAGE_KEYS.CARD_PROTECTION_ENABLED) === null) {
            localStorage.setItem(this.STORAGE_KEYS.CARD_PROTECTION_ENABLED, 'true');
        }
        
        // 確保有備份
        this.ensureCardBackup();
        
        console.log('✅ 卡片儲存系統初始化完成');
    },

    // 初始化卡片統計
    initCardStats() {
        let stats = this.getCardStats();
        if (!stats.totalDraws) stats.totalDraws = 0;
        if (!stats.rarityCount) {
            stats.rarityCount = {
                '普通': 0,
                '稀有': 0,
                '超稀有': 0
            };
        }
        if (!stats.categoryCount) stats.categoryCount = {};
        this.saveCardStats(stats);
    },

    // 獲取已擁有的卡片
    getOwnedCards() {
        const cards = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.OWNED_CARDS) || '{}');
        console.log('📊 CardStorage 讀取已擁有卡片:', Object.keys(cards).length, '張');
        return cards;
    },

    // 設置已擁有的卡片
    setOwnedCards(cards) {
        console.log('💾 CardStorage 保存已擁有卡片:', Object.keys(cards).length, '張');
        localStorage.setItem(this.STORAGE_KEYS.OWNED_CARDS, JSON.stringify(cards));
        // 更新備份
        this.ensureCardBackup();
        // 記錄操作
        this.logCardOperation('setOwnedCards', { cardCount: Object.keys(cards).length });
    },

    // 添加新卡片
    addCard(cardId) {
        const cards = this.getOwnedCards();
        if (!cards[cardId]) {
            cards[cardId] = true;
            this.setOwnedCards(cards);
            console.log(`🎉 CardStorage 新增卡片: ${cardId}`);
            this.updateCardStats(cardId);
        } else {
            console.log(`⚠️ CardStorage 卡片已存在: ${cardId}`);
        }
    },

    // 移除卡片
    removeCard(cardId) {
        const cards = this.getOwnedCards();
        if (cards[cardId]) {
            delete cards[cardId];
            this.setOwnedCards(cards);
            console.log(`🗑️ CardStorage 移除卡片: ${cardId}`);
        }
    },

    // 獲取碎片數量
    getShards() {
        const shards = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CARD_SHARDS) || '{}');
        console.log('💎 CardStorage 讀取碎片資料:', Object.keys(shards).length, '種');
        return shards;
    },

    // 設置碎片數量
    setShards(shards) {
        console.log('💾 CardStorage 保存碎片資料:', Object.keys(shards).length, '種');
        localStorage.setItem(this.STORAGE_KEYS.CARD_SHARDS, JSON.stringify(shards));
        // 更新備份
        this.ensureCardBackup();
        // 記錄操作
        this.logCardOperation('setShards', { shardCount: Object.values(shards).reduce((sum, count) => sum + (parseInt(count) || 0), 0) });
    },

    // 添加碎片
    addShard(cardId, amount) {
        const shards = this.getShards();
        const oldCount = shards[cardId] || 0;
        shards[cardId] = oldCount + amount;
        this.setShards(shards);
        console.log(`💎 CardStorage 新增碎片: ${cardId} +${amount} (總計: ${shards[cardId]})`);
        return shards[cardId];
    },

    // 移除碎片
    removeShard(cardId, amount) {
        const shards = this.getShards();
        if (!shards[cardId]) return false;
        
        const oldCount = shards[cardId];
        shards[cardId] = Math.max(0, shards[cardId] - amount);
        if (shards[cardId] === 0) {
            delete shards[cardId];
        }
        this.setShards(shards);
        console.log(`♻️ CardStorage 移除碎片: ${cardId} -${amount} (剩餘: ${shards[cardId] || 0})`);
        return true;
    },

    // 獲取卡片統計
    getCardStats() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CARD_STATS) || '{}');
    },

    // 保存卡片統計
    saveCardStats(stats) {
        localStorage.setItem(this.STORAGE_KEYS.CARD_STATS, JSON.stringify(stats));
    },

    // 更新卡片統計
    updateCardStats(cardId) {
        const stats = this.getCardStats();
        const card = window.allCards.find(c => c.word === cardId);
        if (!card) return;

        // 更新抽卡次數
        stats.totalDraws = (stats.totalDraws || 0) + 1;

        // 更新稀有度統計
        if (!stats.rarityCount) stats.rarityCount = {};
        stats.rarityCount[card.rarity] = (stats.rarityCount[card.rarity] || 0) + 1;

        // 更新類別統計
        if (!stats.categoryCount) stats.categoryCount = {};
        stats.categoryCount[card.category] = (stats.categoryCount[card.category] || 0) + 1;

        this.saveCardStats(stats);
    },

    // 獲取卡片收集進度
    getCollectionProgress() {
        const ownedCards = this.getOwnedCards();
        const totalCards = window.allCards ? window.allCards.length : 0;
        const unlockedCount = Object.keys(ownedCards).length;

        return {
            total: totalCards,
            unlocked: unlockedCount,
            percentage: totalCards > 0 ? (unlockedCount / totalCards * 100).toFixed(1) : 0
        };
    },

    // 獲取稀有度收集進度
    getRarityProgress() {
        const ownedCards = this.getOwnedCards();
        const progress = {
            '普通': { total: 0, unlocked: 0 },
            '稀有': { total: 0, unlocked: 0 },
            '超稀有': { total: 0, unlocked: 0 }
        };

        if (window.allCards) {
            window.allCards.forEach(card => {
                progress[card.rarity].total++;
                if (ownedCards[card.word]) {
                    progress[card.rarity].unlocked++;
                }
            });
        }

        return progress;
    },

    // 獲取類別收集進度
    getCategoryProgress() {
        const ownedCards = this.getOwnedCards();
        const progress = {};

        if (window.allCards) {
            window.allCards.forEach(card => {
                if (!progress[card.category]) {
                    progress[card.category] = { total: 0, unlocked: 0 };
                }
                progress[card.category].total++;
                if (ownedCards[card.word]) {
                    progress[card.category].unlocked++;
                }
            });
        }

        return progress;
    },

    // 備份卡片數據
    exportData() {
        const data = {
            ownedCards: this.getOwnedCards(),
            cardShards: this.getShards(),
            cardStats: this.getCardStats(),
            exportTime: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(data);
    },

    // 導入卡片數據
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.ownedCards || !data.cardShards) {
                throw new Error('無效的備份數據格式');
            }

            this.setOwnedCards(data.ownedCards);
            this.setShards(data.cardShards);
            if (data.cardStats) {
                this.saveCardStats(data.cardStats);
            }

            return true;
        } catch (error) {
            console.error('導入數據失敗:', error);
            return false;
        }
    },

    // 確保卡片備份存在
    ensureCardBackup() {
        try {
            const ownedCards = this.getOwnedCards();
            const shards = this.getShards();
            
            // 創建備份
            const backup = {
                ownedCards: ownedCards,
                shards: shards,
                timestamp: Date.now(),
                cardCount: Object.keys(ownedCards).length,
                shardCount: Object.values(shards).reduce((sum, count) => sum + (parseInt(count) || 0), 0)
            };
            
            localStorage.setItem(this.STORAGE_KEYS.CARD_BACKUP, JSON.stringify(backup));
            console.log('💾 卡片備份已更新');
            
        } catch (error) {
            console.error('創建卡片備份失敗:', error);
        }
    },

    // 獲取卡片備份
    getCardBackup() {
        try {
            const backupStr = localStorage.getItem(this.STORAGE_KEYS.CARD_BACKUP);
            return backupStr ? JSON.parse(backupStr) : null;
        } catch (error) {
            console.error('讀取卡片備份失敗:', error);
            return null;
        }
    },

    // 從備份恢復卡片資料
    restoreFromBackup() {
        try {
            const backup = this.getCardBackup();
            if (!backup) {
                throw new Error('沒有找到卡片備份');
            }
            
            // 確認恢復
            const confirmMessage = `確定要從備份恢復卡片資料嗎？\n\n` +
                `備份時間：${new Date(backup.timestamp).toLocaleString()}\n` +
                `卡片數量：${backup.cardCount} 張\n` +
                `碎片數量：${backup.shardCount} 個\n\n` +
                `⚠️ 這將會覆蓋目前的卡片資料！`;
            
            if (!confirm(confirmMessage)) {
                return false;
            }
            
            // 恢復資料
            this.setOwnedCards(backup.ownedCards);
            this.setShards(backup.shards);
            
            console.log('✅ 卡片資料已從備份恢復');
            return true;
            
        } catch (error) {
            console.error('恢復卡片備份失敗:', error);
            return false;
        }
    },

    // 檢查卡片保護是否啟用
    isProtectionEnabled() {
        return localStorage.getItem(this.STORAGE_KEYS.CARD_PROTECTION_ENABLED) === 'true';
    },

    // 啟用卡片保護
    enableProtection() {
        localStorage.setItem(this.STORAGE_KEYS.CARD_PROTECTION_ENABLED, 'true');
        console.log('🛡️ 卡片保護已啟用');
    },

    // 停用卡片保護
    disableProtection() {
        if (confirm('確定要停用卡片保護嗎？\n\n停用後，卡片資料可能被意外清空！')) {
            localStorage.setItem(this.STORAGE_KEYS.CARD_PROTECTION_ENABLED, 'false');
            console.log('⚠️ 卡片保護已停用');
        }
    },

    // 記錄卡片操作
    logCardOperation(operation, details = {}) {
        try {
            const log = {
                operation: operation,
                details: details,
                timestamp: Date.now(),
                ownedCardsCount: Object.keys(this.getOwnedCards()).length,
                shardsCount: Object.values(this.getShards()).reduce((sum, count) => sum + (parseInt(count) || 0), 0)
            };
            
            localStorage.setItem(this.STORAGE_KEYS.LAST_CARD_OPERATION, JSON.stringify(log));
            console.log('📝 卡片操作已記錄:', operation);
            
        } catch (error) {
            console.error('記錄卡片操作失敗:', error);
        }
    },

    // 獲取最後的卡片操作
    getLastOperation() {
        try {
            const logStr = localStorage.getItem(this.STORAGE_KEYS.LAST_CARD_OPERATION);
            return logStr ? JSON.parse(logStr) : null;
        } catch (error) {
            console.error('讀取卡片操作記錄失敗:', error);
            return null;
        }
    },

    // 安全清除所有卡片數據（需要額外確認）
    clearAllData() {
        // 檢查保護機制
        if (this.isProtectionEnabled()) {
            const confirmMessage = `⚠️ 卡片保護已啟用！\n\n` +
                `您正在嘗試清除所有卡片資料。\n` +
                `目前擁有 ${Object.keys(this.getOwnedCards()).length} 張卡片\n` +
                `碎片數量：${Object.values(this.getShards()).reduce((sum, count) => sum + (parseInt(count) || 0), 0)} 個\n\n` +
                `此操作將會：\n` +
                `• 清除所有已擁有卡片\n` +
                `• 清除所有碎片\n` +
                `• 清除卡片統計資料\n\n` +
                `⚠️ 此操作無法復原！\n\n` +
                `確定要繼續嗎？\n\n` +
                `（輸入 "CONFIRM" 來確認）`;
            
            const userInput = prompt(confirmMessage);
            if (userInput !== 'CONFIRM') {
                console.log('❌ 卡片清除操作已取消');
                return false;
            }
        }
        
        // 創建最終備份
        this.ensureCardBackup();
        
        // 記錄操作
        this.logCardOperation('clearAllData', {
            reason: 'user_request',
            protectionEnabled: this.isProtectionEnabled()
        });
        
        // 執行清除
        localStorage.removeItem(this.STORAGE_KEYS.OWNED_CARDS);
        localStorage.removeItem(this.STORAGE_KEYS.CARD_SHARDS);
        localStorage.removeItem(this.STORAGE_KEYS.RECENT_CARDS);
        localStorage.removeItem(this.STORAGE_KEYS.CARD_TIMESTAMPS);
        localStorage.removeItem(this.STORAGE_KEYS.CARD_STATS);
        localStorage.removeItem(this.STORAGE_KEYS.WISH_CARD);
        
        this.init(); // 重新初始化
        console.log('🗑️ 所有卡片資料已清除（已創建備份）');
        return true;
    },

    // 安全清除指定卡片（保留碎片）
    clearCardsOnly() {
        const ownedCards = this.getOwnedCards();
        const cardCount = Object.keys(ownedCards).length;
        
        if (cardCount === 0) {
            console.log('📭 沒有卡片需要清除');
            return true;
        }
        
        // 檢查保護機制
        if (this.isProtectionEnabled()) {
            const confirmMessage = `確定要清除所有已擁有的卡片嗎？\n\n` +
                `📊 目前狀態：\n` +
                `• 已擁有卡片：${cardCount} 張\n` +
                `• 碎片數量：${Object.values(this.getShards()).reduce((sum, count) => sum + (parseInt(count) || 0), 0)} 個\n\n` +
                `⚠️ 此操作將會：\n` +
                `• 清除所有已擁有卡片\n` +
                `• 保留所有碎片\n` +
                `• 保留其他遊戲資料\n\n` +
                `💎 碎片將會保留，您可以用來重新合成卡片\n\n` +
                `確定要繼續嗎？`;
            
            if (!confirm(confirmMessage)) {
                console.log('❌ 卡片清除操作已取消');
                return false;
            }
        }
        
        // 創建備份
        this.ensureCardBackup();
        
        // 記錄操作
        this.logCardOperation('clearCardsOnly', {
            clearedCards: cardCount,
            protectionEnabled: this.isProtectionEnabled()
        });
        
        // 只清除卡片，保留碎片
        localStorage.removeItem(this.STORAGE_KEYS.OWNED_CARDS);
        
        console.log(`🎴 已清除 ${cardCount} 張卡片，碎片已保留`);
        return true;
    },

    // 安全清除碎片（保留已解鎖卡片）
    clearShardsOnly() {
        const shards = this.getShards();
        const shardCount = Object.values(shards).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
        const ownedCards = this.getOwnedCards();
        const cardCount = Object.keys(ownedCards).length;
        
        if (shardCount === 0) {
            console.log('💎 沒有碎片需要清除');
            return true;
        }
        
        // 檢查保護機制
        if (this.isProtectionEnabled()) {
            const confirmMessage = `確定要清除所有碎片嗎？\n\n` +
                `📊 目前狀態：\n` +
                `• 已擁有卡片：${cardCount} 張\n` +
                `• 碎片數量：${shardCount} 個\n\n` +
                `⚠️ 此操作將會：\n` +
                `• 保留所有已解鎖的卡片\n` +
                `• 清除所有碎片\n` +
                `• 保留其他遊戲資料\n\n` +
                `🎴 已解鎖的卡片將會保留，您仍然可以使用它們\n\n` +
                `確定要繼續嗎？`;
            
            if (!confirm(confirmMessage)) {
                console.log('❌ 碎片清除操作已取消');
                return false;
            }
        }
        
        // 創建備份
        this.ensureCardBackup();
        
        // 記錄操作
        this.logCardOperation('clearShardsOnly', {
            clearedShards: shardCount,
            keptCards: cardCount,
            protectionEnabled: this.isProtectionEnabled()
        });
        
        // 只清除碎片，保留卡片
        localStorage.removeItem(this.STORAGE_KEYS.CARD_SHARDS);
        
        console.log(`💎 已清除 ${shardCount} 個碎片，${cardCount} 張卡片已保留`);
        return true;
    },

    // 檢查卡片資料完整性
    checkDataIntegrity() {
        try {
            const ownedCards = this.getOwnedCards();
            const shards = this.getShards();
            const backup = this.getCardBackup();
            
            const integrity = {
                ownedCardsValid: typeof ownedCards === 'object' && ownedCards !== null,
                shardsValid: typeof shards === 'object' && shards !== null,
                backupValid: backup !== null,
                ownedCardsCount: Object.keys(ownedCards || {}).length,
                shardsCount: Object.values(shards || {}).reduce((sum, count) => sum + (parseInt(count) || 0), 0),
                backupCardCount: backup ? backup.cardCount : 0,
                backupShardCount: backup ? backup.shardCount : 0,
                protectionEnabled: this.isProtectionEnabled(),
                lastOperation: this.getLastOperation()
            };
            
            return integrity;
            
        } catch (error) {
            console.error('檢查資料完整性失敗:', error);
            return {
                error: error.message,
                protectionEnabled: this.isProtectionEnabled()
            };
        }
    },

    // 修復卡片資料
    repairCardData() {
        try {
            const integrity = this.checkDataIntegrity();
            
            if (integrity.error) {
                throw new Error('資料完整性檢查失敗: ' + integrity.error);
            }
            
            let repaired = false;
            
            // 如果主要資料損壞，嘗試從備份恢復
            if (!integrity.ownedCardsValid || !integrity.shardsValid) {
                console.log('🔧 檢測到資料損壞，嘗試從備份恢復...');
                
                if (integrity.backupValid) {
                    const backup = this.getCardBackup();
                    this.setOwnedCards(backup.ownedCards);
                    this.setShards(backup.shards);
                    repaired = true;
                    console.log('✅ 資料已從備份恢復');
                } else {
                    throw new Error('主要資料和備份都損壞，無法修復');
                }
            }
            
            // 記錄修復操作
            this.logCardOperation('repairCardData', {
                repaired: repaired,
                integrity: integrity
            });
            
            return repaired;
            
        } catch (error) {
            console.error('修復卡片資料失敗:', error);
            return false;
        }
    },

    // 獲取卡片統計資訊
    getCardStats() {
        try {
            const ownedCards = this.getOwnedCards();
            const shards = this.getShards();
            const integrity = this.checkDataIntegrity();
            
            return {
                totalCards: Object.keys(ownedCards).length,
                totalShards: Object.values(shards).reduce((sum, count) => sum + (parseInt(count) || 0), 0),
                protectionEnabled: integrity.protectionEnabled,
                dataIntegrity: integrity,
                lastBackup: this.getCardBackup() ? new Date(this.getCardBackup().timestamp).toLocaleString() : '無',
                lastOperation: integrity.lastOperation ? new Date(integrity.lastOperation.timestamp).toLocaleString() : '無'
            };
            
        } catch (error) {
            console.error('獲取卡片統計失敗:', error);
            return {
                error: error.message,
                protectionEnabled: this.isProtectionEnabled()
            };
        }
    },

    // ===============================
    // 套卡完成檢查系統
    // ===============================

    // 檢查某個系列是否已經收集完成
    isCardSeriesCompleted(seriesName) {
        const targetSeries = normalizeSeriesName(seriesName);
        const allCards = window.allCards || [];
        const ownedCards = this.getOwnedCards();

        if (!Array.isArray(allCards) || !ownedCards) {
            console.error('[套卡檢查] 卡片資料格式錯誤');
            return false;
        }

        const seriesCards = allCards.filter(card => {
            return normalizeSeriesName(card.category || card.series || card.group) === targetSeries;
        });

        if (seriesCards.length === 0) {
            console.warn('[套卡檢查] 找不到這個系列的卡片：', seriesName);
            return false;
        }

        const ownedCardIds = new Set(
            Object.keys(ownedCards).map(cardId => {
                return normalizeCardId(cardId);
            })
        );

        const isCompleted = seriesCards.every(card => {
            const cardId = normalizeCardId(card.word || card.id || card.cardId || card.name || card.title);
            return ownedCardIds.has(cardId);
        });

        console.log(`[套卡檢查] 系列 "${seriesName}": ${seriesCards.length} 張卡片，已收集 ${Array.from(ownedCardIds).filter(id => seriesCards.some(c => normalizeCardId(c.word || c.id || c.cardId || c.name || c.title) === id)).length} 張，完成狀態: ${isCompleted}`);

        return isCompleted;
    },

    // 標記系列為已完成
    markSeriesCompleted(seriesName) {
        const normalizedSeries = normalizeSeriesName(seriesName);
        const completedSeries = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.COMPLETED_SERIES) || '{}');
        completedSeries[normalizedSeries] = {
            completedAt: Date.now(),
            seriesName: seriesName
        };
        localStorage.setItem(this.STORAGE_KEYS.COMPLETED_SERIES, JSON.stringify(completedSeries));
        console.log(`[套卡系統] 標記系列完成: ${seriesName}`);
    },

    // 檢查系列是否已被標記為完成
    hasMarkedSeriesCompleted(seriesName) {
        const normalizedSeries = normalizeSeriesName(seriesName);
        const completedSeries = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.COMPLETED_SERIES) || '{}');
        return !!completedSeries[normalizedSeries];
    },

    // ===============================
    // 套卡優惠碼管理系統
    // ===============================

    // 取得套卡優惠碼的 localStorage key
    getSeriesRewardCodeKey(seriesName) {
        return `seriesRewardCode_${normalizeSeriesName(seriesName)}`;
    },

    // 取得已儲存的套卡優惠碼
    getSavedSeriesRewardCode(seriesName) {
        const key = this.getSeriesRewardCodeKey(seriesName);
        const code = localStorage.getItem(key) || '';
        return normalizeRewardCode(code);
    },

    // 儲存套卡優惠碼
    saveSeriesRewardCode(seriesName, code) {
        const key = this.getSeriesRewardCodeKey(seriesName);
        const normalizedCode = normalizeRewardCode(code);
        localStorage.setItem(key, normalizedCode);
        
        // 同時更新總表
        const allSeriesCodes = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SERIES_REWARD_CODES) || '{}');
        allSeriesCodes[normalizeSeriesName(seriesName)] = {
            code: normalizedCode,
            seriesName: seriesName,
            createdAt: Date.now()
        };
        localStorage.setItem(this.STORAGE_KEYS.SERIES_REWARD_CODES, JSON.stringify(allSeriesCodes));
        
        console.log(`[套卡優惠碼] 儲存優惠碼: ${seriesName} -> ${normalizedCode}`);
    },

    // 檢查是否已有套卡優惠碼
    hasSeriesRewardCode(seriesName) {
        return !!this.getSavedSeriesRewardCode(seriesName);
    },

    // 產生套卡優惠碼
    generateSeriesRewardCode(seriesName) {
        const seriesKey = normalizeSeriesName(seriesName);
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        return normalizeRewardCode(`SET-${seriesKey}-${randomPart}`);
    },

    // 取得或建立套卡優惠碼
    getOrCreateSeriesRewardCode(seriesName) {
        const savedCode = this.getSavedSeriesRewardCode(seriesName);

        if (savedCode) {
            console.log(`[套卡優惠碼] 讀取已存在的優惠碼: ${seriesName} -> ${savedCode}`);
            return savedCode;
        }

        if (!this.isCardSeriesCompleted(seriesName)) {
            console.warn(`[套卡優惠碼] 系列未完成，無法產生優惠碼: ${seriesName}`);
            return '';
        }

        const newCode = this.generateSeriesRewardCode(seriesName);
        this.saveSeriesRewardCode(seriesName, newCode);
        this.markSeriesCompleted(seriesName);

        console.log(`[套卡優惠碼] 產生新優惠碼: ${seriesName} -> ${newCode}`);
        return newCode;
    },

    // 取得所有本機套卡優惠碼
    getAllLocalSeriesRewardCodes() {
        const rewardCodes = [];
        const allSeriesCodes = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SERIES_REWARD_CODES) || '{}');

        Object.entries(allSeriesCodes).forEach(([normalizedSeries, data]) => {
            if (data && data.code) {
                rewardCodes.push({
                    code: normalizeRewardCode(data.code),
                    type: 'seriesReward',
                    seriesName: data.seriesName || normalizedSeries,
                    rewardType: 'stars',
                    rewardAmount: 100,
                    source: 'localSeriesReward',
                    createdAt: data.createdAt
                });
            }
        });

        return rewardCodes;
    },

    // 取得已使用的套卡優惠碼
    getUsedSeriesRewardCodes() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEYS.USED_SERIES_REWARD_CODES);
            const data = raw ? JSON.parse(raw) : [];
            return Array.isArray(data) ? data.map(normalizeRewardCode) : [];
        } catch (error) {
            console.error('[套卡優惠碼] 讀取已使用套卡優惠碼失敗：', error);
            return [];
        }
    },

    // 檢查套卡優惠碼是否已使用
    hasUsedSeriesRewardCode(code) {
        const normalizedCode = normalizeRewardCode(code);
        return this.getUsedSeriesRewardCodes().includes(normalizedCode);
    },

    // 儲存已使用的套卡優惠碼
    saveUsedSeriesRewardCode(code) {
        const normalizedCode = normalizeRewardCode(code);
        const usedCodes = this.getUsedSeriesRewardCodes();

        if (!usedCodes.includes(normalizedCode)) {
            usedCodes.push(normalizedCode);
            localStorage.setItem(this.STORAGE_KEYS.USED_SERIES_REWARD_CODES, JSON.stringify(usedCodes));
            console.log(`[套卡優惠碼] 記錄已使用優惠碼: ${normalizedCode}`);
        }
    },

    // 複製套卡優惠碼
    copySeriesRewardCode(seriesName) {
        const code = this.getSavedSeriesRewardCode(seriesName);

        if (!code) {
            console.warn('[套卡優惠碼] 目前沒有可複製的套卡優惠碼');
            return false;
        }

        navigator.clipboard.writeText(normalizeRewardCode(code))
            .then(() => {
                console.log('[套卡優惠碼] 優惠碼已複製');
                return true;
            })
            .catch(error => {
                console.error('[套卡優惠碼] 複製優惠碼失敗：', error);
                return false;
            });
    }
};

// 導出 CardStorage
window.CardStorage = CardStorage;

// 導出標準化函式到全局作用域
window.normalizeText = normalizeText;
window.normalizeSeriesName = normalizeSeriesName;
window.normalizeCardId = normalizeCardId;
window.normalizeRewardCode = normalizeRewardCode;
window.normalizeInviteCode = normalizeInviteCode;
window.normalizeSeriesKey = normalizeSeriesKey;

// 只有在非自動儲存管理器頁面時才自動初始化
if (!window.location.href.includes('autoSaveManager.html')) {
    // 初始化卡片儲存系統
    CardStorage.init();
} 