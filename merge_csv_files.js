// Script to merge 400單.csv into 800單字.csv to reach 800 words
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

// Read both files
const content800 = fs.readFileSync('./單字下載區/800單字.csv', 'utf8');
const content400 = fs.readFileSync('./單字下載區/400單.csv', 'utf8');

// Parse 800單字.csv
const lines800 = content800.split('\n').filter(line => line.trim());
const words800 = new Set();
lines800.forEach((line, index) => {
  if (index === 0) return; // Skip header
  const parts = line.split(',');
  if (parts.length >= 1) {
    const english = parts[0].trim();
    if (english) {
      words800.add(normalizeWord(english));
    }
  }
});

// Parse 400單.csv and find missing words
const lines400 = content400.split('\n').filter(line => line.trim());
const missingWords = [];
lines400.forEach((line, index) => {
  if (index === 0) return; // Skip header
  const parts = line.split(',');
  if (parts.length >= 2) {
    const english = parts[0].trim();
    const normalized = normalizeWord(english);
    if (english && !words800.has(normalized)) {
      missingWords.push(line);
    }
  }
});

console.log(`800單字.csv has ${words800.size} words`);
console.log(`400單.csv has ${lines400.length - 1} words`);
console.log(`Missing words from 400單.csv: ${missingWords.length}`);
console.log(`Target: 800 words, Current: ${words800.size}, Need: ${800 - words800.size}`);

// Calculate how many words we need to add
const wordsNeeded = 800 - words800.size;
const wordsToAdd = missingWords.slice(0, wordsNeeded);

console.log(`Will add ${wordsToAdd.length} words from 400單.csv`);

// Add missing words to 800單字.csv
const currentContent = content800.trim();
const newContent = currentContent + '\n' + wordsToAdd.join('\n') + '\n';

// Write back
fs.writeFileSync('./單字下載區/800單字.csv', newContent, 'utf8');
console.log('Updated 800單字.csv');

// Verify
const updatedContent = fs.readFileSync('./單字下載區/800單字.csv', 'utf8');
const updatedLines = updatedContent.split('\n').filter(line => line.trim());
console.log(`Final word count: ${updatedLines.length - 1}`);
