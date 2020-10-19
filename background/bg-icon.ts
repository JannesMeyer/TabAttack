import loadFont from '../fonts/loadFont.js';
import prefs from '../preferences.js';
import Icon from './Icon.js';
import assertDefined from '../lib/assertDefined.js';
import prefersDark from '../lib/prefersDark.js';
import TabCounter from './TabCounter.js';

/** Icon renderer */
const icon = new Icon(devicePixelRatio);

/** Observes changes in the number of tabs per window */
const tabCounter = new TabCounter();

/** Icon text color (normal mode) */
let iconColor: string | undefined;

/** Icon text color (dark mode) */
let iconColorDarkMode: string | undefined;

// Load fonts
Promise.all([
	updatePrefs(),
	tabCounter.attach(),
	loadFont('Roboto', '/fonts/Roboto-Bold.woff2'),
	loadFont('Roboto Condensed', '/fonts/Roboto-Condensed-Bold.woff2'),
]).then(() => {
	tabCounter.listeners.add(updateIcon);
	prefersDark.addEventListener('change', () => updateIcon());
	prefs.onChange(() => updatePrefs().then(() => updateIcon()));

	// Initial render
	return updateIcon();
});

/** Updates the values of the preferences */
async function updatePrefs() {
	let p = await prefs.get('iconColor', 'iconColorDarkMode');
	iconColor = p.iconColor;
	iconColorDarkMode = p.iconColorDarkMode;
}

/**
 * Update browser action with the current tab count
 */
async function updateIcon(windowId?: number) {
	/** Scale factors to render */
	const scales = (devicePixelRatio > 1 ? [devicePixelRatio] : [1, 2]);

	// Update color
	icon.textColor = assertDefined(prefersDark.matches ? iconColorDarkMode : iconColor);

	// Single window
	if (windowId != null) {
		await updateWindowIcon(windowId, Array.from(tabCounter.getWindow(windowId)), scales);
		return;
	}

	// Many windows
	for (let [windowId, tabs] of tabCounter.getWindows()) {
		await updateWindowIcon(windowId, Array.from(tabs), scales);
	}
}

// TODO: cache last 20 renderings in memory
// TODO: pre-render +1 and -1
async function updateWindowIcon(windowId: number, tabs: Array<number>, scales: number[]) {
	let imageData: Record<number, ImageData> = {};
	for (let scale of scales) {
		icon.setScale(scale);
		imageData[icon.canvas.width] = icon.render(tabs.length).imageData;
	}
	try {
		await browser.browserAction.setIcon({ windowId, imageData });
	} catch {
		// windowId is not supported
		await Promise.all(tabs.map(tabId => browser.browserAction.setIcon({ tabId, imageData })));
	}
}
