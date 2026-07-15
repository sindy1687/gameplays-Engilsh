// Script to add 50 missing words from 1000英檢單字.csv to basic_words.json
const fs = require('fs');

// Read files
const basicWords = JSON.parse(fs.readFileSync('./js/basic_words.json', 'utf8'));
const missingWords = JSON.parse(fs.readFileSync('./missing_1000words.json', 'utf8'));

// Select first 50 missing words
const wordsToAdd = missingWords.slice(0, 50);

// Convert to basic_words.json format
const newCategory = wordsToAdd.map(w => ({
  zh: w.chinese,
  en: w.english
}));

// Add to basic_words.json
basicWords.category1000 = newCategory;

// Write back
fs.writeFileSync('./js/basic_words.json', JSON.stringify(basicWords, null, 2), 'utf8');
console.log(`Added ${newCategory.length} words to basic_words.json in category1000`);
