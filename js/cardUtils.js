/**
 * 將卡片新增到「最近獲得」列表，以便在收藏頁顯示 NEW 標記。
 * @param {string} cardWord - 卡片的英文單字
 */
function addNewCard(cardWord) {
  try {
    let recentCards = JSON.parse(localStorage.getItem('recentlyObtainedCards') || '[]');
    let cardTimestamps = JSON.parse(localStorage.getItem('newCardTimestamps') || '{}');
    
    if (!recentCards.includes(cardWord)) {
      recentCards.push(cardWord);
      cardTimestamps[cardWord] = Date.now();
      
      // 只保留最近20張新卡片記錄
      if (recentCards.length > 20) {
        const oldestCard = recentCards.shift();
        delete cardTimestamps[oldestCard];
      }
      
      localStorage.setItem('recentlyObtainedCards', JSON.stringify(recentCards));
      localStorage.setItem('newCardTimestamps', JSON.stringify(cardTimestamps));
    }
  } catch (error) {
    console.error("新增新卡片標記時發生錯誤:", error);
  }
}

/**
 * 自動清除過期的新卡片標記（例如超過10分鐘）。
 */
function autoClearNewCards() {
  try {
    const cardTimestamps = JSON.parse(localStorage.getItem('newCardTimestamps') || '{}');
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    
    const expiredCards = Object.keys(cardTimestamps).filter(cardWord => (now - cardTimestamps[cardWord]) > tenMinutes);
    
    if (expiredCards.length > 0) {
      let recentCards = JSON.parse(localStorage.getItem('recentlyObtainedCards') || '[]');
      recentCards = recentCards.filter(card => !expiredCards.includes(card));
      
      expiredCards.forEach(cardWord => delete cardTimestamps[cardWord]);
      
      localStorage.setItem('recentlyObtainedCards', JSON.stringify(recentCards));
      localStorage.setItem('newCardTimestamps', JSON.stringify(cardTimestamps));
      
      console.log(`⏰ 已自動移除 ${expiredCards.length} 張過期的新卡片標記。`);
      
      // 如果卡片頁面是開啟的，可以觸發重新渲染
      if (typeof window.renderCards === 'function') {
        window.renderCards();
      }
    }
  } catch (error) {
    console.error("自動清除新卡片標記時發生錯誤:", error);
  }
}

// ===============================
// 卡牌效果處理系統
// ===============================

/**
 * 卡牌效果類型定義
 */
const CARD_EFFECTS = {
  TIME_EXTEND: 'time_extend',      // 延長時間
  TIME_FREEZE: 'time_freeze',      // 暫停時間
  HINT: 'hint',                    // 提示/排除選項
  SHIELD: 'shield',                // 護盾保護
  ENERGY_RESTORE: 'energy_restore', // 恢復能量
  COMBO_PROTECT: 'combo_protect',   // 連擊保護
  SCORE_MULTIPLY: 'score_multiply', // 分數加倍
  SKIP_LEVEL: 'skip_level'         // 跳過關卡
};

/**
 * 使用卡牌效果
 * @param {Object} card - 卡牌物件
 * @param {Object} gameState - 遊戲狀態物件
 * @returns {Object} 效果結果
 */
function useCardEffect(card, gameState) {
  if (!card.effect) {
    return { success: false, message: '此卡牌沒有效果' };
  }

  const effect = card.effect;
  let result = { success: true, message: '', effects: [] };

  switch (effect.type) {
    case CARD_EFFECTS.TIME_EXTEND:
      result = handleTimeExtend(effect.value, gameState);
      break;
    case CARD_EFFECTS.TIME_FREEZE:
      result = handleTimeFreeze(effect.value, gameState);
      break;
    case CARD_EFFECTS.HINT:
      result = handleHint(effect.value, gameState);
      break;
    case CARD_EFFECTS.SHIELD:
      result = handleShield(effect.value, gameState);
      break;
    case CARD_EFFECTS.ENERGY_RESTORE:
      result = handleEnergyRestore(effect.value, gameState);
      break;
    case CARD_EFFECTS.COMBO_PROTECT:
      result = handleComboProtect(effect.value, gameState);
      break;
    case CARD_EFFECTS.SCORE_MULTIPLY:
      result = handleScoreMultiply(effect.value, gameState);
      break;
    case CARD_EFFECTS.SKIP_LEVEL:
      result = handleSkipLevel(effect.value, gameState);
      break;
    default:
      result = { success: false, message: '未知的卡牌效果類型' };
  }

  return {
    ...result,
    cardName: card.zh,
    effectDescription: effect.description
  };
}

/**
 * 處理時間延長效果
 */
function handleTimeExtend(seconds, gameState) {
  if (gameState.timeRemaining !== undefined) {
    gameState.timeRemaining += seconds;
    return {
      success: true,
      message: `時間延長了 ${seconds} 秒！`,
      effects: [{ type: 'time', value: seconds }]
    };
  }
  return { success: false, message: '無法延長時間' };
}

