// Lógica do popup: coleta metadados, formata e salva histórico
const q = (s) => document.querySelector(s);
const qa = (s) => Array.from(document.querySelectorAll(s));

const FORMATS = {
  abnt: { name: 'ABNT', fn: buildABNT },
  apa: { name: 'APA', fn: buildAPA },
  vancouver: { name: 'Vancouver', fn: buildVancouver },
  chicago: { name: 'Chicago', fn: buildChicago },
  mla: { name: 'MLA', fn: buildMLA }
};

const EXPORTERS = {
  bibtex: { name: 'BibTeX', fn: exportBibTeX },
  ris: { name: 'RIS', fn: exportRIS }
};

// Helper: formata data de acesso
function formatAccessDate(date) {
  if (!date) date = new Date();
  if (!(date instanceof Date)) date = new Date(date);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Builders de formato
function buildABNT(data) {
  const parts = [];
  if (data.author) parts.push(data.author.toUpperCase() + '.');
  if (data.title) parts.push(data.title + '.');
  if (data.publisher) parts.push(data.publisher + ',');
  if (data.year) parts.push(data.year + '.');
  if (data.url) parts.push('Disponível em: <' + data.url + '>.');
  if (data.accessDate) parts.push('Acesso em: ' + formatAccessDate(data.accessDate) + '.');
  return parts.join(' ');
}

function buildAPA(data) {
  const parts = [];
  if (data.author) parts.push(data.author + '.');
  if (data.year) parts.push('(' + data.year + ').');
  if (data.title) parts.push(data.title + '.');
  if (data.publisher) parts.push(data.publisher + '.');
  if (data.url) parts.push('Retrieved from ' + data.url);
  return parts.join(' ');
}

function buildVancouver(data) {
  const parts = [];
  if (data.author) parts.push(data.author + '.');
  if (data.title) parts.push(data.title + '.');
  if (data.publisher) parts.push(data.publisher + ';');
  if (data.year) parts.push(data.year + '.');
  if (data.url) parts.push('Available from: ' + data.url);
  return parts.join(' ');
}

function buildChicago(data) {
  const parts = [];
  if (data.author) parts.push(data.author + '.');
  if (data.title) parts.push('"' + data.title + '."');
  if (data.publisher) parts.push(data.publisher + ',');
  if (data.year) parts.push(data.year + '.');
  if (data.url) parts.push(data.url + '.');
  return parts.join(' ');
}

function buildMLA(data) {
  const parts = [];
  if (data.author) parts.push(data.author + '.');
  if (data.title) parts.push('"' + data.title + '."');
  if (data.publisher) parts.push(data.publisher + ',');
  if (data.year) parts.push(data.year + '.');
  if (data.url) parts.push('Web.');
  return parts.join(' ');
}

function exportBibTeX(data) {
  return `@misc{ref,\n  author = {${data.author || ''}},\n  title = {${data.title || ''}},\n  year = {${data.year || ''}},\n  url = {${data.url || ''}},\n  note = {Accessed: ${formatAccessDate(data.accessDate)}}\n}`;
}

function exportRIS(data) {
  return `TY  - ELEC\nAU  - ${data.author || ''}\nTI  - ${data.title || ''}\nPY  - ${data.year || ''}\nUR  - ${data.url || ''}\nER  - `;
}

function buildReference(data, formatKey) {
  const fmt = FORMATS[formatKey];
  return fmt ? fmt.fn(data) : '';
}

function exportReference(data, exportKey) {
  const exp = EXPORTERS[exportKey];
  return exp ? exp.fn(data) : '';
}

function saveHistory(item) {
  chrome.storage.local.get(['history'], ({ history = [] }) => {
    history.unshift(item);
    if (history.length > 20) history = history.slice(0, 20);
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
  history.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-header">
        <span class="history-format">${item.format}</span>
        <span class="history-date">${item.date}</span>
      </div>
      <div class="history-text">${item.text}</div>
    `;
    container.appendChild(div);
  });
}

function setActiveFormat(btn) {
  qa('.format-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function getActiveFormatKey() {
  const active = q('.format-btn.active');
  return active ? active.dataset.format : 'abnt';
}

async function getPageMetadataSafe() {
  const resp = await chrome.runtime.sendMessage({ type: 'GET_PAGE_METADATA_SAFE' }).catch(() => null);
  return resp || { ok: false };
}

function setPageInfoUI({ title, url, accessDate }) {
  const titleEl = q('#pageTitle');
  const urlEl = q('#pageUrl');
  const dateEl = q('#accessDate');
  
  if (titleEl) titleEl.textContent = title || 'Sem título';
  if (urlEl) urlEl.textContent = url || '—';
  if (dateEl) dateEl.textContent = formatAccessDate(accessDate || new Date());
}

function showBlockedNotice() {
  const pageInfo = document.querySelector('.page-info .info-card');
  if (!pageInfo) return;
  const warn = document.createElement('div');
  warn.className = 'blocked-notice';
  warn.innerHTML = `
    <div class="notice">
      <i class="fas fa-shield-alt"></i>
      <strong>Página bloqueada:</strong> Não é possível acessar páginas internas do navegador.
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
  return {
    author: q('#authorInput')?.value || '',
    title: q('#titleInput')?.value || '',
    year: q('#yearInput')?.value || '',
    publisher: q('#publisherInput')?.value || '',
    url: q('#urlInput')?.value || '',
    accessDate: new Date()
  };
}

async function onGenerate() {
  const loadingDiv = q('#loadingDiv');
  const outputArea = q('#outputArea');
  
  if (loadingDiv) loadingDiv.classList.remove('hidden');
  if (outputArea) outputArea.classList.add('hidden');

  const formatKey = getActiveFormatKey();
  const manualForm = q('#manualForm');
  let data;

  if (manualForm && !manualForm.classList.contains('hidden')) {
    data = getManualData();
  } else {
    const safe = await getPageMetadataSafe();
    data = safe?.data || {};
  }

  const reference = buildReference(data, formatKey);
  const refOutput = q('#referenceOutput');
  if (refOutput) refOutput.textContent = reference;
  
  if (loadingDiv) loadingDiv.classList.add('hidden');
  if (outputArea) outputArea.classList.remove('hidden');

  window._lastGeneratedData = data;
  saveHistory({ format: FORMATS[formatKey].name, text: reference, date: new Date().toLocaleString() });
}

function onCopy() {
  const refOutput = q('#referenceOutput');
  if (!refOutput) return;
  
  navigator.clipboard.writeText(refOutput.textContent).then(() => {
    const copyBtn = q('#copyBtn');
    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copiado!';
      setTimeout(() => copyBtn.textContent = originalText, 2000);
    }
  });
}

function onDownload() {
  const refOutput = q('#referenceOutput');
  if (!refOutput) return;
  downloadFile(refOutput.textContent, 'referencia.txt', 'text/plain');
}

function onExportBibTeX() {
  if (!window._lastGeneratedData) return;
  const bib = exportReference(window._lastGeneratedData, 'bibtex');
  downloadFile(bib, 'referencia.bib', 'text/plain');
}

function onExportRIS() {
  if (!window._lastGeneratedData) return;
  const ris = exportReference(window._lastGeneratedData, 'ris');
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

// Eventos de UI
window.addEventListener('DOMContentLoaded', async () => {
  // Pré-carrega estado mínimo (sem bloquear a UI)
  setPageInfoUI({ title: 'Carregando...', url: '—', accessDate: new Date() });

  // Botões principais
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

  // Exportação
  const bibBtn = q('#exportBibTeXBtn');
  const risBtn = q('#exportRISBtn');
  if (bibBtn) bibBtn.addEventListener('click', onExportBibTeX);
  if (risBtn) risBtn.addEventListener('click', onExportRIS);

  // Alternância de formato
  qa('.format-btn').forEach(btn => btn.addEventListener('click', () => setActiveFormat(btn)));

  // Histórico inicial
  chrome.storage.local.get(['history']).then(({ history = [] }) => renderHistory(history));

  // Tenta preencher automaticamente sem clicar em Gerar
  const safe = await getPageMetadataSafe();
  const baseData = safe?.data || {};
  const eligible = !!safe?.eligible;

  if (!eligible) showBlockedNotice();

  const autoMeta = {
    title: baseData.title || document.title || 'Sem título',
    url: baseData.url || '',
    accessDate: new Date(),
  };
  setPageInfoUI(autoMeta);
});
