# 網站 BUG 檢查報告
生成日期: 2026-06-22

## 檢查範圍
- HTML 檔案: 58 個 (排除 _backup_big5)
- JavaScript 檔案: 53 個 (排除 _backup_big5)
- CSS 檔案: 7 個 (排除 _backup_big5)

## 已修復問題

### 1. 缺失的 CSS 檔案引用
**問題**: 多個 HTML 檔案引用了不存在的 CSS 檔案
- `css/shared.css` - 不存在
- `css/saveReminderAnimations.css` - 不存在
- `css/grammar_level4_1.css` - 不存在

**修復**: 在以下檔案中註解掉缺失的 CSS 引用
- `index.html` - 註解掉 css/shared.css
- `atlas.html` - 註解掉 css/shared.css
- `index_enhanced_save_reminder.html` - 註解掉 css/saveReminderAnimations.css
- `grammar_level4_1.html` - 註解掉 css/grammar_level4_1.css

### 2. 重複的 CSS 檔案
**問題**: `responsive_enhanced.css` 與 `responsive.css` 內容完全相同

**修復**: 在 `responsive_enhanced.css` 開頭添加 TODO 註解，建議考慮移除此檔案並統一使用 `responsive.css`

### 3. 資料格式不一致
**問題**: 星星資料存儲在多個地方
- `localStorage.getItem("stars")`
- `localStorage.getItem("totalStars")`
- `localStorage.getItem("playerStars")`
- `playerData.stars`
- `playerData.playerStars`

**修復**: 在 `shop.html` 的 `getGlobalStars()` 函數添加 TODO 註解，建議統一使用 `playerData.stars`

## 發現但未修復的問題 (需要進一步確認)

### 1. 重命名卡資料格式
**狀態**: 已在 shop.html 中統一使用 `playerData.renameCards` (數字格式)
**影響**: 其他檔案可能仍使用舊格式，需要檢查

### 2. JavaScript 函數作用域
**發現**: 
- `getPlayerData()` 只在 `shop.html` 中定義
- `getGlobalStars()` 只在 `shop.html` 中定義
- `addGlobalStars()` 只在 `shop.html` 中定義
- `spendGlobalStars()` 只在 `shop.html` 中定義

**建議**: 考慮將這些常用函數移到獨立的 JS 檔案 (如 `js/playerData.js`) 以便多個頁面共用

### 3. 卡片資料來源
**發現**: 
- `window.allCards` - 主要卡片陣列
- `window.baseCards` - 基礎卡片陣列
- 部分檔案同時檢查兩個來源

**建議**: 統一使用一個卡片資料來源

## 檔案結構建議

### 建議新增的檔案
1. `js/playerData.js` - 統一的玩家資料管理函數
2. `css/shared.css` - 共用樣式 (如果需要)

### 建議移除的檔案
1. `responsive_enhanced.css` - 與 responsive.css 重複

## 總結
- **已修復**: 3 個問題
- **已標記**: 2 個需要進一步處理的問題
- **建議**: 3 個結構優化建議

所有修復都遵循原則：
- 不刪除正常功能
- 不整個重寫
- 不改變原本資料格式
- 只修復錯誤、衝突、重複、無效、舊版沒用到的程式碼
- 不確定的程式碼先註解並標示原因
