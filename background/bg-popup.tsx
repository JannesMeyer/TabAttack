import onCommand from '../lib/browser/onCommand.js';
import logError from '../lib/logError.js';
import assertDefined from '../lib/assertDefined.js';
import PopupParams from '../popup/PopupParams.js';
import FocusOrder from './FocusOrder.js';

let focusOrder = new FocusOrder();

function goToLastFocused() {
	let id = focusOrder.getLast(popupId);
	if (id == null) {
		return;
	}
	browser.windows.update(id, { focused: true });
}

/** Window ID of the TabAttack popup window */
let popupId: number | undefined;
browser.browserAction.onClicked.addListener(tab => openPopup(tab).catch(logError));

onCommand('open_tab_list', () => getActiveTab().then(openPopup).catch(logError));

function getActiveTab() {
	return browser.tabs.query({ active: true, lastFocusedWindow: true }).then(tabs => tabs.single());
}

/** Opens popup or switches back to previous window */
async function openPopup(tab: browser.tabs.Tab) {
	if (popupId == null) {
		// First open
		popupId = await showPopup();
		
	} else if (popupId === tab.windowId) {
		// Popup already focused, switch back to previous window
		goToLastFocused();

	} else {
		// Existing
		try {
			await browser.windows.update(popupId, { focused: true });
			// await sendMessage('selectTab', { id: tab.id }).catch(logError);

		} catch (e) {
			popupId = undefined;
			popupId = await showPopup();
		}
	}
}

let defaultPopupWindow: PopupParams = {
	width: 300,
	height: 600,
	top: 0,
	left: 0,
};

async function showPopup() {
	let popupWindow: PopupParams = (await browser.storage.local.get({ popupWindow: defaultPopupWindow })).popupWindow;
	let w = await browser.windows.create({
		...popupWindow,
		type: 'popup',
		url: browser.runtime.getURL('popup.html'),
	});
	let id = assertDefined(w.id);
	// Some browsers ignore the top and left coordinates
	setTimeout(() => browser.windows.update(id, popupWindow));
	return id;
}
