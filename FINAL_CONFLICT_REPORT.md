# 網站衝突檢查最終報告
生成日期: 2026-06-22

## 執行摘要

本次檢查遵循「最少修改、最安全、不破壞原設定」原則，對整個網站進行了全面的衝突檢查。

**檢查範圍**:
- 58 個 HTML 檔案（排除 _backup_big5）
- 53 個 JavaScript 檔案（排除 _backup_big5）
- 7 個 CSS 檔案（排除 _backup_big5）
- 所有 localStorage 資料格式
- Google Sheet / Apps Script 連線程式
- 商城、GM、卡片倉庫、抽卡、聊天室功能

---

## 第一部分：發現的衝突

### 1. CSS 衝突

#### 1.1 通用 class 重複使用
**狀態**: ✅ 正常，不修改

**發現**:
- `.active` - 使用於 15+ 個頁面
- `.hidden` - 使用於 20+ 個頁面
- `.show` - 使用於 10+ 個頁面
- `.modal` - 使用於 30+ 個頁面
- `.btn` - 使用於 25+ 個頁面

**分析**: 這些是正常的通用 class，不同頁面可能有不同的樣式需求。由於每個頁面獨立運作，不會互相影響。

**結論**: 不需要修改

---

#### 1.2 Media Query 重疊
**狀態**: ✅ 正常，不修改

**發現**:
- `@media (max-width: 768px)` - 出現在 20+ 個檔案
- `@media (max-width: 480px)` - 出現在 15+ 個檔案

**分析**: 每個頁面需要針對自己的元素定義響應式樣式，重複定義是正常的。

**結論**: 不需要修改

---

#### 1.3 CSS 檔案重複
**狀態**: ⚠️ 已標記，建議之後處理

**發現**:
- `responsive_enhanced.css` 與 `responsive.css` 內容完全相同

**已採取措施**:
- 在 `responsive_enhanced.css` 開頭添加 TODO 註解
- 建議之後統一使用 `responsive.css`

**結論**: 暫不刪除，避免破壞引用此檔案的頁面

---

### 2. JS 衝突

#### 2.1 事件監聽器重複
**狀態**: ✅ 正常，不修改

**發現**:
- `DOMContentLoaded` - 出現在 15+ 個頁面
- `window.addEventListener('load')` - 出現在 20+ 個頁面

**分析**: 每個頁面需要獨立的初始化邏輯，不會互相影響。

**結論**: 不需要修改

---

#### 2.2 函數作用域問題
**狀態**: ✅ 正常，不修改

**發現**:
- `getPlayerData()` - 只在 shop.html 定義
- `setPlayerData()` - 只在 shop.html 定義
- `getGlobalStars()` - 只在 shop.html 定義
- `addGlobalStars()` - 只在 shop.html 定義
- `spendGlobalStars()` - 只在 shop.html 定義
- `ShopSystem` 物件 - 只在 shop.html 定義

**分析**: 這些函數是 shop.html 專用的，其他頁面不需要使用。

**結論**: 不需要修改

---

#### 2.3 Google Sheet API 載入順序
**狀態**: ✅ 已檢查，正確

**檢查結果**:
- shop.html: googleSheetApi.js 在第 3526 行引入，正確
- cards.html: googleSheetApi.js 在第 2096 行引入，正確
- admin.js: 依賴 googleSheetApi.js，正確

**結論**: 載入順序正確，不需要修改

---

### 3. HTML 衝突

#### 3.1 ID 重複
**狀態**: ✅ 正常，不修改

**發現**:
- `id="playerName"` - 使用於 index.html, google_sheets_form.html, index_enhanced_save_reminder.html
- `id="starsDisplay"` - 使用於 30+ 個頁面
- `id="modal"` - 使用於 gacha.html, cards.html

**分析**: 不同頁面使用相同 ID 是正常的（頁面獨立）。已確認同一頁面內沒有重複 ID。

**結論**: 不需要修改

---

#### 3.2 Script 引入順序
**狀態**: ✅ 已檢查，正確

**檢查結果**:
- shop.html: sound.js → userData.js → starRewardSystem.js → cardUtils.js → cards.js → googleSheetApi.js → achievementSystem.js
- cards.html: sound.js → userData.js → starRewardSystem.js → cardUtils.js → cards.js → custom_cards.js → googleSheetApi.js → achievementSystem.js

**結論**: 遵循「資料檔 → 共用工具 → 儲存功能 → 頁面功能 → init」順序，正確

---

### 4. 資料衝突

#### 4.1 星星資料多處存儲
**狀態**: ✅ 已有相容處理，不修改

