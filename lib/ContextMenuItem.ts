import getString from './browser/getString.js';

type MenuProps = Parameters<(typeof browser.contextMenus.create)>[0];

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

	readonly id: string | number;

	/**
	 * Registers a context menu item
	 */
	constructor(props: MenuProps) {
		let createProps = {
			title: (props.id != null ? getString('context_menu_' + props.id as any) : undefined),
			...props,
		};
		this.id = browser.contextMenus.create(createProps);
	}

	setVisible(visible: boolean) {
		return browser.contextMenus.update(this.id, { visible });
	}

}

// For event pages:
// browser.contextMenus.onClicked.addListener((info, tab) => {
// 	console.log(info, tab);
// })
