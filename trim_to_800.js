// Script to trim 800單字.csv to exactly 800 words
const fs = require('fs');

// Read the file
const content = fs.readFileSync('./單字下載區/800單字.csv', 'utf8');

// Split by lines
const lines = content.split('\n').filter(line => line.trim());

console.log(`Current total lines: ${lines.length}`);
console.log(`Current word count: ${lines.length - 1}`);

// Keep header + first 800 words
const targetLines = 801; // header + 800 words
const trimmedLines = lines.slice(0, targetLines);

// Write back
const trimmedContent = trimmedLines.join('\n') + '\n';
fs.writeFileSync('./單字下載區/800單字.csv', trimmedContent, 'utf8');

console.log(`Trimmed to ${trimmedLines.length} lines`);
console.log(`Final word count: ${trimmedLines.length - 1}`);
