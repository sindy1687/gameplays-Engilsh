// Google Apps Script 程式碼 - 優惠碼兌換功能

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return jsonResponse({
    success: false,
    message: '信箱系統已移除'
  });
}

function doPost(e) {
  try {
    var body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : null;

    if (body && body.action === 'redeemCoupon') {
      return jsonResponse(redeemCoupon(body));
    }

    return jsonResponse({
      success: false,
      message: '信箱系統已移除'
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message
    });
  }
}

// 優惠碼兌換功能
function redeemCoupon(body) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // 等待鎖定，最多10秒

    const couponCode = (body.couponCode || '').toUpperCase().trim();
    const playerId = body.playerId;
    const playerName = body.playerName || '玩家';

    // 驗證輸入
    if (!couponCode) {
      return { success: false, message: '請先輸入優惠碼' };
    }

    if (!playerId) {
      return { success: false, message: '玩家ID不存在' };
    }

    // 確保玩家存在
    ensurePlayer(playerId, playerName);

    // 讀取 coupons 表
    const couponsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('coupons');
    if (!couponsSheet) {
      return { success: false, message: '找不到優惠碼資料表' };
    }

    const couponsData = couponsSheet.getDataRange().getValues();
    if (couponsData.length <= 1) {
      return { success: false, message: '找不到這組優惠碼' };
    }

    const couponsHeaders = couponsData[0];
    const couponCodeCol = couponsHeaders.indexOf('couponCode');
    const starsCol = couponsHeaders.indexOf('stars');
    const maxUsesCol = couponsHeaders.indexOf('maxUses');
    const usedCountCol = couponsHeaders.indexOf('usedCount');
    const expiresAtCol = couponsHeaders.indexOf('expiresAt');
    const isActiveCol = couponsHeaders.indexOf('isActive');

    if (couponCodeCol === -1 || starsCol === -1) {
      return { success: false, message: '優惠碼資料表格式錯誤' };
    }

    // 尋找優惠碼
    let couponRow = -1;
    let couponData = null;

    for (let i = 1; i < couponsData.length; i++) {
      if (String(couponsData[i][couponCodeCol]).toUpperCase() === couponCode) {
        couponRow = i;
        couponData = couponsData[i];
        break;
      }
    }

    if (couponRow === -1) {
      return { success: false, message: '找不到這組優惠碼' };
    }

    // 檢查優惠碼是否啟用
    if (isActiveCol !== -1 && String(couponData[isActiveCol]).toUpperCase() !== 'TRUE') {
      return { success: false, message: '這組優惠碼已停用' };
    }

    // 檢查過期時間
    if (expiresAtCol !== -1 && couponData[expiresAtCol]) {
      const expiresAt = new Date(couponData[expiresAtCol]);
      if (expiresAt < new Date()) {
        return { success: false, message: '這組優惠碼已過期' };
      }
    }

    // 檢查使用次數
    const maxUses = maxUsesCol !== -1 ? Number(couponData[maxUsesCol]) || 9999 : 9999;
    const usedCount = usedCountCol !== -1 ? Number(couponData[usedCountCol]) || 0 : 0;

    if (usedCount >= maxUses) {
      return { success: false, message: '這組優惠碼已兌換完畢' };
    }

    // 檢查是否已兌換過
    const redemptionsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('coupon_redemptions');
    if (!redemptionsSheet) {
      redemptionsSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('coupon_redemptions');
      redemptionsSheet.getRange(1, 1, 1, 5).setValues([['redeemId', 'couponCode', 'playerId', 'playerName', 'stars', 'createdAt']]);
      redemptionsSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      redemptionsSheet.getRange(1, 1, 1, 5).setBackground('#4285f4');
      redemptionsSheet.getRange(1, 1, 1, 5).setFontColor('white');
    }

    const redemptionsData = redemptionsSheet.getDataRange().getValues();
    const redemptionsHeaders = redemptionsData[0];
    const redeemCouponCodeCol = redemptionsHeaders.indexOf('couponCode');
    const redeemPlayerIdCol = redemptionsHeaders.indexOf('playerId');

    for (let i = 1; i < redemptionsData.length; i++) {
      if (String(redemptionsData[i][redeemCouponCodeCol]).toUpperCase() === couponCode &&
          String(redemptionsData[i][redeemPlayerIdCol]) === String(playerId)) {
        return { success: false, message: '你已經兌換過這組優惠碼' };
      }
    }

    // 讀取星星數量
    const stars = Number(couponData[starsCol]) || 0;
    if (stars <= 0) {
      return { success: false, message: '優惠碼星星數量異常' };
    }

    // 更新玩家星星
    const playersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('players');
    if (!playersSheet) {
      return { success: false, message: '找不到玩家資料表' };
    }

    const playersData = playersSheet.getDataRange().getValues();
    const playersHeaders = playersData[0];
    const playerIdCol = playersHeaders.indexOf('playerId');
    const playerStarsCol = playersHeaders.indexOf('stars');

    let playerRow = -1;
    for (let i = 1; i < playersData.length; i++) {
      if (String(playersData[i][playerIdCol]) === String(playerId)) {
        playerRow = i;
        break;
      }
    }

    if (playerRow === -1) {
      return { success: false, message: '找不到玩家資料' };
    }

    const currentStars = Number(playersData[playerRow][playerStarsCol]) || 0;
    const newStars = currentStars + stars;

    playersSheet.getRange(playerRow + 1, playerStarsCol + 1).setValue(newStars);

    // 更新優惠碼使用次數
    couponsSheet.getRange(couponRow + 1, usedCountCol + 1).setValue(usedCount + 1);

    // 記錄兌換紀錄
    const redeemId = Utilities.getUuid();
    const createdAt = new Date().toLocaleString('zh-TW');
    redemptionsSheet.appendRow([redeemId, couponCode, playerId, playerName, stars, createdAt]);

    return {
      success: true,
      message: `兌換成功，獲得 ${stars} 星星`,
      stars: stars,
      playerStars: newStars
    };

  } catch (error) {
    Logger.log('redeemCoupon 錯誤: ' + error.toString());
    return { success: false, message: '兌換失敗，請稍後再試' };
  } finally {
    lock.releaseLock();
  }
}

// 確保玩家存在
function ensurePlayer(playerId, playerName) {
  const playersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('players');
  if (!playersSheet) {
    playersSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('players');
    playersSheet.getRange(1, 1, 1, 4).setValues([['playerId', 'playerName', 'stars', 'createdAt']]);
    playersSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    playersSheet.getRange(1, 1, 1, 4).setBackground('#4285f4');
    playersSheet.getRange(1, 1, 1, 4).setFontColor('white');
  }

  const playersData = playersSheet.getDataRange().getValues();
  const playersHeaders = playersData[0];
  const playerIdCol = playersHeaders.indexOf('playerId');

  for (let i = 1; i < playersData.length; i++) {
    if (String(playersData[i][playerIdCol]) === String(playerId)) {
      return; // 玩家已存在
    }
  }

  // 新增玩家
  const createdAt = new Date().toLocaleString('zh-TW');
  playersSheet.appendRow([playerId, playerName, 0, createdAt]);
} 