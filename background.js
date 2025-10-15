// Background da extensão: manipula contexto e regras de geração
chrome.runtime.onInstalled.addListener(() => {
  console.log('[ARG] Extensão instalada');
});

// Mensageria simples entre popup e content
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_METADATA') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return sendResponse({ ok: false });

        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            title: document.title,
            url: location.href,
            selection: window.getSelection()?.toString() || ''
          })
        });
        const data = result?.[0]?.result || {};
        sendResponse({ ok: true, data });
      } catch (e) {
        console.error(e);
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true; // async
  }
});
