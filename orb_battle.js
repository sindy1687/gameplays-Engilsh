// Game Constants
const BOARD_ROWS = 5;
const BOARD_COLS = 6;
const ORB_TYPES = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];
const ORB_SYMBOLS = {
    fire: '🔥',
    water: '💧',
    wood: '🌿',
    light: '✦',
    dark: '☾',
    heart: '♥'
};
let DRAG_TIME = 8.0;
const MAX_CASCADE = 30;

// Battle Phases
const BattlePhase = {
    PLAYER_READY: 'player_ready',
    PLAYER_DRAGGING: 'player_dragging',
    MATCHING: 'matching',
    CASCADING: 'cascading',
    PLAYER_ATTACK: 'player_attack',
    ENEMY_ACTION: 'enemy_action',
    TURN_END: 'turn_end',
    VICTORY: 'victory',
    DEFEAT: 'defeat'
};

// Attribute Advantages
const ATTRIBUTE_ADVANTAGE = {
    fire: { strong: 'wood', weak: 'water' },
    water: { strong: 'fire', weak: 'wood' },
    wood: { strong: 'water', weak: 'fire' },
    light: { strong: 'dark', weak: 'dark' },
    dark: { strong: 'light', weak: 'light' },
    heart: { strong: null, weak: null }
};

// Game State
let gameState = {
    board: [],
    phase: BattlePhase.PLAYER_READY,
    combo: 0,
    maxCombo: 0,
    totalDamage: 0,
    turn: 1,
    playerHp: 15000,
    playerMaxHp: 15000,
    enemy: null,
    characters: [],
    isResolvingTurn: false,
    currentStage: null,
    stageRunId: null,
    battleFinished: false,
    isEnteringStage: false
};

// Drag State
let dragState = {
    isDragging: false,
    startCell: null,
    currentCell: null,
    lastCell: null,
    pointerId: null,
    timer: null,
    timeLeft: DRAG_TIME
};

// Orb ID Counter
let orbIdCounter = 0;

// Character Data
const characterTemplates = [
    {
        id: 'hero-fire',
        name: '火焰騎士',
        attribute: 'fire',
        hp: 3000,
        attack: 1500,
        recovery: 300,
        image: '',
        skill: {
            name: '火焰轉換',
            description: '將所有木符石轉成火符石。',
            cooldown: 5,
            currentCooldown: 5,
            type: 'convert',
            from: 'wood',
            to: 'fire'
        }
    },
    {
        id: 'hero-water',
        name: '水之祭司',
        attribute: 'water',
        hp: 2800,
        attack: 1400,
        recovery: 350,
        image: '',
        skill: null
    },
    {
        id: 'hero-wood',
        name: '森林弓手',
        attribute: 'wood',
        hp: 2600,
        attack: 1600,
        recovery: 250,
        image: '',
        skill: null
    },
    {
        id: 'hero-light',
        name: '光明守衛',
        attribute: 'light',
        hp: 3200,
        attack: 1300,
        recovery: 400,
        image: '',
        skill: null
    },
    {
        id: 'hero-dark',
        name: '暗影刺客',
        attribute: 'dark',
        hp: 2400,
        attack: 1700,
        recovery: 200,
        image: '',
        skill: null
    }
];

// Enemy Data
const enemyTemplate = {
    id: 'shadow-beast',
    name: '暗影魔獸',
    attribute: 'dark',
    maxHp: 30000,
    hp: 30000,
    attack: 2500,
    attackCooldown: 2,
    currentCooldown: 2,
    image: ''
};

// Initialize Game
function initGame(stageId = 'practice') {
    resetGameState();
    loadStage(stageId);
    loadTeam();
    generateBoard();
    renderBoard();
    renderCharacters();
    renderEnemy();
    renderBattleInfo();
    setupEventListeners();
}

// Load Stage Data
function loadStage(stageId) {
    const stage = getStageData(stageId);
    if (!stage) {
        console.error('關卡資料不存在:', stageId);
        return;
    }
    
    gameState.currentStage = stage;
    gameState.stageRunId = generateStageRunId();
    
    // 設定敵人資料
    gameState.enemy = JSON.parse(JSON.stringify(stage.boss));
    
    // 更新關卡資訊顯示
    document.querySelector('.stage-info').textContent = `${stage.icon} ${stage.name}`;
    
    // 更新操作時間
    DRAG_TIME = stage.moveTime;
}

// Load Team Data
function loadTeam() {
    const teamData = getActiveTeam();
    gameState.characters = [];
    
    // 使用 orb_battle_cards.js 的函式取得戰鬥卡片
    if (typeof getBattleCardsByIds === 'function') {
        gameState.characters = getBattleCardsByIds(teamData);
    }
    
    // 如果隊伍為空，使用預設測試角色
    if (gameState.characters.length === 0) {
        gameState.characters = characterTemplates.map(char => ({
            ...JSON.parse(JSON.stringify(char)),
            skill: char.skill ? {
                ...char.skill,
                currentCooldown: char.skill.cooldown
            } : null
        }));
    }
    
    // 計算玩家最大 HP
    gameState.playerMaxHp = gameState.characters.reduce((sum, char) => sum + char.hp, 0);
    gameState.playerHp = gameState.playerMaxHp;
}

// Generate Stage Run ID
function generateStageRunId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Reset Game State
function resetGameState() {
    gameState.board = [];
    gameState.phase = BattlePhase.PLAYER_READY;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.totalDamage = 0;
    gameState.turn = 1;
    gameState.playerHp = 15000;
    gameState.playerMaxHp = 15000;
    gameState.isResolvingTurn = false;
    gameState.battleFinished = false;
    gameState.isEnteringStage = false;
    
    // Reset drag state
    cancelDragging();
    
    // Clear active effects
    clearAllEffects();
}

