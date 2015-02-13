var callback;

/**
 * Opens a popup. There should only be one at a time.
 */
export function showPopup({ url, width, height, parent }, fn) {
	callback = fn;
	var left = Math.round(parent.left + (parent.width - width) / 2);
	var top = Math.round(parent.top + (parent.height - height) / 3);
	Chrome.createWindow({ type: 'popup', url, width, height, left, top });
}

/*
 * Handle response
 */
Chrome.onMessage('popup_close', message => {
	callback(message);
	callback = undefined;
});