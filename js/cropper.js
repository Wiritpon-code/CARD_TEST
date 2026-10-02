/**
 * ImageCropper Engine (Pure Standalone Frontend)
 * Handles CSS Preview Drag, Zoom, Positioning, and Offscreen Export
 */
class ImageCropper {
  constructor(viewportEl, frameEl, imageEl) {
    this.viewportEl = viewportEl;
    this.frameEl = frameEl;
    this.imageEl = imageEl;

    // Image properties
    this.origWidth = 0;
    this.origHeight = 0;
    this.imageLoaded = false;

    // Preset & Target output dimensions
    this.targetWidth = 744;
    this.targetHeight = 1039;
    this.aspectRatio = 744 / 1039;

    // Display state
    this.frameWidth = 0;
    this.frameHeight = 0;
    this.zoom = 1.0;
    this.posX = 0;
    this.posY = 0;

    // Mouse & Touch Drag tracking
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.initialPosX = 0;
    this.initialPosY = 0;

    this.initEvents();
  }

  /**
   * Load a new image into the cropper preview
   */
  loadImage(imageSrc, origWidth, origHeight) {
    return new Promise((resolve) => {
      this.origWidth = origWidth;
      this.origHeight = origHeight;
      this.imageEl.src = imageSrc;

      this.imageEl.onload = () => {
        this.imageLoaded = true;
        this.resetState();
        resolve();
      };
    });
  }

  /**
   * Set Preset dimensions (e.g., Card: 744x1039, Banner: 1200x400, Icon: 512x512, Custom)
   */
  setPreset(targetWidth, targetHeight) {
    this.targetWidth = Math.round(targetWidth);
    this.targetHeight = Math.round(targetHeight);
    this.aspectRatio = this.targetWidth / this.targetHeight;

    this.updateFrameBounds();
    if (this.imageLoaded) {
      this.clampPosition();
      this.render();
    }
  }

  /**
   * Calculate bounded display dimensions for the Crop Frame inside preview viewport
   */
  updateFrameBounds() {
    const viewportWidth = Math.max(300, this.viewportEl.clientWidth - 40);
    const viewportHeight = Math.max(300, this.viewportEl.clientHeight - 40);

    const containerAspect = viewportWidth / viewportHeight;

    if (this.aspectRatio >= containerAspect) {
      this.frameWidth = viewportWidth;
      this.frameHeight = viewportWidth / this.aspectRatio;
    } else {
      this.frameHeight = viewportHeight;
      this.frameWidth = viewportHeight * this.aspectRatio;
    }

    this.frameEl.style.width = `${Math.round(this.frameWidth)}px`;
    this.frameEl.style.height = `${Math.round(this.frameHeight)}px`;
  }

  /**
   * Reset zoom and position to center initial cover fit
   */
  resetState() {
    this.zoom = 1.0;
    this.updateFrameBounds();
    this.centerImage();
  }

  /**
   * Set Zoom Level (1.0x to 5.0x) maintaining visual center focus
   */
  setZoom(newZoom) {
    const clampedZoom = Math.min(5.0, Math.max(1.0, parseFloat(newZoom) || 1.0));
    if (clampedZoom === this.zoom) return;

    const scaleCover = Math.max(this.frameWidth / this.origWidth, this.frameHeight / this.origHeight);
    const oldRenderedW = this.origWidth * scaleCover * this.zoom;
    const oldRenderedH = this.origHeight * scaleCover * this.zoom;

    const frameCenterX = this.frameWidth / 2;
    const frameCenterY = this.frameHeight / 2;

    const relativeCenterX = (frameCenterX - this.posX) / oldRenderedW;
    const relativeCenterY = (frameCenterY - this.posY) / oldRenderedH;

    this.zoom = clampedZoom;

    const newRenderedW = this.origWidth * scaleCover * this.zoom;
    const newRenderedH = this.origHeight * scaleCover * this.zoom;

    this.posX = frameCenterX - (relativeCenterX * newRenderedW);
    this.posY = frameCenterY - (relativeCenterY * newRenderedH);

    this.clampPosition();
    this.render();
  }

  /**
   * Center Image horizontally inside crop frame
   */
  centerHorizontally() {
    if (!this.imageLoaded) return;
    const scaleCover = Math.max(this.frameWidth / this.origWidth, this.frameHeight / this.origHeight);
    const renderedWidth = this.origWidth * scaleCover * this.zoom;
    this.posX = (this.frameWidth - renderedWidth) / 2;
    this.clampPosition();
    this.render();
  }

  /**
   * Center Image vertically inside crop frame
   */
  centerVertically() {
    if (!this.imageLoaded) return;
    const scaleCover = Math.max(this.frameWidth / this.origWidth, this.frameHeight / this.origHeight);
    const renderedHeight = this.origHeight * scaleCover * this.zoom;
    this.posY = (this.frameHeight - renderedHeight) / 2;
    this.clampPosition();
    this.render();
  }