// Generate Board
function generateBoard() {
    gameState.board = [];
    
    for (let row = 0; row < BOARD_ROWS; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < BOARD_COLS; col++) {
            let orbType;
            let attempts = 0;
            
            // Avoid initial matches
            do {
                orbType = ORB_TYPES[Math.floor(Math.random() * ORB_TYPES.length)];
                attempts++;
            } while (attempts < 10 && wouldCreateMatch(row, col, orbType));
            
            gameState.board[row][col] = createOrb(orbType);
        }
    }
}

// Check if placing orb would create match
function wouldCreateMatch(row, col, type) {
    // Check horizontal
    if (col >= 2) {
        if (gameState.board[row][col-1]?.type === type && 
            gameState.board[row][col-2]?.type === type) {
            return true;
        }
    }
    
    // Check vertical
    if (row >= 2) {
        if (gameState.board[row-1]?.[col]?.type === type && 
            gameState.board[row-2]?.[col]?.type === type) {
            return true;
        }
    }
    
    return false;
}

// Create Orb
function createOrb(type) {
    return {
        id: `orb-${orbIdCounter++}`,
        type: type,
        enhanced: false,
        locked: false,
        frozen: false,
        poison: false
    };
}

// Render Board
function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    
    for (let row = 0; row < BOARD_ROWS; row++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const orb = gameState.board[row][col];
            if (orb) {
                const orbEl = createOrbElement(orb);
                cell.appendChild(orbEl);
            }
            
            boardEl.appendChild(cell);
        }
    }
}

// Create Orb Element
function createOrbElement(orb) {
    const orbEl = document.createElement('div');
    orbEl.className = `orb ${orb.type}`;
    orbEl.textContent = ORB_SYMBOLS[orb.type];
    orbEl.dataset.orbId = orb.id;
    
    // Add special orb classes
    if (orb.poison) {
        orbEl.classList.add('poison');
    }
    
    if (orb.locked) {
        orbEl.classList.add('locked');
    }
    
    if (orb.hidden) {
        orbEl.classList.add('hidden');
    }
    
    return orbEl;
}

// Setup Event Listeners
function setupEventListeners() {
    const boardEl = document.getElementById('board');
    
    boardEl.addEventListener('pointerdown', handlePointerDown);
    boardEl.addEventListener('pointermove', handlePointerMove);
    boardEl.addEventListener('pointerup', handlePointerUp);
    boardEl.addEventListener('pointercancel', handlePointerCancel);
    
    // Character cards
    gameState.characters.forEach((char, index) => {
        const cardEl = document.getElementById(`char-${index}`);
        if (cardEl && char.skill) {
            cardEl.addEventListener('click', () => showSkillPanel(index));
        }
    });
    
    // Skill panel
    document.getElementById('skill-use-btn').addEventListener('click', useSkill);
    document.getElementById('skill-cancel-btn').addEventListener('click', hideSkillPanel);
    
    // Result buttons
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('return-btn').addEventListener('click', () => {
        window.location.href = 'game_center_simple.html';
    });
}

// Handle Pointer Down
function handlePointerDown(e) {
    if (gameState.phase !== BattlePhase.PLAYER_READY) return;
    
    const cell = e.target.closest('.cell');
    if (!cell) return;
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    if (!gameState.board[row][col]) return;
    
    dragState.isDragging = true;
    dragState.startCell = { row, col };
    dragState.currentCell = { row, col };
    dragState.lastCell = { row, col };
    dragState.pointerId = e.pointerId;
    dragState.timeLeft = DRAG_TIME;
    
    gameState.phase = BattlePhase.PLAYER_DRAGGING;
    
    const boardEl = document.getElementById('board');
    boardEl.setPointerCapture(e.pointerId);
    
    // Add dragging class
    const orbEl = cell.querySelector('.orb');
    if (orbEl) {
        orbEl.classList.add('dragging');
    }
    
    // Start timer
    startDragTimer();
    
    e.preventDefault();
}

// Handle Pointer Move
function handlePointerMove(e) {
    if (!dragState.isDragging) return;
    
    if (e.pointerId !== dragState.pointerId) return;
    
    e.preventDefault();
    
    // Use elementFromPoint instead of e.target
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element) return;
    
    const cell = element.closest('.cell');
    if (!cell) return;
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    if (isNaN(row) || isNaN(col)) return;
    
    if (row === dragState.currentCell.row && col === dragState.currentCell.col) return;
    
    // Check if adjacent
    if (isAdjacentCell(dragState.currentCell, { row, col })) {
        swapOrbs(dragState.currentCell, { row, col });
        dragState.lastCell = { ...dragState.currentCell };
        dragState.currentCell = { row, col };
    }
}

// Handle Pointer Up
function handlePointerUp(e) {
    if (!dragState.isDragging) return;
    
    if (e.pointerId !== dragState.pointerId) return;
    
    const boardEl = document.getElementById('board');
    boardEl.releasePointerCapture(e.pointerId);
    
    cancelDragging();
    
    // Start resolving turn
    resolveTurn();
}

// Handle Pointer Cancel
function handlePointerCancel(e) {
    cancelDragging();
}

// Cancel Dragging
function cancelDragging() {
    if (dragState.timer) {
        clearInterval(dragState.timer);
        dragState.timer = null;
    }
    
    if (dragState.isDragging && dragState.pointerId !== null) {
        const boardEl = document.getElementById('board');
        boardEl.releasePointerCapture(dragState.pointerId);
    }
    
    // Remove dragging class
    document.querySelectorAll('.orb.dragging').forEach(el => {
        el.classList.remove('dragging');
    });
    
    dragState.isDragging = false;
    dragState.startCell = null;
    dragState.currentCell = null;
    dragState.lastCell = null;
    dragState.pointerId = null;
    dragState.timeLeft = DRAG_TIME;
    
    updateTimerDisplay();
    
    if (gameState.phase === BattlePhase.PLAYER_DRAGGING) {
        gameState.phase = BattlePhase.PLAYER_READY;
    }
}

