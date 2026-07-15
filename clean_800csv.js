// Script to clean 800單字.csv and add synonym words
const fs = require('fs');

// Read the file
const content = fs.readFileSync('./單字下載區/800單字.csv', 'utf8');

// Split by lines
const lines = content.split('\n');

// Keep only the first 635 lines (before the corrupted line 636)
const cleanLines = lines.slice(0, 635);

// Add synonym words at the end
const synonymWords = [
  'a an,一個,I see a bird.,我看到一隻鳥。',
  'is,是,She is a teacher.,她是老師。',
  'are,是,They are students.,他們是學生。',
  'does,做,He does his homework.,他做他的功課。',
  'fall,秋天,Leaves fall in autumn.,秋天樹葉會落下。',
  'by,根據,He goes to school by bus.,他搭公車去學校。',
  'to,向；往,Give it to me.,把它給我。',
  'grapes,葡萄,I like grapes.,我喜歡葡萄。',
  'eyes,眼睛,She has big eyes.,她有大眼睛。',
  'ears,耳朵,Rabbits have long ears.,兔子有長耳朵。',
  'teeth,牙齒,Brush your teeth.,刷牙。',
  'lips,嘴唇,Her lips are red.,她的嘴唇是紅色的。',
  'phone,電話,Answer the phone.,接電話。',
  'store,店舖,Go to the store.,去店舖。',
  'beautiful,漂亮的,The flower is beautiful.,這朵花很漂亮。'
];

// Combine clean lines with new words
const finalContent = cleanLines.join('\n') + '\n' + synonymWords.join('\n') + '\n';

// Write back
fs.writeFileSync('./單字下載區/800單字.csv', finalContent, 'utf8');
console.log('Cleaned 800單字.csv and added 15 synonym words');
