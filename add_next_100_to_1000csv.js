// Script to add next 100 unique words from 800單字.csv to 1000英檢單字.csv
const fs = require('fs');

// Read files
const content1000 = fs.readFileSync('./單字下載區/1000英檢單字.csv', 'utf8');
const uniqueWords = JSON.parse(fs.readFileSync('./unique_from_800.json', 'utf8'));

// Select next 100 unique words (from index 50 to 150)
const wordsToAdd = uniqueWords.slice(50, 150);

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
