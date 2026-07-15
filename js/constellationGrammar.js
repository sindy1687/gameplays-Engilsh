// 星座語法探險遊戲邏輯 - 關卡式設計
class ConstellationGrammarGame {
  constructor() {
    this.currentLevel = null;
    this.currentQuestion = 0;
    this.questionsPerLevel = 5;
    this.starDust = 0;
    this.completedLevels = 0;
    this.treasureBoxes = 0;
    this.currentQuestionData = null;
    this.constellations = [];
    this.levels = [];
    this.sounds = {};
    this.isSoundEnabled = true; // 音效開關
    
    this.init();
  }

  init() {
    this.loadUserData();
    this.createStarsBackground();
    this.loadLevels();
    this.loadConstellations();
    this.loadSounds();
    this.renderLevels();
    this.renderConstellations();
    this.updateDisplay();
    this.setupEventListeners();
  }

  // 載入音效
  loadSounds() {
    try {
      this.sounds = {
        correct: new Audio('sound/correct.mp3'),
        wrong: new Audio('sound/wrong.mp3'),
        unlock: new Audio('sound/unlock.mp3'),
        click: new Audio('sound/click.mp3'),
        complete: new Audio('sound/completeSound.mp3'),
        shine: new Audio('sound/shine.mp3')
      };

      // 預載入音效並設置屬性
      Object.values(this.sounds).forEach(sound => {
        sound.load();
        sound.volume = 0.4; // 降低音量
        sound.preload = 'auto';
        // 設置音效結束事件
        sound.addEventListener('ended', () => {
          sound.currentTime = 0;
        });
      });
    } catch (error) {
      console.log('音效載入失敗:', error);
      this.isSoundEnabled = false;
    }
  }

