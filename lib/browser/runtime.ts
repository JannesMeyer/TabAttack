export const baseUrl = browser.runtime.getURL('');
export const isFirefox = baseUrl.startsWith('moz-extension://');
export const isChromeLike = baseUrl.startsWith('chrome-extension://');