import '@testing-library/jest-dom/vitest';

// Mock chrome.runtime API
const chromeMock = {
  runtime: {
    sendMessage: vi.fn((_msg: unknown, callback?: (response: unknown) => void) => {
      if (callback) callback({ payload: {} });
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
};

Object.defineProperty(globalThis, 'chrome', { value: chromeMock, writable: true });

// Mock crypto.randomUUID
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => Math.random().toString(36).slice(2),
    },
    writable: true,
  });
}
