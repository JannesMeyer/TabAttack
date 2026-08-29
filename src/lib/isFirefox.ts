const extensionUrl = chrome.runtime.getURL('');
export const isFirefox = extensionUrl.startsWith('moz-extension://');
export const isSafari = extensionUrl.startsWith('safari-web-extension://');
