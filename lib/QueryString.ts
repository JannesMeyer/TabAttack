/**
 * Builds a query string.
 */
export function buildQuery(obj: { [k: string]: string | number | null }) {
	return '?' + Object.keys(obj).map(k => k + '=' + encodeURIComponent(String(obj[k]))).join('&');
}