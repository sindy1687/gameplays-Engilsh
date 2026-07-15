/**
 * GM 管理分頁
 * 功能：管理關卡、卡片、星星資料
 */

// GM 密碼
const GM_PASSWORD = 'admin888';

/**
 * 取得星星 localStorage key
 */
function getStarStorageKey() {
  return 'totalStars';
}

/**
 * 安全讀取星星
 */
function getSafeStars() {
  // 優先使用 StarSystem
  if (typeof StarSystem !== 'undefined' && typeof StarSystem.getTotalStars === 'function') {
    return StarSystem.getTotalStars();
  }

  // 備用方案
  const key = getStarStorageKey();
  const raw = localStorage.getItem(key);
  const value = Number(raw);

  if (!Number.isFinite(value) || Number.isNaN(value) || value < 0) {
    localStorage.setItem(key, '0');
    return 0;
  }

  return Math.floor(value);
}

/**
 * 安全設定星星
 */
function setSafeStars(value) {
  // 優先使用 StarSystem
  if (typeof StarSystem !== 'undefined' && typeof StarSystem.setTotalStars === 'function') {
    const result = StarSystem.setTotalStars(value);
    refreshStarDisplays();
    return result;
  }

  // 備用方案
  const key = getStarStorageKey();
  const number = Number(value);
  const safeValue = Number.isFinite(number) && !Number.isNaN(number)
    ? Math.max(0, Math.floor(number))
    : 0;

  localStorage.setItem(key, String(safeValue));
  refreshStarDisplays();

  return safeValue;
}

/**
 * 安全加星星
 */
function addSafeStars(amount) {
  // 優先使用 StarSystem
  if (typeof StarSystem !== 'undefined' && typeof StarSystem.addTotalStars === 'function') {
    return StarSystem.addTotalStars(amount, 'GM 操作');
  }

  // 備用方案
  return setSafeStars(getSafeStars() + Number(amount || 0));
}

/**
 * 安全扣星星
 */
function removeSafeStars(amount) {
  // 優先使用 StarSystem
  if (typeof StarSystem !== 'undefined' && typeof StarSystem.spendTotalStars === 'function') {
    const result = StarSystem.spendTotalStars(amount, 'GM 操作');
    if (result.ok) {
      refreshStarDisplays();
      return result.totalStars;
    }
    return getSafeStars();
  }

  // 備用方案
  return setSafeStars(getSafeStars() - Number(amount || 0));
}

/**
 * 刷新星星顯示
 */
function refreshStarDisplays() {
  const stars = getSafeStars();

  document.querySelectorAll(
    '#starCount, #starsCount, #playerStars, #userStars, .star-count, .stars-count, .player-stars, [data-star-count]'
  ).forEach((element) => {
    element.textContent = String(stars);
  });
}

// localStorage key 設定（依照專案實際使用的 key）
const GM_STORAGE_KEYS = {
  // 使用者
  playerName: 'playerName',

  // 星星
  stars: 'totalStars',

  // 關卡
  grammarGameData: 'grammarGameData',
  grammarTotalProgress: 'grammar_total_progress',

  // 星座圖鑑
  unlocked: 'unlocked',
  passedAtlas: 'passed_atlas',

  // 希臘神祇
  greekGods: 'unlockedGreek',

  // 卡片
  ownedCards: 'ownedCards',
  unlockedCards: 'unlockedCards',

  // 商城/交易
  marketItems: 'marketItems',
  tradeRecords: 'tradeRecords',
  bargainRecords: 'bargainRecords',
  sellRecords: 'sellRecords',
  pendingStars: 'pendingStars',

  // 抽卡
  drawHistory: 'drawHistory',
  pityCounter: 'pityCounter',

  // 設定
  theme: 'theme',
  soundEnabled: 'soundEnabled',
  musicEnabled: 'musicEnabled',
  background: 'background',

  // Google
  lastDriveBackupUploadAt: 'lastDriveBackupUploadAt',
  lastDriveBackupDownloadAt: 'lastDriveBackupDownloadAt',

  // GM
  logs: 'gmActionLogs',
  lastUpdatedAt: 'gmLastUpdatedAt'
};

// 關卡名稱對照表（和 grammar_tower_select.html 一致）
const GM_LEVEL_NAMES = {
  '1': '第一關：喚醒樹木守護者',
  '2': '第二關：挑戰黑暗迷霧',
  '3': '第三關：征服星辰之塔',
  '4': '第四關：探索時空隧道',
  '5': '第五關：破解魔法陣',
  '6': '第六關：守護水晶神殿',
  '7': '第七關：召喚風暴精靈',
  '8': '第八關：穿越暗影森林',
  '9': '第九關：喚醒龍之傳說',
  '10': '第十關：掌控元素之力',
  '11': '第十一關：解封禁忌咒語',
  '12': '第十二關：征服星際戰艦',
  '13': '第十三關：開啟次元之門',
  '14': '第十四關：編織時空織錦',
  '15': '第十五關：掌握命運之輪',
  '16': '第十六關：成為文法之王',
  '17': '第十七關：破解時間密碼',
  '18': '第十八關：時空交錯挑戰',
  '19': '第十九關：預見未來之光',
  '20': '第二十關：否定未來陰霾',
  '21': '第二十一關：探問未來奧秘',
  '22': '第二十二關：比較級之力'
};

// 星座圖鑑分類（和 atlas.html 一致）
const GM_ATLAS_CATEGORIES = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio",
  "sagittarius", "capricorn", "aquarius", "pisces", "andromeda", "cygnus", "orion", "pegasus",
  "cassiopeia", "scorpius", "phoenix", "vela"
];

// 星座圖鑑名稱對照表
const GM_ATLAS_NAMES = {
  "aries": "白羊座 Aries",
  "taurus": "金牛座 Taurus",
  "gemini": "雙子座 Gemini",
  "cancer": "巨蟹座 Cancer",
  "leo": "獅子座 Leo",
  "virgo": "處女座 Virgo",
  "libra": "天秤座 Libra",
  "scorpio": "天蠍座 Scorpio",
  "sagittarius": "射手座 Sagittarius",
  "capricorn": "摩羯座 Capricorn",
  "aquarius": "水瓶座 Aquarius",
  "pisces": "雙魚座 Pisces",
  "andromeda": "仙女座 Andromeda",
  "cygnus": "天鵝座 Cygnus",
  "orion": "獵戶座 Orion",
  "pegasus": "飛馬座 Pegasus",
  "cassiopeia": "仙后座 Cassiopeia",
  "scorpius": "天蠍座 Scorpius",
  "phoenix": "鳳凰座 Phoenix",
  "vela": "船帆座 Vela"
};

// 希臘神祇清單（和 atlas.html 一致）
const GM_GREEK_GODS = [
  { id: 'zeus', name: '宙斯', english: 'Zeus' },
  { id: 'hera', name: '赫拉', english: 'Hera' },
  { id: 'poseidon', name: '波塞頓', english: 'Poseidon' },
  { id: 'demeter', name: '得墨忒耳', english: 'Demeter' },
  { id: 'athena', name: '雅典娜', english: 'Athena' },
  { id: 'apollo', name: '阿波羅', english: 'Apollo' },
  { id: 'artemis', name: '阿爾忒彌斯', english: 'Artemis' },
  { id: 'ares', name: '阿瑞斯', english: 'Ares' },
  { id: 'aphrodite', name: '阿芙蘿黛蒂', english: 'Aphrodite' },
  { id: 'hephaestus', name: '赫菲斯托斯', english: 'Hephaestus' },
  { id: 'hermes', name: '赫耳墨斯', english: 'Hermes' },
  { id: 'hestia', name: '赫斯提亞', english: 'Hestia' },
  { id: 'dionysus', name: '狄俄尼索斯', english: 'Dionysus' },
  { id: 'hades', name: '哈迪斯', english: 'Hades' },
  { id: 'persephone', name: '珀爾塞福涅', english: 'Persephone' },
  { id: 'eros', name: '厄洛斯', english: 'Eros' },
  { id: 'nike', name: '尼刻', english: 'Nike' },
  { id: 'gaia', name: '蓋婭', english: 'Gaia' },
  { id: 'atlas', name: '阿特拉斯', english: 'Atlas' },
  { id: 'cronus', name: '克洛諾斯', english: 'Cronus' },
  { id: 'rhea', name: '瑞亞', english: 'Rhea' },
  { id: 'prometheus', name: '普羅米修斯', english: 'Prometheus' }
];

// 全域變數
let gmCurrentTab = 'levels';
let gmCardsData = [];
let gmLevelsData = [];

/**
 * 初始化 GM 頁面
 */
