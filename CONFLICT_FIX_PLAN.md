# 網站衝突檢查與修改方案
生成日期: 2026-06-22

## 第一步：發現的衝突

### 1. CSS 衝突

#### 1.1 通用 class 重複使用
**問題**: 以下 class 在多個頁面使用，可能造成樣式互相覆蓋
- `.active` - 使用於: achievement, atlas, cards, chat_room, gm.css, gacha, google_sheets_form, shop, stars_leaderboard, word_spin_game
- `.hidden` - 使用於: 多個 god 頁面, chat_room, achievement, index
- `.show` - 使用於: chat_room, gacha, leaderboard, autoSaveManager, spelling, achievement, index, cards
- `.modal` - 使用於: 多個頁面
- `.btn` - 使用於: 多個頁面

**影響**: 如果一個頁面引入了多個 CSS 檔案，這些通用 class 的樣式可能互相覆蓋

#### 1.2 Media Query 重疊
**問題**: 多個檔案定義了相同的 media query 斷點
- `@media (max-width: 768px)` - 出現在: responsive_enhanced.css, shop.html, 多個 god 頁面, gacha.html 等
- `@media (max-width: 480px)` - 出現在: responsive_enhanced.css, shop.html, 多個 god 頁面, gacha.html 等

**影響**: 響應式樣式可能互相覆蓋，導致手機版版面不一致

### 2. JS 衝突

#### 2.1 事件監聽器重複
**問題**: 多個頁面都有 `DOMContentLoaded` 和 `window.addEventListener('load')`
- `DOMContentLoaded` - 出現在: hera.html, poseidon.html, quiz.html, rhea.html, shop.html, stars_leaderboard.html, time_challenge.html 等
- `window.addEventListener('load')` - 出現在: quiz_game.html, ssr_challenge.html, test_card_recovery_fix.html, 多個 _backup_big5 檔案

**影響**: 理論上不會衝突（每個頁面獨立），但如果同一頁面有多個監聽器可能會重複執行

#### 2.2 函數作用域問題
**問題**: 以下函數只在 shop.html 定義，其他頁面無法使用
- `getPlayerData()`
- `setPlayerData()`
- `getGlobalStars()`
- `addGlobalStars()`
- `spendGlobalStars()`
- `ShopSystem` 物件

**影響**: 其他頁面需要類似功能時必須重新實現，造成程式碼重複

### 3. HTML 衝突

#### 3.1 ID 重複
**問題**: 以下 ID 在多個頁面使用
- `id="playerName"` - 使用於: index.html, google_sheets_form.html, index_enhanced_save_reminder.html
- `id="starsDisplay"` - 使用於: 多個 god 頁面, quiz 頁面, rhea.html 等
- `id="modal"` - 使用於: gacha.html, cards.html

**影響**: 
- 不同頁面使用相同 ID 是正常的（因為頁面獨立）
- 但如果同一頁面有重複 ID 會造成 DOM 查詢錯誤

#### 3.2 Script 引入順序
**問題**: 部分頁面可能 script 引入順序不當
- shop.html 正確順序: sound.js, userData.js, starRewardSystem.js, cardUtils.js, cards.js, googleSheetApi.js, achievementSystem.js
- 其他頁面需要檢查是否遵循「資料檔 → 共用工具 → 儲存功能 → 頁面功能 → init」的順序

### 4. 資料衝突

#### 4.1 星星資料多處存儲
**問題**: 星星資料存儲在多個地方
- `localStorage.getItem("stars")`
- `localStorage.getItem("totalStars")`
- `localStorage.getItem("playerStars")`
- `playerData.stars`
- `playerData.playerStars`

**影響**: 
- shop.html 的 `getGlobalStars()` 函數已經處理了這個問題（依序檢查多個來源）
- 但其他頁面可能只檢查其中一個，導致不同步

**狀態**: shop.html 已有相容處理，其他頁面需要檢查

