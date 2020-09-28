import getString from './browser/getString.js';
import assertDefined from './assertDefined.js';

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

  readonly id: string;
  props: MenuProps;

  /**
   * Instantiate a context menu item (but don't show it yet)
   */
  constructor(props: MenuProps) {
    this.id = assertDefined(props.id);
    this.props = {
      title: getString('context_menu_' + this.id),
      ...props,
    };
  }

  setVisible(visible: boolean) {
    if (visible) {
      this.show();
    } else {
      this.hide();
    }
  }

  show() {
    browser.contextMenus.create(this.props);
  }

  hide() {
    browser.contextMenus.remove(this.id);
  }

}