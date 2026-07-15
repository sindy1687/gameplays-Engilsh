// Script to compare provided word list against 多益單字.csv
const fs = require('fs');

// Normalization function
function normalizeWord(word) {
  return String(word || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u00B4/g, "'")
    .replace(/'/g, "'");
}

// Provided word list
const providedWords = [
  { english: "abandon", chinese: "放棄" },
  { english: "ability", chinese: "能力" },
  { english: "aboard", chinese: "在船上/飛機上" },
  { english: "abolish", chinese: "廢除" },
  { english: "absence", chinese: "缺席" },
  { english: "absent", chinese: "缺席的" },
  { english: "absolute", chinese: "絕對的" },
  { english: "absorb", chinese: "吸收" },
  { english: "abstract", chinese: "摘要、抽象的" },
  { english: "abundance", chinese: "豐富" },
  { english: "abundant", chinese: "豐富的" },
  { english: "abuse", chinese: "濫用" },
  { english: "academic", chinese: "學術的" },
  { english: "accelerate", chinese: "加速" },
  { english: "acceptance", chinese: "接受" },
  { english: "access", chinese: "進入、存取" },
  { english: "accessible", chinese: "可接近的" },
  { english: "accessory", chinese: "配件" },
  { english: "accident", chinese: "意外" },
  { english: "accommodate", chinese: "容納、適應" },
  { english: "accommodation", chinese: "住宿" },
  { english: "accompany", chinese: "陪同" },
  { english: "accomplish", chinese: "完成" },
  { english: "accomplishment", chinese: "成就" },
  { english: "account", chinese: "帳戶、說明" },
  { english: "accountant", chinese: "會計師" },
  { english: "accounting", chinese: "會計" },
  { english: "accuracy", chinese: "精確" },
  { english: "accurate", chinese: "正確的" },
  { english: "accuse", chinese: "指控" },
  { english: "achieve", chinese: "達成" },
  { english: "achievement", chinese: "成就" },
  { english: "acknowledge", chinese: "承認、致謝" },
  { english: "acquire", chinese: "獲得" },
  { english: "acquisition", chinese: "收購" },
  { english: "act", chinese: "行動、扮演" },
  { english: "action", chinese: "行動" },
  { english: "active", chinese: "活躍的" },
  { english: "activity", chinese: "活動" },
  { english: "actual", chinese: "實際的" },
  { english: "adapt", chinese: "適應" },
  { english: "adaptation", chinese: "適應、改編" },
  { english: "add", chinese: "增加" },
  { english: "addition", chinese: "增加、加法" },
  { english: "additional", chinese: "額外的" },
  { english: "address", chinese: "地址、演說" },
  { english: "adequate", chinese: "足夠的" },
  { english: "adjust", chinese: "調整" },
  { english: "administration", chinese: "管理、行政" },
  { english: "admire", chinese: "欣賞、敬佩" },
  { english: "admission", chinese: "入場、錄取" },
  { english: "admit", chinese: "承認、允許進入" },
  { english: "adopt", chinese: "採用、領養" },
  { english: "adult", chinese: "成年人" },
  { english: "advance", chinese: "前進、進步" },
  { english: "advanced", chinese: "先進的、高級的" },
  { english: "advantage", chinese: "優勢" },
  { english: "adventure", chinese: "冒險" },
  { english: "advertise", chinese: "登廣告" },
  { english: "advertisement", chinese: "廣告" },
  { english: "advertising", chinese: "廣告業" },
  { english: "advice", chinese: "建議" },
  { english: "advisable", chinese: "明智的" },
  { english: "advocate", chinese: "提倡者、擁護者" },
  { english: "affect", chinese: "影響" },
  { english: "affection", chinese: "喜愛、感情" },
  { english: "afford", chinese: "負擔得起" },
  { english: "affordable", chinese: "負擔得起的" },
  { english: "agency", chinese: "代理機構" },
  { english: "agenda", chinese: "議程" },
  { english: "aggressive", chinese: "積極的、侵略性的" },
  { english: "agreement", chinese: "協議" },
  { english: "agricultural", chinese: "農業的" },
  { english: "aid", chinese: "幫助、援助" },
  { english: "aim", chinese: "目標、瞄準" },
  { english: "aircraft", chinese: "飛機" },
  { english: "airline", chinese: "航空公司" },
  { english: "alarm", chinese: "警報、鬧鐘" },
  { english: "allocate", chinese: "分配" },
  { english: "allocation", chinese: "分配、配置" },
  { english: "allow", chinese: "允許" },
  { english: "allowance", chinese: "津貼" },
  { english: "alone", chinese: "單獨" },
  { english: "alongside", chinese: "在旁邊、一起" },
  { english: "alter", chinese: "改變" },
  { english: "alternative", chinese: "替代方案" },
  { english: "altogether", chinese: "完全、總共" },
  { english: "amazing", chinese: "驚人的" },
  { english: "ambition", chinese: "抱負、野心" },
  { english: "ambitious", chinese: "有野心的" },
  { english: "amend", chinese: "修改" },
  { english: "amendment", chinese: "修正案" },
  { english: "background", chinese: "背景" },
  { english: "backup", chinese: "備份、支援" },
  { english: "backward", chinese: "向後的、落後的" },
  { english: "balance", chinese: "平衡、餘額" },
  { english: "ban", chinese: "禁止" },
  { english: "bankrupt", chinese: "破產的" },
  { english: "bankruptcy", chinese: "破產" },
  { english: "banner", chinese: "橫幅、旗幟" }
];

// Read 多益單字.csv
let contentToeic;
try {
  contentToeic = fs.readFileSync('./單字下載區/多益單字.csv', 'utf8');
} catch (e) {
  console.error('Error reading 多益單字.csv:', e.message);
  process.exit(1);
}

// Parse 多益單字.csv
const linesToeic = contentToeic.split('\n').filter(line => line.trim());
const toeicWordsSet = new Set();
linesToeic.forEach((line, index) => {
  if (index === 0) return; // Skip header
  const parts = line.split(',');
  if (parts.length >= 1) {
    const english = parts[0].trim();
    if (english && english !== '單字') {
      toeicWordsSet.add(normalizeWord(english));
    }
  }
});

// Find words in provided list that are not in 多益單字.csv
const missingWords = [];
providedWords.forEach(w => {
  const normalized = normalizeWord(w.english);
  if (!toeicWordsSet.has(normalized)) {
    missingWords.push(w);
  }
});

console.log('=== 單字比對報告 (提供列表 vs 多益單字.csv) ===\n');
console.log(`提供列表總單字數: ${providedWords.length}`);
console.log(`多益單字.csv 總單字數: ${toeicWordsSet.size}\n`);

console.log(`提供列表中有但 多益單字.csv 中沒有的單字: ${missingWords.length}\n`);

// Save missing words to file
fs.writeFileSync('./missing_provided_words.json', JSON.stringify(missingWords, null, 2), 'utf8');
console.log(`缺少的單字已儲存至 missing_provided_words.json (${missingWords.length} 個)`);

if (missingWords.length > 0) {
  console.log('\n=== 缺少的單字列表 ===');
  missingWords.forEach(w => {
    console.log(`${w.english} | ${w.chinese}`);
  });
}
