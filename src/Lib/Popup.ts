import { onMessage } from "./BrowserMessage";

interface IPopupArguments {
  url: string;
  params: string;
  width: number;
  height: number;
  parent: {
    width: number;
    height: number;
    left: number;
    top: number;
  }
}

/**
 * Opens a popup. Only one instance at a time is supported.
 */
export default class Popup {

  promise: Promise<any>;
  
  constructor({ url, params, width, height, parent }: IPopupArguments) {
    // Listen for the closing of the popup
    this.promise = new Promise((resolve, reject) => {
      onMessage('popup_close', data => {
        // remove listener
        onMessage('popup_close', null);
        resolve(data);
      });
    });

    browser.windows.create({
      type: browser.windows.CreateType.normal,
      url: browser.runtime.getURL(url) + (params || ''),
      left: Math.round(parent.left + (parent.width - width) / 2),
      top: Math.round(parent.top + (parent.height - height) / 3),
      width,
      height,
    });
  }

}