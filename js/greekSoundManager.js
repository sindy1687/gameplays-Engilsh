/**
 * 希臘神祇音效管理器
 * 統一管理所有希臘神祇頁面的音效
 */

// 防止重複宣告
if (typeof window.GreekSoundManager === 'undefined') {
window.GreekSoundManager = {
  settings: {
    sfxEnabled: true,
    bgmEnabled: true,
    speechEnabled: true,
    sfxVolume: 0.7,
    bgmVolume: 0.4
  },
  
  sounds: {},
  
  init() {
    this.loadSettings();
    this.loadSounds();
    this.applySettings();
    this.bindEvents();
  },
  
  loadSettings() {
    try {
      const raw = localStorage.getItem('greekSoundSettings');
      if (!raw) return;
      
      const saved = JSON.parse(raw);
      this.settings = {
        ...this.settings,
        ...saved
      };
    } catch (error) {
      console.warn('[Greek Sound] 設定讀取失敗', error);
    }
  },
  
  saveSettings() {
    try {
      localStorage.setItem('greekSoundSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('[Greek Sound] 設定儲存失敗', error);
    }
  },
  
  loadSounds() {
    // 使用相對路徑，如果檔案不存在會在播放時處理
    this.sounds = {
      click: new Audio('sound/click.mp3'),
      correct: new Audio('sound/correct.mp3'),
      wrong: new Audio('sound/wrong.mp3'),
      lifeLost: new Audio('sound/wrong.mp3'),
      gameOver: new Audio('sound/game-over-deep-male-voice-clip-352695.mp3'),
      hint: new Audio('sound/click.mp3'),
      star: new Audio('sound/correct.mp3'),
      complete: new Audio('sound/correct.mp3'),
      modalOpen: new Audio('sound/click.mp3'),
      modalClose: new Audio('sound/click.mp3')
    };
  },
  
  applySettings() {
    // 應用音效設定到 BGMController
    try {
      if (typeof window.BGMController !== 'undefined' && window.BGMController.setVolume) {
        const volume = Math.max(0, Math.min(1, this.settings.bgmVolume ?? 0.4));
        window.BGMController.setVolume(volume);
        
        if (this.settings.bgmEnabled && !window.BGMController.isPlaying) {
          window.BGMController.play();
        } else if (!this.settings.bgmEnabled && window.BGMController.isPlaying) {
          window.BGMController.pause();
        }
      } else {
        console.warn('[Greek Sound] BGMController.setVolume 不可用');
      }
    } catch (error) {
      console.warn('[Greek Sound] BGM 設定套用失敗:', error);
    }
    
    this.updateSoundHudIcon();
  },
  
  play(name) {
    try {
      if (!this.settings.sfxEnabled) return;
      
      const original = this.sounds[name];
      if (!original) {
        console.warn('[Greek Sound] 找不到音效:', name);
        return;
      }
      
      const audio = original.cloneNode();
      audio.volume = Math.max(0, Math.min(1, this.settings.sfxVolume));
      
      audio.play().catch(error => {
        console.warn('[Greek Sound] 播放失敗:', name, error);
      });
    } catch (error) {
      console.warn('[Greek Sound] 錯誤:', error);
    }
  },
  
  bindEvents() {
    // 音效設定 Modal 事件
    const soundSettingsBtn = document.getElementById('soundSettingsBtn');
    const soundSettingsModal = document.getElementById('soundSettingsModal');
    const closeSoundSettingsBtn = document.getElementById('closeSoundSettingsBtn');
    const testSoundBtn = document.getElementById('testSoundBtn');
    
    if (soundSettingsBtn && soundSettingsModal) {
      soundSettingsBtn.addEventListener('click', () => {
        this.openSettings();
      });
    }
    
    if (closeSoundSettingsBtn && soundSettingsModal) {
      closeSoundSettingsBtn.addEventListener('click', () => {
        this.closeSettings();
      });
    }
    
    if (testSoundBtn) {
      testSoundBtn.addEventListener('click', () => {
        this.play('correct');
      });
    }
    
    // SFX 開關
    const sfxEnabledToggle = document.getElementById('sfxEnabledToggle');
    if (sfxEnabledToggle) {
      sfxEnabledToggle.addEventListener('change', (e) => {
        this.settings.sfxEnabled = e.target.checked;
        this.saveSettings();
        this.updateSoundHudIcon();
      });
    }
    
    // BGM 開關
    const bgmEnabledToggle = document.getElementById('bgmEnabledToggle');
    if (bgmEnabledToggle) {
      bgmEnabledToggle.addEventListener('change', (e) => {
        this.settings.bgmEnabled = e.target.checked;
        this.saveSettings();
        this.applySettings();
      });
    }
    
    // 單字發音開關
    const speechEnabledToggle = document.getElementById('speechEnabledToggle');
    if (speechEnabledToggle) {
      speechEnabledToggle.addEventListener('change', (e) => {
        this.settings.speechEnabled = e.target.checked;
        this.saveSettings();
      });
    }
    
    // SFX 音量
    const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
    const sfxVolumeValue = document.getElementById('sfxVolumeValue');
    if (sfxVolumeSlider && sfxVolumeValue) {
      sfxVolumeSlider.addEventListener('input', (e) => {
        const value = Number(e.target.value) / 100;
        this.settings.sfxVolume = value;
        sfxVolumeValue.textContent = e.target.value + '%';
        this.saveSettings();
      });
    }
    
    // BGM 音量
    const bgmVolumeSlider = document.getElementById('bgmVolumeSlider');
    const bgmVolumeValue = document.getElementById('bgmVolumeValue');
    if (bgmVolumeSlider && bgmVolumeValue) {
      bgmVolumeSlider.addEventListener('input', (e) => {
        const value = Number(e.target.value) / 100;
        this.settings.bgmVolume = value;
        bgmVolumeValue.textContent = e.target.value + '%';
        this.saveSettings();
        this.applySettings();
      });
    }
  },
  
  openSettings() {
    const modal = document.getElementById('soundSettingsModal');
    if (!modal) return;
    
    // 初始化 UI 狀態
    const sfxEnabledToggle = document.getElementById('sfxEnabledToggle');
    const bgmEnabledToggle = document.getElementById('bgmEnabledToggle');
    const speechEnabledToggle = document.getElementById('speechEnabledToggle');
    const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
    const bgmVolumeSlider = document.getElementById('bgmVolumeSlider');
    const sfxVolumeValue = document.getElementById('sfxVolumeValue');
    const bgmVolumeValue = document.getElementById('bgmVolumeValue');
    
    if (sfxEnabledToggle) sfxEnabledToggle.checked = this.settings.sfxEnabled;
    if (bgmEnabledToggle) bgmEnabledToggle.checked = this.settings.bgmEnabled;
    if (speechEnabledToggle) speechEnabledToggle.checked = this.settings.speechEnabled;
    if (sfxVolumeSlider) sfxVolumeSlider.value = this.settings.sfxVolume * 100;
    if (bgmVolumeSlider) bgmVolumeSlider.value = this.settings.bgmVolume * 100;
    if (sfxVolumeValue) sfxVolumeValue.textContent = Math.round(this.settings.sfxVolume * 100) + '%';
    if (bgmVolumeValue) bgmVolumeValue.textContent = Math.round(this.settings.bgmVolume * 100) + '%';
    
    modal.style.display = 'flex';
    this.play('modalOpen');
  },
  
  closeSettings() {
    const modal = document.getElementById('soundSettingsModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    this.play('modalClose');
  },
  
  updateSoundHudIcon() {
    const btn = document.getElementById('soundSettingsBtn');
    if (!btn) return;
    
    btn.textContent = this.settings.sfxEnabled ? '🔊' : '🔇';
  },
  
  isSpeechEnabled() {
    return this.settings.speechEnabled;
  }
};

// 自動初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.GreekSoundManager.init();
  });
} else {
  window.GreekSoundManager.init();
}

} // 結束防重複宣告的 if 語句
