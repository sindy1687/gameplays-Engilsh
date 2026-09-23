// Google Apps Script - 聊天室和排行榜系統
// 部署到 Google Apps Script 後，將網頁版 URL 替換到 HTML 檔案中的 API 變數

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e.parameter.action;
  const user = e.parameter.user;
  const callback = e.parameter.callback;

  try {
    let result;

    if (action === 'getChatMessages') {
      result = getChatMessages();
    } else if (action === 'sendChatMessage') {
      const messageData = {
        user: e.parameter.user,
        message: e.parameter.message,
        time: new Date().toLocaleString('zh-TW'),
        type: e.parameter.type || 'text',
        card: e.parameter.card ? JSON.parse(e.parameter.card) : null
      };
      result = sendChatMessage(messageData);
    } else if (action === 'getLeaderboard') {
      result = getLeaderboard();
    } else if (action === 'updateScore') {
      const scoreData = {
        user: e.parameter.user,
        score: parseInt(e.parameter.score),
        level: e.parameter.level || '1',
        time: new Date().toLocaleString('zh-TW')
      };
      result = updateScore(scoreData);
    } else if (action === 'getUserStats') {
      result = getUserStats(user);
    } else if (action === 'getStarsLeaderboard') {
      result = getStarsLeaderboard();
    } else if (action === 'getStarsStats') {
      result = getStarsStats();
    } else if (action === 'updateStars') {
      const starsData = {
        user: e.parameter.user,
        stars: parseInt(e.parameter.stars),
        time: new Date().toLocaleString('zh-TW')
      };
      result = updateStars(starsData);
    } else if (action === 'initializeChatAndLeaderboard') {
      result = initializeChatAndLeaderboard();
    } else if (action === 'addQuizScore') {
      const quizData = {
        playerName: e.parameter.playerName,
        score: parseInt(e.parameter.score),
        correctCount: parseInt(e.parameter.correctCount),
        category: e.parameter.category,
        date: e.parameter.date,
        totalTime: parseInt(e.parameter.totalTime)
      };
      result = addQuizScore(quizData);
    } else if (action === 'getQuizLeaderboard') {
      const category = e.parameter.category;
      result = getQuizLeaderboard(category);
    } else if (action === 'addGreekScore') {
      result = addGreekScore(e.parameter);
    } else if (action === 'getGreekLeaderboard') {
      const category = e.parameter.category;
      result = getGreekLeaderboard(category);
    } else {
      result = {error: '無效的操作'};
    }

    // 如果有回調函數，使用 JSONP 格式
    if (callback) {
      const jsonpResponse = `${callback}(${JSON.stringify(result)})`;
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      // 否則使用一般 JSON 格式
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    const errorResult = {error: error.toString()};

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
  Logger.log('doPost received: ' + JSON.stringify(e.parameter));

  // 對於 POST 請求，從 e.parameter 獲取參數（form-urlencoded 格式）
  // 或者從 e.postData.contents 獲取 JSON 格式
  let action = e.parameter.action;

  // 如果 action 在 parameter 中找不到，嘗試從 postData 中解析
  if (!action && e.postData && e.postData.contents) {
    try {
      const postData = JSON.parse(e.postData.contents);
      action = postData.action;
    } catch (e) {
      // 不是 JSON，可能是 form-urlencoded，已經在 e.parameter 中
    }
  }

  // 構建一個模擬的 e 對象，確保 action 被正確設置
  const mockE = {
    parameter: e.parameter
  };

  // 如果 action 是從 postData 解析出來的，添加到 parameter
  if (action && !e.parameter.action) {
    mockE.parameter.action = action;
  }

  return doGet(mockE);
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

// 取得聊天訊息
function getChatMessages() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('聊天室');
    if (!sheet) {
      createChatSheet();
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const userCol = headers.indexOf('用戶');
    const messageCol = headers.indexOf('訊息');
    const timeCol = headers.indexOf('時間');
    const typeCol = headers.indexOf('類型');
    const cardJsonCol = headers.indexOf('卡片資料');
    
    if (userCol === -1 || messageCol === -1) {
      Logger.log('找不到必要的欄位');
      return [];
    }
    
    const messages = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[userCol] && row[messageCol]) {
        let card = null;
        if (cardJsonCol !== -1 && row[cardJsonCol]) {
          try {
            card = JSON.parse(row[cardJsonCol]);
          } catch (e) {
            card = null;
          }
        }
        
        messages.push({
          user: row[userCol],
          message: row[messageCol],
          time: row[timeCol] || '',
          type: typeCol !== -1 ? (row[typeCol] || 'text') : 'text',
          card: card
        });
      }
    }
    
    // 只返回最新的 50 條訊息
    return messages.slice(-50);
  } catch (error) {
    Logger.log('getChatMessages 錯誤: ' + error.toString());
    return [];
  }
}

