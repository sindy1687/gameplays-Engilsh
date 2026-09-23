/**
 * UNO 卡牌遊戲 - 完整遊戲邏輯
 * 包含牌組管理、遊戲規則、電腦 AI、星星系統整合
 */

// ================================
// 遊戲狀態管理
// ================================

const gameState = {
  deck: [],
  discardPile: [],
  players: [],
  currentPlayerIndex: 0,
  direction: 1, // 1 = 順時針, -1 = 逆時針
  currentColor: null,
  pendingDrawCount: 0,
  pendingDrawType: null,
  winner: null,
  isGameStarted: false,
  isGameOver: false,
  isTurnProcessing: false,
  isAnimating: false,
  selectedDifficulty: null,
  turnCount: 0,
  gameStartTime: null,
  gameTimer: null,
  isStartingGame: false
};

// 遊戲設定
const gameSettings = {
  allowStackDraw2: false,
  allowStackDraw4: false,
  drawUntilPlayable: false,
  enableSound: true,
  volume: 50,
  animationSpeed: 'normal'
};

// 遊戲統計
const gameStatistics = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  fastestWinSeconds: null,
  cardsPlayed: 0,
  cardsDrawn: 0,
  unoCalls: 0,
  unoPenalties: 0
};

// 難度設定
const difficultySettings = {
  easy: { cost: 500, reward: 300 },
  normal: { cost: 700, reward: 600 },
  hard: { cost: 1000, reward: 1000 }
};

// 卡牌顏色
const COLORS = ['red', 'yellow', 'green', 'blue'];

// 卡牌類型
const CARD_TYPES = {
  NUMBER: 'number',
  SKIP: 'skip',
  REVERSE: 'reverse',
  DRAW_TWO: 'draw_two',
  WILD: 'wild',
  WILD_DRAW_FOUR: 'wild_draw_four'
};

// ================================
// 牌組管理函式
// ================================

/**
 * 建立完整 UNO 牌組 (108 張牌)
 */
function createDeck() {
  const deck = [];
  let cardId = 0;

  // 數字牌和功能牌 (每種顏色)
  COLORS.forEach(color => {
    // 數字 0 (每種顏色 1 張)
    deck.push({
      id: `${color}-0-${cardId++}`,
      color: color,
      type: CARD_TYPES.NUMBER,
      value: 0
    });

    // 數字 1-9 (每種顏色各 2 張)
    for (let num = 1; num <= 9; num++) {
      deck.push({
        id: `${color}-${num}-${cardId++}`,
        color: color,
        type: CARD_TYPES.NUMBER,
        value: num
      });
      deck.push({
        id: `${color}-${num}-${cardId++}`,
        color: color,
        type: CARD_TYPES.NUMBER,
        value: num
      });
    }

    // 功能牌 (每種顏色各 2 張)
    ['skip', 'reverse', 'draw_two'].forEach(type => {
      deck.push({
        id: `${color}-${type}-${cardId++}`,
        color: color,
        type: type === 'draw_two' ? CARD_TYPES.DRAW_TWO : 
              type === 'skip' ? CARD_TYPES.SKIP : CARD_TYPES.REVERSE,
        value: type
      });
      deck.push({
        id: `${color}-${type}-${cardId++}`,
        color: color,
        type: type === 'draw_two' ? CARD_TYPES.DRAW_TWO : 
              type === 'skip' ? CARD_TYPES.SKIP : CARD_TYPES.REVERSE,
        value: type
      });
    });
  });

  // 萬用牌 (4 張)
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `wild-${cardId++}`,
      color: 'wild',
      type: CARD_TYPES.WILD,
      value: 'wild'
    });
  }

  // 萬用加四牌 (4 張)
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `wild_draw_four-${cardId++}`,
      color: 'wild',
      type: CARD_TYPES.WILD_DRAW_FOUR,
      value: 'wild_draw_four'
    });
  }

  return deck;
}

/**
 * Fisher-Yates 洗牌演算法
 */
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 發牌給所有玩家
 */
function dealCards() {
  gameState.players.forEach(player => {
    player.hand = [];
    for (let i = 0; i < 7; i++) {
      if (gameState.deck.length > 0) {
        player.hand.push(gameState.deck.pop());
      }
    }
  });
}

/**
 * 重建抽牌堆
 */
function rebuildDrawPile() {
  if (gameState.discardPile.length <= 1) {
    console.warn('棄牌堆沒有足夠的牌可以重建');
    return;
  }

  // 保留棄牌堆最上面的一張牌
  const topCard = gameState.discardPile.pop();
  
  // 將其他棄牌重新洗牌
  const remainingCards = shuffleDeck(gameState.discardPile);
  
  // 放回抽牌堆
  gameState.deck = remainingCards;
  gameState.discardPile = [topCard];
  
  console.log('抽牌堆已重建');
}

// ================================
// 玩家管理函式
// ================================

/**
 * 建立玩家
 */
function createPlayer(id, name, type, difficulty = 'normal') {
  return {
    id: id,
    name: name,
    type: type,
    difficulty: difficulty,
    hand: [],
    hasCalledUno: false,
    canCatchUno: false
  };
}

/**
 * 初始化所有玩家
 */
function initializePlayers() {
  gameState.players = [
    createPlayer('player', '你', 'human'),
    createPlayer('cpu-1', '電腦 1', 'computer', gameState.selectedDifficulty),
    createPlayer('cpu-2', '電腦 2', 'computer', gameState.selectedDifficulty),
    createPlayer('cpu-3', '電腦 3', 'computer', gameState.selectedDifficulty)
  ];
}

// ================================
// 遊戲規則函式
// ================================

/**
 * 檢查是否可以出牌
 */
