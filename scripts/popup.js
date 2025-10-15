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
  } catch {
    return { ok: false };
  }
}

async function generateReference() {
  const loadingEl = q('#loadingIndicator');
  const referenceOutputEl = q('#referenceOutput');
  const copyBtnEl = q('#copyBtn');
  const errorEl = q('#errorMessage');

  if (loadingEl) loadingEl.style.display = 'block';
  if (errorEl) errorEl.textContent = '';
  if (referenceOutputEl) referenceOutputEl.innerHTML = '';
  if (copyBtnEl) copyBtnEl.style.display = 'none';

  try {
    const res = await getPageMetadataSafe();
    if (!res.ok) {
      throw new Error(res.error || 'Não foi possível capturar os metadados da página.');
    }

    let meta = res.metadata;
    let enriched = meta;
    if (enricher && meta.doi) {
      enriched = await enricher.enrichFromCrossRef(meta.doi);
    } else if (enricher && meta.isbn) {
      enriched = await enricher.enrichFromOpenLibrary(meta.isbn);
    }

    const fmt = getActiveFormatKey();
    let reference = '';
    
    if (formatter) {
      if (fmt === 'ABNT') reference = formatter.formatABNT(enriched);
      else if (fmt === 'APA') reference = formatter.formatAPA(enriched);
      else if (fmt === 'MLA') reference = formatter.formatMLA(enriched);
      else if (fmt === 'Chicago') reference = formatter.formatChicago(enriched);
      else if (fmt === 'Vancouver') reference = formatter.formatVancouver(enriched);
      else reference = formatter.formatABNT(enriched);
    } else {
      reference = `${enriched.title || 'Sem título'}. ${enriched.url || ''}`;
    }

    // CORREÇÃO PRINCIPAL: usar innerHTML para preservar formatação e exibir referência formatada
    if (referenceOutputEl) {
      referenceOutputEl.innerHTML = reference;
      referenceOutputEl.style.display = 'block';
    }

    // CORREÇÃO: sempre mostrar o botão de cópia quando houver referência
    if (copyBtnEl) {
      copyBtnEl.style.display = 'inline-flex';
      copyBtnEl.disabled = false;
    }

    // Salvar no histórico com referência completa
    saveToHistory({
      format: fmt,
      reference: reference,
      text: referenceOutputEl ? referenceOutputEl.innerText : reference.replace(/<[^>]*>/g, ''),
      metadata: enriched,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    if (errorEl) errorEl.textContent = err.message || 'Erro desconhecido';
    console.error('Error generating reference:', err);
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

function saveToHistory(entry) {
  chrome.storage.local.get(['referenceHistory'], (result) => {
    const history = result.referenceHistory || [];
    history.unshift(entry);
    if (history.length > 50) history.pop();
    chrome.storage.local.set({ referenceHistory: history });
  });
}

function copyToClipboard() {
  const referenceOutputEl = q('#referenceOutput');
  if (!referenceOutputEl) return;
  
  // CORREÇÃO: copiar o texto completo (sem formatação HTML) para a área de transferência
  const textToCopy = referenceOutputEl.innerText || referenceOutputEl.textContent;
  
  navigator.clipboard.writeText(textToCopy).then(() => {
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
    console.error('Erro ao copiar:', err);
    alert('Não foi possível copiar. Tente selecionar e copiar manualmente.');
  });
}

function loadHistory() {
  chrome.storage.local.get(['referenceHistory'], (result) => {
    const history = result.referenceHistory || [];
    const historyList = q('#historyList');
    if (!historyList) return;

    historyList.innerHTML = '';
    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-history">Nenhuma referência gerada ainda.</p>';
      return;
    }

    history.forEach((entry, index) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      
      // CORREÇÃO: exibir referência completa no histórico
      item.innerHTML = `
        <div class="history-header">
          <span class="history-format">${entry.format || 'ABNT'}</span>
          <span class="history-timestamp">${new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
        </div>
        <div class="history-reference">${entry.reference || entry.text || 'Sem referência'}</div>
        <button class="history-copy-btn" data-index="${index}">📋 Copiar</button>
      `;
      
      historyList.appendChild(item);
    });

    // Adicionar event listeners para os botões de copiar do histórico
    qa('.history-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const entry = history[index];
        if (entry) {
          const textToCopy = entry.text || entry.reference.replace(/<[^>]*>/g, '');
          navigator.clipboard.writeText(textToCopy).then(() => {
            btn.textContent = '✓ Copiado!';
            btn.style.backgroundColor = '#4CAF50';
            setTimeout(() => {
              btn.textContent = '📋 Copiar';
              btn.style.backgroundColor = '';
            }, 2000);
          });
        }
      });
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

  // Load history on popup open
  loadHistory();
});