// 發送聊天訊息
function sendChatMessage(messageData) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('聊天室');
    if (!sheet) {
      sheet = createChatSheet();
    }
    
    const data = sheet.getDataRange().getValues();
    let headers = data[0];
    
    // 如果沒有標題行或標題行不完整，重新建立標題行
    if (headers.length === 0 || headers[0] === '' || headers.length < 3) {
      sheet.clear();
      sheet.getRange(1, 1, 1, 5).setValues([['用戶', '訊息', '時間', '類型', '卡片資料']]);
      headers = ['用戶', '訊息', '時間', '類型', '卡片資料'];
      
      // 設定標題行樣式
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      sheet.getRange(1, 1, 1, 5).setBackground('#4285f4');
      sheet.getRange(1, 1, 1, 5).setFontColor('white');
      sheet.autoResizeColumns(1, 5);
    }
    
    // 檢查訊息長度
    if (messageData.message.length > 200) {
      return {success: false, error: '訊息太長，請縮短至 200 字以內'};
    }
    
    // 檢查是否包含不當內容
    const inappropriateWords = ['罵人', '髒話', '廣告'];
    for (let word of inappropriateWords) {
      if (messageData.message.includes(word)) {
        return {success: false, error: '訊息包含不當內容'};
      }
    }
    
    const cardJson = messageData.card ? JSON.stringify(messageData.card) : '';
    
    const newRow = [
      messageData.user,
      messageData.message,
      messageData.time,
      messageData.type || 'text',
      cardJson
    ];
    
    sheet.appendRow(newRow);
    
    // 如果訊息超過 100 條，刪除最舊的 20 條
    const totalRows = sheet.getLastRow();
    if (totalRows > 100) {
      sheet.deleteRows(2, 20);
    }
    
    Logger.log(`聊天訊息已發送: ${messageData.user}: ${messageData.message}`);
    return {success: true, message: '訊息已發送'};
  } catch (error) {
    Logger.log('sendChatMessage 錯誤: ' + error.toString());
    return {success: false, error: error.toString()};
  }
}

// 取得排行榜
function getLeaderboard() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('排行榜');
    if (!sheet) {
      createLeaderboardSheet();
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const userCol = headers.indexOf('用戶');
    const scoreCol = headers.indexOf('分數');
    const levelCol = headers.indexOf('等級');
    const timeCol = headers.indexOf('更新時間');
    
    if (userCol === -1 || scoreCol === -1) {
      Logger.log('找不到必要的欄位');
      return [];
    }
    
    const leaderboard = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[userCol] && row[scoreCol]) {
        leaderboard.push({
          rank: 0, // 稍後計算
          user: row[userCol],
          score: parseInt(row[scoreCol]) || 0,
          level: row[levelCol] || '1',
          time: row[timeCol] || ''
        });
      }
    }
    
    // 按分數排序並計算排名
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    // 只返回前 50 名
    return leaderboard.slice(0, 50);
  } catch (error) {
    Logger.log('getLeaderboard 錯誤: ' + error.toString());
    return [];
  }
}

