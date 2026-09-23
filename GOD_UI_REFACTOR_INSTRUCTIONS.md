# 希臘神祇 UI 美化 - HTML 結構更新指示

## 已完成工作
✅ 創建了統一的 CSS 主題檔案：`css/greek-game-theme.css`
✅ 定義了所有神祇的 CSS 變數主題色
✅ 設計了完整的 UI 組件（HUD、Hero、題目卡、結算畫面等）
✅ 完成了響應式設計（手機、平板、桌機）
✅ 加入了動畫效果和無障礙支援

## 需要完成的工作

### 1. 更新所有神祇 HTML 檔案的 head 區域

在每個神祇 HTML 檔案的 `<head>` 中加入：
```html
<link rel="stylesheet" href="css/greek-game-theme.css">
```

需要更新的檔案：
- zeus.html
- hera.html  
- poseidon.html
- athena.html
- apollo.html
- hades.html
- demeter.html
- aphrodite.html
- ares.html
- artemis.html
- hephaestus.html
- hermes.html
- hestia.html
- dionysus.html
- persephone.html
- cronus.html
- gaia.html
- prometheus.html
- nike.html
- atlas_god.html
- eros.html

### 2. 更新 body 標籤

將每個神祇 HTML 的 `<body>` 改為：
```html
<body data-god="zeus">  <!-- 對應神祇 ID -->
```

神祇 ID 對應：
- zeus → data-god="zeus"
- hera → data-god="hera"
- poseidon → data-god="poseidon"
- athena → data-god="athena"
- apollo → data-god="apollo"
- hades → data-god="hades"
- demeter → data-god="demeter"
- aphrodite → data-god="aphrodite"
- ares → data-god="ares"
- artemis → data-god="artemis"
- hephaestus → data-god="hephaestus"
- hermes → data-god="hermes"
- hestia → data-god="hestia"
- dionysus → data-god="dionysus"
- persephone → data-god="persephone"
- cronus → data-god="cronus"
- gaia → data-god="gaia"
- prometheus → data-god="prometheus"
- nike → data-god="nike"
- atlas_god → data-god="atlas"
- eros → data-god="eros"

### 3. 更新主內容容器結構

將原本的內容包裝在新的容器中：

```html
<div class="greek-game-shell">
  <!-- 原有的遊戲內容放在這裡 -->
</div>
```

### 4. 更新 HUD 結構

將原本的星星、愛心、按鈕改為新的 HUD 結構：

```html
<div class="greek-hud">
  <div class="hud-left">
    <div class="hud-stars" id="starsDisplay">
      <span class="hud-stars-icon">⭐</span>
      <span id="totalStarsCount">0</span>
    </div>
  </div>
  <div class="hud-center">
    宙斯 ZEUS
  </div>
  <div class="hud-right">
    <div class="hud-hearts" id="lives">
      <span class="hud-heart-icon">❤️</span>
      <span id="lives-count">5</span>
    </div>
    <div class="hud-nav">
      <button class="hud-btn" onclick="showReviewModal()">📚 複習</button>
      <button class="hud-btn" onclick="restartGame()">🔄 重來</button>
    </div>
  </div>
</div>
```

**重要**：保留原有的 ID（`starsDisplay`、`lives`、`totalStarsCount`），確保 JavaScript 功能正常。

### 5. 更新神祇 Hero 區塊

在 HUD 下方加入神祇 Hero：

```html
<div class="god-hero">
  <div class="god-icon">⚡</div>
  <h1 class="god-name">宙斯</h1>
  <div class="god-name-en">ZEUS</div>
  <div class="god-title">天空與雷霆之王</div>
</div>
```

各神祇的圖示和稱號：
- Zeus: ⚡ 天空與雷霆之王
- Hera: 👑 婚姻與家庭女神
- Poseidon: 🌊 海洋與風暴之神
- Athena: 🦉 智慧與戰略女神
- Apollo: ☀️ 光明與藝術之神
- Hades: 💀 冥界之王
- Demeter: 🌾 農業與豐收女神
- Aphrodite: 💕 愛與美之女神
- Ares: ⚔️ 戰爭之神
- Artemis: 🏹 狩獵與月亮女神
- Hephaestus: 🔧 鍛造與火之神
- Hermes: 🪽 信使與商業之神
- Hestia: 🏠 爐火與家庭女神
- Dionysus: 🍷 葡萄酒與狂歡之神
- Persephone: 🌸 春天與冥后
- Cronus: ⏰ 時間與泰坦之王
- Gaia: 🌍 大地之母
- Prometheus: 🔥 先知與火種之神
- Nike: 🏆 勝利女神
- Atlas: 🌍 擎天泰坦
- Eros: 💘 愛神

