// 共用成就資料與查詢函數
// 請在需要的頁面 <script src="js/achievements.js"></script>

// 成就資料（與 achievement.html 同步）
const achievements = [
  { id: 'bronze', name: '銅牌收集者', requirement: 10, reward: 5, icon: '🥉', type: 'collection', description: '收集10張卡片，開始你的收集之旅' },
  { id: 'silver', name: '銀牌收集者', requirement: 25, reward: 15, icon: '🥈', type: 'collection', description: '收集25張卡片，展現你的收集實力' },
  { id: 'gold', name: '金牌收集者', requirement: 50, reward: 30, icon: '🥇', type: 'collection', description: '收集50張卡片，成為真正的收集者' },
  { id: 'platinum', name: '白金收集者', requirement: 100, reward: 60, icon: '💎', type: 'collection', description: '收集100張卡片，達到白金等級' },
  { id: 'diamond', name: '鑽石收集者', requirement: 200, reward: 120, icon: '💠', type: 'collection', description: '收集200張卡片，獲得鑽石榮耀' },
  { id: 'master', name: '收集大師', requirement: 500, reward: 300, icon: '👑', type: 'collection', description: '收集500張卡片，成為收集大師' },
  { id: 'common_master', name: '普通卡大師', requirement: 50, reward: 20, icon: '📚', type: 'rarity', rarity: '普通', description: '收集50張普通卡片，掌握基礎詞彙' },
  { id: 'rare_master', name: '稀有卡大師', requirement: 30, reward: 40, icon: '🔮', type: 'rarity', rarity: '稀有', description: '收集30張稀有卡片，擴展詞彙範圍' },
  { id: 'epic_master', name: '超稀有大師', requirement: 20, reward: 80, icon: '🌟', type: 'rarity', rarity: '超稀有', description: '收集20張超稀有卡片，掌握高級詞彙' },
  { id: 'shard_collector', name: '碎片收集者', requirement: 100, reward: 25, icon: '💎', type: 'shards', description: '收集100個碎片，開始碎片收集之路' },
  { id: 'shard_hoarder', name: '碎片囤積者', requirement: 500, reward: 100, icon: '🏦', type: 'shards', description: '收集500個碎片，成為碎片囤積者' },
  { id: 'shard_master', name: '碎片大師', requirement: 1000, reward: 200, icon: '💍', type: 'shards', description: '收集1000個碎片，成為碎片大師' },
  { id: 'first_card', name: '初學者', requirement: 1, reward: 1, icon: '🎯', type: 'special', description: '獲得第一張卡片，開始學習之旅' },
  { id: 'lucky_starter', name: '幸運新手', requirement: 5, reward: 5, icon: '🍀', type: 'special', description: '獲得5張卡片，展現你的幸運' },
  { id: 'dedicated', name: '專注學習者', requirement: 25, reward: 20, icon: '📖', type: 'special', description: '獲得25張卡片，展現你的專注' },
  { id: 'persistent', name: '堅持不懈', requirement: 75, reward: 60, icon: '💪', type: 'special', description: '獲得75張卡片，展現你的堅持' },
  { id: 'vocabulary_king', name: '詞彙之王', requirement: 150, reward: 150, icon: '👑', type: 'special', description: '獲得150張卡片，成為詞彙之王' },
  { id: 'language_legend', name: '語言傳奇', requirement: 300, reward: 300, icon: '🏆', type: 'special', description: '獲得300張卡片，成為語言傳奇' },
  { id: 'star_collector', name: '星星收集者', requirement: 100, reward: 10, icon: '⭐', type: 'stars', description: '收集100顆星星，開始星星收集' },
  { id: 'star_hoarder', name: '星星囤積者', requirement: 500, reward: 50, icon: '✨', type: 'stars', description: '收集500顆星星，成為星星囤積者' },
  { id: 'star_master', name: '星星大師', requirement: 1000, reward: 100, icon: '🌟', type: 'stars', description: '收集1000顆星星，成為星星大師' },
  { id: 'star_legend', name: '星星傳奇', requirement: 5000, reward: 500, icon: '💫', type: 'stars', description: '收集5000顆星星，成為星星傳奇' },
  { id: 'speed_learner', name: '快速學習者', requirement: 10, reward: 15, icon: '⚡', type: 'performance', description: '通過10個關卡，展現快速學習能力' },
  { id: 'accuracy_master', name: '準確大師', requirement: 20, reward: 25, icon: '🎯', type: 'performance', description: '通過20個關卡，展現準確的學習能力' },
  { id: 'combo_king', name: '連擊之王', requirement: 15, reward: 30, icon: '🔥', type: 'performance', description: '通過15個關卡，展現連擊能力' },
  { id: 'fill_beginner', name: '填空新手', requirement: 1, reward: 5, icon: '📝', type: 'fill', description: '完成第一次填空挑戰' },
  { id: 'fill_regular', name: '填空常客', requirement: 10, reward: 20, icon: '📋', type: 'fill', description: '完成10次填空挑戰' },
  { id: 'fill_expert', name: '填空專家', requirement: 50, reward: 80, icon: '📊', type: 'fill', description: '完成50次填空挑戰' },
  { id: 'fill_master', name: '填空大師', requirement: 100, reward: 150, icon: '🏆', type: 'fill', description: '完成100次填空挑戰' },
  { id: 'fill_perfect', name: '完美填空', requirement: 1, reward: 30, icon: '💯', type: 'fill', description: '在填空挑戰中獲得滿分' },
  { id: 'fill_speed', name: '快速填空', requirement: 5, reward: 25, icon: '⚡', type: 'fill', description: '在5次填空挑戰中平均時間少於15秒' },
  { id: 'fill_streak', name: '連續填空', requirement: 7, reward: 40, icon: '🔥', type: 'fill', description: '連續7天完成填空挑戰' },
  { id: 'fill_vocab', name: '詞彙填空', requirement: 100, reward: 60, icon: '📚', type: 'fill', description: '在填空挑戰中答對100個單字' },
  { id: 'vocab_beginner', name: '單字新手', requirement: 10, reward: 15, icon: '📖', type: 'vocabulary', description: '答對10個單字本的單字，開始單字學習之旅' },
  { id: 'vocab_regular', name: '單字常客', requirement: 50, reward: 40, icon: '📚', type: 'vocabulary', description: '答對50個單字本的單字，展現學習熱情' },
  { id: 'vocab_expert', name: '單字專家', requirement: 100, reward: 80, icon: '🎓', type: 'vocabulary', description: '答對100個單字本的單字，成為單字專家' },
  { id: 'vocab_master', name: '單字大師', requirement: 200, reward: 150, icon: '👑', type: 'vocabulary', description: '答對200個單字本的單字，成為單字大師' },
  { id: 'vocab_legend', name: '單字傳奇', requirement: 500, reward: 300, icon: '🏆', type: 'vocabulary', description: '答對500個單字本的單字，成為單字傳奇' },
];