/**
 * 處理時間暫停效果
 */
function handleTimeFreeze(seconds, gameState) {
  if (gameState.timer) {
    // 暫停計時器
    clearInterval(gameState.timer);
    gameState.timer = null;
    
    // 設定恢復計時器的延遲
    setTimeout(() => {
      if (gameState.startTimer) {
        gameState.startTimer();
      }
    }, seconds * 1000);
    
    return {
      success: true,
      message: `時間暫停了 ${seconds} 秒！`,
      effects: [{ type: 'time_freeze', value: seconds }]
    };
  }
  return { success: false, message: '無法暫停時間' };
}

/**
 * 處理提示效果
 */
function handleHint(count, gameState) {
  if (gameState.currentQuestion && gameState.currentQuestion.options) {
    const options = gameState.currentQuestion.options;
    const correctAnswer = gameState.currentQuestion.correct;
    const wrongOptions = options.filter((_, index) => index !== correctAnswer);
    // 隨機排除錯誤選項
    const shuffled = wrongOptions.sort(() => 0.5 - Math.random());
    const toExclude = shuffled.slice(0, Math.min(count, wrongOptions.length));
    return {
      success: true,
      message: `排除了 ${toExclude.length} 個錯誤選項！`,
      effects: [{ type: 'hint', excludedOptions: toExclude }]
    };
  }
  // 無論何時都回傳成功，但不排除選項
  return {
    success: true,
    message: '目前無題目可排除選項，但已成功使用提示卡片！',
    effects: []
  };
}

/**
 * 處理護盾效果
 */
function handleShield(count, gameState) {
  if (gameState.shields === undefined) {
    gameState.shields = 0;
  }
  gameState.shields += count;
  
  return {
    success: true,
    message: `獲得 ${count} 層護盾保護！`,
    effects: [{ type: 'shield', value: count }]
  };
}

/**
 * 處理能量恢復效果
 */
function handleEnergyRestore(amount, gameState) {
  if (gameState.energy !== undefined) {
    const maxEnergy = gameState.maxEnergy || 5;
    const oldEnergy = gameState.energy;
    gameState.energy = Math.min(gameState.energy + amount, maxEnergy);
    const restored = gameState.energy - oldEnergy;
    
    return {
      success: true,
      message: `恢復了 ${restored} 點能量！`,
      effects: [{ type: 'energy', value: restored }]
    };
  }
  return { success: false, message: '無法恢復能量' };
}

/**
 * 處理連擊保護效果
 */
function handleComboProtect(count, gameState) {
  if (gameState.comboProtection === undefined) {
    gameState.comboProtection = 0;
  }
  gameState.comboProtection += count;
  
  return {
    success: true,
    message: `獲得 ${count} 次連擊保護！`,
    effects: [{ type: 'combo_protect', value: count }]
  };
}

/**
 * 處理分數加倍效果
 */
function handleScoreMultiply(multiplier, gameState) {
  if (gameState.scoreMultiplier === undefined) {
    gameState.scoreMultiplier = 1;
  }
  gameState.scoreMultiplier *= multiplier;
  
  return {
    success: true,
    message: `分數倍率提升至 ${gameState.scoreMultiplier.toFixed(1)}x！`,
    effects: [{ type: 'score_multiply', value: multiplier }]
  };
}

/**
 * 處理跳過關卡效果
 */
function handleSkipLevel(count, gameState) {
  if (gameState.currentFloor !== undefined) {
    const oldFloor = gameState.currentFloor;
    gameState.currentFloor += count;
    
    return {
      success: true,
      message: `跳過了 ${count} 個樓層！`,
      effects: [{ type: 'skip_level', value: count, from: oldFloor, to: gameState.currentFloor }]
    };
  }
  return { success: false, message: '無法跳過關卡' };
}

/**
 * 檢查卡牌是否可以在當前遊戲狀態下使用
 * @param {Object} card - 卡牌物件
 * @param {Object} gameState - 遊戲狀態
 * @returns {boolean}
 */
function canUseCard(card, gameState) {
  if (!card.effect) return false;
  
  switch (card.effect.type) {
    case CARD_EFFECTS.TIME_EXTEND:
    case CARD_EFFECTS.TIME_FREEZE:
      return gameState.timeRemaining !== undefined;
    case CARD_EFFECTS.HINT:
      return gameState.currentQuestion !== undefined;
    case CARD_EFFECTS.ENERGY_RESTORE:
      return gameState.energy !== undefined && gameState.energy < (gameState.maxEnergy || 5);
    case CARD_EFFECTS.SKIP_LEVEL:
      return gameState.currentFloor !== undefined;
    default:
      return true; // 其他效果通常都可以使用
  }
}

/**
 * 獲取卡牌效果描述
 * @param {Object} card - 卡牌物件
 * @returns {string}
 */
function getCardEffectDescription(card) {
  if (!card.effect) return '此卡牌沒有特殊效果';
  return card.effect.description || '效果未知';
}