function initGMPage() {
  const loginBtn = document.getElementById('gmLoginBtn');
  const passwordInput = document.getElementById('gmPasswordInput');

  if (loginBtn) {
    loginBtn.addEventListener('click', loginGM);
  }

  if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loginGM();
      }
    });
  }

  // Tab 切換
  const tabButtons = document.querySelectorAll('.gm-tabs button');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-gm-tab');
      switchGMTab(tabName);
    });
  });

  // 星星管理按鈕
  document.getElementById('gmAddStarsBtn')?.addEventListener('click', addGMStars);
  document.getElementById('gmRemoveStarsBtn')?.addEventListener('click', removeGMStars);
  document.getElementById('gmSetStarsBtn')?.addEventListener('click', setGMStars);
  document.getElementById('gmResetStarsBtn')?.addEventListener('click', resetGMStars);

  // 使用者管理按鈕
  document.getElementById('gmSavePlayerNameBtn')?.addEventListener('click', saveGMPlayerName);

  // 關卡管理按鈕
  document.getElementById('gmUnlockAllLevelsBtn')?.addEventListener('click', unlockAllGMLevels);
  document.getElementById('gmLockAllLevelsBtn')?.addEventListener('click', lockAllGMLevels);
  document.getElementById('gmCompleteAllLevelsBtn')?.addEventListener('click', completeAllGMLevels);
  document.getElementById('gmClearAllLevelsBtn')?.addEventListener('click', clearAllGMLevels);

  // 卡片管理按鈕
  document.getElementById('gmUnlockAllCardsBtn')?.addEventListener('click', unlockAllGMCards);
  document.getElementById('gmLockAllCardsBtn')?.addEventListener('click', lockAllGMCards);

  // 星座圖鑑管理按鈕
  document.getElementById('gmUnlockAllZodiacBtn')?.addEventListener('click', unlockAllGMZodiac);
  document.getElementById('gmLockAllZodiacBtn')?.addEventListener('click', lockAllGMZodiac);

  // 希臘神祇管理按鈕
  document.getElementById('gmUnlockAllGodsBtn')?.addEventListener('click', unlockAllGMGreekGods);
  document.getElementById('gmLockAllGodsBtn')?.addEventListener('click', lockAllGMGreekGods);

  // 希臘神祇篩選
  document.getElementById('gmGodSearchInput')?.addEventListener('input', renderGMGreekGods);
  document.getElementById('gmGodUnlockFilter')?.addEventListener('change', renderGMGreekGods);

  // 商城交易按鈕
  document.getElementById('gmClearMarketBtn')?.addEventListener('click', clearGMMarket);
  document.getElementById('gmClearTradeBtn')?.addEventListener('click', clearGMTrade);
  document.getElementById('gmClearBargainBtn')?.addEventListener('click', clearGMBargain);

  // 抽卡管理按鈕
  document.getElementById('gmClearGachaBtn')?.addEventListener('click', clearGMGacha);
  document.getElementById('gmResetPityBtn')?.addEventListener('click', resetGMPity);

  // 系列抽卡池管理按鈕
  document.getElementById('gmSetSeriesTicketBtn')?.addEventListener('click', setGMSeriesTicket);
  document.getElementById('gmAddSeriesTicketBtn')?.addEventListener('click', addGMSeriesTicket);
  document.getElementById('gmClearSeriesGachaBtn')?.addEventListener('click', clearGMSeriesGacha);
  document.getElementById('gmRefreshSeriesBtn')?.addEventListener('click', renderGMSeries);
  document.getElementById('gmSeriesSelect')?.addEventListener('change', renderGMSeriesDetails);

  // 設定按鈕
  document.getElementById('gmSaveThemeBtn')?.addEventListener('click', saveGMTheme);
  document.getElementById('gmClearSettingsBtn')?.addEventListener('click', clearGMSettings);

  // 備份按鈕
  document.getElementById('gmDownloadBackupBtn')?.addEventListener('click', downloadGMBackup);
  document.getElementById('gmUploadDriveBtn')?.addEventListener('click', uploadGMDrive);
  document.getElementById('gmDownloadDriveBtn')?.addEventListener('click', downloadGMDrive);

  // 資料檢查按鈕
  document.getElementById('gmStorageSearchBtn')?.addEventListener('click', searchGMStorage);

  // 卡片篩選
  document.getElementById('gmCardSearchInput')?.addEventListener('input', renderGMCards);
  document.getElementById('gmCardSeriesFilter')?.addEventListener('change', renderGMCards);
  document.getElementById('gmCardRarityFilter')?.addEventListener('change', renderGMCards);

  // 操作紀錄
  document.getElementById('gmClearLogsBtn')?.addEventListener('click', clearGMLogs);

  // 事件代理：星座圖鑑操作
  document.addEventListener('click', (event) => {
    const unlockBtn = event.target.closest('[data-gm-unlock-zodiac]');
    if (unlockBtn) {
      unlockGMZodiac(unlockBtn.dataset.gmUnlockZodiac);
      return;
    }

    const lockBtn = event.target.closest('[data-gm-lock-zodiac]');
    if (lockBtn) {
      lockGMZodiac(lockBtn.dataset.gmLockZodiac);
      return;
    }

    const unlockGodBtn = event.target.closest('[data-gm-unlock-god]');
    if (unlockGodBtn) {
      unlockGMGreekGod(unlockGodBtn.dataset.gmUnlockGod);
      return;
    }

    const lockGodBtn = event.target.closest('[data-gm-lock-god]');
    if (lockGodBtn) {
      lockGMGreekGod(lockGodBtn.dataset.gmLockGod);
      return;
    }
  });

  // 讀取卡片資料
  loadGMCardsData();

  // 同步舊的 unlockedCards 到 ownedCards
  gmSyncOldUnlockedCardsToWarehouse();
}

/**
 * GM 登入
 */
function loginGM() {
  const passwordInput = document.getElementById('gmPasswordInput');
  const messageEl = document.getElementById('gmLoginMessage');
  const password = passwordInput?.value;

  if (password === GM_PASSWORD) {
    document.getElementById('gmLoginPanel').hidden = true;
    document.getElementById('gmDashboard').hidden = false;
    refreshGMPage();
  } else {
    messageEl.textContent = '管理密碼錯誤。';
    messageEl.classList.add('error');
  }
}

/**
 * 切換 GM 分頁
 */
