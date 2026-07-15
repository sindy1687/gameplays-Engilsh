// Script to add 11 unique words from basic_words.json to 1000英檢單字.csv
const fs = require('fs');

// Read files
const content1000 = fs.readFileSync('./單字下載區/1000英檢單字.csv', 'utf8');
const uniqueWords = JSON.parse(fs.readFileSync('./unique_from_basic.json', 'utf8'));

// Add all 11 unique words
const wordsToAdd = uniqueWords;

// Convert to CSV format (basic_words.json doesn't have examples, so we'll add placeholders)
const csvLines = wordsToAdd.map(w => 
  `${w.english},${w.chinese},,`
);

// Add to 1000英檢單字.csv
const currentContent = content1000.trim();
const newContent = currentContent + '\n' + csvLines.join('\n') + '\n';

// Write back
fs.writeFileSync('./單字下載區/1000英檢單字.csv', newContent, 'utf8');
console.log(`Added ${wordsToAdd.length} words to 1000英檢單字.csv`);

// Verify
const updatedContent = fs.readFileSync('./單字下載區/1000英檢單字.csv', 'utf8');
const updatedLines = updatedContent.split('\n').filter(line => line.trim());
console.log(`Final word count: ${updatedLines.length - 1}`);
console.log(`Still need: ${1500 - (updatedLines.length - 1)} words`);
