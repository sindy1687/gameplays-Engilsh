// ====== 單字分類拉霸遊戲 JavaScript ======

// 遊戲狀態
let gameState = {
    streak: 0,
    combo: 0,
    soundEnabled: true,
    ttsEnabled: true,
    isSpinning: false,
    todayCoins: 0,
    todayGames: 0
};

// 金幣系統實例
let coinSystem;

// 當前遊戲系列（分類）
let currentSeries = null;

// 從 cards.js 取得卡片資料
function getCardsData() {
    // 優先使用 allCards，如果沒有則使用 baseCards
    const cards = window.allCards || window.baseCards || [];
    console.log('📋 卡片資料載入狀態:', {
        allCards: window.allCards ? window.allCards.length : 'undefined',
        baseCards: window.baseCards ? window.baseCards.length : 'undefined',
        finalCards: cards.length
    });
    return cards;
}

// 取得所有分類
function getAllCategories() {
    const cards = getCardsData();
    if (!cards || cards.length === 0) {
        console.warn('無法取得卡片資料，使用預設分類');
        return ['fruit', 'animal', 'transport', 'food', 'color', 'clothing'];
    }
    
    const categories = [...new Set(cards.map(card => card.category))];
    return categories.filter(category => category && category.trim() !== '');
}

// 隨機選一個分類
function getRandomCategory() {
    const categories = getAllCategories();
    return categories[Math.floor(Math.random() * categories.length)];
}

// 從指定分類隨機抽一張卡
function getRandomCardByCategory(category) {
    const cards = getCardsData();
    if (!cards || cards.length === 0) {
        return getDefaultWord(category);
    }
    
    const categoryCards = cards.filter(card => card.category === category);
    if (categoryCards.length === 0) {
        return getDefaultWord(category);
    }
    
    const randomCard = categoryCards[Math.floor(Math.random() * categoryCards.length)];
    
    return {
        word: randomCard.word || randomCard.en || randomCard.name || 'Unknown',
        category: randomCard.category,
        image: randomCard.image || randomCard.media || randomCard.video || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop',
        zh: randomCard.zh || randomCard.name || '未知'
    };
}

