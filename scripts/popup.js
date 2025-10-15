// Popup logic: integrate API services, enrichment, and formatters for precise refs
// Imports (for bundlers or eval in extension popup)
// Assuming these scripts are loaded in popup.html via <script> tags in order:
// scripts/api-services.js, scripts/metadata-enrichment.js, scripts/formatters.js

const q = (s) => document.querySelector(s);
const qa = (s) => Array.from(document.querySelectorAll(s));

// Instantiate services
const api = typeof APIServices !== 'undefined' ? new APIServices() : null;
const enricher = typeof MetadataEnricher !== 'undefined' ? new MetadataEnricher() : null;
const formatter = typeof Formatters !== 'undefined' ? new Formatters() : null;

function formatAccessDate(date) {
  if (!date) date = new Date();
  if (!(date instanceof Date)) date = new Date(date);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function setActiveFormat(btn) {
  qa('.format-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function getActiveFormatKey() {
  const active = q('.format-btn.active');
  return active ? active.dataset.format : 'ABNT';
}

async function getPageMetadataSafe() {
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'GET_PAGE_METADATA_SAFE' });
    return resp || { ok: false };
  } catch (e) {
    console.error('Error getting page metadata:', e);
    return { ok: false };
  }
}

async function enrichMetadata(raw) {
  if (!enricher || !raw.ok) return raw;
  try {
    const enriched = await enricher.enrichFromAPIs(raw.metadata);
    return { ok: true, metadata: enriched };
  } catch (e) {
    console.error('Enrichment failed:', e);
    return raw;
  }
}

function formatReference(metadata, formatKey) {
  if (!formatter) return 'Formatter not loaded';
  try {
    return formatter.format(metadata, formatKey);
  } catch (e) {
    console.error('Format error:', e);
    return 'Format error: ' + e.message;
  }
}

function displayReference(text) {
  const output = q('#referenceOutput');
  if (output) {
    output.textContent = text;
    output.style.display = 'block';
  }
}

function showMessage(text, type = 'info') {
  const msg = q('#message');
  if (msg) {
    msg.textContent = text;
    msg.className = `message ${type}`;
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 3000);
  }
}

function showLoading(show) {
  const loading = q('#loading');
  if (loading) loading.style.display = show ? 'block' : 'none';
}

async function generateReference() {
  showLoading(true);
  showMessage('Generating reference...', 'info');
  
  const raw = await getPageMetadataSafe();
  if (!raw.ok) {
    showMessage('Could not extract page metadata', 'error');
    showLoading(false);
    return;
  }
  
  const enriched = await enrichMetadata(raw);
  const formatKey = getActiveFormatKey();
  const refText = formatReference(enriched.metadata, formatKey);
  
  displayReference(refText);
  saveToHistory(enriched.metadata, refText, formatKey);
  
  showMessage('Reference generated successfully!', 'success');
  showLoading(false);
  
  // Show action buttons
  const actions = q('#actions');
  if (actions) actions.style.display = 'block';
}

function saveToHistory(metadata, refText, formatKey) {
  try {
    chrome.storage.local.get(['history'], (result) => {
      const history = result.history || [];
      history.unshift({
        metadata,
        refText,
        formatKey,
        timestamp: new Date().toISOString()
      });
      // Keep only last 50 entries
      if (history.length > 50) history.splice(50);
      chrome.storage.local.set({ history });
    });
  } catch (e) {
    console.error('Error saving to history:', e);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const copyBtn = q('#copyBtn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('success');
    showMessage('Reference copied to clipboard!', 'success');
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove('success');
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
    showMessage('Failed to copy to clipboard', 'error');
  });
}

function downloadTXT(text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reference_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  const downloadBtn = q('#downloadBtn');
  const originalText = downloadBtn.textContent;
  downloadBtn.textContent = '✓ Downloaded!';
  downloadBtn.classList.add('success');
  showMessage('Reference downloaded as TXT!', 'success');
  setTimeout(() => {
    downloadBtn.textContent = originalText;
    downloadBtn.classList.remove('success');
  }, 2000);
}