  /**
   * Center Image both horizontally and vertically
   */
  centerImage() {
    if (!this.imageLoaded) return;
    const scaleCover = Math.max(this.frameWidth / this.origWidth, this.frameHeight / this.origHeight);
    const renderedWidth = this.origWidth * scaleCover * this.zoom;
    const renderedHeight = this.origHeight * scaleCover * this.zoom;

    this.posX = (this.frameWidth - renderedWidth) / 2;
    this.posY = (this.frameHeight - renderedHeight) / 2;

    this.clampPosition();
    this.render();
  }

  /**
   * Clamp image position so that it never leaves whitespace inside the frame
   */
  clampPosition() {
    if (!this.imageLoaded) return;

    const scaleCover = Math.max(this.frameWidth / this.origWidth, this.frameHeight / this.origHeight);
    const renderedWidth = this.origWidth * scaleCover * this.zoom;
    const renderedHeight = this.origHeight * scaleCover * this.zoom;

    const minX = this.frameWidth - renderedWidth;
    const minY = this.frameHeight - renderedHeight;

    this.posX = Math.min(0, Math.max(minX, this.posX));
    this.posY = Math.min(0, Math.max(minY, this.posY));
  }

  /**
   * Apply calculated styles to preview image element
   */
  render() {
    if (!this.imageLoaded) return;

    const scaleCover = Math.max(this.frameWidth / this.origWidth, this.frameHeight / this.origHeight);
    const renderedWidth = this.origWidth * scaleCover * this.zoom;
    const renderedHeight = this.origHeight * scaleCover * this.zoom;

    this.imageEl.style.width = `${renderedWidth}px`;
    this.imageEl.style.height = `${renderedHeight}px`;
    this.imageEl.style.left = `${this.posX}px`;
    this.imageEl.style.top = `${this.posY}px`;
  }

  /**
   * Bind Mouse & Touch dragging listeners on the Crop Frame
   */
  initEvents() {
    this.frameEl.addEventListener('mousedown', (e) => {
      if (!this.imageLoaded) return;
      e.preventDefault();
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.initialPosX = this.posX;
      this.initialPosY = this.posY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.dragStartX;
      const deltaY = e.clientY - this.dragStartY;

      this.posX = this.initialPosX + deltaX;
      this.posY = this.initialPosY + deltaY;

      this.clampPosition();
      this.render();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.frameEl.addEventListener('touchstart', (e) => {
      if (!this.imageLoaded || e.touches.length !== 1) return;
      this.isDragging = true;
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
      this.initialPosX = this.posX;
      this.initialPosY = this.posY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.dragStartX;
      const deltaY = e.touches[0].clientY - this.dragStartY;

      this.posX = this.initialPosX + deltaX;
      this.posY = this.initialPosY + deltaY;

      this.clampPosition();
      this.render();
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('resize', () => {
      if (this.imageLoaded) {
        this.updateFrameBounds();
        this.clampPosition();
        this.render();
      }
    });
  }

  /**
   * Calculate crop coordinates relative to original image dimensions
   */
  getCropData() {
    const scaleCover = Math.max(this.frameWidth / this.origWidth, this.frameHeight / this.origHeight);
    const renderedWidth = this.origWidth * scaleCover * this.zoom;
    const totalScale = renderedWidth / this.origWidth;

    let cropX = Math.round((-this.posX) / totalScale);
    let cropY = Math.round((-this.posY) / totalScale);
    let cropWidth = Math.round(this.frameWidth / totalScale);
    let cropHeight = Math.round(this.frameHeight / totalScale);

    if (cropX < 0) cropX = 0;
    if (cropY < 0) cropY = 0;

    if (cropX + cropWidth > this.origWidth) {
      cropWidth = this.origWidth - cropX;
    }
    if (cropY + cropHeight > this.origHeight) {
      cropHeight = this.origHeight - cropY;
    }

    return {
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      outputWidth: this.targetWidth,
      outputHeight: this.targetHeight
    };
  }

  /**
   * Generate Cropped Image Blob in browser memory for instant download
   */
  async generateCroppedBlob(format = 'png', quality = 90) {
    const cropData = this.getCropData();
    const canvas = document.createElement('canvas');
    canvas.width = cropData.outputWidth;
    canvas.height = cropData.outputHeight;
    const ctx = canvas.getContext('2d');

    // Fill white background for JPG format if image has transparency
    if (format === 'jpeg' || format === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw cropped region from HTMLImageElement onto output canvas
    ctx.drawImage(
      this.imageEl,
      cropData.cropX,
      cropData.cropY,
      cropData.cropWidth,
      cropData.cropHeight,
      0,
      0,
      cropData.outputWidth,
      cropData.outputHeight
    );

    let mimeType = 'image/png';
    let ext = 'png';
    if (format === 'jpg' || format === 'jpeg') {
      mimeType = 'image/jpeg';
      ext = 'jpg';
    } else if (format === 'webp') {
      mimeType = 'image/webp';
      ext = 'webp';
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({ blob, mimeType, ext });
        } else {
          reject(new Error('Failed to export cropped image blob.'));
        }
      }, mimeType, quality / 100);
    });
  }
}
