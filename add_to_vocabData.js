// Script to add missing words from 800單字.csv to vocabData.js
const fs = require('fs');

// Read files
const vocabDataContent = fs.readFileSync('./js/vocabData.js', 'utf8');
const missingWords = JSON.parse(fs.readFileSync('./missing_words.json', 'utf8'));

// Convert missing words to vocabData format
const newWords = missingWords.map(w => ({
  zh: w.chinese,
  en: w.english
}));

// Add to vocabData.js
const newCategoryCode = `  category800: [\n${newWords.map(w => `    { zh: "${w.zh}", en: "${w.en}" }`).join(',\n')}\n  ]`;

// Find the position before the closing brace
const lastBraceIndex = vocabDataContent.lastIndexOf('};');
const updatedContent = vocabDataContent.slice(0, lastBraceIndex) + ',\n' + newCategoryCode + '\n};';

// Write back
fs.writeFileSync('./js/vocabData.js', updatedContent, 'utf8');
console.log(`Added ${newWords.length} words to vocabData.js in category800`);
