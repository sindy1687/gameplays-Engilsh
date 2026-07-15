// Script to compare 1000英檢單字.csv against basic_words.json
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
let basicWords, csvContent;

try {
  basicWords = JSON.parse(fs.readFileSync('./js/basic_words.json', 'utf8'));
} catch (e) {
  console.error('Error reading basic_words.json:', e.message);
  process.exit(1);
}

try {
  csvContent = fs.readFileSync('./單字下載區/1000英檢單字.csv', 'utf8');
} catch (e) {
  console.error('Error reading 1000英檢單字.csv:', e.message);
  process.exit(1);
}

// Parse CSV
const csvLines = csvContent.split('\n').filter(line => line.trim());
const csvWords = [];
csvLines.forEach((line, index) => {
  const parts = line.split(',');
  if (parts.length >= 2) {
    const english = parts[0].trim();
    const chinese = parts[1].trim();
    const enExample = parts[2] ? parts[2].trim() : '';
    const zhExample = parts[3] ? parts[3].trim() : '';
    if (english && chinese && english !== 'word') {
      csvWords.push({ english, chinese, enExample, zhExample });
    }
  }
});

// Extract all words from basic_words.json
const basicWordsList = [];
Object.keys(basicWords).forEach(category => {
  basicWords[category].forEach(item => {
    basicWordsList.push({ english: item.en, chinese: item.zh });
  });
});

// Create normalized set for comparison
const basicWordsSet = new Set();
basicWordsList.forEach(w => {
  basicWordsSet.add(normalizeWord(w.english));
});

// Find missing words
const missingWords = [];
csvWords.forEach(w => {
  const normalized = normalizeWord(w.english);
  if (!basicWordsSet.has(normalized)) {
    missingWords.push(w);
  }
});

console.log('=== 單字比對報告 (1000英檢單字.csv vs basic_words.json) ===\n');
console.log(`1000英檢單字.csv 總單字數: ${csvWords.length}`);
console.log(`basic_words.json 總單字數: ${basicWordsList.length}\n`);

console.log(`已存在於 basic_words.json: ${csvWords.length - missingWords.length}`);
console.log(`缺少於 basic_words.json: ${missingWords.length}\n`);

// Save missing words to file
fs.writeFileSync('./missing_1000words.json', JSON.stringify(missingWords, null, 2), 'utf8');
console.log(`缺少的單字已儲存至 missing_1000words.json (${missingWords.length} 個)`);

// Show first 50 missing words
if (missingWords.length > 0) {
  console.log('\n=== 前 50 個缺少於 basic_words.json 的單字 ===');
  missingWords.slice(0, 50).forEach(w => {
    console.log(`${w.english} | ${w.chinese}`);
  });
}
