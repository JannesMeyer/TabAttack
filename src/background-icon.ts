import { TabCounter } from './background/TabCounter';
import { ThemeWatch } from './common/helpers/ThemeWatch';
import Icon from './icons/icon';

const icon = new Icon(devicePixelRatio * 2);
const tabCounter = new TabCounter();
const theme = new ThemeWatch();

tabCounter.listeners.add(updateIcon);
theme.listeners.add(updateIcon);

function updateIcon() {
	icon.textColor = theme.toolbar_text;
	for (const [windowId, tabs] of tabCounter.windows) {
		const icons: Record<number, ImageData> = {};
		icons[icon.canvas.width] = icon.render(tabs.size.toString()).getImageData();
		setIcon(windowId, tabs, icons);
	}
}

async function setIcon(windowId: number, tabIds: Iterable<number>, imageData: Record<number, ImageData>) {
	try {
		await browser.action.setIcon({ windowId, imageData });
	} catch {
		// TODO: We can use the global browserAction icon if there is only one window
		await Promise.all(Array.from(tabIds, tabId => chrome.action.setIcon({ tabId, imageData })));
	}
}
