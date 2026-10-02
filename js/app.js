/**
 * Main Application Orchestrator for Wolffe Card Studio (Thai Version)
 * Live Server & Standalone Browser Compatible
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Navigation
  const navStep1 = document.getElementById('navStep1');
  const navStep2 = document.getElementById('navStep2');
  const navStep3 = document.getElementById('navStep3');

  // View 1 (Upload) Elements
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const dropZone = document.getElementById('dropZone');
  const btnNextToSelect = document.getElementById('btnNextToSelect');

  // View 2 (Selection) Elements
  const cardChooseCropper = document.getElementById('cardChooseCropper');
  const cardChooseSheet = document.getElementById('cardChooseSheet');
  const btnBackToUpload = document.getElementById('btnBackToUpload');

  // View 3 (Cropper) Elements
  const btnCropperToSelect = document.getElementById('btnCropperToSelect');
  const btnSwitchToCard = document.getElementById('btnSwitchToCard');
  const changeImageBtn = document.getElementById('changeImageBtn');
  const btnUploadInCropper = document.getElementById('btnUploadInCropper');
  
  const viewportEl = document.getElementById('previewViewport');
  const frameEl = document.getElementById('cropFrame');
  const previewImageEl = document.getElementById('previewImage');

  const presetBtns = document.querySelectorAll('.preset-btn');
  const customSizeBox = document.getElementById('customSizeBox');
  const customWidthInput = document.getElementById('customWidthInput');
  const customHeightInput = document.getElementById('customHeightInput');
  const applyCustomSizeBtn = document.getElementById('applyCustomSizeBtn');

  const zoomSlider = document.getElementById('zoomSlider');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomValueDisplay = document.getElementById('zoomValueDisplay');

  const centerHBtn = document.getElementById('centerHBtn');
  const centerVBtn = document.getElementById('centerVBtn');
  const centerImageBtn = document.getElementById('centerImageBtn');

  const resetBtn = document.getElementById('resetBtn');
  const cropDownloadBtn = document.getElementById('cropDownloadBtn');
  const addToSheetBtn = document.getElementById('addToSheetBtn');

  // View 4 (CARD) Elements
  const btnCardToSelect = document.getElementById('btnCardToSelect');
  const btnSwitchToCropper = document.getElementById('btnSwitchToCropper');
  const fillAllSheetBtn = document.getElementById('fillAllSheetBtn');
  const clearAllSlotsBtn = document.getElementById('clearAllSlotsBtn');
  const toggleCornerMarks = document.getElementById('toggleCornerMarks');
  const toggleDashedBorders = document.getElementById('toggleDashedBorders');
  const downloadSheetBtn = document.getElementById('downloadSheetBtn');
  const printSheetBtn = document.getElementById('printSheetBtn');
  const slotFileInput = document.getElementById('slotFileInput');

  // Application State
  let currentFile = null;
  let cropper = new ImageCropper(viewportEl, frameEl, previewImageEl);
  const cardSheet = new CardSheet();
  let activeUploadSlotIndex = null;
  let lastChosenStudioView = 'viewCropper';

  // Initialize UI State
  UI.initFormatListeners();
  UI.updateCropperState(false);
  updateSheetUI();

  // ==========================================
  // VIEW NAVIGATION LISTENERS
  // ==========================================
  if (navStep1) navStep1.addEventListener('click', () => UI.switchView('viewUpload'));
  if (navStep2) navStep2.addEventListener('click', () => UI.switchView('viewSelect'));
  if (navStep3) navStep3.addEventListener('click', () => {
    UI.switchView(lastChosenStudioView);
    if (lastChosenStudioView === 'viewCropper') {
      UI.updateCropperState(cropper.imageLoaded);
      if (cropper.imageLoaded) cropper.updateFrameBounds();
    }
  });

  if (btnBackToUpload) btnBackToUpload.addEventListener('click', () => UI.switchView('viewUpload'));
  if (btnNextToSelect) btnNextToSelect.addEventListener('click', () => UI.switchView('viewSelect'));

  if (cardChooseCropper) {
    cardChooseCropper.addEventListener('click', () => {
      lastChosenStudioView = 'viewCropper';
      UI.switchView('viewCropper');
      UI.updateCropperState(cropper.imageLoaded);
      if (cropper.imageLoaded) cropper.updateFrameBounds();
    });
  }

  if (cardChooseSheet) {
    cardChooseSheet.addEventListener('click', () => {
      lastChosenStudioView = 'viewCard';
      UI.switchView('viewCard');
      updateSheetUI();
    });
  }

  if (btnCropperToSelect) btnCropperToSelect.addEventListener('click', () => UI.switchView('viewSelect'));
  if (btnCardToSelect) btnCardToSelect.addEventListener('click', () => UI.switchView('viewSelect'));

  if (btnSwitchToCard) {
    btnSwitchToCard.addEventListener('click', () => {
      lastChosenStudioView = 'viewCard';
      UI.switchView('viewCard');
      updateSheetUI();
    });
  }

  if (btnSwitchToCropper) {
    btnSwitchToCropper.addEventListener('click', () => {
      lastChosenStudioView = 'viewCropper';
      UI.switchView('viewCropper');
      UI.updateCropperState(cropper.imageLoaded);
      if (cropper.imageLoaded) cropper.updateFrameBounds();
    });
  }

  // ==========================================
  // FILE UPLOAD HANDLERS
  // ==========================================
  if (browseBtn) browseBtn.addEventListener('click', () => fileInput.click());
  if (btnUploadInCropper) btnUploadInCropper.addEventListener('click', () => fileInput.click());
  if (changeImageBtn) changeImageBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt.files && dt.files[0]) {
      handleFileSelected(dt.files[0]);
    }
  });

  function handleFileSelected(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      UI.showToast('รูปแบบไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์ JPG, PNG หรือ WEBP');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      UI.showToast('ขนาดไฟล์ใหญ่เกินไป กำหนดขนาดไม่เกิน 20MB');
      return;
    }

    currentFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        if (img.width * img.height > 40000000) {
          UI.showToast('มิติรูปภาพใหญ่เกินไป (เกิน 40 ล้านพิกเซล)');
          return;
        }

        UI.updateFileInfo(file.name, img.width, img.height);
        UI.updateCropperState(true);

        await cropper.loadImage(e.target.result, img.width, img.height);
        
        zoomSlider.value = 1.0;
        zoomValueDisplay.textContent = '1.0x';

        UI.showToast('โหลดรูปภาพเรียบร้อยแล้ว! กำลังไปที่หน้าเลือกโหมด...', 'success');
        
        // Auto navigate to Mode Selection page smoothly if coming from View 1
        if (UI.currentView === 'viewUpload') {
          setTimeout(() => {
            UI.switchView('viewSelect');
          }, 400);
        }
      };
      img.onerror = () => {
        UI.showToast('ไม่สามารถประมวลผลไฟล์รูปภาพนี้ได้');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ==========================================
  // PRESETS & CROPPER CONTROLS
  // ==========================================
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.dataset.preset;

      if (preset === 'custom') {
        if (customSizeBox) customSizeBox.classList.remove('hidden');
      } else {
        if (customSizeBox) customSizeBox.classList.add('hidden');
        if (preset === 'card') {
          cropper.setPreset(744, 1039);
        } else if (preset === 'banner') {
          cropper.setPreset(1200, 400);
        } else if (preset === 'icon') {
          cropper.setPreset(512, 512);
        }
        updateZoomSliderDisplay();
      }
    });
  });

  if (applyCustomSizeBtn) {
    applyCustomSizeBtn.addEventListener('click', () => {
      const width = parseInt(customWidthInput.value, 10);
      const height = parseInt(customHeightInput.value, 10);

      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        UI.showToast('ความกว้างและความสูงต้องเป็นตัวเลขที่มากกว่า 0');
        return;
      }

      if (width > 5000 || height > 5000) {
        UI.showToast('ขนาดที่กำหนดเองต้องไม่เกิน 5000px ต่อด้าน');
        return;
      }

      cropper.setPreset(width, height);
      updateZoomSliderDisplay();
      UI.showToast(`นำขนาดที่กำหนดเองไปใช้แล้ว: ${width} × ${height} พิกเซล`, 'success');
    });
  }

  // Zoom slider & buttons
  zoomSlider.addEventListener('input', () => {
    const val = parseFloat(zoomSlider.value);
    cropper.setZoom(val);
    zoomValueDisplay.textContent = `${val.toFixed(1)}x`;
  });

  zoomInBtn.addEventListener('click', () => {
    const current = parseFloat(zoomSlider.value);
    const next = Math.min(5.0, current + 0.1);
    zoomSlider.value = next;
    cropper.setZoom(next);
    zoomValueDisplay.textContent = `${next.toFixed(1)}x`;
  });

  zoomOutBtn.addEventListener('click', () => {
    const current = parseFloat(zoomSlider.value);
    const next = Math.max(1.0, current - 0.1);
    zoomSlider.value = next;
    cropper.setZoom(next);
    zoomValueDisplay.textContent = `${next.toFixed(1)}x`;
  });

  function updateZoomSliderDisplay() {
    zoomSlider.value = cropper.zoom;
    zoomValueDisplay.textContent = `${cropper.zoom.toFixed(1)}x`;
  }

  // Alignment
  if (centerHBtn) centerHBtn.addEventListener('click', () => cropper.centerHorizontally());
  if (centerVBtn) centerVBtn.addEventListener('click', () => cropper.centerVertically());
  if (centerImageBtn) centerImageBtn.addEventListener('click', () => cropper.centerImage());

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      cropper.resetState();
      zoomSlider.value = 1.0;
      zoomValueDisplay.textContent = '1.0x';
      UI.showToast('รีเซ็ตตำแหน่งและการซูมเรียบร้อยแล้ว', 'success');
    });
  }

  // Crop & Download Single
  if (cropDownloadBtn) {
    cropDownloadBtn.addEventListener('click', async () => {
      if (!currentFile || !cropper.imageLoaded) {
        UI.showToast('ยังไม่ได้เลือกรูปภาพ กรุณาอัปโหลดรูปภาพก่อน');
        return;
      }

      const selectedRadio = document.querySelector('input[name="outputFormat"]:checked');
      const selectedFormat = selectedRadio ? selectedRadio.value : 'png';
      const quality = parseInt(document.getElementById('qualitySlider').value, 10);

      UI.setStatus(true);
      cropDownloadBtn.disabled = true;

      try {
        const { blob, ext } = await cropper.generateCroppedBlob(selectedFormat, quality);
        
        const rawName = currentFile.name ? currentFile.name.replace(/\.[^/.]+$/, "") : "cropped";
        const cleanName = rawName.replace(/[^a-zA-Z0-9_\-]/g, "_");
        const cropData = cropper.getCropData();
        const filename = `${cleanName}_${cropData.outputWidth}x${cropData.outputHeight}.${ext}`;

        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
        }, 200);

        UI.showToast('ครอบรูปและดาวน์โหลดเรียบร้อยแล้ว!', 'success');
      } catch (err) {
        UI.showToast(err.message || 'เกิดข้อผิดพลาดในการครอบรูปภาพ');
      } finally {
        UI.setStatus(false);
        cropDownloadBtn.disabled = false;
      }
    });
  }

  // ==========================================
  // CARD 3x3 SHEET ENGINE & HANDLERS
  // ==========================================
  async function getCurrentCropCardData() {
    if (!cropper.imageLoaded) return null;
    const selectedRadio = document.querySelector('input[name="outputFormat"]:checked');
    const selectedFormat = selectedRadio ? selectedRadio.value : 'png';
    const quality = parseInt(document.getElementById('qualitySlider').value, 10);
    const { blob } = await cropper.generateCroppedBlob(selectedFormat, quality);
    const dataUrl = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(blob);
    });
    return {
      dataUrl,
      blob,
      name: currentFile ? currentFile.name : 'card'
    };
  }

  function updateSheetUI() {
    UI.updateArrayCount(cardSheet.getFilledCount());
    UI.render3x3Grid(cardSheet, {
      onUploadSlot: (slotIdx) => {
        activeUploadSlotIndex = slotIdx;
        slotFileInput.value = '';
        slotFileInput.click();
      },
      onAddCurrentToSlot: async (slotIdx) => {
        if (!cropper.imageLoaded) {
          UI.showToast('กรุณาอัปโหลดและครอบรูปภาพก่อน');
          return;
        }
        const cardData = await getCurrentCropCardData();
        cardSheet.setSlot(slotIdx, cardData);
        updateSheetUI();
        UI.showToast(`อัปเดตช่องที่ #${slotIdx + 1} ด้วยรูปภาพที่ครอบแล้ว`, 'success');
      },
      onClearSlot: (slotIdx) => {
        cardSheet.clearSlot(slotIdx);
        updateSheetUI();
        UI.showToast(`ลบรูปภาพช่องที่ #${slotIdx + 1} เรียบร้อยแล้ว`, 'success');
      }
    });
  }

  // Direct upload to slot
  slotFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0] && activeUploadSlotIndex !== null) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        cardSheet.setSlot(activeUploadSlotIndex, {
          dataUrl: event.target.result,
          name: file.name
        });
        updateSheetUI();
        UI.showToast(`อัปโหลดรูปภาพลงช่องที่ #${activeUploadSlotIndex + 1} เรียบร้อยแล้ว`, 'success');
        activeUploadSlotIndex = null;
      };
      reader.readAsDataURL(file);
    }
  });

  // Add current crop to first available slot
  if (addToSheetBtn) {
    addToSheetBtn.addEventListener('click', async () => {
      if (!cropper.imageLoaded) {
        UI.showToast('กรุณาอัปโหลดและครอบรูปภาพก่อน');
        return;
      }
      const cardData = await getCurrentCropCardData();
      const addedIndex = cardSheet.addCard(cardData);
      if (addedIndex === -1) {
        UI.showToast('ตารางการ์ดทั้ง 9 ช่องเต็มแล้ว!');
      } else {
        updateSheetUI();
        UI.showToast(`เพิ่มรูปภาพลงในช่องที่ #${addedIndex + 1} เรียบร้อยแล้ว`, 'success');
      }
    });
  }

  // Fill all 9 slots with current crop
  if (fillAllSheetBtn) {
    fillAllSheetBtn.addEventListener('click', async () => {
      if (!cropper.imageLoaded) {
        UI.showToast('กรุณาอัปโหลดและครอบรูปภาพก่อน');
        return;
      }
      const cardData = await getCurrentCropCardData();
      cardSheet.fillAll(cardData);
      updateSheetUI();
      UI.showToast('เติมรูปภาพที่ครอบเต็มทั้ง 9 ช่องเรียบร้อยแล้ว!', 'success');
    });
  }

  // Clear all slots
  if (clearAllSlotsBtn) {
    clearAllSlotsBtn.addEventListener('click', () => {
      cardSheet.clearAll();
      updateSheetUI();
      UI.showToast('ล้างข้อมูลรูปภาพทั้ง 9 ช่องเรียบร้อยแล้ว', 'success');
    });
  }

  // Corner & dashed cut line check toggles
  [toggleCornerMarks, toggleDashedBorders].forEach(cb => {
    if (cb) {
      cb.addEventListener('change', () => {
        updateSheetUI();
      });
    }
  });

  // Print Sheet
  if (printSheetBtn) {
    printSheetBtn.addEventListener('click', () => {
      if (cardSheet.getFilledCount() === 0) {
        UI.showToast('ตารางการ์ดยังว่างอยู่ กรุณาเพิ่มอย่างน้อย 1 รูปเพื่อพิมพ์');
        return;
      }
      window.print();
    });
  }

  // Download Sheet Image
  if (downloadSheetBtn) {
    downloadSheetBtn.addEventListener('click', async () => {
      if (cardSheet.getFilledCount() === 0) {
        UI.showToast('ตารางการ์ดยังว่างอยู่ กรุณาเพิ่มอย่างน้อย 1 รูปเพื่อดาวน์โหลด');
        return;
      }

      UI.setStatus(true);
      downloadSheetBtn.disabled = true;

      try {
        const selectedRadio = document.querySelector('input[name="sheetFormat"]:checked');
        const selectedFormat = selectedRadio ? selectedRadio.value : 'png';

        const { blob, ext } = await cardSheet.generateSheetCanvas({
          showCornerMarks: toggleCornerMarks ? toggleCornerMarks.checked : true,
          showDashedBorders: toggleDashedBorders ? toggleDashedBorders.checked : true,
          format: selectedFormat
        });

        const filename = `9_card_printable_sheet_${Date.now()}.${ext}`;
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
        }, 200);

        UI.showToast('บันทึกรูปแผ่นการ์ด 9 ช่องเรียบร้อยแล้ว!', 'success');
      } catch (err) {
        UI.showToast(err.message || 'ไม่สามารถสร้างรูปแผ่นการ์ดได้');
      } finally {
        UI.setStatus(false);
        downloadSheetBtn.disabled = false;
      }
    });
  }
});