**發現**:
- `localStorage.getItem("stars")`
- `localStorage.getItem("totalStars")`
- `localStorage.getItem("playerStars")`
- `playerData.stars`
- `playerData.playerStars`

**已採取措施**:
- shop.html 的 `getGlobalStars()` 函數已經處理了這個問題
- 函數依序檢查多個來源，確保相容性
- 在函數中添加 TODO 註解，建議之後統一格式

**結論**: 暫不修改，保持相容性

---

#### 4.2 更名卡資料
**狀態**: ✅ 已統一，不修改

**發現**:
- shop.html 使用 `playerData.renameCards` (數字格式)
- 沒有使用 localStorage.getItem("renameCards")

**分析**: shop.html 內部已統一使用 `playerData.renameCards`，無衝突。

**結論**: 不需要修改

---

#### 4.3 卡片倉庫資料
**狀態**: ✅ 格式一致，不修改

**發現**:
- 使用 `localStorage.getItem("ownedCards")`
- js/gm.js 和 js/userData.js 都有讀取
- 格式都是 JSON 物件

**結論**: 格式一致，不需要修改

---

#### 4.4 Google Sheet API
**狀態**: ✅ 無衝突，不修改

**發現**:
- shop.html, cards.html, admin.js, js/googleSheetApi.js 都使用
- js/googleSheetApi.js 定義 `window.GoogleSheetTradeApi`
- 只定義一次，無重複

**結論**: 不需要修改

---

### 5. 商城功能特別檢查

#### 5.1 商城分頁
**狀態**: ✅ 正確

**檢查結果**:
- 全部商品分頁 ✓
- 優惠碼兌換分頁 ✓

---

#### 5.2 商品顯示
**狀態**: ✅ 正確

**檢查結果**:
- 全部商品只顯示更名卡 ✓
- 優惠碼輸入框只在優惠碼分頁顯示 ✓

---

#### 5.3 更名卡功能
**狀態**: ✅ 正確

**檢查結果**:
- 顯示圖片 ✓
- 價格 200 星星 ✓
- 顯示持有數量 ✓
- 可以購買 ✓
- 可以使用 ✓
- 星星不足不能購買 ✓
- 使用後數量 -1 ✓
- 使用後可以修改玩家名稱 ✓

---

#### 5.4 購買邏輯
**狀態**: ✅ 正確

**檢查結果**:
- `buyShopItem()` 函數只調用一次 `spendGlobalStars()` ✓
- `giveRenameCard()` 函數只增加 1 張更名卡 ✓
- 沒有重複扣星星或重複新增物品的問題 ✓

---

#### 5.5 優惠碼功能
**狀態**: ✅ 正確

**檢查結果**:
- `redeemCoupon()` 函數檢查 `usedCoupons` 陣列 ✓
- 已使用的優惠碼會被記錄，無法重複領取 ✓
- 優惠碼不會出現在全部商品頁 ✓

---

## 第二部分：已採取的修改

### 修改 1: 註解缺失的 CSS 檔案引用

**檔案**: index.html, atlas.html, index_enhanced_save_reminder.html, grammar_level4_1.html

**修改內容**:
- 註解掉不存在的 `css/shared.css`
- 註解掉不存在的 `css/saveReminderAnimations.css`
- 註解掉不存在的 `css/grammar_level4_1.css`

**原因**: 這些 CSS 檔案不存在，會導致 404 錯誤

**影響**: 無（原本就沒有載入這些檔案）

---

### 修改 2: 標記重複的 CSS 檔案

**檔案**: responsive_enhanced.css

**修改內容**:
- 在檔案開頭添加 TODO 註解
- 說明此檔案與 responsive.css 重複
- 建議之後統一使用 responsive.css

**原因**: 避免維護兩個相同的檔案

**影響**: 無（只是添加註解）

---

### 修改 3: 標記資料格式不一致

**檔案**: shop.html

**修改內容**:
- 在 `getGlobalStars()` 函數添加 TODO 註解
- 說明星星資料存儲在多個地方
- 建議之後統一使用 `playerData.stars`

**原因**: 提醒開發者注意資料格式問題

**影響**: 無（只是添加註解）

---

## 第三部分：原本設定沒有動

### CSS 設定
- ✅ 所有 CSS class 保持不變
- ✅ 所有 media query 保持不變
- ✅ 所有樣式定義保持不變

### JS 設定
- ✅ 所有函數定義保持不變
- ✅ 所有事件監聽器保持不變
- ✅ 所有變數定義保持不變

### HTML 設定
- ✅ 所有 ID 保持不變
- ✅ 所有 class 保持不變
- ✅ 所有 script 引入順序保持不變

### 資料設定
- ✅ 所有 localStorage key 保持不變
- ✅ 所有資料格式保持不變
- ✅ 所有資料結構保持不變

