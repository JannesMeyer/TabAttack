var deferred;

/**
 * Open a popup. There should only be one at a time.
 */
export function showPopup({ url, width, height, parent }) {
	deferred = Promise.defer();
	var left = Math.round(parent.left + (parent.width - width) / 2);
	var top = Math.round(parent.top + (parent.height - height) / 3);
	Chrome.createWindow({ type: 'popup', url, width, height, left, top });
	return deferred.promise;
}

Chrome.onMessage('popup_close', message => deferred.reject(message));
Chrome.onMessage('popup_return', message => deferred.resolve(message));

