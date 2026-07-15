// Script to compare 800單字.csv against 1000英檢單字.csv to find unique words
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
let content800, content1000;

try {
  content800 = fs.readFileSync('./單字下載區/800單字.csv', 'utf8');
} catch (e) {
  console.error('Error reading 800單字.csv:', e.message);
  process.exit(1);
}

try {
  content1000 = fs.readFileSync('./單字下載區/1000英檢單字.csv', 'utf8');
} catch (e) {
  console.error('Error reading 1000英檢單字.csv:', e.message);
  process.exit(1);
}

// Parse 800單字.csv
const lines800 = content800.split('\n').filter(line => line.trim());
const words800 = [];
lines800.forEach((line, index) => {
  if (index === 0) return; // Skip header
  const parts = line.split(',');
  if (parts.length >= 2) {
    const english = parts[0].trim();
    const chinese = parts[1].trim();
    const enExample = parts[2] ? parts[2].trim() : '';
    const zhExample = parts[3] ? parts[3].trim() : '';
    if (english && chinese && english !== 'word') {
      words800.push({ english, chinese, enExample, zhExample });
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

// Find words in 800單字.csv that are not in 1000英檢單字.csv
const uniqueWords = [];
words800.forEach(w => {
  const normalized = normalizeWord(w.english);
  if (!words1000Set.has(normalized)) {
    uniqueWords.push(w);
  }
});

console.log('=== 單字比對報告 (800單字.csv vs 1000英檢單字.csv) ===\n');
console.log(`800單字.csv 總單字數: ${words800.length}`);
console.log(`1000英檢單字.csv 總單字數: ${words1000Set.size}\n`);

console.log(`800單字.csv 中有但 1000英檢單字.csv 中沒有的單字: ${uniqueWords.length}\n`);

// Save unique words to file
fs.writeFileSync('./unique_from_800.json', JSON.stringify(uniqueWords, null, 2), 'utf8');
console.log(`獨特單字已儲存至 unique_from_800.json (${uniqueWords.length} 個)`);

// Show first 50 unique words
if (uniqueWords.length > 0) {
  console.log('\n=== 前 50 個 800單字.csv 中獨特的單字 ===');
  uniqueWords.slice(0, 50).forEach(w => {
    console.log(`${w.english} | ${w.chinese}`);
  });
}
