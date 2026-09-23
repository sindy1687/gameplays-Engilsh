// 轉珠戰鬥關卡資料 - 十二星座 Boss

const ORB_STAGES = {
    // 牡羊座 - 高速進攻
    'zodiac-aries': {
        id: 'zodiac-aries',
        category: 'zodiac',
        name: '牡羊座試煉',
        bossName: '牡羊座守護者',
        icon: '♈',
        difficulty: 1,
        entryCost: 300,
        moveTime: 6,
        boss: {
            attribute: 'fire',
            maxHp: 45000,
            hp: 45000,
            attack: 3000,
            attackCooldown: 2,
            currentCooldown: 2,
            image: '',
            phases: [
                {
                    threshold: 1.0,
                    skills: ['normal_attack']
                },
                {
                    threshold: 0.5,
                    skills: ['berserk_mode'],
                    message: '♈ 狂戰覺醒！\n牡羊座進入狂暴狀態！'
                }
            ],
            skills: {
                normal_attack: {
                    name: '火焰斬擊',
                    description: '普通攻擊'
                },
                berserk_mode: {
                    name: '狂戰模式',
                    description: 'ATK +40%，攻擊 CD → 1',
                    effect: 'atk_boost_40_cd_1'
                }
            }
        },
        rewards: {
            firstClearStars: 300,
            clearStars: 50
        },
        unlock: {
            type: 'default'
        }
    },
    
    // 金牛座 - 高防禦
    'zodiac-taurus': {
        id: 'zodiac-taurus',
        category: 'zodiac',
        name: '金牛座試煉',
        bossName: '金牛座守護者',
        icon: '♉',
        difficulty: 1,
        entryCost: 350,
        moveTime: 6,
        boss: {
            attribute: 'wood',
            maxHp: 60000,
            hp: 60000,
            attack: 2500,
            attackCooldown: 3,
            currentCooldown: 3,
            defense: 800,
            image: '',
            phases: [
                {
                    threshold: 1.0,
                    skills: ['normal_attack', 'taurus_shield']
                },
                {
                    threshold: 0.4,
                    skills: ['iron_wall'],
                    message: '🛡 鐵壁！\nDEF ×2'
                }
            ],
            skills: {
                normal_attack: {
                    name: '角撞',
                    description: '普通攻擊'
                },
                taurus_shield: {
                    name: '金牛壁壘',
                    description: '每3回合獲得護盾，傷害-50%',
                    effect: 'shield_50_percent_3_turns'
                },
                iron_wall: {
                    name: '鐵壁',
                    description: 'DEF ×2',
                    effect: 'def_x2'
                }
            }
        },
        rewards: {
            firstClearStars: 350,
            clearStars: 60
        },
        unlock: {
            type: 'previous_clear',
            stageId: 'zodiac-aries'
        }
    },
    
    // 雙子座 - 雙體 Boss
    'zodiac-gemini': {
        id: 'zodiac-gemini',
        category: 'zodiac',
        name: '雙子座試煉',
        bossName: '雙子座',
        icon: '♊',
        difficulty: 2,
        entryCost: 400,
        moveTime: 6,
        boss: {
            attribute: 'light',
            maxHp: 60000,
            hp: 60000,
            attack: 2800,
            attackCooldown: 2,
            currentCooldown: 2,
            image: '',
            isTwinBoss: true,
            twinData: {
                light: { hp: 30000, maxHp: 30000, attribute: 'light' },
                dark: { hp: 30000, maxHp: 30000, attribute: 'dark' }
            },
            phases: [
                {
                    threshold: 1.0,
                    skills: ['twin_attack']
                }
            ],
            skills: {
                twin_attack: {
                    name: '雙重攻擊',
                    description: '光暗雙體同時攻擊',
                    effect: 'twin_attack'
                },
                twin_revive: {
                    name: '雙子復活',
                    description: '其中一隻死亡後3回合內復活',
                    effect: 'revive_30_percent_3_turns'
                }
            }
        },
        rewards: {
            firstClearStars: 400,
            clearStars: 70
        },
        unlock: {
            type: 'previous_clear',
            stageId: 'zodiac-taurus'
        }
    },
    
    // 巨蟹座 - 護盾 + 回復
    'zodiac-cancer': {
        id: 'zodiac-cancer',
        category: 'zodiac',
        name: '巨蟹座試煉',
        bossName: '巨蟹座守護者',
        icon: '♋',
        difficulty: 2,
        entryCost: 450,
        moveTime: 6,
        boss: {
            attribute: 'water',
            maxHp: 55000,
            hp: 55000,
            attack: 2700,
            attackCooldown: 2,
            currentCooldown: 2,
            image: '',
            phases: [
                {
                    threshold: 1.0,
                    skills: ['normal_attack', 'cancer_heal']
                },
                {
                    threshold: 0.5,
                    skills: ['shell_shield'],
                    message: '🛡 甲殼護盾！\n需要5 Combo以上才能造成完整傷害'
                }
            ],
            skills: {
                normal_attack: {
                    name: '鉗擊',
                    description: '普通攻擊'
                },
                cancer_heal: {
                    name: '甲殼回復',
                    description: '每3回合恢復最大HP 8%',
                    effect: 'heal_8_percent_3_turns'
                },
                shell_shield: {
                    name: '甲殼護盾',
                    description: '未達5 Combo傷害減少70%',
                    effect: 'combo_shield_5_damage_70'
                }
            }
        },
        rewards: {
            firstClearStars: 450,
            clearStars: 80
        },
        unlock: {
            type: 'previous_clear',
            stageId: 'zodiac-gemini'
        }
    },
    
    // 獅子座 - 高爆發
    'zodiac-leo': {
        id: 'zodiac-leo',
        category: 'zodiac',
        name: '獅子座試煉',
        bossName: '獅子座守護者',
        icon: '♌',
        difficulty: 2,
        entryCost: 500,
        moveTime: 6,
        boss: {
            attribute: 'fire',
            maxHp: 50000,
            hp: 50000,
            attack: 4500,
            attackCooldown: 3,
            currentCooldown: 3,
            image: '',
            phases: [
                {
                    threshold: 1.0,
                    skills: ['normal_attack', 'roar_warning']
                }
            ],
            skills: {
                normal_attack: {
                    name: '獅爪',
                    description: '普通攻擊'
                },
                roar_warning: {
                    name: '王者咆哮',
                    description: '下一回合ATK ×2',
                    effect: 'next_turn_atk_x2'
                }
            }
        },
        rewards: {
            firstClearStars: 500,
            clearStars: 90
        },
        unlock: {
            type: 'previous_clear',
            stageId: 'zodiac-cancer'
        }
    },
    
    // 處女座 - 淨化 Buff
    'zodiac-virgo': {
        id: 'zodiac-virgo',
        category: 'zodiac',
        name: '處女座試煉',
        bossName: '處女座守護者',
        icon: '♍',
        difficulty: 3,
        entryCost: 550,
        moveTime: 6,
        boss: {
            attribute: 'wood',
            maxHp: 58000,
            hp: 58000,
            attack: 3200,
            attackCooldown: 2,
            currentCooldown: 2,
            image: '',
            phases: [
                {
                    threshold: 1.0,
                    skills: ['normal_attack', 'purify_buffs']
                }
            ],
            skills: {
                normal_attack: {
                    name: '淨化斬',
                    description: '普通攻擊'
                },
                purify_buffs: {
                    name: '淨化之光',
                    description: '每4回合清除玩家所有攻擊增益',
                    effect: 'clear_player_buffs_4_turns'
                }
            }
        },
        rewards: {
            firstClearStars: 550,
            clearStars: 100
        },
        unlock: {
            type: 'previous_clear',
            stageId: 'zodiac-leo'
        }
    },
    
    // 天秤座 - 屬性平衡
    'zodiac-libra': {
        id: 'zodiac-libra',
        category: 'zodiac',
        name: '天秤座試煉',
        bossName: '天秤座守護者',
        icon: '♎',
        difficulty: 3,
        entryCost: 600,
        moveTime: 6,
        boss: {
            attribute: 'light',
            maxHp: 52000,
            hp: 52000,
            attack: 3000,
            attackCooldown: 2,
            currentCooldown: 2,
            image: '',
            phases: [
                {
                    threshold: 1.0,
                    skills: ['normal_attack', 'attribute_balance']
                }
            ],
            skills: {
                normal_attack: {
                    name: '平衡之劍',
                    description: '普通攻擊'
                },
                attribute_balance: {
                    name: '屬性平衡',
                    description: '每回合指定有效屬性，未消除則ATK +20%',
                    effect: 'specify_attribute_boost'
                }
            }
        },
        rewards: {
            firstClearStars: 600,
            clearStars: 110
        },
        unlock: {
            type: 'previous_clear',
            stageId: 'zodiac-virgo'
        }
    },
    
    // 天蠍座 - 毒珠
    'zodiac-scorpio': {
        id: 'zodiac-scorpio',
        category: 'zodiac',
        name: '天蠍座試煉',
        bossName: '天蠍座守護者',
        icon: '♏',
        difficulty: 3,
        entryCost: 650,
        moveTime: 6,
        boss: {
            attribute: 'dark',
            maxHp: 54000,
            hp: 54000,
            attack: 3100,
            attackCooldown: 2,
            currentCooldown: 2,
            image: '',
            phases: [
                {
                    threshold: 1.0,
                    skills: ['normal_attack', 'poison_sting']
                },
                {
                    threshold: 0.4,
                    skills: ['toxic_domain'],
                    message: '☠ 猛毒領域！\n每回合產生2顆毒珠'
                }
            ],
            skills: {
                normal_attack: {
                    name: '毒蠍之刺',
                    description: '普通攻擊'
                },
                poison_sting: {
                    name: '毒蠍之刺',
                    description: '每2回合產生3顆毒珠',
                    effect: 'create_poison_3_2_turns'
                },
                toxic_domain: {
                    name: '猛毒領域',
                    description: '每回合產生2顆毒珠',
                    effect: 'create_poison_2_every_turn'
                }
            }
        },
        rewards: {
            firstClearStars: 650,
            clearStars: 120
        },
        unlock: {
            type: 'previous_clear',
            stageId: 'zodiac-libra'
        }
    },
    
    // 射手座 - 鎖珠
    'zodiac-sagittarius': {
        id: 'zodiac-sagittarius',
        category: 'zodiac',
        name: '射手座試煉',
        bossName: '射手座守護者',
        icon: '♐',
        difficulty: 4,
        entryCost: 700,
        moveTime: 6,
        boss: {
            attribute: 'fire',
            maxHp: 56000,
            hp: 56000,
            attack: 3300,
            attackCooldown: 2,
            currentCooldown: 2,
            image: '',
            phases: [
                {
                    threshold: 1.0,
                    skills: ['normal_attack', 'lock_orbs']
                }
            ],
            skills: {
                normal_attack: {
                    name: '射手之箭',
                    description: '普通攻擊'
                },
                lock_orbs: {
                    name: '鎖定射擊',
                    description: '隨機鎖定4顆符石',
                    effect: 'lock_random_4'
                }
            }
        },
        rewards: {
            firstClearStars: 700,
            clearStars: 130
        },
        unlock: {
            type: 'previous_clear',
            stageId: 'zodiac-scorpio'
        }
    },
    
    // 摩羯座 - Combo Shield
    'zodiac-capricorn': {
        id: 'zodiac-capricorn',
        category: 'zodiac',
        name: '摩羯座試煉',
        bossName: '摩羯座守護者',
        icon: '♑',
        difficulty: 4,
        entryCost: 750,
        moveTime: 6,
        boss: {
            attribute: 'earth',
            maxHp: 58000,
            hp: 58000,
            attack: 3400,
            attackCooldown: 2,
            currentCooldown: 2,
            image: '',
            phases: [
                {
                    threshold: 1.0,
                    skills: ['normal_attack'],
                    comboRequirement: 4
                },
                {
                    threshold: 0.66,
                    skills: ['normal_attack'],
                    comboRequirement: 6,
                    message: '🛡 Combo Shield！\n需要6 Combo'
                },
                {
                    threshold: 0.33,
                    skills: ['normal_attack'],
                    comboRequirement: 8,
                    message: '🛡 Combo Shield！\n需要8 Combo'
                }
            ],
            skills: {
                normal_attack: {
                    name: '山羊角',
                    description: '普通攻擊'
                }
            }
        },
        rewards: {
            firstClearStars: 750,
            clearStars: 140
        },
        unlock: {
            type: 'previous_clear',
            stageId: 'zodiac-sagittarius'
        }
    },
    
    // 水瓶座 - 轉色干擾
    'zodiac-aquarius': {
        id: 'zodiac-aquarius',
        category: 'zodiac',
        name: '水瓶座試煉',
        bossName: '水瓶座守護者',
        icon: '♒',
        difficulty: 4,
        entryCost: 800,
        moveTime: 6,
        boss: {
            attribute: 'water',
            maxHp: 57000,
            hp: 57000,
            attack: 3200,
            attackCooldown: 2,
            currentCooldown: 2,
            image: '',
            phases: [
                {
                    threshold: 1.0,
                    skills: ['normal_attack', 'water_convert']
                },
                {
                    threshold: 0.3,
                    skills: ['flood_domain'],
                    message: '🌊 洪流領域！\n隨機10顆符石轉成水珠'
                }
            ],
            skills: {
                normal_attack: {
                    name: '水瓶之水',
                    description: '普通攻擊'
                },
                water_convert: {
                    name: '水流轉換',
                    description: '每3回合將隨機一種屬性轉成水珠',
                    effect: 'convert_random_to_water_3_turns'
                },
                flood_domain: {
                    name: '洪流領域',
                    description: '隨機10顆符石轉成水珠',
                    effect: 'convert_10_to_water'
                }
            }
        },
        rewards: {
            firstClearStars: 800,
            clearStars: 150
        },
        unlock: {
            type: 'previous_clear',
            stageId: 'zodiac-capricorn'
        }
    },
    
    // 雙魚座 - 幻象
    'zodiac-pisces': {
        id: 'zodiac-pisces',
        category: 'zodiac',
        name: '雙魚座試煉',
        bossName: '雙魚座守護者',
        icon: '♓',
        difficulty: 5,
        entryCost: 1000,
        moveTime: 6,
        boss: {
            attribute: 'water',
            maxHp: 65000,
            hp: 65000,
            attack: 3800,
            attackCooldown: 2,
            currentCooldown: 2,
            image: '',
            phases: [
                {
                    threshold: 1.0,
                    skills: ['normal_attack']
                },
                {
                    threshold: 0.66,
                    skills: ['normal_attack', 'hide_orbs_5'],
                    message: '❓ 幻象！\n隨機遮住5顆符石'
                },
                {
                    threshold: 0.33,
                    skills: ['normal_attack', 'hide_orbs_8'],
                    message: '❓ 幻境！\n隨機遮住8顆符石'
                }
            ],
            skills: {
                normal_attack: {
                    name: '幻夢之擊',
                    description: '普通攻擊'
                },
                hide_orbs_5: {
                    name: '幻象',
                    description: '隨機遮住5顆符石',
                    effect: 'hide_random_5'
                },
                hide_orbs_8: {
                    name: '幻境',
                    description: '隨機遮住8顆符石',
                    effect: 'hide_random_8'
                }
            }
        },
        rewards: {
            firstClearStars: 1000,
            clearStars: 200
        },
        unlock: {
            type: 'previous_clear',
            stageId: 'zodiac-aquarius'
        }
    }
};

