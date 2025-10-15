// Lógica do popup: coleta metadados, formata e salva histórico
const q = (s) => document.querySelector(s);
const qa = (s) => Array.from(document.querySelectorAll(s));

const FORMATS = {
  abnt: {
    name: 'ABNT',
    format: ({ authors, title, site, year, url, accessDate }) => {
      const a = formatAuthorsABNT(authors);
      const d = formatAccessDate(accessDate);
      return `${a}. ${title}. ${site}, ${year}. Disponível em: <${url}>. Acesso em: ${d}.`;
    }
  },
  apa: {
    name: 'APA',
    format: ({ authors, year, title, site, url }) => {
      const a = formatAuthorsAPA(authors);
      return `${a} (${year}). ${title}. ${site}. ${url}`;
    }
  },
  vancouver: {
    name: 'Vancouver',
    format: ({ authors, title, site, year, url }) => {
      const a = formatAuthorsVancouver(authors);
      return `${a}. ${title}. ${site}. ${year}. Disponível em: ${url}`;
    }
  },
  chicago: {
    name: 'Chicago',
    format: ({ authors, title, site, year, url }) => {
      const a = formatAuthorsChicago(authors);
      return `${a}. "${title}." ${site}, ${year}. ${url}`;
    }
  },
  mla: {
    name: 'MLA',
    format: ({ authors, title, site, year, url }) => {
      const a = formatAuthorsMLA(authors);
      return `${a}. "${title}." ${site}, ${year}, ${url}.`;
    }
  },
  ieee: {
    name: 'IEEE',
    format: ({ authors, title, site, year, url }) => {
      const a = formatAuthorsIEEE(authors);
      return `${a}, "${title}," ${site}, ${year}. [Online]. Available: ${url}`;
    }
  }
};

// Exportadores BibTeX e RIS
const EXPORTERS = {
  bibtex: {
    name: 'BibTeX',
    extension: 'bib',
    format: ({ authors, title, site, year, url }) => {
      const authorsClean = authors ? formatAuthorsBibTeX(authors) : 'Author, A.';
      const titleClean = title.replace(/[{}]/g, '');
      const siteClean = site.replace(/[^a-zA-Z0-9]/g, '');
      const key = `${siteClean}${year}`;
      
      return `@misc{${key},
  author = {${authorsClean}},
  title = {{${titleClean}}},
  howpublished = {\\url{${url}}},
  year = {${year}},
  note = {Acessado em ${formatAccessDate(new Date())}}
}`;
    }
  },
  ris: {
    name: 'RIS',
    extension: 'ris',
    format: ({ authors, title, site, year, url }) => {
      const authorsRIS = authors ? formatAuthorsRIS(authors) : 'Author, A.';
      
      return `TY  - ELEC
TI  - ${title}
AU  - ${authorsRIS}
PY  - ${year}
UR  - ${url}
PB  - ${site}
ER  - `;
    }
  }
};

function formatAuthorsBibTeX(authors) {
  if (!authors) return 'Author, A.';
  return authors.split(/;|,\s?e\s?| and /i)
    .map(a => a.trim())
    .filter(Boolean)
    .join(' and ');
}

function formatAuthorsRIS(authors) {
  if (!authors) return 'Author, A.';
  return authors.split(/;|,\s?e\s?| and /i)
    .map(a => a.trim())
    .filter(Boolean)[0]; // RIS usa apenas o primeiro autor por linha AU
}

function formatAuthorsABNT(authors) {
  if (!authors) return 'SOBRENOME, Nome';
  return authors.split(/;|,\s?e\s?| and /i).map(a => a.trim()).filter(Boolean).map(p => {
    const [first, ...rest] = p.split(/\s+/);
    const last = rest.pop() || first;
    const firstNames = (rest.length ? [first, ...rest] : [first])
      .map(n => n[0]?.toUpperCase() + n.slice(1).toLowerCase())
      .join(' ');
    return `${last.toUpperCase()}, ${firstNames}`;
  }).join('; ');
}

function formatAuthorsAPA(authors) {
  if (!authors) return 'Sobrenome, N.';
  return authors.split(/;|,\s?e\s?| and /i).map(a => a.trim()).filter(Boolean).map(p => {
    const parts = p.split(/\s+/);
    const last = parts.pop();
    const initials = parts.map(n => (n[0] || '').toUpperCase() + '.').join(' ');
    return `${capitalize(last)}, ${initials}`;
  }).join(', ');
}