// Start Drag Timer
function startDragTimer() {
    updateTimerDisplay();
    
    dragState.timer = setInterval(() => {
        dragState.timeLeft -= 0.1;
        updateTimerDisplay();
        
        if (dragState.timeLeft <= 0) {
            cancelDragging();
            resolveTurn();
        }
    }, 100);
}

// Update Timer Display
function updateTimerDisplay() {
    const timerFill = document.getElementById('timer-fill');
    const timerText = document.getElementById('timer-text');
    
    const percentage = (dragState.timeLeft / DRAG_TIME) * 100;
    timerFill.style.width = `${percentage}%`;
    timerText.textContent = dragState.timeLeft.toFixed(1);
}

// Check if cells are adjacent
function isAdjacentCell(cell1, cell2) {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// Swap Orbs
function swapOrbs(cell1, cell2) {
    const temp = gameState.board[cell1.row][cell1.col];
    gameState.board[cell1.row][cell1.col] = gameState.board[cell2.row][cell2.col];
    gameState.board[cell2.row][cell2.col] = temp;
    
    // Update DOM for only these two cells
    updateCellDOM(cell1);
    updateCellDOM(cell2);
}

// Update Cell DOM
function updateCellDOM(cell) {
    const boardEl = document.getElementById('board');
    const cellEl = boardEl.children[cell.row * BOARD_COLS + cell.col];
    
    // Don't destroy DOM during drag - just update content
    const existingOrb = cellEl.querySelector('.orb');
    const wasDragging = existingOrb && existingOrb.classList.contains('dragging');
    
    cellEl.innerHTML = '';
    
    const orb = gameState.board[cell.row][cell.col];
    if (orb) {
        const orbEl = createOrbElement(orb);
        if (wasDragging || 
            (dragState.isDragging && 
             cell.row === dragState.currentCell.row && 
             cell.col === dragState.currentCell.col)) {
            orbEl.classList.add('dragging');
        }
        cellEl.appendChild(orbEl);
    }
}

// Resolve Turn
async function resolveTurn() {
    if (gameState.isResolvingTurn) return;
    gameState.isResolvingTurn = true;
    
    gameState.combo = 0;
    gameState.totalDamage = 0;
    
    await resolveMatches();
    await resolveCascades();
    await resolvePlayerAttack();
    await resolveEnemyTurn();
    
    endTurn();
    
    gameState.isResolvingTurn = false;
}

// Resolve Matches
async function resolveMatches() {
    gameState.phase = BattlePhase.MATCHING;
    
    const matches = findMatches();
    
    if (matches.length > 0) {
        // Track matched orb types for character attack
        trackMatchedOrbTypes(matches);
        
        await removeMatches(matches);
    }
}

// Find Matches
function findMatches() {
    const matches = [];
    const visited = new Set();
    
    for (let row = 0; row < BOARD_ROWS; row++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            const orb = gameState.board[row][col];
            if (!orb) continue;
            
            const key = `${row},${col}`;
            if (visited.has(key)) continue;
            
            const group = findConnectedGroup(row, col, orb.type, visited);
            
            if (group.length >= 3) {
                matches.push({
                    type: orb.type,
                    cells: group
                });
            }
        }
    }
    
    return matches;
}

// Find Connected Group
function findConnectedGroup(startRow, startCol, type, visited) {
    const group = [];
    const queue = [{ row: startRow, col: startCol }];
    const typeVisited = new Set();
    
    typeVisited.add(`${startRow},${startCol}`);
    
    while (queue.length > 0) {
        const { row, col } = queue.shift();
        group.push({ row, col });
        visited.add(`${row},${col}`);
        
        // Check all 4 directions
        const directions = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 }
        ];
        
        for (const dir of directions) {
            if (dir.row < 0 || dir.row >= BOARD_ROWS || 
                dir.col < 0 || dir.col >= BOARD_COLS) continue;
            
            const key = `${dir.row},${dir.col}`;
            if (typeVisited.has(key)) continue;
            
            const orb = gameState.board[dir.row][dir.col];
            if (orb && orb.type === type) {
                typeVisited.add(key);
                queue.push(dir);
            }
        }
    }
    
    return group;
}

// Remove Matches
async function removeMatches(matches) {
    gameState.combo += matches.length;
    
    if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
    }
    
    showComboAnimation(gameState.combo);
    renderBattleInfo();
    
    // Mark orbs as matched
    for (const match of matches) {
        for (const cell of match.cells) {
            const orb = gameState.board[cell.row][cell.col];
            if (orb) {
                const boardEl = document.getElementById('board');
                const cellEl = boardEl.children[cell.row * BOARD_COLS + cell.col];
                const orbEl = cellEl.querySelector('.orb');
                if (orbEl) {
                    orbEl.classList.add('matched');
                }
            }
        }
    }
    
    // Wait for animation
    await sleep(300);
    
    // Remove orbs from board
    for (const match of matches) {
        for (const cell of match.cells) {
            gameState.board[cell.row][cell.col] = null;
        }
    }
    
    renderBoard();
}

// Resolve Cascades
async function resolveCascades() {
    gameState.phase = BattlePhase.CASCADING;
    
    let cascadeCount = 0;
    let hasMatches = true;
    
    while (hasMatches && cascadeCount < MAX_CASCADE) {
        // Collapse board
        collapseBoard();
        
        // Fill empty cells
        fillEmptyCells();
        
        renderBoard();
        
        await sleep(200);
        
        // Check for new matches
        const matches = findMatches();
        
        if (matches.length > 0) {
            cascadeCount++;
            showComboAnimation(gameState.combo + matches.length, cascadeCount > 0);
            await removeMatches(matches);
        } else {
            hasMatches = false;
        }
    }
}