function exportBibTeX(metadata) {
  if (!formatter) {
    showMessage('Formatter not available', 'error');
    return;
  }
  
  const bibTeX = formatter.toBibTeX(metadata);
  const blob = new Blob([bibTeX], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reference_${Date.now()}.bib`;
  a.click();
  URL.revokeObjectURL(url);
  
  const exportBtn = q('#exportBibTeXBtn');
  const originalText = exportBtn.textContent;
  exportBtn.textContent = '✓ Exported!';
  exportBtn.classList.add('success');
  showMessage('Exported as BibTeX!', 'success');
  setTimeout(() => {
    exportBtn.textContent = originalText;
    exportBtn.classList.remove('success');
  }, 2000);
}

function exportRIS(metadata) {
  if (!formatter) {
    showMessage('Formatter not available', 'error');
    return;
  }
  
  const ris = formatter.toRIS(metadata);
  const blob = new Blob([ris], { type: 'application/x-research-info-systems' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reference_${Date.now()}.ris`;
  a.click();
  URL.revokeObjectURL(url);
  
  const exportBtn = q('#exportRISBtn');
  const originalText = exportBtn.textContent;
  exportBtn.textContent = '✓ Exported!';
  exportBtn.classList.add('success');
  showMessage('Exported as RIS!', 'success');
  setTimeout(() => {
    exportBtn.textContent = originalText;
    exportBtn.classList.remove('success');
  }, 2000);
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    chrome.storage.local.set({ history: [] }, () => {
      const clearBtn = q('#clearHistoryBtn');
      const originalText = clearBtn.textContent;
      clearBtn.textContent = '✓ Cleared!';
      clearBtn.classList.add('success');
      showMessage('History cleared!', 'success');
      setTimeout(() => {
        clearBtn.textContent = originalText;
        clearBtn.classList.remove('success');
      }, 2000);
    });
  }
}

function toggleManualEntry() {
  const manualSection = q('#manualSection');
  const autoSection = q('#autoSection');
  const toggleBtn = q('#toggleManual');
  
  if (manualSection && autoSection) {
    const isManualHidden = manualSection.style.display === 'none' || !manualSection.style.display;
    
    if (isManualHidden) {
      manualSection.style.display = 'block';
      autoSection.style.display = 'none';
      toggleBtn.textContent = '← Back to Auto';
    } else {
      manualSection.style.display = 'none';
      autoSection.style.display = 'block';
      toggleBtn.textContent = 'Manual Entry →';
    }
  }
}

let currentMetadata = null;

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Format buttons
  qa('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveFormat(btn);
      // Regenerate if we have metadata
      if (currentMetadata) {
        const formatKey = getActiveFormatKey();
        const refText = formatReference(currentMetadata, formatKey);
        displayReference(refText);
        showMessage(`Format changed to ${formatKey}`, 'info');
      }
    });
  });
  
  // Generate button
  const generateBtn = q('#generateBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      await generateReference();
      // Store current metadata for format switching
      const raw = await getPageMetadataSafe();
      if (raw.ok) {
        const enriched = await enrichMetadata(raw);
        currentMetadata = enriched.metadata;
      }
    });
  }
  
  // Copy button
  const copyBtn = q('#copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const output = q('#referenceOutput');
      if (output && output.textContent) {
        copyToClipboard(output.textContent);
      } else {
        showMessage('No reference to copy', 'error');
      }
    });
  }
  
  // Download button
  const downloadBtn = q('#downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const output = q('#referenceOutput');
      if (output && output.textContent) {
        downloadTXT(output.textContent);
      } else {
        showMessage('No reference to download', 'error');
      }
    });
  }
  
  // Export BibTeX button
  const exportBibTeXBtn = q('#exportBibTeXBtn');
  if (exportBibTeXBtn) {
    exportBibTeXBtn.addEventListener('click', () => {
      if (currentMetadata) {
        exportBibTeX(currentMetadata);
      } else {
        showMessage('Generate a reference first', 'error');
      }
    });
  }
  
  // Export RIS button
  const exportRISBtn = q('#exportRISBtn');
  if (exportRISBtn) {
    exportRISBtn.addEventListener('click', () => {
      if (currentMetadata) {
        exportRIS(currentMetadata);
      } else {
        showMessage('Generate a reference first', 'error');
      }
    });
  }
  
  // Clear history button
  const clearHistoryBtn = q('#clearHistoryBtn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
  }
  
  // Toggle manual entry button
  const toggleManualBtn = q('#toggleManual');
  if (toggleManualBtn) {
    toggleManualBtn.addEventListener('click', toggleManualEntry);
  }
  
  // Initialize: set first format as active if none is active
  if (!q('.format-btn.active')) {
    const firstBtn = q('.format-btn');
    if (firstBtn) setActiveFormat(firstBtn);
  }
  
  console.log('Popup initialized with all button listeners connected');
});
