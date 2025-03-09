/** Open the tab editor in a new tab */
export async function openTabsEditor(params: { tab?: number; window?: number; import?: boolean } = {}) {
	let url = chrome.runtime.getURL('export.html') + new URLSearchParams(params as any);
	let tab = await chrome.tabs.create({ url, openerTabId: params.tab });
	if (tab.windowId != null) {
		await chrome.windows.update(tab.windowId, { focused: true });
	}
	return tab;
}
