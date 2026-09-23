/**
 * 背包全頁彈窗 (inventory modal)
 * 透過 iframe 載入 inventory.html，維持同一份 localStorage 資料
 */
(function () {
  'use strict';

  const MODAL_ID = 'inventoryModal';
  const CSS_ID = 'inventoryModalStyles';

  function createInventoryModal() {
    if (document.getElementById(MODAL_ID)) return;

    const styles = document.createElement('style');
    styles.id = CSS_ID;
    styles.textContent = `
      .inventory-modal {
        position: fixed;
        inset: 0;
        z-index: 99999;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.22s ease, visibility 0.22s ease;
      }

      .inventory-modal.show {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      .inventory-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(4px);
        z-index: 1;
        cursor: pointer;
      }

      .inventory-modal-container {
        position: absolute;
        top: 50%;
        left: 50%;
        width: min(1200px, 94vw);
        height: min(850px, 92vh);
        transform: translate(-50%, -50%) scale(0.96);
        background: #0a0e27;
        border-radius: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        z-index: 2;
        transition: transform 0.22s ease;
      }

      .inventory-modal.show .inventory-modal-container {
        transform: translate(-50%, -50%) scale(1);
      }

      .inventory-modal-header {
        position: relative;
        flex: 0 0 56px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        background: rgba(10, 20, 40, 0.9);
        border-bottom: 2px solid #00ffff;
        color: #fff;
        z-index: 10;
      }

      .inventory-modal-title {
        font-size: 1.25rem;
        font-weight: 700;
        letter-spacing: 1px;
      }

      .inventory-modal-close {
        position: relative;
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        font-size: 1.2rem;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s, transform 0.2s;
        z-index: 11;
      }

      .inventory-modal-close:hover {
        background: rgba(255, 107, 107, 0.8);
        transform: scale(1.08);
      }

      .inventory-modal-content {
        flex: 1;
        min-height: 0;
        position: relative;
        z-index: 1;
      }

      .inventory-frame {
        width: 100%;
        height: 100%;
        border: 0;
        display: block;
      }

      .inventory-modal-open {
        overflow: hidden;
      }

      @media (max-width: 768px) {
        .inventory-modal-container {
          width: 96vw;
          height: 94vh;
          border-radius: 14px;
        }
      }
    `;
    document.head.appendChild(styles);

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'inventory-modal';
    modal.innerHTML = `
      <div class="inventory-modal-backdrop"></div>
      <div class="inventory-modal-container">
        <div class="inventory-modal-header">
          <div class="inventory-modal-title">🎒 玩家背包</div>
          <button id="closeInventoryModal" class="inventory-modal-close" type="button" aria-label="關閉背包">✕</button>
        </div>
        <div class="inventory-modal-content">
          <iframe id="inventoryFrame" class="inventory-frame" src="" title="玩家背包"></iframe>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const frame = document.getElementById('inventoryFrame');
    const closeBtn = document.getElementById('closeInventoryModal');

    let frameLoaded = false;
    frame.addEventListener('load', () => {
      frameLoaded = true;
      postRefresh(frame);
    });

    function postRefresh(targetFrame) {
      try {
        if (targetFrame && targetFrame.contentWindow) {
          targetFrame.contentWindow.postMessage({ type: 'REFRESH_INVENTORY' }, '*');
        }
      } catch (err) {
        console.warn('背包 postMessage 同步失敗:', err);
      }
    }

    function openInventoryModal() {
      if (!modal || !frame) return;

      if (frame.dataset.loaded !== 'true') {
        frame.src = 'inventory.html';
        frame.dataset.loaded = 'true';
      } else if (frameLoaded) {
        postRefresh(frame);
      }

      console.log('開啟背包');
      modal.classList.add('show');
      document.body.classList.add('inventory-modal-open');
    }
    window.openInventoryModal = openInventoryModal;

    function closeInventoryModal() {
      if (!modal) return;
      console.log('關閉背包');
      modal.classList.remove('show');
      document.body.classList.remove('inventory-modal-open');
    }
    window.closeInventoryModal = closeInventoryModal;

    closeBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('點擊關閉背包');
      closeInventoryModal();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('inventory-modal-backdrop')) {
        closeInventoryModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeInventoryModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createInventoryModal);
  } else {
    createInventoryModal();
  }
})();
