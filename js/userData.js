// js/userData.js

/**
 * 取得目前登入的使用者名稱
 * @returns {string|null}
 */
function getCurrentUser() {
  return localStorage.getItem('currentUser') || null;
}

/**
 * 載入指定用戶的數據
 * @param {string} username 用戶名
 * @returns {object|null} 用戶數據
 */
function loadUserData(username) {
  try {
    const data = localStorage.getItem(username);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('載入用戶數據失敗:', error);
    return null;
  }
}

/**
 * 更新當前用戶的數據
 * @param {function} updateCallback 更新回調函數，接收用戶數據作為參數
 */
function updateCurrentUserData(updateCallback) {
  try {
    const username = getCurrentUser();
    if (!username) {
      console.warn('用戶未登入，無法更新數據');
      return;
    }
    
    const userData = loadUserData(username) || {};
    updateCallback(userData);
    localStorage.setItem(username, JSON.stringify(userData));
  } catch (error) {
    console.error('更新用戶數據失敗:', error);
  }
}

/**
 * 清除所有使用者資料（僅在有明確需求時才呼叫這個，不要誤用！）
 */
function clearAllUserData() {
  localStorage.clear();
}

// =================================================================================
// 全局用戶數據管理 (Global User Data Management)
// 包含：星星、成就、每日獎勵等
// =================================================================================

// --------------------------------------------------
// 成就系統 (Achievement System)
// --------------------------------------------------

/**
 * 檢查並領取成就獎勵。
 * 會讀取 localStorage 中的 "ownedCards" 和 "achievement_rewards"，並更新 "totalStars"。
 */
function checkAchievements() {
  try {
    const ownedCards = JSON.parse(localStorage.getItem("ownedCards") || "{}");
    const achievementKey = 'achievement_rewards';
    const claimedAchievements = JSON.parse(localStorage.getItem(achievementKey) || '{}');
    const unlockedCards = Object.keys(ownedCards).length;

    const achievements = [
      { id: 'first_card', condition: unlockedCards >= 1, reward: 5, title: '初次收集' },
      { id: 'ten_cards', condition: unlockedCards >= 10, reward: 15, title: '收藏家' },
      { id: 'twenty_cards', condition: unlockedCards >= 20, reward: 30, title: '卡片大師' },
      { id: 'fifty_cards', condition: unlockedCards >= 50, reward: 80, title: '卡片專家' },
      { id: 'hundred_cards', condition: unlockedCards >= 100, reward: 200, title: '卡片傳奇' }
    ];

    let newAchievementUnlocked = false;
    
    achievements.forEach(achievement => {
      if (achievement.condition && !claimedAchievements[achievement.id]) {
        let stars = parseInt(localStorage.getItem("totalStars") || "0");
        stars += achievement.reward;
        localStorage.setItem("totalStars", stars.toString());

        claimedAchievements[achievement.id] = true;
        newAchievementUnlocked = true;
        
        // 使用一個全局的通知函數（如果存在）
        if (typeof showNotification === 'function') {
          showNotification(`🏆 成就解鎖：${achievement.title}！獲得 ${achievement.reward} 顆星星`, 'success');
        } else {
          console.log(`🏆 成就解鎖：${achievement.title}！獲得 ${achievement.reward} 顆星星`);
          // 簡易的 alert 作為備用方案
          alert(`🏆 成就解鎖：${achievement.title}！獲得 ${achievement.reward} 顆星星`);
        }
      }
    });

    if (newAchievementUnlocked) {
      localStorage.setItem(achievementKey, JSON.stringify(claimedAchievements));
      // 如果星星數量顯示在頁面上，需要一個方法去更新它
      if (typeof updateStars === 'function') {
        updateStars();
      }
    }
  } catch (error) {
    console.error("檢查成就時發生錯誤:", error);
  }
}

// --------------------------------------------------
// 每日簽到獎勵 (Daily Check-in Reward System)
// --------------------------------------------------

/**
 * 檢查今日是否已簽到（不自動發放獎勵或彈窗）
 * 玩家需進入簽到中心手動簽到
 * @returns {boolean} true=今日未簽到, false=今日已簽到
 */
function checkDailyReward() {
  try {
    const today = new Date().toDateString();
    const lastReward = localStorage.getItem('lastDailyReward');
    return lastReward !== today;
  } catch (error) {
    console.error("檢查每日獎勵時發生錯誤:", error);
    return false;
  }
}

/**
 * 更新月曆簽到系統
 */
