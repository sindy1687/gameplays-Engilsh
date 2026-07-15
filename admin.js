let currentAdminPasskey = '';

function getAdminPasskey() {
  return currentAdminPasskey || sessionStorage.getItem('adminPasskey') || '';
}

function adminLogin() {
  const input = document.getElementById('adminPasskey');
  const passkey = input?.value.trim() || '';

  if (!passkey) {
    alert('請輸入管理者密碼');
    return;
  }

  currentAdminPasskey = passkey;
  sessionStorage.setItem('adminPasskey', passkey);
  sessionStorage.setItem('adminLoggedIn', 'true');

  showAdminPanel();
}

function adminLogout() {
  currentAdminPasskey = '';
  sessionStorage.removeItem('adminPasskey');
  sessionStorage.removeItem('adminLoggedIn');
  showAdminLogin();
}

function showAdminLogin() {
  document.getElementById('adminLoginBox')?.classList.remove('hidden');
  document.getElementById('adminPanel')?.classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('adminLoginBox')?.classList.add('hidden');
  document.getElementById('adminPanel')?.classList.remove('hidden');
}

function checkAdminLogin() {
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    currentAdminPasskey = sessionStorage.getItem('adminPasskey') || '';
    showAdminPanel();
  } else {
    showAdminLogin();
  }
}

async function callApi(payload) {
  const api = window.GoogleSheetTradeApi;
  if (!api) {
    throw new Error('Google Sheet API 未載入');
  }

  const scriptUrl = api.getScriptUrl();
  if (!scriptUrl) {
    throw new Error('請先設定 Google Apps Script URL');
  }

  const response = await fetch(scriptUrl, {
    method: 'POST',
    mode: 'cors',
    body: JSON.stringify(payload)
  });

  const rawText = await response.text();
  let json;

  try {
    json = JSON.parse(rawText);
  } catch (error) {
    throw new Error(`API 回傳格式錯誤：${rawText.slice(0, 120) || '空白回應'}`);
  }

  if (!response.ok) {
    throw new Error(json.message || `請求失敗 (${response.status})`);
  }

  if (json && json.success === false) {
    throw new Error(json.message || '操作失敗');
  }

  return json;
}

async function adminGetPlayer() {
  try {
    const userId = document.getElementById('adminUserId')?.value.trim();

    if (!userId) {
      alert('請輸入玩家名稱或 ID');
      return;
    }

    const result = await callApi({
      action: 'adminGetPlayer',
      adminPasskey: getAdminPasskey(),
      userId
    });

    if (!result || result.success === false) {
      throw new Error(result?.message || '查詢玩家失敗');
    }

    renderAdminPlayerInfo(result.player);

  } catch (error) {
    console.error('[管理者查詢玩家失敗]', error);
    alert(`查詢玩家失敗：${error.message}`);
  }
}

async function adminAdjustStars(type) {
  try {
    const userId = document.getElementById('adminUserId')?.value.trim();
    const amount = Number(document.getElementById('adminStarAmount')?.value);
    const reason = document.getElementById('adminReason')?.value.trim();

    if (!userId) {
      alert('請先輸入玩家名稱或 ID');
      return;
    }

    if (!Number.isInteger(amount) || amount < 0) {
      alert('請輸入正確的星星數量');
      return;
    }

    if (!reason) {
      alert('請輸入調整原因');
      return;
    }

    const confirmText =
      type === 'add'
        ? `確定要增加 ${amount} 顆星星嗎？` 
        : type === 'subtract'
          ? `確定要扣除 ${amount} 顆星星嗎？` 
          : `確定要直接設定為 ${amount} 顆星星嗎？`;

    if (!confirm(confirmText)) return;

    const result = await callApi({
      action: 'adminAdjustStars',
      adminPasskey: getAdminPasskey(),
      userId,
      type,
      amount,
      reason
    });

    if (!result || result.success === false) {
      throw new Error(result?.message || '星星調整失敗');
    }

    alert('星星調整成功');
    await adminGetPlayer();
    await adminGetLogs();

  } catch (error) {
    console.error('[管理者調整星星失敗]', error);
    alert(`星星調整失敗：${error.message}`);
  }
}

async function adminUnlockItem() {
  try {
    const userId = document.getElementById('adminUserId')?.value.trim();
    const unlockType = document.getElementById('adminUnlockType')?.value;
    const unlockId = document.getElementById('adminUnlockId')?.value.trim();
    const reason = document.getElementById('adminUnlockReason')?.value.trim();

    if (!userId) {
      alert('請先輸入玩家名稱或 ID');
      return;
    }

    if (!unlockId) {
      alert('請輸入要解鎖的 ID 或名稱');
      return;
    }

    if (!reason) {
      alert('請輸入解鎖原因');
      return;
    }

    if (!confirm(`確定要幫玩家解鎖「${unlockId}」嗎？`)) return;

    const result = await callApi({
      action: 'adminUnlockItem',
      adminPasskey: getAdminPasskey(),
      userId,
      unlockType,
      unlockId,
      reason
    });

    if (!result || result.success === false) {
      throw new Error(result?.message || '解鎖失敗');
    }

    alert('解鎖成功');
    await adminGetPlayer();
    await adminGetLogs();

  } catch (error) {
    console.error('[管理者解鎖失敗]', error);
    alert(`解鎖失敗：${error.message}`);
  }
}

