// js/apiConfig.js
// ===== 全站排行榜 / Google Apps Script API 統一設定 =====
// 這是全站唯一應該定義 Google Apps Script API URL 的地方。
// 其他檔案請一律讀取 window.GameAPIConfig，不要再各自宣告
// const GREEK_SCORE_API / SCORE_API 等重複變數。
//
// 使用 if 保護，避免此檔案被同一頁面重複載入時
// 造成 "Identifier ... has already been declared" 的 SyntaxError。
if (typeof window.GameAPIConfig === 'undefined') {

  window.GameAPIConfig = {
    // 希臘神祇關卡排行榜（目前正式使用中的 Google Apps Script URL，
    // 取自 js/greekScoreUpload.js 原本的宣告）
    // 若尚未有可用的部署網址，請保持空字串，系統會使用離線模式
    greekScoreApi: "",

    // 一般單字測驗排行榜 Google Apps Script Web App URL
    quizScoreApi: "https://script.google.com/macros/s/AKfycbyhcoJVk9MVFWqsyee2PeE-vCo3u2p6oyL8HUCaMk0ZeNL0Td9mOBZnMlHNb6mIO5eCHQ/exec"
  };

}