// 自動產生20個星座關卡成就
const zodiacCategories = [
  { key: 'aries', name: '白羊座', icon: '♈', rewardRange: [5,5] },
  { key: 'taurus', name: '金牛座', icon: '♉', rewardRange: [5,5] },
  { key: 'gemini', name: '雙子座', icon: '♊', rewardRange: [5,5] },
  { key: 'cancer', name: '巨蟹座', icon: '♋', rewardRange: [7,10] },
  { key: 'leo', name: '獅子座', icon: '♌', rewardRange: [8,12] },
  { key: 'virgo', name: '處女座', icon: '♍', rewardRange: [9,13] },
  { key: 'libra', name: '天秤座', icon: '♎', rewardRange: [10,14] },
  { key: 'scorpio', name: '天蠍座', icon: '♏', rewardRange: [11,15] },
  { key: 'sagittarius', name: '射手座', icon: '♐', rewardRange: [12,16] },
  { key: 'capricorn', name: '摩羯座', icon: '♑', rewardRange: [13,17] },
  { key: 'aquarius', name: '水瓶座', icon: '♒', rewardRange: [14,18] },
  { key: 'pisces', name: '雙魚座', icon: '♓', rewardRange: [15,20] },
  { key: 'andromeda', name: '仙女座', icon: '👸', rewardRange: [16,20] },
  { key: 'cygnus', name: '天鵝座', icon: '🦢', rewardRange: [17,20] },
  { key: 'orion', name: '獵戶座', icon: '🏹', rewardRange: [17,20] },
  { key: 'pegasus', name: '飛馬座', icon: '🦄', rewardRange: [17,20] },
  { key: 'cassiopeia', name: '仙后座', icon: '👑', rewardRange: [17,20] },
  { key: 'scorpius', name: '天蠍座', icon: '🦂', rewardRange: [17,20] },
  { key: 'phoenix', name: '鳳凰座', icon: '🔥', rewardRange: [17,20] },
  { key: 'vela', name: '船帆座', icon: '⛵', rewardRange: [17,20] }
];
zodiacCategories.forEach(category => {
  achievements.push({
    id: `pass_${category.key}`,
    name: `通過${category.name}`,
    requirement: 1,
    reward: category.rewardRange[0] === category.rewardRange[1] ? category.rewardRange[0] : null,
    icon: category.icon,
    type: 'zodiac',
    description: `通過${category.name}關卡`,
    rewardRange: category.rewardRange
  });
});

