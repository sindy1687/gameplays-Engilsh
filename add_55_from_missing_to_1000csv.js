// Script to add 55 words from missing_1000words.json to 1000英檢單字.csv
const fs = require('fs');

// Read files
const content1000 = fs.readFileSync('./單字下載區/1000英檢單字.csv', 'utf8');
const missingWords = JSON.parse(fs.readFileSync('./missing_1000words.json', 'utf8'));

// Select first 55 words
const wordsToAdd = missingWords.slice(0, 55);

// Convert to CSV format
const csvLines = wordsToAdd.map(w => 
  `${w.english},${w.chinese},${w.enExample},${w.zhExample}`
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