// 更新分數
function updateScore(scoreData) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('排行榜');
    if (!sheet) {
      sheet = createLeaderboardSheet();
    }
    
    const data = sheet.getDataRange().getValues();
    let headers = data[0];
    
    // 如果沒有標題行或標題行不完整，重新建立標題行
    if (headers.length === 0 || headers[0] === '' || headers.length < 6) {
      sheet.clear();
      sheet.getRange(1, 1, 1, 6).setValues([['用戶', '分數', '等級', '星星', '訊息數', '更新時間']]);
      headers = ['用戶', '分數', '等級', '星星', '訊息數', '更新時間'];
      
      // 設定標題行樣式
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      sheet.getRange(1, 1, 1, 6).setBackground('#4285f4');
      sheet.getRange(1, 1, 1, 6).setFontColor('white');
      sheet.autoResizeColumns(1, 6);
    }
    
    const userCol = headers.indexOf('用戶');
    const scoreCol = headers.indexOf('分數');
    const levelCol = headers.indexOf('等級');
    const starsCol = headers.indexOf('星星');
    const messagesCol = headers.indexOf('訊息數');
    const timeCol = headers.indexOf('更新時間');
    
    // 檢查是否已存在該用戶
    let userRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][userCol] === scoreData.user) {
        userRow = i;
        break;
      }
    }
    
    if (userRow > 0) {
      // 更新現有用戶的分數
      const currentScore = parseInt(data[userRow][scoreCol]) || 0;
      const newScore = Math.max(currentScore, scoreData.score);
      
      sheet.getRange(userRow + 1, scoreCol + 1).setValue(newScore);
      sheet.getRange(userRow + 1, levelCol + 1).setValue(scoreData.level);
      sheet.getRange(userRow + 1, timeCol + 1).setValue(scoreData.time);
      
      Logger.log(`更新用戶分數: ${scoreData.user} - ${newScore}`);
      return {success: true, message: '分數已更新', newScore: newScore};
    } else {
      // 新增用戶
      const newRow = [
        scoreData.user,
        scoreData.score,
        scoreData.level,
        0, // 星星初始值
        0, // 訊息數初始值
        scoreData.time
      ];
      
      sheet.appendRow(newRow);
      
      Logger.log(`新增用戶分數: ${scoreData.user} - ${scoreData.score}`);
      return {success: true, message: '分數已記錄', newScore: scoreData.score};
    }
  } catch (error) {
    Logger.log('updateScore 錯誤: ' + error.toString());
    return {success: false, error: error.toString()};
  }
}

// 取得用戶統計
function getUserStats(user) {
  try {
    const leaderboardSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('排行榜');
    const chatSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('聊天室');
    
    let userStats = {
      user: user,
      score: 0,
      level: '1',
      rank: 0,
      messageCount: 0,
      lastActive: ''
    };
    
    // 取得排行榜資料
    if (leaderboardSheet) {
      const leaderboardData = leaderboardSheet.getDataRange().getValues();
      const headers = leaderboardData[0];
      const userCol = headers.indexOf('用戶');
      const scoreCol = headers.indexOf('分數');
      const levelCol = headers.indexOf('等級');
      const timeCol = headers.indexOf('更新時間');
      
      for (let i = 1; i < leaderboardData.length; i++) {
        const row = leaderboardData[i];
        if (row[userCol] === user) {
          userStats.score = parseInt(row[scoreCol]) || 0;
          userStats.level = row[levelCol] || '1';
          userStats.lastActive = row[timeCol] || '';
          break;
        }
      }
      
      // 計算排名
      const allScores = [];
      for (let i = 1; i < leaderboardData.length; i++) {
        const row = leaderboardData[i];
        if (row[userCol] && row[scoreCol]) {
          allScores.push({
            user: row[userCol],
            score: parseInt(row[scoreCol]) || 0
          });
        }
      }
      
      allScores.sort((a, b) => b.score - a.score);
      const userIndex = allScores.findIndex(item => item.user === user);
      userStats.rank = userIndex >= 0 ? userIndex + 1 : 0;
    }
    
    // 計算聊天訊息數量
    if (chatSheet) {
      const chatData = chatSheet.getDataRange().getValues();
      const headers = chatData[0];
      const userCol = headers.indexOf('用戶');
      
      for (let i = 1; i < chatData.length; i++) {
        const row = chatData[i];
        if (row[userCol] === user) {
          userStats.messageCount++;
        }
      }
    }
    
    return userStats;
  } catch (error) {
    Logger.log('getUserStats 錯誤: ' + error.toString());
    return {error: error.toString()};
  }
}

