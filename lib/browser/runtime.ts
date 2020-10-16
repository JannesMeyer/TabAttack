export const baseUrl = browser.runtime.getURL('');
export const isFirefox = baseUrl.startsWith('moz-extension://');