function formatAuthorsVancouver(authors) {
  if (!authors) return 'Sobrenome N';
  return authors.split(/;|,\s?e\s?| and /i).map(a => a.trim()).filter(Boolean).map(p => {
    const parts = p.split(/\s+/);
    const last = parts.pop();
    const initials = parts.map(n => (n[0] || '').toUpperCase()).join('');
    return `${capitalize(last)} ${initials}`;
  }).join(', ');
}

function formatAuthorsChicago(authors) {
  if (!authors) return 'Sobrenome, Nome';
  const arr = authors.split(/;|,\s?e\s?| and /i).map(a => a.trim()).filter(Boolean);
  if (arr.length === 1) return arr[0];
  return `${arr[0]} et al.`;
}

function formatAuthorsMLA(authors) {
  if (!authors) return 'Sobrenome, Nome';
  const arr = authors.split(/;|,\s?e\s?| and /i).map(a => a.trim()).filter(Boolean);
  if (arr.length === 1) return arr[0];
  return `${arr[0]}, et al.`;
}

function formatAuthorsIEEE(authors) {
  if (!authors) return 'N. Sobrenome';
  return authors.split(/;|,\s?e\s?| and /i).map(a => a.trim()).filter(Boolean).map(p => {
    const parts = p.split(/\s+/);
    const last = parts.pop();
    const initials = parts.map(n => (n[0] || '').toUpperCase() + '.').join(' ');
    return `${initials} ${capitalize(last)}`;
  }).join(', ');
}