// 建立聊天室工作表
function createChatSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('聊天室');
    
    if (!sheet) {
      sheet = ss.insertSheet('聊天室');
      Logger.log('已建立新的聊天室工作表');
    } else {
      Logger.log('找到現有的聊天室工作表');
    }
    
    // 設定標題行
    sheet.getRange(1, 1, 1, 5).setValues([['用戶', '訊息', '時間', '類型', '卡片資料']]);
    
    // 設定標題行樣式
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    sheet.getRange(1, 1, 1, 5).setBackground('#4285f4');
    sheet.getRange(1, 1, 1, 5).setFontColor('white');
    
    // 自動調整欄寬
    sheet.autoResizeColumns(1, 5);
    
    Logger.log('聊天室工作表設定完成');
    return sheet;
  } catch (error) {
    Logger.log('createChatSheet 錯誤: ' + error.toString());
    throw error;
  }
}

// 建立排行榜工作表
function createLeaderboardSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('排行榜');
    
    if (!sheet) {
      sheet = ss.insertSheet('排行榜');
      Logger.log('已建立新的排行榜工作表');
    } else {
      Logger.log('找到現有的排行榜工作表');
    }
    
    // 設定標題行
    sheet.getRange(1, 1, 1, 6).setValues([['用戶', '分數', '等級', '星星', '訊息數', '更新時間']]);
    
    // 設定標題行樣式
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    sheet.getRange(1, 1, 1, 6).setBackground('#4285f4');
    sheet.getRange(1, 1, 1, 6).setFontColor('white');
    
    // 自動調整欄寬
    sheet.autoResizeColumns(1, 6);
    
    Logger.log('排行榜工作表設定完成');
    return sheet;
  } catch (error) {
    Logger.log('createLeaderboardSheet 錯誤: ' + error.toString());
    throw error;
  }
}

// 初始化聊天室和排行榜系統
function initializeChatAndLeaderboard() {
  try {
    Logger.log('開始初始化聊天室和排行榜系統...');
    
    // 建立工作表
    const chatSheet = createChatSheet();
    const leaderboardSheet = createLeaderboardSheet();
    
    // 發送歡迎訊息
    sendWelcomeChatMessage();
    
    Logger.log('聊天室和排行榜系統初始化完成');
    return {success: true, message: '系統初始化完成'};
  } catch (error) {
    Logger.log('initializeChatAndLeaderboard 錯誤: ' + error.toString());
    return {success: false, error: error.toString()};
  }
}

// 發送歡迎聊天訊息
function sendWelcomeChatMessage() {
  try {
    const welcomeMessage = {
      user: '系統',
      message: '歡迎來到聊天室！請遵守聊天禮儀，保持友善的交流環境。',
      time: new Date().toLocaleString('zh-TW')
    };
    
    const result = sendChatMessage(welcomeMessage);
    Logger.log('歡迎聊天訊息發送結果: ' + JSON.stringify(result));
    return result;
  } catch (error) {
    Logger.log('sendWelcomeChatMessage 錯誤: ' + error.toString());
    return {success: false, error: error.toString()};
  }
}

// 清除測試資料
function clearTestData() {
  const chatSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('聊天室');
  const leaderboardSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('排行榜');
  
  if (chatSheet) {
    chatSheet.clear();
    createChatSheet();
  }
  
  if (leaderboardSheet) {
    leaderboardSheet.clear();
    createLeaderboardSheet();
  }
}

