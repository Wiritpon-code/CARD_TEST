/**
 * CardSheet Engine
 * Manages 9-card array storage, grid canvas rendering, and cut line generation for printing/saving.
 */
class CardSheet {
  constructor() {
    // Array of 9 slots (index 0 to 8)
    this.slots = Array(9).fill(null);
    this.showCornerMarks = true;
    this.showDashedBorders = true;
  }

  /**
   * Set a card object in a specific slot index (0-8)
   */
  setSlot(index, cardData) {
    if (index >= 0 && index < 9) {
      this.slots[index] = cardData; // cardData: { dataUrl, width, height, name }
    }
  }

  /**
   * Get card in slot index
   */
  getSlot(index) {
    return this.slots[index];
  }

  /**
   * Remove card from a slot
   */
  clearSlot(index) {
    if (index >= 0 && index < 9) {
      this.slots[index] = null;
    }
  }

  /**
   * Clear all 9 slots
   */
  clearAll() {
    this.slots = Array(9).fill(null);
  }

  /**
   * Add card to the first available empty slot.
   * Returns index added, or -1 if full.
   */
  addCard(cardData) {
    const emptyIdx = this.slots.findIndex(slot => slot === null);
    if (emptyIdx !== -1) {
      this.slots[emptyIdx] = cardData;
      return emptyIdx;
    }
    return -1;
  }

  /**
   * Fill all 9 slots with a single card object
   */
  fillAll(cardData) {
    for (let i = 0; i < 9; i++) {
      this.slots[i] = { ...cardData };
    }
  }

  /**
   * Count filled slots
   */
  getFilledCount() {
    return this.slots.filter(s => s !== null).length;
  }

  /**
   * Render high-resolution printable sheet canvas (A4 aspect at 300 DPI equivalent)
   */
  async generateSheetCanvas(options = {}) {
    const {
      showCornerMarks = this.showCornerMarks,
      showDashedBorders = this.showDashedBorders,
      format = 'png',
      quality = 90
    } = options;

    // High resolution canvas for print: 2480 x 3508 (A4 at 300 DPI)
    const canvas = document.createElement('canvas');
    canvas.width = 2480;
    canvas.height = 3508;
    const ctx = canvas.getContext('2d');

    // Background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate Grid Layout: 3 Columns x 3 Rows
    const cols = 3;
    const rows = 3;
    const marginX = 120; // Side margins
    const marginY = 140; // Top/Bottom margins
    const gap = 30;      // Space between cards

    const availableW = canvas.width - (marginX * 2) - (gap * (cols - 1));
    const availableH = canvas.height - (marginY * 2) - (gap * (rows - 1));

    const cardW = Math.floor(availableW / cols);
    const cardH = Math.floor(availableH / rows);

    // Preload image objects for all active slots
    const loadedImages = await Promise.all(
      this.slots.map(slot => {
        if (!slot || !slot.dataUrl) return Promise.resolve(null);
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = slot.dataUrl;
        });
      })
    );

    // Render cards and cut marks
    for (let i = 0; i < 9; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = marginX + col * (cardW + gap);
      const y = marginY + row * (cardH + gap);

      const img = loadedImages[i];

      // Draw card image or placeholder outline
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, cardW, cardH);
        ctx.clip();
        ctx.drawImage(img, x, y, cardW, cardH);
        ctx.restore();
      }

      // Draw Cut Marks (Corner Marks & Border Lines)
      if (showDashedBorders) {
        ctx.save();
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cardW, cardH);
        ctx.restore();
      }

      if (showCornerMarks) {
        ctx.save();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        const markLen = 25;

        // Top-Left corner
        ctx.beginPath();
        ctx.moveTo(x - markLen, y); ctx.lineTo(x, y); ctx.lineTo(x, y - markLen);
        ctx.moveTo(x, y); ctx.lineTo(x + markLen, y);
        ctx.moveTo(x, y); ctx.lineTo(x, y + markLen);
        ctx.stroke();

        // Top-Right corner
        ctx.beginPath();
        ctx.moveTo(x + cardW + markLen, y); ctx.lineTo(x + cardW, y); ctx.lineTo(x + cardW, y - markLen);
        ctx.moveTo(x + cardW, y); ctx.lineTo(x + cardW - markLen, y);
        ctx.moveTo(x + cardW, y); ctx.lineTo(x + cardW, y + markLen);
        ctx.stroke();

        // Bottom-Left corner
        ctx.beginPath();
        ctx.moveTo(x - markLen, y + cardH); ctx.lineTo(x, y + cardH); ctx.lineTo(x, y + cardH + markLen);
        ctx.moveTo(x, y + cardH); ctx.lineTo(x + markLen, y + cardH);
        ctx.moveTo(x, y + cardH); ctx.lineTo(x, y + cardH - markLen);
        ctx.stroke();

        // Bottom-Right corner
        ctx.beginPath();
        ctx.moveTo(x + cardW + markLen, y + cardH); ctx.lineTo(x + cardW, y + cardH); ctx.lineTo(x + cardW, y + cardH + markLen);
        ctx.moveTo(x + cardW, y + cardH); ctx.lineTo(x + cardW - markLen, y + cardH);
        ctx.moveTo(x + cardW, y + cardH); ctx.lineTo(x + cardW, y + cardH - markLen);
        ctx.stroke();

        ctx.restore();
      }
    }

    let mimeType = 'image/png';
    let ext = 'png';
    if (format === 'jpg' || format === 'jpeg') {
      mimeType = 'image/jpeg';
      ext = 'jpg';
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({ blob, canvas, ext, mimeType });
      }, mimeType, quality / 100);
    });
  }
}
