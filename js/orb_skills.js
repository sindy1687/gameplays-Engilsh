// 轉珠戰鬥技能系統 - 完整技能類型與效果

// 技能類型定義
const SKILL_TYPES = {
    CONVERT: 'convert',           // 轉色
    TRANSFORM: 'transform',       // 全盤轉換
    DESTROY: 'destroy',           // 炸珠
    MOVE_TIME: 'move_time',       // 操作時間
    ATTACK_BOOST: 'attack_boost', // 攻擊增幅
    HEAL: 'heal',                 // 回復
    SHIELD: 'shield',             // 護盾
    INVINCIBLE: 'invincible'     // 無敵
};

// 技能效果狀態
let activeEffects = [];

// 轉色技能
function convertOrbs(from, to) {
    if (!gameState || !gameState.board) return false;
    
    let converted = 0;
    for (let row = 0; row < BOARD_ROWS; row++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            const orb = gameState.board[row][col];
            if (orb && orb.type === from) {
                orb.type = to;
                converted++;
            }
        }
    }
    
    return converted > 0;
}

// 全盤轉換
function transformBoard(allowedTypes) {
    if (!gameState || !gameState.board) return false;
    
    const allTypes = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];
    const targetTypes = allowedTypes || allTypes;
    
    for (let row = 0; row < BOARD_ROWS; row++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            const orb = gameState.board[row][col];
            if (orb && !targetTypes.includes(orb.type)) {
                // 隨機轉成允許的類型
                orb.type = targetTypes[Math.floor(Math.random() * targetTypes.length)];
            }
        }
    }
    
    return true;
}

// 炸珠
function destroyOrbsByType(type) {
    if (!gameState || !gameState.board) return false;
    
    let destroyed = 0;
    for (let row = 0; row < BOARD_ROWS; row++) {
        for (let col = 0; col < BOARD_COLS; col++) {
            const orb = gameState.board[row][col];
            if (orb && orb.type === type) {
                gameState.board[row][col] = null;
                destroyed++;
            }
        }
    }
    
    if (destroyed > 0) {
        // 觸發掉珠
        collapseBoard();
        fillEmptyCells();
    }
    
    return destroyed > 0;
}

// 操作時間技能
function applyMoveTimeBoost(value, turns) {
    const effect = {
        id: `move-time-${Date.now()}`,
        type: SKILL_TYPES.MOVE_TIME,
        value: value,
        turnsRemaining: turns,
        description: `操作時間 +${value}秒 / ${turns}回合`
    };
    
    activeEffects.push(effect);
    return effect;
}

// 攻擊增幅技能
function applyAttackBoost(attribute, multiplier, turns) {
    const effect = {
        id: `attack-boost-${Date.now()}`,
        type: SKILL_TYPES.ATTACK_BOOST,
        attribute: attribute,
        multiplier: multiplier,
        turnsRemaining: turns,
        description: `${getAttributeName(attribute)}攻 ×${multiplier} / ${turns}回合`
    };
    
    activeEffects.push(effect);
    return effect;
}

// 回復技能
function healPlayer(percentOrFixed) {
    if (!gameState) return false;
    
    let healAmount;
    if (typeof percentOrFixed === 'string' && percentOrFixed.includes('%')) {
        // 百分比回復
        const percent = parseFloat(percentOrFixed) / 100;
        healAmount = Math.floor(gameState.playerMaxHp * percent);
    } else {
        // 固定數值回復
        healAmount = Math.floor(percentOrFixed);
    }
    
    gameState.playerHp = Math.min(gameState.playerMaxHp, gameState.playerHp + healAmount);
    updatePlayerHp();
    
    return true;
}

// 護盾技能
function applyShield(reductionPercent, turns) {
    const effect = {
        id: `shield-${Date.now()}`,
        type: SKILL_TYPES.SHIELD,
        reduction: reductionPercent,
        turnsRemaining: turns,
        description: `減傷 ${reductionPercent}% / ${turns}回合`
    };
    
    activeEffects.push(effect);
    return effect;
}

// 無敵技能
function applyInvincible() {
    const effect = {
        id: `invincible-${Date.now()}`,
        type: SKILL_TYPES.INVINCIBLE,
        turnsRemaining: 1,
        description: '無敵 / 1回合'
    };
    
    activeEffects.push(effect);
    return effect;
}

// 執行技能
function executeSkill(skill) {
    if (!skill || !skill.type) return false;
    
    switch (skill.type) {
        case SKILL_TYPES.CONVERT:
            return convertOrbs(skill.from, skill.to);
            
        case SKILL_TYPES.TRANSFORM:
            return transformBoard(skill.allowedTypes);
            
        case SKILL_TYPES.DESTROY:
            return destroyOrbsByType(skill.targetType);
            
        case SKILL_TYPES.MOVE_TIME:
            return applyMoveTimeBoost(skill.value, skill.turns);
            
        case SKILL_TYPES.ATTACK_BOOST:
            return applyAttackBoost(skill.attribute, skill.multiplier, skill.turns);
            
        case SKILL_TYPES.HEAL:
            return healPlayer(skill.amount);
            
        case SKILL_TYPES.SHIELD:
            return applyShield(skill.reduction, skill.turns);
            
        case SKILL_TYPES.INVINCIBLE:
            return applyInvincible();
            
        default:
            console.error('未知技能類型:', skill.type);
            return false;
    }
}

