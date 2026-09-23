// js/inventory.js
// 共用背包系統

/**
 * 背包系統版本
 * 用於資料遷移控制
 */
const INVENTORY_VERSION = 2;

/**
 * 背包初始格數
 */
const DEFAULT_INVENTORY_SLOTS = 10;

/**
 * 背包容量配置
 */
const INVENTORY_CONFIG = {
  defaultCapacity: DEFAULT_INVENTORY_SLOTS,
  expandSlots: 5,
  maxCapacity: 100,
  expandCost: 500
};

/**
 * 背包資料 localStorage key
 */
const INVENTORY_KEY = 'playerInventory';

/**
 * 背包資料遷移版本 key
 */
const INVENTORY_VERSION_KEY = 'inventoryVersion';

/**
 * 背包容量 localStorage key
 */
const INVENTORY_CAPACITY_KEY = 'inventoryCapacity';

/**
 * 取得玩家背包資料
 * @returns {object} 背包資料
 */
function getInventory() {
  try {
    const data = localStorage.getItem(INVENTORY_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('讀取背包資料失敗:', error);
    return {};
  }
}

/**
 * 保存玩家背包資料
 * @param {object} inventory - 背包資料
 */
function saveInventory(inventory) {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  } catch (error) {
    console.error('保存背包資料失敗:', error);
  }
}

/**
 * 遷移舊的抽卡券資料到背包
 */
function migrateOldGachaTickets() {
  const inventory = getInventory();
  
  // 如果已經有普通抽卡券，跳過遷移
  if (inventory.normal_gacha_ticket !== undefined) {
    return;
  }
  
  // 從舊的 gachaTickets 遷移
  const oldTickets = parseInt(localStorage.getItem('gachaTickets') || '0');
  if (oldTickets > 0) {
    inventory.normal_gacha_ticket = oldTickets;
    console.log(`遷移普通抽卡券: ${oldTickets} 張 -> inventory.normal_gacha_ticket`);
  }
  
  saveInventory(inventory);
}

/**
 * 遷移舊的改名卡資料到背包
 */
function migrateOldRenameCards() {
  const inventory = getInventory();
  
  // 如果已經有改名卡，跳過遷移
  if (inventory.rename_card !== undefined) {
    return;
  }
  
  // 從舊的 playerItems 遷移
  try {
    const oldItems = JSON.parse(localStorage.getItem('playerItems') || '{}');
    const oldRenameCards = parseInt(oldItems.rename_card || '0');
    if (oldRenameCards > 0) {
      inventory.rename_card = oldRenameCards;
      console.log(`遷移改名卡: ${oldRenameCards} 張 -> inventory.rename_card`);
    }
  } catch (error) {
    console.error('遷移改名卡失敗:', error);
  }
  
  saveInventory(inventory);
}

/**
 * 遷移系列抽卡券到背包
 */
function migrateSeriesGachaTickets() {
  const inventory = getInventory();
  
  try {
    const seriesTicketsData = localStorage.getItem('seriesGachaTickets');
    if (!seriesTicketsData) return;
    
    const seriesTickets = JSON.parse(seriesTicketsData);
    let migratedCount = 0;
    
    Object.keys(seriesTickets).forEach(seriesName => {
      const count = parseInt(seriesTickets[seriesName]) || 0;
      if (count > 0) {
        const itemId = `series_ticket_${seriesName}`;
        
        // 如果背包中還沒有這個系列券，遷移
        if (inventory[itemId] === undefined) {
          inventory[itemId] = count;
          migratedCount++;
          console.log(`遷移系列抽卡券: ${seriesName} ${count} 張 -> inventory.${itemId}`);
        }
      }
    });
    
    if (migratedCount > 0) {
      saveInventory(inventory);
      console.log(`系列抽卡券遷移完成，共遷移 ${migratedCount} 個系列`);
    }
  } catch (error) {
    console.error('遷移系列抽卡券失敗:', error);
  }
}

/**
 * 初始化背包系統（包含資料遷移）
 */
