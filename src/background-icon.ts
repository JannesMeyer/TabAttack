import { TabCounter } from './background/TabCounter';
import { ThemeWatch } from './common/helpers/ThemeWatch';
import Icon from './icons/icon';
import loadFont from './lib/dom/loadFont';

const icon = new Icon(devicePixelRatio);
const tabCounter = new TabCounter();
const theme = new ThemeWatch();

Promise.all([
	loadFont('Roboto', '/fonts/Roboto-Bold.woff2'),
	loadFont('Roboto Condensed', '/fonts/Roboto-Condensed-Bold.woff2'),
]).then(() => updateIcon());
tabCounter.listeners.add(updateIcon);
theme.listeners.add(updateIcon);

function updateIcon() {
	icon.textColor = theme.toolbar_text;
	const scaleFactors = devicePixelRatio > 1 ? [devicePixelRatio] : [1, 2];
	for (const [windowId, tabs] of tabCounter.windows) {
		const text = tabs.size.toString();
		const icons: Record<number, ImageData> = {};
		for (let scale of scaleFactors) {
			icon.setScale(scale);
			icons[icon.canvas.width] = icon.render(text).getImageData();
		}
		setIcon(windowId, tabs, icons);
	}
}

// TODO: cache +5 and -5 in memory
async function setIcon(windowId: number, tabIds: Iterable<number>, imageData: Record<number, ImageData>) {
	try {
		await browser.action.setIcon({ windowId, imageData });
	} catch {
		// TODO: We can use the global browserAction icon if there is only one window
		await Promise.all(Array.from(tabIds, tabId => chrome.action.setIcon({ tabId, imageData })));
	}
}
