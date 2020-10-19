import loadFont from '../fonts/loadFont.js';
import prefs from '../preferences.js';
import Icon from './Icon.js';
import assertDefined from '../lib/assertDefined.js';
import prefersDark from '../lib/prefersDark.js';

/** Icon renderer */
const icon = new Icon(devicePixelRatio);

/** Icon text color (normal mode) */
let iconColor: string | undefined;

/** Icon text color (dark mode) */
let iconColorDarkMode: string | undefined;

// Load fonts
Promise.all([
	updatePrefs(),
	loadFont('Roboto', '/fonts/Roboto-Bold.woff2'),
	loadFont('Roboto Condensed', '/fonts/Roboto-Condensed-Bold.woff2'),
]).then(() => {
	browser.tabs.onCreated.addListener(updateIcon);
	browser.tabs.onRemoved.addListener(updateIcon);
	prefersDark.addEventListener('change', updateIcon);
	prefs.onChange(() => updatePrefs().then(updateIcon));

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
async function updateIcon() {
	let windows = await browser.windows.getAll({ windowTypes: ['normal'], populate: true });
	for (let w of windows) {
		let tabs = assertDefined(w.tabs);
		
		// Determine scale factors to render
		let scales = [1, 2];
		if (!scales.includes(devicePixelRatio)) {
			scales = [devicePixelRatio];
		}

		// Update color
		icon.textColor = assertDefined(prefersDark.matches ? iconColorDarkMode : iconColor);

		// TODO: cache last 20 renderings in memory
		// TODO: pre-render +1 and -1
		// Render each scale factor
		let imageData: Record<number, ImageData> = {};
		for (let scale of scales) {
			icon.setScale(scale);
			imageData[icon.canvas.width] = icon.render(tabs.length).imageData;
		}
		try {
			await browser.browserAction.setIcon({ windowId: w.id, imageData });
		} catch {
			// `windowId` not supported
			await Promise.all(tabs.map(t => browser.browserAction.setIcon({ tabId: t.id, imageData })));
		}
	}
}