  // 播放音效
  playSound(soundName) {
    if (!this.isSoundEnabled || !this.sounds[soundName]) {
      return;
    }

    try {
      const sound = this.sounds[soundName];
      
      // 停止當前播放的音效
      sound.pause();
      sound.currentTime = 0;
      
      // 播放音效
      const playPromise = sound.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('音效播放失敗:', error);
        });
      }
    } catch (error) {
      console.log('音效播放錯誤:', error);
    }
  }

  // 停止所有音效
  stopAllSounds() {
    Object.values(this.sounds).forEach(sound => {
      try {
        sound.pause();
        sound.currentTime = 0;
      } catch (error) {
        console.log('停止音效失敗:', error);
      }
    });
  }

  // 切換音效開關
  toggleSound() {
    this.isSoundEnabled = !this.isSoundEnabled;
    if (!this.isSoundEnabled) {
      this.stopAllSounds();
    }
    console.log('音效狀態:', this.isSoundEnabled ? '開啟' : '關閉');
  }

  // 創建星空背景
  createStarsBackground() {
    const starsBg = document.getElementById('starsBg');
    if (!starsBg) return;
    
    for (let i = 0; i < 100; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.width = Math.random() * 3 + 1 + 'px';
      star.style.height = star.style.width;
      star.style.animationDelay = Math.random() * 3 + 's';
      starsBg.appendChild(star);
    }
  }

  // 載入關卡資料
  loadLevels() {
    this.levels = [
      {
        id: "present_simple",
        title: "現在式一般動詞",
        description: "學習一般動詞的現在式用法",
        icon: "☀️",
        difficulty: "common",
        unlocked: true,
        completed: false,
        currentProgress: 0,
        questions: [
          {
            question: "He ___ to school every day.",
            options: ["go", "goes", "going"],
            correct: 1,
            explanation: "第三人稱單數現在式：he goes"
          },
          {
            question: "They ___ English very well.",
            options: ["speak", "speaks", "speaking"],
            correct: 0,
            explanation: "複數主詞用原形動詞：they speak"
          },
          {
            question: "She ___ her homework every evening.",
            options: ["do", "does", "doing"],
            correct: 1,
            explanation: "第三人稱單數現在式：she does"
          },
          {
            question: "We ___ basketball on weekends.",
            options: ["play", "plays", "playing"],
            correct: 0,
            explanation: "第一人稱複數用原形動詞：we play"
          },
          {
            question: "The cat ___ milk every morning.",
            options: ["drink", "drinks", "drinking"],
            correct: 1,
            explanation: "第三人稱單數現在式：the cat drinks"
          }
        ]
      },
      {
        id: "past_simple",
        title: "過去式動詞",
        description: "學習動詞的過去式變化",
        icon: "⏰",
        difficulty: "common",
        unlocked: false,
        completed: false,
        currentProgress: 0,
        questions: [
          {
            question: "She ___ to the store yesterday.",
            options: ["go", "goes", "went"],
            correct: 2,
            explanation: "過去式：go → went"
          },
          {
            question: "They ___ dinner at 7 PM.",
            options: ["have", "has", "had"],
            correct: 2,
            explanation: "過去式：have → had"
          },
          {
            question: "He ___ a movie last night.",
            options: ["watch", "watches", "watched"],
            correct: 2,
            explanation: "過去式：watch → watched"
          },
          {
            question: "We ___ to the beach last summer.",
            options: ["go", "goes", "went"],
            correct: 2,
            explanation: "過去式：go → went"
          },
          {
            question: "The dog ___ in the garden.",
            options: ["run", "runs", "ran"],
            correct: 2,
            explanation: "過去式：run → ran"
          }
        ]
      },
      {
        id: "be_verbs",
        title: "Be動詞",
        description: "學習be動詞的正確使用",
        icon: "🌟",
        difficulty: "common",
        unlocked: false,
        completed: false,
        currentProgress: 0,
        questions: [
          {
            question: "I ___ a student.",
            options: ["am", "is", "are"],
            correct: 0,
            explanation: "第一人稱單數：I am"
          },
          {
            question: "She ___ beautiful.",
            options: ["am", "is", "are"],
            correct: 1,
            explanation: "第三人稱單數：she is"
          },
          {
            question: "They ___ happy.",
            options: ["am", "is", "are"],
            correct: 2,
            explanation: "複數主詞：they are"
          },
          {
            question: "We ___ friends.",
            options: ["am", "is", "are"],
            correct: 2,
            explanation: "第一人稱複數：we are"
          },
          {
            question: "The weather ___ cold today.",
            options: ["am", "is", "are"],
            correct: 1,
            explanation: "第三人稱單數：the weather is"
          }
        ]
      }
    ];
  }

  // 載入星座資料
  loadConstellations() {
    this.constellations = [
      { id: "present_simple", name: "現在式", symbol: "☀️", difficulty: "common", unlocked: false, completed: false },
      { id: "past_simple", name: "過去式", symbol: "⏰", difficulty: "common", unlocked: false, completed: false },
      { id: "be_verbs", name: "Be動詞", symbol: "🌟", difficulty: "common", unlocked: false, completed: false }
    ];
  }

  // 載入使用者資料
  loadUserData() {
    try {
      const username = getCurrentUser();
      if (username) {
        const userData = loadUserData(username);
        if (userData) {
          this.starDust = userData.constellationStarDust || 0;
          this.completedLevels = userData.completedLevels || 0;
          this.treasureBoxes = userData.treasureBoxes || 0;
          this.levels = userData.constellationLevels || this.levels;
          this.constellations = userData.constellations || this.constellations;
        }
      }
    } catch (error) {
      console.log('載入用戶數據失敗:', error);
    }
  }

  // 儲存使用者資料
  saveUserData() {
    try {
      const username = getCurrentUser();
      if (username) {
        updateCurrentUserData((userData) => {
          userData.constellationStarDust = this.starDust;
          userData.completedLevels = this.completedLevels;
          userData.treasureBoxes = this.treasureBoxes;
          userData.constellationLevels = this.levels;
          userData.constellations = this.constellations;
        });
      }
    } catch (error) {
      console.log('儲存用戶數據失敗:', error);
    }
  }

  // 渲染關卡選擇
  renderLevels() {
    const grid = document.getElementById('levelGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    this.levels.forEach((level, index) => {
      const card = document.createElement('div');
      card.className = 'level-card';
      card.innerHTML = `
        <div class="level-status">${this.getLevelStatusIcon(level)}</div>
        <div class="level-icon">${level.icon}</div>
        <div class="level-title">${level.title}</div>
        <div class="level-description">${level.description}</div>
        <div class="level-progress">進度: ${level.currentProgress}/${this.questionsPerLevel}</div>
      `;

      if (level.unlocked) {
        card.classList.add('unlocked');
      }
      if (level.completed) {
        card.classList.add('completed');
      }
      if (level.unlocked && !level.completed && this.getCurrentUnlockedLevel() === level.id) {
        card.classList.add('current');
      }

      card.addEventListener('click', () => {
        this.playSound('click');
        this.selectLevel(level);
      });

      grid.appendChild(card);
    });
  }

  // 取得關卡狀態圖標
  getLevelStatusIcon(level) {
    if (level.completed) return '✅';
    if (level.unlocked) return '🔓';
    return '🔒';
  }

  // 取得當前可解鎖的關卡
  getCurrentUnlockedLevel() {
    const completedCount = this.levels.filter(level => level.completed).length;
    if (completedCount < this.levels.length) {
      return this.levels[completedCount].id;
    }
    return null;
  }

  // 選擇關卡
  selectLevel(level) {
    if (!level.unlocked) {
      alert('需要完成前面的關卡才能解鎖此關卡！');
      return;
    }

    this.currentLevel = level;
    this.currentQuestion = 0;
    
    const levelSelection = document.getElementById('levelSelection');
    const challengeSection = document.getElementById('challengeSection');
    const currentLevelTitle = document.getElementById('currentLevelTitle');
    
    if (levelSelection) levelSelection.style.display = 'none';
    if (challengeSection) challengeSection.style.display = 'block';
    if (currentLevelTitle) currentLevelTitle.textContent = level.title;
    
    this.loadNextQuestion();
  }

  // 返回關卡選擇
  backToLevels() {
    const levelSelection = document.getElementById('levelSelection');
    const challengeSection = document.getElementById('challengeSection');
    
    if (levelSelection) levelSelection.style.display = 'block';
    if (challengeSection) challengeSection.style.display = 'none';
    
    this.currentLevel = null;
    this.currentQuestion = 0;
  }

  // 渲染星座網格
  renderConstellations() {
    const grid = document.getElementById('constellationGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    this.constellations.forEach((constellation, index) => {
      const item = document.createElement('div');
      item.className = 'constellation-item';
      item.innerHTML = constellation.symbol;
      item.title = `${constellation.name} (${this.getDifficultyText(constellation.difficulty)})`;

      if (constellation.unlocked) {
        item.classList.add('unlocked');
      }
      if (constellation.completed) {
        item.classList.add('completed');
      }

      item.addEventListener('click', () => {
        this.playSound('click');
        this.showConstellationInfo(constellation);
      });
      grid.appendChild(item);
    });
  }

  // 取得難度文字
  getDifficultyText(difficulty) {
    const difficultyMap = {
      'common': '普通',
      'rare': '稀有',
      'epic': '超稀有'
    };
    return difficultyMap[difficulty] || difficulty;
  }

  // 顯示星座資訊
  showConstellationInfo(constellation) {
    const modal = document.getElementById('resultModal');
    const title = document.getElementById('modalTitle');
    const text = document.getElementById('modalText');

    if (modal && title && text) {
      title.textContent = constellation.name;
      text.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 15px;">${constellation.symbol}</div>
        <p><strong>難度：</strong>${this.getDifficultyText(constellation.difficulty)}</p>
        <p><strong>狀態：</strong>${constellation.unlocked ? (constellation.completed ? '已完成' : '已解鎖') : '未解鎖'}</p>
        ${constellation.completed ? '<p style="color: #00ff00;">🎉 恭喜完成此語法挑戰！</p>' : ''}
      `;

      modal.style.display = 'block';
    }
  }

  // 載入下一題
  loadNextQuestion() {
    if (!this.currentLevel || this.currentQuestion >= this.questionsPerLevel) {
      this.completeLevel();
      return;
    }

    this.currentQuestionData = this.currentLevel.questions[this.currentQuestion];

    const questionText = document.getElementById('questionText');
    const options = document.getElementById('options');

    if (questionText) questionText.textContent = this.currentQuestionData.question;
    if (options) {
      options.innerHTML = '';

      this.currentQuestionData.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = option;
        optionDiv.addEventListener('click', () => {
          this.playSound('click');
          this.selectAnswer(index);
        });
        options.appendChild(optionDiv);
      });
    }

    this.updateProgress();
  }

  // 選擇答案
  selectAnswer(selectedIndex) {
    const options = document.querySelectorAll('.option');
    const correct = this.currentQuestionData.correct;

    // 禁用所有選項
    options.forEach(option => {
      option.style.pointerEvents = 'none';
    });

    // 顯示正確和錯誤答案
    options.forEach((option, index) => {
      if (index === correct) {
        option.classList.add('correct');
      } else if (index === selectedIndex && index !== correct) {
        option.classList.add('wrong');
      }
    });

    // 檢查答案
    const isCorrect = selectedIndex === correct;
    
    // 播放音效
    if (isCorrect) {
      this.playSound('correct');
    } else {
      this.playSound('wrong');
    }
    
    setTimeout(() => {
      this.showResult(isCorrect);
    }, 1500);
  }

  // 顯示結果
  showResult(isCorrect) {
    const modal = document.getElementById('resultModal');
    const title = document.getElementById('modalTitle');
    const text = document.getElementById('modalText');

    if (!modal || !title || !text) return;

    if (isCorrect) {
      title.textContent = '🎉 答對了！';
      const reward = this.getReward();
      this.starDust += reward;
      
      this.currentLevel.currentProgress++;
      
      const constellation = this.constellations.find(c => c.id === this.currentLevel.id);
      if (constellation && !constellation.unlocked) {
        constellation.unlocked = true;
      }

      text.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 15px;">⭐</div>
        <p><strong>獲得 ${reward} 星塵！</strong></p>
        <p>${this.currentQuestionData.explanation}</p>
        <p>關卡進度: ${this.currentLevel.currentProgress}/${this.questionsPerLevel}</p>
      `;

      this.showRewardAnimation();
    } else {
      title.textContent = '❌ 答錯了';
      text.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 15px;">💡</div>
        <p><strong>正確答案：</strong>${this.currentQuestionData.options[this.currentQuestionData.correct]}</p>
        <p>${this.currentQuestionData.explanation}</p>
      `;
    }

    modal.style.display = 'block';
    this.currentQuestion++;
    this.updateDisplay();
    this.saveUserData();
  }

  // 完成關卡
  completeLevel() {
    if (this.currentLevel) {
      this.currentLevel.completed = true;
      this.completedLevels++;

      // 計算關卡結果資料
      const correctCount = this.currentLevel.currentProgress;
      const totalQuestions = this.questionsPerLevel;
      const accuracy = Math.round((correctCount / totalQuestions) * 100);
      const stars = this.calculateStars(accuracy);
      const passed = accuracy >= 60; // 60%以上算通關
      const timeUsedSeconds = this.levelStartTime ? Math.floor((Date.now() - this.levelStartTime) / 1000) : 0;

      // 保存關卡結算資料
      this.saveLevelPlayRecord({
        date: new Date().toISOString(),
        levelId: this.currentLevel.id,
        levelTitle: this.currentLevel.title,
        category: 'constellation',
        isZodiacLevel: true,
        correctCount: correctCount,
        totalQuestions: totalQuestions,
        accuracy: accuracy,
        stars: stars,
        passed: passed,
        timeUsedSeconds: timeUsedSeconds,
        remainingSeconds: 0,
        finishedReason: 'completed'
      });

      const nextLevelIndex = this.levels.findIndex(level => level.id === this.currentLevel.id) + 1;
      if (nextLevelIndex < this.levels.length) {
        this.levels[nextLevelIndex].unlocked = true;
      }

      const constellation = this.constellations.find(c => c.id === this.currentLevel.id);
      if (constellation) {
        constellation.completed = true;
      }

      this.playSound('complete');

      const modal = document.getElementById('resultModal');
      const title = document.getElementById('modalTitle');
      const text = document.getElementById('modalText');

      if (modal && title && text) {
        title.textContent = '🎉 關卡完成！';
        text.innerHTML = `
          <div style="font-size: 3rem; margin-bottom: 15px;">🏆</div>
          <p><strong>恭喜完成「${this.currentLevel.title}」關卡！</strong></p>
          <p>答對率：${accuracy}% | 星星：${stars}⭐</p>
          <p>獲得額外獎勵：20 星塵</p>
          ${nextLevelIndex < this.levels.length ? `<p style="color: #00ffff;">🌟 解鎖新關卡：${this.levels[nextLevelIndex].title}</p>` : ''}
        `;

        this.starDust += 20;
        modal.style.display = 'block';
      }

      this.updateDisplay();
      this.saveUserData();
      this.renderLevels();
    }
  }

  // 計算星星數
  calculateStars(accuracy) {
    if (accuracy >= 90) return 3;
    if (accuracy >= 70) return 2;
    if (accuracy >= 60) return 1;
    return 0;
  }

  // 保存關卡結算資料
  saveLevelPlayRecord(record) {
    const playRecords = JSON.parse(localStorage.getItem('levelPlayRecords') || '[]');
    playRecords.push(record);
    localStorage.setItem('levelPlayRecords', JSON.stringify(playRecords));
  }

  // 取得獎勵
  getReward() {
    const difficulty = this.currentLevel.difficulty;
    const rewardMap = {
      'common': 5,
      'rare': 10,
      'epic': 20
    };
    return rewardMap[difficulty] || 5;
  }

  // 顯示獎勵動畫
  showRewardAnimation() {
    const animation = document.createElement('div');
    animation.className = 'reward-animation';
    animation.textContent = '⭐';
    document.body.appendChild(animation);

    setTimeout(() => {
      if (document.body.contains(animation)) {
        document.body.removeChild(animation);
      }
    }, 1000);
  }

  // 更新進度
  updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill && progressText) {
      const progress = (this.currentQuestion / this.questionsPerLevel) * 100;
      progressFill.style.width = progress + '%';
      progressText.textContent = `${this.currentQuestion}/${this.questionsPerLevel}`;
    }
  }

  // 更新顯示
  updateDisplay() {
    const starDustElement = document.getElementById('starDust');
    const completedLevelsElement = document.getElementById('completedLevels');
    const treasureBoxesElement = document.getElementById('treasureBoxes');
    const treasureBox = document.getElementById('treasureBox');

    if (starDustElement) starDustElement.textContent = this.starDust;
    if (completedLevelsElement) completedLevelsElement.textContent = this.completedLevels;
    if (treasureBoxesElement) treasureBoxesElement.textContent = this.treasureBoxes;

    if (treasureBox) {
      if (this.starDust >= 50) {
        treasureBox.classList.remove('disabled');
      } else {
        treasureBox.classList.add('disabled');
      }
    }

    this.renderConstellations();
  }

  // 開啟寶箱
  openTreasureBox() {
    if (this.starDust < 50) {
      alert('需要 50 星塵才能開啟寶箱！');
      return;
    }

    this.playSound('shine');
    this.starDust -= 50;
    this.treasureBoxes++;

    const rewards = [
      { type: 'common', name: '一般現在式', description: '基礎語法規則', stars: 15 },
      { type: 'rare', name: '現在完成式', description: '進階時態用法', stars: 25 },
      { type: 'epic', name: '條件式', description: '高級語法結構', stars: 40 },
      { type: 'epic', name: '被動語態', description: '複雜句型轉換', stars: 40 }
    ];

    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
    
    try {
      updateCurrentUserData((userData) => {
        userData.totalStars = (parseInt(userData.totalStars) || 0) + randomReward.stars;
      });
    } catch (error) {
      console.log('更新星星數量失敗:', error);
    }

    const modal = document.getElementById('treasureModal');
    const text = document.getElementById('treasureText');
    
    if (modal && text) {
      text.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 15px;">🎁</div>
        <p><strong>獲得語法講解卡：${randomReward.name}</strong></p>
        <p>${randomReward.description}</p>
        <p style="color: #ffd700;">⭐ 額外獲得 ${randomReward.stars} 顆星星！</p>
      `;

      modal.style.display = 'block';
    }
    
    this.updateDisplay();
    this.saveUserData();
  }

  // 設置事件監聽器
  setupEventListeners() {
    const treasureBox = document.getElementById('treasureBox');
    if (treasureBox) {
      treasureBox.addEventListener('click', () => {
        this.openTreasureBox();
      });
    }

    // 添加音效開關按鈕
    this.addSoundToggleButton();
  }

  // 添加音效開關按鈕
  addSoundToggleButton() {
    const header = document.querySelector('.header');
    if (header) {
      const soundBtn = document.createElement('button');
      soundBtn.className = 'btn';
      soundBtn.style.marginTop = '10px';
      soundBtn.style.fontSize = '0.9rem';
      soundBtn.style.padding = '6px 12px';
      soundBtn.textContent = this.isSoundEnabled ? '🔊 音效開' : '🔇 音效關';
      
      soundBtn.addEventListener('click', () => {
        this.toggleSound();
        soundBtn.textContent = this.isSoundEnabled ? '🔊 音效開' : '🔇 音效關';
      });
      
      header.appendChild(soundBtn);
    }
  }
}

// 關閉模態框
function closeModal() {
  const modal = document.getElementById('resultModal');
  if (modal) {
    modal.style.display = 'none';
  }
  if (game && game.currentLevel) {
    game.loadNextQuestion();
  }
}

function closeTreasureModal() {
  const modal = document.getElementById('treasureModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// 返回關卡選擇
function backToLevels() {
  if (game) {
    game.backToLevels();
  }
}

// 初始化遊戲
let game;
document.addEventListener('DOMContentLoaded', () => {
  game = new ConstellationGrammarGame();
});

// 頁面卸載時停止所有音效
window.addEventListener('beforeunload', () => {
  if (game) {
    game.stopAllSounds();
  }
}); 