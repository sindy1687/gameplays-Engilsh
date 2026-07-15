// Script to add missing words from 800單字.csv to basic_words.json
const fs = require('fs');

// Read files
const basicWords = JSON.parse(fs.readFileSync('./js/basic_words.json', 'utf8'));
const missingWords = JSON.parse(fs.readFileSync('./missing_words.json', 'utf8'));

// Add missing words to a new category
const newCategory = missingWords.map(w => ({
  zh: w.chinese,
  en: w.english
}));

// Add to basic_words.json
basicWords.category800 = newCategory;

// Write back
fs.writeFileSync('./js/basic_words.json', JSON.stringify(basicWords, null, 2), 'utf8');
console.log(`Added ${newCategory.length} words to basic_words.json in category800`);