function canPlayCard(card, currentColor, topCard) {
  // 萬用牌可以隨時出
  if (card.type === CARD_TYPES.WILD || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
    return true;
  }

  // 顏色相同
  if (card.color === currentColor) {
    return true;
  }

  // 數字或功能符號相同
  if (card.value === topCard.value) {
    return true;
  }

  return false;
}

/**
 * 檢查是否可以使用萬用加四牌
 */
function canUseWildDrawFour(playerHand, currentColor) {
  // 檢查玩家是否有符合目前顏色的牌
  const hasMatchingColor = playerHand.some(card => 
    card.color === currentColor && 
    card.type !== CARD_TYPES.WILD && 
    card.type !== CARD_TYPES.WILD_DRAW_FOUR
  );

  return !hasMatchingColor;
}

/**
 * 抽牌
 */
function drawCard(player, count = 1) {
  const drawnCards = [];
  
  for (let i = 0; i < count; i++) {
    if (gameState.deck.length === 0) {
      rebuildDrawPile();
    }
    
    if (gameState.deck.length > 0) {
      const card = gameState.deck.pop();
      player.hand.push(card);
      drawnCards.push(card);
      gameStatistics.cardsDrawn++;
    }
  }
  
  return drawnCards;
}

/**
 * 出牌
 */
function playCard(player, cardIndex) {
  const card = player.hand.splice(cardIndex, 1)[0];
  gameState.discardPile.push(card);
  gameStatistics.cardsPlayed++;
  
  // 更新目前顏色
  if (card.color !== 'wild') {
    gameState.currentColor = card.color;
  }
  
  return card;
}

/**
 * 套用卡牌效果
 */
function applyCardEffect(card) {
  switch (card.type) {
    case CARD_TYPES.SKIP:
      skipNextPlayer();
      showGameMessage('下一位玩家被跳過', 'info');
      break;
      
    case CARD_TYPES.REVERSE:
      reverseDirection();
      showGameMessage('方向反轉', 'info');
      break;
      
    case CARD_TYPES.DRAW_TWO:
      gameState.pendingDrawCount += 2;
      gameState.pendingDrawType = 'draw_two';
      skipNextPlayer();
      showGameMessage('下一位玩家抽 2 張牌', 'warning');
      break;
      
    case CARD_TYPES.WILD_DRAW_FOUR:
      gameState.pendingDrawCount += 4;
      gameState.pendingDrawType = 'wild_draw_four';
      skipNextPlayer();
      showGameMessage('下一位玩家抽 4 張牌', 'warning');
      break;
      
    case CARD_TYPES.WILD:
      // 萬用牌需要選擇顏色，在選擇後處理
      break;
  }
}

/**
 * 跳過下一位玩家
 */
function skipNextPlayer() {
  advanceTurn();
}

/**
 * 反轉方向
 */
function reverseDirection() {
  gameState.direction *= -1;
  updateDirectionDisplay();
}

/**
 * 前進到下一位玩家
 */
function advanceTurn() {
  const playerCount = gameState.players.length;
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.direction + playerCount) % playerCount;
  gameState.turnCount++;
}

/**
 * 處理待抽牌
 */
function handlePendingDraw() {
  if (gameState.pendingDrawCount > 0) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // 檢查是否可以疊加
    const canStack = canStackDraw(currentPlayer);
    
    if (!canStack) {
      // 不能疊加，執行抽牌
      drawCard(currentPlayer, gameState.pendingDrawCount);
      showGameMessage(`${currentPlayer.name} 抽了 ${gameState.pendingDrawCount} 張牌`, 'warning');
      
      // 重置待抽牌
      gameState.pendingDrawCount = 0;
      gameState.pendingDrawType = null;
    }
  }
}

/**
 * 檢查是否可以疊加抽牌
 */
function canStackDraw(player) {
  if (gameState.pendingDrawType === 'draw_two' && gameSettings.allowStackDraw2) {
    return player.hand.some(card => card.type === CARD_TYPES.DRAW_TWO);
  }
  
  if (gameState.pendingDrawType === 'wild_draw_four' && gameSettings.allowStackDraw4) {
    return player.hand.some(card => card.type === CARD_TYPES.WILD_DRAW_FOUR);
  }
  
  return false;
}

// ================================
// UNO 機制函式
// ================================

/**
 * 檢查 UNO 狀態
 */
function checkUnoStatus(player) {
  if (player.hand.length === 1 && !player.hasCalledUno) {
    // 玩家剩一張牌但沒有喊 UNO
    if (player.type === 'human') {
      // 給其他玩家抓 UNO 的機會
      gameState.players.forEach(p => {
        if (p.type === 'computer') {
          p.canCatchUno = true;
        }
      });
    }
  }
}

/**
 * 喊 UNO
 */
function callUno(player) {
  if (player.hand.length === 1) {
    player.hasCalledUno = true;
    gameStatistics.unoCalls++;
    showGameMessage(`${player.name} 喊了 UNO！`, 'success');
    return true;
  } else {
    showGameMessage('現在還不能喊 UNO', 'error');
    return false;
  }
}

/**
 * 抓 UNO
 */
function catchUno(catcher, target) {
  if (target.hand.length === 1 && !target.hasCalledUno && target.canCatchUno) {
    // 成功抓到
    drawCard(target, 2);
    gameStatistics.unoPenalties++;
    showGameMessage(`${target.name} 沒有喊 UNO，抽 2 張牌`, 'warning');
    target.hasCalledUno = true; // 防止重複處罰
    return true;
  }
  return false;
}

// ================================
// 電腦 AI 函式
// ================================

/**
 * 執行電腦回合
 */
