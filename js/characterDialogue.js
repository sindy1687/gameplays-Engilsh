const CharacterDialogue = {
  // 角色對話數據
  dialogues: {
    warrior: {
      name: "戰士",
      avatar: "img/avatars/avatar_TL.png",
      greetings: [
        "歡迎回來，英雄！準備好迎接新的挑戰了嗎？",
        "戰士已經準備就緒，讓我們一起戰鬥吧！",
        "你好！今天也是充滿希望的一天。",
        "歡迎！戰士期待著你的表現。"
      ],
      encouragements: [
        "你可以做到的！堅持下去！",
        "別放棄，戰士相信你的實力！",
        "繼續努力，勝利就在眼前！"
      ],
      victories: [
        "太棒了！我們贏了！",
        "戰士為你的勝利感到驕傲！",
        "這場勝利屬於你！"
      ],
      defeats: [
        "別氣餒，下次一定會更好！",
        "失敗是成功之母，再試一次吧！",
        "戰士會一直支持你的！"
      ]
    },
    speedster: {
      name: "速度型",
      avatar: "img/avatars/avatar_TR.png",
      greetings: [
        "嗨！速度型角色準備好了！",
        "歡迎！讓我們以光速前進吧！",
        "你好！今天也要快樂地學習！"
      ],
      encouragements: [
        "加快速度，你可以的！",
        "保持節奏，你做得很好！",
        "速度就是力量，繼續前進！"
      ],
      victories: [
        "太快了！我們贏了！",
        "速度型為你的勝利喝彩！",
        "這就是速度的力量！"
      ],
      defeats: [
        "別擔心，下次會更快！",
        "調整節奏，重新出發！",
        "速度型會陪你一起進步！"
      ]
    },
    defender: {
      name: "防禦型",
      avatar: "img/avatars/avatar_BL.png",
      greetings: [
        "歡迎！防禦型角色準備好了！",
        "你好！讓我們堅守陣地吧！",
        "歡迎回來，防禦型等你很久了！"
      ],
      encouragements: [
        "堅守陣地，你可以的！",
        "防禦型相信你的實力！",
        "保持防禦，穩紮穩打！"
      ],
      victories: [
        "完美的防禦！我們贏了！",
        "防禦型為你的勝利感到驕傲！",
        "這就是防禦的力量！"
      ],
      defeats: [
        "別氣餒，下次防禦會更好！",
        "調整策略，重新出發！",
        "防禦型會一直支持你的！"
      ]
    },
    sharpshooter: {
      name: "神射手",
      avatar: "img/avatars/avatar_BR.png",
      greetings: [
        "歡迎！神射手準備好了！",
        "你好！讓我們精準射擊吧！",
        "歡迎回來，神射手等你很久了！"
      ],
      encouragements: [
        "精準瞄準，你可以的！",
        "神射手相信你的實力！",
        "保持專注，百發百中！"
      ],
      victories: [
        "精準射擊！我們贏了！",
        "神射手為你的勝利感到驕傲！",
        "這就是神射手的實力！"
      ],
      defeats: [
        "別氣餒，下次會更精準！",
        "調整瞄準，重新出發！",
        "神射手會一直支持你的！"
      ]
    }
  },

  // 當前角色
  currentCharacter: null,
  
  // 是否正在說話
  isCharacterSpeaking: false,
  pendingAudioQueue: [],

  // 初始化對話系統
  init() {
    this.loadCharacterSettings();
    this.showWelcomeDialogue();
  },

  // 載入角色設定
  loadCharacterSettings() {
    const savedVoiceSettings = localStorage.getItem('selectedVoiceSettings');
    if (savedVoiceSettings) {
      try {
        const voiceSettings = JSON.parse(savedVoiceSettings);
        this.currentCharacter = voiceSettings.characterType || 'warrior';
      } catch (e) {
        console.log('角色設定載入失敗:', e);
        this.currentCharacter = 'warrior';
      }
    } else {
      this.currentCharacter = 'warrior';
    }
  },

  // 顯示歡迎對話
  showWelcomeDialogue() {
    const character = this.dialogues[this.currentCharacter];
    if (!character) return;

    const greeting = character.greetings[Math.floor(Math.random() * character.greetings.length)];
    this.showDialogueBox(greeting, character.name, character.avatar, false);
  },

  // 暫停所有音頻
  pauseAllAudio() {
    const bgMusic = document.getElementById('backgroundMusic');
    if (bgMusic && !bgMusic.paused) {
      bgMusic.pause();
      this.pendingAudioQueue.push(() => {
        if (bgMusic) bgMusic.play();
      });
    }
    
    const audioElements = document.querySelectorAll('audio:not(#backgroundMusic)');
    audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        this.pendingAudioQueue.push(() => {
          audio.currentTime = 0;
          audio.play();
        });
      }
    });
    
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.pendingAudioQueue.push(() => {
        window.speechSynthesis.resume();
      });
    }
  },

  // 恢復所有音頻
  resumeAllAudio() {
    this.pendingAudioQueue.forEach(resumeFunction => {
      try {
        resumeFunction();
      } catch (e) {
        console.log('恢復音頻失敗:', e);
      }
    });
    this.pendingAudioQueue = [];
  },

  // 顯示對話框
  showDialogueBox(message, characterName, avatarPath, playVoice = false) {
    const existingDialogue = document.getElementById('character-dialogue-box');
    if (existingDialogue) {
      existingDialogue.remove();
    }

    const dialogueBox = document.createElement('div');
    dialogueBox.id = 'character-dialogue-box';
    
    const isMobile = window.innerWidth <= 768;
    
    const mobileStyles = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border: 3px solid #333;
      border-radius: 20px;
      padding: 20px;
      max-width: 85vw;
      width: auto;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      animation: bubbleAppear 0.5s ease-out;
      font-family: 'Comic Sans MS', 'Noto Sans TC', 'Microsoft JhengHei', Arial, sans-serif;
    `;
    
    const desktopStyles = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border: 3.5px solid #333;
      border-radius: 28px;
      padding: 36px;
      max-width: 450px;
      width: auto;
      z-index: 10000;
      box-shadow: 0 6px 32px rgba(0, 0, 0, 0.32);
      animation: bubbleAppear 0.5s ease-out;
      font-family: 'Comic Sans MS', 'Noto Sans TC', 'Microsoft JhengHei', Arial, sans-serif;
    `;
    
    dialogueBox.style.cssText = isMobile ? mobileStyles : desktopStyles;

    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
      font-size: ${isMobile ? '1rem' : '1.35rem'};
      color: #333;
      line-height: 1.7;
      text-align: center;
      font-weight: bold;
      word-wrap: break-word;
    `;
    messageElement.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes bubbleAppear {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes bubbleDisappear {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100px);
        }
      }
    `;
    document.head.appendChild(style);

    dialogueBox.appendChild(messageElement);
    document.body.appendChild(dialogueBox);

    setTimeout(() => {
      this.hideDialogueBox();
    }, 5000);
  },

  // 隱藏對話框
  hideDialogueBox() {
    const dialogueBox = document.getElementById('character-dialogue-box');
    if (dialogueBox) {
      dialogueBox.style.animation = 'bubbleDisappear 0.3s ease-out';
      setTimeout(() => {
        dialogueBox.remove();
      }, 300);
    }
  },

  // 播放角色語音
  playCharacterVoice(message) {
    this.resumeAllAudio();
  },

  // 顯示鼓勵對話
  showEncouragement() {
    const character = this.dialogues[this.currentCharacter];
    if (!character) return;

    const encouragements = character.encouragements;
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    
    this.showDialogueBox(randomEncouragement, character.name, character.avatar, false);
  },

  // 顯示勝利對話
  showVictoryDialogue() {
    const character = this.dialogues[this.currentCharacter];
    if (!character) return;

    const victories = character.victories;
    const randomVictory = victories[Math.floor(Math.random() * victories.length)];
    
    this.showDialogueBox(randomVictory, character.name, character.avatar, false);
  },

  // 顯示失敗對話
  showDefeatDialogue() {
    const character = this.dialogues[this.currentCharacter];
    if (!character) return;

    const defeats = character.defeats;
    const randomDefeat = defeats[Math.floor(Math.random() * defeats.length)];
    
    this.showDialogueBox(randomDefeat, character.name, character.avatar, false);
  },

  // 更新對話訊息
  updateDialogueMessage(message) {
    const dialogueBox = document.getElementById('character-dialogue-box');
    if (dialogueBox) {
      const messageElement = dialogueBox.querySelector('div');
      if (messageElement) {
        messageElement.textContent = message;
      }
    }
  }
};

// 頁面載入後初始化對話系統
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    CharacterDialogue.init();
  }, 1000);
});

// 導出到全局
window.CharacterDialogue = CharacterDialogue;
