import onCommand from '../../lib/browser/onCommand.js';
import logError from '../../lib/logError.js';
import assertDefined from '../../lib/assertDefined.js';
import localPrefs from '../localPrefs.js';
import getActiveTab from '../../lib/browser/getActiveTab.js';
import UrlQuery from '../../lib/dom/UrlQuery.js';
import PopupType from '../popup/PopupType.js';
import syncPrefs from '../syncPrefs.js';
import openTabsEditor from './openTabsEditor.js';
import sendMessage from '../../lib/browser/sendMessage.js';

let pp = syncPrefs.getWithUpdates('browserAction');
pp.promise.then(() => {
	if (pp.obj.browserAction === PopupType.ActionPopup) {
		// Enable
		browser.browserAction.setPopup({ popup: 'popup.html?t=' + PopupType.ActionPopup });		
	}
});
pp.onUpdate(({ browserAction }) => {
	if (browserAction == null) {
		return;
	}
	let { oldValue, newValue } = browserAction;
	if (newValue === PopupType.ActionPopup && oldValue !== PopupType.ActionPopup) {
		// Enable
		browser.browserAction.setPopup({ popup: 'popup.html?t=' + PopupType.ActionPopup });
	}
	if (newValue !== PopupType.ActionPopup && oldValue === PopupType.ActionPopup) {
		// Disable
		browser.browserAction.setPopup({ popup: null });
	}
});

browser.browserAction.onClicked.addListener((tab, info) => {
	let { browserAction } = pp.obj;
	if (browserAction === PopupType.ExternalPopup || info?.button === 1 || info?.modifiers.includes('Shift')) {
		openExternalPopup(tab).catch(logError);

	} else if (browserAction === PopupType.Sidebar) {
		browser.sidebarAction.toggle();

	} else if (browserAction === PopupType.DirectExport) {
		openTabsEditor({ tab: tab.id, window: tab.windowId });
	}
});


/** Window ID of the TabAttack popup window */
let popupId: number | undefined;

onCommand('open_tab_list', () => getActiveTab().then(openExternalPopup).catch(logError));

/** Opens popup or switches back to previous window */
async function openExternalPopup(tab: browser.tabs.Tab) {
	if (popupId == null) {
		// First open
		popupId = await showPopup(tab);
		
	} else if (popupId === tab.windowId) {
		// Popup already focused, switch back to previous window
		await sendMessage('focusPreviousWindow');

	} else {
		// Existing
		try {
			await browser.windows.update(popupId, { focused: true });
			// await sendMessage('selectTab', { id: tab.id }).catch(logError);

		} catch (e) {
			popupId = undefined;
			popupId = await showPopup(tab);
		}
	}
}

async function showPopup(opener: browser.tabs.Tab) {
	let { popupWindow } = await localPrefs.get('popupWindow');
	let w = await browser.windows.create({
		...popupWindow,
		type: 'popup',
		url: browser.runtime.getURL('popup.html') + new UrlQuery({ t: PopupType.ExternalPopup, opener: opener.windowId }),
	});
	let id = assertDefined(w.id);
	// Some browsers ignore the top and left coordinates
	// https://bugzilla.mozilla.org/show_bug.cgi?id=1271047
	browser.windows.update(id, popupWindow);
	return id;
}
