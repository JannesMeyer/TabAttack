export const baseUrl = chrome.runtime.getURL('');
export const isFirefox = baseUrl.startsWith('moz-extension://');
export const isChromium = baseUrl.startsWith('chrome-extension://');
