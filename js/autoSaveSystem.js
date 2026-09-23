/**
 * 統一自動儲存系統
 * 負責自動儲存所有遊戲資料，包括星星、關卡進度、成就等
 */

// =========================================
// 備份瘦身與安全寫入 Helper 函式
// =========================================

const excludedStorageKeyPatterns = [
  /^gameBackup_/,
  /^unifiedGameBackup$/,
  /^emergencyBackup_/,
  /card/i,
  /image/i,
  /video/i,
  /asset/i,
  /base64/i
];

function shouldExcludeFromBackup(key) {
  return excludedStorageKeyPatterns.some(pattern => pattern.test(key));
}

function createLightweightBackupData(rawData) {
  const backup = safeCloneBackupData(rawData || {});

  removeHeavyBackupFields(backup);
  shrinkOwnedCards(backup);
  shrinkInventoryItems(backup);

  return backup;
}

function safeCloneBackupData(data) {
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(data);
    }
  } catch (error) {
    console.warn('structuredClone 備份資料失敗，改用 JSON clone', error);
  }

  try {
    return JSON.parse(JSON.stringify(data || {}));
  } catch (error) {
    console.warn('備份資料 clone 失敗，改用空物件', error);
    return {};
  }
}

function removeHeavyBackupFields(target) {
  if (!target || typeof target !== 'object') return;

  const heavyKeys = [
    'cards',
    'cardDatabase',
    'cardList',
    'allCards',
    'gachaCards',
    'cardPools',
    'seriesCards',
    'collectionCards',
    'cardDefinitions',
    'cardMasterData',
    'cardData',
    'images',
    'cardImages',
    'backgroundImages',
    'videos',
    'media',
    'assets',
    'base64',
    'imageData',
    'thumbnail',
    'preview',
    'iconData'
  ];

  for (const key of heavyKeys) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      delete target[key];
    }
  }

  for (const key of Object.keys(target)) {
    const value = target[key];

    if (!value || typeof value !== 'object') continue;

    const lowerKey = key.toLowerCase();

    if (
      lowerKey.includes('image') ||
      lowerKey.includes('video') ||
      lowerKey.includes('asset') ||
      lowerKey.includes('base64')
    ) {
      delete target[key];
      continue;
    }

    if (typeof value === 'string' && value.length > 5000) {
      delete target[key];
      continue;
    }

    removeHeavyBackupFields(value);
  }
}

function shrinkOwnedCards(target) {
  if (!target || typeof target !== 'object') return;

  const ownedCardKeys = [
    'playerCards',
    'ownedCards',
    'collection',
    'cardCollection',
    'collectedCards'
  ];

  for (const key of ownedCardKeys) {
    if (!Array.isArray(target[key])) continue;

    target[key] = target[key].map(card => {
      if (typeof card === 'string') {
        return { id: card, count: 1 };
      }

      return {
        id: card.id || card.cardId || card.name,
        count: Number(card.count || card.quantity || card.amount || 1),
        obtainedAt: card.obtainedAt || card.createdAt || null
      };
    }).filter(card => card.id);
  }
}

function shrinkInventoryItems(target) {
  if (!target || typeof target !== 'object') return;

  const inventoryKeys = [
    'inventory',
    'inventoryItems',
    'items',
    'bagItems',
    'backpack'
  ];

  for (const key of inventoryKeys) {
    if (!Array.isArray(target[key])) continue;

    target[key] = target[key].map(item => ({
      id: item.id || item.itemId || item.name,
      type: item.type || item.category || null,
      count: Number(item.count || item.quantity || item.amount || 1)
    })).filter(item => item.id);
  }
}

function safeSetBackupStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (!isStorageQuotaError(error)) {
      console.warn(`localStorage 寫入失敗：${key}`, error);
      return false;
    }

    console.warn(`localStorage 容量不足，開始清理舊備份：${key}`, error);
    cleanupOldGameBackups(1);

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (retryError) {
      console.warn(`清理後仍無法寫入 localStorage：${key}`, retryError);
      return false;
    }
  }
}

function isStorageQuotaError(error) {
  return error && (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
}

function cleanupOldGameBackups(maxKeep = 2) {
  const backupKeys = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith('gameBackup_')) {
      backupKeys.push(key);
    }
  }

  backupKeys.sort((a, b) => {
    const timeA = Number(a.replace('gameBackup_', '')) || 0;
    const timeB = Number(b.replace('gameBackup_', '')) || 0;
    return timeB - timeA;
  });

  const keysToRemove = backupKeys.slice(maxKeep);

  for (const key of keysToRemove) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`移除舊備份失敗：${key}`, error);
    }
  }
}

// =========================================
// 統一自動儲存系統 Class
// =========================================

class UnifiedAutoSaveSystem {
    constructor() {
        this.autoSaveEnabled = localStorage.getItem('unifiedAutoSaveEnabled') !== 'false'; // 預設啟用
        this.autoSaveInterval = null;
        this.lastDataHash = '';
        this.saveTimeout = null;
        this.listeners = [];
        this.googleSheetApiUrl = localStorage.getItem('googleSheetApiUrl') || '';

        // 監聽的遊戲資料鍵值
        this.gameDataKeys = [
            'totalStars',
            'ownedCards', 
            'cardShards',
            'playerName',
            'selectedAvatar',
            'fillGamesCompleted',
            'cardGamesCompleted',
            'quizGamesCompleted',
            'spellingGamesCompleted',
            'matchingGamesCompleted',
            'timeChallengeGamesCompleted',
            'passed_atlas',
            'passed_greek',
            'vocabularyCorrectWords',
            'bgMusicState',
            'musicVolume',
            'achievements_unlocked',
            'loginDays',
            // 連動系統資料
            'recentlyObtainedCards',
            'newCardTimestamps',
            // 單字本資料
            'customDictionary',
            // 寶石系統資料
            'gems',
            'gem_collection_stats',
            'gem_purchase_history',
            'gem_system_settings',
            // 背包系統資料
            'playerInventory',
            'inventoryVersion'
        ];

        this.init();
    }

