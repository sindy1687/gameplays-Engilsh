const fs = require('fs');

const data = fs.readFileSync('js/cards.js', 'utf8');
// 匹配所有 category 字段，包括兩種格式：category: "..." 和 "category": "..."
const matches1 = data.match(/category:\s*"([^"]+)"/g) || [];
const matches2 = data.match(/"category":\s*"([^"]+)"/g) || [];
const allMatches = [...matches1, ...matches2];
const counts = {};

allMatches.forEach(m => {
  const cat = m.match(/"([^"]+)"/)[1];
  counts[cat] = (counts[cat] || 0) + 1;
});

// 按數量排序
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
console.log(JSON.stringify(Object.fromEntries(sorted), null, 2));
console.log('\n總系列數:', Object.keys(counts).length);

// 根據數量計算獎勵
console.log('\n獎勵計算:');
Object.entries(counts).forEach(([cat, count]) => {
  let reward = 0;
  if (count >= 40) reward = 10000;
  else if (count >= 30) reward = 5000;
  else if (count >= 25) reward = 3000;
  else if (count >= 20) reward = 2000;
  else if (count >= 15) reward = 1500;
  else if (count >= 10) reward = 1000;
  else if (count >= 6) reward = 500;
  else reward = 300; // 默認獎勵
  
  console.log(`${cat}: ${count}張 -> ${reward}星星`);
});
