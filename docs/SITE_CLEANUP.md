> 最新更新：依使用者要求，已移除全站導覽頁、共用導覽列、專用樣式及產生工具，目前剩餘 81 頁。下方保留歷史紀錄；最新檢查結果見 site-audit.json。

> 後續更新：已刪除 9 個未使用網頁，現有 82 頁。以下為先前整理紀錄；最新刪除清單見 [REMOVED_PAGES.md](REMOVED_PAGES.md)，目前檢查結果見 site-audit.json。

# 全站整理與驗證紀錄

本次涵蓋原有 90 個 HTML 頁面，新增全站導覽後共 91 頁。靜態檢查涵蓋 207 個 HTML、JavaScript 與 CSS 檔案。

## 已完成

- 建立 site-map.html：分類每一頁，管理、測試與舊版工具獨立收在可展開區域。各頁載入同一份導覽元件，提供首頁、全站導覽及適用的分類返回入口；導覽不修改玩家資料。
- 修正 login.html 的 stars 變數與 updateStars 函式衝突，以及 game_scenarios.html、social_share.html 與卡片資料的 allCards 宣告衝突。
- 修正不存在的文法入口、視覺效果入口與星座關卡網址；星座指向現有 quiz.html?category=關卡ID。
- 移除 announcements.html 對不存在的公告腳本引用，沿用既有雲端公告與本地備援。
- 補齊卡片影片管理功能，以 cardVideoOverrides 儲存本機設定；載入同一卡片資料的頁面會套用設定，保留原始卡片來源。
- 統一 StarSystem、LinkageSystem.stars、StarManager 的餘額來源與寫入流程；84 處直接 totalStars 寫入改用共用 API。playerStars 的既有相容鏡像仍保留，正式來源為 totalStars。
- 修正 StarSystem 對外 setTotalStars 沒有送出變更事件的問題；變更一次各發送一個舊／新介面事件，沒有變動則不重複發送。
- 防止非有限數字污染餘額、負數扣款、餘額不足扣款，並保留畫布、含圖示或按鈕的顯示容器。
- responsive.css 與 responsive_enhanced.css 並非完全相同。只抽出共同開頭至 css/responsive-base.css，兩個入口各自的其餘規則與順序保持不變。
- 修復 js/basic_words.js 的陣列結尾語法，保留題庫內容。
- 修正本機 server.js：首頁路由、帶查詢參數的關卡網址、HEAD 請求與錯誤回應，限制讀取於網站目錄。

## 已刪除／停用

- 刪除 js/characterDialogue_fixed.js、js/characterDialogue_temp.js：未被網頁引用，且為損壞的舊副本；正式 js/characterDialogue.js 保留。
- battle_system.html：原檔含大量不可還原的亂碼、字串結尾遺失與全域宣告衝突。原始內容已備份，網站中的同網址改為明確的停用說明與遊戲中心／轉珠入口。**這不是修復舊戰鬥功能**；沒有遷移或清除玩家存檔。

## 驗證結果

- 全部 91 個 HTML 路由實際透過本機 HTTP 請求：200 回應且內容與各自檔案一致。
- 全頁本機腳本、樣式與靜態頁面連結檢查：0 個檢出的失效引用。
- 各腳本語法、同頁合併後的全域宣告、JSON 資料區塊與重複腳本載入檢查：0 個檢出的錯誤。
- 共用星星系統先載入、全頁共用導覽及禁止繞過 API 直接寫入 totalStars 的檢查通過。
- 隔離的記憶體測試：三套星星 API 相容、字串加款、合法／非法扣款、非法餘額、事件數量、跨頁讀取與 storage 更新、關卡獎勵只補差額、練習模式不發獎、保留畫布與容器、損壞交易紀錄復原、重複載入防護、影片網址與覆寫儲存皆通過。
- 未向正式雲端 API 發送測試資料，未讀寫使用者瀏覽器的真實存檔。

## 驗證範圍與保留項目

靜態及隔離邏輯測試不能證明每一個遊戲流程都能完整通關。由於本機瀏覽器預覽被安全政策阻擋，本次沒有進行逐頁視覺驗證；登入、Google Sheets、排行榜、聊天與備份等外部服務也尚未端對端實測。

掃描列出 46 個未偵測到靜態引用的 JS／CSS 候選。命令列資料整理程式、雲端部署腳本、獨立題库與動態載入資源不能僅憑「沒有 HTML 引用」判定無用，因此保留，清單在 site-audit.json。沒有將它們冒充為已確認可刪除。

## 維護方式

- node scripts/build-site-map.cjs：依明確分類重建導覽；新增未分類頁面會報錯，避免遺漏。
- node scripts/audit-site.cjs --write：重新檢查並產出 docs/site-audit.json；錯誤時回傳非零狀態。
- node scripts/test-site.cjs：執行隔離邏輯與本機路由測試，不啟動瀏覽器或呼叫雲端。

