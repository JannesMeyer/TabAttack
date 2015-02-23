/**
 * Create markdown link with proper escaping
 */
export function markdownLink(title, url) {
	if (title === '') {
		title = '(untitled link)';
	}
	// Escape special characters
	title = title.replace(/[\[\]\*\`_\\]/g, c => '\\' + c).replace(/</g, '&lt;');
	url = url.replace(/[\(\)]/g, escape);
	return '[' + title + '](' + url + ')';
}