// Background da extensão: manipula contexto e regras de geração
// Observação: este arquivo NÃO coleta dados sensíveis, NÃO envia rede e NÃO executa downloads.
// Ele apenas atende a mensagens do popup para ler metadados básicos da aba ativa.

chrome.runtime.onInstalled.addListener(() => {
  console.log('[ARG] Extensão instalada');
});

// Usa declarativeNetRequest? Não. Sem rede. Sem alarms. Sem downloads. Somente scripting controlado.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'GET_PAGE_METADATA') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return sendResponse({ ok: false, error: 'NO_ACTIVE_TAB' });

        // Executa script de leitura segura (somente título/URL/seleção de texto)
        const [{ result } = {}] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            title: String(document.title || ''),
            url: String(location.href || ''),
            selection: String(window.getSelection()?.toString() || '')
          })
        });

        sendResponse({ ok: true, data: result || {} });
      } catch (e) {
        console.error('[ARG] metadata error', e);
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true; // mantém canal assíncrono aberto
  }
});