function updateCalendarCheckin(dateStr) {
  const checkedDates = JSON.parse(localStorage.getItem('checkedDates') || '{}');
  
  if (!checkedDates[dateStr]) {
    checkedDates[dateStr] = {
      date: dateStr,
      timestamp: Date.now(),
      isMakeup: false
    };
    localStorage.setItem('checkedDates', JSON.stringify(checkedDates));
  }
  
  // 同步更新 loginDays 用於成就系統
  const totalCheckedDays = Object.keys(checkedDates).length;
  localStorage.setItem('loginDays', totalCheckedDays.toString());
}

/**
 * 獲取當前連續簽到天數
 */
function getCurrentStreak() {
  const checkedDates = JSON.parse(localStorage.getItem('checkedDates') || '{}');
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);

  while (true) {
    const dateStr = currentDate.toDateString();
    if (checkedDates[dateStr]) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 顯示美化的每日簽到獎勵彈窗
 */
function showDailyRewardModal(stars, loginDays) {
  // 創建彈窗容器
  const modal = document.createElement('div');
  modal.id = 'dailyRewardModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(8px);
    animation: modalFadeIn 0.5s ease-out;
  `;

  // 創建彈窗內容
  const content = document.createElement('div');
  content.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 25px;
    padding: 40px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    animation: modalSlideIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    font-family: 'Orbitron', 'Microsoft JhengHei', sans-serif;
  `;

  // 添加背景裝飾
  const bgDecoration = document.createElement('div');
  bgDecoration.style.cssText = `
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: rotate 20s linear infinite;
    pointer-events: none;
  `;

  // 創建內容
  content.innerHTML = `
    <div style="position: relative; z-index: 2;">
      <!-- 標題 -->
      <div style="font-size: 2.5rem; margin-bottom: 20px; color: #fff; text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);">
        📝 每日簽到獎勵
      </div>
      
      <!-- 星星獎勵 -->
      <div style="margin: 30px 0; animation: starPulse 2s ease-in-out infinite;">
        <div style="font-size: 4rem; margin-bottom: 10px;">⭐</div>
        <div style="font-size: 2rem; font-weight: bold; color: #ffd700; text-shadow: 0 0 15px #ffd700;">
          +${stars} 星星
        </div>
      </div>
      
      <!-- 簽到天數 -->
      <div style="background: rgba(255, 255, 255, 0.2); border-radius: 15px; padding: 15px; margin: 20px 0;">
        <div style="font-size: 1.2rem; color: #fff; margin-bottom: 5px;">📅 連續簽到</div>
        <div style="font-size: 2rem; font-weight: bold; color: #00ffff; text-shadow: 0 0 10px #00ffff;">
          ${loginDays} 天
        </div>
      </div>
      
      <!-- 進度條 -->
      <div style="margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #fff; font-size: 0.9rem;">
          <span>下個成就</span>
          <span>${getNextAchievement(loginDays)}</span>
        </div>
        <div style="background: rgba(255, 255, 255, 0.2); border-radius: 10px; height: 8px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #00ffff, #ffd700); height: 100%; border-radius: 10px; transition: width 1s ease; animation: progressFill 2s ease-out;" 
               id="progressBar"></div>
        </div>
      </div>
      
      <!-- 確認按鈕 -->
      <button id="claimBtn" style="
        background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
        border: none;
        border-radius: 15px;
        padding: 15px 30px;
        font-size: 1.2rem;
        font-weight: bold;
        color: #000;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
        margin-top: 20px;
        font-family: 'Orbitron', 'Microsoft JhengHei', sans-serif;
      " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 25px rgba(255, 215, 0, 0.5)'" 
         onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 5px 15px rgba(255, 215, 0, 0.3)'">
        ✨ 簽到領取 ✨
      </button>
    </div>
  `;

  // 添加動畫樣式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes modalSlideIn {
      from { 
        transform: translateY(-50px) scale(0.9); 
        opacity: 0; 
      }
      to { 
        transform: translateY(0) scale(1); 
        opacity: 1; 
      }
    }
    
    @keyframes starPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes progressFill {
      from { width: 0%; }
      to { width: ${getProgressPercentage(loginDays)}%; }
    }
    
    @keyframes sparkle {
      0%, 100% { opacity: 0; transform: scale(0); }
      50% { opacity: 1; transform: scale(1); }
    }
  `;

  // 組裝彈窗
  content.appendChild(bgDecoration);
  modal.appendChild(content);
  document.body.appendChild(modal);
  document.head.appendChild(style);

  // 添加閃爍效果
  addSparkles(content);

  // 按鈕點擊事件
  document.getElementById('claimBtn').addEventListener('click', () => {
    closeDailyRewardModal(modal, style);
  });

  // 點擊背景關閉
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeDailyRewardModal(modal, style);
    }
  });

  // 播放音效
  if (typeof StarRewardSystem !== 'undefined' && StarRewardSystem.playStarSound) {
    StarRewardSystem.playStarSound();
  }
}

/**
 * 關閉每日簽到獎勵彈窗
 */
function closeDailyRewardModal(modal, style) {
  modal.style.animation = 'modalFadeOut 0.3s ease-out forwards';
  
  // 添加關閉動畫
  const closeStyle = document.createElement('style');
  closeStyle.textContent = `
    @keyframes modalFadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(closeStyle);
  
  setTimeout(() => {
    if (document.body.contains(modal)) {
      document.body.removeChild(modal);
    }
    if (document.head.contains(style)) {
      document.head.removeChild(style);
    }
    if (document.head.contains(closeStyle)) {
      document.head.removeChild(closeStyle);
    }
  }, 300);
}