function switchGMTab(tabName) {
  gmCurrentTab = tabName;

  // 更新按鈕狀態
  const tabButtons = document.querySelectorAll('.gm-tabs button');
  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-gm-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 切換面板
  const panels = document.querySelectorAll('.gm-tab-panel');
  panels.forEach(panel => {
    panel.hidden = true;
  });

  const activePanel = document.getElementById(`gmTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (activePanel) {
    activePanel.hidden = false;
  }

  // 刷新對應內容
  if (tabName === 'summary') {
    renderGMSummary();
  } else if (tabName === 'user') {
    renderGMUser();
  } else if (tabName === 'stars') {
    renderGMStars();
  } else if (tabName === 'levels') {
    renderGMLevels();
  } else if (tabName === 'zodiac') {
    renderGMZodiac();
  } else if (tabName === 'gods') {
    renderGMGreekGods();
  } else if (tabName === 'cards') {
    renderGMCards();
  } else if (tabName === 'market') {
    renderGMMarket();
  } else if (tabName === 'gacha') {
    renderGMGacha();
  } else if (tabName === 'settings') {
    renderGMSettings();
  } else if (tabName === 'backup') {
    renderGMBackup();
  } else if (tabName === 'inspector') {
    renderGMStorageInspector();
  } else if (tabName === 'logs') {
    renderGMLogs();
  }
}

/**
 * 讀取卡片資料
 */
function loadGMCardsData() {
  if (typeof window.allCards !== 'undefined' && Array.isArray(window.allCards)) {
    gmCardsData = window.allCards;
  } else {
    console.error('找不到原本卡片資料 window.allCards，請確認 gm.html 是否已引入 js/cards.js');
    gmCardsData = [];
  }
}

/**
 * 統一卡片 ID (使用 card.word 當主鍵)
 */
function getGMCardKey(card) {
  return String(
    card.word ||
    card.id ||
    card.cardId ||
    card.zh ||
    card.name ||
    ""
  ).trim();
}

/**
 * 取得所有卡片
 */
function getGMAllCards() {
  if (Array.isArray(window.allCards)) return window.allCards;
  if (Array.isArray(window.cards)) return window.cards;
  if (Array.isArray(window.CARDS)) return window.CARDS;
  if (Array.isArray(window.ALL_CARDS)) return window.ALL_CARDS;

  if (typeof allCards !== "undefined" && Array.isArray(allCards)) {
    return allCards;
  }

  return [];
}

/**
 * 讀取卡片倉庫資料 (與卡片倉庫同步)
 */
function getGMOwnedCardsObject() {
  if (window.LinkageSystem && LinkageSystem.cards && typeof LinkageSystem.cards.getOwnedCards === "function") {
    const owned = LinkageSystem.cards.getOwnedCards();
    return owned && typeof owned === "object" ? owned : {};
  }

  try {
    return JSON.parse(localStorage.getItem("ownedCards") || "{}") || {};
  } catch (e) {
    return {};
  }
}

/**
 * 儲存卡片倉庫資料 (與卡片倉庫同步)
 */
function saveGMOwnedCardsObject(ownedCards) {
  localStorage.setItem("ownedCards", JSON.stringify(ownedCards || {}));

  if (window.LinkageSystem && LinkageSystem.cards) {
    if (typeof LinkageSystem.cards.setOwnedCards === "function") {
      LinkageSystem.cards.setOwnedCards(ownedCards || {});
    }

    if (typeof LinkageSystem.cards.saveOwnedCards === "function") {
      LinkageSystem.cards.saveOwnedCards(ownedCards || {});
    }
  }

  if (typeof saveUserData === "function") {
    saveUserData();
  }

  if (typeof savePlayerData === "function") {
    const data = typeof getPlayerData === "function" ? getPlayerData() : null;
    if (data) {
      data.ownedCards = ownedCards || {};
      data.cards = ownedCards || {};
      savePlayerData(data);
    }
  }

  if (typeof autoSaveAllData === "function") {
    autoSaveAllData();
  }

  if (typeof syncPlayerDataToCloud === "function") {
    try {
      const data = typeof getPlayerData === "function" ? getPlayerData() : null;
      syncPlayerDataToCloud(data);
    } catch (e) {
      console.warn("GM 卡片同步雲端失敗：", e);
    }
  }
}

/**
 * GM 解鎖單張卡片到倉庫
 */
function gmUnlockCardToWarehouse(card) {
  const key = getGMCardKey(card);

  if (!key) {
    console.warn("GM 解鎖卡片失敗：找不到卡片 key", card);
    return;
  }

  const ownedCards = getGMOwnedCardsObject();

  ownedCards[key] = {
    ...(ownedCards[key] || {}),
    word: card.word || key,
    zh: card.zh || card.name || card.cardName || "",
    category: card.category || card.series || card.seriesName || "",
    rarity: card.rarity || "普通",
    image: card.image || card.imageUrl || card.img || "",
    unlocked: true,
    owned: true,
    count: Math.max(1, Number(ownedCards[key]?.count || 0)),
    source: "GM",
    unlockedAt: new Date().toISOString()
  };

  saveGMOwnedCardsObject(ownedCards);

  if (typeof renderGMCards === "function") {
    renderGMCards();
  }

  if (typeof refreshGMPage === "function") {
    refreshGMPage();
  }

  if (typeof renderCardGrid === "function") {
    renderCardGrid();
  }

  alert("已解鎖卡片並同步到卡片倉庫：" + (card.zh || card.name || key));
}

/**
 * GM 鎖定單張卡片從倉庫
 */
function gmLockCardFromWarehouse(card) {
  const key = getGMCardKey(card);

  if (!key) {
    console.warn("GM 鎖定卡片失敗：找不到卡片 key", card);
    return;
  }

  const ownedCards = getGMOwnedCardsObject();

  if (ownedCards[key]) {
    delete ownedCards[key];
  }

  saveGMOwnedCardsObject(ownedCards);

  if (typeof renderGMCards === "function") {
    renderGMCards();
  }

  if (typeof refreshGMPage === "function") {
    refreshGMPage();
  }

  if (typeof renderCardGrid === "function") {
    renderCardGrid();
  }

  alert("已鎖定卡片並從卡片倉庫移除：" + (card.zh || card.name || key));
}

/**
 * 同步舊的 unlockedCards 到 ownedCards
 */
function gmSyncOldUnlockedCardsToWarehouse() {
  const allCards = getGMAllCards();
  const ownedCards = getGMOwnedCardsObject();

  let oldUnlocked = {};

  try {
    oldUnlocked = JSON.parse(localStorage.getItem("unlockedCards") || "{}") || {};
  } catch (e) {
    oldUnlocked = {};
  }

  allCards.forEach(card => {
    const key = getGMCardKey(card);
    if (!key) return;

    if (oldUnlocked[key] || oldUnlocked[card.word] || oldUnlocked[card.zh]) {
      ownedCards[key] = {
        ...(ownedCards[key] || {}),
        word: card.word || key,
        zh: card.zh || card.name || "",
        category: card.category || card.series || "",
        rarity: card.rarity || "普通",
        image: card.image || card.imageUrl || "",
        unlocked: true,
        owned: true,
        count: Math.max(1, Number(ownedCards[key]?.count || 0)),
        source: "GM舊資料同步",
        unlockedAt: new Date().toISOString()
      };
    }
  });

  saveGMOwnedCardsObject(ownedCards);
}

/**
 * 取得目前星星
 */
function getCurrentStars() {
  return getSafeStars();
}

/**
 * 設定星星
 */
function setCurrentStars(amount) {
  setSafeStars(amount);
}

/**
 * 給予星星
 */
function addGMStars() {
  const input = document.getElementById('gmStarsInput') || document.getElementById('gmStarAmountInput');
  const amount = parseInt(input?.value || '100');

  if (!amount || amount <= 0 || isNaN(amount)) {
    showGMStatus('請輸入有效的星星數量。', 'error');
    return;
  }

  const currentStars = getCurrentStars();
  addSafeStars(amount);

  addGMLog({
    action: '給予星星',
    targetType: 'stars',
    targetId: 'stars',
    amount: amount,
    beforeValue: currentStars,
    afterValue: currentStars + amount
  });

  showGMStatus('星星已增加。', 'success');
  refreshGMPage();
  notifyGameDataChanged();
}

/**
 * 扣除星星
 */
function removeGMStars() {
  const input = document.getElementById('gmStarsInput') || document.getElementById('gmStarAmountInput');
  const amount = parseInt(input?.value || '100');

  if (!amount || amount <= 0 || isNaN(amount)) {
    showGMStatus('請輸入有效的星星數量。', 'error');
    return;
  }

  const currentStars = getCurrentStars();
  if (currentStars < amount) {
    showGMStatus('星星不足，無法扣除。', 'error');
    return;
  }

  removeSafeStars(amount);

  addGMLog({
    action: '扣除星星',
    targetType: 'stars',
    targetId: 'stars',
    amount: amount,
    beforeValue: currentStars,
    afterValue: currentStars - amount
  });

  showGMStatus('星星已扣除。', 'success');
  refreshGMPage();
  notifyGameDataChanged();
}

/**
 * 設定星星數量
 */
function setGMStars() {
  const input = document.getElementById('gmStarsInput') || document.getElementById('gmStarAmountInput');
  const amount = parseInt(input?.value);

  if (amount === null || amount < 0) {
    showGMStatus('請輸入有效的星星數量。', 'error');
    return;
  }

  if (!confirm('確定要設定星星數量嗎？此操作會修改目前資料。')) {
    return;
  }

  const currentStars = getCurrentStars();
  setSafeStars(amount);

  addGMLog({
    action: '設定星星數量',
    targetType: 'stars',
    targetId: 'stars',
    amount: amount,
    beforeValue: currentStars,
    afterValue: amount
  });

  showGMStatus('星星數量已設定。', 'success');
  refreshGMPage();
  notifyGameDataChanged();
}

/**
 * 星星歸零
 */
function resetGMStars() {
  if (!confirm('確定要執行此操作嗎？此操作會修改目前資料。')) {
    return;
  }

  const currentStars = getCurrentStars();
  setSafeStars(0);

  addGMLog({
    action: '星星歸零',
    targetType: 'stars',
    targetId: 'stars',
    amount: 0,
    beforeValue: currentStars,
    afterValue: 0
  });

  showGMStatus('星星已歸零。', 'success');
  refreshGMPage();
  notifyGameDataChanged();
}

/**
 * 取得關卡資料
 */
function getGMLevelsData() {
  const grammarData = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarGameData) || '{}');
  const totalProgress = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarTotalProgress) || '{}');

  // 生成關卡列表（依照 grammar_tower_select.html 的關卡數量）
  const levels = [];
  for (let i = 1; i <= 22; i++) {
    const levelId = String(i);
    const levelData = grammarData[levelId] || {};
    const progressData = totalProgress[levelId] || {};

    levels.push({
      id: levelId,
      name: GM_LEVEL_NAMES[levelId] || `第 ${i} 關`,
      subtitle: levelData.subtitle || '未設定',
      unlocked: levelData.unlocked || false,
      completed: levelData.completed || false,
      stars: progressData.stars || 0
    });
  }

  return levels;
}

/**
 * 解鎖關卡
 */
function unlockGMLevel(levelId) {
  const grammarData = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarGameData) || '{}');
  
  if (!grammarData[levelId]) {
    grammarData[levelId] = {};
  }
  
  grammarData[levelId].unlocked = true;
  localStorage.setItem(GM_STORAGE_KEYS.grammarGameData, JSON.stringify(grammarData));

  addGMLog({
    action: '解鎖關卡',
    targetType: 'level',
    targetId: levelId,
    targetName: GM_LEVEL_NAMES[levelId] || `第 ${levelId} 關`
  });

  showGMStatus('關卡已解鎖。', 'success');
  renderGMLevels();
  notifyGameDataChanged();
}

/**
 * 鎖定關卡
 */
function lockGMLevel(levelId) {
  if (levelId === '1') {
    if (!confirm('第 1 關是起始關卡，確定要鎖定嗎？')) {
      return;
    }
  }

  const grammarData = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarGameData) || '{}');
  
  if (grammarData[levelId]) {
    grammarData[levelId].unlocked = false;
    localStorage.setItem(GM_STORAGE_KEYS.grammarGameData, JSON.stringify(grammarData));
  }

  addGMLog({
    action: '鎖定關卡',
    targetType: 'level',
    targetId: levelId,
    targetName: GM_LEVEL_NAMES[levelId] || `第 ${levelId} 關`
  });

  showGMStatus('關卡已鎖定。', 'success');
  renderGMLevels();
  notifyGameDataChanged();
}

/**
 * 設為已通關
 */
function completeGMLevel(levelId) {
  const grammarData = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarGameData) || '{}');
  const totalProgress = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarTotalProgress) || '{}');
  
  if (!grammarData[levelId]) {
    grammarData[levelId] = {};
  }
  
  grammarData[levelId].unlocked = true;
  grammarData[levelId].completed = true;

  if (!totalProgress[levelId]) {
    totalProgress[levelId] = {};
  }
  
  totalProgress[levelId].stars = 3;

  localStorage.setItem(GM_STORAGE_KEYS.grammarGameData, JSON.stringify(grammarData));
  localStorage.setItem(GM_STORAGE_KEYS.grammarTotalProgress, JSON.stringify(totalProgress));

  addGMLog({
    action: '設為已通關',
    targetType: 'level',
    targetId: levelId,
    targetName: GM_LEVEL_NAMES[levelId] || `第 ${levelId} 關`
  });

  showGMStatus('關卡已設為已通關。', 'success');
  renderGMLevels();
  notifyGameDataChanged();
}

/**
 * 清除通關紀錄
 */
function clearGMLevel(levelId) {
  const grammarData = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarGameData) || '{}');
  const totalProgress = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarTotalProgress) || '{}');
  
  if (grammarData[levelId]) {
    grammarData[levelId].completed = false;
  }

  if (totalProgress[levelId]) {
    totalProgress[levelId].stars = 0;
  }

  localStorage.setItem(GM_STORAGE_KEYS.grammarGameData, JSON.stringify(grammarData));
  localStorage.setItem(GM_STORAGE_KEYS.grammarTotalProgress, JSON.stringify(totalProgress));

  addGMLog({
    action: '清除通關紀錄',
    targetType: 'level',
    targetId: levelId,
    targetName: GM_LEVEL_NAMES[levelId] || `第 ${levelId} 關`
  });

  showGMStatus('通關紀錄已清除。', 'success');
  renderGMLevels();
  notifyGameDataChanged();
}

/**
 * 取得卡片持有資料
 */
function getGMOwnedCards() {
  return JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.ownedCards) || '{}');
}

/**
 * 設定卡片持有資料
 */
function setGMOwnedCards(ownedCards) {
  localStorage.setItem(GM_STORAGE_KEYS.ownedCards, JSON.stringify(ownedCards));
}

/**
 * 取得已解鎖卡片 ID
 */
function getUnlockedCardIds() {
  const key = GM_STORAGE_KEYS.unlockedCards;
  const raw = localStorage.getItem(key);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (error) {
    return [];
  }
}

/**
 * 儲存已解鎖卡片 ID
 */
function saveUnlockedCardIds(ids) {
  const key = GM_STORAGE_KEYS.unlockedCards;
  const uniqueIds = [...new Set(ids.map(String))];
  localStorage.setItem(key, JSON.stringify(uniqueIds));
}

/**
 * 解鎖卡片 ID
 */
function unlockCardsByIds(cardIds) {
  const current = getUnlockedCardIds();
  saveUnlockedCardIds([...current, ...cardIds.map(String)]);
}

/**
 * 鎖定卡片 ID
 */
function lockCardsByIds(cardIds) {
  const current = getUnlockedCardIds();
  const ids = cardIds.map(String);
  saveUnlockedCardIds(current.filter(id => !ids.includes(id)));
}

/**
 * 加入卡片到倉庫
 */
function addCardsToInventoryByIds(cardIds, amount = 1) {
  const inventoryKey = GM_STORAGE_KEYS.ownedCards;
  const raw = localStorage.getItem(inventoryKey);

  let inventory;

  try {
    inventory = raw ? JSON.parse(raw) : {};
  } catch (error) {
    inventory = {};
  }

  const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));

  if (!Array.isArray(inventory) && typeof inventory === 'object') {
    cardIds.forEach((cardId) => {
      const id = String(cardId);
      const current = Number(inventory[id] || 0);
      inventory[id] = Math.max(current, safeAmount);
    });

    localStorage.setItem(inventoryKey, JSON.stringify(inventory));
    return;
  }

  if (Array.isArray(inventory) && inventory.every((item) => typeof item === 'string')) {
    const merged = [...new Set([...inventory.map(String), ...cardIds.map(String)])];
    localStorage.setItem(inventoryKey, JSON.stringify(merged));
    return;
  }

  if (Array.isArray(inventory)) {
    const map = new Map();

    inventory.forEach((item) => {
      const id = item.id || item.cardId;
      if (!id) return;

      map.set(String(id), {
        ...item,
        count: Math.max(Number(item.count || 0), 1)
      });
    });

    cardIds.forEach((cardId) => {
      const id = String(cardId);
      const old = map.get(id) || { id, count: 0 };

      map.set(id, {
        ...old,
        id,
        count: Math.max(Number(old.count || 0), safeAmount)
      });
    });

    localStorage.setItem(inventoryKey, JSON.stringify(Array.from(map.values())));
  }
}

/**
 * 從倉庫移除卡片
 */
function removeCardsFromInventoryByIds(cardIds) {
  const inventoryKey = GM_STORAGE_KEYS.ownedCards;
  const raw = localStorage.getItem(inventoryKey);

  let inventory;

  try {
    inventory = raw ? JSON.parse(raw) : {};
  } catch (error) {
    inventory = {};
  }

  const ids = cardIds.map(String);

  if (!Array.isArray(inventory) && typeof inventory === 'object') {
    ids.forEach((id) => {
      delete inventory[id];
    });

    localStorage.setItem(inventoryKey, JSON.stringify(inventory));
    return;
  }

  if (Array.isArray(inventory) && inventory.every((item) => typeof item === 'string')) {
    inventory = inventory.filter((id) => !ids.includes(String(id)));
    localStorage.setItem(inventoryKey, JSON.stringify(inventory));
    return;
  }

  if (Array.isArray(inventory)) {
    inventory = inventory.filter((item) => {
      const id = String(item.id || item.cardId);
      return !ids.includes(id);
    });

    localStorage.setItem(inventoryKey, JSON.stringify(inventory));
  }
}

/**
 * 解鎖卡片
 */
function unlockGMCard(cardId) {
  if (!cardId) {
    showGMStatus('找不到卡片 ID。', 'error');
    return;
  }

  unlockCardsByIds([cardId]);
  addCardsToInventoryByIds([cardId], 1);

  const card = gmCardsData.find(c => c.id === cardId);
  addGMLog({
    action: '解鎖卡片並加入倉庫',
    targetType: 'card',
    targetId: cardId,
    targetName: card?.name || cardId,
    amount: 1,
    createdAt: new Date().toISOString()
  });

  showGMStatus('卡片已解鎖，並加入卡片倉庫。', 'success');
  renderGMCards();
  notifyGameDataChanged();
}

/**
 * 鎖定卡片
 */
function lockGMCard(cardId) {
  if (!cardId) {
    showGMStatus('找不到卡片 ID。', 'error');
    return;
  }

  lockCardsByIds([cardId]);
  removeCardsFromInventoryByIds([cardId]);

  const card = gmCardsData.find(c => c.id === cardId);
  addGMLog({
    action: '鎖定卡片並從倉庫移除',
    targetType: 'card',
    targetId: cardId,
    targetName: card?.name || cardId,
    createdAt: new Date().toISOString()
  });

  showGMStatus('卡片已鎖定，並從卡片倉庫移除。', 'success');
  renderGMCards();
  notifyGameDataChanged();
}

/**
 * 卡片持有數量 +1
 */
function addGMCardCount(cardId) {
  const ownedCards = getGMOwnedCards();
  
  if (!ownedCards[cardId]) {
    ownedCards[cardId] = 0;
  }
  
  ownedCards[cardId] += 1;
  setGMOwnedCards(ownedCards);

  showGMStatus('卡片持有數量 +1。', 'success');
  renderGMCards();
  notifyGameDataChanged();
}

/**
 * 卡片持有數量 -1
 */
function removeGMCardCount(cardId) {
  const ownedCards = getGMOwnedCards();
  
  if (ownedCards[cardId]) {
    ownedCards[cardId] -= 1;
    
    if (ownedCards[cardId] <= 0) {
      delete ownedCards[cardId];
    }
    
    setGMOwnedCards(ownedCards);
  }

  showGMStatus('卡片持有數量 -1。', 'success');
  renderGMCards();
  notifyGameDataChanged();
}

/**
 * 解鎖全部卡片
 */
function unlockAllGMCards() {
  const allCards = getGMAllCards();
  const ownedCards = getGMOwnedCardsObject();

  allCards.forEach(card => {
    const key = getGMCardKey(card);
    if (!key) return;

    ownedCards[key] = {
      ...(ownedCards[key] || {}),
      word: card.word || key,
      zh: card.zh || card.name || card.cardName || "",
      category: card.category || card.series || card.seriesName || "",
      rarity: card.rarity || "普通",
      image: card.image || card.imageUrl || card.img || "",
      unlocked: true,
      owned: true,
      count: Math.max(1, Number(ownedCards[key]?.count || 0)),
      source: "GM",
      unlockedAt: new Date().toISOString()
    };
  });

  saveGMOwnedCardsObject(ownedCards);

  addGMLog({
    action: '解鎖全部卡片並加入倉庫',
    targetType: 'card',
    targetId: 'all',
    amount: allCards.length,
    createdAt: new Date().toISOString()
  });

  showGMStatus(`已解鎖 ${allCards.length} 張卡片，並同步到卡片倉庫。`, 'success');
  renderGMCards();
  notifyGameDataChanged();
}

/**
 * 鎖定全部卡片
 */
function lockAllGMCards() {
  if (!confirm('確定要鎖定全部卡片？這會清空卡片倉庫裡的卡片。')) {
    return;
  }

  const ownedCards = {};
  saveGMOwnedCardsObject(ownedCards);

  addGMLog({
    action: '鎖定全部卡片並從倉庫移除',
    targetType: 'card',
    targetId: 'all',
    amount: 0,
    createdAt: new Date().toISOString()
  });

  showGMStatus('已鎖定全部卡片，卡片倉庫已同步清空。', 'success');
  renderGMCards();
  notifyGameDataChanged();
}

/**
 * 新增操作紀錄
 */
function addGMLog(log) {
  const logs = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.logs) || '[]');
  
  log.createdAt = new Date().toISOString();
  logs.unshift(log);
  
  // 最多保留 100 筆
  if (logs.length > 100) {
    logs.length = 100;
  }
  
  localStorage.setItem(GM_STORAGE_KEYS.logs, JSON.stringify(logs));
}

/**
 * 清除操作紀錄
 */
function clearGMLogs() {
  if (!confirm('確定要執行此操作嗎？此操作會修改目前資料。')) {
    return;
  }

  localStorage.setItem(GM_STORAGE_KEYS.logs, '[]');
  showGMStatus('操作紀錄已清除。', 'success');
  renderGMLogs();
}

/**
 * 渲染狀態總覽
 */
function renderGMSummary() {
  const stars = getCurrentStars();
  const ownedCards = getGMOwnedCards();
  const levels = getGMLevelsData();

  const unlockedLevels = levels.filter(l => l.unlocked).length;
  const completedLevels = levels.filter(l => l.completed).length;
  const unlockedCards = Object.keys(ownedCards).length;
  const ownedCardsCount = Object.values(ownedCards).reduce((sum, count) => sum + count, 0);

  const unlockedZodiacIds = getUnlockedZodiacIds();
  const totalZodiac = GM_ATLAS_CATEGORIES.length;

  const unlockedGodIds = getUnlockedGreekGodIds();
  const totalGods = GM_GREEK_GODS.length;

  const localStorageCount = localStorage.length;
  const sessionStorageCount = sessionStorage.length;

  const lastBackupTime = localStorage.getItem('lastBackupRestoredAt') || '無';
  const lastGMTime = localStorage.getItem('gmLastUpdatedAt') || '無';

  document.getElementById('gmSummaryStars').textContent = stars;
  document.getElementById('gmSummaryUnlockedLevels').textContent = unlockedLevels;
  document.getElementById('gmSummaryCompletedLevels').textContent = completedLevels;
  document.getElementById('gmSummaryUnlockedCards').textContent = unlockedCards;
  document.getElementById('gmSummaryOwnedCards').textContent = ownedCardsCount;
  document.getElementById('gmSummaryUnlockedZodiac').textContent = `${unlockedZodiacIds.length} / ${totalZodiac}`;
  document.getElementById('gmSummaryUnlockedGods').textContent = `${unlockedGodIds.length} / ${totalGods}`;

  const detailsEl = document.getElementById('gmSummaryDetails');
  if (detailsEl) {
    detailsEl.innerHTML = `
      <div class="gm-row">
        <div>
          <div class="gm-row-title">localStorage 數量</div>
          <div class="gm-row-meta">${localStorageCount} 個 key</div>
        </div>
      </div>
      <div class="gm-row">
        <div>
          <div class="gm-row-title">sessionStorage 數量</div>
          <div class="gm-row-meta">${sessionStorageCount} 個 key</div>
        </div>
      </div>
      <div class="gm-row">
        <div>
          <div class="gm-row-title">最後備份時間</div>
          <div class="gm-row-meta">${lastBackupTime}</div>
        </div>
      </div>
      <div class="gm-row">
        <div>
          <div class="gm-row-title">最後 GM 操作時間</div>
          <div class="gm-row-meta">${lastGMTime}</div>
        </div>
      </div>
    `;
  }
}

/**
 * 渲染使用者管理
 */
function renderGMUser() {
  const playerName = localStorage.getItem(GM_STORAGE_KEYS.playerName) || '未設定';

  const nameInput = document.getElementById('gmPlayerNameInput');
  if (nameInput) {
    nameInput.value = playerName;
  }

  const detailsEl = document.getElementById('gmUserDetails');
  if (detailsEl) {
    detailsEl.innerHTML = `
      <div class="gm-row">
        <div>
          <div class="gm-row-title">目前使用者名稱</div>
          <div class="gm-row-meta">${escapeHTML(playerName)}</div>
        </div>
      </div>
      <div class="gm-row">
        <div>
          <div class="gm-row-title">localStorage Key</div>
          <div class="gm-row-meta">${GM_STORAGE_KEYS.playerName}</div>
        </div>
      </div>
    `;
  }
}

/**
 * 儲存使用者名稱
 */
function saveGMPlayerName() {
  const nameInput = document.getElementById('gmPlayerNameInput');
  if (!nameInput) return;

  const name = nameInput.value.trim();
  localStorage.setItem(GM_STORAGE_KEYS.playerName, name);

  addGMLog({
    action: '修改使用者名稱',
    targetType: 'user',
    targetId: 'playerName',
    targetName: name,
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('使用者名稱已儲存。', 'success');
}

/**
 * 解鎖全部關卡
 */
function unlockAllGMLevels() {
  const grammarData = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarGameData) || '{}');

  for (let i = 1; i <= 22; i++) {
    const levelId = String(i);
    if (!grammarData[levelId]) {
      grammarData[levelId] = {};
    }
    grammarData[levelId].unlocked = true;
  }

  localStorage.setItem(GM_STORAGE_KEYS.grammarGameData, JSON.stringify(grammarData));

  addGMLog({
    action: '解鎖全部關卡',
    targetType: 'level',
    targetId: 'all',
    amount: 22,
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已解鎖全部關卡。', 'success');
}

/**
 * 鎖定全部關卡
 */
function lockAllGMLevels() {
  if (!confirm('確定要鎖定全部關卡嗎？')) {
    return;
  }

  const grammarData = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarGameData) || '{}');

  for (let i = 1; i <= 22; i++) {
    const levelId = String(i);
    if (grammarData[levelId]) {
      grammarData[levelId].unlocked = false;
    }
  }

  localStorage.setItem(GM_STORAGE_KEYS.grammarGameData, JSON.stringify(grammarData));

  addGMLog({
    action: '鎖定全部關卡',
    targetType: 'level',
    targetId: 'all',
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已鎖定全部關卡。', 'success');
}

/**
 * 全部設為已通關
 */
function completeAllGMLevels() {
  const grammarData = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarGameData) || '{}');
  const totalProgress = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarTotalProgress) || '{}');

  for (let i = 1; i <= 22; i++) {
    const levelId = String(i);
    if (!grammarData[levelId]) {
      grammarData[levelId] = {};
    }
    grammarData[levelId].unlocked = true;
    grammarData[levelId].completed = true;

    if (!totalProgress[levelId]) {
      totalProgress[levelId] = {};
    }
    totalProgress[levelId].stars = 3;
  }

  localStorage.setItem(GM_STORAGE_KEYS.grammarGameData, JSON.stringify(grammarData));
  localStorage.setItem(GM_STORAGE_KEYS.grammarTotalProgress, JSON.stringify(totalProgress));

  addGMLog({
    action: '全部設為已通關',
    targetType: 'level',
    targetId: 'all',
    amount: 22,
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已全部設為已通關。', 'success');
}

/**
 * 清除全部通關
 */
function clearAllGMLevels() {
  if (!confirm('確定要清除全部通關紀錄嗎？')) {
    return;
  }

  const grammarData = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarGameData) || '{}');
  const totalProgress = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.grammarTotalProgress) || '{}');

  for (let i = 1; i <= 22; i++) {
    const levelId = String(i);
    if (grammarData[levelId]) {
      grammarData[levelId].completed = false;
    }

    if (totalProgress[levelId]) {
      totalProgress[levelId].stars = 0;
    }
  }

  localStorage.setItem(GM_STORAGE_KEYS.grammarGameData, JSON.stringify(grammarData));
  localStorage.setItem(GM_STORAGE_KEYS.grammarTotalProgress, JSON.stringify(totalProgress));

  addGMLog({
    action: '清除全部通關',
    targetType: 'level',
    targetId: 'all',
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已清除全部通關紀錄。', 'success');
}

/**
 * 清除商城資料
 */
function clearGMMarket() {
  if (!confirm('確定要清除商城資料嗎？')) {
    return;
  }

  localStorage.removeItem(GM_STORAGE_KEYS.marketItems);

  addGMLog({
    action: '清除商城資料',
    targetType: 'market',
    targetId: 'marketItems',
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已清除商城資料。', 'success');
}

/**
 * 清除交易紀錄
 */
function clearGMTrade() {
  if (!confirm('確定要清除交易紀錄嗎？')) {
    return;
  }

  localStorage.removeItem(GM_STORAGE_KEYS.tradeRecords);

  addGMLog({
    action: '清除交易紀錄',
    targetType: 'trade',
    targetId: 'tradeRecords',
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已清除交易紀錄。', 'success');
}

/**
 * 清除議價紀錄
 */
function clearGMBargain() {
  if (!confirm('確定要清除議價紀錄嗎？')) {
    return;
  }

  localStorage.removeItem(GM_STORAGE_KEYS.bargainRecords);

  addGMLog({
    action: '清除議價紀錄',
    targetType: 'bargain',
    targetId: 'bargainRecords',
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已清除議價紀錄。', 'success');
}

/**
 * 清除抽卡紀錄
 */
function clearGMGacha() {
  if (!confirm('確定要清除抽卡紀錄嗎？')) {
    return;
  }

  localStorage.removeItem(GM_STORAGE_KEYS.drawHistory);

  addGMLog({
    action: '清除抽卡紀錄',
    targetType: 'gacha',
    targetId: 'drawHistory',
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已清除抽卡紀錄。', 'success');
}

/**
 * 重置保底次數
 */
function resetGMPity() {
  localStorage.setItem(GM_STORAGE_KEYS.pityCounter, '0');

  addGMLog({
    action: '重置保底次數',
    targetType: 'gacha',
    targetId: 'pityCounter',
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已重置保底次數。', 'success');
}

/**
 * 渲染系列抽卡池管理
 */
function renderGMSeries() {
  if (typeof SeriesGachaSystem === 'undefined') {
    console.warn('SeriesGachaSystem 未載入');
    return;
  }

  const seriesSelect = document.getElementById('gmSeriesSelect');
  if (!seriesSelect) return;

  const allSeries = SeriesGachaSystem.getAllSeries();
  const ticketsData = SeriesGachaSystem.getGachaTicketsData();

  // 清空選項
  seriesSelect.innerHTML = '<option value="">請選擇系列</option>';

  allSeries.forEach(seriesName => {
    const option = document.createElement('option');
    option.value = seriesName;
    option.textContent = seriesName + ' (' + (ticketsData.series[seriesName] || 0) + ' 張)';
    seriesSelect.appendChild(option);
  });

  // 渲染系列列表
  renderGMSeriesDetails();
}

/**
 * 渲染系列抽卡池詳情
 */
function renderGMSeriesDetails() {
  if (typeof SeriesGachaSystem === 'undefined') {
    return;
  }

  const seriesList = document.getElementById('gmSeriesList');
  if (!seriesList) return;

  const allSeries = SeriesGachaSystem.getAllSeries();
  const ticketsData = SeriesGachaSystem.getGachaTicketsData();

  let html = '';

  allSeries.forEach(seriesName => {
    const seriesCards = SeriesGachaSystem.getSeriesCards(seriesName);
    const cardCount = seriesCards.length;
    const ticketCount = ticketsData.series[seriesName] || 0;

    html += '<div class="gm-item">';
    html += '<div class="gm-item-header">';
    html += '<span class="gm-item-name">' + seriesName + '</span>';
    html += '<span class="gm-item-meta">卡片: ' + cardCount + ' 張 | 抽卡券: ' + ticketCount + ' 張</span>';
    html += '</div>';
    html += '</div>';
  });

  seriesList.innerHTML = html;
}

/**
 * 設定系列抽卡券數量
 */
function setGMSeriesTicket() {
  if (typeof SeriesGachaSystem === 'undefined') {
    showGMStatus('系列抽卡系統尚未載入', 'error');
    return;
  }

  const seriesSelect = document.getElementById('gmSeriesSelect');
  const ticketInput = document.getElementById('gmSeriesTicketInput');

  if (!seriesSelect || !ticketInput) return;

  const seriesName = seriesSelect.value;
  const ticketCount = parseInt(ticketInput.value);

  if (!seriesName) {
    showGMStatus('請選擇系列', 'warning');
    return;
  }

  if (isNaN(ticketCount) || ticketCount < 0) {
    showGMStatus('請輸入有效的抽卡券數量', 'warning');
    return;
  }

  const ticketsData = SeriesGachaSystem.getGachaTicketsData();
  ticketsData.series[seriesName] = ticketCount;
  SeriesGachaSystem.saveGachaTicketsData(ticketsData);

  addGMLog({
    action: '設定系列抽卡券',
    targetType: 'seriesGacha',
    targetId: seriesName,
    targetName: seriesName,
    newValue: ticketCount,
    createdAt: new Date().toISOString()
  });

  renderGMSeries();
  notifyGameDataChanged();
  showGMStatus('已設定 ' + seriesName + ' 抽卡券為 ' + ticketCount + ' 張', 'success');
}

/**
 * 增加系列抽卡券
 */
function addGMSeriesTicket() {
  if (typeof SeriesGachaSystem === 'undefined') {
    showGMStatus('系列抽卡系統尚未載入', 'error');
    return;
  }

  const seriesSelect = document.getElementById('gmSeriesSelect');
  if (!seriesSelect) return;

  const seriesName = seriesSelect.value;

  if (!seriesName) {
    showGMStatus('請選擇系列', 'warning');
    return;
  }

  SeriesGachaSystem.addSeriesTicket(seriesName, 1);

  addGMLog({
    action: '增加系列抽卡券',
    targetType: 'seriesGacha',
    targetId: seriesName,
    targetName: seriesName,
    newValue: '+1',
    createdAt: new Date().toISOString()
  });

  renderGMSeries();
  notifyGameDataChanged();
  showGMStatus('已增加 ' + seriesName + ' 抽卡券 1 張', 'success');
}

/**
 * 清除系列抽卡紀錄
 */
function clearGMSeriesGacha() {
  if (typeof SeriesGachaSystem === 'undefined') {
    showGMStatus('系列抽卡系統尚未載入', 'error');
    return;
  }

  if (!confirm('確定要清除所有系列抽卡紀錄嗎？此操作無法復原。')) {
    return;
  }

  localStorage.removeItem('seriesGachaHistory');

  addGMLog({
    action: '清除系列抽卡紀錄',
    targetType: 'seriesGacha',
    targetId: 'history',
    createdAt: new Date().toISOString()
  });

  showGMStatus('已清除系列抽卡紀錄', 'success');
}

/**
 * 儲存主題
 */
function saveGMTheme() {
  const themeSelect = document.getElementById('gmThemeSelect');
  if (!themeSelect) return;

  const theme = themeSelect.value;
  localStorage.setItem(GM_STORAGE_KEYS.theme, theme);

  addGMLog({
    action: '修改主題',
    targetType: 'settings',
    targetId: 'theme',
    targetName: theme,
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('主題已儲存。', 'success');
}

/**
 * 清除設定
 */
function clearGMSettings() {
  if (!confirm('確定要清除設定嗎？')) {
    return;
  }

  localStorage.removeItem(GM_STORAGE_KEYS.theme);
  localStorage.removeItem(GM_STORAGE_KEYS.soundEnabled);
  localStorage.removeItem(GM_STORAGE_KEYS.musicEnabled);
  localStorage.removeItem(GM_STORAGE_KEYS.background);

  addGMLog({
    action: '清除設定',
    targetType: 'settings',
    targetId: 'all',
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已清除設定。', 'success');
}

/**
 * 下載備份
 */
function downloadGMBackup() {
  if (typeof downloadLocalBackup === 'function') {
    downloadLocalBackup();
  } else {
    showGMStatus('備份功能不存在。', 'error');
  }
}

/**
 * 上傳 Google Drive
 */
function uploadGMDrive() {
  if (typeof uploadBackupToDrive === 'function') {
    uploadBackupToDrive();
  } else {
    showGMStatus('Google Drive 備份功能不存在。', 'error');
  }
}

/**
 * 從 Google Drive 下載
 */
function downloadGMDrive() {
  if (typeof downloadBackupFromDrive === 'function') {
    downloadBackupFromDrive();
  } else {
    showGMStatus('Google Drive 下載功能不存在。', 'error');
  }
}

/**
 * 搜尋 localStorage
 */
function searchGMStorage() {
  const searchInput = document.getElementById('gmStorageSearchInput');
  if (!searchInput) return;

  const searchText = searchInput.value.toLowerCase();
  const listEl = document.getElementById('gmStorageList');
  if (!listEl) return;

  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.toLowerCase().includes(searchText)) {
      const value = localStorage.getItem(key);
      const size = new Blob([value]).size;
      keys.push({ key, value, size });
    }
  }

  listEl.innerHTML = keys.map(item => `
    <div class="gm-row">
      <div>
        <div class="gm-row-title">${escapeHTML(item.key)}</div>
        <div class="gm-row-meta">大小: ${item.size} bytes</div>
      </div>
    </div>
  `).join('');
}

/**
 * 渲染商城交易管理
 */
function renderGMMarket() {
  const marketItems = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.marketItems) || '[]');
  const tradeRecords = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.tradeRecords) || '[]');
  const bargainRecords = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.bargainRecords) || '[]');

  const listEl = document.getElementById('gmMarketList');
  if (!listEl) return;

  listEl.innerHTML = `
    <div class="gm-row">
      <div>
        <div class="gm-row-title">商城上架數</div>
        <div class="gm-row-meta">${marketItems.length} 筆</div>
      </div>
    </div>
    <div class="gm-row">
      <div>
        <div class="gm-row-title">交易紀錄數</div>
        <div class="gm-row-meta">${tradeRecords.length} 筆</div>
      </div>
    </div>
    <div class="gm-row">
      <div>
        <div class="gm-row-title">議價紀錄數</div>
        <div class="gm-row-meta">${bargainRecords.length} 筆</div>
      </div>
    </div>
  `;
}

/**
 * 渲染抽卡管理
 */
function renderGMGacha() {
  const drawHistory = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.drawHistory) || '[]');
  const pityCounter = localStorage.getItem(GM_STORAGE_KEYS.pityCounter) || '0';

  const listEl = document.getElementById('gmGachaList');
  if (!listEl) return;

  listEl.innerHTML = `
    <div class="gm-row">
      <div>
        <div class="gm-row-title">抽卡紀錄數</div>
        <div class="gm-row-meta">${drawHistory.length} 筆</div>
      </div>
    </div>
    <div class="gm-row">
      <div>
        <div class="gm-row-title">保底次數</div>
        <div class="gm-row-meta">${pityCounter}</div>
      </div>
    </div>
  `;
}

/**
 * 渲染網站設定
 */
function renderGMSettings() {
  const theme = localStorage.getItem(GM_STORAGE_KEYS.theme) || '未設定';
  const soundEnabled = localStorage.getItem(GM_STORAGE_KEYS.soundEnabled) || '未設定';
  const musicEnabled = localStorage.getItem(GM_STORAGE_KEYS.musicEnabled) || '未設定';
  const background = localStorage.getItem(GM_STORAGE_KEYS.background) || '未設定';

  const themeSelect = document.getElementById('gmThemeSelect');
  if (themeSelect) {
    themeSelect.value = theme;
  }

  const listEl = document.getElementById('gmSettingsList');
  if (!listEl) return;

  listEl.innerHTML = `
    <div class="gm-row">
      <div>
        <div class="gm-row-title">主題</div>
        <div class="gm-row-meta">${escapeHTML(theme)}</div>
      </div>
    </div>
    <div class="gm-row">
      <div>
        <div class="gm-row-title">音效</div>
        <div class="gm-row-meta">${escapeHTML(soundEnabled)}</div>
      </div>
    </div>
    <div class="gm-row">
      <div>
        <div class="gm-row-title">音樂</div>
        <div class="gm-row-meta">${escapeHTML(musicEnabled)}</div>
      </div>
    </div>
    <div class="gm-row">
      <div>
        <div class="gm-row-title">背景</div>
        <div class="gm-row-meta">${escapeHTML(background)}</div>
      </div>
    </div>
  `;
}

/**
 * 渲染備份還原
 */
function renderGMBackup() {
  const lastUpload = localStorage.getItem(GM_STORAGE_KEYS.lastDriveBackupUploadAt) || '無';
  const lastDownload = localStorage.getItem(GM_STORAGE_KEYS.lastDriveBackupDownloadAt) || '無';

  const listEl = document.getElementById('gmBackupList');
  if (!listEl) return;

  listEl.innerHTML = `
    <div class="gm-row">
      <div>
        <div class="gm-row-title">最後上傳 Google Drive</div>
        <div class="gm-row-meta">${escapeHTML(lastUpload)}</div>
      </div>
    </div>
    <div class="gm-row">
      <div>
        <div class="gm-row-title">最後從 Google Drive 下載</div>
        <div class="gm-row-meta">${escapeHTML(lastDownload)}</div>
      </div>
    </div>
  `;
}

/**
 * 渲染資料檢查
 */
function renderGMStorageInspector() {
  const listEl = document.getElementById('gmStorageList');
  if (!listEl) return;

  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    const size = new Blob([value]).size;
    keys.push({ key, value, size });
  }

  listEl.innerHTML = keys.map(item => `
    <div class="gm-row">
      <div>
        <div class="gm-row-title">${escapeHTML(item.key)}</div>
        <div class="gm-row-meta">大小: ${item.size} bytes</div>
      </div>
    </div>
  `).join('');
}

/**
 * 取得已解鎖希臘神祇 ID
 */
function getUnlockedGreekGodIds() {
  const key = GM_STORAGE_KEYS.greekGods;
  const raw = localStorage.getItem(key);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

/**
 * 儲存已解鎖希臘神祇 ID
 */
function saveUnlockedGreekGodIds(ids) {
  const key = GM_STORAGE_KEYS.greekGods;
  localStorage.setItem(key, JSON.stringify([...new Set(ids.map(String))]));
}

/**
 * 檢查希臘神祇是否已解鎖
 */
function isGMGreekGodUnlocked(godId) {
  return getUnlockedGreekGodIds().map(String).includes(String(godId));
}

/**
 * 解鎖希臘神祇
 */
function unlockGMGreekGod(godId) {
  const ids = getUnlockedGreekGodIds();
  if (!ids.map(String).includes(String(godId))) {
    ids.push(godId);
  }

  saveUnlockedGreekGodIds(ids);

  const name = getGMGreekGodNameById(godId);

  addGMLog({
    action: '解鎖希臘神祇',
    targetType: 'greekGod',
    targetId: godId,
    targetName: name,
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('希臘神祇已解鎖。', 'success');
}

/**
 * 鎖定希臘神祇
 */
function lockGMGreekGod(godId) {
  const ids = getUnlockedGreekGodIds()
    .filter((id) => String(id) !== String(godId));

  saveUnlockedGreekGodIds(ids);

  const name = getGMGreekGodNameById(godId);

  addGMLog({
    action: '鎖定希臘神祇',
    targetType: 'greekGod',
    targetId: godId,
    targetName: name,
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('希臘神祇已鎖定。', 'success');
}

/**
 * 解鎖全部希臘神祇
 */
function unlockAllGMGreekGods() {
  const ids = GM_GREEK_GODS.map(god => god.name);

  saveUnlockedGreekGodIds(ids);

  addGMLog({
    action: '解鎖全部希臘神祇',
    targetType: 'greekGod',
    targetId: 'all',
    amount: ids.length,
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已解鎖全部希臘神祇。', 'success');
}

/**
 * 鎖定全部希臘神祇
 */
function lockAllGMGreekGods() {
  if (!confirm('確定要鎖定全部希臘神祇嗎？')) {
    return;
  }

  saveUnlockedGreekGodIds([]);

  addGMLog({
    action: '鎖定全部希臘神祇',
    targetType: 'greekGod',
    targetId: 'all',
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已鎖定全部希臘神祇。', 'success');
}

/**
 * 取得神祇名稱
 */
function getGMGreekGodNameById(godId) {
  const god = GM_GREEK_GODS.find((item) => String(item.id) === String(godId));

  if (!god) return String(godId);

  const name = god.name || '';
  const english = god.english || '';

  return english ? `${name} ${english}` : name;
}

/**
 * 篩選希臘神祇
 */
function getFilteredGMGreekGods() {
  const searchInput = document.getElementById('gmGodSearchInput');
  const unlockFilter = document.getElementById('gmGodUnlockFilter');

  const keyword = String(searchInput?.value || '').trim().toLowerCase();
  const status = unlockFilter?.value || '';

  return GM_GREEK_GODS.filter((god) => {
    const id = god.id || '';
    const name = god.name || '';
    const english = god.english || '';
    const unlocked = isGMGreekGodUnlocked(name);

    const text = `${id} ${name} ${english}`.toLowerCase();

    if (keyword && !text.includes(keyword)) {
      return false;
    }

    if (status === 'unlocked' && !unlocked) {
      return false;
    }

    if (status === 'locked' && unlocked) {
      return false;
    }

    return true;
  });
}

/**
 * 渲染希臘神祇管理
 */
function renderGMGreekGods() {
  const list = document.getElementById('gmGodList');
  if (!list) return;

  const gods = getFilteredGMGreekGods();

  if (!gods.length) {
    list.innerHTML = `
      <div class="gm-empty">
        找不到希臘神祇資料。
      </div>
    `;
    return;
  }

  list.innerHTML = gods.map((god) => {
    const id = god.id || '';
    const name = god.name || '未命名神祇';
    const english = god.english || '';
    const unlocked = isGMGreekGodUnlocked(name);

    return `
      <div class="gm-row gm-god-row" data-god-id="${escapeHTML(id)}">
        <div class="gm-god-main">
          <div class="gm-god-img gm-god-img-empty">⚡</div>

          <div class="gm-god-info">
            <div class="gm-row-title">
              ${escapeHTML(name)} ${english ? escapeHTML(english) : ''}
            </div>

            <div class="gm-row-meta">
              狀態：${unlocked ? '已解鎖' : '未解鎖'}
            </div>
          </div>
        </div>

        <div class="gm-row-actions">
          <button type="button" data-gm-unlock-god="${escapeHTML(name)}">
            解鎖神祇
          </button>

          <button type="button" class="danger" data-gm-lock-god="${escapeHTML(name)}">
            鎖定神祇
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 渲染關卡管理
 */
function renderGMLevels() {
  const levels = getGMLevelsData();
  const listEl = document.getElementById('gmLevelList');

  if (!listEl) return;

  listEl.innerHTML = levels.map(level => {
    const starsStr = '⭐'.repeat(level.stars);
    const statusStr = [
      level.unlocked ? '已解鎖' : '未解鎖',
      level.completed ? '已通關' : '未通關',
      starsStr || '無星數'
    ].join('｜');

    return `
      <div class="gm-row">
        <div>
          <div class="gm-row-title">${level.name}｜${level.subtitle}</div>
          <div class="gm-row-meta">狀態：${statusStr}</div>
        </div>
        <div class="gm-row-actions">
          <button type="button" onclick="unlockGMLevel('${level.id}')">解鎖</button>
          <button type="button" onclick="lockGMLevel('${level.id}')">鎖定</button>
          <button type="button" onclick="completeGMLevel('${level.id}')">設為已通關</button>
          <button type="button" onclick="clearGMLevel('${level.id}')">清除通關</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 渲染卡片管理
 */
function renderGMCards() {
  const ownedCards = getGMOwnedCardsObject();
  const searchInput = document.getElementById('gmCardSearchInput');
  const seriesFilter = document.getElementById('gmCardSeriesFilter');
  const rarityFilter = document.getElementById('gmCardRarityFilter');

  const searchText = searchInput?.value.toLowerCase() || '';
  const seriesValue = seriesFilter?.value || '';
  const rarityValue = rarityFilter?.value || '';

  // 填充系列篩選選項
  if (seriesFilter && seriesFilter.options.length === 1) {
    const seriesSet = new Set();
    gmCardsData.forEach(card => {
      if (card.category) {
        seriesSet.add(card.category);
      }
    });
    seriesSet.forEach(series => {
      const option = document.createElement('option');
      option.value = series;
      option.textContent = series;
      seriesFilter.appendChild(option);
    });
  }

  // 篩選卡片
  const filteredCards = gmCardsData.filter(card => {
    const matchSearch = !searchText || 
      (card.word && card.word.toLowerCase().includes(searchText)) ||
      (card.zh && card.zh.toLowerCase().includes(searchText)) ||
      (String(card.id) && String(card.id).toLowerCase().includes(searchText)) ||
      (card.category && card.category.toLowerCase().includes(searchText));

    const matchSeries = !seriesValue || card.category === seriesValue;
    const matchRarity = !rarityValue || card.rarity === rarityValue;

    return matchSearch && matchSeries && matchRarity;
  });

  const listEl = document.getElementById('gmCardList');
  if (!listEl) return;

  if (gmCardsData.length === 0) {
    listEl.innerHTML = '<p>找不到原本卡片資料，請確認 gm.html 是否已引入 js/cards.js</p>';
    return;
  }

  // 存儲當前篩選後的卡片列表供按鈕使用
  window.gmCurrentCardList = filteredCards;

  listEl.innerHTML = filteredCards.map((card, index) => {
    const key = getGMCardKey(card);
    const cardData = ownedCards[key];
    const isOwned = !!cardData;
    const ownedCount = cardData?.count || 0;

    const cardName = card.zh || card.word || key;
    const cardSeries = card.category || '未知';
    const cardRarity = card.rarity || '未知';

    return `
      <div class="gm-row">
        <div>
          <div class="gm-row-title">${cardRarity}｜${cardSeries}｜${cardName}</div>
          <div class="gm-row-meta">
            ID: ${key}｜系列: ${cardSeries}｜稀有度: ${cardRarity}
          </div>
          <div class="gm-row-meta">
            狀態: ${isOwned ? `已在卡片倉庫 (持有 ${ownedCount} 張)` : '未擁有'}
          </div>
        </div>
        <div class="gm-row-actions">
          <button type="button" onclick="gmUnlockCardToWarehouse(window.gmCurrentCardList[${index}])">解鎖</button>
          <button type="button" onclick="gmLockCardFromWarehouse(window.gmCurrentCardList[${index}])">鎖定</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 渲染星星管理
 */
function renderGMStars() {
  const stars = getSafeStars();
  const el = document.getElementById('gmCurrentStars');
  if (el) el.textContent = String(stars);
  const summaryEl = document.getElementById('gmSummaryStars');
  if (summaryEl) summaryEl.textContent = String(stars);
}

/**
 * 取得已解鎖星座圖鑑 ID
 */
function getUnlockedZodiacIds() {
  const key = GM_STORAGE_KEYS.unlocked;
  const raw = localStorage.getItem(key);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

/**
 * 儲存已解鎖星座圖鑑 ID
 */
function saveUnlockedZodiacIds(ids) {
  const key = GM_STORAGE_KEYS.unlocked;
  localStorage.setItem(key, JSON.stringify([...new Set(ids)]));
}

/**
 * 檢查星座圖鑑是否已解鎖
 */
function isGMZodiacUnlocked(zodiacId) {
  return getUnlockedZodiacIds().map(String).includes(String(zodiacId));
}

/**
 * 解鎖星座圖鑑
 */
function unlockGMZodiac(zodiacId) {
  const ids = getUnlockedZodiacIds();
  if (!ids.map(String).includes(String(zodiacId))) {
    ids.push(zodiacId);
  }

  saveUnlockedZodiacIds(ids);

  const name = GM_ATLAS_NAMES[zodiacId] || zodiacId;

  addGMLog({
    action: '解鎖星座圖鑑',
    targetType: 'zodiac',
    targetId: zodiacId,
    targetName: name,
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('星座圖鑑已解鎖。', 'success');
}

/**
 * 鎖定星座圖鑑
 */
function lockGMZodiac(zodiacId) {
  const ids = getUnlockedZodiacIds()
    .filter((id) => String(id) !== String(zodiacId));

  saveUnlockedZodiacIds(ids);

  const name = GM_ATLAS_NAMES[zodiacId] || zodiacId;

  addGMLog({
    action: '鎖定星座圖鑑',
    targetType: 'zodiac',
    targetId: zodiacId,
    targetName: name,
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('星座圖鑑已鎖定。', 'success');
}

/**
 * 解鎖全部星座圖鑑
 */
function unlockAllGMZodiac() {
  const ids = GM_ATLAS_CATEGORIES;

  saveUnlockedZodiacIds(ids);

  addGMLog({
    action: '解鎖全部星座圖鑑',
    targetType: 'zodiac',
    targetId: 'all',
    amount: ids.length,
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已解鎖全部星座圖鑑。', 'success');
}

/**
 * 鎖定全部星座圖鑑
 */
function lockAllGMZodiac() {
  if (!confirm('確定要鎖定全部星座圖鑑嗎？')) {
    return;
  }

  saveUnlockedZodiacIds([]);

  addGMLog({
    action: '鎖定全部星座圖鑑',
    targetType: 'zodiac',
    targetId: 'all',
    createdAt: new Date().toISOString()
  });

  refreshGMPage();
  notifyGameDataChanged();
  showGMStatus('已鎖定全部星座圖鑑。', 'success');
}

/**
 * 渲染星座圖鑑管理
 */
function renderGMZodiac() {
  const list = document.getElementById('gmZodiacList');
  if (!list) return;

  const items = GM_ATLAS_CATEGORIES;

  if (!items.length) {
    list.innerHTML = `
      <div class="gm-empty">
        找不到原本星座圖鑑資料，請確認 gm.html 是否已引入星座圖鑑資料檔案。
      </div>
    `;
    return;
  }

  list.innerHTML = items.map((category) => {
    const name = GM_ATLAS_NAMES[category] || category;
    const unlocked = isGMZodiacUnlocked(category);

    return `
      <div class="gm-row gm-zodiac-row" data-zodiac-id="${escapeHTML(category)}">
        <div class="gm-zodiac-main">
          <div class="gm-zodiac-img gm-zodiac-img-empty">♈</div>

          <div>
            <div class="gm-row-title">
              ${escapeHTML(name)}
            </div>

            <div class="gm-row-meta">
              狀態：${unlocked ? '已解鎖' : '未解鎖'}
            </div>
          </div>
        </div>

        <div class="gm-row-actions">
          <button type="button" data-gm-unlock-zodiac="${escapeHTML(category)}">
            解鎖圖鑑
          </button>
          <button type="button" class="danger" data-gm-lock-zodiac="${escapeHTML(category)}">
            鎖定圖鑑
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 渲染操作紀錄
 */
function renderGMLogs() {
  const logs = JSON.parse(localStorage.getItem(GM_STORAGE_KEYS.logs) || '[]');
  const listEl = document.getElementById('gmLogList');

  if (!listEl) return;

  if (logs.length === 0) {
    listEl.innerHTML = '<p>暫無操作紀錄。</p>';
    return;
  }

  listEl.innerHTML = logs.map(log => {
    const date = new Date(log.createdAt);
    const dateStr = date.toLocaleString('zh-TW');

    return `
      <div class="gm-log-item">
        <div class="timestamp">${dateStr}</div>
        <div>
          <strong>${log.action}</strong>
          ${log.targetName ? ` - ${log.targetName}` : ''}
          ${log.amount !== undefined ? ` (${log.amount})` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 刷新 GM 頁面
 */
function refreshGMPage() {
  renderGMSummary();

  if (gmCurrentTab === 'summary') {
    renderGMSummary();
  } else if (gmCurrentTab === 'user') {
    renderGMUser();
  } else if (gmCurrentTab === 'stars') {
    renderGMStars();
  } else if (gmCurrentTab === 'levels') {
    renderGMLevels();
  } else if (gmCurrentTab === 'zodiac') {
    renderGMZodiac();
  } else if (gmCurrentTab === 'gods') {
    renderGMGreekGods();
  } else if (gmCurrentTab === 'cards') {
    renderGMCards();
  } else if (gmCurrentTab === 'market') {
    renderGMMarket();
  } else if (gmCurrentTab === 'gacha') {
    renderGMGacha();
    renderGMSeries();
  } else if (gmCurrentTab === 'settings') {
    renderGMSettings();
  } else if (gmCurrentTab === 'backup') {
    renderGMBackup();
  } else if (gmCurrentTab === 'inspector') {
    renderGMStorageInspector();
  } else if (gmCurrentTab === 'logs') {
    renderGMLogs();
  }
}

/**
 * 通知其他頁面資料已變更
 */
function notifyGameDataChanged() {
  localStorage.setItem('gmLastUpdatedAt', new Date().toISOString());
}

/**
 * 顯示狀態訊息
 */
function showGMStatus(message, type) {
  const statusEl = document.getElementById('gmStatusMessage');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.className = `gm-status-message ${type}`;

  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'gm-status-message';
  }, 3000);
}

/**
 * 防止 HTML 錯誤
 */
function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}


// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', initGMPage);
