import onMessage from './browser/onMessage.js';

interface PopupProps {
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

	closed: Promise<any>;

	constructor({ url, params, width, height, parent }: PopupProps) {
		// Listen for the closing of the popup
		this.closed = new Promise(resolve => {
			onMessage('popup_close', data => {
				// remove listener
				onMessage('popup_close');
				resolve(data);
			});
		});

		browser.windows.create({
			type: 'normal',
			url: browser.runtime.getURL(url) + (params || ''),
			left: Math.round(parent.left + (parent.width - width) / 2),
			top: Math.round(parent.top + (parent.height - height) / 3),
			width,
			height,
		});
	}

}