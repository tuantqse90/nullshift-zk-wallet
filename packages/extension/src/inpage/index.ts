// ============================================================
// NullShift — Inpage Provider Script
// ============================================================
// Injected into the page's main world via content script.
// Exposes window.nullshift — an EIP-1193 compatible provider
// with NullShift privacy extensions.
//
// SECURITY: This script runs in the page context.
// It has NO access to chrome.* APIs.
// All communication goes through window.postMessage -> content script.
// ============================================================

export const NULLSHIFT_SOURCE = 'nullshift-inpage';
export const CONTENT_SOURCE = 'nullshift-content';

type EventHandler = (...args: unknown[]) => void;

/** Pending requests waiting for response from background */
const pendingRequests = new Map<
  string,
  { resolve: (value: unknown) => void; reject: (error: Error) => void }
>();

/** Event listeners */
const eventListeners = new Map<string, Set<EventHandler>>();

/** Generate unique request ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Send request to content script and wait for response */
function sendRequest(method: string, params?: unknown[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = generateId();
    pendingRequests.set(id, { resolve, reject });

    window.postMessage(
      {
        source: NULLSHIFT_SOURCE,
        id,
        payload: { method, params },
      },
      window.location.origin,
    );

    // Timeout after 60s (proof generation can take a while)
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Request timed out'));
      }
    }, 60_000);
  });
}

/** Listen for responses from content script */
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== CONTENT_SOURCE) return;

  const { id, payload, error, type } = event.data;

  // Handle pending request response
  if (id && pendingRequests.has(id)) {
    const pending = pendingRequests.get(id)!;
    pendingRequests.delete(id);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(payload);
    }
    return;
  }

  // Handle wallet events
  if (type === 'WALLET_EVENT' && payload) {
    const handlers = eventListeners.get(payload.event);
    if (handlers) {
      handlers.forEach((handler) => handler(...(payload.args || [])));
    }
  }
});

// ── NullShift Provider ──────────────────────────────────

const nullshiftProvider = {
  /** EIP-1193: Make a request */
  request(args: { method: string; params?: unknown[] }): Promise<unknown> {
    return sendRequest(args.method, args.params);
  },

  /** Subscribe to events */
  on(event: string, handler: EventHandler): void {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(handler);
  },

  /** Unsubscribe from events */
  removeListener(event: string, handler: EventHandler): void {
    eventListeners.get(event)?.delete(handler);
  },

  /** NullShift identity flags */
  isNullShift: true,
  isMetaMask: false, // Don't impersonate MetaMask
};

// ── Expose on window ────────────────────────────────────

Object.defineProperty(window, 'nullshift', {
  value: nullshiftProvider,
  writable: false,
  configurable: false,
});

// ── EIP-6963: Provider Discovery ────────────────────────

window.addEventListener('eip6963:requestProvider', () => {
  window.dispatchEvent(
    new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze({
        info: {
          uuid: 'nullshift-wallet-v1',
          name: 'NullShift Wallet',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="%230a0a0a" width="32" height="32" rx="6"/><text x="16" y="21" text-anchor="middle" fill="%2300ff41" font-size="14" font-family="monospace">N</text></svg>',
          rdns: 'sh.nullshift.wallet',
        },
        provider: nullshiftProvider,
      }),
    }),
  );
});

// Announce on load as well
window.dispatchEvent(
  new CustomEvent('eip6963:announceProvider', {
    detail: Object.freeze({
      info: {
        uuid: 'nullshift-wallet-v1',
        name: 'NullShift Wallet',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="%230a0a0a" width="32" height="32" rx="6"/><text x="16" y="21" text-anchor="middle" fill="%2300ff41" font-size="14" font-family="monospace">N</text></svg>',
        rdns: 'sh.nullshift.wallet',
      },
      provider: nullshiftProvider,
    }),
  }),
);