/**
 * 獲取卡牌稀有度對應的顏色
 * @param {string} rarity - 稀有度
 * @returns {string}
 */
function getRarityColor(rarity) {
  switch (rarity) {
    case '普通': return '#00ffff';
    case '稀有': return '#a259ff';
    case '超稀有': return '#ffd700';
    default: return '#ffffff';
  }
}

// cardUtils.js - 卡片系統工具函式庫

const CardSystem = {
    // 卡片效果類型定義
    effectTypes: {
        TIME_EXTEND: 'time_extend',    // 延長時間
        TIME_FREEZE: 'time_freeze',    // 時間暫停
        HINT: 'hint',                  // 提示
        SHIELD: 'shield',              // 護盾
        ENERGY_RESTORE: 'energy_restore', // 恢復能量
        COMBO_PROTECT: 'combo_protect',   // 連擊保護
        SCORE_MULTIPLY: 'score_multiply', // 分數加倍
        SKIP_LEVEL: 'skip_level'         // 跳過關卡
    },

    // 卡片稀有度定義
    rarityTypes: {
        COMMON: '普通',
        RARE: '稀有',
        EPIC: '超稀有'
    },

    // 檢查卡片是否已解鎖
    isCardUnlocked(cardId) {
        const ownedCards = JSON.parse(localStorage.getItem('ownedCards') || '{}');
        return ownedCards[cardId] === true;
    },

    // 解鎖卡片
    unlockCard(cardId) {
        const ownedCards = JSON.parse(localStorage.getItem('ownedCards') || '{}');
        ownedCards[cardId] = true;
        localStorage.setItem('ownedCards', JSON.stringify(ownedCards));
        console.log(`🎉 解鎖卡片: ${cardId}`);
        this.addNewCardMarker(cardId);
    },

    // 添加新卡片標記
    addNewCardMarker(cardId) {
        let recentCards = JSON.parse(localStorage.getItem('recentlyObtainedCards') || '[]');
        if (!recentCards.includes(cardId)) {
            recentCards.push(cardId);
            if (recentCards.length > 20) {
                recentCards = recentCards.slice(-20);
            }
            localStorage.setItem('recentlyObtainedCards', JSON.stringify(recentCards));
            localStorage.setItem(`newCard_${cardId}_timestamp`, Date.now().toString());
            console.log(`🆕 添加新卡片標記: ${cardId}`);
        }
    },

    // 移除新卡片標記
    removeNewCardMarker(cardId) {
        let recentCards = JSON.parse(localStorage.getItem('recentlyObtainedCards') || '[]');
        recentCards = recentCards.filter(id => id !== cardId);
        localStorage.setItem('recentlyObtainedCards', JSON.stringify(recentCards));
        localStorage.removeItem(`newCard_${cardId}_timestamp`);
        console.log(`🗑️ 移除新卡片標記: ${cardId}`);
    },

    // 檢查是否為新卡片
    isNewCard(cardId) {
        const timestamp = localStorage.getItem(`newCard_${cardId}_timestamp`);
        if (!timestamp) return false;
        
        const now = Date.now();
        const cardTime = parseInt(timestamp);
        const timeLimit = 10 * 60 * 1000; // 10分鐘
        
        return (now - cardTime) <= timeLimit;
    },

    // 取得效果類型的中文名稱
    getEffectTypeName(effectType) {
        const typeNames = {
            [this.effectTypes.TIME_EXTEND]: '時間延長',
            [this.effectTypes.TIME_FREEZE]: '時間暫停',
            [this.effectTypes.HINT]: '提示輔助',
            [this.effectTypes.SHIELD]: '護盾保護',
            [this.effectTypes.ENERGY_RESTORE]: '能量恢復',
            [this.effectTypes.COMBO_PROTECT]: '連擊保護',
            [this.effectTypes.SCORE_MULTIPLY]: '分數加倍',
            [this.effectTypes.SKIP_LEVEL]: '跳過關卡'
        };
        return typeNames[effectType] || '未知效果';
    },

    // 取得卡片效果描述
    getEffectDescription(effectType, value) {
        const descriptions = {
            [this.effectTypes.TIME_EXTEND]: `延長答題時間 ${value} 秒`,
            [this.effectTypes.TIME_FREEZE]: `暫停時間 ${value} 秒`,
            [this.effectTypes.HINT]: '提供一次答案提示',
            [this.effectTypes.SHIELD]: `提供 ${value} 次答錯保護`,
            [this.effectTypes.ENERGY_RESTORE]: `恢復 ${value} 點能量`,
            [this.effectTypes.COMBO_PROTECT]: '保護連擊不中斷一次',
            [this.effectTypes.SCORE_MULTIPLY]: `分數加成 ${value}x`,
            [this.effectTypes.SKIP_LEVEL]: '可跳過當前關卡'
        };
        return descriptions[effectType] || '無效果說明';
    }
};

// 導出 CardSystem
window.CardSystem = CardSystem; 