// Collapse Board
function collapseBoard() {
    for (let col = 0; col < BOARD_COLS; col++) {
        let writeRow = BOARD_ROWS - 1;
        
        for (let row = BOARD_ROWS - 1; row >= 0; row--) {
            if (gameState.board[row][col] !== null) {
                if (row !== writeRow) {
                    gameState.board[writeRow][col] = gameState.board[row][col];
                    gameState.board[row][col] = null;
                }
                writeRow--;
            }
        }
    }
}

// Fill Empty Cells
function fillEmptyCells() {
    for (let row = 0; row < BOARD_ROWS; row++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            if (gameState.board[row][col] === null) {
                const orbType = ORB_TYPES[Math.floor(Math.random() * ORB_TYPES.length)];
                gameState.board[row][col] = createOrb(orbType);
            }
        }
    }
}

// Resolve Player Attack
async function resolvePlayerAttack() {
    gameState.phase = BattlePhase.PLAYER_ATTACK;
    
    // Get matched orb types from this turn
    const matchedOrbTypes = gameState.matchedOrbTypes || [];
    
    // Find characters with matching attributes
    const attackingCharacters = gameState.characters.filter(char => 
        matchedOrbTypes.includes(char.attribute)
    );
    
    if (attackingCharacters.length === 0) {
        // No matching characters, no damage
        gameState.totalDamage = 0;
        return;
    }
    
    // Calculate damage from attacking characters
    let totalDamage = 0;
    
    for (const char of attackingCharacters) {
        // Base damage from character attack
        const charDamage = char.attack;
        
        // Combo multiplier
        const comboMultiplier = 1 + (gameState.combo - 1) * 0.25;
        
        // Apply combo multiplier
        const finalDamage = Math.floor(charDamage * comboMultiplier);
        
        totalDamage += finalDamage;
        
        // Play attack animation for this character
        const charIndex = gameState.characters.indexOf(char);
        playCharacterAttackAnimation(charIndex);
    }
    
    gameState.totalDamage = totalDamage;
    
    if (totalDamage > 0) {
        // Apply damage to enemy
        gameState.enemy.hp = Math.max(0, gameState.enemy.hp - totalDamage);
        updateEnemyHp();
        
        await sleep(500);
        
        // Check victory
        if (gameState.enemy.hp <= 0) {
            showVictory();
            return;
        }
    }
}

// Track matched orb types
function trackMatchedOrbTypes(matches) {
    gameState.matchedOrbTypes = [];
    
    for (const match of matches) {
        for (const cell of match.cells) {
            const orb = gameState.board[cell.row][cell.col];
            if (orb && orb.type && !gameState.matchedOrbTypes.includes(orb.type)) {
                gameState.matchedOrbTypes.push(orb.type);
            }
        }
    }
}

// Play character attack animation
function playCharacterAttackAnimation(charIndex) {
    const cardEl = document.getElementById(`char-${charIndex}`);
    if (!cardEl) return;
    
    // Add attacking class
    cardEl.classList.add('is-attacking');
    
    // Remove after animation
    setTimeout(() => {
        cardEl.classList.remove('is-attacking');
    }, 500);
}

// Resolve Enemy Turn
async function resolveEnemyTurn() {
    gameState.phase = BattlePhase.ENEMY_ACTION;
    
    // Check boss phase
    checkBossPhase();
    
    // Decrease cooldown
    gameState.enemy.currentCooldown--;
    
    if (gameState.enemy.currentCooldown <= 0) {
        // Execute boss skills
        await executeBossSkills();
        
        // Attack player
        const damage = calculateDamageWithDefense(gameState.enemy.attack);
        gameState.playerHp = Math.max(0, gameState.playerHp - damage);
        updatePlayerHp();
        
        await sleep(500);
        
        // Check defeat
        if (gameState.playerHp <= 0) {
            showDefeat();
            return;
        }
        
        // Reset cooldown
        gameState.enemy.currentCooldown = gameState.enemy.attackCooldown;
    }
    
    // Tick skill cooldowns
    tickSkillCooldowns();
    
    updateEnemyCooldown();
    renderCharacters();
}

// End Turn
function endTurn() {
    if (gameState.phase === BattlePhase.VICTORY || gameState.phase === BattlePhase.DEFEAT) {
        return;
    }
    
    gameState.phase = BattlePhase.TURN_END;
    gameState.turn++;
    
    document.getElementById('turn-display').textContent = gameState.turn;
    
    // Reset to player ready
    gameState.phase = BattlePhase.PLAYER_READY;
}

// Tick Skill Cooldowns
function tickSkillCooldowns() {
    gameState.characters.forEach(char => {
        if (char.skill && char.skill.currentCooldown > 0) {
            char.skill.currentCooldown--;
        }
    });
}

// Calculate Damage (for future use)
function calculateDamage(orbType, orbCount, combo) {
    const character = gameState.characters.find(c => c.attribute === orbType);
    if (!character) return 0;
    
    const orbMultiplier = 1 + (orbCount - 3) * 0.25;
    const comboMultiplier = 1 + (combo - 1) * 0.25;
    
    let damage = character.attack * orbMultiplier * comboMultiplier;
    
    // Attribute advantage
    if (gameState.enemy.attribute) {
        const advantage = ATTRIBUTE_ADVANTAGE[orbType];
        if (advantage) {
            if (advantage.strong === gameState.enemy.attribute) {
                damage *= 1.5;
            } else if (advantage.weak === gameState.enemy.attribute) {
                damage *= 0.5;
            }
        }
    }
    
    return Math.floor(damage);
}

