/**
 * 星星獎勵系統
 * 提供統一的星星獎勵、成就檢查和通知功能
 */

// 星星獎勵系統
const StarRewardSystem = {
  // 增加星星
  addStars: function(amount) {
    const currentStars = parseInt(localStorage.getItem('totalStars') || '0');
    const newStars = currentStars + amount;
    window.StarSystem.setTotalStars(newStars);
    
    // 更新顯示
    this.updateStarsDisplay();
    
    // 播放音效
    this.playStarSound();
    
    // 顯示獎勵動畫 - 已移除彈窗，只保留結算清單
    // this.showStarReward(amount);
    
    return newStars;
  },
  
  // 更新星星顯示
  updateStarsDisplay: function() {
    const starsCount = document.getElementById('totalStarsCount');
    if (starsCount) {
      const stars = parseInt(localStorage.getItem('totalStars') || '0');
      starsCount.textContent = `⭐ ${stars}`;
      console.log('⭐ StarRewardSystem 星星數已更新:', stars);
    }
  },
  
  // 播放星星音效
  playStarSound: function() {
    try {
      // 使用 Web Audio API 播放簡單的音效
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // 如果音效API不可用，靜默處理
    }
  },
  
  // 顯示星星獎勵動畫 - 已停用
  showStarReward: function(amount) {
    // 不再顯示彈窗，星星會直接加到總數並在結算時顯示
    console.log(`⭐ 獲得 ${amount} 顆星星`);
  },
};

// 單字達人成就系統
const VocabularyAchievementSystem = {
  // 播放星星音效
  playStarSound: function() {
    try {
      const starSound = new Audio('sound/shine.mp3');
      starSound.currentTime = 0;
      starSound.volume = 0.6;
      starSound.play().catch(e => {
        console.log('無法播放星星音效:', e);
      });
    } catch (e) {
      console.log('星星音效播放失敗:', e);
    }
  },
  
  // 記錄答對的單字
  recordCorrectWord: function(word, bookName) {
    // 增加答對單字計數
    const currentCount = parseInt(localStorage.getItem('vocabularyCorrectWords') || '0');
    const newCount = currentCount + 1;
    localStorage.setItem('vocabularyCorrectWords', newCount);
    
    // 記錄答對的單字（避免重複計算）
    let correctWords = JSON.parse(localStorage.getItem('vocabularyCorrectWordsList') || '[]');
    const wordKey = `${bookName}_${word}`;
    if (!correctWords.includes(wordKey)) {
      correctWords.push(wordKey);
      localStorage.setItem('vocabularyCorrectWordsList', JSON.stringify(correctWords));
      
      // 給予星星獎勵
      const starsEarned = this.calculateStarReward(word, bookName);
      StarRewardSystem.addStars(starsEarned);
      
      // 播放星星音效
      this.playStarSound();
      
      // 檢查成就
      this.checkAchievements(newCount);
      
      return starsEarned;
    }
    return 0;
  },
  
  // 計算星星獎勵
  calculateStarReward: function(word, bookName) {
    // 基礎獎勵：答對一個單字獲得1顆星星
    let baseReward = 1;
    
    // 根據單字長度給予額外獎勵
    if (word.length >= 8) {
      baseReward += 1; // 長單字額外獎勵
    }
    
    // 根據單字本類型給予額外獎勵
    if (bookName.includes('托福') || bookName.includes('TOEFL')) {
      baseReward += 1; // 托福單字額外獎勵
    } else if (bookName.includes('英檢') || bookName.includes('GEPT')) {
      baseReward += 1; // 英檢單字額外獎勵
    }
    
    return baseReward;
  },
  
  // 檢查成就
  checkAchievements: function(currentCount) {
    const achievements = [
      { id: 'vocab_beginner', requirement: 10, reward: 15 },
      { id: 'vocab_regular', requirement: 50, reward: 40 },
      { id: 'vocab_expert', requirement: 100, reward: 80 },
      { id: 'vocab_master', requirement: 200, reward: 150 },
      { id: 'vocab_legend', requirement: 500, reward: 300 }
    ];
    
    achievements.forEach(ach => {
      if (currentCount === ach.requirement) {
        // 成就達成！
        this.showAchievementNotification(ach);
      }
    });
  },
  
  // 顯示成就通知
  showAchievementNotification: function(achievement) {
    // 播放成就達成音效
    this.playStarSound();
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.9), rgba(162, 89, 255, 0.9));
      color: #000;
      padding: 15px 20px;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 0 20px #00ffff;
      animation: achievementSlideIn 0.5s ease-out forwards;
      font-family: 'Orbitron', sans-serif;
      max-width: 300px;
    `;
    
    const icon = this.getAchievementIcon(achievement.id);
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.5rem;">${icon}</span>
        <div>
          <div style="font-size: 1.1rem;">🏆 成就達成！</div>
          <div style="font-size: 0.9rem; margin-top: 5px;">${this.getAchievementName(achievement.id)}</div>
        </div>
      </div>
    `;
    
    // 添加動畫樣式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes achievementSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // 5秒後移除
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  },
  
  // 取得成就圖示
  getAchievementIcon: function(achievementId) {
    const icons = {
      'vocab_beginner': '📖',
      'vocab_regular': '📚',
      'vocab_expert': '🎓',
      'vocab_master': '👑',
      'vocab_legend': '🏆'
    };
    return icons[achievementId] || '🏆';
  },
  
  // 取得成就名稱
  getAchievementName: function(achievementId) {
    const names = {
      'vocab_beginner': '單字新手',
      'vocab_regular': '單字常客',
      'vocab_expert': '單字專家',
      'vocab_master': '單字大師',
      'vocab_legend': '單字傳奇'
    };
    return names[achievementId] || '未知成就';
  }
};

// 通用成就檢查系統
const AchievementChecker = {
  // 檢查並觸發成就
  checkAndTriggerAchievements: function() {
    // 這裡可以添加其他成就的檢查邏輯
    // 例如：登入天數、遊戲完成次數等
  },
  
  // 顯示成就彈窗
  showAchievementModal: function(achievement) {
    // 創建成就彈窗
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(12px);
    `;
    
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(10, 20, 40, 0.98), rgba(20, 40, 80, 0.98));
        border: 3px solid #00ffff;
        border-radius: 25px;
        padding: 30px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 0 50px #00ffff;
        animation: modalPop 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
      ">
        <div style="font-size: 4rem; margin-bottom: 20px;">${achievement.icon || '🏆'}</div>
        <h2 style="color: #00ffff; margin-bottom: 15px; font-size: 1.8rem;">${achievement.name}</h2>
        <p style="color: #ccc; margin-bottom: 20px; line-height: 1.5;">${achievement.description}</p>
        <div style="
          background: linear-gradient(90deg, #ffd700, #ffaa00);
          border-radius: 15px;
          padding: 15px;
          margin: 20px 0;
          color: #000;
          font-weight: bold;
          font-size: 1.2rem;
        ">
          ⭐ 獎勵：${achievement.reward} 顆星星 ⭐
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: linear-gradient(90deg, #00ffff, #a259ff);
          color: #000;
          border: none;
          padding: 12px 30px;
          border-radius: 25px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          margin-top: 15px;
        ">
          🎉 太棒了！
        </button>
      </div>
    `;
    
    // 添加動畫樣式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes modalPop {
        0% { transform: scale(0.2) rotate(-15deg); opacity: 0; }
        50% { transform: scale(1.15) rotate(3deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(modal);
    
    // 點擊背景關閉
    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    };
  }
};

// 導出系統供其他頁面使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StarRewardSystem, VocabularyAchievementSystem, AchievementChecker };
} 