    setGoogleSheetApiUrl(url) {
        const normalized = (url || '').trim();
        this.googleSheetApiUrl = normalized;
        if (normalized) {
            localStorage.setItem('googleSheetApiUrl', normalized);
        } else {
            localStorage.removeItem('googleSheetApiUrl');
        }
    }

    getAuth() {
        const playerName = (localStorage.getItem('playerName') || '').trim();
        const pin = (localStorage.getItem('playerPin') || '').trim();
        return { playerName, pin };
    }

    ensureAuth(interactive = true) {
        const auth = this.getAuth();
        if (auth.playerName && auth.pin) return auth;

        if (!interactive) return auth;

        let playerName = auth.playerName;
        let pin = auth.pin;

        if (!playerName) {
            playerName = (prompt('請輸入玩家名稱（必填）') || '').trim();
        }
        if (!pin) {
            pin = (prompt('請輸入 PIN（必填）') || '').trim();
        }

        if (playerName) {
            localStorage.setItem('playerName', playerName);
            try {
                if (typeof LinkageSystem !== 'undefined' && LinkageSystem.player) {
                    LinkageSystem.player.updateDisplay();
                }
            } catch (e) {
            }
        }
        if (pin) {
            localStorage.setItem('playerPin', pin);
        }

        return { playerName, pin };
    }

    async saveToGoogleSheet(gameData, isAutoSave = false) {
        try {
            if (!this.googleSheetApiUrl) return { skipped: true, reason: 'no_api_url' };

            const auth = this.ensureAuth(false);
            if (!auth.playerName || !auth.pin) {
                if (!isAutoSave) {
                    this.showNotification('❌ 請先設定玩家名稱與 PIN', 'error');
                }
                return { skipped: true, reason: 'missing_auth' };
            }

            const payloadStr = JSON.stringify(gameData);
            const chunkSize = 40000;
            const version = (gameData && gameData._metadata && gameData._metadata.version) ? String(gameData._metadata.version) : '';

            const totalParts = Math.max(1, Math.ceil(payloadStr.length / chunkSize));
            if (isAutoSave && totalParts > 1) {
                return { skipped: true, reason: 'too_large_for_autosave', size: payloadStr.length, parts: totalParts };
            }

            if (totalParts === 1) {
                const formData = new URLSearchParams();
                formData.append('action', 'saveGameData');
                formData.append('playerName', auth.playerName);
                formData.append('pin', auth.pin);
                formData.append('data', payloadStr);
                formData.append('version', version);

                const response = await fetch(this.googleSheetApiUrl, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData.toString()
                });

                const result = await response.json().catch(() => null);
                if (!response.ok || !result || result.success !== true) {
                    return { success: false, status: response.status, result };
                }
                return { success: true, result };
            }

            for (let partIndex = 0; partIndex < totalParts; partIndex++) {
                const start = partIndex * chunkSize;
                const end = Math.min(payloadStr.length, start + chunkSize);
                const part = payloadStr.slice(start, end);

                const formData = new URLSearchParams();
                formData.append('action', 'saveGameDataPart');
                formData.append('playerName', auth.playerName);
                formData.append('pin', auth.pin);
                formData.append('partIndex', String(partIndex));
                formData.append('partTotal', String(totalParts));
                formData.append('dataPart', part);
                formData.append('version', version);

                const response = await fetch(this.googleSheetApiUrl, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData.toString()
                });

                const result = await response.json().catch(() => null);
                if (!response.ok || !result || result.success !== true) {
                    return { success: false, status: response.status, result, partIndex, parts: totalParts };
                }
            }

            return { success: true, multipart: true, parts: totalParts };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async loadFromGoogleSheet(interactive = true) {
        try {
            if (!this.googleSheetApiUrl) {
                if (interactive) this.showNotification('❌ 尚未設定雲端同步 API', 'error');
                return { success: false, reason: 'no_api_url' };
            }

            const auth = this.ensureAuth(interactive);
            if (!auth.playerName || !auth.pin) {
                if (interactive) this.showNotification('❌ 玩家名稱或 PIN 不完整', 'error');
                return { success: false, reason: 'missing_auth' };
            }

            const formData = new URLSearchParams();
            formData.append('action', 'loadGameData');
            formData.append('playerName', auth.playerName);
            formData.append('pin', auth.pin);

            const response = await fetch(this.googleSheetApiUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            const result = await response.json().catch(() => null);
            if (!response.ok || !result || result.success !== true || !result.data) {
                return { success: false, status: response.status, result };
            }

            let gameData = result.data;
            if (typeof gameData === 'string') {
                gameData = JSON.parse(gameData);
            }

            return { success: true, gameData, saveTime: result.saveTime || null };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 取得所有單字本相關的鍵值
     */
    getAllBookKeys() {
        const bookKeys = [];
        try {
            // 掃描所有 localStorage 項目尋找單字本
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('book_') ||
                           key.startsWith('cat_') ||
                           key.startsWith('wrong_') ||
                           key.startsWith('img_'))) {
                    bookKeys.push(key);
                }
            }
        } catch (error) {
            console.log('掃描單字本鍵值時發生錯誤:', error);
        }
        return bookKeys;
    }