## 回復備份

修改前的全部 HTML、JS、CSS 已複製至：

C:\Users\gaga2\AppData\Local\Temp\english-game-cleanup-1789836964802

包含已刪除的兩份副本與原始 battle_system.html。若需要回復，可取用對應檔案；備份位於系統暫存目錄，可能被系統清理。

## 每頁分類

| 網頁 | 用途分類 | 返回入口 |
| --- | --- | --- |
| NEWCARDS.HTML | 管理、測試與舊版工具 | site-map.html |
| achievement.html | 首頁與玩家服務 | index.html |
| admin.html | 管理、測試與舊版工具 | site-map.html |
| advanced-animal-card-game.html | 遊戲與卡牌冒險 | game_center_simple.html |
| announcements.html | 首頁與玩家服務 | index.html |
| aphrodite.html | 星座與神祇關卡 | atlas.html |
| apollo.html | 星座與神祇關卡 | atlas.html |
| ares.html | 星座與神祇關卡 | atlas.html |
| artemis.html | 星座與神祇關卡 | atlas.html |
| article_practice.html | 單字與閱讀學習 | dictionary.html |
| athena.html | 星座與神祇關卡 | atlas.html |
| atlas.html | 星座與神祇關卡 | atlas.html |
| atlas_god.html | 星座與神祇關卡 | atlas.html |
| autoSaveManager.html | 首頁與玩家服務 | index.html |
| battle_system.html | 管理、測試與舊版工具 | site-map.html |
| book.html | 單字與閱讀學習 | dictionary.html |
| book_edit.html | 單字與閱讀學習 | dictionary.html |
| calendar_checkin.html | 首頁與玩家服務 | index.html |
| cardCollection.html | 首頁與玩家服務 | index.html |
| card_diagnostic.html | 管理、測試與舊版工具 | site-map.html |
| card_effect_demo.html | 管理、測試與舊版工具 | site-map.html |
| card_manager.html | 管理、測試與舊版工具 | site-map.html |
| card_manager_advanced.html | 管理、測試與舊版工具 | site-map.html |
| card_recovery.html | 管理、測試與舊版工具 | site-map.html |
| cards.html | 首頁與玩家服務 | index.html |
| category_video_manager.html | 管理、測試與舊版工具 | site-map.html |
| chat_integration_example.html | 管理、測試與舊版工具 | site-map.html |
| chat_room.html | 首頁與玩家服務 | index.html |
| constellation_grammar.html | 星座與神祇關卡 | atlas.html |
| cronus.html | 星座與神祇關卡 | atlas.html |
| customCategory.html | 單字與閱讀學習 | dictionary.html |
| dailyCheckCenter.html | 首頁與玩家服務 | index.html |
| data-management.html | 首頁與玩家服務 | index.html |
| debug_cards.html | 管理、測試與舊版工具 | site-map.html |
| demeter.html | 星座與神祇關卡 | atlas.html |
| dictionary.html | 單字與閱讀學習 | dictionary.html |
| dionysus.html | 星座與神祇關卡 | atlas.html |
| eros.html | 星座與神祇關卡 | atlas.html |
| feedback_cloud.html | 首頁與玩家服務 | index.html |
| final_test.html | 管理、測試與舊版工具 | site-map.html |
| firebase_chat_enhanced.html | 首頁與玩家服務 | index.html |
| flipcard_practice.html | 單字與閱讀學習 | dictionary.html |
| gacha.html | 首頁與玩家服務 | index.html |
| gaia.html | 星座與神祇關卡 | atlas.html |
| game_center_simple.html | 遊戲與卡牌冒險 | game_center_simple.html |
| game_scenarios.html | 遊戲與卡牌冒險 | game_center_simple.html |
| gm.html | 管理、測試與舊版工具 | site-map.html |
| google_sheets_form.html | 管理、測試與舊版工具 | site-map.html |
| greek_common.html | 星座與神祇關卡 | atlas.html |
| greek_fill_blank.html | 星座與神祇關卡 | atlas.html |
| hades.html | 星座與神祇關卡 | atlas.html |
| hephaestus.html | 星座與神祇關卡 | atlas.html |
| hera.html | 星座與神祇關卡 | atlas.html |
| hermes.html | 星座與神祇關卡 | atlas.html |
| hestia.html | 星座與神祇關卡 | atlas.html |
| index.html | 首頁與玩家服務 | index.html |
| index_enhanced_save_reminder.html | 管理、測試與舊版工具 | site-map.html |
| inventory.html | 首頁與玩家服務 | index.html |
| leaderboard_simple_cloud.html | 首頁與玩家服務 | index.html |
| login.html | 首頁與玩家服務 | index.html |
| matching.html | 單字與閱讀學習 | dictionary.html |
| nike.html | 星座與神祇關卡 | atlas.html |
| orb_battle.html | 遊戲與卡牌冒險 | game_center_simple.html |
| orb_stage_select.html | 遊戲與卡牌冒險 | game_center_simple.html |
| orb_team_edit.html | 遊戲與卡牌冒險 | game_center_simple.html |
| performance_optimization.html | 管理、測試與舊版工具 | site-map.html |
| persephone.html | 星座與神祇關卡 | atlas.html |
| poseidon.html | 星座與神祇關卡 | atlas.html |
| prometheus.html | 星座與神祇關卡 | atlas.html |
| puzzle_battle.html | 遊戲與卡牌冒險 | game_center_simple.html |
| quiz.html | 星座與神祇關卡 | atlas.html |
| quiz_game.html | 單字與閱讀學習 | dictionary.html |
| responsive_test.html | 管理、測試與舊版工具 | site-map.html |
| review.html | 單字與閱讀學習 | dictionary.html |
| rhea.html | 星座與神祇關卡 | atlas.html |
| scratch_card.html | 遊戲與卡牌冒險 | game_center_simple.html |
| shop.html | 首頁與玩家服務 | index.html |
| social_share.html | 首頁與玩家服務 | index.html |
| spelling.html | 單字與閱讀學習 | dictionary.html |
| ssr_challenge.html | 遊戲與卡牌冒險 | game_center_simple.html |
| stars_leaderboard.html | 首頁與玩家服務 | index.html |
| test_card_recovery_fix.html | 管理、測試與舊版工具 | site-map.html |
| test_fruit_cards_simple.html | 管理、測試與舊版工具 | site-map.html |
| test_greek_gods_fix.html | 管理、測試與舊版工具 | site-map.html |
| time_challenge.html | 單字與閱讀學習 | dictionary.html |
| tower_defense.html | 遊戲與卡牌冒險 | game_center_simple.html |
| uno_game.html | 遊戲與卡牌冒險 | game_center_simple.html |
| vocabulary_download.html | 單字與閱讀學習 | dictionary.html |
| word_spin_game.html | 遊戲與卡牌冒險 | game_center_simple.html |
| zeus.html | 星座與神祇關卡 | atlas.html |
| site-map.html | 全站導覽 | index.html |