function initInventory() {
  const currentVersion = parseInt(localStorage.getItem(INVENTORY_VERSION_KEY) || '0');
  
  if (currentVersion < INVENTORY_VERSION) {
    console.log('執行背包資料遷移...');
    migrateOldGachaTickets();
    migrateOldRenameCards();
    migrateSeriesGachaTickets();
    localStorage.setItem(INVENTORY_VERSION_KEY, INVENTORY_VERSION.toString());
    console.log('背包資料遷移完成');
  }

  // 第一次使用背包時，設定初始容量為 10 格
  const savedCapacity = localStorage.getItem(INVENTORY_CAPACITY_KEY);
  if (savedCapacity === null) {
    localStorage.setItem(INVENTORY_CAPACITY_KEY, String(DEFAULT_INVENTORY_SLOTS));
    console.log(`背包容量初始化：${DEFAULT_INVENTORY_SLOTS} 格`);
  }
}

/**
 * 取得道具數量
 * @param {string} itemId - 道具 ID
 * @returns {number} 道具數量
 */
function getItemCount(itemId) {
  const inventory = getInventory();
  return Number(inventory[itemId] || 0);
}

/**
 * 增加道具
 * @param {string} itemId - 道具 ID
 * @param {number} amount - 增加數量（預設 1）
 * @returns {boolean} 是否成功
 */
function addItem(itemId, amount = 1) {
  if (amount <= 0) {
    console.warn('addItem: amount 必須大於 0');
    return false;
  }
  
  // 檢查是否還有空位（可堆疊道具會自動佔用原本格子）
  if (!canAddItem(itemId)) {
    console.warn(`addItem: 背包已滿，無法放入 ${itemId}`);
    if (typeof showToast === 'function') {
      showToast('背包已滿，請先使用道具或擴充背包格數', 'error');
    }
    return false;
  }
  
  const inventory = getInventory();
  const current = Number(inventory[itemId] || 0);
  inventory[itemId] = current + amount;
  saveInventory(inventory);
  
  console.log(`增加道具: ${itemId} +${amount} (總計: ${inventory[itemId]})`);
  return true;
}

/**
 * 移除道具
 * @param {string} itemId - 道具 ID
 * @param {number} amount - 移除數量（預設 1）
 * @returns {boolean} 是否成功
 */
function removeItem(itemId, amount = 1) {
  if (amount <= 0) {
    console.warn('removeItem: amount 必須大於 0');
    return false;
  }
  
  const inventory = getInventory();
  const current = Number(inventory[itemId] || 0);
  
  if (current < amount) {
    console.warn(`removeItem: 數量不足 (需要: ${amount}, 擁有: ${current})`);
    return false;
  }
  
  const newCount = current - amount;
  if (newCount <= 0) {
    delete inventory[itemId];
  } else {
    inventory[itemId] = newCount;
  }
  
  saveInventory(inventory);
  
  console.log(`移除道具: ${itemId} -${amount} (剩餘: ${newCount})`);
  return true;
}

/**
 * 使用道具
 * @param {string} itemId - 道具 ID
 * @returns {Promise<boolean>} 是否成功
 */
async function useItem(itemId) {
  const item = getItemInfo(itemId);
  if (!item) {
    console.error('找不到道具:', itemId);
    if (typeof showToast === 'function') {
      showToast('找不到這個道具', 'error');
    }
    return false;
  }
  
  const count = getItemCount(itemId);
  if (count <= 0) {
    console.warn('道具數量不足:', itemId);
    if (typeof showToast === 'function') {
      showToast('你沒有這個道具', 'error');
    }
    return false;
  }
  
  if (!item.usable) {
    console.warn('這個道具不能使用:', itemId);
    if (typeof showToast === 'function') {
      showToast('這個道具不能使用', 'error');
    }
    return false;
  }
  
  // 根據道具類型執行不同功能
  switch (item.type) {
    case 'rename':
      return await useRenameCard();
    case 'gacha_ticket':
      // 抽卡券不直接在背包使用，而是跳轉到抽卡頁
      if (typeof showToast === 'function') {
        showToast('請前往抽卡頁使用抽卡券', 'info');
      }
      window.location.href = 'gacha.html';
      return false;
    case 'exp':
      return await useExpCard(item);
    case 'stage_key':
      return await useStageKey(item);
    case 'bag_expand':
      return useBagExpandTicket(item);
    default:
      console.warn('這個道具目前不能使用:', itemId);
      if (typeof showToast === 'function') {
        showToast('這個道具目前不能使用', 'error');
      }
      return false;
  }
}

