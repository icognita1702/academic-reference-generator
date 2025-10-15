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

function setPageInfoUI({ title, url, accessDate, site }) {
  const titleEl = q('#pageTitle');
  const urlEl = q('#pageUrl');
  const dateEl = q('#accessDate');
  const siteEl = q('#siteName');
  if (titleEl) titleEl.textContent = title || 'Sem título';
  if (urlEl) urlEl.textContent = url || '—';
  if (dateEl) dateEl.textContent = formatAccessDate(accessDate || new Date());
  if (siteEl) siteEl.textContent = site || '';
}

function showBlockedNotice() {
  const pageInfo = document.querySelector('.page-info .info-card');
  if (!pageInfo) return;
  const warn = document.createElement('div');
  warn.className = 'blocked-notice';
  warn.innerHTML = `
    <div class="notice">
      <i class="fas fa-shield-alt"></i>
      Página bloqueada: Não é possível acessar páginas internas do navegador.
    </div>
  `;
  pageInfo.prepend(warn);
}

function toggleManualForm() {
  const form = q('#manualForm');
  if (!form) return;
  form.classList.toggle('hidden');
}

function getManualData() {
  // Enhanced manual inputs: includes DOI/ISBN/type/url
  return {
    title: q('#titleInput')?.value || '',
    url: q('#urlInput')?.value || '',
    year: q('#yearInput')?.value || '',
    publisher: q('#publisherInput')?.value || '',
    journal: q('#journalInput')?.value || '',
    volume: q('#volumeInput')?.value || '',
    issue: q('#issueInput')?.value || '',
    pages: q('#pagesInput')?.value || '',
    doi: q('#doiInput')?.value || '',
    isbn: q('#isbnInput')?.value || '',
    type: q('#typeSelect')?.value || '',
    authors: (q('#authorsInput')?.value || '')
      .split(/;|\n|\r/)
      .map(s => s.trim())
      .filter(Boolean)
  };
}

function normalizeAuthorsArray(arr) {
  return (arr || []).map(name => {
    if (typeof name !== 'string') return name;
    const parts = name.trim().split(/\s+/);
    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts[parts.length - 1]
    };
  });
}

function saveHistory(item) {
  chrome.storage.local.get(['history'], ({ history = [] }) => {
    history.unshift(item);
    if (history.length > 50) history = history.slice(0, 50);
    chrome.storage.local.set({ history });
    renderHistory(history);
  });
}

