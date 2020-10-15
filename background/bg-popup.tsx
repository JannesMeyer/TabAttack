import logError from '../lib/logError.js';
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

/** Opens popup or switches back to previous window */
async function openPopup(tab: browser.tabs.Tab) {
	if (popupId == null) {
		// First open
		popupId = (await showPopup()).id;
		
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
			popupId = (await showPopup()).id;
		}
	}
}

async function showPopup() {
	let { popupWindow } = await browser.storage.local.get({
		popupWindow: { width: 300, height: 600 },
	});
	return browser.windows.create({
		...popupWindow,
		type: 'popup',
		url: browser.runtime.getURL('popup.html'),
	});
}