/**
 * 使用改名卡
 * @returns {Promise<boolean>} 是否成功
 */
async function useRenameCard() {
  // 檢查是否正在使用中
  if (window.isUsingRenameCard) {
    console.warn('正在使用改名卡中，請稍候');
    return false;
  }
  
  window.isUsingRenameCard = true;
  
  try {
    const currentName = localStorage.getItem('playerName') || localStorage.getItem('currentUser') || '';
    const renameCardCount = getItemCount('rename_card');
    
    // 顯示改名 Modal
    const modal = document.getElementById('renameModal');
    if (!modal) {
      console.error('找不到改名 Modal');
      return false;
    }
    
    // 設定目前名稱
    const currentNameEl = document.getElementById('currentPlayerName');
    if (currentNameEl) {
      currentNameEl.textContent = currentName || '未設定';
    }
    
    // 設定改名卡數量
    const renameCardCountEl = document.getElementById('renameCardCount');
    if (renameCardCountEl) {
      renameCardCountEl.textContent = `剩餘 ${renameCardCount} 張`;
    }
    
    // 設定使用後數量
    const renameCardAfterEl = document.getElementById('renameCardAfter');
    if (renameCardAfterEl) {
      const afterCount = Math.max(0, renameCardCount - 1);
      renameCardAfterEl.textContent = `${afterCount} 張`;
    }
    
    // 清空輸入框
    const newNameInput = document.getElementById('newPlayerName');
    if (newNameInput) {
      newNameInput.value = '';
    }
    
    // 顯示 Modal
    modal.style.display = 'flex';
    
    return true;
  } catch (error) {
    console.error('使用改名卡失敗:', error);
    if (typeof showToast === 'function') {
      showToast('使用改名卡失敗', 'error');
    }
    return false;
  } finally {
    window.isUsingRenameCard = false;
  }
}

/**
 * 確認改名
 * @returns {boolean} 是否成功
 */
function confirmRename() {
  // 防止重複提交
  if (window.isRenaming) {
    console.warn('正在改名中，請稍候');
    return false;
  }
  
  window.isRenaming = true;
  
  const confirmBtn = document.getElementById('confirmRenameBtn');
  
  try {
    const newNameInput = document.getElementById('newPlayerName');
    if (!newNameInput) {
      console.error('找不到新名稱輸入框');
      if (typeof showToast === 'function') {
        showToast('改名功能異常', 'error');
      }
      return false;
    }
    
    const newName = newNameInput.value.trim();
    const currentName = localStorage.getItem('playerName') || localStorage.getItem('currentUser') || '';
    
    // 驗證新名稱
    if (!newName) {
      if (typeof showToast === 'function') {
        showToast('請輸入新的玩家名稱', 'error');
      }
      return false;
    }
    
    if (newName === currentName) {
      if (typeof showToast === 'function') {
        showToast('新名稱與目前名稱相同，不消耗改名卡', 'info');
      }
      return false;
    }
    
    // 名稱長度限制（2-12 字元）
    if (newName.length < 2 || newName.length > 12) {
      if (typeof showToast === 'function') {
        showToast('玩家名稱長度必須在 2-12 字元之間', 'error');
      }
      return false;
    }
    
    // 確認改名
    if (!confirm(`確定要修改玩家名稱嗎？\n\n${currentName || '未設定'} → ${newName}\n\n本次將消耗 1 張改名卡。`)) {
      return false;
    }
    
    // 禁用按鈕防止重複提交
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = '處理中...';
    }
    
    // 修改玩家名稱 - 同步所有位置
    localStorage.setItem('playerName', newName);
    localStorage.setItem('currentUser', newName);
    
    // 如果有 LinkageSystem，也更新那裡的名稱
    if (typeof LinkageSystem !== 'undefined' && LinkageSystem.player && LinkageSystem.player.setName) {
      LinkageSystem.player.setName(newName);
    }
    
    // 扣除改名卡
    const success = removeItem('rename_card', 1);
    if (!success) {
      console.error('扣除改名卡失敗');
      if (typeof showToast === 'function') {
        showToast('扣除改名卡失敗', 'error');
      }
      // 恢復舊名稱
      localStorage.setItem('playerName', currentName);
      localStorage.setItem('currentUser', currentName);
      // 重新啟用按鈕
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = '確認修改';
      }
      return false;
    }
    
    // 更新顯示
    if (typeof updatePlayerNameDisplay === 'function') {
      updatePlayerNameDisplay(newName);
    }
    
    // 關閉 Modal
    const modal = document.getElementById('renameModal');
    if (modal) {
      modal.style.display = 'none';
    }
    
    // 顯示成功訊息
    if (typeof showToast === 'function') {
      showToast(`✅ 玩家名稱修改成功\n${currentName || '未設定'} → ${newName}`, 'success');
    }
    
    console.log(`改名成功: ${currentName || '未設定'} -> ${newName}`);
    
    // 重新啟用按鈕
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = '確認修改';
    }
    
    // 發送自訂事件通知其他頁面
    window.dispatchEvent(new CustomEvent('playerNameChanged', {
      detail: { oldName: currentName, newName: newName }
    }));
    
    return true;
  } catch (error) {
    console.error('改名失敗:', error);
    if (typeof showToast === 'function') {
      showToast('改名失敗', 'error');
    }
    // 重新啟用按鈕
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = '確認修改';
    }
    return false;
  } finally {
    window.isRenaming = false;
  }
}