// 練習模式關卡
const PRACTICE_STAGE = {
    id: 'practice',
    category: 'practice',
    name: '轉珠練習',
    bossName: '訓練假人',
    icon: '🎯',
    difficulty: 0,
    entryCost: 0,
    moveTime: 8,
    boss: {
        attribute: 'light',
        maxHp: 10000,
        hp: 10000,
        attack: 500,
        attackCooldown: 3,
        currentCooldown: 3,
        image: '',
        phases: [
            {
                threshold: 1.0,
                skills: ['normal_attack']
            }
        ],
        skills: {
            normal_attack: {
                name: '訓練攻擊',
                description: '普通攻擊'
            }
        }
    },
    rewards: {
        firstClearStars: 0,
        clearStars: 0
    },
    unlock: {
        type: 'default'
    }
};

// 取得關卡資料
function getStageData(stageId) {
    if (stageId === 'practice') return PRACTICE_STAGE;
    return ORB_STAGES[stageId] || null;
}

// 取得所有關卡列表
function getAllStages() {
    return Object.values(ORB_STAGES);
}

// 取得十二星座關卡列表
function getZodiacStages() {
    return Object.values(ORB_STAGES).filter(stage => stage.category === 'zodiac');
}

// 檢查關卡是否解鎖
function isStageUnlocked(stageId, zodiacProgress) {
    const stage = getStageData(stageId);
    if (!stage) return false;
    
    if (stage.unlock.type === 'default') return true;
    
    if (stage.unlock.type === 'previous_clear') {
        const prevStageId = stage.unlock.stageId;
        return zodiacProgress[prevStageId]?.cleared || false;
    }
    
    return false;
}