// Calculate Recovery
function calculateRecovery(heartCount, combo) {
    const totalRecovery = gameState.characters.reduce((sum, char) => sum + char.recovery, 0);
    const heartMultiplier = 1 + (heartCount - 3) * 0.25;
    const comboMultiplier = 1 + (combo - 1) * 0.25;
    
    return Math.floor(totalRecovery * heartMultiplier * comboMultiplier);
}

// Render Characters
function renderCharacters() {
    gameState.characters.forEach((char, index) => {
        const cardEl = document.getElementById(`char-${index}`);
        if (!cardEl) return;
        
        cardEl.innerHTML = '';
        
        // 使用 orb_battle_cards.js 的 createCardMedia 函式
        let mediaEl;
        if (typeof createCardMedia === 'function') {
            mediaEl = createCardMedia(char, { autoplay: true, muted: true, loop: true, playsInline: true });
        } else {
            // 備用方案
            mediaEl = createMediaElement(char.image, char.attribute);
        }
        
        mediaEl.className = 'character-media';
        cardEl.appendChild(mediaEl);
        
        const infoEl = document.createElement('div');
        infoEl.className = 'character-info';
        
        const attrEl = document.createElement('div');
        attrEl.className = 'character-attribute';
        attrEl.textContent = ORB_SYMBOLS[char.attribute];
        infoEl.appendChild(attrEl);
        
        if (char.skill) {
            const cdEl = document.createElement('div');
            cdEl.className = 'character-cd';
            cdEl.textContent = char.skill.currentCooldown > 0 ? 
                `CD ${char.skill.currentCooldown}` : 'READY';
            infoEl.appendChild(cdEl);
        }
        
        cardEl.appendChild(infoEl);
        
        // 添加點擊事件
        cardEl.onclick = () => showCharacterModal(index);
    });
    
    // 設置 IntersectionObserver 優化 MP4 播放
    setupVideoObserver();
}

// IntersectionObserver for MP4 optimization
let videoObserver = null;

function setupVideoObserver() {
    // 清除舊的 observer
    if (videoObserver) {
        videoObserver.disconnect();
    }
    
    // 創建新的 observer
    videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if (video) {
                if (entry.isIntersecting) {
                    // 進入可視區域，播放影片
                    video.play().catch(() => {
                        // 自動播放失敗是正常的（瀏覽器政策）
                    });
                } else {
                    // 離開可視區域，暫停影片
                    video.pause();
                }
            }
        });
    }, {
        threshold: 0.1 // 10% 可見時觸發
    });
    
    // 觀察所有角色卡片
    for (let i = 0; i < 5; i++) {
        const cardEl = document.getElementById(`char-${i}`);
        if (cardEl) {
            videoObserver.observe(cardEl);
        }
    }
}

// 清理 observer
function cleanupVideoObserver() {
    if (videoObserver) {
        videoObserver.disconnect();
        videoObserver = null;
    }
}

// Character Modal
let currentModalCharacterIndex = null;

function showCharacterModal(index) {
    const char = gameState.characters[index];
    if (!char) return;
    
    currentModalCharacterIndex = index;
    
    // 填充資料
    document.getElementById('modal-name').textContent = char.name;
    
    const attrSymbol = typeof getAttributeSymbol === 'function' 
        ? getAttributeSymbol(char.attribute) 
        : ORB_SYMBOLS[char.attribute];
    const attrName = typeof getAttributeName === 'function' 
        ? getAttributeName(char.attribute) 
        : char.attribute;
    
    document.getElementById('modal-attribute').textContent = `${attrSymbol} ${attrName}`;
    document.getElementById('modal-rarity').textContent = char.rarity;
    document.getElementById('modal-hp').textContent = char.hp;
    document.getElementById('modal-attack').textContent = char.attack;
    document.getElementById('modal-recovery').textContent = char.recovery;
    
    // 技能
    const skillSection = document.getElementById('modal-skill-section');
    if (char.skill) {
        skillSection.style.display = 'block';
        document.getElementById('modal-skill-name').textContent = char.skill.name;
        document.getElementById('modal-skill-description').textContent = char.skill.description;
        document.getElementById('modal-skill-cd').textContent = `CD: ${char.skill.currentCooldown}`;
        
        const skillBtn = document.getElementById('modal-skill-btn');
        skillBtn.disabled = char.skill.currentCooldown > 0;
        skillBtn.textContent = char.skill.currentCooldown > 0 ? '冷卻中' : '使用技能';
    } else {
        skillSection.style.display = 'none';
    }
    
    // 隊長技能
    const leaderSkillSection = document.getElementById('modal-leader-skill-section');
    if (char.leaderSkill && index === 0) {
        leaderSkillSection.style.display = 'block';
        document.getElementById('modal-leader-skill-name').textContent = char.leaderSkill.name;
        document.getElementById('modal-leader-skill-description').textContent = char.leaderSkill.description;
    } else {
        leaderSkillSection.style.display = 'none';
    }
    
    // 媒體
    const mediaContainer = document.getElementById('modal-media');
    mediaContainer.innerHTML = '';
    if (typeof createCardMedia === 'function') {
        const mediaEl = createCardMedia(char, { autoplay: true, muted: true, loop: true, playsInline: true });
        mediaEl.style.width = '100%';
        mediaEl.style.height = '100%';
        mediaEl.style.objectFit = 'cover';
        mediaContainer.appendChild(mediaEl);
    }
    
    // 顯示彈窗
    document.getElementById('character-modal').style.display = 'flex';
}

function closeCharacterModal() {
    document.getElementById('character-modal').style.display = 'none';
    currentModalCharacterIndex = null;
}

