/**
 * Atlas Stage Registry
 * 
 * This file contains the registry for all Atlas stages (zodiac and Greek gods).
 * Zodiac stages are selected in atlas.html; Greek stages use the shared game page.
 */

window.AtlasStageRegistry = {
  // Zodiac/Constellation stages
  zodiac: [
    {
      id: 'aries',
      type: 'zodiac',
      name: '牡羊座',
      englishName: 'Aries',
      url: 'quiz.html?category=aries',
      order: 1,
      questionCount: 20
    },
    {
      id: 'taurus',
      type: 'zodiac',
      name: '金牛座',
      englishName: 'Taurus',
      url: 'quiz.html?category=taurus',
      order: 2,
      questionCount: 20
    },
    {
      id: 'gemini',
      type: 'zodiac',
      name: '雙子座',
      englishName: 'Gemini',
      url: 'quiz.html?category=gemini',
      order: 3,
      questionCount: 20
    },
    {
      id: 'cancer',
      type: 'zodiac',
      name: '巨蟹座',
      englishName: 'Cancer',
      url: 'quiz.html?category=cancer',
      order: 4,
      questionCount: 20
    },
    {
      id: 'leo',
      type: 'zodiac',
      name: '獅子座',
      englishName: 'Leo',
      url: 'quiz.html?category=leo',
      order: 5,
      questionCount: 20
    },
    {
      id: 'virgo',
      type: 'zodiac',
      name: '處女座',
      englishName: 'Virgo',
      url: 'quiz.html?category=virgo',
      order: 6,
      questionCount: 20
    },
    {
      id: 'libra',
      type: 'zodiac',
      name: '天秤座',
      englishName: 'Libra',
      url: 'quiz.html?category=libra',
      order: 7,
      questionCount: 20
    },
    {
      id: 'scorpio',
      type: 'zodiac',
      name: '天蠍座',
      englishName: 'Scorpio',
      url: 'quiz.html?category=scorpio',
      order: 8,
      questionCount: 20
    },
    {
      id: 'sagittarius',
      type: 'zodiac',
      name: '射手座',
      englishName: 'Sagittarius',
      url: 'quiz.html?category=sagittarius',
      order: 9,
      questionCount: 20
    },
    {
      id: 'capricorn',
      type: 'zodiac',
      name: '摩羯座',
      englishName: 'Capricorn',
      url: 'quiz.html?category=capricorn',
      order: 10,
      questionCount: 20
    },
    {
      id: 'aquarius',
      type: 'zodiac',
      name: '水瓶座',
      englishName: 'Aquarius',
      url: 'quiz.html?category=aquarius',
      order: 11,
      questionCount: 20
    },
    {
      id: 'pisces',
      type: 'zodiac',
      name: '雙魚座',
      englishName: 'Pisces',
      url: 'quiz.html?category=pisces',
      order: 12,
      questionCount: 20
    }
  ],

  // Greek god stages
  greek: [
    {
      id: 'zeus',
      type: 'greek',
      name: '宙斯',
      englishName: 'Zeus',
      url: 'greek_common.html?god=zeus',
      order: 1,
      questionCount: 40,
      description: '雷電之王'
    },
    {
      id: 'hera',
      type: 'greek',
      name: '赫拉',
      englishName: 'Hera',
      url: 'greek_common.html?god=hera',
      order: 2,
      questionCount: 40,
      description: '婚姻守護'
    },
    {
      id: 'poseidon',
      type: 'greek',
      name: '波塞頓',
      englishName: 'Poseidon',
      url: 'greek_common.html?god=poseidon',
      order: 3,
      questionCount: 40,
      description: '震海之神'
    },
    {
      id: 'demeter',
      type: 'greek',
      name: '得墨忒耳',
      englishName: 'Demeter',
      url: 'greek_common.html?god=demeter',
      order: 4,
      questionCount: 40,
      description: '豐收女神'
    },
    {
      id: 'athena',
      type: 'greek',
      name: '雅典娜',
      englishName: 'Athena',
      url: 'greek_common.html?god=athena',
      order: 5,
      questionCount: 40,
      description: '智慧女神'
    },
    {
      id: 'apollo',
      type: 'greek',
      name: '阿波羅',
      englishName: 'Apollo',
      url: 'greek_common.html?god=apollo',
      order: 6,
      questionCount: 40,
      description: '光明之神'
    },
    {
      id: 'artemis',
      type: 'greek',
      name: '阿爾忒彌斯',
      englishName: 'Artemis',
      url: 'greek_common.html?god=artemis',
      order: 7,
      questionCount: 40,
      description: '狩獵女神'
    },
    {
      id: 'ares',
      type: 'greek',
      name: '阿瑞斯',
      englishName: 'Ares',
      url: 'greek_common.html?god=ares',
      order: 8,
      questionCount: 40,
      description: '戰爭之神'
    },
    {
      id: 'aphrodite',
      type: 'greek',
      name: '阿芙蘿黛蒂',
      englishName: 'Aphrodite',
      url: 'greek_common.html?god=aphrodite',
      order: 9,
      questionCount: 40,
      description: '愛與美之神'
    },
    {
      id: 'hephaestus',
      type: 'greek',
      name: '赫菲斯托斯',
      englishName: 'Hephaestus',
      url: 'greek_common.html?god=hephaestus',
      order: 10,
      questionCount: 40,
      description: '工匠之神'
    },
    {
      id: 'hermes',
      type: 'greek',
      name: '赫耳墨斯',
      englishName: 'Hermes',
      url: 'greek_common.html?god=hermes',
      order: 11,
      questionCount: 40,
      description: '信使之神'
    },
    {
      id: 'hestia',
      type: 'greek',
      name: '赫斯提亞',
      englishName: 'Hestia',
      url: 'greek_common.html?god=hestia',
      order: 12,
      questionCount: 40,
      description: '爐火女神'
    },
    {
      id: 'dionysus',
      type: 'greek',
      name: '狄俄尼索斯',
      englishName: 'Dionysus',
      url: 'greek_common.html?god=dionysus',
      order: 13,
      questionCount: 40,
      description: '酒神'
    },
    {
      id: 'hades',
      type: 'greek',
      name: '哈迪斯',
      englishName: 'Hades',
      url: 'greek_common.html?god=hades',
      order: 14,
      questionCount: 40,
      description: '冥界之神'
    },
    {
      id: 'persephone',
      type: 'greek',
      name: '珀爾塞福涅',
      englishName: 'Persephone',
      url: 'greek_common.html?god=persephone',
      order: 15,
      questionCount: 40,
      description: '冥后'
    },
    {
      id: 'eros',
      type: 'greek',
      name: '厄洛斯',
      englishName: 'Eros',
      url: 'greek_common.html?god=eros',
      order: 16,
      questionCount: 40,
      description: '愛神'
    },
    {
      id: 'nike',
      type: 'greek',
      name: '尼刻',
      englishName: 'Nike',
      url: 'greek_common.html?god=nike',
      order: 17,
      questionCount: 40,
      description: '勝利女神'
    },
    {
      id: 'gaia',
      type: 'greek',
      name: '蓋婭',
      englishName: 'Gaia',
      url: 'greek_common.html?god=gaia',
      order: 18,
      questionCount: 40,
      description: '大地之母'
    },
    {
      id: 'atlas',
      type: 'greek',
      name: '阿特拉斯',
      englishName: 'Atlas',
      url: 'greek_common.html?god=atlas_god',
      order: 19,
      questionCount: 40,
      description: '擎天之神'
    },
    {
      id: 'cronus',
      type: 'greek',
      name: '克洛諾斯',
      englishName: 'Cronus',
      url: 'greek_common.html?god=cronus',
      order: 20,
      questionCount: 40,
      description: '泰坦之王'
    },
    {
      id: 'rhea',
      type: 'greek',
      name: '瑞亞',
      englishName: 'Rhea',
      url: 'greek_common.html?god=rhea',
      order: 21,
      questionCount: 40,
      description: '泰坦女神'
    },
    {
      id: 'prometheus',
      type: 'greek',
      name: '普羅米修斯',
      englishName: 'Prometheus',
      url: 'greek_common.html?god=prometheus',
      order: 22,
      questionCount: 40,
      description: '先知之神'
    }
  ],

  // Helper functions
  getStageById(id) {
    const allStages = [...this.zodiac, ...this.greek];
    return allStages.find(stage => stage.id === id);
  },

  getStagesByType(type) {
    return this[type] || [];
  },

  getAllStages() {
    return [...this.zodiac, ...this.greek];
  },

  // Legacy name mapping for migration
  legacyNameMap: {
    '宙斯': 'zeus',
    '赫拉': 'hera',
    '波塞頓': 'poseidon',
    '得墨忒耳': 'demeter',
    '德墨忒耳': 'demeter',
    '雅典娜': 'athena',
    '阿波羅': 'apollo',
    '阿爾忒彌斯': 'artemis',
    '阿瑞斯': 'ares',
    '阿芙蘿黛蒂': 'aphrodite',
    '赫菲斯托斯': 'hephaestus',
    '赫耳墨斯': 'hermes',
    '赫斯提亞': 'hestia',
    '狄俄尼索斯': 'dionysus',
    '哈迪斯': 'hades',
    '珀爾塞福涅': 'persephone',
    '厄洛斯': 'eros',
    '尼刻': 'nike',
    '蓋婭': 'gaia',
    '阿特拉斯': 'atlas',
    '克洛諾斯': 'cronus',
    '瑞亞': 'rhea',
    '普羅米修斯': 'prometheus'
  },

  // Migrate old Chinese names to IDs
  migrateLegacyData(data) {
    if (!Array.isArray(data)) return data;
    return data.map(item => {
      if (this.legacyNameMap[item]) {
        return this.legacyNameMap[item];
      }
      return item;
    });
  }
};
