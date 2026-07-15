// Script to add 50 missing words from 1000英檢單字.csv to vocabData.js
const fs = require('fs');

// Read files
const vocabDataContent = fs.readFileSync('./js/vocabData.js', 'utf8');
const missingWords = JSON.parse(fs.readFileSync('./missing_1000words.json', 'utf8'));

// Select first 50 missing words
const wordsToAdd = missingWords.slice(0, 50);

// Convert to vocabData format
const newWords = wordsToAdd.map(w => ({
  zh: w.chinese,
  en: w.english
}));

// Add to vocabData.js
const newCategoryCode = `  category1000: [\n${newWords.map(w => `    { zh: "${w.zh}", en: "${w.en}" }`).join(',\n')}\n  ]`;

// Find the position before the closing brace
const lastBraceIndex = vocabDataContent.lastIndexOf('};');
const updatedContent = vocabDataContent.slice(0, lastBraceIndex) + ',\n' + newCategoryCode + '\n};';

// Write back
fs.writeFileSync('./js/vocabData.js', updatedContent, 'utf8');
console.log(`Added ${newWords.length} words to vocabData.js in category1000`);