/**
 * 獲取下一個成就目標
 */
function getNextAchievement(loginDays) {
  if (loginDays < 7) return '7天';
  if (loginDays < 30) return '30天';
  if (loginDays < 100) return '100天';
  return '已完成';
}

/**
 * 獲取進度百分比
 */
function getProgressPercentage(loginDays) {
  if (loginDays < 7) return (loginDays / 7) * 100;
  if (loginDays < 30) return ((loginDays - 7) / (30 - 7)) * 100;
  if (loginDays < 100) return ((loginDays - 30) / (100 - 30)) * 100;
  return 100;
}

/**
 * 添加閃爍效果
 */
function addSparkles(container) {
  for (let i = 0; i < 8; i++) {
    const sparkle = document.createElement('div');
    sparkle.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: #ffd700;
      border-radius: 50%;
      animation: sparkle 2s ease-in-out infinite;
      animation-delay: ${i * 0.25}s;
    `;
    
    // 隨機位置
    sparkle.style.left = Math.random() * 100 + '%';
    sparkle.style.top = Math.random() * 100 + '%';
    
    container.appendChild(sparkle);
  }
}

/**
 * 更新頁面上的星星數量顯示。
 * 這是建議的函數名稱，具體實現取決於各個頁面。
 */
function updateStars() {
    const starsElement = document.getElementById("stars") || document.getElementById("totalStarsCount");
    if (starsElement) {
        const stars = localStorage.getItem("totalStars") || "0";
        // 為 totalStarsCount 元素加上星星符號
        if (starsElement.id === 'totalStarsCount') {
            starsElement.textContent = `⭐ ${stars}`;
        } else {
            starsElement.textContent = stars;
        }
    }
}

// ===== 連動系統管理 =====

/**
 * 連動系統管理器
 */
const LinkageSystem = {
    // 星星系統
    stars: {
        get: () => parseInt(localStorage.getItem("totalStars") || "0"),
        set: (amount) => {
            localStorage.setItem("totalStars", amount.toString());
            LinkageSystem.stars.updateDisplay();
        },
        add: (amount) => {
            const current = LinkageSystem.stars.get();
            LinkageSystem.stars.set(current + amount);
        },
        subtract: (amount) => {
            const current = LinkageSystem.stars.get();
            if (current >= amount) {
                LinkageSystem.stars.set(current - amount);
                return true;
            }
            return false;
        },
        updateDisplay: () => {
            // 更新所有可能的星星顯示元素
            const elements = [
                document.getElementById("stars"),
                document.getElementById("totalStarsCount"),
                document.getElementById("starCount"),
                document.querySelector("#starCount span")
            ];
            const currentStars = LinkageSystem.stars.get();
            elements.forEach(el => {
                if (el) {
                    // 為 totalStarsCount 元素加上星星符號
                    if (el.id === 'totalStarsCount') {
                        el.textContent = `⭐ ${currentStars}`;
                    } else {
                        el.textContent = currentStars;
                    }
                }
            });
        }
    },

    // 玩家資料系統
    player: {
        getName: () => localStorage.getItem("playerName") || "未命名玩家",
        setName: (name) => {
            localStorage.setItem("playerName", name);
            // 標記名稱已經設定過
            localStorage.setItem("nameSet", "true");
            LinkageSystem.player.updateDisplay();
        },
        getAvatar: () => localStorage.getItem("selectedAvatar") || "img/avatars/avatar_TL.png",
        setAvatar: (avatarPath) => {
            localStorage.setItem("selectedAvatar", avatarPath);
            LinkageSystem.player.updateDisplay();
        },
        updateDisplay: () => {
            const nameElements = [
                document.getElementById("playerNameDisplay"),
                document.getElementById("playerName")
            ];
            const avatarElements = [
                document.getElementById("characterImage"),
                document.getElementById("playerAvatar")
            ];
            
            const currentName = LinkageSystem.player.getName();
            const currentAvatar = LinkageSystem.player.getAvatar();
            const nameSet = localStorage.getItem("nameSet") === "true";
            const nameLocked = localStorage.getItem("nameLocked") === "true";
            
            nameElements.forEach(el => {
                if (el) {
                    if (el.tagName === "INPUT") {
                        // 如果名稱已經設定過且沒有永久鎖定，顯示編輯按鈕但保持輸入欄位可編輯
                        if (nameSet && currentName && currentName !== "未命名玩家") {
                            // 只有在永久鎖定時才設為只讀
                            if (nameLocked) {
                                el.readOnly = true;
                                el.style.opacity = "0.7";
                                el.style.cursor = "not-allowed";
                                
                                // 如果永久鎖定，隱藏編輯按鈕
                                const editBtn = document.getElementById("editNameBtn");
                                if (editBtn) {
                                    editBtn.style.display = "none";
                                }
                            } else {
                                // 沒有永久鎖定時，保持輸入欄位可編輯
                                el.readOnly = false;
                                el.style.opacity = "1";
                                el.style.cursor = "text";
                                
                                // 顯示編輯按鈕
                                const editBtn = document.getElementById("editNameBtn");
                                if (editBtn) {
                                    editBtn.style.display = "inline-block";
                                }
                            }
                        } else {
                            el.readOnly = false;
                            el.style.opacity = "1";
                            el.style.cursor = "text";
                            
                            // 隱藏編輯按鈕
                            const editBtn = document.getElementById("editNameBtn");
                            if (editBtn) {
                                editBtn.style.display = "none";
                            }
                        }
                        
                        // 如果輸入欄位沒有焦點，更新其值
                        if (document.activeElement !== el) {
                            el.value = currentName;
                        }
                    } else {
                        el.textContent = currentName;
                    }
                }
            });
            
            avatarElements.forEach(el => {
                if (el) el.src = currentAvatar;
            });
        }
    },

    // 卡片系統
    cards: {
        getOwnedCards: () => {
            const cards = JSON.parse(localStorage.getItem("ownedCards") || "{}");
            // 移除頻繁的 console.log，避免效能問題
            // console.log('📊 讀取已擁有卡片:', Object.keys(cards).length, '張');
            return cards;
        },
        setOwnedCards: (cards) => {
            // 移除頻繁的 console.log，避免效能問題
            // console.log('💾 保存已擁有卡片:', Object.keys(cards).length, '張');
            localStorage.setItem("ownedCards", JSON.stringify(cards));
        },

        addCard: (word) => {
            const owned = LinkageSystem.cards.getOwnedCards();
            if (!owned[word]) {
                owned[word] = true;
                LinkageSystem.cards.setOwnedCards(owned);
                try {
                    if (typeof LinkageSystem.cards.checkSetRewards === 'function') {
                        LinkageSystem.cards.checkSetRewards();
                    }
                } catch (e) {}
                // 移除頻繁的 console.log，避免效能問題
                // console.log(`🎉 新增卡片: ${word}`);
            } else {
                // console.log(`⚠️ 卡片已存在: ${word}`);
            }
        },

        isCardOwned: (word) => {
            const owned = LinkageSystem.cards.getOwnedCards();
            return Boolean(owned[word]);
        },

        checkSetRewards: () => {
            if (!Array.isArray(window.allCards) || window.allCards.length === 0) return;

            // debounce，避免短時間內重複計算
            try {
                if (LinkageSystem.cards._setRewardTimer) {
                    clearTimeout(LinkageSystem.cards._setRewardTimer);
                }
            } catch (e) {}

            LinkageSystem.cards._setRewardTimer = setTimeout(() => {
                LinkageSystem.cards._checkSetRewardsNow();
            }, 150);
        },

        _checkSetRewardsNow: () => {
            if (!Array.isArray(window.allCards) || window.allCards.length === 0) return;

            const owned = LinkageSystem.cards.getOwnedCards();

            // 自動把每個 category 視為一個「套裝」
            const categories = Array.from(new Set(window.allCards
                .map(c => (c && c.category) ? String(c.category).trim() : '')
                .filter(Boolean)));

            const makeSetId = (cat) => `cat_${encodeURIComponent(cat).replace(/%/g, '_')}`;

            const configs = categories.map(cat => ({
                id: makeSetId(cat),
                category: cat
            }));

            let claimed = {};
            try {
                claimed = JSON.parse(localStorage.getItem('claimedCardSetRewards') || '{}');
            } catch (e) {
                claimed = {};
            }

            const completedSets = configs.filter(cfg => {
                const needed = window.allCards
                    .filter(c => c && String(c.category).trim() === cfg.category)
                    .map(c => c.word)
                    .filter(Boolean);

                if (needed.length === 0) return false;
                return needed.every(w => owned[w]);
            });

            completedSets.forEach(cfg => {
                if (claimed[cfg.id]) return;

                const setSize = window.allCards.filter(c => c && String(c.category).trim() === cfg.category).length;
                const rewardStars = setSize >= 8 ? 5000 : setSize >= 5 ? 3000 : 1000;

                claimed[cfg.id] = {
                    stars: rewardStars,
                    category: cfg.category,
                    setSize,
                    claimedAt: new Date().toISOString()
                };
                localStorage.setItem('claimedCardSetRewards', JSON.stringify(claimed));

                LinkageSystem.cards.grantInviteCodeReward(rewardStars, cfg.id, cfg.category);
            });
        },

        grantInviteCodeReward: async (stars, setId, categoryName = '') => {
            // 專門放邀請碼的寶箱清單
            let inviteCodeChests = [];
            try {
                inviteCodeChests = JSON.parse(localStorage.getItem('inviteCodeChests') || '[]');
                if (!Array.isArray(inviteCodeChests)) inviteCodeChests = [];
            } catch (e) {
                inviteCodeChests = [];
            }

            // 同一個套裝只發放一次
            if (inviteCodeChests.some(c => c && c.setId === setId)) return;

            let used = [];
            try {
                used = JSON.parse(localStorage.getItem('usedInviteCodes') || '[]');
                if (!Array.isArray(used)) used = [];
            } catch (e) {
                used = [];
            }
            const usedCodes = new Set(used.map(u => u && u.code).filter(Boolean));
            const chestCodes = new Set(inviteCodeChests.map(c => c && c.code).filter(Boolean));

            let codesData = null;
            try {
                const res = await fetch('js/inviteCodes.json', { cache: 'no-store' });
                codesData = await res.json();
            } catch (e) {
                codesData = null;
            }

            const pool = (codesData && Array.isArray(codesData.codes)) ? codesData.codes : [];
            const candidates = pool.filter(c => c && c.stars === stars && c.used === false && c.code && !usedCodes.has(c.code) && !chestCodes.has(c.code));

            const picked = candidates.length ? candidates[0] : null;
            const code = picked ? picked.code : null;

            const chest = {
                type: 'invite_code',
                setId,
                categoryName,
                stars,
                code,
                earnedAt: new Date().toISOString(),
                used: false,
                usedAt: null
            };
            inviteCodeChests.push(chest);
            localStorage.setItem('inviteCodeChests', JSON.stringify(inviteCodeChests));

            if (LinkageSystem.notifications && typeof LinkageSystem.notifications.show === 'function') {
                if (code) {
                    LinkageSystem.notifications.show(`🎁 你獲得一個邀請碼寶箱！\n🏆 分類蒐集完成：${categoryName || setId}\n⭐ 面額：${stars}\n📦 請到商城查看寶箱清單並兌換`, 'success', 7000);
                } else {
                    LinkageSystem.notifications.show(`🎁 你獲得一個邀請碼寶箱！\n🏆 分類蒐集完成：${categoryName || setId}\n⚠️ 目前找不到可用的 ${stars} 星星邀請碼`, 'info', 7000);
                }
            }
        }

    },

    // 音樂系統
    music: {
        isPlaying: () => {
            // 優先使用 SoundSystem 的狀態
            if (typeof SoundSystem !== 'undefined' && SoundSystem.bgm) {
                return SoundSystem.bgm.getPlayingState();
            }
            // 備用：使用 localStorage
            return localStorage.getItem("bgMusicState") === "playing";
        },
        setPlaying: (playing) => {
            // 同步到 SoundSystem
            if (typeof SoundSystem !== 'undefined' && SoundSystem.bgm) {
                if (playing) {
                    SoundSystem.bgm.play();
                } else {
                    SoundSystem.bgm.pause();
                }
            }
            // 同步到 localStorage
            localStorage.setItem("bgMusicState", playing ? "playing" : "paused");
        },
        getVolume: () => {
            // 優先使用 SoundSystem 的音量
            if (typeof SoundSystem !== 'undefined' && SoundSystem.bgm) {
                return SoundSystem.bgm.getVolume();
            }
            // 備用：使用 localStorage
            return parseFloat(localStorage.getItem("musicVolume") || "0.3");
        },
        setVolume: (volume) => {
            // 同步到 SoundSystem
            if (typeof SoundSystem !== 'undefined' && SoundSystem.bgm) {
                SoundSystem.bgm.setVolume(volume);
            }
            // 同步到 localStorage
            localStorage.setItem("musicVolume", volume.toString());
        }
    },

    // 遊戲進度系統
    progress: {
        save: (gameName, data) => {
            localStorage.setItem(`progress_${gameName}`, JSON.stringify(data));
        },
        load: (gameName) => {
            const data = localStorage.getItem(`progress_${gameName}`);
            return data ? JSON.parse(data) : null;
        },
        clear: (gameName) => {
            localStorage.removeItem(`progress_${gameName}`);
        }
    },

    // 通知系統
    notifications: {
        show: (message, type = 'info', duration = 3500) => {
            // 播放通知音效
            try {
                let soundToPlay;
                switch(type) {
                    case 'success':
                        soundToPlay = document.getElementById('ssrSound') || document.getElementById('correct');
                        break;
                    case 'warning':
                        soundToPlay = document.getElementById('wrong');
                        break;
                    case 'error':
                        soundToPlay = document.getElementById('wrong');
                        break;
                    default:
                        soundToPlay = document.getElementById('click') || document.getElementById('TAK');
                        break;
                }
                
                if (soundToPlay) {
                    soundToPlay.currentTime = 0;
                    soundToPlay.play().catch(e => console.error('通知音效播放失敗:', e));
                }
            } catch (error) {
                console.error('播放通知音效時發生錯誤:', error);
            }
            
            const notification = document.createElement('div');
            notification.innerHTML = message;

            let borderColor = '#00ffff';
            if (type === 'success') {
                borderColor = '#76ff76';
            } else if (type === 'warning' || type === 'summary') {
                borderColor = '#ffd700';
            }

            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(10, 20, 40, 0.9);
                backdrop-filter: blur(5px);
                color: white;
                padding: 14px 26px;
                border-radius: 12px;
                border: 2px solid ${borderColor};
                z-index: 10000;
                font-weight: bold;
                box-shadow: 0 0 16px ${borderColor}, 0 0 36px ${borderColor}88;
                text-shadow: 0 0 8px #000;
                animation: fadeInCenter 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                font-family: 'Orbitron', sans-serif;
                font-size: 1.1rem;
                max-width: 90%;
                text-align: ${type === 'summary' ? 'left' : 'center'};
            `;

            // 添加動畫樣式
            if (!document.getElementById('notification-animations')) {
                const style = document.createElement('style');
                style.id = 'notification-animations';
                style.textContent = `
                    @keyframes fadeInCenter {
                        from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    }
                    @keyframes fadeOutCenter {
                        from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                        to { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'fadeOutCenter 0.5s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards';
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, duration);
        }
    },

    // 初始化所有連動系統
    init: () => {
        // 監聽 localStorage 變化
        window.addEventListener('storage', (e) => {
            switch (e.key) {
                case 'totalStars':
                    LinkageSystem.stars.updateDisplay();
                    break;
                case 'playerName':
                case 'selectedAvatar':
                    LinkageSystem.player.updateDisplay();
                    break;
                case 'ownedCards':
                    // 卡片系統變化時可以觸發更新
                    if (typeof updateCardDisplay === 'function') {
                        updateCardDisplay();
                    }
                    // 確保 ownedCards 資料正確
                    console.log('🔄 storage 事件：ownedCards 已更新');
                    break;
                case 'cardShards':
                    // 碎片系統已移除，不再處理
                    break;
            }
        });

        // 頁面載入時更新顯示
        LinkageSystem.stars.updateDisplay();
        LinkageSystem.player.updateDisplay();
    }
};

// 讓其他腳本知道這個模塊已載入
window.userDataModuleLoaded = true;

// 將 LinkageSystem 暴露到 window 物件，讓其他腳本可以使用
window.LinkageSystem = LinkageSystem;