function runComputerTurn() {
  if (gameState.isTurnProcessing || gameState.isGameOver) {
    return;
  }

  gameState.isTurnProcessing = true;
  const player = gameState.players[gameState.currentPlayerIndex];
  
  showGameMessage(`${player.name} 正在思考...`, 'info');
  
  // 根據難度決定思考時間
  const thinkTime = getThinkTime(player.difficulty);
  
  setTimeout(() => {
    // 處理待抽牌
    handlePendingDraw();
    
    // 選擇要出的牌
    const cardChoice = chooseComputerCard(player);
    
    if (cardChoice) {
      // 出牌
      const card = playCard(player, cardChoice.index);
      
      // 處理萬用牌選色
      if (card.type === CARD_TYPES.WILD || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
        const chosenColor = chooseBestWildColor(player);
        gameState.currentColor = chosenColor;
        showGameMessage(`${player.name} 選擇了 ${getColorName(chosenColor)}`, 'info');
      }
      
      // 套用卡牌效果
      applyCardEffect(card);
      
      // 檢查 UNO
      if (player.hand.length === 1) {
        if (shouldComputerCallUno(player)) {
          callUno(player);
        }
      }
      
      showGameMessage(`${player.name} 出了 ${getCardDisplayName(card)}`, 'info');
    } else {
      // 沒有牌可以出，抽牌
      const drawnCards = drawCard(player, 1);
      
      if (drawnCards.length > 0) {
        showGameMessage(`${player.name} 抽了一張牌`, 'info');
        
        // 檢查抽到的牌是否可以出
        if (gameSettings.drawUntilPlayable) {
          const playableIndex = player.hand.findIndex((card, index) => 
            index === player.hand.length - 1 && canPlayCard(card, gameState.currentColor, gameState.discardPile[gameState.discardPile.length - 1])
          );
          
          if (playableIndex !== -1) {
            const card = playCard(player, playableIndex);
            
            if (card.type === CARD_TYPES.WILD || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
              const chosenColor = chooseBestWildColor(player);
              gameState.currentColor = chosenColor;
            }
            
            applyCardEffect(card);
            showGameMessage(`${player.name} 出了 ${getCardDisplayName(card)}`, 'info');
          }
        }
      }
    }
    
    // 檢查勝利
    if (checkWinner()) {
      endGame();
      return;
    }
    
    // 前進到下一位玩家
    advanceTurn();
    gameState.isTurnProcessing = false;
    
    // 更新顯示
    renderGame();
    
    // 如果下一位是電腦，繼續執行
    if (gameState.players[gameState.currentPlayerIndex].type === 'computer') {
      setTimeout(runComputerTurn, 1000);
    }
    
  }, thinkTime);
}

/**
 * 根據難度取得思考時間
 */
function getThinkTime(difficulty) {
  switch (difficulty) {
    case 'easy':
      return 500 + Math.random() * 500;
    case 'normal':
      return 800 + Math.random() * 400;
    case 'hard':
      return 1000 + Math.random() * 200;
    default:
      return 800;
  }
}

/**
 * 電腦選擇要出的牌
 */
function chooseComputerCard(player) {
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const playableCards = player.hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => canPlayCard(card, gameState.currentColor, topCard));
  
  if (playableCards.length === 0) {
    return null;
  }
  
  // 根據難度選擇策略
  switch (player.difficulty) {
    case 'easy':
      return chooseRandomCard(playableCards);
    case 'normal':
      return chooseNormalCard(playableCards, player);
    case 'hard':
      return chooseBestCard(playableCards, player);
    default:
      return chooseRandomCard(playableCards);
  }
}

/**
 * 隨機選牌 (簡單模式)
 */
function chooseRandomCard(playableCards) {
  const randomIndex = Math.floor(Math.random() * playableCards.length);
  return playableCards[randomIndex];
}

/**
 * 普通模式選牌策略
 */
function chooseNormalCard(playableCards, player) {
  // 優先出數字牌
  const numberCards = playableCards.filter(({ card }) => card.type === CARD_TYPES.NUMBER);
  if (numberCards.length > 0 && Math.random() > 0.3) {
    return numberCards[Math.floor(Math.random() * numberCards.length)];
  }
  
  // 手牌多時適當使用功能牌
  if (player.hand.length > 5) {
    const actionCards = playableCards.filter(({ card }) => 
      card.type !== CARD_TYPES.NUMBER && card.type !== CARD_TYPES.WILD && card.type !== CARD_TYPES.WILD_DRAW_FOUR
    );
    if (actionCards.length > 0) {
      return actionCards[Math.floor(Math.random() * actionCards.length)];
    }
  }
  
  return chooseRandomCard(playableCards);
}

/**
 * 困難模式選牌策略
 */
function chooseBestCard(playableCards, player) {
  // 分析手牌顏色分佈
  const colorCounts = {};
  player.hand.forEach(card => {
    if (card.color !== 'wild') {
      colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
    }
  });
  
  // 找出最多的顏色
  const bestColor = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  // 優先出最多顏色的牌
  if (bestColor) {
    const bestColorCards = playableCards.filter(({ card }) => card.color === bestColor);
    if (bestColorCards.length > 0) {
      return bestColorCards[0];
    }
  }
  
  // 優先出數字牌
  const numberCards = playableCards.filter(({ card }) => card.type === CARD_TYPES.NUMBER);
  if (numberCards.length > 0) {
    // 出最大的數字
    numberCards.sort((a, b) => b.card.value - a.card.value);
    return numberCards[0];
  }
  
  // 其他玩家手牌少時使用功能牌
  const otherPlayers = gameState.players.filter(p => p.id !== player.id);
  const lowHandPlayers = otherPlayers.filter(p => p.hand.length <= 3);
  
  if (lowHandPlayers.length > 0) {
    const skipCards = playableCards.filter(({ card }) => card.type === CARD_TYPES.SKIP);
    const drawTwoCards = playableCards.filter(({ card }) => card.type === CARD_TYPES.DRAW_TWO);
    
    if (skipCards.length > 0) return skipCards[0];
    if (drawTwoCards.length > 0) return drawTwoCards[0];
  }
  
  // 最後才出萬用牌
  const nonWildCards = playableCards.filter(({ card }) => 
    card.type !== CARD_TYPES.WILD && card.type !== CARD_TYPES.WILD_DRAW_FOUR
  );
  
  if (nonWildCards.length > 0) {
    return nonWildCards[0];
  }
  
  return playableCards[0];
}

