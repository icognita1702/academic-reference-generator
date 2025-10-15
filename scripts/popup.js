// Lógica do popup: coleta metadados, formata e salva histórico
const q = (s) => document.querySelector(s);
const qa = (s) => Array.from(document.querySelectorAll(s));

const FORMATS = { /* ... permanece igual ... */ };
const EXPORTERS = { /* ... permanece igual ... */ };

/* ... format helpers permanecem iguais ... */

function buildReference(data, formatKey) { /* igual */ }
function exportReference(data, exportKey) { /* igual */ }
function saveHistory(item) { /* igual */ }
function renderHistory(history) { /* igual */ }
function setActiveFormat(btn) { /* igual */ }
function getActiveFormatKey() { /* igual */ }

async function getPageMetadataSafe() {
  // Usa novo endpoint seguro do background
  const resp = await chrome.runtime.sendMessage({ type: 'GET_PAGE_METADATA_SAFE' }).catch(() => null);
  return resp || { ok: false };
}

function setPageInfoUI({ title, url, accessDate }) {
  q('#pageTitle').textContent = title || 'Sem título';
  q('#pageUrl').textContent = url || '—';
  q('#accessDate').textContent = formatAccessDate(accessDate || new Date());
}

function showBlockedNotice() {
  const pageInfo = document.querySelector('.page-info .info-card');
  if (!pageInfo) return;
  const warn = document.createElement('div');
  warn.className = 'blocked-notice';
  warn.innerHTML = `
    <div class="notice">
      <i class="fas fa-shield-alt"></i>
      <span>Este site não permite coleta automática. Use a <b>Entrada Manual</b> ou abra uma página http/https.</span>
    </div>
  `;
  pageInfo.appendChild(warn);
}

function toggleManualForm() { /* igual */ }
function getManualOverrides() { /* igual */ }
function mergeData(meta, manual) { /* igual */ }

async function onGenerate() {
  q('#loadingDiv').classList.remove('hidden');
  q('#resultDiv').classList.add('hidden');

  // Sempre tenta obter algo do background com fallback seguro
  const safe = await getPageMetadataSafe();
  const baseData = safe?.data || {};
  const eligible = !!safe?.eligible;

  if (!eligible) {
    // Mostra aviso e ainda assim exibe data/título mínimos
    showBlockedNotice();
  }

  const meta = {
    title: baseData.title || document.title || 'Sem título',
    url: baseData.url || '',
    authors: '',
    year: new Date().getFullYear().toString(),
    site: baseData.url ? new URL(baseData.url).hostname.replace('www.', '') : '',
    accessDate: new Date(),
  };
  setPageInfoUI(meta);

  const manual = getManualOverrides();
  const data = mergeData(meta, manual);
  const formatKey = getActiveFormatKey();
  const reference = buildReference(data, formatKey);

  q('#referenceOutput').textContent = reference;
  q('#resultDiv').classList.remove('hidden');
  q('#loadingDiv').classList.add('hidden');

  window._lastGeneratedData = data;
  saveHistory({ format: FORMATS[formatKey].name, text: reference, date: new Date().toLocaleString() });
}

function onCopy() { /* igual */ }
function onDownload() { /* igual */ }
function onExportBibTeX() { /* igual */ }
function onExportRIS() { /* igual */ }
function downloadFile(content, filename, mimeType) { /* igual */ }
function onClearHistory() { /* igual */ }

// Eventos de UI
window.addEventListener('DOMContentLoaded', async () => {
  // Pré-carrega estado mínimo (sem bloquear a UI)
  setPageInfoUI({ title: 'Carregando...', url: '—', accessDate: new Date() });

  // Botões principais
  q('#toggleManual').addEventListener('click', toggleManualForm);
  q('#generateBtn').addEventListener('click', onGenerate);
  q('#copyBtn').addEventListener('click', onCopy);
  q('#downloadBtn').addEventListener('click', onDownload);
  q('#clearHistoryBtn').addEventListener('click', onClearHistory);

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