#### 4.2 更名卡資料
**問題**: 更名卡資料格式
- shop.html 使用 `playerData.renameCards` (數字格式)
- 沒有使用 localStorage.getItem("renameCards")

**影響**: 
- shop.html 內部已統一
- 其他頁面如果需要更名卡功能，需要使用相同格式

**狀態**: shop.html 內部已統一，無衝突

#### 4.3 卡片倉庫資料
**問題**: 卡片倉庫資料
- 使用 `localStorage.getItem("ownedCards")`
- js/gm.js 和 js/userData.js 都有讀取

**影響**: 
- 格式一致（都是 JSON 物件）
- 需要確認寫入時也使用相同格式

**狀態**: 格式一致，無衝突

#### 4.4 Google Sheet API
**問題**: GoogleSheetTradeApi 使用
- shop.html, cards.html, admin.js, js/googleSheetApi.js 都使用
- js/googleSheetApi.js 定義 `window.GoogleSheetTradeApi`

**影響**: 
- 需要確保 googleSheetApi.js 在使用前載入
- 需要檢查是否有重複定義

**狀態**: 目前只在 js/googleSheetApi.js 定義一次，無衝突

---

## 第二步：修改方案

### 方案 1: CSS 衝突 - 通用 class 重複

**檔案名稱**: 多個 HTML 檔案
**發現問題**: `.active`, `.hidden`, `.show`, `.modal`, `.btn` 在多個頁面使用
**造成原因**: 這些是通用 class，不同頁面可能有不同的樣式需求
**建議修改**: 
- **不修改** - 這些是正常的通用 class
- 如果特定頁面需要特殊樣式，使用頁面前綴（如 `.shop-active`, `.gacha-modal`）
- 保持現有 class 不變，只在需要時新增專用 class

**是否會影響原本功能**: 否
**安全程度**: 高（不修改）
**是否建議立即修改**: 否（不需要修改）

---

### 方案 2: CSS 衝突 - Media Query 重疊

**檔案名稱**: responsive_enhanced.css, shop.html, 多個 god 頁面
**發現問題**: 多個檔案定義相同的 media query 斷點
**造成原因**: 每個頁面獨立定義響應式樣式
**建議修改**:
- **不修改** - 每個頁面的 media query 針對該頁面的元素
- responsive_enhanced.css 已標記為重複檔案，建議之後統一使用 responsive.css
- 保持現有結構，因為不同頁面需要不同的響應式處理

**是否會影響原本功能**: 否
**安全程度**: 高（不修改）
**是否建議立即修改**: 否（不需要修改）

---

### 方案 3: JS 衝突 - 函數作用域問題

**檔案名稱**: shop.html
**發現問題**: getPlayerData, setPlayerData, getGlobalStars 等函數只在 shop.html 定義
**造成原因**: 這些函數是 shop.html 專用的
**建議修改**:
- **暫不修改** - 目前這些函數只在 shop.html 使用
- 如果未來其他頁面需要，可以考慮移到 js/playerData.js
- 保持現有結構，避免不必要的重構

**是否會影響原本功能**: 否
**安全程度**: 高（不修改）
**是否建議立即修改**: 否（不需要修改）

---

### 方案 4: JS 衝突 - 事件監聽器重複

**檔案名稱**: 多個 HTML 檔案
**發現問題**: 多個頁面都有 DOMContentLoaded 和 window.addEventListener('load')
**造成原因**: 每個頁面需要獨立的初始化
**建議修改**:
- **不修改** - 每個頁面獨立，不會互相影響
- 如果發現同一頁面有重複監聽器，才需要修正

**是否會影響原本功能**: 否
**安全程度**: 高（不修改）
**是否建議立即修改**: 否（不需要修改）

---

### 方案 5: HTML 衝突 - ID 重複

**檔案名稱**: 多個 HTML 檔案
**發現問題**: playerName, starsDisplay, modal 在多個頁面使用
**造成原因**: 不同頁面使用相同 ID 是正常的（頁面獨立）
**建議修改**:
- **不修改** - 不同頁面使用相同 ID 是正常的
- 只需確認同一頁面內沒有重複 ID

