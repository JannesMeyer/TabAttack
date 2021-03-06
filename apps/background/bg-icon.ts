import loadFont from '../../lib/dom/loadFont.js';
import syncPrefs from '../syncPrefs.js';
import Icon from './Icon.js';
import prefersDark from '../../lib/prefersDark.js';
import TabCounter from './TabCounter.js';

/** Icon renderer */
const icon = new Icon(devicePixelRatio);

/** Observes changes in the number of tabs per window */
const tabCounter = new TabCounter();

const sPrefs = syncPrefs.getWithUpdates('iconColor', 'iconColorDarkMode');

// Load fonts
Promise.all([
	sPrefs.promise,
	tabCounter.attach(),
	loadFont('Roboto', '/fonts/Roboto-Bold.woff2'),
	loadFont('Roboto Condensed', '/fonts/Roboto-Condensed-Bold.woff2'),
]).then(() => {
	tabCounter.listeners.add(updateIcon);
	prefersDark.addEventListener('change', () => updateIcon());
	sPrefs.onUpdate(() => updateIcon());

	// Initial render
	return updateIcon();
});

// TODO: incognito windows should always use dark text color (in Chromium)
/**
 * Update browser action with the current tab count
 */
async function updateIcon(onlyWindowId?: number) {
	let scales = getScales();

	icon.textColor = sPrefs.obj.iconColor;
	icon.textColorDark = sPrefs.obj.iconColorDarkMode;

	// Single window
	if (onlyWindowId != null) {
		let tabs = tabCounter.windows.getOrThrow(onlyWindowId);
		let icons = drawIcons(tabs.size, scales);
		await setIcon(onlyWindowId, tabs, icons);
		return;
	}

	// Many windows
	for (let [windowId, tabs] of tabCounter.windows) {
		let icons = drawIcons(tabs.size, scales);
		setIcon(windowId, tabs, icons);
	}
}

// TODO: We can use the global browserAction icon if there is only one window
// TODO: cache last 20 renderings in memory
// TODO: pre-render +1 and -1
async function setIcon(windowId: number, tabs: Iterable<number>, imageData: Record<number, ImageData>) {
	try {
		// Firefox is currently the only browser that supports `windowId`
		// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/setIcon#Browser_compatibility
		await browser.browserAction.setIcon({ windowId, imageData });

	} catch {
		// Install tab update handler that sets the icon whenever a navigation occurs
		if (!browser.tabs.onUpdated.hasListener(handleTabUpdate)) {
			browser.tabs.onUpdated.addListener(handleTabUpdate);
		}

		// Set icon for each tab of the window
		await Promise.all(Array.from(tabs, tabId => browser.browserAction.setIcon({ tabId, imageData })));
	}
}

function drawIcons(n: number, scales: number[]) {
	let icons: Record<number, ImageData> = {};

	for (let scale of scales) {
		icon.setScale(scale);
		icons[icon.canvas.width] = icon.render(n).imageData;
	}
	return icons;
}

/**
 * Sets the icon whenever a tab starts loading, because the tab-specific icon
 * is cleared on navigation.
 */
function handleTabUpdate(tabId: number, { status }: { status?: string }) {
	if (status !== 'loading') {
		return;
	}
	let tabs = tabCounter.getSiblings(tabId);
	let imageData = drawIcons(tabs.size, getScales());
	browser.browserAction.setIcon({ tabId, imageData });
}

/** Scale factors to render */
function getScales() {
	return (devicePixelRatio > 1 ? [devicePixelRatio] : [1, 2]);
}
