import { getString } from "../Services/StringService";

interface ICreateProperties {
  id: string;
  icons?: {
      [key: number]: string;
  };
  title?: string;
  checked?: boolean;
  contexts?: browser.contextMenus.ContextType[];
  onclick?: (info: browser.menusInternal.OnClickData, tab: browser.tabs.Tab) => void;
  parentId?: number | string;
  documentUrlPatterns?: string[];
  targetUrlPatterns?: string[];
  enabled?: boolean;
  command?: string;
}

/**
 * A context menu item can appear in various places in the browser.
 * The class is necessary so it can be shown and hidden without the need to 
 * re-specify the configuration again.
 * 
 * Documentation:
 * https://developer.chrome.com/extensions/contextMenus#toc
 */
export default class ContextMenuItem {

  props: ICreateProperties;

  /**
   * Instantiate a context menu item (but don't show it yet)
   */
  constructor(props: ICreateProperties) {
    this.props = Object.assign({
      title: getString('context_menu_' + props.id),
    }, props);
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
    browser.contextMenus.remove(this.props.id);
  }

}