(function () {
  'use strict';

  const money = n => n.toLocaleString() + '⭐';
  const pick = values => values[Math.floor(Math.random() * values.length)];

  function say(state, lines) {
    let available = lines.filter(line => !state.usedLines.includes(line));
    if (!available.length) {
      const last = state.usedLines[state.usedLines.length - 1];
      state.usedLines = state.usedLines.filter(line => !lines.includes(line));
      available = lines.filter(line => line !== last);
    }
    const line = pick(available.length ? available : lines);
    state.usedLines.push(line);
    if (state.usedLines.length > 80) state.usedLines = state.usedLines.slice(-40);
    return line;
  }

  function finalizeAccept(state, price) {
    state.closed = true;
    state.dealPrice = price;
    state.pendingPrice = null;
    state.confirmCount = 0;
    return { action: 'accept', price, message: getAcceptMessage(state, price) };
  }

  function walkawayMessage(state, flavor) {
    return getWalkawayMessage(state, flavor);
  }

  function walkaway(state, flavor) {
    state.closed = true;
    state.pendingPrice = null;
    state.confirmCount = 0;
    return { action: 'walkaway', message: walkawayMessage(state, flavor) };
  }

  function maybeAccept(state, price) {
    if (state.pendingPrice === null) state.pendingPrice = price;
    if (state.confirmCount < 3) {
      state.confirmCount++;
      const messages = getConfirmLines(state);
      return { action: 'confirm', price: state.pendingPrice, message: messages[state.confirmCount - 1] };
    }
    return finalizeAccept(state, state.pendingPrice);
  }

  function conversation(state, text, topic) {
    const memory = state.memory;
    const offer = money(state.lastOffer);
    const name = getName(state.card);
    const boss = state.bossName;
    const trait = state.personality;
    const repeated = memory.lastText === text;
    const previousTopic = memory.lastTopic;
    memory.lastText = text;
    memory.lastTopic = topic;
    memory.turns++;
    const named = text.match(/(?:我叫|叫我)([\u4e00-\u9fffA-Za-z]{1,12})/);
    if (named) {
      memory.name = named[1];
      return `好，${memory.name}，記住了。叫我${boss}就行。這張卡是特地帶來賣的，還是先問問價？`;
    }
    if (/我叫什麼|記得我|我的名字/.test(text)) return memory.name
      ? `記得啊，${memory.name}。${state.previousAsk ? `你剛才想賣 ${money(state.previousAsk)}，` : ''}我們還在談【${name}】呢。`
      : `你還沒告訴我怎麼稱呼呢。我叫${boss}，你呢？`;
    if (/剛才|剛剛|之前|上次.*開|出多少/.test(text)) return state.previousAsk
      ? `你最近一次開 ${money(state.previousAsk)}，我目前出 ${offer}。${state.round > 1 ? '前面我也往上挪了幾次，' : ''}你最在意的是哪一段差距？`
      : `我目前出 ${offer}。你還沒報想賣的價格，要不要先說個範圍？`;
    if (repeated) return say(state, [
      '嘿，這句我聽到了。你是覺得我沒回答到重點，還是想再爭取一點？',
      '我懂，你很在意這個。說說你最不能退讓的地方，我們從那裡談。',
      '看來這點對你很重要。你多說一點，我不急著打斷你。'
    ]);
    if (/吃飯|吃了|午餐|晚餐|早餐/.test(text)) return say(state, [
      '還沒呢，想先把這筆談完再吃。你呢？別餓著肚子談，容易心急。',
      '剛吃過，現在正想喝杯茶。你平常也會邊吃飯邊看卡嗎？',
      '你這樣一問，我倒真的餓了。不過放心，不會拿飯錢當理由叫你便宜賣。'
    ]);
    if (/喜歡|最愛/.test(text)) return say(state, [
      `我比較喜歡有故事的收藏。像【${name}】，你是喜歡角色，還是喜歡這張圖？`,
      '我挑卡很看第一眼的感覺，收購時才會把算盤拿出來。你比較看畫面還是稀有度？',
      '喜歡跟願意花多少，是兩回事啊。你有沒有那種再高價也不想賣的卡？'
    ]);
    if (/黑心|騙|奸商|搶錢|小氣/.test(text)) return say(state, [
      '哇，這話有點狠喔。我確實想壓低收購價，但你不滿意就繼續談。你覺得多少才公平？',
      '先別替我掛招牌啦。你嫌我低，我嫌成本高，這才需要坐下來談。',
      '我聽得出來你不滿意。你直接說希望差多少，我給你明確答覆。'
    ]);
    if (/心情|難過|累|煩|開心/.test(text)) return say(state, [
      '今天不太順嗎？價格可以晚點談，你想說就說。',
      '那我們慢慢來，不用急著決定賣不賣。',
      '聽起來你今天有點事掛心。先聊聊也行。'
    ]);
    if (topic === 'personal') return say(state, [
      `叫我${boss}就行，我這個人比較${trait}。看卡時話多，算錢時比較固執。你怎麼稱呼？`,
      `我叫${boss}，個性是${trait}，興趣是收卡，毛病是每筆都想多留一點利潤。這你大概發現了吧？`,
      `你想認識老闆本人啊？${boss}，愛聊天，也愛討價還價。你是常收卡的人嗎？`
    ]);
    if (topic === 'greeting') return say(state, memory.turns > 1 ? [
      `在呢，${boss}還在線。剛才那個價你考慮得怎麼樣？`,
      `嘿，我還在！剛才聊到【${name}】的價格，你有想法了嗎？`,
      `來，繼續聊。${boss}今天照常${trait}，你想先談價格還是聊這張卡？`
    ] : [`哈囉！我是${boss}，${trait}老闆。今天帶了什麼好貨？`,
      `嗨～${boss}來囉！${trait}老闆在此，有什麼卡想賣？`,
      `你好你好，我是${boss}。我這人比較${trait}。這張【${name}】為什麼想賣？`]);
    if (topic === 'gratitude') return say(state, ['不客氣，買賣就是有來有往嘛。', '客氣什麼，談得來比較重要。', '好說，有想法就直接跟我講。']);
    if (topic === 'joke') return say(state, ['哈哈，你這句比剛才的開價好接多了。', '你倒是很會活絡氣氛。我差點把算盤放下了。', '跟你聊天不無聊。平常也這樣跟老闆談價嗎？']);
    if (topic === 'general') return say(state, [
      `你說「${text.slice(0, 45)}」，是指這張卡，還是想聊別的？`,
      previousTopic === 'market' ? '你剛提到行情，是有看到實際成交，還是賣家的標價？這兩種我會分開看。' : '這個我還沒完全聽懂，你多說一點？',
      `先讓我確認一下，你希望我重新看【${name}】的價值，還是先聽聽你的想法？`,
      '嗯，你接著說。我想先弄清楚你的意思，再回答你。'
    ]);
    return null;
  }

  function getName(card) {
    return card ? (card.zh || card.word || '這張卡') : '這張卡';
  }

  function getSeries(card) {
    return card ? (card.category || card.series || '') : '';
  }

  function getDaily() {
    return (typeof LocalCardTrade !== 'undefined')
      ? LocalCardTrade.getDailyMarket()
      : { mood: '普通', multiplier: 1, hotSeries: '' };
  }

  function getTraitLines(state, map) {
    return map[state.personality] || map['真誠'];
  }

  function getOpeningLines(state) {
    const boss = state.bossName;
    const name = getName(state.card);
    return getTraitLines(state, {
      '豪爽': [
        `哈囉，我是${boss}，收卡一向爽快。${name}你直接開價！`,
        `嗨！${boss}來了，談價不愛拖。${name}你賣多少？`,
        `你好，我是${boss}。${name}開價吧，我們速戰速決！`
      ],
      '小氣': [
        `呃，你好，我是${boss}，錢要看緊一點。${name}你開個價，我先聽聽。`,
        `我是${boss}，每一塊都要算清楚。${name}你打算賣多少？`,
        `你好，${boss}，收卡要精打細算。${name}開價吧。`
      ],
      '奸詐': [
        `嘿嘿，我是${boss}，最喜歡慢慢談。${name}你開多少？`,
        `哈囉，${boss}來了。${name}開個價，我們看看能談到哪裡。`,
        `你好，我是${boss}。${name}你心裡價位多少？`
      ],
      '急性子': [
        `快點！我是${boss}，時間不多。${name}直接開價！`,
        `哈囉！${boss}，沒空慢慢磨。${name}你賣多少？`,
        `我是${boss}，速戰速決。${name}報價！`
      ],
      '佛系': [
        `嗨，我是${boss}，隨緣收卡。${name}你說多少都行。`,
        `你好，${boss}。${name}開個價，隨緣談。`,
        `我是${boss}，不強求。${name}你開價吧。`
      ],
      '謹慎': [
        `你好，我是${boss}，收卡前會先評估。${name}請開價。`,
        `哈囉，${boss}。${name}你開多少？我會仔細算。`,
        `我是${boss}，穩扎穩打。${name}開價吧。`
      ],
      '真誠': [
        `哈囉，我是${boss}，開價實在不拐彎。${name}你誠實說多少？`,
        `你好，${boss}。${name}開價吧，我會給實在價。`,
        `我是${boss}，不喜歡虛報。${name}你開多少？`
      ]
    });
  }

  function getFirstOfferMessage(state, price, first, outrageous) {
    const boss = state.bossName;
    const p1 = money(price);
    const p2 = money(first);
    if (outrageous) {
      return say(state, getTraitLines(state, {
        '豪爽': [
          `${p1}？太超過了！我從 ${p2} 開始，不囉嗦！`,
          `${p1}？沒辦法，我頂多開 ${p2}，痛快一點！`,
          `這個 ${p1} 我接不住，${p2} 起跳，要不要？`
        ],
        '小氣': [
          `${p1}？太貴了！我頂多給 ${p2}，一分不多。`,
          `哇，${p1}？我的天，${p2} 是我的極限。`,
          `${p1} 我買不起，${p2} 你考慮一下。`
        ],
        '奸詐': [
          `${p1}？你是在試我的底線吧。我回 ${p2}，看你怎麼接。`,
          `嘿嘿，${p1} 有點意思。我開 ${p2}，你再想想。`,
          `${p1}？我們慢慢來，我從 ${p2} 開始出招。`
        ],
        '急性子': [
          `${p1}？沒時間浪費，我開 ${p2}，快回！`,
          `唉唷，${p1}？我直接給 ${p2}，行就行！`,
          `${p1} 太高，我出 ${p2}，要賣快說！`
        ],
        '佛系': [
          `${p1}... 有點超出緣分。我從 ${p2} 開始談。`,
          `哇，${p1}。隨緣吧，我開 ${p2}。`,
          `${p1} 隨緣，我回 ${p2}，能接受再談。`
        ],
        '謹慎': [
          `${p1} 風險太高。我初步估 ${p2}，再議。`,
          `經過評估，${p1} 不符合市場。我開 ${p2}。`,
          `${p1} 的風險我承擔不起，${p2} 先試水溫。`
        ],
        '真誠': [
          `我誠實講，${p1} 賣不掉。我開 ${p2} 起步。`,
          `${p1} 超出我的預期了。${p2} 是我的誠實起價。`,
          `真誠建議，${p1} 太高。${p2} 我們再談。`
        ]
      }));
    }
    return say(state, getTraitLines(state, {
      '豪爽': [
        `${p1}？我直接砍到 ${p2}，爽快點！`,
        `${p1} 我聽到了，${p2} 我開，接受就成交！`,
        `${p1}？沒問題，我開 ${p2}，你賣不賣？`
      ],
      '小氣': [
        `${p1}？有點貴。我頂多出 ${p2}，這是我的底線。`,
        `我算了算，${p1} 太高，${p2} 比較合理。`,
        `${p1} 我可以聽聽，但只願意給 ${p2}。`
      ],
      '奸詐': [
        `${p1}？我看還有空間。我回 ${p2}，你再想想。`,
        `嘿嘿，${p1} 聽起來不錯，但我開 ${p2}。`,
        `${p1}？我們從 ${p2} 開始「過招」。`
      ],
      '急性子': [
        `${p1}？沒空慢慢磨，我開 ${p2}，快回！`,
        `我聽到 ${p1} 了，直接給 ${p2}，行嗎？`,
        `${p1}？好，我出 ${p2}，成交就現在！`
      ],
      '佛系': [
        `${p1} 隨緣。我從 ${p2} 開始，你看著辦。`,
        `聽到 ${p1} 了。我回 ${p2}，隨緣談。`,
        `${p1} 啊... 隨緣補到 ${p2}，你願意嗎？`
      ],
      '謹慎': [
        `${p1} 我聽到了。經評估，我開 ${p2}。`,
        `我評估了一下，${p1} 偏高，${p2} 比較穩。`,
        `${p1} 的風險我考量過，${p2} 是我的初步出價。`
      ],
      '真誠': [
        `${p1} 誠實說，有點高。我開 ${p2} 起步。`,
        `我實在跟你講，${p1} 我賣不出去。${p2} 試試。`,
        `${p1} 我聽到了。誠實回 ${p2}，你可以考慮。`
      ]
    }));
  }

  function getCounterEnding(state, next) {
    const p = money(next);
    return say(state, getTraitLines(state, {
      '豪爽': [
        `我加到 ${p}，夠爽快了吧！`,
        `補到 ${p}，別再拖了，賣不賣？`,
        `就 ${p}，爽快地說！`
      ],
      '小氣': [
        `勉強加到 ${p}，這真的很多了。`,
        `我咬牙出 ${p}，不能再多了。`,
        `極限 ${p}，你考慮一下。`
      ],
      '奸詐': [
        `我再給 ${p}，這是特別優惠喔。`,
        `偷偷補到 ${p}，別跟別人說。`,
        `我出 ${p}，這價只有你能拿到。`
      ],
      '急性子': [
        `快！${p}，接不接？`,
        `沒時間了，${p} 行嗎？`,
        `我直接補到 ${p}，快說！`
      ],
      '佛系': [
        `隨緣補到 ${p}，你看著辦。`,
        `那就 ${p}，隨緣囉。`,
        `我給 ${p}，能接受就談。`
      ],
      '謹慎': [
        `我評估後補到 ${p}，請考慮。`,
        `再補一點到 ${p}，這是我的風險上限。`,
        `經過計算，${p} 是我能出的價。`
      ],
      '真誠': [
        `我誠實加碼到 ${p}，這是我的誠意。`,
        `實在補到 ${p}，我沒有虛報。`,
        `誠實給你 ${p}，你再想想。`
      ]
    }));
  }

  function getConfirmLines(state) {
    const p = money(state.pendingPrice);
    return getTraitLines(state, {
      '豪爽': [
        `你確定要以 ${p} 賣出？爽快一點！`,
        `真的確定？我可不想再拖了！`,
        `最後一次，${p} 成交？說定就說定！`
      ],
      '小氣': [
        `你確定要賣 ${p}？我再問一次。`,
        `真的嗎？${p} 是我的上限了。`,
        `最後確認，${p} 賣不賣？想好。`
      ],
      '奸詐': [
        `你確定賣 ${p}？沒有後悔藥喔。`,
        `真的嗎？${p} 成交可不能再改。`,
        `最後一次，${p} 說定囉？`
      ],
      '急性子': [
        `你確定 ${p} 賣出？快說！`,
        `真的？${p} 成交就現在！`,
        `最後確認，${p} 賣不賣？別拖！`
      ],
      '佛系': [
        `你確定以 ${p} 賣出？隨緣。`,
        `真的嗎？${p} 隨緣成交。`,
        `最後一次，${p} 隨緣賣？`
      ],
      '謹慎': [
        `你確定賣 ${p}？請三思。`,
        `真的確定？${p} 成交後不能反悔。`,
        `最後確認，${p} 你真的要賣？`
      ],
      '真誠': [
        `你誠實確定要賣 ${p}？`,
        `真的嗎？${p} 成交我們就誠實執行。`,
        `最後一次確認，${p} 你願意賣？`
      ]
    });
  }

  function getAcceptMessage(state, price) {
    const boss = state.bossName;
    const p = money(price);
    const name = getName(state.card);
    return say(state, getTraitLines(state, {
      '豪爽': [
        `成交！${p}，【${name}】我收下了，爽快！`,
        `好，${p} 就這樣！【${name}】歸我。`,
        `痛快！${p} 成交，【${name}】我帶走了。`
      ],
      '小氣': [
        `好吧，${p} 成交。希望【${name}】能賣得出去。`,
        `成交... ${p}，【${name}】我收了，別後悔。`,
        `嗯，${p} 就成交。這是我能接受的極限。`
      ],
      '奸詐': [
        `嘿嘿，${p} 成交。這張【${name}】我有安排。`,
        `好，${p} 說定了。【${name}】我收，後面的事我來處理。`,
        `成交，${p}。這筆【${name}】談得不錯。`
      ],
      '急性子': [
        `好！${p} 成交，【${name}】我收，快點結束！`,
        `成交！${p}，【${name}】歸我，別拖了！`,
        `就 ${p}，【${name}】我收下了，效率！`
      ],
      '佛系': [
        `隨緣成交，${p}。【${name}】我收下。`,
        `好，${p}。這張【${name}】我們有緣。`,
        `成交，${p}。【${name}】隨緣轉手。`
      ],
      '謹慎': [
        `經過確認，${p} 成交。我收下【${name}】。`,
        `好，${p}。這筆【${name}】我會小心處理。`,
        `成交，${p}。【${name}】我收了，風險我承擔。`
      ],
      '真誠': [
        `好，${p} 成交。誠實交易，【${name}】我收。`,
        `成交，${p}。沒有虛報，【${name}】歸我。`,
        `好，${p} 我們說定了。【${name}】我會好好轉手。`
      ]
    }));
  }

  function getWalkawayMessage(state, flavor) {
    const boss = state.bossName;
    const offer = money(state.lastOffer);
    const name = getName(state.card);
    const general = getTraitLines(state, {
      '豪爽': [
        `唉，談不攏沒關係，下次有好卡直接找我${boss}！`,
        `好吧，這次沒成交。下次爽快點！`,
        `行，${boss}先閃了。有緣再合作。`
      ],
      '小氣': [
        `太貴了，我先不收。想便宜點再來找${boss}。`,
        `談不攏，我先省錢。下次再說。`,
        `唉，超出預算。${boss}先走了。`
      ],
      '奸詐': [
        `嘿嘿，談不成也沒關係。下次我們再「過招」。`,
        `好，這次算你贏。下次再來找${boss}。`,
        `沒成交，不過我記得你了。${boss}先撤。`
      ],
      '急性子': [
        `沒時間了！下次快點決定。`,
        `談不攏？那我先走了，效率高點！`,
        `唉，浪費時間。下次想好再來！`
      ],
      '佛系': [
        `隨緣，這次沒成交。下次有緣再見。`,
        `談不成也沒關係，隨緣。`,
        `好，隨緣。${boss}先告辭。`
      ],
      '謹慎': [
        `經過評估，這次先不收。下次再評估。`,
        `價格超出風險範圍，我先離開。`,
        `我們都保留底線，下次再謹慎談。`
      ],
      '真誠': [
        `實在談不攏，沒關係。下次誠實再來。`,
        `好，這次先不勉強。真誠希望你找到好買家。`,
        `談不成，但我不騙你。下次有卡再來。`
      ]
    });
    const pending = getTraitLines(state, {
      '豪爽': [
        `欸，你還沒決定？那${boss}先走了，想賣再來！`,
        `猶豫就算了，我趕時間。下次爽快點！`,
        `沒確認就沒成交，${boss}先閃。`
      ],
      '小氣': [
        `確認到一半反悔？好吧，我先不收，免得虧錢。`,
        `反悔沒關係，錢的事要想清楚。下次再來。`,
        `沒定案，我先保住錢包。`
      ],
      '奸詐': [
        `嘩，差點成交又反悔。${boss}記得這招。`,
        `臨時反悔啊？沒關係，下次我們再玩。`,
        `差一點就套住了。${boss}先撤。`
      ],
      '急性子': [
        `什麼？又反悔？我沒時間了，走了！`,
        `確認了又不要？浪費時間！下次想清楚！`,
        `唉，不賣早說！${boss}趕下一場。`
      ],
      '佛系': [
        `反悔也隨緣。想賣再來找我。`,
        `沒關係，隨緣。下次有緣再成交。`,
        `差一點隨緣成交。不急。`
      ],
      '謹慎': [
        `確認未完成，我先不進行。請想好再來。`,
        `反悔是正確的，錢要想清楚。下次再談。`,
        `交易中止，我保留底線。`
      ],
      '真誠': [
        `沒確認就反悔，沒關係。真誠希望你考慮好。`,
        `錢的事想清楚是對的。下次誠實再談。`,
        `這次先不勉強，真誠祝你順利。`
      ]
    });
    const final = getTraitLines(state, {
      '豪爽': [
        `最多就是 ${offer}，不能再高。${boss}先走了！`,
        `豪爽歸豪爽，${offer} 是我的上限。下次見！`,
        `超過 ${offer} 我沒辦法，先閃了。`
      ],
      '小氣': [
        `${offer} 是我的上限，再多一毛都沒有。`,
        `最多 ${offer}，我小氣，但這真的是極限。`,
        `超過 ${offer} 我就不收了，免得虧。`
      ],
      '奸詐': [
        `${offer} 是我的最後一招，再高我就撤。`,
        `底線 ${offer}，過了就沒得談。${boss}先閃。`,
        `這價 ${offer} 是我的真心話，再高不玩。`
      ],
      '急性子': [
        `最後 ${offer}，不賣我就走了，沒空耗！`,
        `就 ${offer}，行不行？不行拉倒！`,
        `最多 ${offer}，快決定！`
      ],
      '佛系': [
        `最多 ${offer}，隨緣吧。賣不賣都好。`,
        `底線 ${offer}，隨緣成交。`,
        `${offer} 是我的緣分價，再高就沒緣。`
      ],
      '謹慎': [
        `經評估，${offer} 是我的風險上限。再高不收。`,
        `${offer} 是極限，超過我無法承擔。`,
        `我的最終報價是 ${offer}，請考慮。`
      ],
      '真誠': [
        `誠實講，${offer} 是我的上限。再高我會賠。`,
        `我沒虛報，${offer} 是最後能給的價。`,
        `真誠告訴你，${offer} 是我的底線。`
      ]
    });
    return say(state, flavor === 'pending' ? pending : flavor === 'final' ? final : general);
  }

  function extractPrice(input) {
    const text = String(input).trim();
    const normalized = text.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 65248)).replace(/[,，]/g, '');
    // Numbers in stories, ages, and collection counts are not sale offers.
    // 純數字必須帶單位才算出價；其餘需要明確的出價關鍵字
    if (!/^\d+(?:\.\d+)?\s*(萬|千|[kK]|星星|⭐|元)$/.test(normalized)
      && !/(?:賣|開價|報價|我要|我想要|希望|至少|最低|收購|出價|我出|算你|給我)\s*\d/.test(normalized)) return { price: null, text };
    const match = normalized.match(/\d+(?:\.\d+)?\s*(萬|千|[kK])?/);
    if (!match) return { price: null, text };
    const unit = match[1] === '萬' ? 10000 : (match[1] ? 1000 : 1);
    const price = Number(match[0].replace(/\s*(萬|千|[kK])$/, '')) * unit;
    if (!Number.isSafeInteger(price) || price <= 0 || /-\s*\d/.test(normalized)) return { price: null, text };
    return { price, text };
  }

  function detectTopic(text, card) {
    const t = text.toLowerCase();
    if (/^\s*$/u.test(text)) return 'empty';
    if (/你好|嗨|哈囉|早安|午安|晚安|yo\b|hello\b|hi\b|嗨/.test(t)) return 'greeting';
    if (/謝謝|感謝|3q|thx|thanks/.test(t)) return 'gratitude';
    if (/你是誰|你叫什麼|你的名字|老闆名|年紀|幾歲|住哪|哪裡人/.test(t)) return 'personal';
    if (/鬼滅|海賊|火影|希臘|進擊|七龍珠|咒術|排球|藍鎖/.test(t) || (card && card.category && t.includes(card.category.toLowerCase()))) return 'series';
    if (/稀有|限定|限量|絕版|收藏|ssr|rare|sr\b|a卡|n卡/.test(t)) return 'rarity';
    if (/市場|行情|市價|別家|立即出售|其他店|掛單/.test(t)) return 'market';
    if (/貴|太貴|太便宜|虧|賠|賺|價格低|不合理/.test(t)) return 'complaint';
    if (/為什麼|怎麼|如何|為何/.test(t)) return 'question';
    if (/哈哈|好笑|搞笑|無聊|幹嘛|用途|幹麼|做啥|吃飯|喜歡/.test(t)) return 'joke';
    if (/再見|拜拜|bye|走了|下次|先這樣/.test(t)) return 'farewell';
    if (/不賣|不談|沒興趣|算了|走|離開/.test(t)) return 'leave';
    if (/加|高一點|太低|誠意|讓|降|便宜|少一點/.test(t)) return 'raise';
    return 'general';
  }

  function topicResponse(state, topic, priceText, card) {
    const name = getName(card);
    const series = getSeries(card);
    const offer = money(state.lastOffer);
    const max = money(state.maxPrice);
    const daily = getDaily();
    const mood = daily.mood || '普通';
    const hot = daily.hotSeries || '';
    const p = state.personality;

    const greet = () => say(state, [
      `嗨！今天想賣【${name}】嗎？我目前開 ${offer}，我們可以慢慢聊。`,
      `哈囉，老闆我來看貨了。${offer} 起談，你心裡價位多少？`,
      `早安午安晚安都好！先喝杯茶，我們再來談 ${offer}。`,
      `歡迎光臨，想談【${name}】對吧？我先開 ${offer}。`
    ]);

    const chat = () => say(state, [
      `聊點別的也可以，不過老闆我時間有限。${offer} 你怎麼看？`,
      `閒聊沒問題，但最後還是要回到錢。${offer} 能接受嗎？`,
      `我們邊聊邊談吧。對了，我開 ${offer}，你還想要更高嗎？`,
      `話題不錯，但我們先把【${name}】的價格談完？${offer} 怎麼樣？`
    ]);

    switch (topic) {
      case 'greeting': return greet();
      case 'gratitude': return say(state, [
        `不客氣，有來有往嘛。如果 ${offer} 可以就成交？`,
        `謝謝你願意坐下來談。我們再看看能不能從 ${offer} 往上調。`,
        `客氣了，談得開心最重要。${offer} 先放這，有意見再說。`
      ]);
      case 'personal': return say(state, [
        `我是這裡的卡片收購商，大家都叫我老闆。你可以叫我『${p}老闆』。言歸正傳，${offer} 怎麼樣？`,
        `名字不重要，錢最重要 😄。我對【${name}】開 ${offer}，你覺得呢？`,
        `我只是一個想收到好卡的普通人。來，我們繼續談 ${offer}。`
      ]);
      case 'series': return say(state, [
        `【${series || '這系列'}】的市場我天天盯，今天行情 ${mood}。我開 ${offer}，不是沒道理。`,
        `${series || '這系列'} 的粉絲有，但願意出高價的買家不好找。${offer} 是我能給的誠意價。`,
        `我收過不少 ${series || '這系列'} 的卡，有些好賣有些囤很久。${offer} 已經考量過風險。`,
        hot && series.includes(hot) ? `今天 ${series} 剛好是熱門系列，不過我收購還是保守。${offer} 先參考。` : `系列熱度會變，我這個 ${offer} 是看最近成交開的。`
      ]);
      case 'rarity': return say(state, [
        `稀有度高是優勢，但也要等懂的人買。${offer} 是我目前看見的行情。`,
        `【${name}】的稀有度不錯，不過轉手週期長。${offer} 我先開，看你能不能接受。`,
        `越是稀有的卡，我越要算流動性。${offer} 已經沒有壓太低。`,
        `你強調稀有，我懂。但稀有不等於現在就有人出高價。${offer} 我們繼續談。`
      ]);
      case 'market': return say(state, [
        `市場掛價是參考，實際成交通常更低。${offer} 是我能拿出的現金。`,
        `你有比過行情很好。別家開得高，但不一定真會收。${offer} 是我現在能成交的價。`,
        `『立即出售』的價可以當底線，但我們談的是我能多給多少。目前 ${offer}。`,
        `每日市場 ${mood}，收購價也跟著調。${offer} 是今天的數字。`
      ]);
      case 'complaint': return say(state, [
        `哈哈，我也覺得轉手利潤薄。你讓一點，我可以試著靠近你的期望。`,
        `價格永遠談不攏是正常的。你開個更合理的數字，我們再動。`,
        `老闆我不會漫天喊價，${offer} 是算過風險後的價。你說說你最低能賣多少？`,
        `買賣就是這樣，你覺得低、我覺得高。我們各退一步，再靠近一點。`
      ]);
      case 'question': return say(state, [
        `我的邏輯很單純：稀有度 + 系列熱度 + 轉手難度。目前綜合下來是 ${offer}。`,
        `收購價 = 預期賣價 - 風險 - 時間成本。${offer} 是我算過後的結果。`,
        `為什麼是 ${offer}？因為我要留空間給未來買家議價，也要承擔賣不掉的風險。`,
        `怎麼判斷價格？我看最近成交、看系列熱度、看卡片狀況。${offer} 就是這樣來的。`
      ]);
      case 'joke': return say(state, [
        `你很有梗 😄。老闆我除了收卡，也會講冷笑話。言歸正傳，${offer} 賣不賣？`,
        `哈哈，我們邊聊邊談。不過正事還是要回到【${name}】的 ${offer}。`,
        `我喜歡跟你聊天，但要收攤了。${offer} 成交吧？`,
        `搞笑歸搞笑，錢歸錢。${offer} 你覺得如何？`
      ]);
      case 'farewell': return say(state, [
        `好，慢走。如果改變主意，${offer} 這個價還在。`,
        `下次有卡再來聊，這次 ${offer} 隨時可以成交。`,
        `拜拜！我們今天停在 ${offer}，想賣再回來。`
      ]);
      case 'leave': return say(state, [
        `先別急著走，我再挪一點預算。你看看這樣能不能談成。`,
        `我確實想收，最後再替你爭取一點，你也考慮一下。`,
        `買賣不成仁義在，但我們還有機會。${offer} 真的不能再談了嗎？`
      ]);
      case 'raise': return say(state, [
        `想高一點可以，但我也得留利潤。你開個數字，我們繼續。`,
        `加價不是不行，要看你的理由。我目前 ${offer}，你預期多少？`,
        `一口氣加太多我吃不消。你給個中間數，我再補一點。`,
        `好，我們慢慢靠近。我現在 ${offer}，你願意降到多少？`
      ]);
      default: return chat();
    }
  }

  const PERSONALITIES = [
    { name: '阿信', trait: '真誠', fraction: +.02, maxBonus: +.05 },
    { name: '老狐', trait: '奸詐', fraction: -.01, maxBonus: +.10 },
    { name: '阿鐵', trait: '小氣', fraction: -.03, maxBonus: -.10 },
    { name: '阿爽', trait: '豪爽', fraction: +.05, maxBonus: +.25 },
    { name: '阿穩', trait: '謹慎', fraction: -.02, maxBonus: +.00 },
    { name: '阿急', trait: '急性子', fraction: +.04, maxBonus: +.08 },
    { name: '阿淡', trait: '佛系', fraction: -.02, maxBonus: +.15 }
  ];

  const SellCardAI = {
    start(card) {
      if (typeof LocalCardTrade === 'undefined' || !card) return null;
      const instant = LocalCardTrade.getInstantSellPrice(card);
      const unit = 5;
      const floor = Math.ceil((instant + unit) / unit) * unit;
      const p = pick(PERSONALITIES);
      const maxPrice = LocalCardTrade.getBuybackPrices(card).max;
      const lastOffer = Math.min(maxPrice - unit * 3, Math.max(floor, Math.floor(instant * (1.03 + Math.random() * .04) / unit) * unit));
      return { card, instant, unit, maxPrice, lastOffer, round: 0, previousAsk: null,
        personality: p.trait, bossName: p.name, personalityData: p, memory: { turns: 0, name: '', lastText: '', lastTopic: '' },
        usedLines: [], closed: false, dealPrice: null, isFinal: false, confirmCount: 0, pendingPrice: null };
    },

    getOpeningMessage(state) {
      return say(state, getOpeningLines(state));
    },

    respond(state, input) {
      if (!state || state.closed) return { action: 'closed', message: '這筆交易已經結束了。' };

      const { price, text } = extractPrice(input);
      const topic = detectTopic(text, state.card);
      const agreed = /^(好|好的|可以|成交|接受|好吧|我接受|就這個價|確定|我確定|ok|yes|賣給你|我願意)[！!。\s]*$/i.test(text);
      if (agreed) return maybeAccept(state, state.lastOffer);
      if (/^(不賣了|算了|再見|拜拜|離開)[！!。\s]*$/.test(text)) return walkaway(state, 'general');

      // 進入確認階段後，玩家沒有再次同意：交易破裂
      if (state.pendingPrice !== null) return walkaway(state, 'pending');

      const reply = conversation(state, text, topic);
      if (price === null && reply !== null) return { action: 'chat', message: reply };

      // 已經亮出底價：玩家只能接受或離開，否則交易破裂
      if (state.isFinal) {
        if (price !== null && price > 0 && price <= state.maxPrice) return maybeAccept(state, state.lastOffer);
        return walkaway(state, 'final');
      }

      // 純閒聊：不計算回合，也不加價
      if (price === null && !['leave', 'raise', 'rarity', 'market', 'complaint'].includes(topic)) {
        return { action: 'chat', message: topicResponse(state, topic, text, state.card) };
      }

      // 直接接受或離開
      if (/^(好|好的|可以|成交|接受|好吧)[！!。\s]*$/.test(text) || /^(我接受|就這個價)[！!。\s]*$/.test(text)) return maybeAccept(state, state.lastOffer);
      if (/^(不賣了|算了|再見|離開)[！!。\s]*$/.test(text) || topic === 'leave' && /^(不賣|不談|沒興趣|算了|走|離開)/.test(text)) return walkaway(state, 'general');

      // 賣家開價比 AI 低，直接接受
      if (price !== null && price <= state.lastOffer) return maybeAccept(state, state.lastOffer);

      // 玩家第一次出價：AI 不亮底價，先回一個起步價
      if (state.round === 0 && price !== null && price > state.lastOffer) {
        const outrageous = price > state.maxPrice * 1.5;
        const base = outrageous ? state.maxPrice * 0.6 : price;
        const first = Math.max(state.lastOffer, Math.min(state.maxPrice - state.unit * 3,
          Math.floor(base * (0.55 + Math.random() * 0.15) / state.unit) * state.unit));
        state.round = 1;
        state.previousAsk = price;
        state.lastOffer = first;
        return { action: 'counter', price: first, message: getFirstOfferMessage(state, price, first, outrageous) };
      }

      // 進入議價回合
      state.round++;
      const concession = price !== null && state.previousAsk !== null && price < state.previousAsk;
      const outrageous = price !== null && price > state.maxPrice * 1.5;
      if (price !== null) state.previousAsk = price;
      const previous = state.lastOffer;

      const personBonus = state.personalityData ? state.personalityData.fraction : 0;
      const fraction = Math.max(0, Math.min(0.25, personBonus + (outrageous ? 0
        : concession ? .19
        : topic === 'leave' ? .16
        : topic === 'rarity' || topic === 'market' ? .13
        : topic === 'raise' ? .10
        : .08)));
      const step = fraction ? Math.max(state.unit, Math.floor((state.maxPrice - previous) * fraction / state.unit) * state.unit) : 0;
      const next = Math.min(state.maxPrice, previous + step);

      if (price !== null && price <= next) return maybeAccept(state, price);

      // 到達 AI 底價
      if (next >= state.maxPrice) {
        state.lastOffer = state.maxPrice;
        state.isFinal = true;
        return { action: 'counter', price: state.maxPrice, message: `這是我的底價 ${money(state.maxPrice)}，不能再高了。你要賣就賣，不賣我們就到此為止。` };
      }

      state.lastOffer = next;

      let reason;
      if (outrageous) {
        reason = say(state, ['這個開價離我的收購範圍太遠，你願意先調整一些嗎？', '照這個價收，我很難轉手。你先讓一點，我們才有得談。', '嘩，這個數字我會被老婆罵。你先降一點吧。']);
      } else if (next === previous) {
        reason = say(state, ['我重新算過了，再加就不合算。這次真的不能再往上。', '談到這裡，我能承擔的就這麼多，你考慮看看。', '我已經把利潤壓到最低了，這是極限。']);
      } else if (concession) {
        reason = say(state, ['你肯退一步，那我也補一點，這樣才談得下去。', '這次有靠近了。看你願意讓，我也挪一點預算。', '你讓步，我也不能小氣。補一點給你。']);
      } else if (topic === 'rarity') {
        reason = say(state, ['收藏價值我認同，但還得等懂它的買家。我加一點，你也留些空間給我。', '稀有是優點，不過收購跟零售有差。我願意為這點多出一些。', '你說稀有我同意，但我也要找到下家。我再加一點。']);
      } else if (topic === 'market') {
        reason = say(state, ['掛出的市價不一定就是成交價，等買家的成本也要算。我再補一點。', '你有比過行情，那我們就認真談。我可以再靠近一些。', '行情我天天看，我們互相靠近一點。']);
      } else if (topic === 'series') {
        reason = say(state, [`${getSeries(state.card) || '這系列'} 的確有粉絲，但受眾大小決定價格。我補一點。`, '系列熱度我會考慮，但冷門的話不好賣。我再加一點。', '這系列我有在關注，所以願意多給一點。']);
      } else if (topic === 'leave') {
        reason = say(state, ['先別急著走，我再挪一點預算。你看看這樣能不能談成。', '我確實想收，最後再替你爭取一點，你也考慮一下。', '買賣不成仁義在，但我們還有機會，我再補。']);
      } else if (topic === 'raise') {
        reason = say(state, ['想高一點可以，但我也得留利潤。我們慢慢靠近。', '加太多我吃不消。我先補一點，你再降一點。', '好，我再加一點誠意，你也讓一點。']);
      } else {
        reason = say(state, ['一口氣加太多我吃不消。我先補一點，你願意降多少？', '我也要留轉手空間。這次再加一些，換你給點誠意？', '我們慢慢靠近，你的期待我知道了，我先往上挪一點。', '這是我的新報價。你覺得離你的目標還有多遠？']);
      }
      const ending = getCounterEnding(state, next);
      return { action: 'counter', price: next, message: `${reason} ${ending}` };
    }
  };

  if (typeof window !== 'undefined') window.SellCardAI = SellCardAI;
})();