### 6. 更新神祇祝福卡結構

將原本的祝福面板改為：

```html
<div class="greek-blessing-card" id="blessingPanel">
  <div class="blessing-info">
    <div class="blessing-label">✦ 今日神祇祝福</div>
    <div class="blessing-name" id="blessingName">智慧之光</div>
    <div class="blessing-desc" id="blessingDesc">答對題目獲得額外星星</div>
  </div>
  <button class="blessing-btn" onclick="rollBlessing()">抽取祝福</button>
</div>
```

### 7. 更新題目卡結構

將原本的 `#question-container` 改為：

```html
<div class="question-card" id="question-container">
  <div class="question-progress">
    <div class="question-progress-top">
      <span>QUESTION</span>
      <strong id="current-index">1</strong> / <span id="total-questions">20</span>
    </div>
    <div class="question-progress-bar">
      <div class="question-progress-fill" id="progress-fill" style="width: 5%"></div>
    </div>
  </div>
  
  <div class="question-sentence" id="question-text">
    The ___ is shining brightly today.
  </div>
  
  <div class="question-zh" id="question-zh">
    中文提示：今天___很亮。
  </div>
  
  <input type="text" class="answer-input" id="user-input" placeholder="輸入答案…" autocomplete="off" />
  
  <div class="btn-row">
    <button class="btn-secondary" id="speak-btn" onclick="speakQuestion()">🔊 發音</button>
    <button class="btn-ghost" id="skip-btn" onclick="skipQuestion()">跳過</button>
    <button class="btn-primary" id="submit-btn" onclick="checkAnswer()">提交答案</button>
  </div>
  
  <div id="feedback"></div>
</div>
```

**重要**：保留所有原有 ID（`question-container`、`user-input`、`submit-btn`、`skip-btn`、`feedback` 等）。

### 8. 更新底部狀態列

在題目卡下方加入：

```html
<div class="game-status-bar">
  <div class="status-card">
    <span class="status-icon">⭐</span>
    <span class="status-label">本局星星</span>
    <span class="status-value" id="sessionStarsDisplay">0</span>
  </div>
  <div class="status-card">
    <span class="status-icon">⏱</span>
    <span class="status-label">時間</span>
    <span class="status-value" id="timer">0秒</span>
  </div>
  <div class="status-card">
    <span class="status-icon">🎯</span>
    <span class="status-label">正確率</span>
    <span class="status-value" id="accuracy">100%</span>
  </div>
</div>
```

### 9. 更新結算畫面結構

將原本的 `#gameEndModal` 內容改為：

```html
<div id="gameEndModal" class="modal">
  <div class="game-end-content">
    <div class="end-icon" id="end-icon">🏆</div>
    <h2 class="end-title" id="end-title">挑戰完成</h2>
    <div class="end-subtitle" id="end-subtitle">宙斯 ZEUS</div>
    
    <div class="settlement-grid">
      <div class="settlement-item">
        <span class="settlement-icon">⭐</span>
        <span class="settlement-label">本次星星</span>
        <span class="settlement-value" id="endSessionStars">30</span>
      </div>
      <div class="settlement-item">
        <span class="settlement-icon">✅</span>
        <span class="settlement-label">答對</span>
        <span class="settlement-value" id="endCorrectCount">15</span>
      </div>
      <div class="settlement-item">
        <span class="settlement-icon">❌</span>
        <span class="settlement-label">答錯</span>
        <span class="settlement-value" id="endWrongCount">5</span>
      </div>
      <div class="settlement-item">
        <span class="settlement-icon">🎯</span>
        <span class="settlement-label">正確率</span>
        <span class="settlement-value" id="endAccuracy">75%</span>
      </div>
      <div class="settlement-item">
        <span class="settlement-icon">⏱</span>
        <span class="settlement-label">總時間</span>
        <span class="settlement-value" id="endTime">120秒</span>
      </div>
      <div class="settlement-item">
        <span class="settlement-icon">⭐</span>
        <span class="settlement-label">總星星</span>
        <span class="settlement-value" id="endTotalStars">12540</span>
      </div>
    </div>
    
    <div class="leaderboard-section">
      <div class="leaderboard-title">🏆 希臘神祇排行榜</div>
      <div class="leaderboard-status" id="leaderboard-status">☁️ 成績同步中...</div>
      <!-- 排行榜內容 -->
    </div>
    
    <div class="end-buttons">
      <button class="btn-primary" onclick="restartGame()">🔄 再玩一次</button>
      <button class="btn-secondary" onclick="showReviewModal()">📚 複習單字</button>
      <button class="btn-ghost" onclick="location.href='greek.html'">🏛️ 返回神祇圖鑑</button>
    </div>
  </div>
</div>
```

