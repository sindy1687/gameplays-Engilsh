/**
 * 統一的背景音樂控制模組
 * 用於所有需要背景音樂的頁面
 */

const BGMController = {
  audio: null,
  isPlaying: false,
  volume: 0.3,
  defaultSrc: 'sound/午後放鬆時光（純音樂）.mp3',
  
  init(src = null, buttonId = 'bgMusicControl') {
    // 創建或獲取音頻元素
    let audio = document.getElementById('backgroundMusic');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'backgroundMusic';
      audio.loop = true;
      document.body.appendChild(audio);
    }
    
    if (src) audio.src = src;
    else if (!audio.src) audio.src = this.defaultSrc;
    
    audio.volume = this.volume;
    this.audio = audio;
    
    // 初始化按鈕
    const btn = document.getElementById(buttonId);
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
      this.updateButton(btn);
    }
    
    // 從 localStorage 恢復狀態
    const savedState = Storage?.get('bgMusicState', 'paused') || 'paused';
    if (savedState === 'playing') {
      this.play();
    }
    
    // 頁面可見性變化時處理音樂
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isPlaying) {
        this.audio?.pause();
      } else if (!document.hidden && this.isPlaying && this.audio?.paused) {
        this.audio?.play().catch(() => {});
      }
    });
  },
  
  play() {
    if (!this.audio) return;
    this.audio.play().then(() => {
      this.isPlaying = true;
      if (Storage) Storage.set('bgMusicState', 'playing');
      this.updateAllButtons();
    }).catch(e => console.warn('播放背景音樂失敗:', e));
  },
  
  pause() {
    if (!this.audio) return;
    this.audio.pause();
    this.isPlaying = false;
    if (Storage) Storage.set('bgMusicState', 'paused');
    this.updateAllButtons();
  },
  
  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  },
  
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) this.audio.volume = this.volume;
    if (Storage) Storage.set('bgMusicVolume', this.volume);
  },
  
  updateButton(btn) {
    if (!btn) return;
    btn.textContent = this.isPlaying ? '🔊' : '🔇';
    btn.classList.toggle('paused', !this.isPlaying);
    if (this.isPlaying) {
      btn.classList.add('playing');
    } else {
      btn.classList.remove('playing');
    }
  },
  
  updateAllButtons() {
    document.querySelectorAll('#bgMusicControl, #toggleMusic, #muteToggle').forEach(btn => {
      this.updateButton(btn);
    });
  }
};

// 自動初始化（如果頁面已載入）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('bgMusicControl') || document.getElementById('toggleMusic')) {
      BGMController.init();
    }
  });
} else {
  if (document.getElementById('bgMusicControl') || document.getElementById('toggleMusic')) {
    BGMController.init();
  }
}

// 導出到全局
window.BGMController = BGMController;

