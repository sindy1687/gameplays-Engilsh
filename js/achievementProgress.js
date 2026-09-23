(function () {
  'use strict';
  function read(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v === null ? fallback : v; } catch (_) { return fallback; }
  }
  const num = k => Math.max(0, Number(read(k, 0)) || 0);
  const arr = k => { const v = read(k, []); return Array.isArray(v) ? v : []; };
  const additions = [
    ['checkin_7', '簽到新手', 'checkin', 7, 10, '累積簽到7天'],
    ['checkin_30', '簽到常客', 'checkin', 30, 30, '累積簽到30天'],
    ['checkin_streak_7', '持續學習', 'checkin_streak', 7, 20, '連續7天簽到（不含補簽）'],
    ['learn_unique_100', '百字累積', 'learn_unique', 100, 20, '答對100個不同的單字本單字'],
    ['learn_unique_500', '詞彙拓展', 'learn_unique', 500, 50, '答對500個不同的單字本單字'],
    ['learn_unique_800', '八百字達人', 'learn_unique', 800, 80, '答對800個不同的單字本單字'],
    ['negotiation_1', '首次議價', 'negotiation', 1, 5, '完成一次AI議價出售'],
    ['negotiation_10', '議價好手', 'negotiation', 10, 15, '完成10次AI議價出售']
  ].map(([id, name, type, requirement, reward, description]) => ({ id, name, type, requirement, reward, description, icon: '🏅' }));
  function streak() {
    const data = read('checkinData', {});
    const dates = Object.keys(data).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k) && data[k] && !data[k].isMakeup).sort();
    let last = null, run = 0, best = 0;
    dates.forEach(k => { const day = Date.parse(k + 'T00:00:00Z') / 86400000; run = day === last + 1 ? run + 1 : 1; best = Math.max(best, run); last = day; });
    return best;
  }
  function progress(a) {
    const owned = read('ownedCards', {});
    const words = Object.keys(owned).filter(k => Number(owned[k]) > 0 || owned[k] === true);
    let value;
    switch (a.type) {
      case 'collection': case 'special': value = words.length; break;
      case 'rarity': value = (window.allCards || []).filter(c => words.includes(c.word) && c.rarity === a.rarity).length; break;
      case 'ssr_special': value = words.includes(a.id.replace('ssr_', '')) ? 1 : 0; break;
      case 'stars': value = num('totalStars'); break;
      case 'shards': value = Object.values(read('cardShards', {})).reduce((s, v) => s + (Number(v) || 0), 0); break;
      case 'performance': value = ['fill', 'card', 'quiz', 'spelling', 'matching', 'timeChallenge'].reduce((s, k) => s + num(k + 'GamesCompleted'), 0); break;
      case 'vocabulary': value = num('vocabularyCorrectWords'); break;
      case 'zodiac': value = arr('passed_atlas').includes(a.id.replace('pass_', '')) ? 1 : 0; break;
      case 'zodiac_total': value = new Set(arr('passed_atlas')).size; break;
      case 'greek': value = arr('passed_greek').includes(a.id.replace('pass_', '')) ? 1 : 0; break;
      case 'fill': value = num(({ fill_perfect: 'fillPerfectScores', fill_speed: 'fillSpeedGames', fill_streak: 'fillStreakDays', fill_vocab: 'fillCorrectWords' })[a.id] || 'fillGamesCompleted'); break;
      case 'article':
        if (a.id === 'article_practice_3') value = Math.max(num('articlePracticeCount'), new Set(arr('completedReadingLevels')).size);
        else if (a.id === 'article_perfect_score') value = new Set(arr('readingPerfectScores')).size;
        else if (a.id.startsWith('article_level_')) value = arr('completedReadingLevels').includes(Number(a.id.replace('article_level_', ''))) ? 1 : 0;
        else return null;
        break;
      case 'checkin': value = Object.keys(read('checkinData', {})).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).length; break;
      case 'checkin_streak': value = streak(); break;
      case 'learn_unique': value = new Set(arr('vocabularyCorrectWordsList').filter(v => typeof v === 'string').map(v => v.slice(v.lastIndexOf('_') + 1).trim().toLowerCase()).filter(Boolean)).size; break;
      case 'negotiation': value = Math.max(num('aiNegotiationCompleted'), arr('cardTradeHistory').filter(v => v.type === 'ai_sell').length); break;
      default: return null;
    }
    const best = read('achievementProgressBest', {});
    const result = Math.max(Number(best[a.id]) || 0, value, arr('claimedAchievements').includes(a.id) ? a.requirement : 0);
    if (result > (Number(best[a.id]) || 0)) { best[a.id] = result; localStorage.setItem('achievementProgressBest', JSON.stringify(best)); }
    return Math.min(result, a.requirement);
  }
  window.AchievementProgress = { progress, extend(list) {
    additions.forEach(a => { if (!list.some(v => v.id === a.id)) list.push({ ...a }); });
    return list;
  } };
})();
