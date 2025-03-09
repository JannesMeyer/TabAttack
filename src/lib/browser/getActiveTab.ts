import { throwError } from '../throwError';

/** Get active tab in the last focused window  */
export async function getActiveTab() {
	let t = await chrome.tabs.query({ lastFocusedWindow: true, active: true });
	return t[0] ?? throwError();
}
