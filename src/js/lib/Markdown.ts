/**
 * Create markdown link with proper escaping
 */
export function markdownLink(title, url) {
	if (title === '') {
		title = 'Untitled';
	}
	
	// Escape []*`_\ and < in the title
	title = title.replace(/[\[\]\*\`_\\]/g, c => '\\' + c).replace(/</g, '&lt;');
	
	// Escape () in the URL
	url = url.replace(/[\(\)]/g, escape);
	
	return '[' + title + '](' + url + ')';
}