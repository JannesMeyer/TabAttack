/**
 * Parse the query part of an URL
 *
 * Taken from URI.js (MIT, GPLv3)
 * https://github.com/medialize/URI.js/blob/gh-pages/src/URI.js
 */
export function parseQuery(string: string): { [key: string]: string } {
	if (!string) {
		return {};
	}

	// throw out the funky business - "?"[name"="value"&"]+
	string = string.replace(/&+/g, '&').replace(/^\?*&*|&+$/g, '');

	if (!string) {
		return {};
	}

	var items: any = {};
	var splits = string.split('&');
	var length = splits.length;
	var v: string[];
	var name;
	var value;

	for (var i = 0; i < length; i++) {
		v = splits[i].split('=');
		name = decodeURIComponent(v.shift() as string);
		// no "=" is null according to https://url.spec.whatwg.org/#concept-url-query
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
export function buildQuery(obj: { [k: string]: string | number | null }) {
	return '?' + Object.keys(obj).map(k => k + '=' + encodeURIComponent(String(obj[k]))).join('&');
}