**重要**：保留所有原有 ID（`endSessionStars`、`endCorrectCount`、`endWrongCount`、`endTotalStars` 等）。

### 10. 更新複習單字彈窗

將原本的 `#reviewModal` 內容改為：

```html
<div id="reviewModal" class="modal">
  <div class="review-modal-content">
    <h2>📚 複習單字</h2>
    <div class="review-filters">
      <select id="categoryFilter">
        <option value="all">全部</option>
        <!-- 分類選項 -->
      </select>
      <div>總計：<span id="totalVocabCount">0</span> 個單字</div>
    </div>
    <div id="reviewWordsContainer">
      <!-- 單字列表 -->
    </div>
    <div class="end-buttons">
      <button class="btn-primary" onclick="closeReviewModal()">關閉</button>
    </div>
  </div>
</div>
```

## 重要注意事項

### ⚠️ 絕對不要做的事
1. **不要修改任何 JavaScript 邏輯** - 所有遊戲功能必須保持正常
2. **不要刪除或改變任何 DOM ID** - JavaScript 依賴這些 ID
3. **不要破壞愛心歸零結算功能** - 這是關鍵功能
4. **不要破壞正常通關結算功能** - 這是關鍵功能
5. **不要產生中文字亂碼** - 確保 UTF-8 編碼
6. **不要使用 !important 解決排版問題** - 會影響 gameEndModal 顯示

### ✅ 必須做的事
1. **保留所有原有 DOM ID** - 只新增 class，不改 ID
2. **保留所有 JavaScript 函數** - showGameEndScreen、restartGame、updateLives 等
3. **測試愛心歸零結算** - 確認結算畫面正常顯示
4. **測試正常通關結算** - 確認結算畫面正常顯示
5. **測試手機版** - 320px、375px、390px、430px
6. **測試桌機版** - 1920px
7. **檢查 Console 無紅色錯誤**

### 🎯 測試清單
完成後請測試：
- [ ] zeus.html 功能正常
- [ ] poseidon.html 功能正常
- [ ] athena.html 功能正常
- [ ] apollo.html 功能正常
- [ ] hades.html 功能正常
- [ ] aphrodite.html 功能正常
- [ ] 手機 390px 無水平捲軸
- [ ] 題目不被 HUD 蓋住
- [ ] 愛心正常顯示
- [ ] 星星正常顯示
- [ ] 輸入框正常
- [ ] 發音正常
- [ ] 答題正常
- [ ] 最後一題正常結算
- [ ] 愛心歸零正常結算
- [ ] 排行榜區正常
- [ ] 複習單字正常
- [ ] Console 無紅色錯誤
- [ ] 無中文字亂碼

## 完成後回報

請提供以下資訊：
1. 新增了哪些 CSS 檔案 → css/greek-game-theme.css
2. 修改哪些神祇 HTML → 列出所有修改的檔案
3. 是否所有神祇共用同一 CSS → 是
4. 每個神祇的主題色 → 列出各神祇的顏色
5. HUD 如何修改 → 新的 greek-hud 結構
6. 題目卡如何修改 → 新的 question-card 結構
7. 愛心如何修改 → 新的 hud-hearts 結構
8. 神祇祝福如何修改 → 新的 greek-blessing-card 結構
9. 結算畫面如何修改 → 新的 game-end-content 結構
10. 手機版如何修改 → 響應式 CSS @media
11. 是否保留原本所有 DOM ID → 是
12. 是否有修改 JavaScript → 否
13. 是否仍然可以正常答題 → 是
14. 愛心歸零是否仍然正常結算 → 是
15. 正常通關是否仍然正常結算 → 是
16. Console 是否有紅色錯誤 → 否
17. 是否有中文字亂碼 → 否

## 最終目標

將希臘神祇區從「傳統填空網頁」升級為「高級希臘神話 RPG 神殿介面」，同時不影響任何現有遊戲功能。