// 取得玩家已擁有卡片、碎片等資料
function getOwnedCards() {
  return JSON.parse(localStorage.getItem('ownedCards') || '{}');
}
function getShards() {
  return JSON.parse(localStorage.getItem('cardShards') || '{}');
}

// 取得已領取成就id陣列
function getClaimedAchievements() {
  return JSON.parse(localStorage.getItem('claimedAchievements') || '[]');
}

// 取得已解鎖但未領取的成就
function getClaimableAchievements() {
  return achievements.filter(ach => checkAchievementUnlocked(ach) && !getClaimedAchievements().includes(ach.id));
}

// 取得所有已解鎖成就
function getUnlockedAchievements() {
  return achievements.filter(ach => checkAchievementUnlocked(ach));
}

// 取得所有已領取成就
function getAllClaimedAchievements() {
  return achievements.filter(ach => getClaimedAchievements().includes(ach.id));
}

// 判斷成就是否已解鎖
function checkAchievementUnlocked(ach) {
  const ownedCards = getOwnedCards();
  const shards = getShards();
  switch (ach.type) {
    case 'collection':
    case 'special':
      return Object.keys(ownedCards).length >= ach.requirement;
    case 'rarity':
      if (!window.allCards) return false;
      return window.allCards.filter(card => card.rarity === ach.rarity && ownedCards[card.word]).length >= ach.requirement;
    case 'shards':
      return Object.values(shards).reduce((sum, c) => sum + c, 0) >= ach.requirement;
    case 'stars':
      return parseInt(localStorage.getItem('totalStars') || '0') >= ach.requirement;
    case 'performance':
      const fillGames = parseInt(localStorage.getItem('fillGamesCompleted') || '0');
      const cardGames = parseInt(localStorage.getItem('cardGamesCompleted') || '0');
      const quizGames = parseInt(localStorage.getItem('quizGamesCompleted') || '0');
      const spellingGames = parseInt(localStorage.getItem('spellingGamesCompleted') || '0');
      const matchingGames = parseInt(localStorage.getItem('matchingGamesCompleted') || '0');
      const timeChallengeGames = parseInt(localStorage.getItem('timeChallengeGamesCompleted') || '0');
      return (fillGames + cardGames + quizGames + spellingGames + matchingGames + timeChallengeGames) >= ach.requirement;
    // ... 其餘類型依 achievement.html 實作 ...
    default:
      return false;
  }
}

// 匯出API
window.AchievementAPI = {
  achievements,
  getClaimedAchievements,
  getClaimableAchievements,
  getUnlockedAchievements,
  getAllClaimedAchievements,
  checkAchievementUnlocked
}; 