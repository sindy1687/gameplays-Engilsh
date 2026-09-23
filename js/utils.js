/**
 * 通用工具函數模組
 * 提供統一的localStorage、API調用、音效等功能
 */

// ========== localStorage 統一管理 ==========
const Storage = {
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      try {
        return JSON.parse(value);
      } catch (parseErr) {
        // 舊資料可能是純文字，直接回傳原始字串
        return value;
      }
    } catch (e) {
      console.warn(`讀取 ${key} 失敗:`, e);
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`儲存 ${key} 失敗:`, e);
      return false;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`刪除 ${key} 失敗:`, e);
      return false;
    }
  },
  
  // 常用數據快捷方法
  getTotalStars() {
    return parseInt(this.get('totalStars', 0), 10) || 0;
  },
  
  setTotalStars(stars) {
    this.set('totalStars', stars);
    this.triggerStarsUpdate();
  },
  
  addStars(amount) {
    const current = this.getTotalStars();
    this.setTotalStars(current + amount);
    return current + amount;
  },
  
  triggerStarsUpdate() {
    // 觸發自定義事件，讓其他模組可以監聽
    window.dispatchEvent(new CustomEvent('starsUpdated', {
      detail: { totalStars: this.getTotalStars() }
    }));
  }
};

// ========== API 統一管理 ==========
const API = {
  // Google Sheets API 基礎URL - 使用統一的 API 配置
  GOOGLE_SHEETS_API: "",
  _offlineWarned: false,

  getApiUrl() {
    return (typeof window.GameAPIConfig !== 'undefined' && window.GameAPIConfig.quizScoreApi)
      ? window.GameAPIConfig.quizScoreApi
      : this.GOOGLE_SHEETS_API;
  },

  // 通用請求方法
  async request(action, params = {}) {
    const apiUrl = this.getApiUrl();

    if (!apiUrl) {
      if (!this._offlineWarned) {
        console.log('[API] 尚未設定 quizScoreApi，使用離線模式');
        this._offlineWarned = true;
      }
      throw new Error('API URL 未設定');
    }

    try {
      const formData = new URLSearchParams();
      formData.append('action', action);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      if (!response.ok) {
        console.error('[API Error]', action, 'Status:', response.status, 'URL:', apiUrl);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`API請求失敗 (${action}):`, error);
      throw error;
    }
  },

  // 排行榜相關
  async getQuizLeaderboard(category = null) {
    const apiUrl = this.getApiUrl();
    if (!apiUrl) {
      return { success: true, leaderboard: [] };
    }
    try {
      const params = category ? { category } : {};
      const data = await this.request('getQuizLeaderboard', params);
      // 若回傳是舊式陣列或沒有 success 標記，包成統一格式
      return data && data.success ? data : { success: true, leaderboard: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.warn('[API] 排行榜請求失敗，返回離線資料:', error);
      return { success: true, leaderboard: [] };
    }
  },

  async addQuizScore(scoreData) {
    const apiUrl = this.getApiUrl();
    if (!apiUrl) {
      return { success: false, error: 'API URL 未設定' };
    }
    try {
      return await this.request('addQuizScore', scoreData);
    } catch (error) {
      console.warn('[API] 分數上傳失敗:', error);
      return { success: false, error: error.message };
    }
  }
};

// ========== 音效統一管理 ==========
const SoundManager = {
  sounds: {},
  bgm: null,
  bgmVolume: 0.5,
  sfxVolume: 0.7,
  muted: false,
  
  init() {
    // 初始化背景音樂
    const bgmElement = document.getElementById('bgm');
    if (bgmElement) {
      this.bgm = bgmElement;
      this.bgm.volume = this.bgmVolume;
    }
    
    // 載入常用音效
    this.loadSound('click', 'sound/click.mp3');
    this.loadSound('star', 'sound/shine.mp3');
  },
  
  loadSound(name, src) {
    const audio = new Audio(src);
    audio.volume = this.sfxVolume;
    audio.preload = 'auto';
    this.sounds[name] = audio;
  },
  
  play(name) {
    if (this.muted) return;
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.warn(`播放音效 ${name} 失敗:`, e));
    }
  },
  
  playBGM(src = null) {
    if (this.muted) return;
    if (src && this.bgm) {
      this.bgm.src = src;
    }
    if (this.bgm) {
      this.bgm.play().catch(e => console.warn('播放背景音樂失敗:', e));
    }
  },
  
  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  },
  
  setMuted(muted) {
    this.muted = muted;
    if (this.bgm) {
      this.bgm.muted = muted;
    }
    Object.values(this.sounds).forEach(sound => {
      sound.muted = muted;
    });
  }
};