// 取得統計資訊
function getSystemStats() {
  const chatSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('聊天室');
  const leaderboardSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('排行榜');
  
  let chatStats = {total: 0, users: []};
  let leaderboardStats = {total: 0, users: []};
  
  if (chatSheet) {
    const chatData = chatSheet.getDataRange().getValues();
    if (chatData.length > 1) {
      const headers = chatData[0];
      const userCol = headers.indexOf('用戶');
      
      const users = new Set();
      for (let i = 1; i < chatData.length; i++) {
        const row = chatData[i];
        if (row[userCol]) {
          users.add(row[userCol]);
        }
      }
      
      chatStats = {
        total: chatData.length - 1,
        users: Array.from(users)
      };
    }
  }
  
  if (leaderboardSheet) {
    const leaderboardData = leaderboardSheet.getDataRange().getValues();
    if (leaderboardData.length > 1) {
      const headers = leaderboardData[0];
      const userCol = headers.indexOf('用戶');
      
      const users = new Set();
      for (let i = 1; i < leaderboardData.length; i++) {
        const row = leaderboardData[i];
        if (row[userCol]) {
          users.add(row[userCol]);
        }
      }
      
      leaderboardStats = {
        total: leaderboardData.length - 1,
        users: Array.from(users)
      };
    }
  }
  
  return {
    chat: chatStats,
    leaderboard: leaderboardStats
  };
}

// 取得星星排行榜
function getStarsLeaderboard() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('排行榜');
    if (!sheet) {
      createLeaderboardSheet();
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const userCol = headers.indexOf('用戶');
    const starsCol = headers.indexOf('星星');
    const levelCol = headers.indexOf('等級');
    const messagesCol = headers.indexOf('訊息數');
    
    if (userCol === -1) {
      Logger.log('找不到用戶欄位');
      return [];
    }
    
    const leaderboard = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const user = row[userCol];
      const stars = parseInt(row[starsCol]) || 0;
      const level = parseInt(row[levelCol]) || 1;
      const messages = parseInt(row[messagesCol]) || 0;
      
      if (user && stars > 0) {
        leaderboard.push({
          user: user,
          stars: stars,
          level: level,
          messages: messages
        });
      }
    }
    
    // 按星星數量排序（降序）
    leaderboard.sort((a, b) => b.stars - a.stars);
    
    return leaderboard;
  } catch (error) {
    Logger.log('取得星星排行榜失敗: ' + error.toString());
    return [];
  }
}

// 取得星星統計資料
function getStarsStats() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('排行榜');
    if (!sheet) {
      createLeaderboardSheet();
      return {
        totalPlayers: 0,
        totalStars: 0,
        topStars: 0
      };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        totalPlayers: 0,
        totalStars: 0,
        topStars: 0
      };
    }
    
    const headers = data[0];
    const userCol = headers.indexOf('用戶');
    const starsCol = headers.indexOf('星星');
    
    if (userCol === -1 || starsCol === -1) {
      Logger.log('找不到必要的欄位');
      return {
        totalPlayers: 0,
        totalStars: 0,
        topStars: 0
      };
    }
    
    let totalPlayers = 0;
    let totalStars = 0;
    let topStars = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const user = row[userCol];
      const stars = parseInt(row[starsCol]) || 0;
      
      if (user && stars > 0) {
        totalPlayers++;
        totalStars += stars;
        if (stars > topStars) {
          topStars = stars;
        }
      }
    }
    
    return {
      totalPlayers: totalPlayers,
      totalStars: totalStars,
      topStars: topStars
    };
  } catch (error) {
    Logger.log('取得星星統計失敗: ' + error.toString());
    return {
      totalPlayers: 0,
      totalStars: 0,
      topStars: 0
    };
  }
}