async function adminSendReward() {
  try {
    const userId = document.getElementById('adminRewardUserId')?.value.trim();
    const rewardType = document.getElementById('adminRewardType')?.value;
    const rewardValue = document.getElementById('adminRewardValue')?.value.trim();
    const amount = Number(document.getElementById('adminRewardAmount')?.value || 1);
    const reason = document.getElementById('adminRewardReason')?.value.trim();

    if (!userId) {
      alert('請輸入玩家 ID 或名稱');
      return;
    }

    if (!rewardType) {
      alert('請選擇獎勵類型');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert('請輸入正確數量');
      return;
    }

    if (!reason) {
      alert('請輸入發放原因');
      return;
    }

    const confirmText = `確定要發放 ${rewardType} 給玩家 ${userId} 嗎？`;

    if (!confirm(confirmText)) {
      return;
    }

    const result = await callApi({
      action: 'adminCreateReward',
      adminPasskey: getAdminPasskey(),
      userId,
      rewardType,
      rewardValue,
      amount,
      reason
    });

    if (!result || result.success === false) {
      throw new Error(result?.message || '發放獎勵失敗');
    }

    alert('獎勵已發放，玩家登入後可以領取');

    document.getElementById('adminRewardValue').value = '';
    document.getElementById('adminRewardAmount').value = '1';
    document.getElementById('adminRewardReason').value = '';

    await adminGetLogs();

  } catch (error) {
    console.error('[管理者發放獎勵失敗]', error);
    alert(`發放獎勵失敗：${error.message}`);
  }
}

function renderAdminPlayerInfo(player) {
  const box = document.getElementById('adminPlayerInfo');

  if (!box) return;

  if (!player) {
    box.textContent = '找不到玩家資料';
    return;
  }

  const unlockedCards = Array.isArray(player.unlockedCards)
    ? player.unlockedCards.length
    : String(player.unlockedCards || '').split(',').filter(Boolean).length;

  box.innerHTML = `
    <div class="admin-info-row">
      <div class="admin-info-label">玩家名稱</div>
      <div class="admin-info-value">${escapeHtml(player.name || player.userName || player.userId || '')}</div>
    </div>

    <div class="admin-info-row">
      <div class="admin-info-label">玩家 ID</div>
      <div class="admin-info-value">${escapeHtml(player.userId || player.id || '')}</div>
    </div>

    <div class="admin-info-row">
      <div class="admin-info-label">星星數</div>
      <div class="admin-info-value">${Number(player.stars || 0)} 顆</div>
    </div>

    <div class="admin-info-row">
      <div class="admin-info-label">已解鎖卡片</div>
      <div class="admin-info-value">${unlockedCards} 張</div>
    </div>

    <div class="admin-info-row">
      <div class="admin-info-label">已解鎖系列</div>
      <div class="admin-info-value">${escapeHtml(player.unlockedSeries || '尚無資料')}</div>
    </div>

    <div class="admin-info-row">
      <div class="admin-info-label">已解鎖主題</div>
      <div class="admin-info-value">${escapeHtml(player.unlockedThemes || '尚無資料')}</div>
    </div>

    <div class="admin-info-row">
      <div class="admin-info-label">最後更新</div>
      <div class="admin-info-value">${escapeHtml(player.updatedAt || '尚無資料')}</div>
    </div>
  `;
}

async function adminGetLogs() {
  try {
    const result = await callApi({
      action: 'adminGetLogs',
      adminPasskey: getAdminPasskey()
    });

    if (!result || result.success === false) {
      throw new Error(result?.message || '讀取操作紀錄失敗');
    }

    renderAdminLogs(result.logs || []);

  } catch (error) {
    console.error('[讀取管理紀錄失敗]', error);
    alert(`讀取管理紀錄失敗：${error.message}`);
  }
}

function renderAdminLogs(logs) {
  const box = document.getElementById('adminLogs');
  if (!box) return;

  if (!logs.length) {
    box.textContent = '尚無紀錄';
    return;
  }

  box.innerHTML = logs.map(log => `
    <div class="admin-log-item">
      <div><strong>時間：</strong>${escapeHtml(log.time || '')}</div>
      <div><strong>玩家：</strong>${escapeHtml(log.userId || '')}</div>
      <div><strong>操作：</strong>${escapeHtml(log.action || '')}</div>
      <div><strong>內容：</strong>${escapeHtml(log.detail || '')}</div>
      <div><strong>原因：</strong>${escapeHtml(log.reason || '')}</div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.addEventListener('DOMContentLoaded', checkAdminLogin);