**是否會影響原本功能**: 否
**安全程度**: 高（不修改）
**是否建議立即修改**: 否（不需要修改）

---

### 方案 6: 資料衝突 - 星星資料多處存儲

**檔案名稱**: shop.html
**發現問題**: 星星資料存儲在多個 localStorage key
**造成原因**: 歷史演進造成的多個 key
**建議修改**:
- **已標記** - shop.html 的 getGlobalStars() 已經標記 TODO
- **暫不修改** - 函數已經有相容處理，依序檢查多個來源
- 保持現有相容邏輯，確保不破壞舊資料

**是否會影響原本功能**: 否
**安全程度**: 高（保持相容）
**是否建議立即修改**: 否（已有相容處理）

---

### 方案 7: 資料衝突 - Google Sheet API 載入順序

**檔案名稱**: shop.html, cards.html
**發現問題**: 需要確保 googleSheetApi.js 在使用前載入
**造成原因**: script 引入順序可能不正確
**建議修改**:
- **檢查並修正** - 確保 googleSheetApi.js 在使用 GoogleSheetTradeApi 前載入
- shop.html: 3526 行引入 googleSheetApi.js，正確
- cards.html: 需要檢查

**是否會影響原本功能**: 可能（如果順序錯誤）
**安全程度**: 中（需要檢查）
**是否建議立即修改**: 是（需要檢查 cards.html）

---

## 第三步：實際修改

### 修改 1: 檢查 cards.html 的 script 引入順序

**檔案**: cards.html
**檢查**: 確保 googleSheetApi.js 在使用 GoogleSheetTradeApi 前載入

---

## 第四步：商城功能特別檢查

### 商城設定確認

**現有設定**:
- 商城分頁: 全部商品、優惠碼兌換 ✓
- 全部商品只顯示: 更名卡 ✓
- 優惠碼兌換分頁: 優惠碼輸入框、兌換按鈕、成功/失敗訊息 ✓
- 更名卡功能: 顯示圖片、價格 200 星星、顯示持有數量、可以購買、可以使用 ✓

**潛在問題檢查**:
1. 按一次購買扣兩次星星 - 需要檢查 buyShopItem 函數
2. 按一次增加兩張更名卡 - 需要檢查 giveRenameCard 函數
3. 優惠碼出現在全部商品頁 - 需要檢查 renderShopItems 函數
4. 優惠碼重複領取 - 需要檢查 redeemCoupon 函數
5. 更名卡數量不同步 - 需要檢查 localStorage 同步

**狀態**: 需要實際檢查程式碼

---

## 總結

### 發現的衝突
1. CSS 通用 class 重複使用 - 正常，不修改
2. CSS media query 重疊 - 正常，不修改
3. JS 函數作用域問題 - 正常，不修改
4. JS 事件監聽器重複 - 正常，不修改
5. HTML ID 重複 - 正常，不修改
6. 資料格式多處存儲 - 已有相容處理，不修改
7. Google Sheet API 載入順序 - 需要檢查

### 修改方式
- 大部分衝突是正常的（不同頁面獨立運作）
- 只有 Google Sheet API 載入順序需要檢查
- 所有修改都遵循「最少修改、不破壞原設定」原則

### 原本設定沒有動
- 所有 CSS class 保持不變
- 所有 JS 函數保持不變
- 所有 HTML ID 保持不變
- 所有 localStorage key 保持不變

### 功能保留
- 所有現有功能保留
- 所有資料格式保留
- 所有 Apps Script URL 保留

### 安全判斷
- 大部分地方不需要修改（正常情況）
- 只有載入順序需要檢查
- 所有建議都是保守的（不修改為主）

### 建議之後優化
1. 統一星星資料格式（移除多個 localStorage key）
2. 將 shop.html 的共用函數移到獨立 JS 檔案
3. 移除 responsive_enhanced.css（與 responsive.css 重複）
