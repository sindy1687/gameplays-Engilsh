const fs = require('fs');
const path = require('path');

const outputPath = path.join('單字下載區', '800單字.csv');

function normalizeWord(word) {
  return String(word || '').trim().toLowerCase();
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : `"${text}"`;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(field.trim());
      if (row.some(cell => cell.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some(cell => cell.trim())) rows.push(row);
  return rows;
}

const sourceByWord = new Map();
const orderedWords = [];

function addEntry(entry, keepOrder = false) {
  const word = String(entry.word || entry.en || '').trim();
  if (!word) return;
  const key = normalizeWord(word);
  const normalized = {
    word,
    zh: String(entry.zh || entry.meaning || '待補充').trim() || '待補充',
    en_sentence: String(entry.en_sentence || entry.example || `I learned the word ${word} today.`).trim(),
    zh_sentence: String(entry.zh_sentence || entry.exampleMeaning || `我今天學了 ${word} 這個單字。`).trim()
  };

  if (!sourceByWord.has(key) || sourceByWord.get(key).zh === '待補充') {
    sourceByWord.set(key, normalized);
  }
  if (keepOrder && !orderedWords.includes(key)) orderedWords.push(key);
}

function readObjectEntries(file, keepOrder = false) {
  const text = fs.readFileSync(file, 'utf8');
  const re = /\{\s*"(?<wordKey>word|en)"\s*:\s*"(?<word>[^"]+)"\s*,\s*"zh"\s*:\s*"(?<zh>[^"]*)"\s*,\s*"en_sentence"\s*:\s*"(?<en_sentence>[^"]*)"\s*,\s*"zh_sentence"\s*:\s*"(?<zh_sentence>[^"]*)"\s*\}/g;
  for (const match of text.matchAll(re)) {
    addEntry(match.groups, keepOrder);
  }
}

function readCSVEntries(file) {
  const rows = parseCSV(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  const dataRows = rows[0] && normalizeWord(rows[0][0]) === 'word' ? rows.slice(1) : rows;
  for (const row of dataRows) {
    addEntry({
      word: row[0],
      zh: row[1],
      en_sentence: row[2],
      zh_sentence: row[3]
    });
  }
}

readObjectEntries('wordList.json', true);
readObjectEntries(path.join('單字下載區', '800.txt'), true);

for (const file of [
  path.join('單字下載區', '800單字.csv'),
  path.join('單字下載區', '1000英檢單字.csv'),
  path.join('單字下載區', '400單.csv'),
  path.join('單字下載區', '基礎生活單字.csv'),
  path.join('單字下載區', '職業與科技單字.csv')
]) {
  if (fs.existsSync(file)) readCSVEntries(file);
}

for (const file of ['js/greekGodsData.js', 'vocab-bank.js', 'js/sentences.js']) {
  if (fs.existsSync(file)) readObjectEntries(file);
}

[
  ['count', '數；計算', 'Please count the books on the desk.', '請數一數桌上的書。'],
  ['seldom', '很少；不常', 'He seldom eats candy at night.', '他晚上很少吃糖果。'],
  ['was', '是；在（am/is 的過去式）', 'She was happy yesterday.', '她昨天很開心。'],
  ['were', '是；在（are 的過去式）', 'They were at school this morning.', '他們今天早上在學校。'],
  ['insect', '昆蟲', 'A butterfly is a beautiful insect.', '蝴蝶是一種美麗的昆蟲。'],
  ['bat', '蝙蝠；球棒', 'A bat flies at night.', '蝙蝠在夜晚飛行。'],
  ['butterfly', '蝴蝶', 'A butterfly landed on the flower.', '一隻蝴蝶停在花上。'],
  ['spider', '蜘蛛', 'A spider made a web in the corner.', '蜘蛛在角落結了一張網。'],
  ['whale', '鯨魚', 'The whale swims in the ocean.', '鯨魚在海裡游泳。'],
  ['junior high school', '國中', 'He studies at a junior high school.', '他在國中讀書。'],
  ['science', '科學', 'Science class is interesting.', '科學課很有趣。'],
  ['save', '拯救；儲存', 'Please save your work before you leave.', '離開前請儲存你的作業。'],
  ['carefully', '小心地；仔細地', 'Read the question carefully.', '仔細閱讀題目。'],
  ['until', '直到', 'Wait here until I come back.', '在這裡等到我回來。'],
  ['bean', '豆子', 'There are beans in the soup.', '湯裡有豆子。'],
  ['bun', '小圓麵包', 'I ate a bun for breakfast.', '我早餐吃了一個小圓麵包。'],
  ['French fries', '薯條', 'He ordered French fries for lunch.', '他午餐點了薯條。'],
  ['lettuce', '萵苣；生菜', 'Put some lettuce in the sandwich.', '在三明治裡放一些生菜。'],
  ['steak', '牛排', 'My father cooked steak for dinner.', '我爸爸晚餐煎了牛排。'],
  ['spaghetti', '義大利麵', 'She likes spaghetti with tomato sauce.', '她喜歡番茄醬義大利麵。'],
  ['toast', '吐司', 'I had toast and milk this morning.', '我今天早上吃吐司配牛奶。'],
  ['salad', '沙拉', 'The salad has fresh vegetables.', '沙拉裡有新鮮蔬菜。'],
  ['ham', '火腿', 'He put ham in his sandwich.', '他把火腿放進三明治裡。'],
  ['castle', '城堡', 'The old castle is on the hill.', '那座古老的城堡在山丘上。'],
  ['prince', '王子', 'The prince lives in the castle.', '王子住在城堡裡。'],
  ['princess', '公主', 'The princess wore a beautiful dress.', '公主穿著一件漂亮的洋裝。'],
  ['soldier', '士兵', 'The soldier helped protect the town.', '士兵幫忙保護城鎮。'],
  ['dragon', '龍', 'The dragon appears in the story.', '龍出現在故事裡。'],
  ['quiz', '小考；測驗', 'We have an English quiz today.', '我們今天有英文小考。'],
  ['mark', '記號；分數', 'Put a mark next to the answer.', '在答案旁做一個記號。'],
  ['elementary school', '小學', 'My brother goes to elementary school.', '我弟弟讀小學。'],
  ['bench', '長椅', 'We sat on a bench in the park.', '我們坐在公園的長椅上。'],
  ['post office', '郵局', 'I mailed a letter at the post office.', '我在郵局寄了一封信。'],
  ['way', '路；方法', 'This is the way to the station.', '這是去車站的路。'],
  ['nobody', '沒有人', 'Nobody was in the classroom.', '教室裡沒有人。'],
  ['guy', '傢伙；男孩', 'That guy is my cousin.', '那個男孩是我的表哥。'],
  ['straw', '吸管；稻草', 'She drinks juice with a straw.', '她用吸管喝果汁。'],
  ['fork', '叉子', 'Use a fork to eat the salad.', '用叉子吃沙拉。'],
  ['lovely', '可愛的；美好的', 'What a lovely day!', '多麼美好的一天！'],
  ['dig', '挖', 'The dog likes to dig holes.', '那隻狗喜歡挖洞。'],
  ['fry', '油炸；煎', 'Fry the egg in a pan.', '在平底鍋裡煎蛋。'],
  ['type', '打字；類型', 'I can type fast on the computer.', '我可以在電腦上快速打字。'],
  ['boil', '煮沸', 'Boil the water before drinking it.', '喝水前先把水煮沸。'],
  ['trick', '把戲；惡作劇', 'The magic trick surprised us.', '那個魔術把戲讓我們很驚訝。'],
  ["New Year's Day", '元旦', "New Year's Day is on January first.", '元旦是一月一日。'],
  ['eve', '前夕', 'We had dinner together on the eve of the festival.', '我們在節日前夕一起吃晚餐。'],
  ["New Year's Eve", '除夕；跨年夜', "We watch fireworks on New Year's Eve.", '我們在跨年夜看煙火。'],
  ['Chinese New Year', '農曆新年', 'Families get together for Chinese New Year.', '家人們在農曆新年團聚。'],
  ['dumpling', '餃子', 'We eat dumplings for dinner.', '我們晚餐吃餃子。'],
  ['voice', '聲音', 'Her voice is soft and clear.', '她的聲音柔和又清楚。'],
  ['wake', '醒來；叫醒', 'I wake up early every morning.', '我每天早上很早醒來。']
].forEach(([word, zh, en_sentence, zh_sentence]) => addEntry({ word, zh, en_sentence, zh_sentence }));

const targetLessonRows = [
  `husband · wife · housewife · Miss · thirteen · fourteen · fifteen · sixteen · seventeen · eighteen · nineteen · twenty · thirty · forty · fifty · sixty · seventy · eighty · ninety · thousand`,
  `number · workbook · brush · cellphone · scooter · party · gift · noon · break · pretty · able · young · full · lucky · so · really · during · near · guess · dining room`,
  `balcony · koala · hippo · zebra · kangaroo · person · people · man · woman · center · future · age · minute · Christmas · bell · turkey · thing · glasses · belt · think`,
  `quiet · interesting · favorite · any · wait · worry · get · share · kick · remember · fight · shout · behind · front · between · down · then · even · wrong · many`,
  `something · everything · anything · dodge ball · tennis · badminton · sport · player · skate · past · gym · rat · hour · story · centimeter · sure · only · wonderful · well · hey`,
  `catch · count · hold · carry · love · kiss · else · may · before · after · about · or · off · noodle · chocolate · shake · sugar · meal · bottle · plate`,
  `pick · mean · first · second · third · money · Mother's Day · idea · because · drawer · bath · cow · market · expensive · cheap · enough · all · poor · early · dirty`,
  `easy · hard · busy · free · need · end · cost · buy · put · feed · hate · sell · also · once · twice · of · place · road · temple · museum`,
  `hotel · season · high · autumn · snow · snowman · plan · date · Father's Day · USA · photo · mind · work · exercise · turtle · practice · race · team · problem · toe`,
  `kind · violin · flute · special · afraid · same · different · snowy · dry · wet · popular · dark · know · keep · join · throw · hit · enjoy · bow · win`,
  `learn · climb · hike · camp · everyone · together · ago · never · always · usually · sometimes · seldom · was · were · insect · bat · butterfly · spider · whale · hill`,
  `island · present · junior high school · course · art · history · science · lesson · subject · test · vacation · holiday · Teacher's Day · festival · Moon Festival · half · quarter · noise · show · start`,
  `stay · Ms. · kid · child · boat · floor · frisbee · hurt · begin · finish · happen · jog · hop · teach · important · health · healthy · weak · terrible · funny`,
  `lot · already · just · why · couch · give · garden · grass · refrigerator · police · officer · actress · writer · reporter · fisherman · factory · again · mail · mailman · glove`,
  `ring · rope · medicine · stomach · fever · throat · sore · language · band · drum · picnic · goat · rose · foreigner · e-mail · honey · dear · common · little · straight`,
  `understand · invite · visit · prepare · mop · send · could · still · soon · me · him · often · us · them · mine · yours · hers · birthday · ours · theirs`,
  `cap · jeans · sweater · American · waiter · clerk · job · gray · purple · airplane · motorcycle · street · town · block · city · corner · department store · theater · movie theater · crazy`,
  `shop · flower shop · station · police station · railway · turn · left · right · stamp · news · blanket · change · find · lose · stop · arrive · bring · spend · pay · up`,
  `agree · garbage · forget · hear · another · delicious · yummy · difficult · as · own · true · sea · welcome · proud · away · will · camera · radio · machine · tape`,
  `myself · yourself · yourselves · himself · herself · itself · ourselves · themselves · recorder · video · price · total · watermelon · papaya · lemon · guava · sir · Dr. · neighbor · Easter`,
  `basket · church · hunt · roll · hang · snack · tool · letter · envelope · ground · R.O.C. · world · seed · other · taste · smell · sound · feel · large · heavy`,
  `try · comfortable · successful · famous · care · careful · friendly · fresh · sweet · each · swing · slide · hide · restaurant · drop · move · paste · become · around · more`,
  `most · whose · than · heart · arm · nail · knee · shoulder · part · rest · cut · fill · pack · package · air · smoke · earth · plant · life · light`,
  `tub · mat · candle · lamp · fire · wind · sky · rainbow · yet · wave · rock · nature · land · pond · mud · mountain · beach · river · lake · please`,
  `chance · prize · moment · giant · mile · mad · lonely · unhappy · shy · ice · loud · strange · both · bright · convenient · fix · choose · fact · cry · smile`,
  `save · tell · maybe · either · sit · quick · ticket · carefully · until · nothing · must · should · bean · bun · butter · cheese · French fries · lettuce · steak · spaghetti`,
  `toast · salad · order · ham · menu · castle · king · queen · prince · princess · soldier · dragon · quiz · check · much · habit · word · sentence · mark · dictionary`,
  `point · grade · mistake · elementary school · bench · seat · office · post office · side · way · nobody · guy · group · country · program · straw · knife · fork · spoon · lovely`,
  `clear · correct · far · safe · sharp · lazy · glad · excellent · over · pass · fail · preparation · cheat · copy · blow · knock · rise · decide · notice · collect`,
  `leave · treat · along · without · inside · repeat · perhaps · if · although · hope · rule · wish · dot · circle · shape · size · square · let · yard · inch`,
  `row · million · goose · bug · hen · Halloween · lantern · ghost · mask · doorbell · surprise · experience · senior high school · joy · oil · gas · top · several · real · dangerous`,
  `excited · exciting · scared · bored · homework · surprised · north · west · east · south · grow · since · traffic · case · gate · teenager · restroom · uniform · paint · bridge`,
  `airport · postcard · stair · hard-working · clap · serious · simple · cross · enter · appear · space · lie · shine · pray · belong · build · ever · however · almost · finally`,
  `quite · whether · stand · except · club · chess · chalk · newspaper · glue · hurry · hobby · across · vest · interest · interested · pleasure · business · salt · popcorn · bakery`,
  `public · truck · apartment · heat · boss · stranger · meeting · nod · born · stupid · polite · less · possible · rich · brown · honest · bake · attack · lend · borrow`,
  `pull · push · dig · fry · cover · raise · type · follow · boil · below · above · someone · anyone · trouble · trick · power · New Year's Day · eve · New Year's Eve · Chinese New Year`,
  `dumpling · note · line · voice · wake · screen · puppy · lid · cage · sight · secretary · list · pair · pin · pipe · medium · married · modern · foreign · national`,
  `few · useful · helpful · least · blind · tidy · believe · celebrate · laugh · lead · playground · set · bite · die · somewhere · abroad · beside · example · knowledge · matter`,
  `excuse · magic · planet · base · typhoon · kilogram · pound · gram · page · dozen · cent · businessman · salesman · shopkeeper · lawyer · dentist · touch · headache · cheer · leader`,
  `class leader · ready · every · kill · barbecue · sidewalk · middle · bottom · shark · low · dead · slim · thick · burn · tie · deal · piece · into · Internet · interview`
];

const missingLessonWords = targetLessonRows.flatMap(row => row.split(/\s*·\s*/));

for (const word of missingLessonWords) {
  const key = normalizeWord(word);
  if (!orderedWords.includes(key)) orderedWords.push(key);
  if (!sourceByWord.has(key)) {
    addEntry({
      word,
      zh: '待補充',
      en_sentence: `I learned the word ${word} today.`,
      zh_sentence: `我今天學了 ${word} 這個單字。`
    });
  }
}

orderedWords.length = 0;
for (const word of missingLessonWords) {
  const key = normalizeWord(word);
  if (!orderedWords.includes(key)) orderedWords.push(key);
}

const rows = [];
const seen = new Set();
for (const key of orderedWords) {
  if (seen.has(key)) continue;
  const entry = sourceByWord.get(key);
  if (!entry) continue;
  rows.push(entry);
  seen.add(key);
}

const csv = [
  '"word","zh","en_sentence","zh_sentence"',
  ...rows.map(row => [
    csvEscape(row.word),
    csvEscape(row.zh),
    csvEscape(row.en_sentence),
    csvEscape(row.zh_sentence)
  ].join(','))
].join('\n') + '\n';

fs.writeFileSync(outputPath, csv, 'utf8');

console.log(JSON.stringify({
  outputPath,
  words: rows.length,
  missingMeaning: rows.filter(row => row.zh === '待補充').length,
  first: rows[0]?.word,
  last: rows[rows.length - 1]?.word
}, null, 2));