function formatAccessDate(date = new Date()) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd} ${monthNamePT(mm)}. ${yyyy}`;
}

function monthNamePT(mm) {
  const map = {
    '01': 'jan.', '02': 'fev.', '03': 'mar.', '04': 'abr.', '05': 'mai.', '06': 'jun.',
    '07': 'jul.', '08': 'ago.', '09': 'set.', '10': 'out.', '11': 'nov.', '12': 'dez.'
  };
  return map[mm];
}

function capitalize(s = '') { return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s; }

function buildReference(data, formatKey) {
  const formatter = FORMATS[formatKey]?.format || FORMATS.abnt.format;
  return formatter(data);
}

function exportReference(data, exportKey) {
  const exporter = EXPORTERS[exportKey];
  if (!exporter) return null;
  return {
    content: exporter.format(data),
    extension: exporter.extension,
    name: exporter.name
  };
}

function saveHistory(item) {
  chrome.storage.local.get(['history']).then(({ history = [] }) => {
    const updated = [item, ...history].slice(0, 20);
    chrome.storage.local.set({ history: updated });
    renderHistory(updated);
  });
}

function renderHistory(history) {
  const list = q('#historyList');
  list.innerHTML = '';
  if (!history || history.length === 0) {
    list.innerHTML = `<div class="empty-history"><i class="fas fa-inbox"></i><p>Nenhuma referência gerada ainda</p></div>`;
    return;
  }
  history.forEach((h, idx) => {
    const div = document.createElement('div');
    div.className = 'history-item fade-in';
    div.innerHTML = `<div class="history-meta">${h.format} • ${h.date}</div><div class="history-reference">${h.text}</div>`;
    div.addEventListener('click', () => {
      q('#referenceOutput').textContent = h.text;
      q('#resultDiv').classList.remove('hidden');
    });
    list.appendChild(div);
  });
}

function setActiveFormat(btn) {
  qa('.format-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function getActiveFormatKey() {
  const btn = q('.format-btn.active');
  return btn?.dataset?.format || 'abnt';
}

async function getPageMetadata() {
  try {
    // Primeiro tenta via background (executeScript)
    const base = await chrome.runtime.sendMessage({ type: 'GET_PAGE_METADATA' });
    // Em seguida tenta ler coletores do content script
    const inject = await chrome.tabs.query({ active: true, currentWindow: true })
      .then(([tab]) => chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.__ARG_META__?.getAll?.() }))
      .then(res => res?.[0]?.result || {});

    const data = {
      title: inject.title || base?.data?.title || 'Sem título',
      url: inject.url || base?.data?.url || '',
      authors: inject.authors || '',
      year: inject.year || new Date().getFullYear().toString(),
      site: inject.site || (new URL(inject.url || base?.data?.url || location.href)).hostname.replace('www.', ''),
      accessDate: new Date(),
    };
    return data;
  } catch (e) {
    console.error(e);
    return {
      title: document.title || 'Sem título',
      url: '',
      authors: '',
      year: new Date().getFullYear().toString(),
      site: '',
      accessDate: new Date(),
    };
  }
}

function setPageInfoUI({ title, url, accessDate }) {
  q('#pageTitle').textContent = title;
  q('#pageUrl').textContent = url;
  q('#accessDate').textContent = formatAccessDate(accessDate);
}

function toggleManualForm() {
  const btn = q('#toggleManual');
  const form = q('#manualForm');
  const active = !form.classList.contains('hidden');
  form.classList.toggle('hidden');
  btn.classList.toggle('active');
}

function getManualOverrides() {
  return {
    authors: q('#authorInput').value.trim(),
    title: q('#titleInput').value.trim(),
    year: q('#yearInput').value.trim(),
    site: q('#publisherInput').value.trim(),
    url: q('#urlInput').value.trim(),
  };
}

function mergeData(meta, manual) {
  const out = { ...meta };
  Object.entries(manual).forEach(([k, v]) => { if (v) out[k] = v; });
  return out;
}

async function onGenerate() {
  q('#loadingDiv').classList.remove('hidden');
  q('#resultDiv').classList.add('hidden');

  const meta = await getPageMetadata();
  setPageInfoUI(meta);

  const manual = getManualOverrides();
  const data = mergeData(meta, manual);
  const formatKey = getActiveFormatKey();
  const reference = buildReference(data, formatKey);

  q('#referenceOutput').textContent = reference;
  q('#resultDiv').classList.remove('hidden');
  q('#loadingDiv').classList.add('hidden');

  // Salva dados para exportação
  window._lastGeneratedData = data;

  saveHistory({
    format: FORMATS[formatKey].name,
    text: reference,
    date: new Date().toLocaleString()
  });
}

function onCopy() {
  const text = q('#referenceOutput').textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const n = q('#copyNotification');
    n.classList.remove('hidden');
    setTimeout(() => n.classList.add('hidden'), 1200);
  });
}

function onDownload() {
  const text = q('#referenceOutput').textContent;
  if (!text) return;
  downloadFile(text, 'referencia.txt', 'text/plain;charset=utf-8');
}

function onExportBibTeX() {
  if (!window._lastGeneratedData) return;
  const exported = exportReference(window._lastGeneratedData, 'bibtex');
  if (exported) {
    downloadFile(exported.content, `referencia.${exported.extension}`, 'text/plain;charset=utf-8');
  }
}

function onExportRIS() {
  if (!window._lastGeneratedData) return;
  const exported = exportReference(window._lastGeneratedData, 'ris');
  if (exported) {
    downloadFile(exported.content, `referencia.${exported.extension}`, 'text/plain;charset=utf-8');
  }
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
  chrome.storage.local.set({ history: [] });
  renderHistory([]);
}

// Eventos de UI
window.addEventListener('DOMContentLoaded', async () => {
  // Metadados iniciais
  const meta = await getPageMetadata();
  setPageInfoUI(meta);

  // Botões principais
  q('#toggleManual').addEventListener('click', toggleManualForm);
  q('#generateBtn').addEventListener('click', onGenerate);
  q('#copyBtn').addEventListener('click', onCopy);
  q('#downloadBtn').addEventListener('click', onDownload);
  q('#clearHistoryBtn').addEventListener('click', onClearHistory);

  // Botões de exportação (se existirem)
  const bibBtn = q('#exportBibTeXBtn');
  const risBtn = q('#exportRISBtn');
  if (bibBtn) bibBtn.addEventListener('click', onExportBibTeX);
  if (risBtn) risBtn.addEventListener('click', onExportRIS);

  // Alternância de formato
  qa('.format-btn').forEach(btn => btn.addEventListener('click', () => setActiveFormat(btn)));

  // Histórico inicial
  chrome.storage.local.get(['history']).then(({ history = [] }) => renderHistory(history));
});