/**
 * 取消改名
 */
function cancelRename() {
  const modal = document.getElementById('renameModal');
  if (modal) {
    modal.style.display = 'none';
  }
  
  // 清空輸入框
  const newNameInput = document.getElementById('newPlayerName');
  if (newNameInput) {
    newNameInput.value = '';
  }
}

/**
 * 使用關卡鑰匙
 * @param {object} item - 道具資訊
 * @returns {Promise<boolean>} 是否成功
 */
async function useStageKey(item) {
  const stageNumber = item.stageNumber;
  if (!stageNumber) {
    console.error('關卡鑰匙缺少 stageNumber 資訊:', item);
    if (typeof showToast === 'function') {
      showToast('這個鑰匙資訊有誤', 'error');
    }
    return false;
  }
  
  // 檢查關卡是否已經解鎖
  const unlockKey = `level_${stageNumber}_unlocked`;
  const isUnlocked = localStorage.getItem(unlockKey) === 'true';
  
  if (isUnlocked) {
    if (typeof showToast === 'function') {
      showToast(`第 ${stageNumber} 關已經解鎖，不需要使用鑰匙`, 'info');
    }
    return false;
  }
  
  // 確認使用鑰匙
  const confirmed = confirm(`🔑 確定要使用鑰匙解鎖第 ${stageNumber} 關嗎？\n\n使用後鑰匙將會消耗。`);
  if (!confirmed) {
    return false;
  }
  
  // 解鎖關卡
  localStorage.setItem(unlockKey, 'true');
  
  // 扣除鑰匙
  const success = removeItem(item.id, 1);
  if (!success) {
    console.error('扣除鑰匙失敗');
    // 恢復解鎖狀態
    localStorage.removeItem(unlockKey);
    if (typeof showToast === 'function') {
      showToast('使用鑰匙失敗', 'error');
    }
    return false;
  }
  
  // 顯示成功訊息
  if (typeof showToast === 'function') {
    showToast(`✅ 第 ${stageNumber} 關解鎖成功！`, 'success');
  }
  
  console.log(`關卡鑰匙使用成功: 第 ${stageNumber} 關`);
  
  // 如果在文章練習頁面，重新載入關卡列表
  if (typeof loadReadingLevels === 'function') {
    loadReadingLevels();
  }
  
  return true;
}

/**
 * 使用背包擴充券
 * @param {object} item - 道具資訊
 * @returns {boolean} 是否成功
 */