function renderHistory(history) {
  const container = q('#historyList');
  if (!container) return;
  container.innerHTML = '';
  if (!history || history.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhum histórico ainda.</p>';
    return;
    }
  history.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-header">
        <span class="history-format">${item.style}</span>
        <span class="history-date">${item.date}</span>
      </div>
      <div class="history-text">${item.text}</div>
    `;
    container.appendChild(div);
  });
}

function onCopy() {
  const refOutput = q('#referenceOutput');
  if (!refOutput) return;
  navigator.clipboard.writeText(refOutput.textContent).then(() => {
    const copyBtn = q('#copyBtn');
    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copiado!';
      setTimeout(() => (copyBtn.textContent = originalText), 2000);
    }
  });
}

function onDownload() {
  const refOutput = q('#referenceOutput');
  if (!refOutput) return;
  downloadFile(refOutput.textContent, 'referencia.txt', 'text/plain');
}

function onExportBibTeX() {
  const data = window._lastGeneratedMetadata;
  if (!data) return;
  const bib = `@misc{ref,\n  author = {${(data.authors||[]).map(a=>`${a.lastName}, ${a.firstName}`).join(' and ')}},\n  title = {${data.title || ''}},\n  year = {${data.year || ''}},\n  url = {${data.url || ''}},\n  doi = {${data.doi || ''}}\n}`;
  downloadFile(bib, 'referencia.bib', 'text/plain');
}

function onExportRIS() {
  const data = window._lastGeneratedMetadata;
  if (!data) return;
  const ris = `TY  - ${data.type === 'book' ? 'BOOK' : data.type === 'article' ? 'JOUR' : 'ELEC'}\nAU  - ${(data.authors||[]).map(a=>`${a.lastName}, ${a.firstName}`).join('\nAU  - ')}\nTI  - ${data.title || ''}\nPY  - ${data.year || ''}\nJO  - ${data.journal || ''}\nVL  - ${data.volume || ''}\nIS  - ${data.issue || ''}\nSP  - ${data.pages || ''}\nDO  - ${data.doi || ''}\nUR  - ${data.url || ''}\nER  - `;
  downloadFile(ris, 'referencia.ris', 'text/plain');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function onClearHistory() {
  if (!confirm('Limpar todo o histórico?')) return;
  chrome.storage.local.set({ history: [] });
  renderHistory([]);
}

async function buildPreciseMetadata(baseData) {
  // Determine input type and enrich
  const input = {
    url: baseData.url || '',
    text: baseData.title || '',
    identifier: baseData.doi || baseData.isbn || '',
    type: baseData.type || ''
  };
  let meta = null;
  if (enricher && typeof enricher.smartExtract === 'function') {
    meta = await enricher.smartExtract(input);
  }
  // Merge manual fields if provided
  if (baseData && typeof baseData === 'object') {
    meta = { ...(meta || {}), ...baseData };
  }
  // Normalize authors and validate
  if (enricher && typeof enricher.validateAndComplete === 'function') {
    meta.authors = normalizeAuthorsArray(meta.authors);
    meta = enricher.validateAndComplete(meta);
  }
  return meta;
}

function formatReference(meta, styleKey) {
  const style = (styleKey || 'ABNT').toUpperCase();
  if (!formatter || typeof formatter.format !== 'function') return '';
  return formatter.format(meta, style);
}

async function onGenerate() {
  const loadingDiv = q('#loadingDiv');
  const outputArea = q('#outputArea');
  if (loadingDiv) loadingDiv.classList.remove('hidden');
  if (outputArea) outputArea.classList.add('hidden');

  const styleKey = getActiveFormatKey();
  const manualForm = q('#manualForm');

  let baseData;
  if (manualForm && !manualForm.classList.contains('hidden')) {
    baseData = getManualData();
  } else {
    const safe = await getPageMetadataSafe();
    baseData = safe?.data || {};
  }

  const precise = await buildPreciseMetadata(baseData);
  const refText = formatReference(precise, styleKey);

  const refOutput = q('#referenceOutput');
  if (refOutput) refOutput.textContent = refText;

  if (loadingDiv) loadingDiv.classList.add('hidden');
  if (outputArea) outputArea.classList.remove('hidden');

  window._lastGeneratedMetadata = precise;
  saveHistory({ style: styleKey, text: refText, date: new Date().toLocaleString() });
}

window.addEventListener('DOMContentLoaded', async () => {
  // Wire buttons
  const toggleBtn = q('#toggleManual');
  const genBtn = q('#generateBtn');
  const copyBtn = q('#copyBtn');
  const downloadBtn = q('#downloadBtn');
  const clearBtn = q('#clearHistoryBtn');
  if (toggleBtn) toggleBtn.addEventListener('click', toggleManualForm);
  if (genBtn) genBtn.addEventListener('click', onGenerate);
  if (copyBtn) copyBtn.addEventListener('click', onCopy);
  if (downloadBtn) downloadBtn.addEventListener('click', onDownload);
  if (clearBtn) clearBtn.addEventListener('click', onClearHistory);

  const bibBtn = q('#exportBibTeXBtn');
  const risBtn = q('#exportRISBtn');
  if (bibBtn) bibBtn.addEventListener('click', onExportBibTeX);
  if (risBtn) risBtn.addEventListener('click', onExportRIS);
  qa('.format-btn').forEach(btn => btn.addEventListener('click', () => setActiveFormat(btn)));

  // Init history
  chrome.storage.local.get(['history']).then(({ history = [] }) => renderHistory(history));

  // Prefill page info
  const safe = await getPageMetadataSafe();
  const baseData = safe?.data || {};
  const eligible = !!safe?.eligible;
  if (!eligible) showBlockedNotice();
  const autoMeta = {
    title: baseData.title || document.title || 'Sem título',
    url: baseData.url || '',
    accessDate: new Date(),
    site: baseData.site || ''
  };
  setPageInfoUI(autoMeta);
});
