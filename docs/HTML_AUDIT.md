# HTML 檔案審計報告

## 專案 HTML 總數
- **總計**: 52 個 HTML 檔案

## 關鍵發現

### 希臘神祇題庫來源分析
**目前狀態**: greek_common.html 仍然從舊神祇 HTML 頁面抓取題庫
- `fetchVocabFromPage(godConfig.page)` 會 fetch 舊神祇 HTML
- 例如: `zeus.html`, `hera.html`, `poseidon.html` 等
- 這些舊頁面仍然是資料來源 (SOURCE_ONLY)

**題庫統一狀態**: greekGodsData.js 已存在
- 包含所有神祇的題庫資料
- 提供 `getGreekGodQuestions(godName)` 函數
- 但 greek_common.html 尚未改用此來源

### 語法關卡分析
- 發現 22 個 grammar_levelX_1.html 檔案
- 需要檢查是否有統一的 grammar_level.html 共同頁

## 檔案分類

### A. KEEP (正式使用)
以下檔案確定為正式使用，必須保留：

1. **index.html** - 首頁
2. **atlas.html** - 圖鑑頁面
3. **greek_common.html** - 希臘神祇共同頁 (正式)
4. **achievement.html** - 成就系統
5. **shop.html** - 商店
6. **cards.html** - 卡片系統
7. **cardCollection.html** - 卡片收集
8. **gm.html** - GM 管理頁
9. **game_center_simple.html** - 遊戲中心
10. **book.html** - 書本系統
11. **book_edit.html** - 書本編輯
12. **word_spin_game.html** - 單字旋轉遊戲

### B. SOURCE_ONLY (資料來源)
以下檔案玩家不直接開啟，但被其他頁面 fetch/讀取：

**希臘神祇舊頁** (22 個):
1. zeus.html
2. hera.html
3. poseidon.html
4. demeter.html
5. athena.html
6. apollo.html
7. aphrodite.html
8. ares.html
9. artemis.html
10. hades.html
11. hephaestus.html
12. hermes.html
13. hestia.html
14. dionysus.html
15. eros.html
16. persephone.html
17. cronus.html
18. rhea.html
19. gaia.html
20. prometheus.html
21. nike.html
22. atlas_god.html

**原因**: greek_common.html 目前使用 `fetchVocabFromPage(godConfig.page)` 從這些頁面抓取題庫

**狀態**: 不能刪除，直到 greek_common.html 改用 greekGodsData.js

### C. DELETE_CANDIDATE (刪除候選)
以下檔案初步分析為可刪除，但需要進一步確認：

**測試/開發頁面**:
1. card_diagnostic.html - 卡片診斷工具
2. card_effect_demo.html - 卡片效果演示
3. debug_cards.html - 卡片除錯工具
4. test_score_upload.html - 分數上傳測試
5. final_test.html - 最終測試頁
6. chat_integration_example.html - 聊天整合範例
7. firebase_chat_enhanced.html - Firebase 聊天增強版

**重複/舊版頁面**:
1. NEWCARDS.HTML - 新卡片系統 (可能是舊版)
2. advanced-animal-card-game.html - 進階動物卡片遊戲
3. battle_system.html - 戰鬥系統測試
4. gacha.html - 抽卡系統測試
5. game_scenarios.html - 遊戲場景測試

**管理工具**:
1. admin.html - 管理員頁面
2. autoSaveManager.html - 自動存檔管理器
3. category_video_manager.html - 分類影片管理器
4. data-management.html - 資料管理
5. card_manager.html - 卡片管理器
6. card_manager_advanced.html - 進階卡片管理器
7. card_recovery.html - 卡片恢復

**其他功能頁**:
1. article_practice.html - 文章練習
2. calendar_checkin.html - 日曆簽到
3. constellation_grammar.html - 星座語法
4. customCategory.html - 自訂分類
5. dailyCheckCenter.html - 每日簽到中心
6. dictionary.html - 字典
7. feedback_cloud.html - 反饋雲
8. flipcard_practice.html - 翻轉卡片練習
9. google_sheets_form.html - Google 表單

