import getString from './browser/getString.js';

interface MenuProps extends Omit<Parameters<typeof browser.contextMenus.create>[0], 'title'> {
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
	constructor(props: MenuProps) {
		this.id = props.id;
		browser.contextMenus.create({
			title: getString(`context_menu_${props.id}` as const),
			...props,
		});
	}

	setVisible(visible: boolean) {
		return browser.contextMenus.update(this.id, { visible });
	}
}