// 更新星星數量
function updateStars(starsData) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('排行榜');
    if (!sheet) {
      sheet = createLeaderboardSheet();
    }
    
    const data = sheet.getDataRange().getValues();
    let headers = data[0];
    
    // 如果沒有標題行或標題行不完整，重新建立標題行
    if (headers.length === 0 || headers[0] === '' || headers.length < 7) {
      sheet.clear();
      sheet.getRange(1, 1, 1, 7).setValues([['playerId', '用戶', '分數', '等級', '星星', '訊息數', '更新時間']]);
      headers = ['playerId', '用戶', '分數', '等級', '星星', '訊息數', '更新時間'];
      
      // 設定標題行樣式
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
      sheet.getRange(1, 1, 1, 7).setBackground('#4285f4');
      sheet.getRange(1, 1, 1, 7).setFontColor('white');
      sheet.autoResizeColumns(1, 7);
    }
    
    const playerIdCol = headers.indexOf('playerId');
    const userCol = headers.indexOf('用戶');
    const starsCol = headers.indexOf('星星');
    const timeCol = headers.indexOf('更新時間');
    
    // 使用 playerId 當主要識別，如果沒有則回退到用戶名稱
    const identifier = starsData.playerId || starsData.user;
    const identifierCol = starsData.playerId ? playerIdCol : userCol;
    
    // 檢查是否已存在該玩家
    let userRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][identifierCol]) === String(identifier)) {
        userRow = i;
        break;
      }
    }
    
    if (userRow > 0) {
      // 更新現有玩家的星星
      sheet.getRange(userRow + 1, starsCol + 1).setValue(starsData.stars);
      sheet.getRange(userRow + 1, timeCol + 1).setValue(starsData.time);
      
      // 如果有 playerId，也更新 playerId 欄位
      if (starsData.playerId && playerIdCol !== -1) {
        sheet.getRange(userRow + 1, playerIdCol + 1).setValue(starsData.playerId);
      }
      
      Logger.log(`更新玩家星星: ${identifier} - ${starsData.stars}`);
      return {success: true, message: '星星已更新', stars: starsData.stars};
    } else {
      // 新增玩家
      const newRow = [
        starsData.playerId || '', // playerId
        starsData.user, // 用戶名稱
        0, // 分數初始值
        1, // 等級初始值
        starsData.stars,
        0, // 訊息數初始值
        starsData.time
      ];
      
      sheet.appendRow(newRow);
      
      Logger.log(`新增用戶星星: ${starsData.user} - ${starsData.stars}`);
      return {success: true, message: '星星已記錄', stars: starsData.stars};
    }
  } catch (error) {
    Logger.log('updateStars 錯誤: ' + error.toString());
    return {success: false, error: error.toString()};
  }
}

// ==================== Quiz 排行榜系統 ====================

// 新增 Quiz 成績
function addQuizScore(data) {
  Logger.log('addQuizScore called with data: ' + JSON.stringify(data));

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Quiz排行榜');

    if (!sheet) {
      sheet = ss.insertSheet('Quiz排行榜');
      sheet.appendRow([
        '時間',
        '玩家名稱',
        '關卡',
        '分數',
        '答對數',
        '總時間',
        '平均時間',
        '日期'
      ]);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
      sheet.getRange(1, 1, 1, 8).setBackground('#4285f4');
      sheet.getRange(1, 1, 1, 8).setFontColor('white');
      sheet.autoResizeColumns(1, 8);
      Logger.log('已建立 Quiz排行榜 工作表');
    }

    const playerName = String(data.playerName || '匿名玩家').trim();
    const category = String(data.category || 'unknown').trim().toLowerCase();
    const score = Number(data.score || 0);
    const correctCount = Number(data.correctCount || 0);
    const totalTime = Number(data.totalTime || 0);
    const averageTime = correctCount > 0 ? Math.round(totalTime / correctCount) : 0;
    const rowValues = [
      new Date(),
      playerName,
      category,
      score,
      correctCount,
      totalTime,
      averageTime,
      data.date || ''
    ];

    const rows = sheet.getDataRange().getValues();
    let existingRow = -1;
    for (let i = 1; i < rows.length; i++) {
      const existingName = String(rows[i][1] || '').trim().toLowerCase();
      const existingCategory = String(rows[i][2] || '').trim().toLowerCase();
      if (existingName === playerName.toLowerCase() && existingCategory === category) {
        existingRow = i + 1;
        break;
      }
    }

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues]);
      Logger.log('Quiz score update success: ' + playerName + ' - ' + category + ' - ' + score + '分');
    } else {
      sheet.appendRow(rowValues);
      Logger.log('Quiz score appendRow success: ' + playerName + ' - ' + category + ' - ' + score + '分');
    }

    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'Quiz score uploaded successfully'
    };

  } catch (error) {
    Logger.log('addQuizScore error: ' + error.toString());
    return {
      success: false,
      error: error.message
    };
  }
}

