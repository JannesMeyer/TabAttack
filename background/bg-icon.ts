import loadFont from '../fonts/loadFont.js';
import logError from '../lib/logError.js';
import prefs from '../preferences.js';
import Icon from './Icon.js';
import * as TabService from '../lib/tabs.js';

var icon: Icon | undefined;
var prefersDark = matchMedia('(prefers-color-scheme: dark)');
prefersDark.addEventListener('change', updateIconColor);
prefs.onChange(updateIconColor);

async function updateIconColor() {
	if (icon == null) {
		return;
	}
	let p = await prefs.get('iconColor', 'iconColorDarkMode');
	let color = (prefersDark.matches ? p.iconColorDarkMode : p.iconColor);
	if (icon.textColor === color) {
		return;
	}
	icon.textColor = color;
	updateIcon();
}

browser.tabs.onCreated.addListener(updateIcon);
browser.tabs.onRemoved.addListener(updateIcon);
Promise.all([
	prefs.get('iconColor', 'iconColorDarkMode'),
	loadFont('Roboto', '/fonts/Roboto-Bold.woff2'),
	loadFont('Roboto Condensed', '/fonts/Roboto-Condensed-Bold.woff2'),
]).then(([p]) => {
	icon = new Icon(devicePixelRatio);
	icon.textColor = (prefersDark.matches ? p.iconColorDarkMode : p.iconColor);
	return updateIcon();
}).catch(logError);

/**
 * Update browser action with the current tab count
 */
function updateIcon() {
	return TabService.count().then(x => {
		if (icon == null) {
			return;
		}
		// Determine scale factors to render
		let scales = [1, 2];
		if (!scales.includes(devicePixelRatio)) {
			scales = [devicePixelRatio];
		}

		// TODO: support dark mode
		// TODO: cache last 20 renderings in memory
		// TODO: pre-render +1 and -1
		// Render each scale factor
		let imageData: Record<number, ImageData> = {};
		for (let scale of scales) {
			icon.setScale(scale);
			imageData[icon.getSize()] = icon.render(x).imageData;
		}
		
		return browser.browserAction.setIcon({ imageData });
	}).catch(logError);
}