function useBagExpandTicket(item) {
  const expandValue = item.expandValue || 5;
  const currentCapacity = getInventoryCapacity();
  const newCapacity = Math.min(currentCapacity + expandValue, INVENTORY_CONFIG.maxCapacity);
  
  if (currentCapacity >= INVENTORY_CONFIG.maxCapacity) {
    if (typeof showToast === 'function') {
      showToast('背包容量已達上限', 'error');
    }
    return false;
  }
  
  // 扣除道具
  const success = removeItem(item.id, 1);
  if (!success) {
    console.error('扣除背包擴充券失敗');
    if (typeof showToast === 'function') {
      showToast('扣除背包擴充券失敗', 'error');
    }
    return false;
  }
  
  // 增加背包容量
  saveInventoryCapacity(newCapacity);
  
  // 顯示成功訊息
  if (typeof showToast === 'function') {
    showToast(`✅ 背包容量已增加 ${expandValue} 格，目前共有 ${newCapacity} 格`, 'success');
  }
  
  console.log(`背包擴充券使用成功: ${currentCapacity} → ${newCapacity}`);
  
  // 如果在背包頁面，重新渲染
  if (typeof renderInventory === 'function') {
    renderInventory();
  }
  
  return true;
}

/**
 * 使用經驗幫
 * @param {object} item - 道具資訊
 * @returns {Promise<boolean>} 是否成功
 */
async function useExpCard(item) {
  const expValue = item.expValue || 0;
  
  if (expValue <= 0) {
    console.error('經驗幫沒有設定 expValue:', item);
    if (typeof showToast === 'function') {
      showToast('這個經驗幫沒有設定經驗值', 'error');
    }
    return false;
  }
  
  // 扣除道具
  const success = removeItem(item.id, 1);
  if (!success) {
    console.error('扣除經驗幫失敗');
    if (typeof showToast === 'function') {
      showToast('扣除經驗幫失敗', 'error');
    }
    return false;
  }
  
  // 增加經驗值
  if (typeof addSpentStars === 'function') {
    const result = addSpentStars(expValue * 100, 'exp-card', item.id);
    console.log('經驗幫使用結果:', result);
    
    if (typeof showToast === 'function') {
      const previousLevel = result.previousLevel;
      const currentLevel = result.currentLevel;
      
      if (result.leveledUp) {
        showToast(`獲得 ${expValue} EXP！升級 Lv.${previousLevel} → Lv.${currentLevel}`, 'success');
      } else {
        showToast(`獲得 ${expValue} EXP`, 'success');
      }
    }
    
    return true;
  } else {
    console.error('找不到 addSpentStars 函數');
    if (typeof showToast === 'function') {
      showToast('經驗值系統未載入', 'error');
    }
    return false;
  }
}

/**
 * 取得背包中所有道具（只返回數量 > 0 的）
 * @returns {object} 道具資料 { itemId: count }
 */
function getInventoryItems() {
  const inventory = getInventory();
  const items = {};
  
  for (const [itemId, count] of Object.entries(inventory)) {
    if (count > 0) {
      items[itemId] = count;
    }
  }
  
  return items;
}

/**
 * 取得背包容量
 * @returns {number} 背包容量
 */
function getInventoryCapacity() {
  const capacity = localStorage.getItem(INVENTORY_CAPACITY_KEY);
  return capacity ? parseInt(capacity) : INVENTORY_CONFIG.defaultCapacity;
}

/**
 * 保存背包容量
 * @param {number} capacity 背包容量
 */
function saveInventoryCapacity(capacity) {
  localStorage.setItem(INVENTORY_CAPACITY_KEY, capacity.toString());
}

/**
 * 取得已使用格數
 * @returns {number} 已使用格數
 */
function getUsedSlots() {
  const items = getInventoryItems();
  return Object.keys(items).length;
}

/**
 * 取得最大背包格數（別名）
 * @returns {number} 背包最大格數
 */
function getInventoryMaxSlots() {
  return getInventoryCapacity();
}

/**
 * 取得目前已使用格數（別名）
 * @returns {number} 已使用格數
 */
function getInventoryUsedSlots() {
  return getUsedSlots();
}

/**
 * 判斷道具是否可堆疊
 * @param {object|string} item 道具資料或 ID
 * @returns {boolean}
 */
function isStackableItem(item) {
  if (typeof item === 'object' && item) {
    return item.stackable !== false;
  }
  return true;
}

/**
 * 判斷商品是否占用背包格子
 * @param {object} shopItem 商店商品
 * @returns {boolean}
 */