// ========== 排行榜工具函數 ==========
const LeaderboardUtils = {
  // 分類名稱對應表
  categoryNames: {
    'all': '全部關卡',
    'aries': '牡羊座', 'taurus': '金牛座', 'gemini': '雙子座', 'cancer': '巨蟹座',
    'leo': '獅子座', 'virgo': '處女座', 'libra': '天秤座', 'scorpio': '天蠍座',
    'sagittarius': '射手座', 'capricorn': '摩羯座', 'aquarius': '水瓶座', 'pisces': '雙魚座',
    'andromeda': '仙女座', 'cygnus': '天鵝座', 'orion': '獵戶座', 'pegasus': '飛馬座',
    'cassiopeia': '仙后座', 'scorpius': '天蠍座', 'phoenix': '鳳凰座', 'vela': '船帆座'
  },
  
  normalizeCategory(category) {
    return String(category || '').trim().toLowerCase();
  },
  
  normalizeName(name, fallbackKey = null) {
    const str = String(name ?? '').trim();
    if (str) return str;
    return fallbackKey ? `匿名玩家#${fallbackKey}` : '匿名玩家';
  },
  
  formatTime(seconds) {
    const value = Math.max(0, Math.round(Number(seconds) || 0));
    if (value <= 0) return '未記錄';
    if (value < 60) return `${value}秒`;
    const m = Math.floor(value / 60);
    const s = value % 60;
    return `${m}分${s}秒`;
  },
  
  // 處理排行榜數據：排序、去重、標記名次
  processLeaderboardData(data, deduplicate = false) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    // 去重（同一玩家在同一關卡只保留最佳成績）
    if (deduplicate) {
      const bestRecords = this.getBestRecordsPerPlayerAndStage(data);
      return this.sortAndRankLeaderboard(bestRecords);
    }

    // 不去重時，直接排序和標記排名
    return this.sortAndRankLeaderboard(data);
  },

  // 獲取每個玩家的最佳紀錄（不區分關卡）
  getBestRecordsPerPlayer(data) {
    const bestMap = new Map();

    data.forEach(record => {
      const playerKey = this.getPlayerKey(record);

      const existing = bestMap.get(playerKey);

      if (!existing) {
        bestMap.set(playerKey, record);
        return;
      }

      if (this.isBetterRecord(record, existing)) {
        bestMap.set(playerKey, record);
      }
    });

    return Array.from(bestMap.values());
  },

  // 獲取每個玩家每個關卡的最佳紀錄（保留此函式以備其他用途）
  getBestRecordsPerPlayerAndStage(data) {
    const bestMap = new Map();

    data.forEach(record => {
      const playerKey = this.getPlayerKey(record);
      const stageKey = this.getStageKey(record);
      const uniqueKey = `${playerKey}::${stageKey}`;

      const existing = bestMap.get(uniqueKey);

      if (!existing) {
        bestMap.set(uniqueKey, record);
        return;
      }

      if (this.isBetterRecord(record, existing)) {
        bestMap.set(uniqueKey, record);
      }
    });

    return Array.from(bestMap.values());
  },

  // 獲取玩家唯一鍵（優先使用玩家ID）
  getPlayerKey(record) {
    return record.playerId || record.userId || record.studentId || record.accountId ||
           this.normalizePlayerName(record.playerName || record.player || record.name || '');
  },

  // 獲取關卡唯一鍵
  getStageKey(record) {
    return record.categoryKey || record.levelId || record.stageId ||
           this.normalizeCategory(record.category || record.stage || record.level || '');
  },

  // 標準化玩家名稱（只用於比對，不改變顯示）
  normalizePlayerName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  },

  // 標準化關卡名稱
  normalizeCategory(category) {
    return String(category || '').trim().toLowerCase();
  },

  // 判斷哪筆紀錄更好
  isBetterRecord(a, b) {
    const scoreA = Number(a.score) || 0;
    const scoreB = Number(b.score) || 0;

    if (scoreA !== scoreB) {
      return scoreA > scoreB;
    }

    const correctA = this.getCorrectCount(a);
    const correctB = this.getCorrectCount(b);

    if (correctA !== correctB) {
      return correctA > correctB;
    }

    const totalTimeA = this.getTotalTimeSeconds(a);
    const totalTimeB = this.getTotalTimeSeconds(b);

    if (totalTimeA !== totalTimeB) {
      return totalTimeA < totalTimeB;
    }

    const avgA = this.getAverageSeconds(a);
    const avgB = this.getAverageSeconds(b);

    return avgA < avgB;
  },

  // 獲取答對數
  getCorrectCount(record) {
    return record.correct || record.答對 || record.correctAnswers || parseInt(record.score) || 0;
  },

  // 獲取總時間（秒）
  getTotalTimeSeconds(record) {
    return record.totalTime || record.總時間 || record.time || record.duration || 0;
  },

  // 獲取平均時間（秒）
  getAverageSeconds(record) {
    if (record.averageTime) return record.averageTime;
    const total = this.getTotalTimeSeconds(record);
    const correct = this.getCorrectCount(record);
    return correct > 0 ? total / correct : 0;
  },

  // 排序並標記排名
  sortAndRankLeaderboard(data) {
    const sorted = [...data].sort((a, b) => {
      const scoreA = Number(a.score) || 0;
      const scoreB = Number(b.score) || 0;

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      const correctA = this.getCorrectCount(a);
      const correctB = this.getCorrectCount(b);

      if (correctA !== correctB) {
        return correctB - correctA;
      }

      const totalTimeA = this.getTotalTimeSeconds(a);
      const totalTimeB = this.getTotalTimeSeconds(b);

      return totalTimeA - totalTimeB;
    });

    let currentRank = 1;
    sorted.forEach((item, idx) => {
      if (idx > 0) {
        const prevItem = sorted[idx - 1];
        const prevScore = Number(prevItem.score) || 0;
        const prevCorrect = this.getCorrectCount(prevItem);
        const prevTime = this.getTotalTimeSeconds(prevItem);

        const currScore = Number(item.score) || 0;
        const currCorrect = this.getCorrectCount(item);
        const currTime = this.getTotalTimeSeconds(item);

        if (currScore !== prevScore || currCorrect !== prevCorrect || currTime !== prevTime) {
          currentRank = idx + 1;
        }
      }
      item.rank = currentRank;
    });

    return sorted;
  },
  
  // 渲染排行榜表格
  renderTable(data, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`找不到容器: ${containerId}`);
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = this.renderEmptyState(options.emptyMessage || '目前沒有排行榜資料');
      return;
    }

    const {
      showCategory = true,
      showOriginalRank = false,
      maxRows = null
    } = options;

    const currentPlayer = (typeof UserManager !== 'undefined' ? UserManager.getPlayerName() : '') || '';

    const rows = (maxRows ? data.slice(0, maxRows) : data).map((item, idx) => {
      const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (item.rank || idx + 1);
      const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : '';
      const cat = this.categoryNames[this.normalizeCategory(item.category)] || item.category || '-';
      const avg = item.totalTime && item.correctCount
        ? this.formatTime(Math.round(item.totalTime / item.correctCount))
        : '-';
      const total = item.totalTime ? this.formatTime(item.totalTime) : '-';

      // 標註當前玩家
      const isCurrentPlayer = currentPlayer &&
        this.normalizePlayerName(item.playerName || '') === this.normalizePlayerName(currentPlayer);
      const rowClass = [rankClass, isCurrentPlayer ? 'is-me' : ''].filter(Boolean).join(' ');
      const rankCellClass = `rank-cell ${isCurrentPlayer ? 'my-rank' : ''}`;

      // 排名變化顯示
      let rankChangeHtml = '';
      if (item.rankChange !== undefined && item.rankChange !== null) {
        const changeClass = item.rankChange.type === 'up' ? 'rank-change-up' :
                           item.rankChange.type === 'down' ? 'rank-change-down' :
                           item.rankChange.type === 'new' ? 'rank-change-new' : 'rank-change-same';
        rankChangeHtml = `
          <td class="rank-change-cell">
            <span class="rank-change ${changeClass}">${item.rankChange.display}</span>
            <span class="previous-rank-text">${item.rankChange.subText}</span>
          </td>
        `;
      } else {
        // 如果沒有 rankChange 資料，顯示空格或預設值
        rankChangeHtml = `<td class="rank-change-cell"><span class="rank-change rank-change-same">—</span><span class="previous-rank-text">尚無資料</span></td>`;
      }

      return `
        <tr class="${rowClass}">
          <td class="${rankCellClass}">${rankIcon}</td>
          <td class="player-cell"><span class="player-name">${item.playerName || '匿名玩家'}</span></td>
          ${showCategory ? `<td><span class="stage-tag">${cat}</span></td>` : ''}
          <td class="score-cell">${item.score}</td>
          <td class="correct-cell">${item.correctCount || 0}/20</td>
          <td class="average-cell">${avg}</td>
          <td class="total-time-cell">${total}</td>
          ${showOriginalRank ? `<td class="rank-cell">${item.originalRank || '-'}</td>` : ''}
          ${rankChangeHtml}
        </tr>
      `;
    }).join('');

    const categoryHeader = showCategory ? '<th>關卡</th>' : '';
    const originalRankHeader = showOriginalRank ? '<th>原始名次</th>' : '';
    const rankChangeHeader = '<th>排名變化</th>';

    container.innerHTML = `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>排名</th><th>玩家</th>${categoryHeader}<th>分數</th><th>答對</th><th>平均</th><th>總時間</th>${originalRankHeader}${rankChangeHeader}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="text-align:center;color:#888;margin-top:10px;font-size:.9rem;">
        共 ${data.length} ${options.deduplicate ? '位獨立玩家' : '名玩家'}（依分數排序）
      </div>
    `;
  },
  
  renderEmptyState(message) {
    return `
      <div style="text-align:center;color:#888;padding:24px;background:rgba(0,0,0,.25);border-radius:12px;">
        <div style="font-size:2.4rem;margin-bottom:10px;">📭</div>
        <div style="color:#00ffff;font-weight:bold;margin-bottom:6px;">${message}</div>
        <div style="color:#aaa;">玩一場星座挑戰後即可成為第一名！</div>
      </div>
    `;
  },

  // 排行榜快照管理
  saveLeaderboardSnapshot(category, leaderboard) {
    if (!Array.isArray(leaderboard)) return;
    
    const snapshot = leaderboard.map((item, index) => ({
      playerName: item.playerName || '匿名玩家',
      rank: index + 1,
      score: item.score,
      category: item.category
    }));
    
    const key = `leaderboardSnapshot_${category || 'all'}`;
    Storage.set(key, {
      data: snapshot,
      timestamp: Date.now()
    });
  },

  getLeaderboardSnapshot(category) {
    const key = `leaderboardSnapshot_${category || 'all'}`;
    const snapshot = Storage.get(key, null);
    return snapshot && snapshot.data ? snapshot.data : [];
  },

  // 計算排名變化
  calculateRankChange(currentRank, previousRank) {
    if (previousRank === null || previousRank === undefined) {
      return {
        type: 'new',
        change: null,
        previousRank: null,
        display: 'NEW',
        subText: '首次進榜'
      };
    }

    const change = previousRank - currentRank;

    if (change > 0) {
      return {
        type: 'up',
        change: change,
        previousRank: previousRank,
        display: `↑ ${change}`,
        subText: `原本第${previousRank}名`
      };
    } else if (change < 0) {
      return {
        type: 'down',
        change: Math.abs(change),
        previousRank: previousRank,
        display: `↓ ${Math.abs(change)}`,
        subText: `原本第${previousRank}名`
      };
    } else {
      return {
        type: 'same',
        change: 0,
        previousRank: previousRank,
        display: '—',
        subText: '排名不變'
      };
    }
  },

  // 為排行榜資料加入排名變化
  addRankChanges(leaderboard, category, snapshotKey = null) {
    if (!Array.isArray(leaderboard)) return leaderboard;

    // 使用自定義 snapshotKey 或預設的 category
    const effectiveSnapshotKey = snapshotKey || category;
    const previousSnapshot = this.getLeaderboardSnapshot(effectiveSnapshotKey);
    const previousRankMap = {};

    // 建立上一個排名的映射（使用「玩家名稱+關卡」作為 key）
    previousSnapshot.forEach(item => {
      const key = `${item.playerName || ''}::${item.category || ''}`;
      previousRankMap[key] = item.rank;
    });

    // 為每個玩家計算排名變化
    return leaderboard.map((item, index) => {
      const currentRank = item.rank || (index + 1);
      const key = `${item.playerName || '匿名玩家'}::${item.category || ''}`;
      const previousRank = previousRankMap[key];

      const rankChange = this.calculateRankChange(currentRank, previousRank);

      return {
        ...item,
        currentRank: currentRank,
        previousRank: previousRank,
        rankChange: rankChange
      };
    });
  },

  // 更新排行榜快照（只在上傳新成績時呼叫）
  updateLeaderboardSnapshot(category, leaderboard, snapshotKey = null) {
    const effectiveSnapshotKey = snapshotKey || category;
    this.saveLeaderboardSnapshot(effectiveSnapshotKey, leaderboard);
  },
  
  renderErrorState(error) {
    return `
      <div style="text-align:center;color:#ff6b6b;padding:24px;background:rgba(255,107,107,.12);border-radius:12px;border:1px solid #ff6b6b55;">
        <div style="font-size:2.4rem;margin-bottom:10px;">⚠️</div>
        <div style="font-weight:bold;margin-bottom:8px;">排行榜載入失敗</div>
        <div style="color:#ffb3b3;margin-bottom:12px;">${error?.message || '未知錯誤'}</div>
        <button style="padding:8px 16px;border:none;border-radius:8px;background:#ff6b6b;color:#fff;cursor:pointer;" onclick="location.reload()">重新載入</button>
      </div>
    `;
  }
};

