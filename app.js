/**
 * SKU Verifier - Main Application
 * DirtyTag 3.0
 */

(function() {
  'use strict';

  // App State
  let currentRecord = null;
  let currentFolderId = null;
  let folderFiles = null;

  /**
   * Initialize the application
   */
  function init() {
    // Initialize UI
    const elements = UI.init();

    // Bind event handlers
    bindEvents(elements);

    // Check for token on load
    checkTokenStatus();

    // Focus search input
    elements.skuInput.focus();

    // Check URL params for auto-search
    const urlParams = new URLSearchParams(window.location.search);
    const skuParam = urlParams.get('sku');
    if (skuParam) {
      elements.skuInput.value = skuParam;
      handleSearch();
    }
  }

  /**
   * Bind event handlers
   */
  function bindEvents(elements) {
    // Search
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.skuInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });

    // Settings modal
    elements.settingsBtn.addEventListener('click', UI.openModal);
    elements.modalClose.addEventListener('click', UI.closeModal);
    elements.modal.querySelector('.modal__backdrop').addEventListener('click', UI.closeModal);

    // Password toggles
    elements.togglePat.addEventListener('click', () => {
      UI.togglePasswordVisibility('airtable-pat', 'toggle-pat');
    });
    elements.toggleGapi.addEventListener('click', () => {
      UI.togglePasswordVisibility('google-api-key', 'toggle-gapi');
    });

    // Save settings
    elements.saveSettings.addEventListener('click', handleSaveSettings);

    // Clear tokens
    elements.clearTokens.addEventListener('click', handleClearTokens);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape to close modal
      if (e.key === 'Escape' && !elements.modal.classList.contains('hidden')) {
        UI.closeModal();
      }
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        elements.skuInput.focus();
        elements.skuInput.select();
      }
    });
  }

  /**
   * Check token status
   */
  function checkTokenStatus() {
    const token = AirtableAPI.getToken();
    if (!token) {
      UI.showError(
        'Token Mancante',
        'Configura il token Airtable nelle Impostazioni per iniziare.'
      );
    }
  }

  /**
   * Handle search
   */
  async function handleSearch() {
    const elements = UI.elements;
    const skuInput = elements.skuInput.value.trim();

    if (!skuInput) {
      UI.showToast('Inserisci un SKU', 'error');
      elements.skuInput.focus();
      return;
    }

    // Check token
    if (!AirtableAPI.getToken()) {
      UI.openModal();
      UI.showToast('Configura prima il token Airtable', 'error');
      return;
    }

    // Reset state
    currentRecord = null;
    currentFolderId = null;
    folderFiles = null;

    // Show loading
    UI.showState('loading');
    UI.setStatusIndicator('loading', 'Caricamento...');
    elements.searchBtn.disabled = true;

    try {
      // Fetch product
      const record = await AirtableAPI.fetchProductBySKU(skuInput);
      currentRecord = record;

      // Update URL
      updateURL(record.fields.SKU);

      // Render product info
      renderProduct(record);

      // Resolve folder ID
      currentFolderId = await AirtableAPI.resolveFolderID(record);

      // Render folder link
      UI.renderFolderLink(currentFolderId);

      // Try to list folder contents
      if (currentFolderId) {
        await loadFolderContents(currentFolderId, record.fields.RAW_Photo_Count);
      } else {
        UI.showFolderFallback(null);
        UI.renderValidationCard('front', record.fields.rawID_FRONT, null);
        UI.renderValidationCard('back', record.fields.rawID_BACK, null);
      }

      // Show results
      UI.showState('results');
      UI.setStatusIndicator('success', 'Trovato');

    } catch (error) {
      console.error('Search error:', error);
      UI.showError('Errore', error.message);
    } finally {
      elements.searchBtn.disabled = false;
    }
  }

  /**
   * Render product data
   */
  function renderProduct(record) {
    const fields = record.fields;

    // SKU
    UI.elements.productSku.textContent = fields.SKU || '—';

    // Status badges
    UI.renderStatusBadges(fields);

    // Metadata
    UI.renderMetadata(fields);

    // Notes
    UI.renderNotes(fields['Note Prodotto']);

    // AI Images
    UI.renderAIImages(
      fields.AI_Front_Image_Link,
      fields.AI_Back_Image_Link
    );
  }

  /**
   * Load folder contents
   */
  async function loadFolderContents(folderId, estimatedCount) {
    const fields = currentRecord.fields;

    try {
      // Try to list files
      folderFiles = await DriveAPI.listFiles(folderId);
      
      // Render photos grid
      UI.renderPhotosGrid(folderFiles);

      // Render validation cards with verification
      UI.renderValidationCard('front', fields.rawID_FRONT, folderFiles);
      UI.renderValidationCard('back', fields.rawID_BACK, folderFiles);

    } catch (error) {
      console.warn('Folder listing failed:', error.message);
      
      // Show fallback
      UI.showFolderFallback(estimatedCount);

      // Render validation cards without verification
      UI.renderValidationCard('front', fields.rawID_FRONT, null);
      UI.renderValidationCard('back', fields.rawID_BACK, null);

      // Show appropriate message based on error
      if (error.message === 'API_KEY_MISSING') {
        UI.showToast('API Key Google mancante per listing cartella', 'error');
      } else if (error.message === 'ACCESS_DENIED') {
        UI.showToast('Accesso cartella negato', 'error');
      }
    }
  }

  /**
   * Update URL with SKU parameter
   */
  function updateURL(sku) {
    const url = new URL(window.location);
    url.searchParams.set('sku', sku);
    window.history.replaceState({}, '', url);
  }

  /**
   * Handle save settings
   */
  function handleSaveSettings() {
    const elements = UI.elements;
    const airtablePat = elements.airtablePat.value.trim();
    const googleApiKey = elements.googleApiKey.value.trim();

    // Validate Airtable PAT (required)
    if (!airtablePat) {
      UI.showToast('Token Airtable richiesto', 'error');
      elements.airtablePat.focus();
      return;
    }

    // Basic PAT format validation
    if (!airtablePat.startsWith('pat')) {
      UI.showToast('Formato token non valido (deve iniziare con "pat")', 'error');
      elements.airtablePat.focus();
      return;
    }

    // Save to localStorage
    localStorage.setItem('dirtytag_airtable_pat', airtablePat);
    
    if (googleApiKey) {
      localStorage.setItem('dirtytag_google_api_key', googleApiKey);
    } else {
      localStorage.removeItem('dirtytag_google_api_key');
    }

    UI.closeModal();
    UI.showToast('Impostazioni salvate', 'success');

    // Reset to empty state if was showing token error
    const errorTitle = UI.elements.errorTitle.textContent;
    if (errorTitle === 'Token Mancante') {
      UI.showState('empty');
      UI.elements.skuInput.focus();
    }
  }

  /**
   * Handle clear tokens
   */
  function handleClearTokens() {
    if (!confirm('Vuoi davvero cancellare tutti i token salvati?')) {
      return;
    }

    localStorage.removeItem('dirtytag_airtable_pat');
    localStorage.removeItem('dirtytag_google_api_key');

    UI.elements.airtablePat.value = '';
    UI.elements.googleApiKey.value = '';

    UI.closeModal();
    UI.showToast('Token cancellati', 'success');

    // Show token missing error
    checkTokenStatus();
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
