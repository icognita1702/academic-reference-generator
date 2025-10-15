// Background da extensão: coleta segura de metadados
// Sem rede/downloads. Apenas título/URL/seleção da aba ativa.

chrome.runtime.onInstalled.addListener(() => {
  console.log('[ARG] Instalada');
});

// Verifica se a aba é elegível para scripting (bloqueia chrome://, edge://, comet://, etc.)
function isEligibleTab(tab) {
  try {
    if (!tab?.url) return false;
    const u = new URL(tab.url);
    const blocked = ['chrome:', 'edge:', 'about:', 'moz-extension:', 'chrome-extension:', 'comet:'];
    return !blocked.includes(u.protocol);
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'GET_PAGE_METADATA_SAFE') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return sendResponse({ ok: false, reason: 'NO_TAB' });

        const eligible = isEligibleTab(tab);
        if (!eligible) {
          // Fallback mínimo: só título do tab e URL se disponível
          return sendResponse({ ok: true, data: {
            title: tab.title || 'Sem título',
            url: '',
            selection: ''
          }, eligible: false });
        }

        const [{ result } = {}] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            title: String(document.title || ''),
            url: String(location.href || ''),
            selection: String(window.getSelection()?.toString() || '')
          })
        });

        sendResponse({ ok: true, data: result || {}, eligible: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }
});