### D. REVIEW (需要進一步確認)
以下檔案無法立即確定狀態：

**語法關卡舊頁** (22 個):
1. grammar_level1_1.html 到 grammar_level22_1.html
   - **狀態**: 仍被 grammar_tower_select.html 使用
   - **來源**: grammar_tower_select.html 有直接連結到這些頁面
   - **不能刪除**: 除非建立統一的 grammar_level.html 共同頁

**其他功能頁**:
1. grammar_tower_select.html - 語法塔關卡選擇 (正式入口頁)
2. constellation_grammar.html - 星座語法 (需要確認用途)
3. chat_room.html - 聊天室 (需要確認是否為正式功能)
4. announcements.html - 公告頁面 (需要確認是否為正式功能)

## 建議行動

### 第一階段：修改題庫來源 (優先)
1. 修改 greek_common.html 改用 greekGodsData.js
2. 測試所有神祇功能正常
3. 確認舊神祇 HTML 不再被 fetch
4. 將 22 個希臘神祇舊頁移到 SOURCE_ONLY → DELETE_CANDIDATE

### 第二階段：移動測試頁
1. 建立 tools/ 資料夾
2. 移動測試/開發頁面到 tools/
3. 移動管理工具到 tools/

### 第三階段：語法關卡統一 (需要開發)
1. 建立統一的 grammar_level.html 共同頁
2. 將 22 個 grammar_levelX_1.html 題庫移到 JSON
3. 修改 grammar_tower_select.html 連結到共同頁
4. 測試所有語法關卡功能

### 第四階段：刪除確認
1. 確認所有引用為 0
2. 建立備份 _archive_before_cleanup/
3. 進行完整測試
4. 永久刪除

## 風險評估

**高風險**: 
- 希臘神祇舊頁 (22 個) - 仍為資料來源，需要先改用 greekGodsData.js
- 語法關卡舊頁 (22 個) - 仍被 grammar_tower_select.html 直接連結

**中風險**:
- 管理工具 - 可能有特定用途，需要確認
- 測試頁面 - 可能仍被開發使用

**低風險**:
- 明顯的測試/演示頁面
- 重複的功能頁面

## 備份和測試計劃

### 備份策略
1. 建立 `_archive_before_cleanup/` 資料夾
2. 在刪除前先移動檔案到備份資料夾
3. 保留至少 7 天後再永久刪除
4. 使用 Git commit 記錄備份狀態

### 測試計劃
1. **核心功能測試**:
   - index.html 首頁正常
   - atlas.html 圖鑑正常
   - greek_common.html 所有神祇正常
   - game_center_simple.html 遊戲中心正常

2. **希臘神祇測試** (修改題庫來源後):
   - 測試至少 5 個神祇: zeus, hera, poseidon, athena, apollo
   - 確認題庫載入正常
   - 確認答題功能正常
   - 確認音效正常

3. **語法關卡測試** (統一後):
   - 測試至少 5 個關卡: level 1, 5, 10, 15, 22
   - 確認題庫載入正常
   - 確認答題功能正常

4. **連結檢查**:
   - 檢查所有 href 連結
   - 檢查所有 fetch 請求
   - 檢查所有 window.location 跳轉
   - 確認沒有 404 錯誤

5. **Console 檢查**:
   - 確認沒有紅色 Error
   - 確認沒有 Failed to fetch
   - 確認沒有 ReferenceError

## 統計摘要

- **HTML 總數**: 52 個
- **KEEP**: 12 個 (正式使用)
- **SOURCE_ONLY**: 22 個 (希臘神祇舊頁)
- **DELETE_CANDIDATE**: 26 個 (測試/開發頁)
- **REVIEW**: 25 個 (語法關卡 + 其他功能頁)

**注意**: 語法關卡舊頁從 DELETE_CANDIDATE 移到 REVIEW，因為發現仍被使用
