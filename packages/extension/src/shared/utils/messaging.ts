// ============================================================
// NullShift — Extension Messaging Utils
// ============================================================
// Type-safe message passing between extension contexts.
// ============================================================

import type { Message, MessageType, PayloadMap, ResponseMap, MessageSource } from '@nullshift/common';
import { createMessage } from '@nullshift/common';

/** Send a message to the background service worker and wait for response */
export async function sendToBackground<T extends MessageType>(
  type: T,
  payload: PayloadMap[T],
  source: MessageSource,
): Promise<ResponseMap[T]> {
  const message = createMessage(type, payload, source);
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response?.payload);
    });
  });
}

/** Listen for messages from background */
export function onMessage(
  handler: (message: Message, sender: chrome.runtime.MessageSender) => void,
): void {
  chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
    handler(message as Message, sender);
  });
}