/**
 * 選擇最佳萬用牌顏色
 */
function chooseBestWildColor(player) {
  const colorCounts = {};
  player.hand.forEach(card => {
    if (card.color !== 'wild') {
      colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
    }
  });
  
  // 選擇手牌中最多的顏色
  const bestColor = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  return bestColor || COLORS[Math.floor(Math.random() * COLORS.length)];
}

/**
 * 電腦是否應該喊 UNO
 */
function shouldComputerCallUno(player) {
  switch (player.difficulty) {
    case 'easy':
      return Math.random() > 0.5; // 50% 機率忘記
    case 'normal':
      return Math.random() > 0.2; // 80% 機率會喊
    case 'hard':
      return true; // 一定會喊
    default:
      return Math.random() > 0.3;
  }
}

// ================================
// 遊戲流程函式
// ================================

/**
 * 開始遊戲
 */
function startGame() {
  if (gameState.isStartingGame) {
    return;
  }
  
  gameState.isStartingGame = true;
  
  const difficulty = gameState.selectedDifficulty;
  const cost = difficultySettings[difficulty].cost;
  
  // 檢查星星是否足夠
  const currentStars = StarSystem.getTotalStars();
  if (currentStars < cost) {
    showGameMessage(`星星不足，需要 ${cost} 星星才能開始${getDifficultyName(difficulty)}`, 'error');
    gameState.isStartingGame = false;
    return;
  }
  
  // 扣除星星
  const result = StarSystem.spendTotalStars(cost, `UNO 遊戲入場費 - ${getDifficultyName(difficulty)}`);
  
  if (!result.ok) {
    showGameMessage(result.reason, 'error');
    gameState.isStartingGame = false;
    return;
  }
  
  showGameMessage(`已扣除 ${cost} 星星`, 'success');
  
  // 初始化遊戲
  initializeGame();
  
  gameState.isStartingGame = false;
}

/**
 * 初始化遊戲
 */
function initializeGame() {
  // 重置遊戲狀態
  gameState.deck = shuffleDeck(createDeck());
  gameState.discardPile = [];
  gameState.currentPlayerIndex = 0;
  gameState.direction = 1;
  gameState.currentColor = null;
  gameState.pendingDrawCount = 0;
  gameState.pendingDrawType = null;
  gameState.winner = null;
  gameState.isGameStarted = true;
  gameState.isGameOver = false;
  gameState.isTurnProcessing = false;
  gameState.isAnimating = false;
  gameState.turnCount = 0;
  gameState.gameStartTime = Date.now();
  
  // 初始化玩家
  initializePlayers();
  
  // 發牌
  dealCards();
  
  // 翻開第一張牌
  let firstCard = gameState.deck.pop();
  
  // 確保第一張牌不是萬用加四牌
  while (firstCard.type === CARD_TYPES.WILD_DRAW_FOUR) {
    gameState.deck.unshift(firstCard);
    gameState.deck = shuffleDeck(gameState.deck);
    firstCard = gameState.deck.pop();
  }
  
  gameState.discardPile.push(firstCard);
  gameState.currentColor = firstCard.color;
  
  // 如果第一張是功能牌，套用效果
  if (firstCard.type !== CARD_TYPES.NUMBER && firstCard.type !== CARD_TYPES.WILD) {
    applyCardEffect(firstCard);
  }
  
  // 開始計時器
  startGameTimer();
  
  // 切換畫面
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');
  
  // 渲染遊戲
  renderGame();
  
  // 如果第一位是電腦，開始電腦回合
  if (gameState.players[gameState.currentPlayerIndex].type === 'computer') {
    setTimeout(runComputerTurn, 1000);
  }
}

/**
 * 重置遊戲
 */
function resetGame() {
  // 停止計時器
  stopGameTimer();
  
  // 重置玩家 UNO 狀態
  gameState.players.forEach(player => {
    player.hasCalledUno = false;
    player.canCatchUno = false;
  });
  
  // 重新初始化
  initializeGame();
}

/**
 * 檢查勝利者
 */
function checkWinner() {
  for (const player of gameState.players) {
    if (player.hand.length === 0) {
      gameState.winner = player;
      return true;
    }
  }
  return false;
}

/**
 * 結束遊戲
 */
function endGame() {
  gameState.isGameOver = true;
  stopGameTimer();
  
  const winner = gameState.winner;
  const isPlayerWin = winner.type === 'human';
  const difficulty = gameState.selectedDifficulty;
  const reward = difficultySettings[difficulty].reward;
  
  // 更新統計
  gameStatistics.gamesPlayed++;
  if (isPlayerWin) {
    gameStatistics.wins++;
    const gameTime = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
    if (gameStatistics.fastestWinSeconds === null || gameTime < gameStatistics.fastestWinSeconds) {
      gameStatistics.fastestWinSeconds = gameTime;
    }
    
    // 發放獎勵
    StarSystem.addTotalStars(reward, `UNO 遊戲獲勝獎勵 - ${getDifficultyName(difficulty)}`);
    showGameMessage(`恭喜獲勝！獲得 ${reward} 星星`, 'success');
  } else {
    gameStatistics.losses++;
    showGameMessage('再接再厲！', 'info');
  }
  
  // 儲存統計
  saveStatistics();
  
  // 顯示結果彈窗
  showGameOverModal(winner, isPlayerWin, reward);
}

/**
 * 離開遊戲
 */
function leaveGame() {
  if (gameState.isGameStarted && !gameState.isGameOver) {
    // 顯示確認彈窗
    document.getElementById('confirmLeaveModal').classList.remove('hidden');
  } else {
    // 直接離開
    returnToGameCenter();
  }
}

