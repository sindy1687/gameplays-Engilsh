/**
 * 本地資料備份系統
 * 功能：下載目前資料、上傳本地備份、預覽、套用、還原
 */

// 專案使用的 localStorage keys 白名單
const PROJECT_STORAGE_KEYS = [
  'totalStars',
  'playerName',
  'selectedAvatar',
  'playerId',
  'playerStars',
  'ownedCards',
  'tradeListedCards',
  'googleSheetApiUrl',
  'bgMusicState',
  'musicVolume',
  'bgmPlaying',
  'grammarSoundEnabled',
  'grammarGameData',
  'vocabularyCorrectWords',
  'vocabularyCorrectWordsList',
  'grammar_total_progress',
  'currentUser',
  'lastDailyReward',
  'checkedDates',
  'loginDays',
  'nameSet',
  'wordSpinGameData',
  'autoBackupBeforeImport'
];

/**
 * 清理備份檔案名稱特殊字元
 */
function sanitizeBackupFileName(name) {
  return String(name || '未命名使用者')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30) || '未命名使用者';
}

/**
 * 取得備份使用者名稱
 */
function getBackupUserName() {
  // 優先從 localStorage 讀取
  const playerName = localStorage.getItem('playerName');
  if (playerName) {
    try {
      const parsed = JSON.parse(playerName);
      if (typeof parsed === 'string') {
        return sanitizeBackupFileName(parsed);
      }
      if (parsed?.name) {
        return sanitizeBackupFileName(parsed.name);
      }
      if (parsed?.playerName) {
        return sanitizeBackupFileName(parsed.playerName);
      }
    } catch (error) {
      return sanitizeBackupFileName(playerName);
    }
  }

  // 從 HTML 元素讀取
  const playerNameInput = document.getElementById('playerName');
  if (playerNameInput && playerNameInput.value) {
    return sanitizeBackupFileName(playerNameInput.value);
  }

  return '未命名使用者';
}

/**
 * 取得備份日期時間文字
 */
