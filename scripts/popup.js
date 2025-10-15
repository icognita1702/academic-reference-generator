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

// OPTIMIZATION: Load and display page title immediately on popup open
async function loadPageTitleFast() {
  const pageTitleEl = q('#pageTitle');
  if (!pageTitleEl) return;

  try {
    // Step 1: Try to get title from active tab immediately (fastest)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.title) {
      pageTitleEl.textContent = tab.title;
      pageTitleEl.style.fontStyle = 'normal';
    }

    // Step 2: Try to get more complete metadata in background (async, non-blocking)
    getPageMetadataSafe().then(metadata => {
      if (metadata.ok && metadata.data && metadata.data.title) {
        // Update with enriched title if available and different
        if (metadata.data.title !== tab.title) {
          pageTitleEl.textContent = metadata.data.title;
        }
      }
    }).catch(err => {
      console.warn('Background metadata fetch failed:', err);
      // Keep the fast title already displayed
    });

  } catch (error) {
    console.error('Error loading page title:', error);
    // Fallback: keep "Carregando..." or set to safe default
    if (pageTitleEl.textContent === 'Carregando...') {
      pageTitleEl.textContent = 'Título não disponível';
      pageTitleEl.style.fontStyle = 'italic';
    }
  }
}

async function generateReference() {
  const outputDiv = q('#referenceOutput');
  const copyBtn = q('#copyBtn');
  const formatKey = getActiveFormatKey();

  if (!outputDiv) return;

  outputDiv.textContent = 'Gerando referência...';
  outputDiv.style.display = 'block';
  if (copyBtn) copyBtn.style.display = 'none';

  const metadata = await getPageMetadataSafe();

  if (!metadata.ok || !metadata.data) {
    outputDiv.textContent = 'Erro: Não foi possível obter os dados da página.';
    return;
  }

  let data = metadata.data;
  if (enricher && metadata.needsEnrichment) {
    try {
      data = await enricher.enrich(data);
    } catch (err) {
      console.warn('Enrichment failed, using basic metadata:', err);
    }
  }

  if (!formatter) {
    outputDiv.textContent = 'Erro: Formatador não disponível.';
    return;
  }

  let reference = '';
  try {
    switch (formatKey) {
      case 'ABNT':
        reference = formatter.formatABNT(data);
        break;
      case 'APA':
        reference = formatter.formatAPA(data);
        break;
      case 'Chicago':
        reference = formatter.formatChicago(data);
        break;
      case 'MLA':
        reference = formatter.formatMLA(data);
        break;
      case 'Vancouver':
        reference = formatter.formatVancouver(data);
        break;
      default:
        reference = formatter.formatABNT(data);
    }
  } catch (err) {
    console.error('Formatting error:', err);
    outputDiv.textContent = 'Erro ao formatar a referência.';
    return;
  }

  outputDiv.textContent = reference;
  if (copyBtn) copyBtn.style.display = 'inline-block';

  chrome.storage.local.get({ referenceHistory: [] }, (result) => {
    const history = result.referenceHistory || [];
    history.unshift({ reference, format: formatKey, timestamp: Date.now() });
    if (history.length > 50) history.pop();
    chrome.storage.local.set({ referenceHistory: history }, () => {
      loadHistory();
    });
  });
}

function copyToClipboard() {
  const outputDiv = q('#referenceOutput');
  if (!outputDiv || !outputDiv.textContent) return;

  navigator.clipboard.writeText(outputDiv.textContent).then(() => {
    const copyBtn = q('#copyBtn');
    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copiado!';
      copyBtn.style.backgroundColor = '#4CAF50';
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.backgroundColor = '';
      }, 2000);
    }
  }).catch(err => {
    console.error('Copy failed:', err);
    alert('Erro ao copiar para a área de transferência.');
  });
}

function loadHistory() {
  chrome.storage.local.get({ referenceHistory: [] }, (result) => {
    const history = result.referenceHistory || [];
    const historyDiv = q('#historyList');
    if (!historyDiv) return;

    if (history.length === 0) {
      historyDiv.innerHTML = '<p style="color: #666; font-style: italic;">Nenhuma referência gerada ainda.</p>';
      return;
    }

    historyDiv.innerHTML = '';
    history.slice(0, 10).forEach((item, idx) => {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'history-entry';

      const refText = document.createElement('div');
      refText.className = 'history-reference';
      refText.textContent = item.reference;

      const metaDiv = document.createElement('div');
      metaDiv.className = 'history-meta';
      const date = new Date(item.timestamp);
      metaDiv.textContent = `${item.format} - ${formatAccessDate(date)}`;

      const copyHistBtn = document.createElement('button');
      copyHistBtn.className = 'history-copy-btn';
      copyHistBtn.textContent = '📋 Copiar';
      copyHistBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(item.reference).then(() => {
          copyHistBtn.textContent = '✓ Copiado!';
          copyHistBtn.style.backgroundColor = '#4CAF50';
          setTimeout(() => {
            copyHistBtn.textContent = '📋 Copiar';
            copyHistBtn.style.backgroundColor = '';
          }, 2000);
        });
      });

      entryDiv.appendChild(refText);
      entryDiv.appendChild(metaDiv);
      entryDiv.appendChild(copyHistBtn);
      historyDiv.appendChild(entryDiv);
    });
  });
}

function clearHistory() {
  if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
    chrome.storage.local.set({ referenceHistory: [] }, () => {
      loadHistory();
    });
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = q('#generateBtn');
  const copyBtn = q('#copyBtn');
  const clearHistoryBtn = q('#clearHistoryBtn');
  const formatBtns = qa('.format-btn');

  if (generateBtn) {
    generateBtn.addEventListener('click', generateReference);
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', copyToClipboard);
  }
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
  }

  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveFormat(btn);
    });
  });

  // OPTIMIZATION: Load page title immediately when popup opens
  loadPageTitleFast();

  // Load history on popup open
  loadHistory();
});
