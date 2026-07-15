/**
 * Google Apps Script - Google Drive 雲端備份後端
 * 
 * 設定教學：
 * 1. 到 Google Drive 建立一個資料夾，例如：GameBackup
 * 2. 開啟資料夾，從網址取得 folder ID
 *    例如網址：https://drive.google.com/drive/folders/ABCDEFG123456
 *    folder ID 就是：ABCDEFG123456
 * 3. 到 Google Apps Script 建立新專案
 * 4. 貼上本檔案程式碼
 * 5. 把 DRIVE_FOLDER_ID 改成自己的資料夾 ID
 * 6. 點部署 > 新增部署作業
 * 7. 類型選擇 Web App
 * 8. 執行身分選擇：我
 * 9. 存取權限選擇：任何知道連結的人
 * 10. 部署後複製 Web App URL
 * 11. 回到網站專案，把 Web App URL 貼到 DRIVE_BACKUP_CONFIG.appsScriptUrl
 * 12. 把 Google Drive 資料夾網址貼到 DRIVE_BACKUP_CONFIG.driveFolderUrl
 */

const DRIVE_FOLDER_ID = '1iUGtcVvOlzVqa7Ihr8XSkXphWr_WYPg-';
const BACKUP_FILE_NAME = 'game-backup-latest.json';

/**
 * 處理 POST 請求
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;

    if (action === 'upload') {
      return uploadBackup(body);
    }

    if (action === 'download') {
      return downloadBackup();
    }

    return jsonResponse({
      success: false,
      message: '未知操作'
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message
    });
  }
}

/**
 * 上傳備份到 Google Drive
 */
function uploadBackup(body) {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const fileName = body.fileName || BACKUP_FILE_NAME;
  const backup = body.backup;
  const saveMode = body.saveMode || 'history';

  if (!backup) {
    return jsonResponse({
      success: false,
      message: '缺少備份資料'
    });
  }

  const content = JSON.stringify(backup, null, 2);
  let file;

  if (saveMode === 'history') {
    // history 模式：每次都建立新檔案
    file = folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
  } else {
    // latest 模式：同名檔案存在就覆蓋
    const files = folder.getFilesByName(fileName);

    if (files.hasNext()) {
      file = files.next();
      file.setContent(content);
    } else {
      file = folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
    }
  }

  return jsonResponse({
    success: true,
    message: '上傳成功',
    fileName: file.getName(),
    fileUrl: file.getUrl(),
    updatedAt: new Date().toISOString()
  });
}

/**
 * 找出最新的備份檔案
 */
function findLatestBackupFile(folder) {
  const files = folder.getFiles();
  let latestFile = null;
  let latestTime = 0;

  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();

    if (!name.includes('遊戲備份') || !name.endsWith('.json')) {
      continue;
    }

    const updatedTime = file.getLastUpdated().getTime();

    if (updatedTime > latestTime) {
      latestTime = updatedTime;
      latestFile = file;
    }
  }

  return latestFile;
}

/**
 * 從 Google Drive 下載備份
 */
function downloadBackup() {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const file = findLatestBackupFile(folder);

  if (!file) {
    return jsonResponse({
      success: false,
      message: '找不到備份檔'
    });
  }

  const content = file.getBlob().getDataAsString('UTF-8');
  const backup = JSON.parse(content);

  return jsonResponse({
    success: true,
    message: '下載成功',
    fileName: file.getName(),
    fileUrl: file.getUrl(),
    backup: backup,
    downloadedAt: new Date().toISOString()
  });
}

/**
 * 回傳 JSON 回應
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
