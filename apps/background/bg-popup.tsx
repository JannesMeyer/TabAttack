import onCommand from '../../lib/browser/onCommand.js';
import logError from '../../lib/logError.js';
import assertDefined from '../../lib/assertDefined.js';
import localPrefs from '../localPrefs.js';
import FocusOrder from './FocusOrder.js';
import getActiveTab from '../../lib/browser/getActiveTab.js';
import UrlQuery from '../../lib/dom/UrlQuery.js';
import PopupType from '../popup/PopupType.js';

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

onCommand('open_tab_list', () => getActiveTab().then(openPopup).catch(logError));

/** Opens popup or switches back to previous window */
async function openPopup(tab: browser.tabs.Tab) {
	if (popupId == null) {
		// First open
		popupId = await showPopup(tab);
		
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
			popupId = await showPopup(tab);
		}
	}
}

async function showPopup(opener: browser.tabs.Tab) {
	let { popupWindow } = await localPrefs.get('popupWindow');
	let w = await browser.windows.create({
		...popupWindow,
		type: 'popup',
		url: browser.runtime.getURL('popup.html') + new UrlQuery({ t: PopupType.Popup, opener: opener.windowId }),
	});
	let id = assertDefined(w.id);
	// Some browsers ignore the top and left coordinates
	// https://bugzilla.mozilla.org/show_bug.cgi?id=1271047
	setTimeout(() => browser.windows.update(id, popupWindow));
	return id;
}