/**
 * 返回遊戲中心
 */
function returnToGameCenter() {
  stopGameTimer();
  
  document.getElementById('gameScreen').classList.add('hidden');
  document.getElementById('startScreen').classList.remove('hidden');
  
  // 重置遊戲狀態
  gameState.isGameStarted = false;
  gameState.isGameOver = false;
  gameState.selectedDifficulty = null;
  
  // 重置難度選擇
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  document.getElementById('startGameBtn').disabled = true;
  
  // 隱藏所有彈窗
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.add('hidden');
  });
}

// ================================
// 計時器函式
// ================================

/**
 * 開始遊戲計時器
 */
function startGameTimer() {
  gameState.gameTimer = setInterval(updateGameTime, 1000);
}

/**
 * 停止遊戲計時器
 */
function stopGameTimer() {
  if (gameState.gameTimer) {
    clearInterval(gameState.gameTimer);
    gameState.gameTimer = null;
  }
}

/**
 * 更新遊戲時間顯示
 */
function updateGameTime() {
  if (!gameState.gameStartTime) return;
  
  const elapsed = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  
  const timeElement = document.getElementById('gameTime');
  if (timeElement) {
    timeElement.textContent = `${minutes}:${seconds}`;
  }
}

// ================================
// 設定管理函式
// ================================

/**
 * 儲存設定
 */
function saveSettings() {
  gameSettings.allowStackDraw2 = document.getElementById('allowStackDraw2').checked;
  gameSettings.allowStackDraw4 = document.getElementById('allowStackDraw4').checked;
  gameSettings.drawUntilPlayable = document.getElementById('drawUntilPlayable').checked;
  gameSettings.enableSound = document.getElementById('enableSound').checked;
  gameSettings.volume = parseInt(document.getElementById('volumeSlider').value);
  gameSettings.animationSpeed = document.getElementById('animationSpeed').value;
  
  localStorage.setItem('unoGameSettings', JSON.stringify(gameSettings));
  
  showGameMessage('設定已儲存', 'success');
  document.getElementById('settingsModal').classList.add('hidden');
}

/**
 * 載入設定
 */
function loadSettings() {
  try {
    const saved = localStorage.getItem('unoGameSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      Object.assign(gameSettings, settings);
      
      // 更新 UI
      document.getElementById('allowStackDraw2').checked = gameSettings.allowStackDraw2;
      document.getElementById('allowStackDraw4').checked = gameSettings.allowStackDraw4;
      document.getElementById('drawUntilPlayable').checked = gameSettings.drawUntilPlayable;
      document.getElementById('enableSound').checked = gameSettings.enableSound;
      document.getElementById('volumeSlider').value = gameSettings.volume;
      document.getElementById('volumeValue').textContent = gameSettings.volume + '%';
      document.getElementById('animationSpeed').value = gameSettings.animationSpeed;
    }
  } catch (error) {
    console.error('載入設定失敗:', error);
  }
}

// ================================
// 統計管理函式
// ================================

/**
 * 儲存統計
 */
function saveStatistics() {
  try {
    localStorage.setItem('unoGameStatistics', JSON.stringify(gameStatistics));
  } catch (error) {
    console.error('儲存統計失敗:', error);
  }
}

/**
 * 載入統計
 */
function loadStatistics() {
  try {
    const saved = localStorage.getItem('unoGameStatistics');
    if (saved) {
      const stats = JSON.parse(saved);
      Object.assign(gameStatistics, stats);
    }
  } catch (error) {
    console.error('載入統計失敗:', error);
  }
}

// ================================
// UI 渲染函式
// ================================

/**
 * 渲染遊戲
 */
function renderGame() {
  renderPlayerHand();
  renderComputerPlayers();
  renderDiscardPile();
  renderDrawPile();
  updateTurnIndicator();
  updateColorIndicator();
  updateDirectionDisplay();
  updateDeckCount();
  updateTurnCount();
  updateUnoButton();
  updateCatchUnoButton();
}

/**
 * 渲染玩家手牌
 */
function renderPlayerHand() {
  const playerHand = document.getElementById('playerHand');
  const player = gameState.players[0];
  
  playerHand.innerHTML = '';
  
  player.hand.forEach((card, index) => {
    const cardElement = createCardElement(card);
    cardElement.dataset.index = index;
    cardElement.setAttribute('role', 'button');
    cardElement.setAttribute('tabindex', '0');
    cardElement.setAttribute('aria-label', getCardDisplayName(card));
    
    // 檢查是否可以出牌
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (!canPlayCard(card, gameState.currentColor, topCard)) {
      cardElement.classList.add('disabled');
    }
    
    // 點擊事件
    cardElement.addEventListener('click', () => handleCardClick(index));
    cardElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardClick(index);
      }
    });
    
    playerHand.appendChild(cardElement);
  });
}

/**
 * 渲染電腦玩家
 */
function renderComputerPlayers() {
  for (let i = 1; i <= 3; i++) {
    const computerElement = document.getElementById(`computer-${i}`);
    const player = gameState.players[i];
    
    // 更新牌數
    const countElement = computerElement.querySelector('.count');
    if (countElement) {
      countElement.textContent = player.hand.length;
    }
    
    // 更新狀態
    const statusElement = computerElement.querySelector('.player-status');
    if (statusElement) {
      let statusText = '';
      if (player.hand.length === 1 && player.hasCalledUno) {
        statusText = 'UNO!';
      } else if (player.hand.length === 1 && !player.hasCalledUno) {
        statusText = '可抓 UNO';
      }
      statusElement.textContent = statusText;
    }
    
    // 更新是否輪到該玩家
    if (gameState.currentPlayerIndex === i) {
      computerElement.classList.add('active');
    } else {
      computerElement.classList.remove('active');
    }
    
    // 渲染卡背
    const cardsContainer = computerElement.querySelector('.player-cards');
    cardsContainer.innerHTML = '';
    for (let j = 0; j < Math.min(player.hand.length, 5); j++) {
      const cardBack = document.createElement('div');
      cardBack.className = 'card-back';
      cardBack.textContent = 'UNO';
      cardsContainer.appendChild(cardBack);
    }
  }
}

