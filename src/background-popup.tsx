import { BrowserAction } from './types';

chrome.action.setPopup({ popup: chrome.runtime.getURL('newtab.html') + `?t=${BrowserAction.Dropdown}` });
// chrome.contextMenus.create({ contexts: ['action'], id: 'Bla' });
