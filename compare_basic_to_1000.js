// Script to compare basic_words.json against 1000英檢單字.csv to find unique words
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

// Read files
let basicWords, content1000;

try {
  basicWords = JSON.parse(fs.readFileSync('./js/basic_words.json', 'utf8'));
} catch (e) {
  console.error('Error reading basic_words.json:', e.message);
  process.exit(1);
}

try {
  content1000 = fs.readFileSync('./單字下載區/1000英檢單字.csv', 'utf8');
} catch (e) {
  console.error('Error reading 1000英檢單字.csv:', e.message);
  process.exit(1);
}

// Extract all words from basic_words.json
const basicWordsList = [];
Object.keys(basicWords).forEach(category => {
  basicWords[category].forEach(item => {
    basicWordsList.push({ english: item.en, chinese: item.zh });
  });
});

// Parse 1000英檢單字.csv
const lines1000 = content1000.split('\n').filter(line => line.trim());
const words1000Set = new Set();
lines1000.forEach((line, index) => {
  const parts = line.split(',');
  if (parts.length >= 1) {
    const english = parts[0].trim();
    if (english && english !== 'word') {
      words1000Set.add(normalizeWord(english));
    }
  }
});

// Find words in basic_words.json that are not in 1000英檢單字.csv
const uniqueWords = [];
basicWordsList.forEach(w => {
  const normalized = normalizeWord(w.english);
  if (!words1000Set.has(normalized)) {
    uniqueWords.push(w);
  }
});

console.log('=== 單字比對報告 (basic_words.json vs 1000英檢單字.csv) ===\n');
console.log(`basic_words.json 總單字數: ${basicWordsList.length}`);
console.log(`1000英檢單字.csv 總單字數: ${words1000Set.size}\n`);

console.log(`basic_words.json 中有但 1000英檢單字.csv 中沒有的單字: ${uniqueWords.length}\n`);

// Save unique words to file
fs.writeFileSync('./unique_from_basic.json', JSON.stringify(uniqueWords, null, 2), 'utf8');
console.log(`獨特單字已儲存至 unique_from_basic.json (${uniqueWords.length} 個)`);

// Calculate how many words we need
const currentCount = words1000Set.size;
const targetCount = 1500;
const wordsNeeded = targetCount - currentCount;
console.log(`\n目前單字數: ${currentCount}`);
console.log(`目標單字數: ${targetCount}`);
console.log(`需要新增: ${wordsNeeded} 個單字`);
