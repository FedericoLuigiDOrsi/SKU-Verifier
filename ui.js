/**
 * UI Helper Functions
 * DirtyTag 3.0 - SKU Verifier
 */

const UI = (function() {
  // DOM References
  const elements = {};

  /**
   * Initialize DOM references
   */
  function init() {
    // States
    elements.emptyState = document.getElementById('empty-state');
    elements.loadingState = document.getElementById('loading-state');
    elements.errorState = document.getElementById('error-state');
    elements.resultsContainer = document.getElementById('results-container');
    
    // Top bar
    elements.skuInput = document.getElementById('sku-input');
    elements.searchBtn = document.getElementById('search-btn');
    elements.settingsBtn = document.getElementById('settings-btn');
    elements.statusIndicator = document.getElementById('status-indicator');
    
    // Product overview
    elements.productSku = document.getElementById('product-sku');
    elements.statusBadges = document.getElementById('status-badges');
    elements.metadataGrid = document.getElementById('metadata-grid');
    elements.notesSection = document.getElementById('notes-section');
    elements.notesContent = document.getElementById('notes-content');
    elements.folderLink = document.getElementById('folder-link');
    
    // Photos
    elements.photoCount = document.getElementById('photo-count');
    elements.photosGrid = document.getElementById('photos-grid');
    elements.folderFallback = document.getElementById('folder-fallback');
    
    // Validation
    elements.frontCard = document.getElementById('front-card');
    elements.frontStatus = document.getElementById('front-status');
    elements.frontPreview = document.getElementById('front-preview');
    elements.frontFileid = document.getElementById('front-fileid');
    elements.frontLink = document.getElementById('front-link');
    
    elements.backCard = document.getElementById('back-card');
    elements.backStatus = document.getElementById('back-status');
    elements.backPreview = document.getElementById('back-preview');
    elements.backFileid = document.getElementById('back-fileid');
    elements.backLink = document.getElementById('back-link');
    
    // AI Images
    elements.aiImagesSection = document.getElementById('ai-images-section');
    elements.aiFrontPreview = document.getElementById('ai-front-preview');
    elements.aiBackPreview = document.getElementById('ai-back-preview');
    
    // Modal
    elements.modal = document.getElementById('settings-modal');
    elements.modalClose = document.getElementById('modal-close');
    elements.airtablePat = document.getElementById('airtable-pat');
    elements.googleApiKey = document.getElementById('google-api-key');
    elements.togglePat = document.getElementById('toggle-pat');
    elements.toggleGapi = document.getElementById('toggle-gapi');
    elements.saveSettings = document.getElementById('save-settings');
    elements.clearTokens = document.getElementById('clear-tokens');
    
    // Error state
    elements.errorTitle = document.getElementById('error-title');
    elements.errorMessage = document.getElementById('error-message');

    return elements;
  }

  /**
   * Show specific state, hide others
   */
  function showState(state) {
    elements.emptyState.classList.add('hidden');
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.resultsContainer.classList.add('hidden');

    switch (state) {
      case 'empty':
        elements.emptyState.classList.remove('hidden');
        break;
      case 'loading':
        elements.loadingState.classList.remove('hidden');
        break;
      case 'error':
        elements.errorState.classList.remove('hidden');
        break;
      case 'results':
        elements.resultsContainer.classList.remove('hidden');
        break;
    }
  }

  /**
   * Show error state with message
   */
  function showError(title, message) {
    elements.errorTitle.textContent = title || 'Errore';
    elements.errorMessage.textContent = message || 'Si è verificato un errore.';
    showState('error');
    setStatusIndicator('error', 'Errore');
  }

  /**
   * Set status indicator in top bar
   */
  function setStatusIndicator(type, text) {
    elements.statusIndicator.className = `status-indicator ${type}`;
    elements.statusIndicator.textContent = text || '';
    
    // Auto-hide success after 3s
    if (type === 'success') {
      setTimeout(() => {
        elements.statusIndicator.className = 'status-indicator';
        elements.statusIndicator.textContent = '';
      }, 3000);
    }
  }

  /**
   * Create status badge element
   */
  function createBadge(label, value, type) {
    const badge = document.createElement('span');
    badge.className = `badge badge--${type}`;
    badge.innerHTML = `<span>${label}:</span> ${value}`;
    return badge;
  }

  /**
   * Render status badges
   */
  function renderStatusBadges(fields) {
    elements.statusBadges.innerHTML = '';

    const statuses = [
      { field: 'Product_Status', label: 'Status' },
      { field: 'AI_Status', label: 'AI' },
      { field: 'AI_Quality_Check', label: 'QC' },
      { field: 'Listing_Status', label: 'Listing' }
    ];

    statuses.forEach(({ field, label }) => {
      const value = fields[field];
      if (value) {
        const type = AirtableAPI.getStatusBadgeType(value, field);
        const badge = createBadge(label, value, type);
        elements.statusBadges.appendChild(badge);
      }
    });
  }

  /**
   * Create metadata item element
   */
  function createMetadataItem(label, value) {
    const item = document.createElement('div');
    item.className = 'metadata-item';

    const labelEl = document.createElement('span');
    labelEl.className = 'metadata-item__label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'metadata-item__value';
    
    if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
      valueEl.classList.add('empty');
      valueEl.textContent = '—';
    } else if (Array.isArray(value)) {
      // Handle Colors array
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'color-tags';
      value.forEach(v => {
        const tag = document.createElement('span');
        tag.className = 'color-tag';
        tag.textContent = v;
        tagsContainer.appendChild(tag);
      });
      valueEl.appendChild(tagsContainer);
    } else {
      valueEl.textContent = value;
    }

    item.appendChild(labelEl);
    item.appendChild(valueEl);
    return item;
  }

  /**
   * Render metadata grid
   */
  function renderMetadata(fields) {
    elements.metadataGrid.innerHTML = '';

    const metadataFields = [
      { key: 'Brand_TXT', label: 'Brand' },
      { key: 'Category', label: 'Categoria' },
      { key: 'Sub-Category', label: 'Sub-Categoria' },
      { key: 'gender', label: 'Genere' },
      { key: 'Size (INT)', label: 'Taglia' },
      { key: 'Colors', label: 'Colori' },
      { key: 'Condizione', label: 'Condizione' },
      { key: 'RAW_Photo_Count', label: 'Foto RAW' }
    ];

    metadataFields.forEach(({ key, label }) => {
      let value = fields[key];
      
      // Handle lookup arrays (Brand_TXT might be array)
      if (Array.isArray(value) && !key.includes('Colors')) {
        value = value[0];
      }
      
      const item = createMetadataItem(label, value);
      elements.metadataGrid.appendChild(item);
    });
  }

  /**
   * Render notes section
   */
  function renderNotes(notes) {
    if (!notes || notes.trim() === '') {
      elements.notesSection.classList.add('hidden');
      return;
    }

    elements.notesSection.classList.remove('hidden');
    elements.notesContent.textContent = notes;

    // Add truncation for long notes
    if (notes.length > 300) {
      elements.notesContent.classList.add('truncated');
      
      // Add toggle if not already present
      if (!elements.notesSection.querySelector('.notes-toggle')) {
        const toggle = document.createElement('a');
        toggle.className = 'notes-toggle';
        toggle.textContent = 'Mostra tutto';
        toggle.href = '#';
        toggle.onclick = (e) => {
          e.preventDefault();
          elements.notesContent.classList.toggle('truncated');
          toggle.textContent = elements.notesContent.classList.contains('truncated') 
            ? 'Mostra tutto' 
            : 'Mostra meno';
        };
        elements.notesSection.appendChild(toggle);
      }
    } else {
      elements.notesContent.classList.remove('truncated');
    }
  }

  /**
   * Render folder link
   */
  function renderFolderLink(folderId) {
    if (!folderId) {
      elements.folderLink.classList.add('hidden');
      return;
    }

    elements.folderLink.classList.remove('hidden');
    elements.folderLink.href = DriveAPI.folderUrl(folderId);
  }

  /**
   * Create photo tile element
   */
  function createPhotoTile(file) {
    const tile = document.createElement('div');
    tile.className = 'photo-tile';

    const preview = document.createElement('div');
    preview.className = 'photo-tile__preview';
    
    const img = document.createElement('img');
    img.src = DriveAPI.thumbnailUrl(file.id, 200);
    img.alt = file.name;
    img.loading = 'lazy';
    img.onerror = () => {
      preview.innerHTML = '<div class="placeholder">⚠️</div>';
    };
    preview.appendChild(img);

    const info = document.createElement('div');
    info.className = 'photo-tile__info';

    const name = document.createElement('div');
    name.className = 'photo-tile__name';
    name.textContent = file.name;
    name.title = file.name;

    const idContainer = document.createElement('div');
    idContainer.className = 'photo-tile__id';
    idContainer.innerHTML = `
      ${file.id.substring(0, 12)}...
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    `;
    idContainer.title = 'Clicca per copiare FileID';
    idContainer.onclick = () => copyToClipboard(file.id);

    info.appendChild(name);
    info.appendChild(idContainer);

    // Make tile clickable to open in Drive
    tile.style.cursor = 'pointer';
    tile.onclick = (e) => {
      if (!e.target.closest('.photo-tile__id')) {
        window.open(DriveAPI.fileViewUrl(file.id), '_blank');
      }
    };

    tile.appendChild(preview);
    tile.appendChild(info);

    return tile;
  }

  /**
   * Render photos grid
   */
  function renderPhotosGrid(files) {
    elements.photosGrid.innerHTML = '';
    elements.folderFallback.classList.add('hidden');

    if (!files || files.length === 0) {
      elements.photosGrid.innerHTML = '<div class="placeholder">Nessuna immagine nella cartella</div>';
      return;
    }

    files.forEach(file => {
      const tile = createPhotoTile(file);
      elements.photosGrid.appendChild(tile);
    });

    elements.photoCount.textContent = `${files.length} foto`;
  }

  /**
   * Show folder fallback (when listing fails)
   */
  function showFolderFallback(photoCount) {
    elements.photosGrid.innerHTML = '';
    elements.folderFallback.classList.remove('hidden');
    
    if (photoCount) {
      elements.photoCount.textContent = `${photoCount} foto (stimate)`;
    } else {
      elements.photoCount.textContent = '';
    }
  }

  /**
   * Render validation card (FRONT or BACK)
   */
  function renderValidationCard(type, fileId, folderFiles) {
    const isVerified = folderFiles ? DriveAPI.verifyFileInFolder(fileId, folderFiles) : null;
    
    const statusEl = type === 'front' ? elements.frontStatus : elements.backStatus;
    const previewEl = type === 'front' ? elements.frontPreview : elements.backPreview;
    const fileidEl = type === 'front' ? elements.frontFileid : elements.backFileid;
    const linkEl = type === 'front' ? elements.frontLink : elements.backLink;

    // Status
    if (!fileId) {
      statusEl.className = 'validation-status validation-status--missing';
      statusEl.innerHTML = '⚠️ Missing';
    } else if (isVerified === true) {
      statusEl.className = 'validation-status validation-status--verified';
      statusEl.innerHTML = '✅ Verificato';
    } else if (isVerified === false) {
      statusEl.className = 'validation-status validation-status--error';
      statusEl.innerHTML = '❌ Non trovato';
    } else {
      // folderFiles is null (couldn't verify)
      statusEl.className = 'validation-status validation-status--unknown';
      statusEl.innerHTML = '— Non verificabile';
    }

    // Preview
    if (fileId) {
      DriveAPI.loadImage(fileId, previewEl, 'Caricamento...');
    } else {
      previewEl.innerHTML = '<div class="placeholder">Nessun FileID</div>';
    }

    // FileID
    if (fileId) {
      fileidEl.textContent = fileId.length > 20 ? fileId.substring(0, 20) + '...' : fileId;
      fileidEl.title = fileId;
      fileidEl.onclick = () => copyToClipboard(fileId);
      
      linkEl.classList.remove('hidden');
      linkEl.href = DriveAPI.fileViewUrl(fileId);
    } else {
      fileidEl.textContent = '—';
      fileidEl.onclick = null;
      linkEl.classList.add('hidden');
    }
  }

  /**
   * Render AI generated images
   */
  function renderAIImages(frontUrl, backUrl) {
    const hasFront = frontUrl && frontUrl.trim() !== '';
    const hasBack = backUrl && backUrl.trim() !== '';

    if (!hasFront && !hasBack) {
      elements.aiImagesSection.classList.add('hidden');
      return;
    }

    elements.aiImagesSection.classList.remove('hidden');

    // Front
    if (hasFront) {
      const img = document.createElement('img');
      img.src = frontUrl;
      img.alt = 'AI Front';
      img.loading = 'lazy';
      img.onerror = () => {
        elements.aiFrontPreview.innerHTML = '<div class="placeholder">Non disponibile</div>';
      };
      elements.aiFrontPreview.innerHTML = '';
      elements.aiFrontPreview.appendChild(img);
    } else {
      elements.aiFrontPreview.innerHTML = '<div class="placeholder">Non generata</div>';
    }

    // Back
    if (hasBack) {
      const img = document.createElement('img');
      img.src = backUrl;
      img.alt = 'AI Back';
      img.loading = 'lazy';
      img.onerror = () => {
        elements.aiBackPreview.innerHTML = '<div class="placeholder">Non disponibile</div>';
      };
      elements.aiBackPreview.innerHTML = '';
      elements.aiBackPreview.appendChild(img);
    } else {
      elements.aiBackPreview.innerHTML = '<div class="placeholder">Non generata</div>';
    }
  }

  /**
   * Copy text to clipboard
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copiato!', 'success');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Copiato!', 'success');
    }
  }

  /**
   * Show toast notification
   */
  function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
  }

  /**
   * Modal helpers
   */
  function openModal() {
    elements.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Load saved values
    elements.airtablePat.value = localStorage.getItem('dirtytag_airtable_pat') || '';
    elements.googleApiKey.value = localStorage.getItem('dirtytag_google_api_key') || '';
  }

  function closeModal() {
    elements.modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /**
   * Toggle password visibility
   */
  function togglePasswordVisibility(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    
    if (input.type === 'password') {
      input.type = 'text';
      button.classList.add('showing');
    } else {
      input.type = 'password';
      button.classList.remove('showing');
    }
  }

  // Public API
  return {
    init,
    elements,
    showState,
    showError,
    setStatusIndicator,
    renderStatusBadges,
    renderMetadata,
    renderNotes,
    renderFolderLink,
    renderPhotosGrid,
    showFolderFallback,
    renderValidationCard,
    renderAIImages,
    copyToClipboard,
    showToast,
    openModal,
    closeModal,
    togglePasswordVisibility
  };
})();