// 預設單字（當無法取得卡片資料時使用）
function getDefaultWord(category) {
    const defaultWords = {
        fruit: { word: "apple", category: "fruit", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop", zh: "蘋果" },
        animal: { word: "cat", category: "animal", image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop", zh: "貓" },
        transport: { word: "car", category: "transport", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=200&h=200&fit=crop", zh: "汽車" },
        food: { word: "pizza", category: "food", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop", zh: "披薩" },
        color: { word: "red", category: "color", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=200&h=200&fit=crop", zh: "紅色" },
        clothing: { word: "shirt", category: "clothing", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop", zh: "襯衫" }
    };
    
    return defaultWords[category] || defaultWords.fruit;
}

// 分類中文名稱對照（動態生成）
function getCategoryNames() {
    const categories = getAllCategories();
    const categoryNames = {};
    
    categories.forEach(category => {
        // 嘗試從卡片資料中取得中文名稱
        const cards = getCardsData();
        const categoryCard = cards.find(card => card.category === category);
        
        if (categoryCard && categoryCard.categoryZh) {
            categoryNames[category] = categoryCard.categoryZh;
        } else {
            // 預設中文名稱
            const defaultNames = {
                fruit: "水果", animal: "動物", transport: "交通工具", 
                food: "食物", color: "顏色", clothing: "衣物"
            };
            categoryNames[category] = defaultNames[category] || category;
        }
    });
    
    return categoryNames;
}

// 隨機取得單字（從隨機分類中抽選）
function getRandomWord() {
    const randomCategory = getRandomCategory();
    return getRandomCardByCategory(randomCategory);
}

// DOM 元素
const elements = {
    spinBtn: document.getElementById('spinBtn'),
    totalCoins: document.getElementById('totalCoins'),
    streak: document.getElementById('streak'),
    todayGames: document.getElementById('todayGames'),
    resultText: document.getElementById('result-text'),
    categoryInfo: document.getElementById('category-info'),
    currentCategory: document.getElementById('currentCategory'),
    soundToggle: document.getElementById('soundToggle'),
    ttsToggle: document.getElementById('ttsToggle'),
    exchangeBtn: document.getElementById('exchangeBtn'),
    slots: [
        { element: document.getElementById('slot1'), img: document.getElementById('img1'), word: document.getElementById('word1') },
        { element: document.getElementById('slot2'), img: document.getElementById('img2'), word: document.getElementById('word2') },
        { element: document.getElementById('slot3'), img: document.getElementById('img3'), word: document.getElementById('word3') }
    ],
    audio: {
        spin: document.getElementById('spinSound'),
        correct: document.getElementById('correctSound'),
        wrong: document.getElementById('wrongSound'),
        combo: document.getElementById('comboSound'),
        winning: document.getElementById('winningSound'),
        bonus: document.getElementById('bonusSound'),
        lose: document.getElementById('loseSound')
    }
};

// 初始化遊戲
function initGame() {
    loadGameData();
    updateDisplay();
    setupEventListeners();
    
    // 初始化槽位內容
    initializeSlots();
    
    // 初始化金幣系統
    coinSystem = new CoinSystem();
    
    // 更新星星顯示
    StarRewardSystem.updateStarsDisplay();
    
    // 更新金幣顯示
    updateCoinsDisplay();
    
    // 等待卡片資料載入完成後再設定分類
    setTimeout(() => {
        const categories = getAllCategories();
        const cards = getCardsData();
        console.log('🔄 嘗試載入分類...', { categories, cardsLength: cards.length });
        
        if (categories.length > 0) {
            currentSeries = categories[Math.floor(Math.random() * categories.length)];
        } else {
            currentSeries = 'fruit';
        }
        
        // 顯示可用的分類數量
        const categoryNames = getCategoryNames();
        const currentSeriesName = categoryNames[currentSeries] || currentSeries;
        elements.currentCategory.textContent = currentSeriesName;
        
        console.log(`🎮 單字分類拉霸遊戲已啟動！`);
        console.log(`📚 可用分類：${categories.length} 個`);
        console.log(`🎯 分類列表：`, categories);
        console.log(`📋 卡片總數：${cards.length} 張`);
        console.log(`⭐ 本次遊戲系列：${currentSeries} (${currentSeriesName})`);
        if (cards.length > 0) {
            console.log(`🔍 第一張卡片結構：`, cards[0]);
        }
        
        // 如果還是沒有分類，再試一次
        if (categories.length === 0) {
            setTimeout(() => {
                console.log('🔄 重試載入分類...');
                const retryCategories = getAllCategories();
                const retryCards = getCardsData();
                console.log('🔄 重試結果:', { retryCategories, retryCardsLength: retryCards.length });
                
                if (retryCategories.length > 0) {
                    currentSeries = retryCategories[Math.floor(Math.random() * retryCategories.length)];
                    const retryCategoryNames = getCategoryNames();
                    const retryCurrentSeriesName = retryCategoryNames[currentSeries] || currentSeries;
                    elements.currentCategory.textContent = retryCurrentSeriesName;
                    console.log(`✅ 重試成功！當前分類：${currentSeries} (${retryCurrentSeriesName})`);
                } else {
                    console.log('❌ 重試失敗，使用預設分類');
                    elements.currentCategory.textContent = '水果';
                }
            }, 500);
        }
    }, 100); // 等待 100ms 確保 cards.js 已載入
}

// 初始化槽位
function initializeSlots() {
    elements.slots.forEach((slot, index) => {
        slot.img.src = 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop';
        slot.img.alt = 'Ready';
        slot.word.textContent = 'Ready';
    });
}

// 載入遊戲資料
function loadGameData() {
    try {
        const data = JSON.parse(localStorage.getItem('wordSpinGameData')) || {};
        gameState.streak = data.streak || 0;
        gameState.combo = data.combo || 0;
        gameState.soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
        gameState.ttsEnabled = data.ttsEnabled !== undefined ? data.ttsEnabled : true;
        gameState.todayCoins = data.todayCoins || 0;
        gameState.todayGames = data.todayGames || 0;
        
        // 檢查是否需要重置今日統計（新的一天）
        const lastPlayDate = data.lastPlayDate;
        const today = new Date().toDateString();
        if (lastPlayDate !== today) {
            gameState.todayCoins = 0;
            gameState.todayGames = 0;
            console.log('📅 新的一天，重置今日統計');
        }
        
        console.log('📊 遊戲資料載入完成:', gameState);
    } catch (error) {
        console.log('載入遊戲資料失敗:', error);
    }
}

// 保存遊戲資料
function saveGameData() {
    try {
        const data = {
            streak: gameState.streak,
            combo: gameState.combo,
            soundEnabled: gameState.soundEnabled,
            ttsEnabled: gameState.ttsEnabled,
            todayCoins: gameState.todayCoins,
            todayGames: gameState.todayGames,
            lastPlayDate: new Date().toDateString()
        };
        localStorage.setItem('wordSpinGameData', JSON.stringify(data));
        console.log('💾 遊戲資料保存完成:', data);
    } catch (error) {
        console.log('保存遊戲資料失敗:', error);
    }
}

// 更新顯示
function updateDisplay() {
    // 更新金幣統計
    if (coinSystem) {
        elements.totalCoins.textContent = coinSystem.getCoins();
    }
    
    // 更新遊戲統計
    elements.streak.textContent = gameState.streak;
    elements.todayGames.textContent = gameState.todayGames;
    
    // 更新音效按鈕狀態
    elements.soundToggle.textContent = gameState.soundEnabled ? '🔊' : '🔇';
    elements.soundToggle.classList.toggle('active', gameState.soundEnabled);
    
    elements.ttsToggle.textContent = gameState.ttsEnabled ? '🔤' : '🔇';
    elements.ttsToggle.classList.toggle('active', gameState.ttsEnabled);
    
    // 更新SPIN按鈕
    updateSpinButton();
}

// 設定事件監聽器
function setupEventListeners() {
    elements.spinBtn.addEventListener('click', spin);
    elements.soundToggle.addEventListener('click', toggleSound);
    elements.ttsToggle.addEventListener('click', toggleTTS);
    elements.exchangeBtn.addEventListener('click', showExchangeShop);
    
    // 返回首頁按鈕事件
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            // 確認是否要返回首頁
            if (confirm('確定要返回首頁嗎？')) {
                window.location.href = 'index.html';
            }
        });
    }
    
    // 鍵盤快捷鍵
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !gameState.isSpinning) {
            e.preventDefault();
            spin();
        }
    });
}