## 本次新增或修改的網頁資源

- achievement.html
- admin.html
- advanced-animal-card-game.html
- announcements.html
- aphrodite.html
- apollo.html
- ares.html
- artemis.html
- article_practice.html
- athena.html
- atlas.html
- atlas_god.html
- autoSaveManager.html
- battle_system.html
- book.html
- book_edit.html
- calendar_checkin.html
- cardCollection.html
- cards.html
- card_diagnostic.html
- card_effect_demo.html
- card_manager.html
- card_manager_advanced.html
- card_recovery.html
- category_video_manager.html
- chat_integration_example.html
- chat_room.html
- constellation_grammar.html
- cronus.html
- customCategory.html
- dailyCheckCenter.html
- data-management.html
- debug_cards.html
- demeter.html
- dictionary.html
- dionysus.html
- eros.html
- feedback_cloud.html
- final_test.html
- firebase_chat_enhanced.html
- flipcard_practice.html
- gacha.html
- gaia.html
- game_center_simple.html
- game_scenarios.html
- gm.html
- google_sheets_form.html
- greek_common.html
- greek_fill_blank.html
- hades.html
- hephaestus.html
- hera.html
- hermes.html
- hestia.html
- index.html
- index_enhanced_save_reminder.html
- inventory.html
- leaderboard_simple_cloud.html
- login.html
- main.js
- matching.html
- NEWCARDS.HTML
- nike.html
- orb_battle.html
- orb_stage_select.html
- orb_team_edit.html
- performance_optimization.html
- persephone.html
- poseidon.html
- prometheus.html
- puzzle_battle.html
- quiz.html
- quiz_game.html
- responsive.css
- responsive_enhanced.css
- responsive_test.html
- review.html
- rhea.html
- scratch_card.html
- server.js
- shop.html
- site-map.html
- social_share.html
- spelling.html
- ssr_challenge.html
- stars_leaderboard.html
- test_card_recovery_fix.html
- test_fruit_cards_simple.html
- test_greek_gods_fix.html
- time_challenge.html
- tower_defense.html
- uno_game.html
- vocabulary_download.html
- word_spin_game.html
- zeus.html
- js/achievementSystem.js
- js/atlasStageRegistry.js
- js/basic_words.js
- js/cardVideoManager.js
- js/gemSystem.js
- js/localCardTrade.js
- js/site-navigation.js
- js/starManager.js
- js/starRewardSystem.js
- js/stars.js
- js/userData.js
- js/word_spin_game.js
- css/responsive-base.css
- css/site-map.css