    /**
     * 初始化自動儲存系統
     */
    init() {
        this.updateAllGameDataKeys();
        this.setupStorageListener();

        // 確保有5個備份
        setTimeout(() => {
            this.ensureFiveBackups();
        }, 1000);

        if (this.autoSaveEnabled) {
            this.startAutoSave();
        }

        // 監聽頁面可見性變化，當頁面隱藏時儲存
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.performImmediateSave();
            }
        });

        console.log('🔄 統一自動儲存系統已初始化');
    }

    /**
     * 更新所有遊戲資料鍵值（包括動態產生的）
     */
    updateAllGameDataKeys() {
        const dynamicKeys = this.getAllBookKeys();
        this.gameDataKeys = this.gameDataKeys.concat(
            dynamicKeys.filter(key => !this.gameDataKeys.includes(key))
        );
    }

    /**
     * 設定 localStorage 監聽器
     */
    setupStorageListener() {
        // 覆寫 localStorage.setItem 以監聽變化
        const originalSetItem = localStorage.setItem;
        const self = this;

        localStorage.setItem = function(key, value) {
            originalSetItem.call(this, key, value);

            // 如果是遊戲相關資料且自動儲存已啟用
            if (self.gameDataKeys.includes(key) && self.autoSaveEnabled) {
                self.scheduleAutoSave();
            }

            // 通知監聽器
            self.notifyListeners(key, value);
        };

        // 監聽跨頁面的 storage 事件
        window.addEventListener('storage', (e) => {
            if (this.gameDataKeys.includes(e.key) && this.autoSaveEnabled) {
                this.scheduleAutoSave();
            }
        });
    }

    /**
     * 添加資料變化監聽器
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * 移除資料變化監聽器
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * 通知所有監聽器
     */
    notifyListeners(key, value) {
        this.listeners.forEach(callback => {
            try {
                callback(key, value);
            } catch (error) {
                console.error('監聽器執行錯誤:', error);
            }
        });
    }

    /**
     * 啟用自動儲存
     */
    enableAutoSave() {
        this.autoSaveEnabled = true;
        localStorage.setItem('unifiedAutoSaveEnabled', 'true');
        this.startAutoSave();
        console.log('✅ 統一自動儲存已啟用');
    }

    /**
     * 停用自動儲存
     */
    disableAutoSave() {
        this.autoSaveEnabled = false;
        localStorage.setItem('unifiedAutoSaveEnabled', 'false');
        this.stopAutoSave();
        console.log('⏸️ 統一自動儲存已停用');
    }

    /**
     * 切換自動儲存狀態
     */
    toggleAutoSave() {
        if (this.autoSaveEnabled) {
            this.disableAutoSave();
        } else {
            this.enableAutoSave();
        }
        return this.autoSaveEnabled;
    }

    /**
     * 開始自動儲存
     */
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        // 每5分鐘檢查一次資料變化
        this.autoSaveInterval = setInterval(() => {
            this.checkAndAutoSave();
        }, 5 * 60 * 1000);

        // 10秒後執行首次檢查
        setTimeout(() => {
            this.checkAndAutoSave();
        }, 10000);

        console.log('🔄 自動儲存計時器已啟動（每5分鐘檢查一次）');
    }

    /**
     * 停止自動儲存
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }

        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }

        console.log('⏸️ 自動儲存計時器已停止');
    }

    /**
     * 延遲自動儲存（防止頻繁儲存）
     */
    scheduleAutoSave() {
        if (!this.autoSaveEnabled) return;

        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        // 30秒後執行自動儲存
        this.saveTimeout = setTimeout(() => {
            this.checkAndAutoSave();
        }, 30000);

        console.log('⏱️ 自動儲存已排程，將在30秒後執行');
    }

    /**
     * 檢查並執行自動儲存
     */
    checkAndAutoSave() {
        if (!this.autoSaveEnabled) return;

        try {
            this.updateAllGameDataKeys(); // 更新鍵值列表
            const currentData = this.collectAllLocalStorageData();
            const currentHash = this.generateDataHash(currentData);

            // 如果資料有變化，才進行自動儲存
            if (currentHash !== this.lastDataHash) {
                this.lastDataHash = currentHash;
                this.saveToCloud(currentData, true);
                console.log('🔄 自動儲存完成 -', new Date().toLocaleTimeString());
            } else {
                console.log('📊 資料無變化，跳過自動儲存 -', new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error('自動儲存檢查失敗:', error);
            this.showAutoSaveStatus('自動儲存檢查失敗', 'error');
            setTimeout(() => {
                this.hideAutoSaveStatus();
            }, 3000);
        }
    }

    /**
     * 立即執行儲存（同步）
     */
    performImmediateSave() {
        try {
            this.updateAllGameDataKeys();
            const currentData = this.collectAllLocalStorageData();
            this.saveToCloud(currentData, false, true); // 立即儲存
            console.log('💾 立即儲存完成');
        } catch (error) {
            console.error('立即儲存失敗:', error);
        }
    }

    /**
     * 收集所有遊戲資料
     */
    collectAllGameData() {
        const gameData = {};

        // 收集所有遊戲相關的 localStorage 資料
        this.gameDataKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                gameData[key] = value;
            }
        });

        // 特別處理寶石系統資料
        this.collectGemSystemData(gameData);

        // 添加系統資訊
        gameData._metadata = {
            saveTime: new Date().toISOString(),
            version: '2.1',
            deviceInfo: navigator.userAgent.substring(0, 100),
            dataKeys: this.gameDataKeys.length,
            autoSaveEnabled: this.autoSaveEnabled,
            gemSystemEnabled: typeof window.gemSystem !== 'undefined'
        };

        return gameData;
    }

    collectAllLocalStorageData() {
        const data = {};
        const excludedKeys = new Set([
            'playerPin',
            'googleSheetApiUrl',
            'unifiedGameBackup',
            'gameBackupSlots',
            'unifiedAutoSaveEnabled'
        ]);

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                if (excludedKeys.has(key)) continue;
                if (key.startsWith('gameBackup_')) continue;
                if (key.startsWith('emergencyBackup_')) continue;

                // 排除大型 / 備份 / 媒體 key，但保留必要的遊戲進度 key
                if (shouldExcludeFromBackup(key) && !this.gameDataKeys.includes(key)) continue;

                const value = localStorage.getItem(key);
                if (value !== null) {
                    data[key] = value;
                }
            }
        } catch (error) {
            console.error('收集 localStorage 資料時發生錯誤:', error);
        }

        data._metadata = {
            saveTime: new Date().toISOString(),
            version: '2.1',
            deviceInfo: navigator.userAgent.substring(0, 100),
            dataKeys: Object.keys(data).length,
            autoSaveEnabled: this.autoSaveEnabled,
            fullBackup: true
        };

        return data;
    }

    /**
     * 收集寶石系統相關資料
     */
    collectGemSystemData(gameData) {
        try {
            // 收集寶石庫存資料
            if (typeof window.gemSystem !== 'undefined' && window.gemSystem.gems) {
                gameData['gems'] = JSON.stringify(window.gemSystem.gems);
                console.log('💎 已收集寶石庫存資料');
            }

            // 收集寶石統計資料
            const gemStats = {
                totalGemsCollected: this.calculateTotalGemsCollected(gameData),
                uniqueGemTypes: this.countUniqueGemTypes(gameData),
                lastGemUpdate: new Date().toISOString()
            };
            gameData['gem_collection_stats'] = JSON.stringify(gemStats);

            // 檢查寶石購買歷史
            const purchaseHistory = localStorage.getItem('gem_purchase_history');
            if (purchaseHistory) {
                gameData['gem_purchase_history'] = purchaseHistory;
            }

            // 檢查寶石系統設定
            const gemSettings = localStorage.getItem('gem_system_settings');
            if (gemSettings) {
                gameData['gem_system_settings'] = gemSettings;
            }

        } catch (error) {
            console.error('收集寶石系統資料時發生錯誤:', error);
        }
    }

    /**
     * 計算總寶石收集數量
     */
    calculateTotalGemsCollected(gameData) {
        try {
            const gemsData = gameData['gems'] ? JSON.parse(gameData['gems']) : {};
            return Object.values(gemsData).reduce((total, count) => total + (parseInt(count) || 0), 0);
        } catch (error) {
            return 0;
        }
    }

    /**
     * 計算不重複的寶石種類數量
     */
    countUniqueGemTypes(gameData) {
        try {
            const gemsData = gameData['gems'] ? JSON.parse(gameData['gems']) : {};
            return Object.keys(gemsData).filter(key => parseInt(gemsData[key]) > 0).length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * 生成資料雜湊值（用於檢測變化）
     */
    generateDataHash(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 轉換為32位整數
        }
        return hash.toString();
    }

    /**
     * 儲存到雲端（本地儲存方案）
     */
    saveToCloud(data, isAutoSave = false, isImmediate = false) {
        try {
            // 如果是自動儲存，顯示保存中狀態
            if (isAutoSave) {
                this.showAutoSaveStatus('正在自動儲存...', 'saving');
            }

            // 先對資料瘦身，避免存放大圖 / 完整卡片資料
            const lightweightData = createLightweightBackupData(data);

            const cloudKey = 'unifiedGameBackup';
            const cloudData = {
                gameData: lightweightData,
                saveTime: new Date().toISOString(),
                saveType: isAutoSave ? 'auto' : 'manual',
                isImmediate: isImmediate || false
            };

            const backupString = JSON.stringify(cloudData);
            const saved = safeSetBackupStorage(cloudKey, backupString);

            if (!saved) {
                console.warn('unifiedGameBackup 儲存失敗，已略過本次自動備份');
                if (isAutoSave) {
                    this.showAutoSaveStatus('自動儲存失敗', 'error');
                    setTimeout(() => {
                        this.hideAutoSaveStatus();
                    }, 3000);
                } else {
                    this.showNotification('❌ 儲存失敗：localStorage 容量不足', 'error');
                }
                return false;
            }

            // 同時保存到備份槽位（最多保留2個備份）
            this.saveToBackupSlots(cloudData);

            if (isAutoSave) {
                // 自動儲存完成後顯示短暫成功訊息
                this.showAutoSaveStatus('自動儲存完成', 'success');
                setTimeout(() => {
                    this.hideAutoSaveStatus();
                }, 2000);
            } else {
                this.showNotification('☁️ 遊戲資料已成功儲存！', 'success');
            }

            if (this.googleSheetApiUrl) {
                this.saveToGoogleSheet(data, isAutoSave).then((result) => {
                    if (!result || result.success !== true) {
                        if (!isAutoSave) {
                            this.showNotification('⚠️ 雲端同步失敗（Google Sheet）', 'warning');
                        }
                    }
                });
            }

        } catch (error) {
            console.error('儲存失敗:', error);
            if (isAutoSave) {
                this.showAutoSaveStatus('自動儲存失敗', 'error');
                setTimeout(() => {
                    this.hideAutoSaveStatus();
                }, 3000);
            } else {
                this.showNotification('❌ 儲存失敗：' + error.message, 'error');
            }
        }
    }

    /**
     * 儲存到備份槽位
     */
    saveToBackupSlots(cloudData) {
        try {
            // 確保備份資料已瘦身
            const lightweightCloudData = {
                ...cloudData,
                gameData: createLightweightBackupData(cloudData.gameData)
            };

            // 讀取現有備份列表
            let backupList = JSON.parse(localStorage.getItem('gameBackupSlots') || '[]');

            // 清理舊備份，確保新增後最多 2 份
            cleanupOldGameBackups(1);

            // 檢查是否需要新增備份（至少間隔10分鐘）
            const currentTime = new Date(lightweightCloudData.saveTime).getTime();
            const minInterval = 10 * 60 * 1000; // 10分鐘

            // 如果有現有備份，檢查時間間隔
            if (backupList.length > 0) {
                const lastBackupTime = new Date(backupList[0].saveTime).getTime();
                const timeDiff = currentTime - lastBackupTime;

                // 如果間隔不足10分鐘，且不是手動儲存，則跳過
                if (timeDiff < minInterval && lightweightCloudData.saveType === 'auto') {
                    console.log(`📊 備份間隔不足10分鐘（${Math.round(timeDiff/60000)}分鐘），跳過此次備份`);
                    return;
                }
            }

            // 計算星星數量、卡片數量和寶石數量
            const gameData = lightweightCloudData.gameData;
            const totalStars = parseInt(gameData.totalStars || '0');
            const ownedCards = JSON.parse(gameData.ownedCards || '{}');
            const cardCount = Object.keys(ownedCards).length;

            // 計算寶石統計
            let totalGems = 0;
            let uniqueGemTypes = 0;
            try {
                if (gameData.gems) {
                    const gemsData = JSON.parse(gameData.gems);
                    totalGems = Object.values(gemsData).reduce((total, count) => total + (parseInt(count) || 0), 0);
                    uniqueGemTypes = Object.keys(gemsData).filter(key => parseInt(gemsData[key]) > 0).length;
                }
            } catch (error) {
                console.log('解析寶石資料失敗:', error);
            }

            // 添加新備份
            const newBackup = {
                id: Date.now(),
                saveTime: lightweightCloudData.saveTime,
                saveType: lightweightCloudData.saveType,
                dataSize: JSON.stringify(lightweightCloudData).length,
                totalStars: totalStars,
                cardCount: cardCount,
                totalGems: totalGems,
                uniqueGemTypes: uniqueGemTypes
            };

            backupList.unshift(newBackup);

            // 只保留最新的2個備份
            while (backupList.length > 2) {
                const oldest = backupList.pop();
                try {
                    localStorage.removeItem(`gameBackup_${oldest.id}`);
                } catch (error) {
                    console.warn(`移除舊備份失敗：gameBackup_${oldest.id}`, error);
                }
            }

            const backupListString = JSON.stringify(backupList);
            const backupListSaved = safeSetBackupStorage('gameBackupSlots', backupListString);
            if (!backupListSaved) {
                console.warn('gameBackupSlots 儲存失敗，已略過本次備份');
                return;
            }

            // 儲存實際備份資料
            const backupKey = `gameBackup_${newBackup.id}`;
            const backupString = JSON.stringify(lightweightCloudData);
            const backupSaved = safeSetBackupStorage(backupKey, backupString);

            if (!backupSaved) {
                console.warn(`${backupKey} 儲存失敗，從備份列表移除`);
                backupList.shift();
                safeSetBackupStorage('gameBackupSlots', JSON.stringify(backupList));
                return;
            }

            // 最後再清理一次，確保最多 2 份
            cleanupOldGameBackups(2);

            console.log(`💾 新備份已儲存（ID: ${newBackup.id}），當前共有 ${backupList.length} 個備份`);

        } catch (error) {
            console.log('備份槽位儲存失敗:', error);
        }
    }

    /**
     * 從雲端載入資料
     */
    async loadFromCloud() {
        try {
            if (this.googleSheetApiUrl) {
                const gsResult = await this.loadFromGoogleSheet(true);
                if (gsResult && gsResult.success === true && gsResult.gameData) {
                    const gameData = gsResult.gameData;
                    const currentData = this.collectAllLocalStorageData();
                    const currentStars = currentData.totalStars || 0;
                    const currentCards = Object.keys(currentData.ownedCards || {}).length;
                    const backupStars = gameData.totalStars || 0;
                    const backupCards = Object.keys(gameData.ownedCards || {}).length;

                    let confirmMessage = `確定要載入雲端備份嗎？\n\n`;
                    confirmMessage += `備份時間：${gsResult.saveTime ? new Date(gsResult.saveTime).toLocaleString() : '未知'}\n`;
                    confirmMessage += `儲存類型：Google Sheet\n\n`;
                    confirmMessage += `📊 資料比較：\n`;
                    confirmMessage += `目前星星：${currentStars} 顆 → 備份星星：${backupStars} 顆\n`;
                    confirmMessage += `目前卡片：${currentCards} 張 → 備份卡片：${backupCards} 張\n\n`;
                    if (backupStars < currentStars || backupCards < currentCards) {
                        confirmMessage += `⚠️ 警告：備份資料似乎比目前資料少！\n`;
                        confirmMessage += `建議先手動儲存目前資料再進行載入。\n\n`;
                    }
                    confirmMessage += `⚠️ 這將會覆蓋目前的所有遊戲資料！\n`;
                    confirmMessage += `確定要繼續嗎？`;

                    if (!confirm(confirmMessage)) {
                        return false;
                    }

                    try {
                        const emergencyBackup = {
                            gameData: currentData,
                            saveTime: Date.now(),
                            saveType: 'emergency',
                            reason: 'before_cloud_load_google_sheet'
                        };
                        localStorage.setItem('emergencyBackup_before_cloud_load_google_sheet', JSON.stringify(emergencyBackup));
                        console.log('🆘 已創建緊急備份以防資料丟失');
                    } catch (backupError) {
                        console.warn('創建緊急備份失敗:', backupError);
                    }

                    Object.keys(gameData).forEach(key => {
                        if (key !== '_metadata') {
                            if (key === 'ownedCards') {
                                const currentOwnedCards = localStorage.getItem('ownedCards');
                                const newOwnedCards = gameData[key];
                                if (currentOwnedCards && currentOwnedCards !== '{}' &&
                                    (newOwnedCards === '{}' || newOwnedCards === '' || !newOwnedCards)) {
                                    console.log('⚠️ 保護 ownedCards 不被空資料覆蓋');
                                    return;
                                }
                            }
                            localStorage.setItem(key, gameData[key]);
                        }
                    });

                    this.refreshAllDisplays();
                    this.showNotification('✅ 雲端資料載入成功！頁面將重新整理...', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);

                    return true;
                }
            }

            const cloudKey = 'unifiedGameBackup';
            const cloudDataStr = localStorage.getItem(cloudKey);

            if (!cloudDataStr) {
                this.showNotification('❌ 沒有找到雲端備份資料', 'error');
                return false;
            }

            const cloudData = JSON.parse(cloudDataStr);
            const gameData = cloudData.gameData;

            // 增加更詳細的確認對話框，包含資料比較
            const currentData = this.collectAllLocalStorageData();
            const currentStars = currentData.totalStars || 0;
            const currentCards = Object.keys(currentData.ownedCards || {}).length;
            const backupStars = gameData.totalStars || 0;
            const backupCards = Object.keys(gameData.ownedCards || {}).length;

            let confirmMessage = `確定要載入雲端備份嗎？\n\n`;
            confirmMessage += `備份時間：${new Date(cloudData.saveTime).toLocaleString()}\n`;
            confirmMessage += `儲存類型：${cloudData.saveType === 'auto' ? '自動儲存' : '手動儲存'}\n\n`;
            confirmMessage += `📊 資料比較：\n`;
            confirmMessage += `目前星星：${currentStars} 顆 → 備份星星：${backupStars} 顆\n`;
            confirmMessage += `目前卡片：${currentCards} 張 → 備份卡片：${backupCards} 張\n\n`;

            // 如果備份資料較少，顯示警告
            if (backupStars < currentStars || backupCards < currentCards) {
                confirmMessage += `⚠️ 警告：備份資料似乎比目前資料少！\n`;
                confirmMessage += `建議先手動儲存目前資料再進行載入。\n\n`;
            }

            confirmMessage += `⚠️ 這將會覆蓋目前的所有遊戲資料！\n`;
            confirmMessage += `確定要繼續嗎？`;

            // 確認載入
            if (!confirm(confirmMessage)) {
                return false;
            }

            // 在覆蓋前先創建一個緊急備份
            try {
                const emergencyBackup = {
                    gameData: currentData,
                    saveTime: Date.now(),
                    saveType: 'emergency',
                    reason: 'before_cloud_load'
                };
                localStorage.setItem('emergencyBackup_before_cloud_load', JSON.stringify(emergencyBackup));
                console.log('🆘 已創建緊急備份以防資料丟失');
            } catch (backupError) {
                console.warn('創建緊急備份失敗:', backupError);
            }

            // 載入所有資料，但保護 ownedCards 不被空資料覆蓋
            Object.keys(gameData).forEach(key => {
                if (key !== '_metadata') {
                    // 特別保護 ownedCards，避免被空資料覆蓋
                    if (key === 'ownedCards') {
                        const currentOwnedCards = localStorage.getItem('ownedCards');
                        const newOwnedCards = gameData[key];

                        // 如果目前有卡片資料，且新資料為空，則不覆蓋
                        if (currentOwnedCards && currentOwnedCards !== '{}' &&
                            (newOwnedCards === '{}' || newOwnedCards === '' || !newOwnedCards)) {
                            console.log('⚠️ 保護 ownedCards 不被空資料覆蓋');
                            return; // 跳過這個鍵值
                        }
                    }

                    localStorage.setItem(key, gameData[key]);
                }
            });

            // 強制更新顯示
            this.refreshAllDisplays();

            this.showNotification('✅ 雲端資料載入成功！頁面將重新整理...', 'success');

            // 延遲重新整理頁面以確保資料同步
            setTimeout(() => {
                window.location.reload();
            }, 2000);

            return true;

        } catch (error) {
            console.error('載入失敗:', error);
            this.showNotification('❌ 載入失敗：' + error.message, 'error');
            return false;
        }
    }

    /**
     * 強制重新整理所有顯示
     */
    refreshAllDisplays() {
        try {
            // 更新星星顯示
            if (typeof LinkageSystem !== 'undefined' && LinkageSystem.stars) {
                LinkageSystem.stars.updateDisplay();
            }

            // 更新玩家顯示
            if (typeof LinkageSystem !== 'undefined' && LinkageSystem.player) {
                LinkageSystem.player.updateDisplay();
            }

            // 更新卡片顯示
            if (typeof updateCardDisplay === 'function') {
                updateCardDisplay();
            }

            // 重新渲染卡片頁面
            if (typeof window.renderCards === 'function') {
                window.renderCards();
            }

        } catch (error) {
            console.log('更新顯示時發生錯誤:', error);
        }
    }

    /**
     * 獲取備份列表
     */
    getBackupList() {
        try {
            return JSON.parse(localStorage.getItem('gameBackupSlots') || '[]');
        } catch (error) {
            console.log('讀取備份列表失敗:', error);
            return [];
        }
    }

    /**
     * 載入指定備份
     */
    loadFromBackup(backupId) {
        try {
            const backupData = JSON.parse(localStorage.getItem(`gameBackup_${backupId}`) || 'null');
            if (!backupData) {
                this.showNotification('❌ 備份資料不存在', 'error');
                return false;
            }

            const gameData = backupData.gameData;

            // 獲取備份資訊來顯示星星和卡片數量
            const backupList = this.getBackupList();
            const backupInfo = backupList.find(backup => backup.id === backupId);

            // 增加更詳細的資料比較
            const currentData = this.collectAllLocalStorageData();
            const currentStars = currentData.totalStars || 0;
            const currentCards = Object.keys(currentData.ownedCards || {}).length;
            const backupStars = gameData.totalStars || 0;
            const backupCards = Object.keys(gameData.ownedCards || {}).length;

            let confirmMessage = `確定要載入此備份嗎？\n\n`;
            confirmMessage += `備份時間：${new Date(backupData.saveTime).toLocaleString()}\n`;
            confirmMessage += `儲存類型：${backupData.saveType === 'auto' ? '自動儲存' : '手動儲存'}\n\n`;
            confirmMessage += `📊 資料比較：\n`;
            confirmMessage += `目前星星：${currentStars} 顆 → 備份星星：${backupStars} 顆\n`;
            confirmMessage += `目前卡片：${currentCards} 張 → 備份卡片：${backupCards} 張\n\n`;

            // 如果備份資料較少，顯示警告
            if (backupStars < currentStars || backupCards < currentCards) {
                confirmMessage += `⚠️ 警告：備份資料似乎比目前資料少！\n`;
                confirmMessage += `建議先手動儲存目前資料再進行載入。\n\n`;
            }

            confirmMessage += `⚠️ 這將會覆蓋目前的所有遊戲資料！\n`;
            confirmMessage += `確定要繼續嗎？`;

            // 確認載入
            if (!confirm(confirmMessage)) {
                return false;
            }

            // 在覆蓋前先創建一個緊急備份
            try {
                const emergencyBackup = {
                    gameData: currentData,
                    saveTime: Date.now(),
                    saveType: 'emergency',
                    reason: 'before_backup_load',
                    backupId: backupId
                };
                localStorage.setItem(`emergencyBackup_before_backup_${backupId}`, JSON.stringify(emergencyBackup));
                console.log('🆘 已創建緊急備份以防資料丟失');
            } catch (backupError) {
                console.warn('創建緊急備份失敗:', backupError);
            }

            // 載入所有資料，但保護 ownedCards 不被空資料覆蓋
            Object.keys(gameData).forEach(key => {
                if (key !== '_metadata') {
                    // 特別保護 ownedCards，避免被空資料覆蓋
                    if (key === 'ownedCards') {
                        const currentOwnedCards = localStorage.getItem('ownedCards');
                        const newOwnedCards = gameData[key];

                        // 如果目前有卡片資料，且新資料為空，則不覆蓋
                        if (currentOwnedCards && currentOwnedCards !== '{}' &&
                            (newOwnedCards === '{}' || newOwnedCards === '' || !newOwnedCards)) {
                            console.log('⚠️ 保護 ownedCards 不被空資料覆蓋');
                            return; // 跳過這個鍵值
                        }
                    }

                    localStorage.setItem(key, gameData[key]);
                }
            });

            this.refreshAllDisplays();
            this.showNotification('✅ 備份資料載入成功！', 'success');

            setTimeout(() => {
                window.location.reload();
            }, 2000);

            return true;

        } catch (error) {
            console.error('載入備份失敗:', error);
            this.showNotification('❌ 載入備份失敗：' + error.message, 'error');
            return false;
        }
    }

    /**
     * 顯示自動儲存狀態（頁面顯示，不使用彈窗）
     */
    showAutoSaveStatus(message, type = 'info') {
        // 移除現有的自動儲存狀態提示
        this.hideAutoSaveStatus();

        // 創建狀態提示元素
        const statusDiv = document.createElement('div');
        statusDiv.id = 'autoSaveStatus';
        statusDiv.className = type; // 添加類型類別
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            border-radius: 15px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            transition: all 0.3s ease;
            animation: slideInRight 0.3s ease;
        `;

        // 設定文字內容
        statusDiv.textContent = message;

        // 添加動畫樣式到頁面
        if (!document.getElementById('autoSaveStatusStyles')) {
            const styles = document.createElement('style');
            styles.id = 'autoSaveStatusStyles';
            styles.innerHTML = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(statusDiv);
    }

    /**
     * 隱藏自動儲存狀態提示
     */
    hideAutoSaveStatus() {
        const existingStatus = document.getElementById('autoSaveStatus');
        if (existingStatus) {
            existingStatus.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (existingStatus.parentNode) {
                    existingStatus.parentNode.removeChild(existingStatus);
                }
            }, 300);
        }
    }

    /**
     * 顯示通知（用於手動操作）
     */
    showNotification(message, type = 'info') {
        // 統一使用頁面狀態顯示，不再使用彈窗
        this.showAutoSaveStatus(message, type);

        // 根據類型設定不同的顯示時間
        const displayTime = type === 'error' ? 4000 : 3000;
        setTimeout(() => {
            this.hideAutoSaveStatus();
        }, displayTime);

        // 同時記錄到控制台
        if (type === 'error') {
            console.error(message);
        } else {
            console.log(message);
        }
    }

    /**
     * 獲取儲存狀態資訊
     */
    getStatus() {
        let lastSaveTime = '尚未儲存';

        try {
            // 從備份列表中獲取最新的儲存時間
            const backupList = this.getBackupList();
            if (backupList.length > 0) {
                const latestBackup = backupList[0]; // 最新的備份
                lastSaveTime = new Date(latestBackup.saveTime).toLocaleString();
            } else {
                // 如果沒有備份，檢查主要備份
                const lastBackup = localStorage.getItem('unifiedGameBackup');
                if (lastBackup) {
                    const data = JSON.parse(lastBackup);
                    lastSaveTime = new Date(data.saveTime).toLocaleString();
                }
            }
        } catch (e) {
            console.error('解析儲存時間失敗:', e);
            lastSaveTime = '資料格式錯誤';
        }

        return {
            enabled: this.autoSaveEnabled,
            lastSaveTime: lastSaveTime,
            dataKeysCount: this.gameDataKeys.length,
            backupCount: this.getBackupList().length
        };
    }

    /**
     * 確保備份數量符合上限（最多保留 2 份）
     */
    ensureFiveBackups() {
        try {
            let backupList = this.getBackupList();

            // 最多只需要 2 份，不強制補滿
            if (backupList.length >= 2) {
                return;
            }

            console.log(`📝 目前有 ${backupList.length} 個備份，最多保留 2 份`);

            // 先清理到只剩 1 份
            cleanupOldGameBackups(1);

            // 取得當前資料並瘦身
            const currentData = this.collectAllLocalStorageData();
            const lightweightData = createLightweightBackupData(currentData);
            const now = Date.now();

            const historicalBackup = {
                gameData: lightweightData,
                saveTime: new Date(now).toISOString(),
                saveType: 'auto',
                isHistorical: true
            };

            const gameData = historicalBackup.gameData;
            const totalStars = parseInt(gameData.totalStars || '0');
            const ownedCards = JSON.parse(gameData.ownedCards || '{}');
            const cardCount = Object.keys(ownedCards).length;

            const backupInfo = {
                id: now,
                saveTime: historicalBackup.saveTime,
                saveType: historicalBackup.saveType,
                dataSize: JSON.stringify(historicalBackup).length,
                totalStars: totalStars,
                cardCount: cardCount,
                isHistorical: true
            };

            backupList.unshift(backupInfo);

            // 只保留最新的2個備份
            while (backupList.length > 2) {
                const oldest = backupList.pop();
                try {
                    localStorage.removeItem(`gameBackup_${oldest.id}`);
                } catch (error) {
                    console.warn(`移除舊備份失敗：gameBackup_${oldest.id}`, error);
                }
            }

            const backupListSaved = safeSetBackupStorage('gameBackupSlots', JSON.stringify(backupList));
            if (!backupListSaved) {
                console.warn('gameBackupSlots 儲存失敗，已略過本次歷史備份');
                return;
            }

            const backupKey = `gameBackup_${backupInfo.id}`;
            const backupSaved = safeSetBackupStorage(backupKey, JSON.stringify(historicalBackup));

            if (!backupSaved) {
                console.warn(`${backupKey} 儲存失敗，已略過本次歷史備份`);
                return;
            }

            // 最後再清理一次，確保最多 2 份
            cleanupOldGameBackups(2);

            console.log(`✅ 已確保最多 2 個備份，目前共有 ${backupList.length} 個備份`);

        } catch (error) {
            console.error('確保備份數量失敗:', error);
        }
    }

    /**
     * 清除所有備份
     */
    clearAllBackups() {
        try {
            const backupList = this.getBackupList();

            if (backupList.length === 0) {
                this.showNotification('沒有備份需要清除', 'info');
                return;
            }

            if (!confirm(`確定要清除所有 ${backupList.length} 個備份嗎？\n\n⚠️ 此操作無法復原！`)) {
                return;
            }

            // 清除所有備份檔案
            backupList.forEach(backup => {
                localStorage.removeItem(`gameBackup_${backup.id}`);
            });

            // 清除備份列表
            localStorage.removeItem('gameBackupSlots');

            // 清除主要備份
            localStorage.removeItem('unifiedGameBackup');

            this.showNotification(`✅ 已清除 ${backupList.length} 個備份`, 'success');

        } catch (error) {
            console.error('清除備份失敗:', error);
            this.showNotification('❌ 清除備份失敗：' + error.message, 'error');
        }
    }
}

// 創建全域實例
window.UnifiedAutoSave = new UnifiedAutoSaveSystem();

console.log('🔄 統一自動儲存系統已載入'); 
