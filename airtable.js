/**
 * Airtable API Helper
 * DirtyTag 3.0 - SKU Verifier
 */

const AirtableAPI = (function() {
  // Configuration
  const CONFIG = {
    BASE_ID: 'apptD8GSxN3vhhivI',
    INVENTARIO_TABLE_ID: 'tblddAcLcQAyk050u',
    RAW_TABLE_ID: 'tblUWMOM3HKCCEwu6'
  };

  // Fields to query from INVENTARIO
  const INVENTARIO_FIELDS = [
    'SKU',
    'Product_Status',
    'AI_Status', 
    'AI_Quality_Check',
    'Listing_Status',
    'Brand_TXT',
    'Category',
    'Sub-Category',
    'gender',
    'Size (INT)',
    'Colors',
    'Condizione',
    'Note Prodotto',
    'RAW',
    'RAW_FolderID',
    'RAW_Photo_Count',
    'rawID_FRONT',
    'rawID_BACK',
    'AI_Front_Image_Link',
    'AI_Back_Image_Link'
  ];

  // RAW table fields (fallback)
  const RAW_FIELDS = [
    'Folder_ID',
    'Folder_Link',
    'Photo_Count'
  ];

  /**
   * Get stored Airtable PAT
   */
  function getToken() {
    return localStorage.getItem('dirtytag_airtable_pat');
  }

  /**
   * Validate SKU format
   * Pattern: XX-NNNN or XXX-NNNN (2-3 letter prefix + hyphen + 4-6 digits)
   */
  function normalizeSKU(input) {
    const normalized = input.trim().toUpperCase();
    const pattern = /^[A-Z]{2,3}-\d{4,6}$/;
    
    if (!pattern.test(normalized)) {
      throw new Error('Formato SKU non valido. Atteso: XX-NNNN (es. MF-2411)');
    }
    
    return normalized;
  }

  /**
   * Build Airtable API URL
   */
  function buildURL(tableId, params = {}) {
    const url = new URL(`https://api.airtable.com/v0/${CONFIG.BASE_ID}/${tableId}`);
    
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else {
        url.searchParams.append(key, value);
      }
    });
    
    return url.toString();
  }

  /**
   * Make authenticated API request
   */
  async function apiRequest(url) {
    const token = getToken();
    
    if (!token) {
      throw new Error('Token Airtable non configurato. Vai su Settings.');
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token non valido. Verifica Settings.');
      }
      if (response.status === 404) {
        throw new Error('Tabella o base non trovata.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit raggiunto. Attendi 30 secondi.');
      }
      throw new Error(`Errore API: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch product by SKU
   */
  async function fetchProductBySKU(skuInput) {
    const sku = normalizeSKU(skuInput);
    
    const params = {
      filterByFormula: `{SKU}='${sku}'`,
      'fields[]': INVENTARIO_FIELDS
    };

    const url = buildURL(CONFIG.INVENTARIO_TABLE_ID, params);
    const data = await apiRequest(url);

    if (!data.records || data.records.length === 0) {
      throw new Error(`SKU "${sku}" non trovato`);
    }

    return data.records[0];
  }

  /**
   * Fetch RAW record by ID (fallback for folder resolution)
   */
  async function fetchRawRecord(recordId) {
    const params = {
      'fields[]': RAW_FIELDS
    };

    const url = `https://api.airtable.com/v0/${CONFIG.BASE_ID}/${CONFIG.RAW_TABLE_ID}/${recordId}`;
    const token = getToken();

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('Failed to fetch RAW record:', recordId);
      return null;
    }

    return response.json();
  }

  /**
   * Resolve Folder ID from record
   * Priority: RAW_FolderID lookup → fetch linked RAW record
   */
  async function resolveFolderID(record) {
    const fields = record.fields;

    // 1. Try direct lookup field
    if (fields.RAW_FolderID) {
      // Handle array (Airtable lookup returns array)
      const folderId = Array.isArray(fields.RAW_FolderID) 
        ? fields.RAW_FolderID[0] 
        : fields.RAW_FolderID;
      
      if (folderId) return folderId;
    }

    // 2. Fallback: fetch linked RAW record
    const rawLink = fields.RAW;
    if (rawLink && rawLink.length > 0) {
      const rawRecordId = rawLink[0];
      const rawRecord = await fetchRawRecord(rawRecordId);
      
      if (rawRecord && rawRecord.fields) {
        return rawRecord.fields.Folder_ID || null;
      }
    }

    return null;
  }

  /**
   * Map status to badge type
   */
  function getStatusBadgeType(status, field) {
    if (!status) return 'neutral';

    const statusUpper = status.toUpperCase();

    // Product_Status mapping
    if (field === 'Product_Status') {
      if (statusUpper.includes('ERROR')) return 'error';
      if (statusUpper.includes('READY') || statusUpper.includes('DONE') || 
          statusUpper.includes('GENERATED') || statusUpper === 'LISTED' || statusUpper === 'SOLD') {
        return 'success';
      }
      if (statusUpper.includes('PENDING') || statusUpper.includes('PROCESSING') || 
          statusUpper.includes('WAITING')) {
        return 'warning';
      }
      return 'neutral';
    }

    // AI_Status mapping
    if (field === 'AI_Status') {
      if (statusUpper.includes('ERROR')) return 'error';
      if (statusUpper === 'AI_DONE') return 'success';
      if (statusUpper.includes('PENDING') || statusUpper.includes('PROCESSING')) return 'warning';
      return 'neutral';
    }

    // AI_Quality_Check mapping  
    if (field === 'AI_Quality_Check') {
      if (statusUpper === 'APPROVED') return 'success';
      if (statusUpper === 'REJECTED') return 'error';
      if (statusUpper === 'PENDING') return 'warning';
      return 'neutral';
    }

    // Listing_Status mapping
    if (field === 'Listing_Status') {
      if (statusUpper === 'PUBLISHED' || statusUpper === 'LIVE') return 'info';
      return 'neutral';
    }

    return 'neutral';
  }

  // Public API
  return {
    CONFIG,
    getToken,
    normalizeSKU,
    fetchProductBySKU,
    fetchRawRecord,
    resolveFolderID,
    getStatusBadgeType
  };
})();