/**
 * 渲染棄牌堆
 */
function renderDiscardPile() {
  const discardPile = document.getElementById('discardPile');
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  
  discardPile.innerHTML = '';
  
  if (topCard) {
    const cardElement = createCardElement(topCard);
    discardPile.appendChild(cardElement);
  }
}

/**
 * 渲染抽牌堆
 */
function renderDrawPile() {
  // 抽牌堆視覺效果在 CSS 中處理
}

/**
 * 更新回合指示器
 */
function updateTurnIndicator() {
  const turnPlayer = document.getElementById('turnPlayer');
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  if (turnPlayer) {
    turnPlayer.textContent = currentPlayer.name;
  }
  
  // 更新玩家區域高亮
  const playerArea = document.getElementById('playerArea');
  if (gameState.currentPlayerIndex === 0) {
    playerArea.classList.add('active');
  } else {
    playerArea.classList.remove('active');
  }
}

/**
 * 更新顏色指示器
 */
function updateColorIndicator() {
  const colorIndicator = document.getElementById('colorIndicator');
  
  if (colorIndicator) {
    colorIndicator.className = 'color-indicator ' + gameState.currentColor;
  }
}

/**
 * 更新方向顯示
 */
function updateDirectionDisplay() {
  const directionArrow = document.getElementById('directionArrow');
  
  if (directionArrow) {
    if (gameState.direction === 1) {
      directionArrow.textContent = '→';
      directionArrow.classList.remove('reverse');
    } else {
      directionArrow.textContent = '←';
      directionArrow.classList.add('reverse');
    }
  }
}

/**
 * 更新抽牌堆數量
 */
function updateDeckCount() {
  const deckCount = document.getElementById('deckCount');
  if (deckCount) {
    deckCount.textContent = gameState.deck.length;
  }
}

/**
 * 更新回合數
 */
function updateTurnCount() {
  const turnCount = document.getElementById('turnCount');
  if (turnCount) {
    turnCount.textContent = gameState.turnCount;
  }
}

/**
 * 更新 UNO 按鈕
 */
function updateUnoButton() {
  const unoBtn = document.getElementById('unoBtn');
  const player = gameState.players[0];
  
  if (unoBtn) {
    unoBtn.disabled = player.hand.length !== 1 || player.hasCalledUno;
  }
}

/**
 * 更新抓 UNO 按鈕
 */
function updateCatchUnoButton() {
  const catchUnoBtn = document.getElementById('catchUnoBtn');
  const player = gameState.players[0];
  
  if (catchUnoBtn) {
    // 檢查是否有電腦玩家可以被抓
    const canCatch = gameState.players.some(p => 
      p.type === 'computer' && 
      p.hand.length === 1 && 
      !p.hasCalledUno
    );
    
    catchUnoBtn.disabled = !canCatch;
  }
}

/**
 * 建立卡牌元素
 */
function createCardElement(card) {
  const cardElement = document.createElement('div');
  cardElement.className = `card ${card.color}`;
  
  // 卡牌內容
  const cardValue = document.createElement('div');
  cardValue.className = 'card-value';
  cardValue.textContent = getCardDisplayValue(card);
  cardElement.appendChild(cardValue);
  
  // 角落數字
  const topLeft = document.createElement('div');
  topLeft.className = 'card-corner top-left';
  topLeft.textContent = getCardDisplayValue(card);
  cardElement.appendChild(topLeft);
  
  const bottomRight = document.createElement('div');
  bottomRight.className = 'card-corner bottom-right';
  bottomRight.textContent = getCardDisplayValue(card);
  cardElement.appendChild(bottomRight);
  
  // 橢圓裝飾
  const oval = document.createElement('div');
  oval.className = 'card-oval';
  cardElement.appendChild(oval);
  
  return cardElement;
}

/**
 * 取得卡牌顯示值
 */
function getCardDisplayValue(card) {
  switch (card.type) {
    case CARD_TYPES.NUMBER:
      return card.value;
    case CARD_TYPES.SKIP:
      return '🚫';
    case CARD_TYPES.REVERSE:
      return '⇄';
    case CARD_TYPES.DRAW_TWO:
      return '+2';
    case CARD_TYPES.WILD:
      return '🌈';
    case CARD_TYPES.WILD_DRAW_FOUR:
      return '+4';
    default:
      return '?';
  }
}

/**
 * 取得卡牌顯示名稱
 */
function getCardDisplayName(card) {
  const colorName = getColorName(card.color);
  const valueName = getCardDisplayValue(card);
  return `${colorName} ${valueName}`;
}

/**
 * 取得顏色名稱
 */
function getColorName(color) {
  switch (color) {
    case 'red': return '紅色';
    case 'yellow': return '黃色';
    case 'green': return '綠色';
    case 'blue': return '藍色';
    case 'wild': return '萬用';
    default: return color;
  }
}

/**
 * 取得難度名稱
 */
function getDifficultyName(difficulty) {
  switch (difficulty) {
    case 'easy': return '簡單模式';
    case 'normal': return '普通模式';
    case 'hard': return '困難模式';
    default: return difficulty;
  }
}

/**
 * 顯示遊戲訊息
 */
function showGameMessage(message, type = 'info') {
  const messageElement = document.getElementById('gameMessage');
  
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.className = 'game-message ' + type;
    messageElement.classList.remove('hidden');
    
    setTimeout(() => {
      messageElement.classList.add('hidden');
    }, 2000);
  }
}

/**
 * 顯示遊戲結束彈窗
 */
