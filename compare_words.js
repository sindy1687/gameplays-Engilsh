// Word comparison script - for 800單字.csv
const fs = require('fs');

// Normalization functions
function normalizeWord(word) {
  return String(word || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\u2019/g, "'") // U+2019 right single quotation mark (8217)
    .replace(/\u2018/g, "'") // U+2018 left single quotation mark
    .replace(/\u00B4/g, "'") // U+00B4 acute accent
    .replace(/'/g, "'"); // Fallback for other apostrophe types
}

// Read files with error handling
let basicWords, csvContent;

try {
  basicWords = JSON.parse(fs.readFileSync('./js/basic_words.json', 'utf8'));
} catch (e) {
  console.error('Error reading basic_words.json:', e.message);
  process.exit(1);
}

try {
  csvContent = fs.readFileSync('./單字下載區/800單字.csv', 'utf8');
} catch (e) {
  console.error('Error reading 800單字.csv:', e.message);
  process.exit(1);
}

// Parse CSV
const csvLines = csvContent.split('\n').filter(line => line.trim());
const csvWords = [];
csvLines.forEach((line, index) => {
  // Skip header line (word,zh,en_sentence,zh_sentence)
  if (index === 0) return;
  
  const parts = line.split(',');
  if (parts.length >= 2) {
    const english = parts[0].trim();
    const chinese = parts[1].trim();
    const enExample = parts[2] ? parts[2].trim() : '';
    const zhExample = parts[3] ? parts[3].trim() : '';
    // Skip if english is "word" (header line issue)
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

// Create normalized set
const basicWordsSet = new Set(basicWordsList.map(w => normalizeWord(w.english)));

// Compare
const missingFromBasic = [];
const duplicates = [];

csvWords.forEach(csvWord => {
  const normalized = normalizeWord(csvWord.english);
  
  const inBasic = basicWordsSet.has(normalized);
  
  if (!inBasic) {
    missingFromBasic.push(csvWord);
  }
  
  // Check for duplicates in CSV
  const count = csvWords.filter(w => normalizeWord(w.english) === normalized).length;
  if (count > 1) {
    duplicates.push({ word: csvWord.english, count });
  }
});

// Remove duplicate entries from missing list
const uniqueMissingFromBasic = [];
const seenBasic = new Set();
missingFromBasic.forEach(w => {
  const norm = normalizeWord(w.english);
  if (!seenBasic.has(norm)) {
    seenBasic.add(norm);
    uniqueMissingFromBasic.push(w);
  }
});

// Remove duplicate entries from duplicates list
const uniqueDuplicates = [];
const seenDup = new Set();
duplicates.forEach(d => {
  if (!seenDup.has(d.word)) {
    seenDup.add(d.word);
    uniqueDuplicates.push(d);
  }
});

// Generate report
console.log('=== 單字比對報告 (800單字.csv vs basic_words.json) ===\n');
console.log(`800單字.csv 總單字數: ${csvWords.length}`);
console.log(`basic_words.json 總單字數: ${basicWordsList.length}\n`);

console.log(`已存在於 basic_words.json: ${csvWords.length - uniqueMissingFromBasic.length}`);
console.log(`缺少於 basic_words.json: ${uniqueMissingFromBasic.length}\n`);

console.log(`CSV 中重複單字: ${uniqueDuplicates.length}`);
if (uniqueDuplicates.length > 0) {
  console.log('重複單字列表:');
  uniqueDuplicates.forEach(d => console.log(`  - ${d.word} (${d.count}次)`));
}

// Save missing words to file for review
fs.writeFileSync('./missing_words.json', JSON.stringify(uniqueMissingFromBasic, null, 2), 'utf8');
console.log(`缺少的單字已儲存至 missing_words.json (${uniqueMissingFromBasic.length} 個)`);

// Show first 20 missing words
if (uniqueMissingFromBasic.length > 0) {
  console.log('\n=== 前 20 個缺少於 basic_words.json 的單字 ===');
  uniqueMissingFromBasic.slice(0, 20).forEach(w => {
    console.log(`${w.english} | ${w.chinese}`);
  });
}
