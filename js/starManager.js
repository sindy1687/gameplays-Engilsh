// js/starManager.js
// 統一星星管理系統 - 包裝 LinkageSystem.stars

const StarManager = {
    // 正式星星資料來源
    STORAGE_KEY: 'totalStars',
    
    // 排行榜同步相關
    LEADERBOARD_API_URL: 'https://script.google.com/macros/s/AKfycbxoktND9L-KKwSaih5SNzdJWLhRP9dQdI5oHbUNIE3HJhdLjhLIwnL8xFnNtFfGE-rH9A/exec',
    starsSyncTimer: null,
    lastSyncedStars: null,
    
    /**
     * 取得目前星星數量
     * @returns {number} 星星數量
     */
    getStars() { return window.StarSystem.getTotalStars(); },

    addStars(amount, reason = '') {
        return window.StarSystem.addTotalStars(amount, reason);
    },

    deductStars(amount, reason = '') {
        if (Number(amount) === 0) return { success: true, stars: this.getStars() };
        const result = window.StarSystem.spendTotalStars(amount, reason);
        return { success: result.ok, stars: result.totalStars };
    },

    canAfford(amount) {
        const value = Number(amount);
        return Number.isFinite(value) && value >= 0 && this.getStars() >= value;
    },

    setStars(amount) { return window.StarSystem.setTotalStars(amount); },

    refreshDisplays() { window.StarSystem.updateAllStarDisplays(); },

    /**
     * 發送星星變動事件
     */
    emitChange(oldValue, newValue, delta, reason) {
        window.dispatchEvent(new CustomEvent('globalStarsChanged', {
            detail: {
                oldValue,
                newValue,
                delta,
                reason
            }
        }));
        
        // 自動觸發排行榜同步
        this.scheduleLeaderboardSync();
    },
    
    /**
     * 排程排行榜同步（debounce）
     */
    scheduleLeaderboardSync() {
        clearTimeout(this.starsSyncTimer);
        this.starsSyncTimer = setTimeout(() => {
            this.syncLeaderboard();
        }, 1000);
    },
    
    /**
     * 同步星星到排行榜
     */
    async syncLeaderboard() {
        try {
            const currentStars = this.getStars();
            
            // 避免同步相同數值
            if (this.lastSyncedStars === currentStars) {
                return;
            }
            
            // 取得玩家資訊
            const playerName = localStorage.getItem('playerName') || localStorage.getItem('currentUser') || '玩家';
            const playerId = localStorage.getItem('playerId');
            
            if (!playerId) {
                console.warn('⚠️ 無法同步排行榜：缺少 playerId');
                return;
            }
            
            // 呼叫 API 更新排行榜
            const formData = new URLSearchParams({
                action: 'updateStars',
                user: playerName,
                stars: currentStars,
                playerId: playerId
            });
            
            const response = await fetch(this.LEADERBOARD_API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.lastSyncedStars = currentStars;
                    console.log('✅ 星星排行榜同步成功:', { playerName, stars: currentStars });
                } else {
                    console.warn('⚠️ 排行榜同步失敗:', result.error);
                }
            } else {
                console.warn('⚠️ 排行榜 API 請求失敗:', response.status);
            }
        } catch (error) {
            console.error('❌ 星星排行榜同步失敗:', error);
            // 同步失敗不影響遊戲功能
        }
    },
    
    /**
     * 初始化星星管理系統
     */
    init() {
        // 監聽 localStorage 變化（跨分頁同步）
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY) {
                this.refreshDisplays();
            }
        });
        
        // 監聽星星變動事件
        window.addEventListener('globalStarsChanged', () => {
            this.refreshDisplays();
            this.scheduleLeaderboardSync();
        });
        
        // 頁面載入時更新顯示
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.refreshDisplays();
            });
        } else {
            this.refreshDisplays();
        }
    }
};

// 自動初始化
StarManager.init();

// 暴露到全局
window.StarManager = StarManager;
