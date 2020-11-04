/**
 * Gets active tab in the last focused window.
 */
export default async function getActiveTab() {
	let t = await browser.tabs.query({ lastFocusedWindow: true, active: true });
	return t.single();
}