// 播放音效
function playSound(soundType) {
    if (!gameState.soundEnabled) return;
    
    const audio = elements.audio[soundType];
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('音效播放失敗:', e));
    }
}

// 文字轉語音
function speakWord(word) {
    if (!gameState.ttsEnabled) return;
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 1.2; // 調快語速
        speechSynthesis.speak(utterance);
    }
}

// 切換音效
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    updateDisplay();
    saveGameData();
}

// 切換 TTS
function toggleTTS() {
    gameState.ttsEnabled = !gameState.ttsEnabled;
    updateDisplay();
    saveGameData();
}

// 設定槽位內容（slotIndex: 0~2, wordData: 單字物件）
function setSlot(slotIndex, wordData) {
    const slot = elements.slots[slotIndex];
    const slotInner = slot.element.querySelector('.slot-inner');
    const oldItem = slotInner.querySelector('.slot-item');

    // 建立新 slot-item
    const newItem = document.createElement('div');
    newItem.className = 'slot-item';
    let mediaEl;
    if (wordData.image && wordData.image.match(/\.mp4($|\?)/i)) {
        // mp4 用 video
        mediaEl = document.createElement('video');
        mediaEl.src = wordData.image;
        mediaEl.autoplay = false; // 不自動播放
        mediaEl.loop = true;
        mediaEl.muted = true;
        mediaEl.playsInline = true;
        mediaEl.className = 'card-media';
        mediaEl.style.width = '100%';
        mediaEl.style.height = '150px';
        mediaEl.style.objectFit = 'cover';
        mediaEl.style.borderRadius = '15px';
    } else {
        // 否則用 img
        mediaEl = document.createElement('img');
        mediaEl.src = wordData.image;
        mediaEl.alt = wordData.word;
        mediaEl.style.width = '100%';
        mediaEl.style.height = '150px';
        mediaEl.style.objectFit = 'cover';
        mediaEl.style.borderRadius = '15px';
    }
    newItem.appendChild(mediaEl);
    const span = document.createElement('span');
    span.className = 'word-text';
    span.textContent = wordData.word;
    newItem.appendChild(span);

    // 插入新 slot-item 在上方
    slotInner.insertBefore(newItem, oldItem);
    // slot-inner 初始位置在 -220px（新內容在上方）
    slotInner.style.transform = 'translateY(-220px)';
    // 啟動滑動動畫
    setTimeout(() => {
        slotInner.classList.add('sliding');
        slotInner.style.transform = 'translateY(0)';
    }, 10);

    // 動畫結束後，移除舊的 slot-item，重設位置
    setTimeout(() => {
        slotInner.classList.remove('sliding');
        slotInner.style.transform = '';
        if (oldItem) slotInner.removeChild(oldItem);
    }, 510);
}

// slot 跳動動畫
function setSlotWithSpin(slotIndex, finalWordData, spinCount, spinDelay) {
    const slot = elements.slots[slotIndex];
    const slotInner = slot.element.querySelector('.slot-inner');
    const categoryCards = getCardsData().filter(card => card.category === finalWordData.category);

    let currentSpin = 0;
    
    // 開始播放轉動音效（持續播放）
    const winningAudio = elements.audio.winning;
    if (winningAudio && gameState.soundEnabled) {
        winningAudio.loop = true;
        winningAudio.currentTime = 0;
        winningAudio.play().catch(e => console.log('轉動音效播放失敗:', e));
    }
    
    function spinStep() {
        let wordData;
        if (currentSpin < spinCount) {
            // 跳動時顯示隨機卡片
            const randomCard = categoryCards[Math.floor(Math.random() * categoryCards.length)];
            wordData = {
                word: randomCard.word || randomCard.en || randomCard.name || 'Unknown',
                category: randomCard.category,
                image: randomCard.image || randomCard.media || randomCard.video || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop',
                zh: randomCard.zh || randomCard.name || '未知'
            };
        } else {
            // 最後一張顯示真正的卡片
            wordData = finalWordData;
            // 停止轉動音效
            if (winningAudio) {
                winningAudio.pause();
                winningAudio.currentTime = 0;
            }
        }
        // 執行 slot 動畫
        setSlot(slotIndex, wordData);
        currentSpin++;
        if (currentSpin <= spinCount) {
            setTimeout(spinStep, spinDelay);
        }
    }
    spinStep();
}