function showGameOverModal(winner, isPlayerWin, reward) {
  const modal = document.getElementById('gameOverModal');
  const title = document.getElementById('gameOverTitle');
  const resultMessage = document.getElementById('resultMessage');
  const resultTime = document.getElementById('resultTime');
  const resultTurns = document.getElementById('resultTurns');
  const resultReward = document.getElementById('resultReward');
  
  title.textContent = isPlayerWin ? '恭喜獲勝！' : '遊戲結束';
  resultMessage.textContent = isPlayerWin ? '你贏了這局遊戲！' : `${winner.name} 贏了這局遊戲`;
  
  const gameTime = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
  const minutes = Math.floor(gameTime / 60).toString().padStart(2, '0');
  const seconds = (gameTime % 60).toString().padStart(2, '0');
  
  resultTime.textContent = `${minutes}:${seconds}`;
  resultTurns.textContent = gameState.turnCount;
  resultReward.textContent = isPlayerWin ? `${reward} 星星` : '0 星星';
  
  modal.classList.remove('hidden');
}

// ================================
// 事件處理函式
// ================================

/**
 * 處理卡牌點擊
 */
function handleCardClick(index) {
  if (gameState.isTurnProcessing || gameState.isGameOver) {
    return;
  }
  
  if (gameState.currentPlayerIndex !== 0) {
    showGameMessage('現在還輪不到你', 'error');
    return;
  }
  
  const player = gameState.players[0];
  const card = player.hand[index];
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  
  // 檢查是否可以出牌
  if (!canPlayCard(card, gameState.currentColor, topCard)) {
    // 卡牌晃動動畫
    const cardElement = document.querySelector(`[data-index="${index}"]`);
    if (cardElement) {
      cardElement.classList.add('shake');
      setTimeout(() => cardElement.classList.remove('shake'), 500);
    }
    
    showGameMessage('這張牌現在不能出', 'error');
    return;
  }
  
  // 檢查萬用加四牌限制
  if (card.type === CARD_TYPES.WILD_DRAW_FOUR) {
    if (!canUseWildDrawFour(player.hand, gameState.currentColor)) {
      showGameMessage('你還有符合目前顏色的牌，不能使用萬用加四牌', 'error');
      return;
    }
  }
  
  gameState.isTurnProcessing = true;
  
  // 出牌
  playCard(player, index);
  
  // 處理萬用牌選色
  if (card.type === CARD_TYPES.WILD || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
    showColorPicker();
    return; // 等待選擇顏色後繼續
  }
  
  // 套用卡牌效果
  applyCardEffect(card);
  
  // 檢查 UNO
  if (player.hand.length === 1 && !player.hasCalledUno) {
    // 給電腦抓 UNO 的機會
    gameState.players.forEach(p => {
      if (p.type === 'computer') {
        p.canCatchUno = true;
      }
    });
  }
  
  showGameMessage(`你出了 ${getCardDisplayName(card)}`, 'info');
  
  // 檢查勝利
  if (checkWinner()) {
    endGame();
    return;
  }
  
  // 前進到下一位玩家
  advanceTurn();
  gameState.isTurnProcessing = false;
  
  // 更新顯示
  renderGame();
  
  // 如果下一位是電腦，開始電腦回合
  if (gameState.players[gameState.currentPlayerIndex].type === 'computer') {
    setTimeout(runComputerTurn, 1000);
  }
}

/**
 * 處理抽牌
 */
function handleDrawCard() {
  if (gameState.isTurnProcessing || gameState.isGameOver) {
    return;
  }
  
  if (gameState.currentPlayerIndex !== 0) {
    showGameMessage('現在還輪不到你', 'error');
    return;
  }
  
  gameState.isTurnProcessing = true;
  
  const player = gameState.players[0];
  
  // 處理待抽牌
  if (gameState.pendingDrawCount > 0) {
    drawCard(player, gameState.pendingDrawCount);
    showGameMessage(`你抽了 ${gameState.pendingDrawCount} 張牌`, 'warning');
    
    gameState.pendingDrawCount = 0;
    gameState.pendingDrawType = null;
    
    advanceTurn();
    gameState.isTurnProcessing = false;
    renderGame();
    
    if (gameState.players[gameState.currentPlayerIndex].type === 'computer') {
      setTimeout(runComputerTurn, 1000);
    }
    return;
  }
  
  // 正常抽牌
  const drawnCards = drawCard(player, 1);
  
  if (drawnCards.length > 0) {
    showGameMessage('你抽了一張牌', 'info');
    
    // 檢查抽到的牌是否可以出
    if (gameSettings.drawUntilPlayable) {
      const drawnCard = drawnCards[0];
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      
      if (canPlayCard(drawnCard, gameState.currentColor, topCard)) {
        showGameMessage('抽到的牌可以出', 'info');
        // 讓玩家選擇是否要出這張牌
      }
    }
  }
  
  // 如果設定為抽到可以出為止，繼續抽牌
  if (gameSettings.drawUntilPlayable) {
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    const lastCard = player.hand[player.hand.length - 1];
    
    if (!canPlayCard(lastCard, gameState.currentColor, topCard)) {
      gameState.isTurnProcessing = false;
      renderGame();
      return; // 繼續讓玩家抽牌
    }
  }
  
  // 前進到下一位玩家
  advanceTurn();
  gameState.isTurnProcessing = false;
  
  renderGame();
  
  if (gameState.players[gameState.currentPlayerIndex].type === 'computer') {
    setTimeout(runComputerTurn, 1000);
  }
}

/**
 * 處理 UNO 按鈕
 */
function handleUno() {
  const player = gameState.players[0];
  callUno(player);
  renderGame();
}

/**
 * 處理抓 UNO 按鈕
 */