// ========== 頁面初始化工具 ==========
const PageUtils = {
  // 初始化星星顯示
  initStarsDisplay(elementId = 'totalStarsDisplay') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const updateDisplay = () => {
      const stars = Storage.getTotalStars();
      element.textContent = stars;
    };
    
    // 初始顯示
    updateDisplay();
    
    // 監聽更新事件
    window.addEventListener('starsUpdated', updateDisplay);
  },
  
  // 初始化背景音樂控制
  initBGMControl(playButtonId = 'playAudio', muteButtonId = 'muteToggle') {
    const playBtn = document.getElementById(playButtonId);
    const muteBtn = document.getElementById(muteButtonId);
    
    if (!playBtn || !muteBtn) return;
    
    playBtn.addEventListener('click', () => {
      SoundManager.playBGM();
      playBtn.style.display = 'none';
      muteBtn.style.display = 'block';
    });
    
    muteBtn.addEventListener('click', () => {
      SoundManager.setMuted(!SoundManager.muted);
      muteBtn.textContent = SoundManager.muted ? '🔇' : '🔈';
    });
  },
  
  // 添加點擊音效到元素
  addClickSound(...selectors) {
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.addEventListener('click', () => SoundManager.play('click'));
      });
    });
  }
};

// ========== 背景音樂統一控制 ==========
const BGMController = {
  audio: null,
  isPlaying: false,
  volume: 0.3,
  
  init(src = 'sound/午後放鬆時光（純音樂）.mp3', buttonId = 'bgMusicControl') {
    // 創建或獲取音頻元素
    let audio = document.getElementById('backgroundMusic');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'backgroundMusic';
      audio.loop = true;
      document.body.appendChild(audio);
    }
    
    if (src) audio.src = src;
    audio.volume = this.volume;
    this.audio = audio;
    
    // 初始化按鈕
    const btn = document.getElementById(buttonId);
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
      this.updateButton(btn);
    }
    
    // 從 localStorage 恢復狀態
    const savedState = Storage.get('bgMusicState', 'paused');
    if (savedState === 'playing') {
      this.play();
    }
  },
  
  play() {
    if (!this.audio) return;
    this.audio.play().then(() => {
      this.isPlaying = true;
      Storage.set('bgMusicState', 'playing');
      this.updateAllButtons();
    }).catch(e => console.warn('播放背景音樂失敗:', e));
  },
  
  pause() {
    if (!this.audio) return;
    this.audio.pause();
    this.isPlaying = false;
    Storage.set('bgMusicState', 'paused');
    this.updateAllButtons();
  },
  
  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  },
  
  updateButton(btn) {
    if (!btn) return;
    btn.textContent = this.isPlaying ? '🔊' : '🔇';
    btn.classList.toggle('paused', !this.isPlaying);
  },
  
  updateAllButtons() {
    document.querySelectorAll('#bgMusicControl, #toggleMusic, #muteToggle').forEach(btn => {
      this.updateButton(btn);
    });
  }
};

// ========== 用戶名稱統一管理 ==========
const UserManager = {
  getPlayerName() {
    const homeName = (Storage.get('playerName') || '').trim();
    if (homeName) return homeName;
    const current = (Storage.get('currentUser') || '').trim();
    return current || '';
  },
  
  setPlayerName(name) {
    const trimmed = (name || '').trim();
    if (trimmed) {
      Storage.set('playerName', trimmed);
      Storage.set('currentUser', trimmed);
      return true;
    }
    return false;
  },
  
  getCurrentUser() {
    return this.getPlayerName() || ('玩家' + Math.floor(Math.random() * 1000));
  }
};

// 頁面載入時自動初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    SoundManager.init();
  });
} else {
  SoundManager.init();
}

// 導出到全局
window.Storage = Storage;
window.API = API;
window.SoundManager = SoundManager;
window.LeaderboardUtils = LeaderboardUtils;
window.PageUtils = PageUtils;
window.BGMController = BGMController;
window.UserManager = UserManager;