function useCharacterSkill() {
    if (currentModalCharacterIndex === null) return;
    
    const char = gameState.characters[currentModalCharacterIndex];
    if (!char || !char.skill) return;
    
    if (char.skill.currentCooldown > 0) {
        alert('技能冷卻中！');
        return;
    }
    
    // 執行技能
    if (typeof executeSkill === 'function') {
        executeSkill(char.skill);
    }
    
    // 設定冷卻
    char.skill.currentCooldown = char.skill.cooldown;
    
    // 更新顯示
    renderCharacters();
    closeCharacterModal();
}

// Render Enemy
function renderEnemy() {
    const mediaEl = document.getElementById('enemy-media');
    mediaEl.innerHTML = '';
    
    const enemyMedia = createMediaElement(gameState.enemy.image, gameState.enemy.attribute);
    mediaEl.appendChild(enemyMedia);
    
    document.getElementById('enemy-name').textContent = gameState.enemy.name;
    updateEnemyHp();
    updateEnemyCooldown();
}

// Create Media Element (supports MP4, PNG, JPG, etc.)
function createMediaElement(imageSrc, attribute) {
    const container = document.createElement('div');
    
    if (!imageSrc) {
        // Use default symbol
        container.textContent = ORB_SYMBOLS[attribute] || '?';
        container.style.fontSize = '48px';
        return container;
    }
    
    const extension = imageSrc.split('.').pop().toLowerCase();
    
    if (extension === 'mp4') {
        const video = document.createElement('video');
        video.src = imageSrc;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        
        video.onerror = () => {
            container.textContent = ORB_SYMBOLS[attribute] || '?';
            container.style.fontSize = '48px';
            video.remove();
        };
        
        container.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = attribute;
        
        img.onerror = () => {
            container.textContent = ORB_SYMBOLS[attribute] || '?';
            container.style.fontSize = '48px';
            img.remove();
        };
        
        container.appendChild(img);
    }
    
    return container;
}

// Render Battle Info
function renderBattleInfo() {
    document.getElementById('combo-value').textContent = gameState.combo;
    document.getElementById('damage-value').textContent = gameState.totalDamage;
}

// Update Player HP
function updatePlayerHp() {
    const hpPercent = (gameState.playerHp / gameState.playerMaxHp) * 100;
    document.getElementById('player-hp-fill').style.width = `${hpPercent}%`;
    document.getElementById('player-hp').textContent = gameState.playerHp;
    document.getElementById('player-max-hp').textContent = gameState.playerMaxHp;
}

// Update Enemy HP
function updateEnemyHp() {
    const hpPercent = (gameState.enemy.hp / gameState.enemy.maxHp) * 100;
    document.getElementById('enemy-hp-fill').style.width = `${hpPercent}%`;
    document.getElementById('enemy-hp').textContent = gameState.enemy.hp;
    document.getElementById('enemy-max-hp').textContent = gameState.enemy.maxHp;
}

// Update Enemy Cooldown
function updateEnemyCooldown() {
    document.getElementById('enemy-cooldown-text').textContent = gameState.enemy.currentCooldown;
}

// Show Combo Animation
function showComboAnimation(combo, isSkyfall = false) {
    const animEl = document.getElementById('combo-animation');
    
    let text = `${combo} COMBO`;
    if (combo >= 5) text += '\nGREAT!';
    if (combo >= 8) text += '\nAMAZING!';
    if (isSkyfall) text += '\nSKYFALL!';
    
    animEl.textContent = text;
    animEl.style.animation = 'none';
    animEl.offsetHeight; // Trigger reflow
    animEl.style.animation = 'comboAnim 0.8s ease-out forwards';
}

// Show Skill Panel
function showSkillPanel(charIndex) {
    if (gameState.phase !== BattlePhase.PLAYER_READY) return;
    
    const char = gameState.characters[charIndex];
    if (!char || !char.skill) return;
    
    if (char.skill.currentCooldown > 0) return;
    
    document.getElementById('skill-title').textContent = char.skill.name;
    document.getElementById('skill-description').textContent = char.skill.description;
    document.getElementById('skill-cd').textContent = 'CD：READY';
    document.getElementById('skill-use-btn').disabled = false;
    document.getElementById('skill-use-btn').dataset.charIndex = charIndex;
    
    document.getElementById('skill-panel').style.display = 'block';
}

// Hide Skill Panel
function hideSkillPanel() {
    document.getElementById('skill-panel').style.display = 'none';
}

// Use Skill
function useSkill() {
    const charIndex = parseInt(document.getElementById('skill-use-btn').dataset.charIndex);
    const char = gameState.characters[charIndex];
    
    if (!char || !char.skill) return;
    
    // Apply skill effect
    if (char.skill.type === 'convert') {
        // Convert all orbs of one type to another
        for (let row = 0; row < BOARD_ROWS; row++) {
            for (let col = 0; col < BOARD_COLS; col++) {
                const orb = gameState.board[row][col];
                if (orb && orb.type === char.skill.from) {
                    orb.type = char.skill.to;
                }
            }
        }
        
        renderBoard();
    }
    
    // Set cooldown
    char.skill.currentCooldown = char.skill.cooldown;
    
    hideSkillPanel();
    renderCharacters();
}

// Show Victory
function showVictory() {
    if (gameState.battleFinished) return;
    gameState.battleFinished = true;
    
    gameState.phase = BattlePhase.VICTORY;
    
    // Record progress (only for non-practice stages)
    if (gameState.currentStage && gameState.currentStage.category !== 'practice') {
        const stageProgress = recordStageClear(
            gameState.currentStage.id,
            gameState.maxCombo,
            gameState.turn
        );
        
        // Award stars
        awardStageRewards(gameState.currentStage, stageProgress);
    }
    
    document.getElementById('result-title').textContent = 'VICTORY';
    document.getElementById('result-title').className = 'result-title victory';
    document.getElementById('result-max-combo').textContent = gameState.maxCombo;
    document.getElementById('result-total-damage').textContent = gameState.totalDamage;
    document.getElementById('result-turns').textContent = gameState.turn;
    
    document.getElementById('result-screen').style.display = 'flex';
}

