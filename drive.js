/**
 * Google Drive API Helper
 * DirtyTag 3.0 - SKU Verifier
 */

const DriveAPI = (function() {
  /**
   * Get stored Google API Key
   */
  function getApiKey() {
    return localStorage.getItem('dirtytag_google_api_key');
  }

  /**
   * Generate thumbnail URL for a file
   * Works without auth for publicly accessible files
   */
  function thumbnailUrl(fileId, size = 400) {
    if (!fileId) return null;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
  }

  /**
   * Generate file view URL
   */
  function fileViewUrl(fileId) {
    if (!fileId) return null;
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  /**
   * Generate folder URL
   */
  function folderUrl(folderId) {
    if (!folderId) return null;
    return `https://drive.google.com/drive/folders/${folderId}`;
  }

  /**
   * List files in a folder using Drive API
   * Requires API key and folder must be shared publicly or with link
   */
  async function listFiles(folderId) {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API_KEY_MISSING');
    }

    if (!folderId) {
      throw new Error('FOLDER_ID_MISSING');
    }

    // Build query - only image files, sorted by name
    const query = `'${folderId}' in parents and mimeType contains 'image' and trashed = false`;
    
    const params = new URLSearchParams({
      q: query,
      fields: 'files(id,name,mimeType,thumbnailLink,size)',
      orderBy: 'name',
      pageSize: '100',
      key: apiKey
    });

    const url = `https://www.googleapis.com/drive/v3/files?${params}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        
        if (response.status === 403) {
          // Could be API not enabled or quota exceeded
          const reason = error?.error?.errors?.[0]?.reason;
          if (reason === 'accessNotConfigured') {
            throw new Error('API_NOT_ENABLED');
          }
          throw new Error('ACCESS_DENIED');
        }
        
        if (response.status === 404) {
          throw new Error('FOLDER_NOT_FOUND');
        }

        throw new Error('API_ERROR');
      }

      const data = await response.json();
      return data.files || [];
      
    } catch (err) {
      if (err.message.startsWith('API_') || err.message === 'ACCESS_DENIED' || 
          err.message === 'FOLDER_NOT_FOUND') {
        throw err;
      }
      throw new Error('NETWORK_ERROR');
    }
  }

  /**
   * Check if a FileID exists in a list of folder files
   */
  function verifyFileInFolder(fileId, folderFiles) {
    if (!fileId || !folderFiles) return null;
    return folderFiles.some(f => f.id === fileId);
  }

  /**
   * Load image with fallback handling
   */
  function loadImage(fileId, imgElement, placeholder = null) {
    if (!fileId) {
      if (placeholder) {
        imgElement.innerHTML = `<div class="placeholder">${placeholder}</div>`;
      }
      return;
    }

    const img = document.createElement('img');
    img.src = thumbnailUrl(fileId, 400);
    img.alt = 'Preview';
    img.loading = 'lazy';
    
    img.onerror = () => {
      imgElement.innerHTML = '<div class="placeholder">Immagine non disponibile</div>';
    };

    img.onload = () => {
      imgElement.innerHTML = '';
      imgElement.appendChild(img);
    };

    // Show loading state initially
    imgElement.innerHTML = '<div class="placeholder">Caricamento...</div>';
  }

  /**
   * Extract FileID from various Google Drive URL formats
   */
  function extractFileId(urlOrId) {
    if (!urlOrId) return null;
    
    // Already a FileID (no slashes, reasonable length)
    if (!urlOrId.includes('/') && urlOrId.length > 10 && urlOrId.length < 100) {
      return urlOrId;
    }

    // Extract from various URL formats
    const patterns = [
      /\/d\/([a-zA-Z0-9_-]+)/,           // /d/FILE_ID
      /id=([a-zA-Z0-9_-]+)/,             // ?id=FILE_ID  
      /\/file\/d\/([a-zA-Z0-9_-]+)/,     // /file/d/FILE_ID
      /([a-zA-Z0-9_-]{25,})/             // Fallback: long alphanumeric string
    ];

    for (const pattern of patterns) {
      const match = urlOrId.match(pattern);
      if (match) return match[1];
    }

    return urlOrId;
  }

  /**
   * Extract FolderID from various Google Drive URL formats
   */
  function extractFolderId(urlOrId) {
    if (!urlOrId) return null;

    // Already a FolderID
    if (!urlOrId.includes('/') && urlOrId.length > 10 && urlOrId.length < 100) {
      return urlOrId;
    }

    // Extract from folder URL
    const patterns = [
      /\/folders\/([a-zA-Z0-9_-]+)/,     // /folders/FOLDER_ID
      /id=([a-zA-Z0-9_-]+)/,             // ?id=FOLDER_ID
      /([a-zA-Z0-9_-]{25,})/             // Fallback
    ];

    for (const pattern of patterns) {
      const match = urlOrId.match(pattern);
      if (match) return match[1];
    }

    return urlOrId;
  }

  // Public API
  return {
    getApiKey,
    thumbnailUrl,
    fileViewUrl,
    folderUrl,
    listFiles,
    verifyFileInFolder,
    loadImage,
    extractFileId,
    extractFolderId
  };
})();