// 檢查配對（必須三張卡片 word 完全一樣才算成功）
function checkMatch(selectedWords) {
    if (selectedWords.length !== 3) {
        console.log('❌ 卡片數量不正確:', selectedWords.length);
        return false;
    }
    
    const words = selectedWords.map(word => word.word);
    const firstWord = words[0];
    const isMatch = words.every(w => w === firstWord);
    
    console.log('🎯 配對檢查:', {
        words: words,
        firstWord: firstWord,
        isMatch: isMatch,
        allSame: words.every(w => w === firstWord)
    });
    
    return isMatch;
}

// 計算得分
function calculateScore(isMatch, combo) {
    if (!isMatch) {
        gameState.combo = 0;
        return 0;
    }
    
    gameState.combo++;
    const baseScore = 1;
    const comboBonus = Math.floor(gameState.combo / 2) * 2;
    return baseScore + comboBonus;
}



// 計算金幣獎勵
function calculateCoinReward(word) {
    // 基礎獎勵：配對成功獲得1000金幣
    let baseReward = 1000;
    
    // 根據 combo 給予 BONUS 倍數
    let bonusMultiplier = 1;
    if (gameState.combo > 1) {
        // 每個 BONUS 增加三倍（更慷慨的獎勵）
        bonusMultiplier = Math.pow(3, gameState.combo - 1);
    }
    
    // 根據單字長度給予額外獎勵
    if (word.length >= 10) {
        baseReward += 500; // 超長單字額外獎勵
    }
    
    const finalReward = baseReward * bonusMultiplier;
    
    console.log(`🪙 金幣計算: 基礎${baseReward} × BONUS${bonusMultiplier}倍 = ${finalReward}金幣`);
    
    return finalReward;
}

// 更新 Combo 顯示
function updateComboDisplay() {
    if (gameState.combo > 1) {
        elements.comboText.textContent = `🔥 Combo ${gameState.combo}! +${Math.floor(gameState.combo / 2) * 2}分`;
        elements.comboText.style.display = 'block';
    } else {
        elements.comboText.style.display = 'none';
    }
}

// 更新金幣顯示
function updateCoinsDisplay() {
    const coinsCount = document.getElementById('totalCoinsCount');
    if (coinsCount && coinSystem) {
        const totalCoins = coinSystem.getCoins();
        coinsCount.textContent = `🪙 ${totalCoins}`;
        console.log('🪙 金幣數已更新:', totalCoins);
    }
    // 同時更新SPIN按鈕
    updateSpinButton();
}

// 更新SPIN按鈕
function updateSpinButton() {
    if (elements.spinBtn && coinSystem) {
        const currentCoins = coinSystem.getCoins();
        const canPlay = currentCoins >= 5000;
        
        if (canPlay) {
            elements.spinBtn.querySelector('.button-text').textContent = `🎰 SPIN! (5000🪙)`;
            elements.spinBtn.disabled = false;
            elements.spinBtn.classList.remove('disabled');
        } else {
            elements.spinBtn.querySelector('.button-text').textContent = `🎰 SPIN! (需要5000🪙)`;
            elements.spinBtn.disabled = true;
            elements.spinBtn.classList.add('disabled');
        }
    }
}