function handleCatchUno() {
  const player = gameState.players[0];
  
  // 找出可以被抓的電腦玩家
  for (let i = 1; i < gameState.players.length; i++) {
    const target = gameState.players[i];
    if (catchUno(player, target)) {
      renderGame();
      return;
    }
  }
  
  showGameMessage('沒有可以抓的 UNO', 'error');
}

/**
 * 處理整理手牌
 */
function handleSortCards() {
  document.getElementById('sortOptionsModal').classList.remove('hidden');
}

/**
 * 排序手牌
 */
function sortHand(sortType) {
  const player = gameState.players[0];
  
  switch (sortType) {
    case 'color':
      player.hand.sort((a, b) => {
        const colorOrder = { red: 0, yellow: 1, green: 2, blue: 3, wild: 4 };
        return colorOrder[a.color] - colorOrder[b.color];
      });
      break;
      
    case 'number':
      player.hand.sort((a, b) => {
        if (a.type === CARD_TYPES.NUMBER && b.type === CARD_TYPES.NUMBER) {
          return a.value - b.value;
        }
        return 0;
      });
      break;
      
    case 'type':
      player.hand.sort((a, b) => {
        const typeOrder = { 
          number: 0, 
          skip: 1, 
          reverse: 2, 
          draw_two: 3, 
          wild: 4, 
          wild_draw_four: 5 
        };
        return typeOrder[a.type] - typeOrder[b.type];
      });
      break;
      
    case 'none':
      // 不排序
      break;
  }
  
  document.getElementById('sortOptionsModal').classList.add('hidden');
  renderGame();
}

/**
 * 顯示顏色選擇器
 */
function showColorPicker() {
  document.getElementById('colorPickerModal').classList.remove('hidden');
}

/**
 * 處理顏色選擇
 */
function handleColorChoice(color) {
  gameState.currentColor = color;
  document.getElementById('colorPickerModal').classList.add('hidden');
  
  // 套用萬用加四牌效果
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  if (topCard.type === CARD_TYPES.WILD_DRAW_FOUR) {
    applyCardEffect(topCard);
  }
  
  showGameMessage(`你選擇了 ${getColorName(color)}`, 'info');
  
  // 檢查 UNO
  const player = gameState.players[0];
  if (player.hand.length === 1 && !player.hasCalledUno) {
    gameState.players.forEach(p => {
      if (p.type === 'computer') {
        p.canCatchUno = true;
      }
    });
  }
  
  // 檢查勝利
  if (checkWinner()) {
    endGame();
    return;
  }
  
  // 前進到下一位玩家
  advanceTurn();
  gameState.isTurnProcessing = false;
  
  renderGame();
  
  if (gameState.players[gameState.currentPlayerIndex].type === 'computer') {
    setTimeout(runComputerTurn, 1000);
  }
}

// ================================
// 初始化函式
// ================================

/**
 * 初始化遊戲
 */
function init() {
  // 載入設定和統計
  loadSettings();
  loadStatistics();
  
  // 綁定難度選擇事件
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      gameState.selectedDifficulty = btn.dataset.difficulty;
      document.getElementById('startGameBtn').disabled = false;
    });
  });
  
  // 綁定開始遊戲按鈕
  document.getElementById('startGameBtn').addEventListener('click', startGame);
  
  // 綁定返回按鈕
  document.getElementById('backToCenterBtn').addEventListener('click', () => {
    window.location.href = 'game_center_simple.html';
  });
  document.getElementById('backToCenterBtn2').addEventListener('click', () => {
    window.location.href = 'game_center_simple.html';
  });
  
  // 綁定離開遊戲按鈕
  document.getElementById('leaveGameBtn').addEventListener('click', leaveGame);
  
  // 綁定設定按鈕
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.remove('hidden');
  });
  
  // 綁定關閉設定按鈕
  document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.add('hidden');
  });
  
  // 綁定儲存設定按鈕
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  
  // 綁定音量滑桿
  document.getElementById('volumeSlider').addEventListener('input', (e) => {
    document.getElementById('volumeValue').textContent = e.target.value + '%';
  });
  
  // 綁定顏色選擇按鈕
  document.querySelectorAll('.color-option').forEach(btn => {
    btn.addEventListener('click', () => {
      handleColorChoice(btn.dataset.color);
    });
  });
  
  // 綁定玩家控制按鈕
  document.getElementById('drawCardBtn').addEventListener('click', handleDrawCard);
  document.getElementById('unoBtn').addEventListener('click', handleUno);
  document.getElementById('catchUnoBtn').addEventListener('click', handleCatchUno);
  document.getElementById('sortCardsBtn').addEventListener('click', handleSortCards);
  
  // 綁定排序選項按鈕
  document.querySelectorAll('.sort-option').forEach(btn => {
    btn.addEventListener('click', () => {
      sortHand(btn.dataset.sort);
    });
  });
  
  // 綁定關閉排序按鈕
  document.getElementById('closeSortBtn').addEventListener('click', () => {
    document.getElementById('sortOptionsModal').classList.add('hidden');
  });
  
  // 綁定再玩一次按鈕
  document.getElementById('playAgainBtn').addEventListener('click', () => {
    document.getElementById('gameOverModal').classList.add('hidden');
    resetGame();
  });
  
  // 綁定查看規則按鈕
  document.getElementById('viewRulesBtn').addEventListener('click', () => {
    document.getElementById('gameOverModal').classList.add('hidden');
    document.querySelector('.game-rules').scrollIntoView({ behavior: 'smooth' });
  });
  
  // 綁定確認離開按鈕
  document.getElementById('confirmLeaveBtn').addEventListener('click', () => {
    document.getElementById('confirmLeaveModal').classList.add('hidden');
    returnToGameCenter();
  });
  
  // 綁定取消離開按鈕
  document.getElementById('cancelLeaveBtn').addEventListener('click', () => {
    document.getElementById('confirmLeaveModal').classList.add('hidden');
  });
  
  console.log('UNO 遊戲已初始化');
}

// 頁面載入時初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
