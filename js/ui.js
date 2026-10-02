/**
 * UI Controller for Wolffe Card Studio (Thai Version)
 * Manages view page transitions, DOM elements, toast alerts, and 3x3 grid rendering
 */
const UI = {
  // Current active view tracker
  currentView: 'viewUpload',

  /**
   * Switch active view page with smooth animation
   * @param {string} viewId - 'viewUpload' | 'viewSelect' | 'viewCropper' | 'viewCard'
   */
  switchView(viewId) {
    const views = ['viewUpload', 'viewSelect', 'viewCropper', 'viewCard'];
    if (!views.includes(viewId)) return;

    this.currentView = viewId;

    views.forEach(id => {
      const page = document.getElementById(id);
      if (!page) return;
      if (id === viewId) {
        page.classList.remove('hidden');
        // Small delay to trigger CSS fade/scale transition smoothly
        requestAnimationFrame(() => {
          page.classList.add('active');
        });
      } else {
        page.classList.remove('active');
        page.classList.add('hidden');
      }
    });

    // Update Top Navigation Breadcrumbs
    const step1 = document.getElementById('navStep1');
    const step2 = document.getElementById('navStep2');
    const step3 = document.getElementById('navStep3');
    const step3Label = document.getElementById('step3Label');

    if (step1 && step2 && step3) {
      step1.classList.remove('active', 'completed');
      step2.classList.remove('active', 'completed');
      step3.classList.remove('active', 'completed');

      if (viewId === 'viewUpload') {
        step1.classList.add('active');
      } else if (viewId === 'viewSelect') {
        step1.classList.add('completed');
        step2.classList.add('active');
      } else if (viewId === 'viewCropper') {
        step1.classList.add('completed');
        step2.classList.add('completed');
        step3.classList.add('active');
        if (step3Label) step3Label.textContent = 'โหมดครอบรูปภาพ';
      } else if (viewId === 'viewCard') {
        step1.classList.add('completed');
        step2.classList.add('completed');
        step3.classList.add('active');
        if (step3Label) step3Label.textContent = 'โหมดแผ่นการ์ด 9 ช่อง';
      }
    }
  },

  /**
   * Update Cropper Viewport State (Image loaded vs No image placeholder)
   */
  updateCropperState(hasImage) {
    const frameEl = document.getElementById('cropFrame');
    const noImagePlaceholder = document.getElementById('noImagePlaceholder');

    if (hasImage) {
      if (noImagePlaceholder) noImagePlaceholder.classList.add('hidden');
      if (frameEl) frameEl.classList.remove('hidden');
    } else {
      if (noImagePlaceholder) noImagePlaceholder.classList.remove('hidden');
      if (frameEl) frameEl.classList.add('hidden');
    }
  },

  /**
   * Show toast notification message
   */
  showToast(message, type = 'error') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const iconSvg = type === 'error'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Update header processing status indicator
   */
  setStatus(isProcessing) {
    const badge = document.getElementById('statusBadge');
    const text = document.getElementById('statusText');
    if (!badge || !text) return;

    if (isProcessing) {
      badge.classList.add('processing');
      text.textContent = 'กำลังประมวลผล...';
    } else {
      badge.classList.remove('processing');
      text.textContent = 'พร้อมใช้งาน';
    }
  },

  /**
   * Update File Metadata labels
   */
  updateFileInfo(name, width, height) {
    const nameEl = document.getElementById('fileNameDisplay');
    const metaEl = document.getElementById('fileMetaDisplay');
    const uploadedFileName = document.getElementById('uploadedFileName');
    const uploadFileInfo = document.getElementById('uploadFileInfo');

    if (nameEl) nameEl.textContent = name || 'image.png';
    if (metaEl) metaEl.textContent = `${width}×${height} px`;
    if (uploadedFileName) uploadedFileName.textContent = name || 'image.png';
    if (uploadFileInfo) uploadFileInfo.classList.remove('hidden');
  },

  /**
   * Format Radio & Quality slider listeners
   */
  initFormatListeners() {
    const formatRadios = document.querySelectorAll('input[name="outputFormat"]');
    const qualityBox = document.getElementById('qualityBox');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityDisplay = document.getElementById('qualityValueDisplay');

    if (formatRadios.length && qualityBox) {
      formatRadios.forEach(radio => {
        radio.addEventListener('change', () => {
          const val = radio.value;
          if (val === 'jpg' || val === 'webp') {
            qualityBox.classList.remove('hidden');
          } else {
            qualityBox.classList.add('hidden');
          }
        });
      });
    }

    if (qualitySlider && qualityDisplay) {
      qualitySlider.addEventListener('input', () => {
        qualityDisplay.textContent = `${qualitySlider.value}%`;
      });
    }
  },

  /**
   * Update Filled Card Count badge
   */
  updateArrayCount(count) {
    const statusText = document.getElementById('sheetSlotStatus');
    if (statusText) statusText.textContent = `${count} จาก 9 ช่อง`;
  },

  /**
   * Render 3x3 Card Grid in CARD view
   */
  render3x3Grid(cardSheet, callbacks = {}) {
    const gridEl = document.getElementById('sheetGrid3x3');
    if (!gridEl) return;

    gridEl.innerHTML = '';
    const cornerMarksEl = document.getElementById('toggleCornerMarks');
    const dashedBordersEl = document.getElementById('toggleDashedBorders');

    const showCorner = cornerMarksEl ? cornerMarksEl.checked : true;
    const showDashed = dashedBordersEl ? dashedBordersEl.checked : true;

    for (let i = 0; i < 9; i++) {
      const cardData = cardSheet.getSlot(i);
      const slotEl = document.createElement('div');
      slotEl.className = `slot-card ${cardData ? '' : 'empty'} ${showDashed ? 'cut-border-dashed' : ''}`;
      slotEl.dataset.index = i;

      if (cardData) {
        slotEl.innerHTML = `
          <img src="${cardData.dataUrl}" alt="ช่องที่ ${i + 1}">
          <div class="slot-overlay">
            <button class="slot-btn replace-slot-btn" data-index="${i}">เปลี่ยนรูป</button>
            <button class="slot-btn slot-btn-danger clear-slot-btn" data-index="${i}">ลบรูป</button>
          </div>
        `;
      } else {
        slotEl.innerHTML = `
          <div class="slot-placeholder">
            <span class="slot-number">#${i + 1}</span>
            <span class="slot-placeholder-text">คลิกเพื่อเพิ่มรูป</span>
          </div>
          <div class="slot-overlay">
            <button class="slot-btn upload-slot-btn" data-index="${i}">อัปโหลดรูปภาพ</button>
            <button class="slot-btn add-current-slot-btn" data-index="${i}">ใช้รูปที่ครอบอยู่</button>
          </div>
        `;
      }

      // Add Corner Cut Marks if enabled
      if (showCorner) {
        ['tl', 'tr', 'bl', 'br'].forEach(pos => {
          const corner = document.createElement('div');
          corner.className = `corner-mark corner-${pos}`;
          slotEl.appendChild(corner);
        });
      }

      gridEl.appendChild(slotEl);
    }

    // Attach Event Handlers
    gridEl.querySelectorAll('.replace-slot-btn, .upload-slot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index, 10);
        if (callbacks.onUploadSlot) callbacks.onUploadSlot(idx);
      });
    });

    gridEl.querySelectorAll('.add-current-slot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index, 10);
        if (callbacks.onAddCurrentToSlot) callbacks.onAddCurrentToSlot(idx);
      });
    });

    gridEl.querySelectorAll('.clear-slot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index, 10);
        if (callbacks.onClearSlot) callbacks.onClearSlot(idx);
      });
    });
  }
};