function itemNeedsInventorySlot(shopItem) {
  const type = String(shopItem?.type || shopItem?.category || '');

  const noSlotTypes = [
    'currency',
    'coin',
    'coins',
    'star',
    'stars',
    'diamond',
    'exp',
    'experience'
  ];

  return !noSlotTypes.includes(type.toLowerCase());
}

/**
 * 取得新增多個道具所需的格數
 * @param {Array} rewardItems 道具陣列
 * @returns {number} 所需新格數
 */
function getRequiredNewSlots(rewardItems) {
  const inventory = getInventory();
  let requiredSlots = 0;

  for (const reward of rewardItems) {
    if (!itemNeedsInventorySlot(reward)) continue;

    const itemId = reward.id || reward.itemId;
    const existing = inventory[itemId] && inventory[itemId] > 0;

    if (!existing) {
      requiredSlots += 1;
    }
  }

  return requiredSlots;
}

/**
 * 檢查是否可一次新增多個獎勵道具
 * @param {Array} rewardItems 道具陣列
 * @returns {object} { canAdd: boolean, reason: string }
 */
function canAddRewardItemsToInventory(rewardItems) {
  const maxSlots = getInventoryMaxSlots();
  const usedSlots = getInventoryUsedSlots();
  const requiredSlots = getRequiredNewSlots(rewardItems);

  if (usedSlots + requiredSlots > maxSlots) {
    return {
      canAdd: false,
      reason: `背包空間不足，需要 ${requiredSlots} 格，目前剩餘 ${maxSlots - usedSlots} 格`
    };
  }

  return { canAdd: true, reason: '' };
}

/**
 * 檢查是否可以新增道具
 * @param {string} itemId 道具 ID
 * @returns {boolean} 是否可以新增
 */
function canAddItem(itemId) {
  const inventory = getInventory();
  const capacity = getInventoryCapacity();
  
  // 如果道具已存在，可以堆疊
  if (inventory[itemId] && inventory[itemId] > 0) {
    return true;
  }
  
  // 如果道具不存在，檢查是否有空格
  const usedSlots = getUsedSlots();
  return usedSlots < capacity;
}

/**
 * 擴充背包容量
 * @returns {boolean} 是否成功擴充
 */
function expandInventory() {
  const currentCapacity = getInventoryCapacity();
  
  if (currentCapacity >= INVENTORY_CONFIG.maxCapacity) {
    return false;
  }
  
  const newCapacity = Math.min(currentCapacity + INVENTORY_CONFIG.expandSlots, INVENTORY_CONFIG.maxCapacity);
  saveInventoryCapacity(newCapacity);
  
  return true;
}

/**
 * 增加背包格數（使用背包擴充券）
 * @param {number} amount - 增加格數
 * @returns {number} 新的背包容量
 */
function increaseInventorySlots(amount) {
  const currentCapacity = getInventoryCapacity();
  const newCapacity = Math.min(currentCapacity + amount, INVENTORY_CONFIG.maxCapacity);
  saveInventoryCapacity(newCapacity);
  
  if (typeof showToast === 'function') {
    showToast(`背包容量已增加，目前共有 ${newCapacity} 格`, 'success');
  }
  
  return newCapacity;
}

// 頁面載入時初始化背包
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initInventory();
  });

  // 將函式與常數暴露到 window 物件
  window.getInventoryCapacity = getInventoryCapacity;
  window.getInventoryMaxSlots = getInventoryMaxSlots;
  window.getInventoryUsedSlots = getInventoryUsedSlots;
  window.saveInventoryCapacity = saveInventoryCapacity;
  window.getUsedSlots = getUsedSlots;
  window.canAddItem = canAddItem;
  window.canAddRewardItemsToInventory = canAddRewardItemsToInventory;
  window.itemNeedsInventorySlot = itemNeedsInventorySlot;
  window.getRequiredNewSlots = getRequiredNewSlots;
  window.expandInventory = expandInventory;
  window.increaseInventorySlots = increaseInventorySlots;
  window.DEFAULT_INVENTORY_SLOTS = DEFAULT_INVENTORY_SLOTS;
  window.INVENTORY_CONFIG = INVENTORY_CONFIG;
}