// 更新效果狀態（每回合結束時呼叫）
function tickActiveEffects() {
    for (let i = activeEffects.length - 1; i >= 0; i--) {
        const effect = activeEffects[i];
        effect.turnsRemaining--;
        
        if (effect.turnsRemaining <= 0) {
            activeEffects.splice(i, 1);
        }
    }
}

// 清除所有效果
function clearAllEffects() {
    activeEffects = [];
}

// 取得目前有效效果
function getActiveEffects() {
    return [...activeEffects];
}

// 計算傷害時考慮效果
function calculateDamageWithEffects(baseDamage, orbType) {
    let damage = baseDamage;
    
    for (const effect of activeEffects) {
        if (effect.type === SKILL_TYPES.ATTACK_BOOST) {
            if (!effect.attribute || effect.attribute === orbType) {
                damage *= effect.multiplier;
            }
        }
    }
    
    return Math.floor(damage);
}

// 計算受到傷害時考慮效果
function calculateDamageWithDefense(baseDamage) {
    let damage = baseDamage;
    
    for (const effect of activeEffects) {
        if (effect.type === SKILL_TYPES.SHIELD) {
            damage *= (1 - effect.reduction / 100);
        }
        
        if (effect.type === SKILL_TYPES.INVINCIBLE) {
            damage = 0;
        }
    }
    
    return Math.floor(damage);
}

// 取得操作時間加成
function getMoveTimeBonus() {
    let bonus = 0;
    
    for (const effect of activeEffects) {
        if (effect.type === SKILL_TYPES.MOVE_TIME) {
            bonus += effect.value;
        }
    }
    
    return bonus;
}

// 檢查技能是否可以使用
function canUseSkill(skill) {
    if (!skill) return false;
    
    // 檢查 CD
    if (skill.currentCooldown > 0) return false;
    
    // 檢查遊戲狀態
    if (gameState.phase !== BattlePhase.PLAYER_READY) return false;
    
    return true;
}

// 使用技能並更新 CD
function useSkillAndUpdateCD(characterIndex) {
    const character = gameState.characters[characterIndex];
    if (!character || !character.skill) return false;
    
    const skill = character.skill;
    if (!canUseSkill(skill)) return false;
    
    // 執行技能效果
    const success = executeSkill(skill);
    if (!success) return false;
    
    // 設定 CD
    skill.currentCooldown = skill.cooldown;
    
    // 更新顯示
    renderCharacters();
    renderActiveEffects();
    
    return true;
}

// 減少技能 CD（每回合結束時呼叫）
function tickSkillCooldowns() {
    for (const character of gameState.characters) {
        if (character.skill && character.skill.currentCooldown > 0) {
            character.skill.currentCooldown--;
        }
    }
}

// 取得屬性名稱
function getAttributeName(attribute) {
    const names = {
        fire: '火',
        water: '水',
        wood: '木',
        light: '光',
        dark: '暗',
        heart: '心'
    };
    return names[attribute] || attribute;
}

// 渲染效果狀態顯示
function renderActiveEffects() {
    const effectsContainer = document.getElementById('active-effects');
    if (!effectsContainer) return;
    
    effectsContainer.innerHTML = '';
    
    for (const effect of activeEffects) {
        const effectEl = document.createElement('div');
        effectEl.className = 'active-effect';
        effectEl.textContent = effect.description;
        effectsContainer.appendChild(effectEl);
    }
}

// 技能動畫播放
function playSkillAnimation(skill, callback) {
    if (!skill || !skill.animation) {
        if (callback) callback();
        return;
    }
    
    const animationContainer = document.getElementById('skill-animation');
    if (!animationContainer) {
        if (callback) callback();
        return;
    }
    
    animationContainer.innerHTML = '';
    
    const extension = skill.animation.split('.').pop().toLowerCase();
    
    if (extension === 'mp4') {
        const video = document.createElement('video');
        video.src = skill.animation;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        
        video.onended = () => {
            animationContainer.innerHTML = '';
            if (callback) callback();
        };
        
        video.onerror = () => {
            animationContainer.innerHTML = '';
            if (callback) callback();
        };
        
        // Fallback timeout
        setTimeout(() => {
            if (animationContainer.contains(video)) {
                animationContainer.innerHTML = '';
                if (callback) callback();
            }
        }, 3000);
        
        animationContainer.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = skill.animation;
        img.alt = '技能動畫';
        
        img.onload = () => {
            setTimeout(() => {
                animationContainer.innerHTML = '';
                if (callback) callback();
            }, 1000);
        };
        
        img.onerror = () => {
            animationContainer.innerHTML = '';
            if (callback) callback();
        };
        
        animationContainer.appendChild(img);
    }
}
