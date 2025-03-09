import getString from './browser/getString';
import { throwError } from './throwError';

interface MenuProps extends Omit<Parameters<typeof chrome.contextMenus.create>[0], 'title' | 'onclick'> {
	id: 'copy_page' | 'copy_link' | 'export_current_window';
}

/**
 * A context menu item can appear in various places in the browser.
 * The class is necessary so it can be shown and hidden without the need to
 * re-specify the configuration again.
 *
 * Documentation:
 * https://developer.chrome.com/extensions/contextMenus
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus
 */
export default class ContextMenuItem {
	readonly id;

	/**
	 * Registers a context menu item
	 */
	constructor(props: MenuProps, onClick: (tab: chrome.tabs.Tab, info: chrome.contextMenus.OnClickData) => void) {
		this.id = props.id;
		chrome.contextMenus.create({
			title: getString(`context_menu_${props.id}` as const),
			...props,
		});
		chrome.contextMenus.onClicked.addListener((info, tab = throwError()) => {
			if (info.menuItemId === this.id) {
				onClick(tab, info);
			}
		});
	}

	setVisible(visible: boolean) {
		return chrome.contextMenus.update(this.id, { visible });
	}
}
