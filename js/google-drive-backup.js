/**
 * Google Drive 雲端備份系統
 * 功能：上傳備份到 Google Drive、從 Google Drive 下載備份、開啟雲端資料夾
 */

// Google Drive 備份設定
const DRIVE_BACKUP_CONFIG = {
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwmdcdYiC-z8RY8tDcmuzrHoa3u3Gcv0u6SYKdiHZ4BL0HhpFSrPEJVQ2V-WB-kqPhrlA/exec',
  driveFolderUrl: 'https://drive.google.com/drive/folders/1iUGtcVvOlzVqa7Ihr8XSkXphWr_WYPg-?usp=drive_link',
  saveMode: 'history'
};

/**
 * 初始化 Google Drive 備份系統
 */
function initGoogleDriveBackup() {
  const uploadBtn = document.getElementById('uploadDriveBackupBtn');
  const downloadBtn = document.getElementById('downloadDriveBackupBtn');
  const openFolderBtn = document.getElementById('openDriveFolderBtn');

  if (uploadBtn) {
    uploadBtn.addEventListener('click', uploadBackupToDrive);
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadBackupFromDrive);
  }

  if (openFolderBtn) {
    openFolderBtn.addEventListener('click', openDriveBackupFolder);
  }
}

/**
 * 建立要上傳的備份資料（完整網站備份）
 */
async function buildDriveBackupPayload() {
  return await buildFullSiteBackupData('google-drive-backup');
}

/**
 * 上傳備份到 Google Drive
 */
async function uploadBackupToDrive() {
  if (!DRIVE_BACKUP_CONFIG.appsScriptUrl || DRIVE_BACKUP_CONFIG.appsScriptUrl === '請貼上 Google Apps Script Web App URL') {
    showDriveBackupStatus('尚未設定 Google Apps Script Web App URL。', 'error');
    return;
  }

  if (!confirm('確定要將目前完整網站資料上傳到 Google Drive 嗎？\n這會在雲端建立新的備份檔。')) {
    return;
  }

  try {
    showDriveBackupStatus('正在上傳完整網站備份到 Google Drive...', 'info');

    const backup = await buildDriveBackupPayload();
    const fileName = backup.fileName;

    const payload = {
      action: 'upload',
      saveMode: DRIVE_BACKUP_CONFIG.saveMode,
      fileName: fileName,
      backup
    };

    const response = await fetch(DRIVE_BACKUP_CONFIG.appsScriptUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '上傳失敗');
    }

    localStorage.setItem('lastDriveBackupUploadAt', result.updatedAt || new Date().toISOString());
    showDriveBackupStatus(`已上傳完整網站備份到 Google Drive：${fileName}`, 'success');
  } catch (error) {
    console.error(error);
    showDriveBackupStatus('上傳 Google Drive 失敗，請稍後再試。', 'error');
  }
}

/**
 * 從 Google Drive 下載備份
 */
async function downloadBackupFromDrive() {
  if (!DRIVE_BACKUP_CONFIG.appsScriptUrl || DRIVE_BACKUP_CONFIG.appsScriptUrl === '請貼上 Google Apps Script Web App URL') {
    showDriveBackupStatus('尚未設定 Google Apps Script Web App URL。', 'error');
    return;
  }

  if (!confirm('確定要從 Google Drive 下載最新備份嗎？')) {
    return;
  }

  try {
    showDriveBackupStatus('正在下載 Google Drive 備份...', 'info');

    const payload = {
      action: 'download'
    };

    const response = await fetch(DRIVE_BACKUP_CONFIG.appsScriptUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    });

    const result = await response.json();

    if (!result.success || !result.backup) {
      throw new Error(result.message || '下載失敗');
    }

    const backup = result.backup;
    const fileName = result.fileName || '未知檔名';

    // 驗證備份格式
    if (!validateFullSiteBackup(backup)) {
      throw new Error('雲端備份格式不正確');
    }

    const summary = [
      `備份檔名：${fileName}`,
      `備份時間：${backup.exportedAt || '尚未設定'}`,
      `版本：${backup.version || '尚未設定'}`,
      `來源：${backup.source || 'Google Drive'}`,
      `備份類型：${backup.backupType || '舊版格式'}`
    ].join('\n');

    if (!confirm(`已下載雲端備份：\n${summary}\n\n確定要套用這份備份嗎？`)) {
      showDriveBackupStatus('已下載雲端備份，但尚未套用。', 'info');
      return;
    }

    // 自動備份目前資料
    if (typeof createFullAutoBackupBeforeImport === 'function') {
      await createFullAutoBackupBeforeImport();
    }

    // 套用完整備份
    await applyFullSiteBackup(backup);

    localStorage.setItem('lastDriveBackupDownloadAt', result.downloadedAt || new Date().toISOString());

    alert('已套用 Google Drive 雲端備份，頁面將重新整理。');
    location.reload();
  } catch (error) {
    console.error(error);
    showDriveBackupStatus('下載 Google Drive 備份失敗。', 'error');
  }
}

/**
 * 開啟 Google Drive 備份資料夾
 */
function openDriveBackupFolder() {
  if (!DRIVE_BACKUP_CONFIG.driveFolderUrl || DRIVE_BACKUP_CONFIG.driveFolderUrl === '請貼上 Google Drive 資料夾網址') {
    showDriveBackupStatus('尚未設定 Google Drive 資料夾網址。', 'error');
    return;
  }

  window.open(DRIVE_BACKUP_CONFIG.driveFolderUrl, '_blank');
}

/**
 * 顯示 Google Drive 備份狀態
 */
function showDriveBackupStatus(message, type) {
  const statusDiv = document.getElementById('localBackupStatus');
  if (!statusDiv) {
    return;
  }

  statusDiv.textContent = message;
  statusDiv.className = 'home-save-status home-save-status-' + type;

  // 3秒後自動清除成功訊息
  if (type === 'success') {
    setTimeout(() => {
      if (statusDiv.textContent === message) {
        statusDiv.textContent = '';
        statusDiv.className = 'home-save-status';
      }
    }, 3000);
  }
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
  initGoogleDriveBackup();
});