// 取得 Quiz 排行榜
function getQuizLeaderboard(category) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Quiz排行榜');
    if (!sheet) {
      Logger.log('找不到 Quiz排行榜 工作表');
      return {success: true, leaderboard: []};
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {success: true, leaderboard: []};
    }

    const headers = data[0];
    const timeCol = headers.indexOf('時間');
    const playerNameCol = headers.indexOf('玩家名稱');
    const categoryCol = headers.indexOf('關卡');
    const scoreCol = headers.indexOf('分數');
    const correctCountCol = headers.indexOf('答對數');
    const totalTimeCol = headers.indexOf('總時間');
    const averageTimeCol = headers.indexOf('平均時間');
    const dateCol = headers.indexOf('日期');

    if (playerNameCol === -1 || scoreCol === -1) {
      Logger.log('Quiz排行榜 欄位格式錯誤');
      return {success: false, error: '欄位格式錯誤'};
    }

    const bestByPlayerAndCategory = {};

    function normalizeQuizKey(playerName, rowCategory) {
      return String(rowCategory || '').trim().toLowerCase() + '__' + String(playerName || '').trim().toLowerCase();
    }

    function isBetterQuizRecord(next, current) {
      if (!current) return true;
      if (next.score !== current.score) return next.score > current.score;
      if (next.correctCount !== current.correctCount) return next.correctCount > current.correctCount;

      const nextTime = next.totalTime || Number.MAX_SAFE_INTEGER;
      const currentTime = current.totalTime || Number.MAX_SAFE_INTEGER;
      if (nextTime !== currentTime) return nextTime < currentTime;

      return String(next.date || '') > String(current.date || '');
    }

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowCategory = categoryCol !== -1 ? String(row[categoryCol] || '').trim().toLowerCase() : '';

      // 如果指定了 category 且不是 'all'，則過濾
      const requestedCategory = String(category || '').trim().toLowerCase();
      if (requestedCategory && requestedCategory !== 'all' && rowCategory !== requestedCategory) {
        continue;
      }

      const score = Number(row[scoreCol]) || 0;
      const correctCount = Number(row[correctCountCol]) || 0;
      const totalTime = Number(row[totalTimeCol]) || 0;
      const averageTime = Number(row[averageTimeCol]) || 0;
      const playerName = String(row[playerNameCol] || '未知玩家').trim();

      const record = {
        playerName: playerName,
        category: rowCategory,
        score: score,
        correctCount: correctCount,
        totalTime: totalTime,
        averageTime: averageTime,
        date: dateCol !== -1 ? row[dateCol] : ''
      };

      const key = normalizeQuizKey(playerName, rowCategory);
      if (isBetterQuizRecord(record, bestByPlayerAndCategory[key])) {
        bestByPlayerAndCategory[key] = record;
      }
    }

    const leaderboard = Object.keys(bestByPlayerAndCategory).map(key => bestByPlayerAndCategory[key]);

    // 按分數排序（高到低），分數相同則按總時間排序（短到長）
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.totalTime - b.totalTime;
    });

    // 返回所有玩家
    const result = leaderboard;
    result.forEach((item, index) => {
      item.rank = index + 1;
    });

    Logger.log(`取得 Quiz 排行榜: category=${category}, 筆數=${result.length}`);
    return {
      success: true,
      leaderboard: result
    };

  } catch (error) {
    Logger.log('getQuizLeaderboard 錯誤: ' + error.toString());
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== 希臘神祇排行榜系統 ====================

// 新增希臘神祇成績
function addGreekScore(params) {
  Logger.log('addGreekScore called with params: ' + JSON.stringify(params));

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('希臘神祇排行榜');

    if (!sheet) {
      sheet = ss.insertSheet('希臘神祇排行榜');
      sheet.getRange(1, 1, 1, 9).setValues([[
        '時間戳記',
        '玩家名稱',
        '分數',
        '答對題數',
        '答錯題數',
        '神祇類別',
        '總時間',
        '平均時間',
        '結算清單'
      ]]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
      sheet.getRange(1, 1, 1, 9).setBackground('#4285f4');
      sheet.getRange(1, 1, 1, 9).setFontColor('white');
      sheet.autoResizeColumns(1, 9);
      Logger.log('已建立 希臘神祇排行榜 工作表');
    }

    const timestamp = new Date();
    const playerName = String(params.playerName || '匿名玩家');
    const score = Number(params.score || 0);
    const correctCount = Number(params.correctCount || 0);
    const wrongCount = Number(params.wrongCount || 0);
    const category = String(params.category || '未知神祇');
    const totalTime = Number(params.totalTime || 0);
    const averageTime = Number(params.averageTime || 0);
    const details = String(params.details || '');

    sheet.appendRow([
      timestamp,
      playerName,
      score,
      correctCount,
      wrongCount,
      category,
      totalTime,
      averageTime,
      details
    ]);

    SpreadsheetApp.flush();

    Logger.log('[Greek Score] appendRow success: ' + playerName + ' - ' + category + ' - ' + score);
    return jsonResponse({
      success: true,
      message: '希臘神祇分數已寫入'
    });

  } catch (error) {
    Logger.log('[Greek Score] addGreekScore failed: ' + error.toString());
    return jsonResponse({
      success: false,
      error: String(error.stack || error.message || error)
    });
  }
}

// 取得希臘神祇排行榜
function getGreekLeaderboard(category) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('希臘神祇排行榜');
    if (!sheet) {
      Logger.log('找不到 希臘神祇排行榜 工作表');
      return {success: true, leaderboard: []};
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {success: true, leaderboard: []};
    }

    const headers = data[0];
    const timestampCol = headers.indexOf('時間戳記');
    const playerNameCol = headers.indexOf('玩家名稱');
    const scoreCol = headers.indexOf('分數');
    const correctCountCol = headers.indexOf('答對題數');
    const wrongCountCol = headers.indexOf('答錯題數');
    const categoryCol = headers.indexOf('神祇類別');
    const totalTimeCol = headers.indexOf('總時間');
    const averageTimeCol = headers.indexOf('平均時間');
    const detailsCol = headers.indexOf('結算清單');

    if (playerNameCol === -1 || scoreCol === -1) {
      Logger.log('希臘神祇排行榜 欄位格式錯誤');
      return {success: false, error: '欄位格式錯誤'};
    }

    const leaderboard = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowCategory = categoryCol !== -1 ? String(row[categoryCol] || '') : '';

      // 如果指定了 category 且不是 'all'，則過濾
      if (category && category !== 'all' && rowCategory !== category) {
        continue;
      }

      const score = Number(row[scoreCol]) || 0;
      const correctCount = Number(row[correctCountCol]) || 0;
      const wrongCount = Number(row[wrongCountCol]) || 0;
      const totalTime = Number(row[totalTimeCol]) || 0;
      const averageTime = Number(row[averageTimeCol]) || 0;

      leaderboard.push({
        playerName: row[playerNameCol] || '未知玩家',
        category: rowCategory,
        score: score,
        correctCount: correctCount,
        wrongCount: wrongCount,
        totalTime: totalTime,
        averageTime: averageTime,
        details: detailsCol !== -1 ? row[detailsCol] : ''
      });
    }

    // 按分數排序（高到低），分數相同則按總時間排序（短到長）
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.totalTime - b.totalTime;
    });

    // 返回所有玩家
    const result = leaderboard;
    result.forEach((item, index) => {
      item.rank = index + 1;
    });

    Logger.log(`取得 希臘神祇排行榜: category=${category}, 筆數=${result.length}`);
    return {
      success: true,
      leaderboard: result
    };

  } catch (error) {
    Logger.log('getGreekLeaderboard 錯誤: ' + error.toString());
    return {
      success: false,
      error: error.message
    };
  }
} 
