// ============================================================
// NullShift — Content Script
// ============================================================
// Injected into every web page. Responsibilities:
// 1. Inject inpage.js into the page's main world
// 2. Relay messages between inpage <-> background
// 3. Validate message origins
// ============================================================

export const NULLSHIFT_SOURCE = 'nullshift-inpage';
export const CONTENT_SOURCE = 'nullshift-content';

// ── Inject inpage script into main world ────────────────
function injectInpageScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inpage.js');
  script.type = 'module';
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();
}

injectInpageScript();

// ── Message relay: inpage -> background ─────────────────
window.addEventListener('message', (event) => {
  // Only accept messages from this window
  if (event.source !== window) return;

  // Only accept messages from our inpage script
  if (event.data?.source !== NULLSHIFT_SOURCE) return;

  // Validate dApp request payload shape
  const dAppPayload = event.data.payload;
  if (!dAppPayload || typeof dAppPayload.method !== 'string') return;

  // Forward to background service worker
  chrome.runtime.sendMessage(
    {
      type: 'DAPP_REQUEST',
      payload: dAppPayload,
      id: event.data.id,
      source: 'content',
      timestamp: Date.now(),
    },
    (response) => {
      // Relay response back to inpage (same-origin postMessage)
      window.postMessage(
        {
          source: CONTENT_SOURCE,
          id: event.data.id,
          payload: response?.payload,
          error: response?.error,
        },
        window.location.origin,
      );
    },
  );
});

// ── Message relay: background -> inpage ─────────────────
chrome.runtime.onMessage.addListener((message, _sender) => {
  if (message.type === 'DAPP_RESPONSE' || message.type === 'WALLET_EVENT') {
    window.postMessage(
      {
        source: CONTENT_SOURCE,
        type: message.type,
        payload: message.payload,
      },
      window.location.origin,
    );
  }
});
