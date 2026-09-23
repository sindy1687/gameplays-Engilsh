/**
 * 希臘神祇關卡共用系統
 * 統一管理愛心系統、遊戲流程、結果畫面
 */

window.GreekStageSystem = (function() {
  // ===== 常數 =====
  const MAX_LIVES = 5;
  const MAX_ATTEMPTS = 3;

  // ===== 狀態 =====
  let lives = MAX_LIVES;
  let hasLostLifeThisQuestion = false;
  let gameOverFlag = false;

  // ===== 愛心系統 =====
  function initLives() {
    lives = MAX_LIVES;
    hasLostLifeThisQuestion = false;
    gameOverFlag = false;
    updateLivesUI();
  }

  function getLives() {
    return lives;
  }

  function loseLife(reason) {
    if (gameOverFlag) return false;

    if (hasLostLifeThisQuestion) {
      console.log('本題已扣過愛心，跳過');
      return false;
    }

    hasLostLifeThisQuestion = true;
    lives--;

    updateLivesUI();

    if (lives <= 0) {
      gameOverFlag = true;
      triggerGameOver();
    }

    return true;
  }

  function resetLives() {
    initLives();
  }

  function updateLivesUI() {
    const el = document.getElementById('lives');
    if (!el) return;

    const hearts = '❤️'.repeat(Math.max(0, lives));
    const empties = '🤍'.repeat(Math.max(0, MAX_LIVES - lives));
    el.innerHTML = hearts + empties;

    // 低生命警告
    const heartPanel = el.closest('.heart-panel');
    if (heartPanel) {
      heartPanel.classList.remove('low-life', 'critical-life');
      if (lives === 1) {
        heartPanel.classList.add('critical-life');
      } else if (lives <= 2) {
        heartPanel.classList.add('low-life');
      }
    }
  }

  function isGameOver() {
    return gameOverFlag;
  }

  // ===== 題目狀態重置 =====
  function resetQuestionState() {
    hasLostLifeThisQuestion = false;
  }

  // ===== 遊戲結束處理 =====
  function triggerGameOver() {
    // 停止計時器
    if (typeof stopTimer === 'function') {
      stopTimer();
    }

    // 禁用輸入和按鈕
    const inputEl = document.getElementById('user-input');
    if (inputEl) inputEl.disabled = true;

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.disabled = true;

    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) skipBtn.disabled = true;

    // 顯示失敗畫面
    setTimeout(() => {
      showGameOverScreen();
    }, 500);
  }

  function showGameOverScreen() {
    // 取得統計數據
    const gameState = window.gameState || {};
    const correctCount = (gameState.answerLog || []).filter(log => log && log.correct === true).length;
    const totalAnswered = (gameState.answerLog || []).length;
    const totalQuestions = (gameState.data || []).length;

    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    // 更新結束畫面
    const endTitle = document.getElementById('endTitle');
    const endIcon = document.getElementById('endIcon');
    const endCorrectCount = document.getElementById('endCorrectCount');
    const endWrongCount = document.getElementById('endWrongCount');
    const endAccuracy = document.getElementById('endAccuracy');
    const endStars = document.getElementById('endStars');
    const endLives = document.getElementById('endLives');

    if (endTitle) endTitle.textContent = '💔 挑戰失敗';
    if (endIcon) endIcon.textContent = '💔';
    if (endCorrectCount) endCorrectCount.textContent = `${correctCount} / ${totalAnswered}`;
    if (endWrongCount) endWrongCount.textContent = totalAnswered - correctCount;
    if (endAccuracy) endAccuracy.textContent = accuracy + '%';
    if (endStars) endStars.textContent = '☆☆☆';
    if (endLives) endLives.textContent = '0 / 5';

    // 顯示結束畫面
    const endScreen = document.getElementById('endScreen');
    if (endScreen) {
      endScreen.style.display = 'flex';
    }
  }

  // ===== 重新開始 =====
  function restartGame() {
    initLives();

    // 隱藏結束畫面
    const endScreen = document.getElementById('endScreen');
    if (endScreen) {
      endScreen.style.display = 'none';
    }

    // 呼叫頁面的重新開始函數
    if (typeof restartGame === 'function') {
      restartGame();
    }
  }

  // ===== 返回圖鑑 =====
  function returnToAtlas() {
    window.location.href = 'atlas.html?tab=greek';
  }

  // ===== 導出 =====
  return {
    MAX_LIVES,
    MAX_ATTEMPTS,

    initLives,
    getLives,
    loseLife,
    resetLives,
    updateLivesUI,
    isGameOver,

    resetQuestionState,

    triggerGameOver,
    showGameOverScreen,

    restartGame,
    returnToAtlas
  };
})();
