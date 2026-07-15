// Google Apps Script - 管理者後台系統
// 部署到 Google Apps Script 後，將網頁版 URL 替換到 admin.html 中的 API 變數
// 請在 Google Apps Script 編輯器中設定 SPREADSHEET_ID 和 ADMIN_PASSKEY

// ==================== 設定區 ====================
// 請將這些變數替換為實際值
var SPREADSHEET_ID = '請在這裡填入你的 Google Sheet ID';
var ADMIN_PASSKEY = '請在這裡填入管理者密碼';
// ================================================

function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  
  try {
    let result;
    
    if (action === 'adminGetPlayer') {
      result = adminGetPlayer_(JSON.parse(e.postData.contents));
    } else if (action === 'adminAdjustStars') {
      result = adminAdjustStars_(JSON.parse(e.postData.contents));
    } else if (action === 'adminUnlockItem') {
      result = adminUnlockItem_(JSON.parse(e.postData.contents));
    } else if (action === 'adminGetLogs') {
      result = adminGetLogs_(JSON.parse(e.postData.contents));
    } else if (action === 'adminCreateReward') {
      result = adminCreateReward_(JSON.parse(e.postData.contents));
    } else if (action === 'getMyRewards') {
      result = getMyRewards_(JSON.parse(e.postData.contents));
    } else if (action === 'claimReward') {
      result = claimReward_(JSON.parse(e.postData.contents));
    } else if (action === 'claimAllRewards') {
      result = claimAllRewards_(JSON.parse(e.postData.contents));
    } else {
      result = {success: false, message: '無效的操作'};
    }
    
    if (callback) {
      const jsonpResponse = `${callback}(${JSON.stringify(result)})`;
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
      
  } catch (error) {
    const errorResult = {success: false, message: error.toString()};
    
    if (callback) {
      const jsonpResponse = `${callback}(${JSON.stringify(errorResult)})`;
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(JSON.stringify(errorResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

function doPost(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;

  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    let result;

    if (action === 'adminGetPlayer') {
      result = adminGetPlayer_(payload);
    } else if (action === 'adminAdjustStars') {
      result = adminAdjustStars_(payload);
    } else if (action === 'adminUnlockItem') {
      result = adminUnlockItem_(payload);
    } else if (action === 'adminGetLogs') {
      result = adminGetLogs_(payload);
    } else if (action === 'adminCreateReward') {
      result = adminCreateReward_(payload);
    } else if (action === 'getMyRewards') {
      result = getMyRewards_(payload);
    } else if (action === 'claimReward') {
      result = claimReward_(payload);
    } else if (action === 'claimAllRewards') {
      result = claimAllRewards_(payload);
    } else if (action === 'sellCard') {
      result = sellCard_(payload);
    } else if (action === 'buyCard') {
      result = buyCard_(payload);
    } else if (action === 'cancelTrade') {
      result = cancelTrade_(payload);
    } else if (action === 'getMarketListings') {
      result = getMarketListings_(payload);
    } else if (action === 'getMyListings') {
      result = getMyListings_(payload);
    } else if (action === 'getSellerClaimableTrades') {
      result = getSellerClaimableTrades_(payload);
    } else if (action === 'claimSoldCardStars') {
      result = claimSoldCardStars_(payload);
    } else if (action === 'claimAllSoldCardStars') {
      result = claimAllSoldCardStars_(payload);
    } else {
      result = {success: false, message: '無效的操作'};
    }
    
    if (callback) {
      const jsonpResponse = `${callback}(${JSON.stringify(result)})`;
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
      
  } catch (error) {
    const errorResult = {success: false, message: error.toString()};
    
    if (callback) {
      const jsonpResponse = `${callback}(${JSON.stringify(errorResult)})`;
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(JSON.stringify(errorResult))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

function doOptions(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  return ContentService.createTextOutput('')
    .setHeaders(headers);
}

// ==================== 管理者驗證 ====================

function checkAdmin_(payload) {
  if (!payload.adminPasskey || payload.adminPasskey !== ADMIN_PASSKEY) {
    throw new Error('沒有管理者權限');
  }
}

// ==================== 欄位查找 helper ====================

function findColumn_(headers, names) {
  for (var i = 0; i < names.length; i++) {
    var index = headers.indexOf(names[i]);
    if (index !== -1) return index;
  }
  return -1;
}

// ==================== 工作表 helper ====================

function getPlayersSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Players');
  
  if (!sheet) {
    sheet = ss.getSheetByName('玩家資料');
  }
  if (!sheet) {
    sheet = ss.getSheetByName('users');
  }
  if (!sheet) {
    sheet = ss.getSheetByName('StudentData');
  }
  
  if (!sheet) {
    throw new Error('找不到玩家資料工作表 (Players/玩家資料/users/StudentData)');
  }
  
  return sheet;
}

function getAdminLogSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('AdminLogs');
  
  if (!sheet) {
    sheet = ss.insertSheet('AdminLogs');
    sheet.appendRow(['time', 'admin', 'userId', 'action', 'detail', 'reason']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    sheet.getRange(1, 1, 1, 6).setBackground('#4285f4');
    sheet.getRange(1, 1, 1, 6).setFontColor('white');
    sheet.autoResizeColumns(1, 6);
  }
  
  return sheet;
}

function getRewardsSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Rewards');
  
  if (!sheet) {
    sheet = ss.insertSheet('Rewards');
    sheet.appendRow([
      'rewardId',
      'userId',
      'userName',
      'rewardType',
      'rewardValue',
      'amount',
      'reason',
      'status',
      'createdAt',
      'claimedAt',
      'createdBy'
    ]);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
    sheet.getRange(1, 1, 1, 11).setBackground('#4285f4');
    sheet.getRange(1, 1, 1, 11).setFontColor('white');
    sheet.autoResizeColumns(1, 11);
  }
  
  return sheet;
}

function appendAdminLog_(log) {
  var sheet = getAdminLogSheet_();
  
  sheet.appendRow([
    new Date(),
    'admin',
    log.userId || '',
    log.action || '',
    log.detail || '',
    log.reason || ''
  ]);
}

// ==================== 管理者功能 ====================

function adminGetPlayer_(payload) {
  checkAdmin_(payload);
  
  var sheet = getPlayersSheet_();
  var values = sheet.getDataRange().getValues();
  
  if (values.length < 2) {
    throw new Error('沒有玩家資料');
  }
  
  var headers = values[0];
  
  var idCol = findColumn_(headers, ['userId', 'id', '玩家ID', '用戶']);
  var nameCol = findColumn_(headers, ['name', 'userName', '玩家名稱', '姓名', '用戶']);
  var starsCol = findColumn_(headers, ['stars', '星星']);
  var cardsCol = findColumn_(headers, ['unlockedCards', '已解鎖卡片']);
  var seriesCol = findColumn_(headers, ['unlockedSeries', '已解鎖系列']);
  var themesCol = findColumn_(headers, ['unlockedThemes', '已解鎖主題']);
  var levelsCol = findColumn_(headers, ['unlockedLevels', '已解鎖關卡']);
  var featuresCol = findColumn_(headers, ['unlockedFeatures', '已解鎖功能']);
  var itemsCol = findColumn_(headers, ['unlockedItems', '已解鎖道具']);
  var updatedAtCol = findColumn_(headers, ['updatedAt', '最後更新', '更新時間']);
  
  var keyword = String(payload.userId || '').trim();
  
  for (var i = 1; i < values.length; i++) {
    var rowId = idCol >= 0 ? String(values[i][idCol]) : '';
    var rowName = nameCol >= 0 ? String(values[i][nameCol]) : '';
    
    if (rowId === keyword || rowName === keyword) {
      return {
        success: true,
        player: {
          userId: rowId,
          name: rowName,
          stars: starsCol >= 0 ? values[i][starsCol] : 0,
          unlockedCards: cardsCol >= 0 ? values[i][cardsCol] : '',
          unlockedSeries: seriesCol >= 0 ? values[i][seriesCol] : '',
          unlockedThemes: themesCol >= 0 ? values[i][themesCol] : '',
          unlockedLevels: levelsCol >= 0 ? values[i][levelsCol] : '',
          unlockedFeatures: featuresCol >= 0 ? values[i][featuresCol] : '',
          unlockedItems: itemsCol >= 0 ? values[i][itemsCol] : '',
          updatedAt: updatedAtCol >= 0 ? values[i][updatedAtCol] : ''
        }
      };
    }
  }
  
  throw new Error('找不到玩家：' + keyword);
}

function adminAdjustStars_(payload) {
  checkAdmin_(payload);
  
  var sheet = getPlayersSheet_();
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  
  var idCol = findColumn_(headers, ['userId', 'id', '玩家ID', '用戶']);
  var nameCol = findColumn_(headers, ['name', 'userName', '玩家名稱', '姓名', '用戶']);
  var starsCol = findColumn_(headers, ['stars', '星星']);
  var updatedAtCol = findColumn_(headers, ['updatedAt', '最後更新', '更新時間']);
  
  if (starsCol === -1) {
    throw new Error('找不到星星欄位');
  }
  
  var keyword = String(payload.userId || '').trim();
  var amount = Number(payload.amount || 0);
  
  if (!keyword) {
    throw new Error('缺少玩家 ID');
  }
  
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('星星數量不正確');
  }
  
  for (var i = 1; i < values.length; i++) {
    var rowId = idCol >= 0 ? String(values[i][idCol]) : '';
    var rowName = nameCol >= 0 ? String(values[i][nameCol]) : '';
    
    if (rowId === keyword || rowName === keyword) {
      var rowNumber = i + 1;
      var oldStars = Number(values[i][starsCol] || 0);
      var newStars = oldStars;
      
      if (payload.type === 'add') {
        newStars = oldStars + amount;
      } else if (payload.type === 'subtract') {
        newStars = Math.max(0, oldStars - amount);
      } else if (payload.type === 'set') {
        newStars = amount;
      } else {
        throw new Error('未知的星星調整類型：' + payload.type);
      }
      
      sheet.getRange(rowNumber, starsCol + 1).setValue(newStars);
      
      if (updatedAtCol >= 0) {
        sheet.getRange(rowNumber, updatedAtCol + 1).setValue(new Date());
      }
      
      appendAdminLog_({
        action: '調整星星',
        userId: keyword,
        detail: '由 ' + oldStars + ' 調整為 ' + newStars,
        reason: payload.reason || ''
      });
      
      return {
        success: true,
        message: '星星調整成功',
        oldStars: oldStars,
        newStars: newStars
      };
    }
  }
  
  throw new Error('找不到玩家：' + keyword);
}

function adminUnlockItem_(payload) {
  checkAdmin_(payload);

  var sheet = getPlayersSheet_();
  var values = sheet.getDataRange().getValues();
  var headers = values[0];

  var idCol = findColumn_(headers, ['userId', 'id', '玩家ID', '用戶']);
  var nameCol = findColumn_(headers, ['name', 'userName', '玩家名稱', '姓名', '用戶']);
  var updatedAtCol = findColumn_(headers, ['updatedAt', '最後更新', '更新時間']);

  var targetColNameMap = {
    card: ['unlockedCards', '已解鎖卡片'],
    series: ['unlockedSeries', '已解鎖系列'],
    theme: ['unlockedThemes', '已解鎖主題'],
    level: ['unlockedLevels', '已解鎖關卡'],
    feature: ['unlockedFeatures', '已解鎖功能'],
    item: ['unlockedItems', '已解鎖道具']
  };

  var names = targetColNameMap[payload.unlockType];

  if (!names) {
    throw new Error('未知的解鎖類型：' + payload.unlockType);
  }

  var unlockCol = findColumn_(headers, names);

  if (unlockCol === -1) {
    throw new Error('找不到解鎖欄位：' + names.join(' / '));
  }

  // 關卡到卡片的映射
  var levelToCardMap = {
    'aries': 'Aries',
    'taurus': 'Taurus',
    'gemini': 'Gemini',
    'cancer': 'Cancer',
    'leo': 'Leo',
    'virgo': 'Virgo',
    'libra': 'Libra',
    'scorpio': 'Scorpio',
    'sagittarius': 'Sagittarius',
    'capricorn': 'Capricorn',
    'aquarius': 'Aquarius',
    'pisces': 'Pisces',
    'zeus': 'Zeus',
    'hera': 'Hera',
    'poseidon': 'Poseidon',
    'athena': 'Athena',
    'apollo': 'Apollo',
    'artemis': 'Artemis',
    'ares': 'Ares',
    'aphrodite': 'Aphrodite',
    'hades': 'Hades',
    'demeter': 'Demeter',
    'dionysus': 'Dionysus',
    'hephaestus': 'Hephaestus',
    'hermes': 'Hermes',
    'hestia': 'Hestia',
    'persephone': 'Persephone',
    'nike': 'Nike',
    'eros': 'Eros'
  };

  var unlockId = String(payload.unlockId || '').trim();
  var keyword = String(payload.userId || '').trim();

  if (!keyword) {
    throw new Error('缺少玩家 ID 或名稱');
  }

  if (!unlockId) {
    throw new Error('缺少要解鎖的 ID');
  }

  for (var i = 1; i < values.length; i++) {
    var rowId = idCol >= 0 ? String(values[i][idCol] || '').trim() : '';
    var rowName = nameCol >= 0 ? String(values[i][nameCol] || '').trim() : '';

    if (rowId === keyword || rowName === keyword) {
      var rowNumber = i + 1;

      // 解鎖主要項目
      var oldValue = String(values[i][unlockCol] || '').trim();
      var list = oldValue
        ? oldValue.split(',').map(function(x) { return x.trim(); }).filter(Boolean)
        : [];

      if (list.indexOf(unlockId) === -1) {
        list.push(unlockId);
      }

      sheet.getRange(rowNumber, unlockCol + 1).setValue(list.join(','));

      // 如果是解鎖關卡，同時解鎖對應卡片
      if (payload.unlockType === 'level' && levelToCardMap[unlockId]) {
        var cardId = levelToCardMap[unlockId];
        var cardNames = targetColNameMap.card;
        var cardCol = findColumn_(headers, cardNames);

        if (cardCol >= 0) {
          var oldCardValue = String(values[i][cardCol] || '').trim();
          var cardList = oldCardValue
            ? oldCardValue.split(',').map(function(x) { return x.trim(); }).filter(Boolean)
            : [];

          if (cardList.indexOf(cardId) === -1) {
            cardList.push(cardId);
          }

          sheet.getRange(rowNumber, cardCol + 1).setValue(cardList.join(','));
        }
      }

      if (updatedAtCol >= 0) {
        sheet.getRange(rowNumber, updatedAtCol + 1).setValue(new Date());
      }

      if (typeof appendAdminLog_ === 'function') {
        appendAdminLog_({
          action: '解鎖並通關',
          userId: keyword,
          detail: unlockId,
          reason: payload.reason || ''
        });
      }

      return {
        success: true,
        message: '解鎖並通關成功',
        unlockType: payload.unlockType,
        unlockId: unlockId
      };
    }
  }

  throw new Error('找不到玩家：' + keyword);
}

function adminGetLogs_(payload) {
  checkAdmin_(payload);
  
  var sheet = getAdminLogSheet_();
  var values = sheet.getDataRange().getValues();
  
  if (values.length < 2) {
    return {
      success: true,
      logs: []
    };
  }
  
  var logs = values.slice(1).slice(-50).reverse().map(function(row) {
    return {
      time: row[0],
      admin: row[1],
      userId: row[2],
      action: row[3],
      detail: row[4],
      reason: row[5]
    };
  });
  
  return {
    success: true,
    logs: logs
  };
}

// ==================== 獎勵系統 ====================

function adminCreateReward_(payload) {
  checkAdmin_(payload);
  
  var sheet = getRewardsSheet_();
  
  var userId = String(payload.userId || '').trim();
  var rewardType = String(payload.rewardType || '').trim();
  var rewardValue = String(payload.rewardValue || '').trim();
  var amount = Number(payload.amount || 1);
  var reason = String(payload.reason || '').trim();
  
  if (!userId) {
    throw new Error('缺少玩家 ID');
  }
  
  if (!rewardType) {
    throw new Error('缺少獎勵類型');
  }
  
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('獎勵數量不正確');
  }
  
  var rewardId = 'RWD-' + new Date().getTime() + '-' + Math.floor(Math.random() * 10000);
  
  sheet.appendRow([
    rewardId,
    userId,
    '',
    rewardType,
    rewardValue,
    amount,
    reason,
    'pending',
    new Date(),
    '',
    'admin'
  ]);
  
  appendAdminLog_({
    action: '發放獎勵',
    userId: userId,
    detail: rewardType + '：' + rewardValue + ' x ' + amount,
    reason: reason
  });
  
  return {
    success: true,
    message: '獎勵已建立',
    rewardId: rewardId
  };
}

function getMyRewards_(payload) {
  var sheet = getRewardsSheet_();
  var values = sheet.getDataRange().getValues();
  
  if (values.length < 2) {
    return {
      success: true,
      rewards: []
    };
  }
  
  var headers = values[0];
  
  var rewardIdCol = headers.indexOf('rewardId');
  var userIdCol = headers.indexOf('userId');
  var rewardTypeCol = headers.indexOf('rewardType');
  var rewardValueCol = headers.indexOf('rewardValue');
  var amountCol = headers.indexOf('amount');
  var reasonCol = headers.indexOf('reason');
  var statusCol = headers.indexOf('status');
  var createdAtCol = headers.indexOf('createdAt');
  
  var userId = String(payload.userId || '').trim();
  
  if (!userId) {
    throw new Error('缺少玩家 ID');
  }
  
  var rewards = [];
  
  for (var i = 1; i < values.length; i++) {
    var rowUserId = String(values[i][userIdCol] || '').trim();
    var status = String(values[i][statusCol] || '').trim();
    
    if (rowUserId === userId && status === 'pending') {
      rewards.push({
        rewardId: values[i][rewardIdCol],
        userId: rowUserId,
        rewardType: values[i][rewardTypeCol],
        rewardValue: values[i][rewardValueCol],
        amount: values[i][amountCol],
        reason: values[i][reasonCol],
        createdAt: values[i][createdAtCol]
      });
    }
  }
  
  return {
    success: true,
    rewards: rewards
  };
}

function claimReward_(payload) {
  var userId = String(payload.userId || '').trim();
  var rewardId = String(payload.rewardId || '').trim();
  
  if (!userId) {
    throw new Error('缺少玩家 ID');
  }
  
  if (!rewardId) {
    throw new Error('缺少 rewardId');
  }
  
  var reward = findPendingReward_(userId, rewardId);
  
  if (!reward) {
    throw new Error('找不到可領取獎勵，或此獎勵已領取');
  }
  
  applyRewardToPlayer_(userId, reward);
  
  markRewardClaimed_(reward.rowNumber);
  
  return {
    success: true,
    message: '領取成功',
    rewardId: rewardId
  };
}

function findPendingReward_(userId, rewardId) {
  var sheet = getRewardsSheet_();
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  
  var rewardIdCol = headers.indexOf('rewardId');
  var userIdCol = headers.indexOf('userId');
  var rewardTypeCol = headers.indexOf('rewardType');
  var rewardValueCol = headers.indexOf('rewardValue');
  var amountCol = headers.indexOf('amount');
  var reasonCol = headers.indexOf('reason');
  var statusCol = headers.indexOf('status');
  
  for (var i = 1; i < values.length; i++) {
    var rowRewardId = String(values[i][rewardIdCol] || '').trim();
    var rowUserId = String(values[i][userIdCol] || '').trim();
    var status = String(values[i][statusCol] || '').trim();
    
    if (rowRewardId === rewardId && rowUserId === userId && status === 'pending') {
      return {
        rowNumber: i + 1,
        rewardId: rowRewardId,
        userId: rowUserId,
        rewardType: values[i][rewardTypeCol],
        rewardValue: values[i][rewardValueCol],
        amount: Number(values[i][amountCol] || 1),
        reason: values[i][reasonCol]
      };
    }
  }
  
  return null;
}

function markRewardClaimed_(rowNumber) {
  var sheet = getRewardsSheet_();
  var headers = sheet.getDataRange().getValues()[0];
  
  var statusCol = headers.indexOf('status');
  var claimedAtCol = headers.indexOf('claimedAt');
  
  if (statusCol >= 0) {
    sheet.getRange(rowNumber, statusCol + 1).setValue('claimed');
  }
  
  if (claimedAtCol >= 0) {
    sheet.getRange(rowNumber, claimedAtCol + 1).setValue(new Date());
  }
}

function applyRewardToPlayer_(userId, reward) {
  var sheet = getPlayersSheet_();
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  
  var idCol = findColumn_(headers, ['userId', 'id', '玩家ID']);
  var nameCol = findColumn_(headers, ['name', 'userName', '玩家名稱', '姓名']);
  var starsCol = findColumn_(headers, ['stars', '星星']);
  var updatedAtCol = findColumn_(headers, ['updatedAt', '最後更新', '更新時間']);
  
  var targetRow = -1;
  
  for (var i = 1; i < values.length; i++) {
    var rowId = idCol >= 0 ? String(values[i][idCol] || '').trim() : '';
    var rowName = nameCol >= 0 ? String(values[i][nameCol] || '').trim() : '';
    
    if (rowId === userId || rowName === userId) {
      targetRow = i + 1;
      break;
    }
  }
  
  if (targetRow === -1) {
    throw new Error('找不到玩家資料：' + userId);
  }
  
  if (reward.rewardType === 'stars') {
    if (starsCol === -1) {
      throw new Error('找不到星星欄位');
    }
    
    var oldStars = Number(sheet.getRange(targetRow, starsCol + 1).getValue() || 0);
    var newStars = oldStars + Number(reward.amount || 0);
    
    sheet.getRange(targetRow, starsCol + 1).setValue(newStars);
  } else {
    var map = {
      card: ['unlockedCards', '已解鎖卡片'],
      series: ['unlockedSeries', '已解鎖系列'],
      theme: ['unlockedThemes', '已解鎖主題'],
      level: ['unlockedLevels', '已解鎖關卡'],
      feature: ['unlockedFeatures', '已解鎖功能'],
      item: ['unlockedItems', '已解鎖道具']
    };
    
    var names = map[reward.rewardType];
    
    if (!names) {
      throw new Error('未知獎勵類型：' + reward.rewardType);
    }
    
    var col = findColumn_(headers, names);
    
    if (col === -1) {
      throw new Error('找不到解鎖欄位：' + names.join('/'));
    }
    
    var oldValue = String(sheet.getRange(targetRow, col + 1).getValue() || '').trim();
    var list = oldValue
      ? oldValue.split(',').map(function(x) { return x.trim(); }).filter(Boolean)
      : [];
    
    var unlockId = String(reward.rewardValue || '').trim();
    
    if (!unlockId) {
      throw new Error('缺少解鎖 ID');
    }
    
    if (list.indexOf(unlockId) === -1) {
      list.push(unlockId);
    }
    
    sheet.getRange(targetRow, col + 1).setValue(list.join(','));
  }
  
  if (updatedAtCol >= 0) {
    sheet.getRange(targetRow, updatedAtCol + 1).setValue(new Date());
  }
}

function claimAllRewards_(payload) {
  var userId = String(payload.userId || '').trim();
  
  if (!userId) {
    throw new Error('缺少玩家 ID');
  }
  
  var result = getMyRewards_(payload);
  var rewards = result.rewards || [];
  var claimedCount = 0;
  
  for (var i = 0; i < rewards.length; i++) {
    claimReward_({
      userId: userId,
      rewardId: rewards[i].rewardId
    });
    
    claimedCount++;
  }
  
  return {
    success: true,
    message: '全部領取完成',
    claimedCount: claimedCount
  };
}
