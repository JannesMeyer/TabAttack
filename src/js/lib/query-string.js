/**
 * Parse the query part of an URL
 *
 * Taken from URI.js (MIT, GPLv3)
 * https://github.com/medialize/URI.js/blob/gh-pages/src/URI.js
 */
export function parseQuery(string) {
	if (!string) {
		return {};
	}

	// throw out the funky business - "?"[name"="value"&"]+
	string = string.replace(/&+/g, '&').replace(/^\?*&*|&+$/g, '');

	if (!string) {
		return {};
	}

	var items = {};
	var splits = string.split('&');
	var length = splits.length;
	var v, name, value;

	for (var i = 0; i < length; i++) {
		v = splits[i].split('=');
		name = decodeURIComponent(v.shift());
		// no "=" is null according to http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html#collect-url-parameters
		value = v.length ? decodeURIComponent(v.join('=')) : null;

		if (items[name]) {
			if (typeof items[name] === "string") {
				items[name] = [items[name]];
			}
			items[name].push(value);
		} else {
			items[name] = value;
		}
	}

	return items;
}

/**
 * Builds a query string.
 */
export function buildQuery(obj) {
	return Object.keys(obj).map(k => k + '=' + encodeURIComponent(obj[k])).join('&');
}