// 顯示金幣獎勵動畫
function showCoinReward(coins, combo) {
    const rewardDiv = document.createElement('div');
    rewardDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(255, 193, 7, 0.95), rgba(255, 152, 0, 0.95));
        color: #000;
        padding: 20px 30px;
        border-radius: 15px;
        font-size: 1.5rem;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 0 30px rgba(255, 193, 7, 0.8);
        animation: coinRewardPop 3s cubic-bezier(.4,2,.6,1) forwards;
        font-family: 'Orbitron', sans-serif;
        text-align: center;
    `;
    
    const bonusText = combo > 1 ? `<br><span style="font-size: 1.2rem; color: #ff6b6b;">🔥 BONUS ${Math.pow(3, combo - 1)}倍！</span>` : '';
    rewardDiv.innerHTML = `🪙 +${coins} 金幣${bonusText}`;
    
    // 添加動畫樣式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes coinRewardPop {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(rewardDiv);
    
    // 3秒後移除
    setTimeout(() => {
        if (document.body.contains(rewardDiv)) {
            document.body.removeChild(rewardDiv);
        }
    }, 3000);
}

// 顯示結果
function showResult(matchResult, score) {
    const { isMatch, categoryName } = matchResult;
    
    elements.resultText.textContent = isMatch ? 
        `🎉 配對成功！` : 
        `❌ 配對失敗`;
    
    elements.resultText.className = `result-text ${isMatch ? 'success' : 'failure'}`;
    
    elements.categoryInfo.textContent = isMatch ? 
        `類別：${categoryName}` : 
        '再試一次吧！';
    
    // 清除結果顯示
    setTimeout(() => {
        elements.resultText.textContent = '';
        elements.categoryInfo.textContent = '';
        elements.resultText.className = 'result-text';
    }, 3000);
}

// 主要拉霸功能
function spin() {
    if (gameState.isSpinning) return;
    
    // 檢查金幣是否足夠
    if (!coinSystem || coinSystem.getCoins() < 5000) {
        alert('❌ 金幣不足！每次遊戲需要5000金幣。');
        return;
    }
    
    // 扣除遊戲費用
    coinSystem.useCoins(5000);
    updateCoinsDisplay();
    
    // 增加今日遊戲次數
    gameState.todayGames++;
    
    gameState.isSpinning = true;
    elements.spinBtn.disabled = true;
    elements.spinBtn.classList.add('loading');
    playSound('spin');
    
    // 確保有選定的分類
    if (!currentSeries) {
        const categories = getAllCategories();
        currentSeries = categories[Math.floor(Math.random() * categories.length)];
    }
    
    console.log(`🎰 開始拉霸！當前分類：${currentSeries}`);
    
    // 決定是否要配對成功（60% 機率）
    const shouldMatch = Math.random() < 0.6;
    let sameCard;
    
    if (shouldMatch) {
        // 強制配對成功：選擇同一張卡片
        const categoryCards = getCardsData().filter(card => card.category === currentSeries);
        if (categoryCards.length > 0) {
            const randomCard = categoryCards[Math.floor(Math.random() * categoryCards.length)];
            sameCard = {
                word: randomCard.word || randomCard.en || randomCard.name || 'Unknown',
                category: randomCard.category,
                image: randomCard.image || randomCard.media || randomCard.video || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop',
                zh: randomCard.zh || randomCard.name || '未知'
            };
        }
    }
    
    // 選擇三張卡片
    const selectedWords = [];
    for (let i = 0; i < 3; i++) {
        let wordData;
        if (shouldMatch && sameCard) {
            // 配對成功：使用同一張卡片（三張完全一樣）
            wordData = sameCard;
        } else {
            // 配對失敗：隨機選擇不同卡片
            wordData = getRandomCardByCategory(currentSeries);
        }
        selectedWords.push(wordData);
    }
    
    console.log('🎯 選擇的卡片:', selectedWords.map(w => w.word));
    
    // 設定轉動參數
    const spinCounts = [15, 20, 25]; // 每個槽位跳動次數
    const spinDelays = [120, 140, 160]; // 每個槽位的延遲時間
    
    // 開始轉動動畫
    selectedWords.forEach((wordData, index) => {
        setTimeout(() => {
            setSlotWithSpin(index, wordData, spinCounts[index], spinDelays[index]);
        }, index * 200); // 每個槽位延遲 200ms 開始
    });
    
    // 等待所有動畫完成後檢查結果
    const totalAnimationTime = Math.max(...spinCounts.map((count, index) => 
        (count * spinDelays[index]) + (index * 200)
    ));
    
    setTimeout(() => {
        // 檢查是否配對成功（三張完全一樣）
        const isMatch = checkMatch(selectedWords);
        
        if (isMatch) {
            // 配對成功（三張完全一樣）
            gameState.combo++;
            gameState.streak++;
            
            // 計算金幣獎勵
            const coinsEarned = calculateCoinReward(selectedWords[0].word);
            
            // 增加今日金幣統計
            gameState.todayCoins += coinsEarned;
            
            // 只給予金幣獎勵
            coinSystem.addCoins(coinsEarned);
            
            // 顯示結果
            showResult('success', coinsEarned);
            showCoinReward(coinsEarned, gameState.combo);
            
            // 播放音效
            playSound('bonus');
            
            // 唸出單字
            speakWord(selectedWords[0].word);
            
            console.log(`🎉 配對成功！三張完全一樣！獲得 ${coinsEarned} 金幣`);
        } else {
            // 配對失敗（三張不完全一樣）
            gameState.combo = 0;
            gameState.streak = 0;
            
            // 顯示結果
            showResult('failure', 0);
            
            // 播放音效
            playSound('lose');
            
            console.log('❌ 配對失敗：三張卡片不完全一樣');
        }
        
        // 更新顯示
        updateDisplay();
        
        // 保存遊戲資料
        saveGameData();
        
        // 重新啟用按鈕（延遲 2 秒讓 TTS 完成）
        setTimeout(() => {
            gameState.isSpinning = false;
            elements.spinBtn.disabled = false;
            elements.spinBtn.classList.remove('loading');
        }, 2000);
        
    }, totalAnimationTime + 500);
}

// 顯示兌換商城
function showExchangeShop() {
    // 獲取所有星星系統的總星星
    let totalStars = 0;
    
    // 從 StarRewardSystem 獲取星星
    if (window.StarRewardSystem) {
        totalStars += window.StarRewardSystem.getStars();
    }
    
    // 從 localStorage 獲取其他星星系統的星星
    try {
        const savedStars = localStorage.getItem('totalStars');
        if (savedStars) {
            totalStars += parseInt(savedStars);
        }
    } catch (error) {
        console.log('載入其他星星系統失敗:', error);
    }
    
    const currentCoins = coinSystem ? coinSystem.getCoins() : 0;
    
    // 建立商城模態框
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(10px);
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95));
            border: 2px solid #a259ff;
            border-radius: 25px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(20px);
        ">
            <h2 style="
                color: #a259ff;
                font-size: 2rem;
                margin-bottom: 20px;
                text-shadow: 0 0 20px #a259ff;
                font-family: 'Orbitron', monospace;
            ">⭐ 全星星兌換商城</h2>
            
            <div style="
                display: flex;
                justify-content: space-around;
                margin: 20px 0;
                padding: 15px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
            ">
                <div>
                    <div style="font-size: 1.5rem;">⭐</div>
                    <div style="color: #ffffff; font-size: 1.2rem;">${totalStars}</div>
                    <div style="color: #cccccc; font-size: 0.9rem;">總星星</div>
                </div>
                <div>
                    <div style="font-size: 1.5rem;">🪙</div>
                    <div style="color: #ffffff; font-size: 1.2rem;">${currentCoins}</div>
                    <div style="color: #cccccc; font-size: 0.9rem;">金幣</div>
                </div>
            </div>
            
            <div style="margin: 20px 0;">
                <!-- 星星換金幣區域 -->
                <div style="margin-bottom: 30px;">
                    <h3 style="
                        color: #ff6b35;
                        font-size: 1.3rem;
                        margin-bottom: 15px;
                        text-align: center;
                        font-family: 'Orbitron', monospace;
                    ">⭐ 星星換金幣</h3>
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 10px;
                    ">
                        <button id="starToCoin1Btn" style="
                            background: linear-gradient(135deg, #ff6b35, #f7931e);
                            border: none;
                            border-radius: 12px;
                            padding: 12px 15px;
                            font-size: 0.9rem;
                            color: white;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            font-family: 'Orbitron', monospace;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 3px;
                        ">
                            <div>⭐ 1星星</div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">= 500🪙</div>
                        </button>
                        
                        <button id="starToCoin10Btn" style="
                            background: linear-gradient(135deg, #a259ff, #7c3aed);
                            border: none;
                            border-radius: 12px;
                            padding: 12px 15px;
                            font-size: 0.9rem;
                            color: white;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            font-family: 'Orbitron', monospace;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 3px;
                        ">
                            <div>⭐ 10星星</div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">= 5000🪙</div>
                        </button>
                        
                        <button id="starToCoin20Btn" style="
                            background: linear-gradient(135deg, #10b981, #059669);
                            border: none;
                            border-radius: 12px;
                            padding: 12px 15px;
                            font-size: 0.9rem;
                            color: white;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            font-family: 'Orbitron', monospace;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 3px;
                        ">
                            <div>⭐ 20星星</div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">= 11000🪙</div>
                        </button>
                        
                        <button id="starToCoin50Btn" style="
                            background: linear-gradient(135deg, #f59e0b, #d97706);
                            border: none;
                            border-radius: 12px;
                            padding: 12px 15px;
                            font-size: 0.9rem;
                            color: white;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            font-family: 'Orbitron', monospace;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 3px;
                        ">
                            <div>⭐ 50星星</div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">= 30000🪙</div>
                        </button>
                    </div>
                </div>
                
                <!-- 金幣換星星區域 -->
                <div>
                    <h3 style="
                        color: #10b981;
                        font-size: 1.3rem;
                        margin-bottom: 15px;
                        text-align: center;
                        font-family: 'Orbitron', monospace;
                    ">🪙 金幣換星星</h3>
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 10px;
                    ">
                        <button id="coinToStar10Btn" style="
                            background: linear-gradient(135deg, #ff6b35, #f7931e);
                            border: none;
                            border-radius: 12px;
                            padding: 12px 15px;
                            font-size: 0.9rem;
                            color: white;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            font-family: 'Orbitron', monospace;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 3px;
                        ">
                            <div>🪙 1000萬金幣</div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">= ⭐ 10星星</div>
                        </button>
                        
                        <button id="coinToStar50Btn" style="
                            background: linear-gradient(135deg, #a259ff, #7c3aed);
                            border: none;
                            border-radius: 12px;
                            padding: 12px 15px;
                            font-size: 0.9rem;
                            color: white;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            font-family: 'Orbitron', monospace;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 3px;
                        ">
                            <div>🪙 5000萬金幣</div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">= ⭐ 50星星</div>
                        </button>
                        
                        <button id="coinToStar100Btn" style="
                            background: linear-gradient(135deg, #10b981, #059669);
                            border: none;
                            border-radius: 12px;
                            padding: 12px 15px;
                            font-size: 0.9rem;
                            color: white;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            font-family: 'Orbitron', monospace;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 3px;
                        ">
                            <div>🪙 1億金幣</div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">= ⭐ 100星星</div>
                        </button>
                        
                        <button id="coinToStar200Btn" style="
                            background: linear-gradient(135deg, #f59e0b, #d97706);
                            border: none;
                            border-radius: 12px;
                            padding: 12px 15px;
                            font-size: 0.9rem;
                            color: white;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            font-family: 'Orbitron', monospace;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 3px;
                        ">
                            <div>🪙 2億金幣</div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">= ⭐ 200星星</div>
                        </button>
                    </div>
                </div>
            </div>
            
            <div style="
                margin-top: 20px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 15px;
                color: #cccccc;
                font-size: 0.9rem;
            ">
                💡 提示：可以雙向兌換，星星換金幣或金幣換星星
            </div>
            
            <button id="closeShopBtn" style="
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid #a259ff;
                border-radius: 15px;
                padding: 10px 25px;
                font-size: 1rem;
                color: #a259ff;
                cursor: pointer;
                margin-top: 20px;
                transition: all 0.3s ease;
                font-family: 'Orbitron', monospace;
            ">關閉</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 星星換金幣函數
    function exchangeStarsToCoins(starAmount, coinAmount) {
        if (totalStars >= starAmount) {
            // 計算需要從各個系統扣除的星星
            let remainingStars = starAmount;
            
            // 優先從 StarRewardSystem 扣除星星
            if (window.StarRewardSystem && window.StarRewardSystem.getStars() > 0) {
                const currentStarRewardStars = window.StarRewardSystem.getStars();
                const deductFromStarReward = Math.min(remainingStars, currentStarRewardStars);
                window.StarRewardSystem.addStars(-deductFromStarReward);
                remainingStars -= deductFromStarReward;
            }
            
            // 如果還需要扣除星星，從 localStorage 扣除
            if (remainingStars > 0) {
                try {
                    const savedStars = localStorage.getItem('totalStars');
                    if (savedStars) {
                        const currentStars = parseInt(savedStars);
                        const deductFromLocalStorage = Math.min(remainingStars, currentStars);
                        if (deductFromLocalStorage > 0) {
                            window.StarSystem.setTotalStars((currentStars - deductFromLocalStorage).toString());
                        }
                    }
                } catch (error) {
                    console.log('扣除其他星星系統失敗:', error);
                }
            }
            
            // 增加金幣
            coinSystem.addCoins(coinAmount);
            
            // 更新顯示
            updateDisplay();
            
            // 顯示兌換成功訊息
            showExchangeNotification(coinAmount, false);
            
            // 重新計算總星星並更新商城顯示
            let newTotalStars = 0;
            if (window.StarRewardSystem) {
                newTotalStars += window.StarRewardSystem.getStars();
            }
            try {
                const savedStars = localStorage.getItem('totalStars');
                if (savedStars) {
                    newTotalStars += parseInt(savedStars);
                }
            } catch (error) {
                console.log('重新計算星星失敗:', error);
            }
            
            const starsDisplay = modal.querySelector('div:first-child div:nth-child(2) div:first-child div:nth-child(2)');
            const coinsDisplay = modal.querySelector('div:first-child div:nth-child(2) div:nth-child(2) div:nth-child(2)');
            if (starsDisplay) starsDisplay.textContent = newTotalStars;
            if (coinsDisplay) coinsDisplay.textContent = coinSystem.getCoins();
        } else {
            alert(`❌ 總星星不足！需要至少${starAmount}顆星星才能兌換。`);
        }
    }
    
    // 金幣換星星函數
    function exchangeCoinsToStars(coinAmount, starAmount) {
        const currentCoins = coinSystem.getCoins();
        if (currentCoins >= coinAmount) {
            // 扣除金幣
            coinSystem.useCoins(coinAmount);
            
            // 增加星星到 StarRewardSystem
            if (window.StarRewardSystem) {
                window.StarRewardSystem.addStars(starAmount);
            }
            
            // 更新顯示
            updateDisplay();
            
            // 顯示兌換成功訊息
            showExchangeNotification(starAmount, true);
            
            // 重新計算總星星並更新商城顯示
            let newTotalStars = 0;
            if (window.StarRewardSystem) {
                newTotalStars += window.StarRewardSystem.getStars();
            }
            try {
                const savedStars = localStorage.getItem('totalStars');
                if (savedStars) {
                    newTotalStars += parseInt(savedStars);
                }
            } catch (error) {
                console.log('重新計算星星失敗:', error);
            }
            
            const starsDisplay = modal.querySelector('div:first-child div:nth-child(2) div:first-child div:nth-child(2)');
            const coinsDisplay = modal.querySelector('div:first-child div:nth-child(2) div:nth-child(2) div:nth-child(2)');
            if (starsDisplay) starsDisplay.textContent = newTotalStars;
            if (coinsDisplay) coinsDisplay.textContent = coinSystem.getCoins();
        } else {
            alert(`❌ 金幣不足！需要至少${coinAmount.toLocaleString()}金幣才能兌換。`);
        }
    }
    
    // 星星換金幣按鈕事件
    const starToCoin1Btn = modal.querySelector('#starToCoin1Btn');
    const starToCoin10Btn = modal.querySelector('#starToCoin10Btn');
    const starToCoin20Btn = modal.querySelector('#starToCoin20Btn');
    const starToCoin50Btn = modal.querySelector('#starToCoin50Btn');
    
    starToCoin1Btn.addEventListener('click', () => exchangeStarsToCoins(1, 500));
    starToCoin10Btn.addEventListener('click', () => exchangeStarsToCoins(10, 5000));
    starToCoin20Btn.addEventListener('click', () => exchangeStarsToCoins(20, 11000));
    starToCoin50Btn.addEventListener('click', () => exchangeStarsToCoins(50, 30000));
    
    // 金幣換星星按鈕事件
    const coinToStar10Btn = modal.querySelector('#coinToStar10Btn');
    const coinToStar50Btn = modal.querySelector('#coinToStar50Btn');
    const coinToStar100Btn = modal.querySelector('#coinToStar100Btn');
    const coinToStar200Btn = modal.querySelector('#coinToStar200Btn');
    
    coinToStar10Btn.addEventListener('click', () => exchangeCoinsToStars(10000000, 10));
    coinToStar50Btn.addEventListener('click', () => exchangeCoinsToStars(50000000, 50));
    coinToStar100Btn.addEventListener('click', () => exchangeCoinsToStars(100000000, 100));
    coinToStar200Btn.addEventListener('click', () => exchangeCoinsToStars(200000000, 200));
    
    // 關閉按鈕事件
    const closeBtn = modal.querySelector('#closeShopBtn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 點擊背景關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// 顯示兌換成功通知
function showExchangeNotification(amount, isStarExchange = false) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(255, 193, 7, 0.95), rgba(255, 152, 0, 0.95));
        color: #000;
        padding: 20px 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(255, 193, 7, 0.5);
        z-index: 10001;
        font-weight: bold;
        font-size: 1.2rem;
        text-align: center;
        font-family: 'Orbitron', monospace;
        animation: exchangePop 0.5s ease-out;
    `;
    
    if (isStarExchange) {
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 2rem;">🪙➡️⭐</span>
                <div>
                    <div>金幣兌換成功！</div>
                    <div style="font-size: 1rem; opacity: 0.8;">獲得 ${amount} 星星</div>
                </div>
            </div>
        `;
    } else {
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 2rem;">⭐➡️🪙</span>
                <div>
                    <div>全星星兌換成功！</div>
                    <div style="font-size: 1rem; opacity: 0.8;">獲得 ${amount} 金幣</div>
                </div>
            </div>
        `;
    }
    
    // 加入動畫CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes exchangePop {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // 3秒後自動移除
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
        if (document.head.contains(style)) {
            document.head.removeChild(style);
        }
    }, 3000);
}

// 當頁面載入完成後初始化遊戲
document.addEventListener('DOMContentLoaded', function() {
    // 等待 cards.js 載入完成
    if (window.baseCards && window.baseCards.length > 0) {
        initGame();
    } else {
        // 如果 cards.js 還沒載入完成，等待一下再試
        setTimeout(() => {
            if (window.baseCards && window.baseCards.length > 0) {
                initGame();
            } else {
                console.warn('cards.js 載入失敗，使用預設資料');
                initGame();
            }
        }, 1000);
    }
});

// 導出遊戲功能供外部使用
window.WordSpinGame = {
    spin,
    toggleSound,
    toggleTTS,
    getGameState: () => ({ ...gameState }),
    resetGame: () => {
        gameState.score = 0;
        gameState.streak = 0;
        gameState.combo = 0;
        updateDisplay();
        saveGameData();
    },
    // 新增：取得可用分類
    getAvailableCategories: getAllCategories,
    // 新增：從指定分類抽卡
    getRandomCardByCategory: getRandomCardByCategory
}; 