// Award Stage Rewards
function awardStageRewards(stage, stageProgress) {
    if (!stage || stage.category === 'practice') return;
    
    let totalStars = 0;
    
    // First clear reward
    if (!stageProgress.firstClearRewardClaimed) {
        if (typeof StarSystem !== 'undefined' && StarSystem.addTotalStars) {
            StarSystem.addTotalStars(stage.rewards.firstClearStars, '首次通關獎勵');
        }
        claimFirstClearReward(stage.id);
        totalStars += stage.rewards.firstClearStars;
    }
    
    // Regular clear reward
    if (typeof StarSystem !== 'undefined' && StarSystem.addTotalStars) {
        StarSystem.addTotalStars(stage.rewards.clearStars, '通關獎勵');
    }
    totalStars += stage.rewards.clearStars;
    
    console.log(`獲得星星：${totalStars}`);
}

// Show Defeat
function showDefeat() {
    gameState.phase = BattlePhase.DEFEAT;
    
    document.getElementById('result-title').textContent = 'DEFEAT';
    document.getElementById('result-title').className = 'result-title defeat';
    document.getElementById('result-max-combo').textContent = gameState.maxCombo;
    document.getElementById('result-total-damage').textContent = gameState.totalDamage;
    document.getElementById('result-turns').textContent = gameState.turn;
    
    document.getElementById('result-screen').style.display = 'flex';
}

// Restart Game
function restartGame() {
    document.getElementById('result-screen').style.display = 'none';
    
    // If current stage is practice, just restart
    if (gameState.currentStage && gameState.currentStage.category === 'practice') {
        resetGameState();
        generateBoard();
        renderBoard();
        renderCharacters();
        renderEnemy();
        renderBattleInfo();
        return;
    }
    
    // For paid stages, require re-confirmation for entry fee
    if (gameState.currentStage && gameState.currentStage.entryCost > 0) {
        const confirmed = confirm(
            `重新挑戰需要再次支付 ⭐ ${gameState.currentStage.entryCost} 星星。\n\n確定重新挑戰嗎？`
        );
        
        if (!confirmed) {
            // Return to stage selection or game center
            window.location.href = 'game_center_simple.html';
            return;
        }
        
        // Re-check entry fee
        startGame(gameState.currentStage.id);
    } else {
        resetGameState();
        generateBoard();
        renderBoard();
        renderCharacters();
        renderEnemy();
        renderBattleInfo();
    }
}

// Start Game with Entry Fee Check
async function startGame(stageId = 'practice') {
    if (gameState.isEnteringStage) {
        console.log('正在進入關卡中...');
        return;
    }
    
    const stage = getStageData(stageId);
    if (!stage) {
        console.error('關卡不存在:', stageId);
        return;
    }
    
    // Check if stage is unlocked
    if (stage.category !== 'practice' && !isStageUnlocked(stageId)) {
        alert('此關卡尚未解鎖！請先完成上一關。');
        return;
    }
    
    // Check entry fee for non-practice stages
    if (stage.category !== 'practice' && stage.entryCost > 0) {
        const confirmed = confirm(
            `${stage.icon} ${stage.name}\n\n` +
            `入場費：⭐ ${stage.entryCost}\n\n` +
            `確定開始挑戰嗎？`
        );
        
        if (!confirmed) return;
        
        gameState.isEnteringStage = true;
        
        try {
            // Get current stars
            const currentStars = typeof StarSystem !== 'undefined' 
                ? StarSystem.getTotalStars() 
                : 0;
            
            // Check if enough stars
            if (currentStars < stage.entryCost) {
                alert(
                    `星星不足！\n\n` +
                    `需要：⭐ ${stage.entryCost}\n` +
                    `目前：⭐ ${currentStars}`
                );
                gameState.isEnteringStage = false;
                return;
            }
            
            // Deduct stars
            const result = typeof StarSystem !== 'undefined' 
                ? StarSystem.spendTotalStars(stage.entryCost, '關卡入場費')
                : null;
            
            if (!result || !result.ok) {
                alert('扣除星星失敗，請稍後再試。');
                gameState.isEnteringStage = false;
                return;
            }
            
            console.log(`扣除入場費：${stage.entryCost} 星星`);
            
        } catch (error) {
            console.error('扣除星星時發生錯誤:', error);
            alert('系統錯誤，請稍後再試。');
            gameState.isEnteringStage = false;
            return;
        }
    }
    
    // Start the game
    document.getElementById('start-screen').style.display = 'none';
    initGame(stageId);
    
    // Keep isEnteringStage true until game actually starts
    setTimeout(() => {
        gameState.isEnteringStage = false;
    }, 1000);
}

// Sleep utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Boss Phase System
let currentPhaseIndex = 0;

function checkBossPhase() {
    if (!gameState.enemy || !gameState.enemy.phases) return;
    
    const hpPercent = gameState.enemy.hp / gameState.enemy.maxHp;
    
    for (let i = currentPhaseIndex; i < gameState.enemy.phases.length; i++) {
        const phase = gameState.enemy.phases[i];
        
        if (hpPercent <= phase.threshold && i > currentPhaseIndex) {
            // Enter new phase
            currentPhaseIndex = i;
            
            // Show phase message
            if (phase.message) {
                showBossMessage(phase.message);
            }
            
            // Apply phase effects
            applyPhaseEffects(phase);
            
            console.log(`Boss 進入 Phase ${i + 1}`);
            break;
        }
    }
}

