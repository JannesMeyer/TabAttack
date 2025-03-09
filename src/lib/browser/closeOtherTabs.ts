import { throwError } from '../throwError';

export default async function closeOtherTabs() {
	const [sourceTab, windows] = await Promise.all([
		chrome.tabs.getCurrent(),
		chrome.windows.getAll({ populate: true }),
	]);
	if (!sourceTab) {
		return;
	}
	// Identify the window that hosts the sourceTab
	let sourceWindow = windows.find(w => w.id === sourceTab.windowId) ?? throwError();
	// Close other windows
	for (let w of windows) {
		if (w === sourceWindow) continue;
		if (w.type === 'popup') continue;
		chrome.windows.remove(w.id ?? throwError());
	}
	// Close other tabs
	let tabIds = (sourceWindow.tabs ?? throwError()).map(t => t.id ?? throwError()).filter(id => id !== sourceTab.id);
	chrome.tabs.remove(tabIds);
}