function getBackupDateTimeText() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}-${hour}${minute}`;
}

/**
 * 取得備份檔案名稱
 */
function getBackupFileName() {
  const userName = getBackupUserName();
  const dateTime = getBackupDateTimeText();

  return `${userName}-遊戲備份-${dateTime}.json`;
}

/**
 * 取得完整網站備份檔案名稱
 */
function getFullBackupFileName() {
  const userName = getBackupUserName();
  const dateTime = getBackupDateTimeText();

  return `${userName}-完整網站備份-${dateTime}.json`;
}

/**
 * 完整讀取 localStorage
 */
function collectAllLocalStorage() {
  const data = {};

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    // 不備份舊備份，避免備份檔越來越大
    if (
      key.startsWith('gameBackup_') ||
      key.startsWith('backup_') ||
      key.includes('Backup')
    ) {
      console.warn('不加入備份：', key);
      continue;
    }

    data[key] = localStorage.getItem(key);
  }

  return data;
}

/**
 * 完整讀取 sessionStorage
 */
function collectAllSessionStorage() {
  const data = {};

  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (!key) continue;

    data[key] = sessionStorage.getItem(key);
  }

  return data;
}

/**
 * 備份 IndexedDB 資料
 */
async function collectIndexedDBData() {
  const result = {};

  if (!window.indexedDB || !indexedDB.databases) {
    return result;
  }

  try {
    const databases = await indexedDB.databases();

    for (const dbInfo of databases) {
      if (!dbInfo.name) continue;

      result[dbInfo.name] = await exportSingleIndexedDB(dbInfo.name);
    }
  } catch (error) {
    console.error('IndexedDB 備份失敗:', error);
  }

  return result;
}

/**
 * 匯出單一 IndexedDB 資料庫
 */
function exportSingleIndexedDB(dbName) {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName);

    request.onerror = () => resolve({});

    request.onsuccess = () => {
      const db = request.result;
      const output = {};
      const storeNames = Array.from(db.objectStoreNames);

      if (storeNames.length === 0) {
        db.close();
        resolve(output);
        return;
      }

      const transaction = db.transaction(storeNames, 'readonly');
      let pending = storeNames.length;

      storeNames.forEach((storeName) => {
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          output[storeName] = getAllRequest.result || [];
          pending -= 1;

          if (pending === 0) {
            db.close();
            resolve(output);
          }
        };

        getAllRequest.onerror = () => {
          output[storeName] = [];
          pending -= 1;

          if (pending === 0) {
            db.close();
            resolve(output);
          }
        };
      });
    };
  });
}

/**
 * 嘗試解析備份值
 */
function tryParseBackupValue(value) {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}

/**
 * 從備份資料中提取特定群組
 */
function extractBackupGroup(storageData, keywords) {
  const output = {};

  Object.keys(storageData || {}).forEach((key) => {
    const lowerKey = key.toLowerCase();

    const matched = keywords.some((keyword) =>
      lowerKey.includes(String(keyword).toLowerCase())
    );

    if (matched) {
      output[key] = tryParseBackupValue(storageData[key]);
    }
  });

  return output;
}

/**
 * 建立結構化備份摘要
 */
function buildStructuredBackupSummary(localStorageData, sessionStorageData, indexedDBData) {
  return {
    player: extractBackupGroup(localStorageData, ['player', 'user', 'name', 'profile']),
    stars: extractBackupGroup(localStorageData, ['star', 'stars', 'coin', 'point']),
    levels: extractBackupGroup(localStorageData, ['level', 'stage', 'progress', 'quiz']),
    cards: extractBackupGroup(localStorageData, ['card', 'cards']),
    inventory: extractBackupGroup(localStorageData, ['inventory', 'owned', 'unlock']),
    market: extractBackupGroup(localStorageData, ['market', 'shop', 'sell', 'sale']),
    trades: extractBackupGroup(localStorageData, ['trade', 'bargain', 'offer', 'deal']),
    gm: extractBackupGroup(localStorageData, ['gm', 'admin', 'cheat']),
    settings: extractBackupGroup(localStorageData, ['setting', 'theme', 'sound', 'music', 'background']),
    googleSheet: extractBackupGroup(localStorageData, ['sheet', 'googleSheet', 'spreadsheet']),
    googleDrive: extractBackupGroup(localStorageData, ['drive', 'backup'])
  };
}

/**
 * 建立備份摘要
 */
function buildBackupSummary(localStorageData, sessionStorageData, indexedDBData) {
  const jsonText = JSON.stringify({
    localStorage: localStorageData,
    sessionStorage: sessionStorageData,
    indexedDB: indexedDBData
  });

  return {
    localStorageKeyCount: Object.keys(localStorageData || {}).length,
    sessionStorageKeyCount: Object.keys(sessionStorageData || {}).length,
    indexedDBDatabaseCount: Object.keys(indexedDBData || {}).length,
    estimatedSizeKB: Math.round((jsonText.length / 1024) * 100) / 100
  };
}

/**
 * 建立完整網站備份資料
 */
async function buildFullSiteBackupData(source = 'local-backup') {
  const fileName = getFullBackupFileName();
  const userName = getBackupUserName();
  const localStorageData = collectAllLocalStorage();
  const sessionStorageData = collectAllSessionStorage();
  const indexedDBData = await collectIndexedDBData();

  const backup = {
    appName: '完整網站資料備份',
    version: 2,
    backupType: 'full-site-backup',
    fileName,
    userName,
    exportedAt: new Date().toISOString(),
    source,
    siteUrl: location.href,
    userAgent: navigator.userAgent,
    storage: {
      localStorage: localStorageData,
      sessionStorage: sessionStorageData,
      indexedDB: indexedDBData
    },
    structuredData: buildStructuredBackupSummary(localStorageData, sessionStorageData, indexedDBData),
    summary: buildBackupSummary(localStorageData, sessionStorageData, indexedDBData)
  };

  return backup;
}

/**
 * 驗證完整網站備份
 */
function validateFullSiteBackup(backup) {
  if (!backup || typeof backup !== 'object') {
    return false;
  }

  // 相容舊版備份格式
  if (backup.backupType !== 'full-site-backup') {
    // 如果是舊版格式，檢查是否有 localStorage
    if (backup.localStorage) {
      return true;
    }
    if (backup.data || backup.appName) {
      return true;
    }
    return false;
  }

  if (!backup.storage || typeof backup.storage !== 'object') {
    return false;
  }

  if (!backup.storage.localStorage || typeof backup.storage.localStorage !== 'object') {
    return false;
  }

  return true;
}

/**
 * 完整還原 localStorage
 */
function restoreAllLocalStorageFromBackup(backup) {
  let localData;

  // 相容舊版備份格式
  if (backup.storage && backup.storage.localStorage) {
    localData = backup.storage.localStorage;
  } else if (backup.localStorage) {
    localData = backup.localStorage;
  } else {
    throw new Error('備份中沒有 localStorage 資料');
  }

  if (!localData || typeof localData !== 'object') {
    throw new Error('localStorage 資料格式不正確');
  }

  let restoredCount = 0;
  let skippedCount = 0;

  Object.entries(localData).forEach(([key, value]) => {
    try {
      // 不要還原舊的備份檔，避免備份裡面又包備份，越存越大
      if (
        key.startsWith('gameBackup_') ||
        key.startsWith('backup_') ||
        key.includes('Backup')
      ) {
        console.warn('跳過舊備份資料：', key);
        skippedCount++;
        return;
      }

      // 超過 1MB 的資料先跳過，避免 localStorage 爆掉
      const valueSize = new Blob([String(value)]).size;
      if (valueSize > 1024 * 1024) {
        console.warn('資料太大，已跳過：', key, valueSize);
        skippedCount++;
        return;
      }

      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, String(value));
        restoredCount++;
      }
    } catch (err) {
      console.error('還原失敗：', key, err);
      skippedCount++;
    }
  });

  alert(
    `還原完成！\n成功還原：${restoredCount} 筆\n跳過：${skippedCount} 筆`
  );
}

/**
 * 完整還原 sessionStorage
 */
function restoreAllSessionStorageFromBackup(backup) {
  let sessionData;

  if (backup.storage && backup.storage.sessionStorage) {
    sessionData = backup.storage.sessionStorage;
  } else {
    return;
  }

  if (!sessionData || typeof sessionData !== 'object') {
    return;
  }

  Object.keys(sessionData).forEach((key) => {
    const value = sessionData[key];

    if (value === null || value === undefined) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, String(value));
    }
  });
}

/**
 * 還原 IndexedDB 資料
 */
async function restoreIndexedDBFromBackup(backup) {
  const indexedDBData = backup?.storage?.indexedDB;

  if (!indexedDBData || typeof indexedDBData !== 'object') {
    return;
  }

  // 如果專案有使用 IndexedDB，這裡可以依照實際結構還原
  // 目前先保留函式，不強制還原
  console.log('IndexedDB 還原功能已保留，尚未實作');
}

/**
 * 套用完整網站備份
 */
async function applyFullSiteBackup(backup) {
  if (!validateFullSiteBackup(backup)) {
    throw new Error('這不是有效的完整網站備份檔');
  }

  createAutoBackupBeforeImport();

  restoreAllLocalStorageFromBackup(backup);
  restoreAllSessionStorageFromBackup(backup);
  await restoreIndexedDBFromBackup(backup);

  localStorage.setItem('lastFullSiteRestoreAt', new Date().toISOString());
}

/**
 * 清除舊的遊戲備份資料
 */
function removeOldGameBackups() {
  const removeKeys = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (
      key.startsWith('gameBackup_') ||
      key.startsWith('backup_') ||
      key.includes('Backup')
    ) {
      removeKeys.push(key);
    }
  }

  removeKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('已刪除舊備份：', key);
  });
}

/**
 * 建立完整自動備份（匯入前）
 */
async function createFullAutoBackupBeforeImport() {
  // 先清除舊備份以釋放空間
  removeOldGameBackups();

  const backup = await buildFullSiteBackupData('auto-backup-before-import');

  try {
    localStorage.removeItem('autoBackupBeforeImport');
    localStorage.removeItem('autoBackupBeforeImportAt');

    localStorage.setItem('autoBackupBeforeImport', JSON.stringify(backup));
    localStorage.setItem('autoBackupBeforeImportAt', new Date().toISOString());
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage 空間不足，無法建立匯入前備份');
      // 嘗試只備份關鍵資料
      try {
        const minimalBackup = {
          version: 2,
          backupType: 'full-site-backup',
          exportedAt: new Date().toISOString(),
          source: 'auto-backup-before-import-minimal',
          storage: {
            localStorage: collectProjectLocalStorage(),
            sessionStorage: {},
            indexedDB: {}
          }
        };
        localStorage.setItem('autoBackupBeforeImport', JSON.stringify(minimalBackup));
        localStorage.setItem('autoBackupBeforeImportAt', new Date().toISOString());
        console.log('已建立最小化備份');
      } catch (minimalError) {
        console.error('無法建立任何備份:', minimalError);
      }
    } else {
      throw error;
    }
  }

  return backup;
}

// 暫存上傳的備份資料
let tempUploadedBackup = null;
let tempUploadedFileName = null;

/**
 * 初始化本地備份系統
 */
function initLocalBackupSystem() {
  const downloadBtn = document.getElementById('downloadLocalBackupBtn');
  const uploadInput = document.getElementById('uploadLocalBackupInput');
  const previewBtn = document.getElementById('previewLocalBackupBtn');
  const applyBtn = document.getElementById('applyLocalBackupBtn');
  const clearBtn = document.getElementById('clearLocalBackupBtn');
  const restoreBtn = document.getElementById('restoreBeforeImportBtn');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadLocalBackup);
  }

  if (uploadInput) {
    uploadInput.addEventListener('change', handleLocalBackupFileUpload);
  }

  if (previewBtn) {
    previewBtn.addEventListener('click', previewLocalBackup);
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', applyLocalBackup);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearTempLocalBackup);
  }

  if (restoreBtn) {
    restoreBtn.addEventListener('click', restoreBeforeImport);
  }
}

/**
 * 收集本專案 localStorage 資料
 */
function collectProjectLocalStorage() {
  const storageData = {};

  PROJECT_STORAGE_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      // 嘗試解析 JSON，如果失敗就保存原始字串
      try {
        storageData[key] = JSON.parse(value);
      } catch (e) {
        storageData[key] = value;
      }
    }
  });

  return storageData;
}

/**
 * 下載目前資料成 JSON（完整網站備份）
 */
async function downloadLocalBackup() {
  try {
    showLocalBackupStatus('正在建立完整網站備份...', 'info');

    const backup = await buildFullSiteBackupData('local-backup');
    const fileName = backup.fileName || getFullBackupFileName();

    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showLocalBackupStatus(`已下載完整網站備份：${fileName}`, 'success');
  } catch (error) {
    console.error('下載備份失敗:', error);
    showLocalBackupStatus('完整網站備份下載失敗。', 'error');
  }
}

/**
 * 處理本地備份檔案上傳
 */
function handleLocalBackupFileUpload(event) {
  const file = event.target.files?.[0];

  if (!file) {
    showLocalBackupStatus('請先選擇備份檔。', 'error');
    return;
  }

  if (!file.name.toLowerCase().endsWith('.json')) {
    showLocalBackupStatus('請選擇 JSON 備份檔。', 'error');
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const text = String(reader.result || '');
      const rawData = JSON.parse(text);
      const backup = normalizeBackupFileData(rawData);

      if (!validateImportableBackup(backup)) {
        throw new Error('這不是有效的網站備份檔');
      }

      tempUploadedBackup = backup;
      tempUploadedFileName = file.name;
      sessionStorage.setItem('pendingLocalBackupData', JSON.stringify(backup));

      renderBackupPreview(backup, file.name);
      showLocalBackupStatus(`已讀取備份檔：${file.name}`, 'success');
    } catch (error) {
      console.error(error);
      tempUploadedBackup = null;
      tempUploadedFileName = null;
      sessionStorage.removeItem('pendingLocalBackupData');
      showLocalBackupStatus(`讀取失敗：${error.message}`, 'error');
    }
  };

  reader.onerror = () => {
    showLocalBackupStatus('讀取備份檔失敗，請重新選擇檔案。', 'error');
  };

  reader.readAsText(file, 'UTF-8');
}

/**
 * 驗證備份 JSON 格式
 */
function validateLocalBackupJson(backup) {
  if (!backup || typeof backup !== 'object') {
    return false;
  }

  if (!backup.appName || !backup.version) {
    return false;
  }

  if (!backup.data && !backup.localStorage) {
    return false;
  }

  return true;
}

/**
 * 預覽上傳資料（完整網站備份摘要）
 */
function previewLocalBackup() {
  if (!tempUploadedBackup) {
    showLocalBackupStatus('請先選擇本地備份檔案。', 'error');
    return;
  }

  renderBackupPreview(tempUploadedBackup, tempUploadedFileName);
}

/**
 * 渲染備份預覽
 */
function renderBackupPreview(backup, originalFileName = '') {
  const preview = document.getElementById('localBackupPreview');
  if (!preview) return;

  const summary = backup.summary || {};
  const structured = backup.structuredData || {};
  const storage = backup.storage || backup;

  const isFullBackup = backup.backupType === 'full-site-backup';

  const hasData = (obj) => obj && Object.keys(obj).length > 0;

  const localStorageCount = Object.keys(storage.localStorage || {}).length;
  const sessionStorageCount = Object.keys(storage.sessionStorage || {}).length;
  const indexedDBCount = Object.keys(storage.indexedDB || {}).length;

  const fileName = backup.fileName || originalFileName || '尚未設定';
  const userName = backup.userName || '尚未設定';
  const exportedAt = backup.exportedAt || '尚未設定';
  const backupType = backup.backupType || '舊版備份';

  const summaryHtml = `
    <div class="local-backup-preview-card">
      <h3>${isFullBackup ? '完整網站備份' : '備份檔案'}預覽</h3>
      <p><strong>備份檔案名稱：</strong>${escapeHTML(fileName)}</p>
      <p><strong>原始檔名：</strong>${escapeHTML(originalFileName || '尚未設定')}</p>
      <p><strong>使用者：</strong>${escapeHTML(userName)}</p>
      <p><strong>備份時間：</strong>${escapeHTML(exportedAt)}</p>
      <p><strong>備份類型：</strong>${escapeHTML(backupType)}</p>
      <p><strong>來源：</strong>${escapeHTML(backup.source || '未知')}</p>
      
      ${isFullBackup ? `
      <hr>
      <h4>儲存空間摘要</h4>
      <p><strong>localStorage：</strong>${summary.localStorageKeyCount || localStorageCount} 筆</p>
      <p><strong>sessionStorage：</strong>${summary.sessionStorageKeyCount || sessionStorageCount} 筆</p>
      <p><strong>IndexedDB：</strong>${summary.indexedDBDatabaseCount || indexedDBCount} 個資料庫</p>
      <p><strong>估計大小：</strong>${summary.estimatedSizeKB || 0} KB</p>
      
      <hr>
      <h4>資料分類摘要</h4>
      <p><strong>玩家資料：</strong>${hasData(structured.player) ? '有' : '無'}</p>
      <p><strong>星星資料：</strong>${hasData(structured.stars) ? '有' : '無'}</p>
      <p><strong>關卡資料：</strong>${hasData(structured.levels) ? '有' : '無'}</p>
      <p><strong>卡片資料：</strong>${hasData(structured.cards) ? '有' : '無'}</p>
      <p><strong>商城資料：</strong>${hasData(structured.market) ? '有' : '無'}</p>
      <p><strong>交易資料：</strong>${hasData(structured.trades) ? '有' : '無'}</p>
      <p><strong>GM 資料：</strong>${hasData(structured.gm) ? '有' : '無'}</p>
      <p><strong>設定資料：</strong>${hasData(structured.settings) ? '有' : '無'}</p>
      <p><strong>Google Sheet：</strong>${hasData(structured.googleSheet) ? '有' : '無'}</p>
      <p><strong>Google Drive：</strong>${hasData(structured.googleDrive) ? '有' : '無'}</p>
      ` : `
      <hr>
      <h4>資料摘要</h4>
      <p><strong>localStorage key 數量：</strong>${Object.keys(storage.localStorage || storage).length}</p>
      `}
      
      <details class="local-backup-json-details">
        <summary>顯示完整 JSON</summary>
        <pre class="local-backup-json-content">${JSON.stringify(backup, null, 2)}</pre>
      </details>
    </div>
  `;

  const previewDiv = document.getElementById('localBackupPreview');
  if (previewDiv) {
    previewDiv.innerHTML = summaryHtml;
  }

  showLocalBackupStatus('預覽已顯示，確認無誤後請點擊「套用備份」。', 'success');
}

/**
 * 套用備份資料到 localStorage（共用函式）
 */
function applyBackupDataToLocalStorage(backup) {
  if (!backup || !backup.localStorage) {
    throw new Error('備份資料格式不正確');
  }

  const storage = backup.localStorage || {};
  
  Object.keys(storage).forEach(key => {
    const value = storage[key];
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, String(value));
    }
  });
}

/**
 * 套用上傳資料（完整網站備份）
 */
async function applyLocalBackup() {
  try {
    const backup =
      tempUploadedBackup ||
      JSON.parse(sessionStorage.getItem('pendingLocalBackupData') || 'null');

    if (!backup) {
      showLocalBackupStatus('請先選擇備份檔。', 'error');
      return;
    }

    if (!validateImportableBackup(backup)) {
      showLocalBackupStatus('這不是有效的網站備份檔。', 'error');
      return;
    }

    if (!confirm('確定要套用這份備份嗎？目前瀏覽器資料會被覆蓋，系統會先建立匯入前備份。')) {
      return;
    }

    await createFullAutoBackupBeforeImport();

    restoreAllLocalStorageFromBackup(backup);
    restoreAllSessionStorageFromBackup(backup);

    if (typeof restoreIndexedDBFromBackup === 'function') {
      await restoreIndexedDBFromBackup(backup);
    }

    localStorage.setItem('lastBackupRestoredAt', new Date().toISOString());
    localStorage.setItem('lastBackupRestoredFileName', backup.fileName || '');

    alert('備份已套用完成，頁面將重新整理。');
    location.reload();
  } catch (error) {
    console.error(error);
    showLocalBackupStatus(`套用備份失敗：${error.message}`, 'error');
  }
}

/**
 * 匯入前自動備份目前資料（完整備份）
 */
async function createAutoBackupBeforeImport() {
  try {
    const backup = await buildFullSiteBackupData('auto-backup-before-import');
    localStorage.setItem('autoBackupBeforeImport', JSON.stringify(backup));
    localStorage.setItem('autoBackupBeforeImportAt', new Date().toISOString());
    console.log('完整自動備份已建立');
  } catch (error) {
    console.error('建立完整自動備份失敗:', error);
  }
}

/**
 * 統一處理備份檔格式
 */
function normalizeBackupFileData(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('備份檔格式不正確');
  }

  // Google Drive API 回傳包了一層 backup
  if (rawData.backup && typeof rawData.backup === 'object') {
    return rawData.backup;
  }

  // 新版完整網站備份
  if (rawData.backupType === 'full-site-backup') {
    return rawData;
  }

  // 舊版格式：localStorage 在根層
  if (rawData.localStorage && typeof rawData.localStorage === 'object') {
    return {
      appName: rawData.appName || '舊版網站備份',
      version: rawData.version || 1,
      backupType: 'legacy-site-backup',
      fileName: rawData.fileName || '舊版備份.json',
      userName: rawData.userName || '未知使用者',
      exportedAt: rawData.exportedAt || '',
      storage: {
        localStorage: rawData.localStorage,
        sessionStorage: rawData.sessionStorage || {},
        indexedDB: rawData.indexedDB || {}
      },
      data: rawData.data || {}
    };
  }

  // 舊版格式：storage.localStorage 已存在
  if (rawData.storage?.localStorage && typeof rawData.storage.localStorage === 'object') {
    return rawData;
  }

  throw new Error('無法辨識這個備份檔格式');
}

/**
 * 驗證可匯入備份
 */
function validateImportableBackup(backup) {
  if (!backup || typeof backup !== 'object') {
    return false;
  }

  // 新版完整網站備份
  if (
    backup.backupType === 'full-site-backup' &&
    backup.storage &&
    typeof backup.storage.localStorage === 'object'
  ) {
    return true;
  }

  // 舊版轉換後格式
  if (
    backup.storage &&
    typeof backup.storage.localStorage === 'object'
  ) {
    return true;
  }

  return false;
}

/**
 * 防止 HTML 錯誤
 */
function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 還原匯入前資料（完整還原）
 */
async function restoreBeforeImport() {
  const autoBackup = localStorage.getItem('autoBackupBeforeImport');

  if (!autoBackup) {
    showLocalBackupStatus('目前沒有可還原的匯入前備份。', 'error');
    return;
  }

  const confirmed = confirm(
    '確定要還原到上次匯入前的完整網站資料嗎？\n' +
    '目前資料會被覆蓋。'
  );

  if (!confirmed) {
    return;
  }

  try {
    const backup = JSON.parse(autoBackup);

    if (!validateFullSiteBackup(backup)) {
      throw new Error('匯入前備份格式不正確');
    }

    restoreAllLocalStorageFromBackup(backup);
    restoreAllSessionStorageFromBackup(backup);
    await restoreIndexedDBFromBackup(backup);

    showLocalBackupStatus('已還原到上次匯入前的完整網站資料，頁面將重新整理。', 'success');

    setTimeout(() => {
      location.reload();
    }, 1500);
  } catch (error) {
    console.error('還原備份失敗:', error);
    showLocalBackupStatus('還原失敗：' + error.message, 'error');
  }
}

/**
 * 清除暫存上傳資料
 */
function clearTempLocalBackup() {
  tempUploadedBackup = null;
  tempUploadedFileName = null;

  const uploadInput = document.getElementById('uploadLocalBackupInput');
  if (uploadInput) {
    uploadInput.value = '';
  }

  const previewDiv = document.getElementById('localBackupPreview');
  if (previewDiv) {
    previewDiv.innerHTML = '';
  }

  showLocalBackupStatus('已清除暫存上傳資料。', 'success');
}

/**
 * 顯示狀態訊息
 */
function showLocalBackupStatus(message, type) {
  const statusDiv = document.getElementById('localBackupStatus');
  if (!statusDiv) {
    return;
  }

  statusDiv.textContent = message;
  statusDiv.className = 'local-backup-status local-backup-status-' + type;

  // 3秒後自動清除成功訊息
  if (type === 'success') {
    setTimeout(() => {
      if (statusDiv.textContent === message) {
        statusDiv.textContent = '';
        statusDiv.className = 'local-backup-status';
      }
    }, 3000);
  }
}

/**
 * 初始化本地備份展開收合功能
 */
function initLocalBackupToggle() {
  const toggleBtn = document.getElementById('localBackupToggleBtn');
  const panel = document.getElementById('localBackupPanel');

  if (!toggleBtn || !panel) {
    return;
  }

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';

    toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
    panel.hidden = isExpanded;
  });
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
  initLocalBackupToggle();
  initLocalBackupSystem();
});