function applyPhaseEffects(phase) {
    if (!phase.skills) return;
    
    for (const skillId of phase.skills) {
        const skill = gameState.enemy.skills[skillId];
        if (skill && skill.effect) {
            applyBossSkillEffect(skill.effect);
        }
    }
}

function applyBossSkillEffect(effect) {
    switch (effect) {
        case 'atk_boost_40_cd_1':
            gameState.enemy.attack = Math.floor(gameState.enemy.attack * 1.4);
            gameState.enemy.attackCooldown = 1;
            break;
            
        case 'def_x2':
            gameState.enemy.defense = (gameState.enemy.defense || 0) * 2;
            break;
            
        case 'combo_shield_5_damage_70':
            // Handled in damage calculation
            break;
            
        default:
            console.log('未實作的 Boss 技能效果:', effect);
    }
}

async function executeBossSkills() {
    if (!gameState.enemy || !gameState.enemy.phases) return;
    
    const currentPhase = gameState.enemy.phases[currentPhaseIndex];
    if (!currentPhase || !currentPhase.skills) return;
    
    for (const skillId of currentPhase.skills) {
        const skill = gameState.enemy.skills[skillId];
        if (skill) {
            showBossSkillMessage(skill.name, skill.description);
            await executeBossSkillAction(skill);
        }
    }
}

async function executeBossSkillAction(skill) {
    switch (skill.effect) {
        case 'create_poison_3_2_turns':
            createPoisonOrbs(3);
            break;
            
        case 'create_poison_2_every_turn':
            createPoisonOrbs(2);
            break;
            
        case 'lock_random_4':
            lockRandomOrbs(4);
            break;
            
        case 'convert_random_to_water_3_turns':
            convertRandomToAttribute('water', 5);
            break;
            
        case 'convert_10_to_water':
            convertRandomToAttribute('water', 10);
            break;
            
        case 'hide_random_5':
            hideRandomOrbs(5);
            break;
            
        case 'hide_random_8':
            hideRandomOrbs(8);
            break;
            
        default:
            console.log('未實作的 Boss 技能動作:', skill.effect);
    }
    
    await sleep(500);
}

function showBossMessage(message) {
    const bossMessageEl = document.getElementById('boss-message');
    if (bossMessageEl) {
        bossMessageEl.textContent = message;
        bossMessageEl.style.display = 'block';
        
        setTimeout(() => {
            bossMessageEl.style.display = 'none';
        }, 2000);
    }
}

function showBossSkillMessage(name, description) {
    const message = `${name}\n${description}`;
    showBossMessage(message);
}

// Special Orb Mechanics
function createPoisonOrbs(count) {
    let created = 0;
    const attempts = 100;
    
    for (let i = 0; i < attempts && created < count; i++) {
        const row = Math.floor(Math.random() * BOARD_ROWS);
        const col = Math.floor(Math.random() * BOARD_COLS);
        
        if (gameState.board[row][col] && !gameState.board[row][col].poison) {
            gameState.board[row][col].poison = true;
            created++;
        }
    }
    
    if (created > 0) {
        renderBoard();
    }
}

function lockRandomOrbs(count) {
    let locked = 0;
    const attempts = 100;
    
    for (let i = 0; i < attempts && locked < count; i++) {
        const row = Math.floor(Math.random() * BOARD_ROWS);
        const col = Math.floor(Math.random() * BOARD_COLS);
        
        if (gameState.board[row][col] && !gameState.board[row][col].locked) {
            gameState.board[row][col].locked = true;
            locked++;
        }
    }
    
    if (locked > 0) {
        renderBoard();
    }
}

function convertRandomToAttribute(targetAttribute, count) {
    let converted = 0;
    const attempts = 100;
    
    for (let i = 0; i < attempts && converted < count; i++) {
        const row = Math.floor(Math.random() * BOARD_ROWS);
        const col = Math.floor(Math.random() * BOARD_COLS);
        
        if (gameState.board[row][col] && gameState.board[row][col].type !== targetAttribute) {
            gameState.board[row][col].type = targetAttribute;
            converted++;
        }
    }
    
    if (converted > 0) {
        renderBoard();
    }
}

function hideRandomOrbs(count) {
    let hidden = 0;
    const attempts = 100;
    
    for (let i = 0; i < attempts && hidden < count; i++) {
        const row = Math.floor(Math.random() * BOARD_ROWS);
        const col = Math.floor(Math.random() * BOARD_COLS);
        
        if (gameState.board[row][col] && !gameState.board[row][col].hidden) {
            gameState.board[row][col].hidden = true;
            hidden++;
        }
    }
    
    if (hidden > 0) {
        renderBoard();
    }
}

function calculateDamageWithDefense(baseDamage) {
    let damage = baseDamage;
    
    // Apply defense
    if (gameState.enemy.defense) {
        damage = Math.max(0, damage - gameState.enemy.defense);
    }
    
    // Apply shield effects
    for (const effect of activeEffects) {
        if (effect.type === 'shield') {
            damage *= (1 - effect.reduction / 100);
        }
        
        if (effect.type === 'invincible') {
            damage = 0;
        }
    }
    
    return Math.floor(damage);
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
    // Check if stageId is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const stageId = urlParams.get('stage') || 'practice';
    initGame(stageId);
});

// GM Sync Functions
function gmSetZodiacCleared(stageId, cleared) {
    // This function is called by GM to set zodiac clear status
    // It syncs with the orb progress system
    gmSetStageCleared(stageId, cleared);
}

function gmGetZodiacStatus() {
    // This function is called by GM to get all zodiac status
    return gmGetAllStageStatus();
}
