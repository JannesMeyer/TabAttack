/**
 * Create markdown link with proper escaping
 */
export function markdownLink(title: string, url: string): string {
	if (title === '') {
		title = 'Untitled';
	}
	
	// Escape []*`_\ and < in the title
	title = title.replace(/[\[\]\*\`_\\]/g, char => '\\' + char).replace(/</g, '&lt;');
	
	// Escape closing parenthesis
	url = url.replace(/\)/g, '%29');
	
	return '[' + title + '](' + url + ')';
}