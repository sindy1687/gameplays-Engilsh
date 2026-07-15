// Script to compare 400單.csv against 1000英檢單字.csv to find unique words
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
let content400, content1000;

try {
  content400 = fs.readFileSync('./單字下載區/400單.csv', 'utf8');
} catch (e) {
  console.error('Error reading 400單.csv:', e.message);
  process.exit(1);
}

try {
  content1000 = fs.readFileSync('./單字下載區/1000英檢單字.csv', 'utf8');
} catch (e) {
  console.error('Error reading 1000英檢單字.csv:', e.message);
  process.exit(1);
}

// Parse 400單.csv
const lines400 = content400.split('\n').filter(line => line.trim());
const words400 = [];
lines400.forEach((line, index) => {
  if (index === 0) return; // Skip header
  const parts = line.split(',');
  if (parts.length >= 2) {
    const english = parts[0].trim();
    const chinese = parts[1].trim();
    const enExample = parts[2] ? parts[2].trim() : '';
    const zhExample = parts[3] ? parts[3].trim() : '';
    if (english && chinese && english !== 'word') {
      words400.push({ english, chinese, enExample, zhExample });
    }
  }
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

// Find words in 400單.csv that are not in 1000英檢單字.csv
const uniqueWords = [];
words400.forEach(w => {
  const normalized = normalizeWord(w.english);
  if (!words1000Set.has(normalized)) {
    uniqueWords.push(w);
  }
});

console.log('=== 單字比對報告 (400單.csv vs 1000英檢單字.csv) ===\n');
console.log(`400單.csv 總單字數: ${words400.length}`);
console.log(`1000英檢單字.csv 總單字數: ${words1000Set.size}\n`);

console.log(`400單.csv 中有但 1000英檢單字.csv 中沒有的單字: ${uniqueWords.length}\n`);

// Save unique words to file
fs.writeFileSync('./unique_from_400.json', JSON.stringify(uniqueWords, null, 2), 'utf8');
console.log(`獨特單字已儲存至 unique_from_400.json (${uniqueWords.length} 個)`);

// Calculate how many words we need
const currentCount = words1000Set.size;
const targetCount = 1500;
const wordsNeeded = targetCount - currentCount;
console.log(`\n目前單字數: ${currentCount}`);
console.log(`目標單字數: ${targetCount}`);
console.log(`需要新增: ${wordsNeeded} 個單字`);