### Apps Script 設定
- ✅ 所有 Google Sheet API URL 保持不變
- ✅ 所有 Apps Script 函數保持不變
- ✅ 所有同步邏輯保持不變

---

## 第四部分：功能保留

### 商城功能
- ✅ 商城分頁（全部商品、優惠碼兌換）
- ✅ 更名卡購買
- ✅ 更名卡使用
- ✅ 優惠碼兌換
- ✅ 星星顯示
- ✅ 商品顯示

### GM 功能
- ✅ GM 頁面
- ✅ GM 解鎖
- ✅ GM 遊戲

### 卡片倉庫功能
- ✅ 卡片顯示
- ✅ 卡片篩選
- ✅ 卡片交易

### 抽卡功能
- ✅ 抽卡系統
- ✅ 卡片稀有度
- ✅ 卡片動畫

### 聊天室功能
- ✅ 聊天介面
- ✅ 訊息發送
- ✅ 用戶列表

---

## 第五部分：安全判斷

### 添加的安全判斷
無（大部分地方不需要修改）

### 保留的相容邏輯
- ✅ `getGlobalStars()` 函數的多來源檢查
- ✅ `getPlayerData()` 函數的預設值處理
- ✅ `redeemCoupon()` 函數的重複領取檢查

### 未修改的原因
大部分衝突是正常的（不同頁面獨立運作），不需要修改。

---

## 第六部分：建議之後優化

### 優化 1: 統一星星資料格式
**建議**: 移除多個 localStorage key，統一使用 `playerData.stars`

**原因**: 
- 目前有 5 個不同的星星資料來源
- 容易造成混淆
- 維護困難

**時機**: 確認所有頁面都使用 `getGlobalStars()` 函數後

---

### 優化 2: 將 shop.html 的共用函數移到獨立 JS 檔案
**建議**: 將 `getPlayerData()`, `setPlayerData()`, `getGlobalStars()` 等函數移到 `js/playerData.js`

**原因**:
- 如果其他頁面需要這些函數，可以重複使用
- 避免程式碼重複
- 更容易維護

**時機**: 當其他頁面需要這些函數時

---

### 優化 3: 移除 responsive_enhanced.css
**建議**: 移除 `responsive_enhanced.css`，統一使用 `responsive.css`

**原因**:
- 兩個檔案內容完全相同
- 維護兩個檔案沒有意義

**時機**: 確認所有引用 `responsive_enhanced.css` 的頁面都改用 `responsive.css` 後

---

## 第七部分：總結

### 發現的衝突
1. CSS 通用 class 重複使用 - 正常，不修改
2. CSS media query 重疊 - 正常，不修改
3. CSS 檔案重複 - 已標記，建議之後處理
4. JS 事件監聽器重複 - 正常，不修改
5. JS 函數作用域問題 - 正常，不修改
6. Google Sheet API 載入順序 - 已檢查，正確
7. HTML ID 重複 - 正常，不修改
8. Script 引入順序 - 已檢查，正確
9. 資料格式多處存儲 - 已有相容處理，不修改
10. 更名卡資料 - 已統一，不修改
11. 卡片倉庫資料 - 格式一致，不修改
12. Google Sheet API - 無衝突，不修改

### 修改方式
- 註解缺失的 CSS 檔案引用（4 處）
- 標記重複的 CSS 檔案（1 處）
- 標記資料格式不一致（1 處）
- 所有修改都遵循「最少修改、不破壞原設定」原則

### 原本設定沒有動
- ✅ 所有 CSS class 保持不變
- ✅ 所有 JS 函數保持不變
- ✅ 所有 HTML ID 保持不變
- ✅ 所有 localStorage key 保持不變
- ✅ 所有 Apps Script URL 保持不變

### 功能保留
- ✅ 所有現有功能保留
- ✅ 所有資料格式保留
- ✅ 所有畫面風格保留

### 安全判斷
- 大部分地方不需要修改（正常情況）
- 只有載入順序需要檢查（已檢查，正確）
- 所有建議都是保守的（不修改為主）

### 建議之後優化
1. 統一星星資料格式
2. 將 shop.html 的共用函數移到獨立 JS 檔案
3. 移除 responsive_enhanced.css

---

## 結論

本次檢查發現大部分「衝突」都是正常的（不同頁面獨立運作），不需要修改。只有 3 處需要處理：

1. 註解缺失的 CSS 檔案引用（避免 404 錯誤）
2. 標記重複的 CSS 檔案（提醒開發者）
3. 標記資料格式不一致（提醒開發者）

所有修改都遵循「最少修改、最安全、不破壞原設定」原則，確保網站穩定運作。
