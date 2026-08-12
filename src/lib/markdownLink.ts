/**
 * Create markdown link with proper escaping
 */
export default function markdownLink(title: string | undefined, url: string): string {
	title ||= 'Untitled';

	// Escape []*`_\ and < in the title
	title = title.replace(/[[\]*`_\\]/gu, char => '\\' + char).replace(/</gu, '&lt;');

	// Escape closing parenthesis
	url = url.replace(/\)/gu, '%29');

	return '[' + title + '](' + url + ')';
}
