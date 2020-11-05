import markdownLink from './markdownLink.js';

export function escapesTitle() {
	expect(markdownLink('', 'https://example.com/?asd=\')')).toBe('[Untitled](https://example.com/?asd=\'%29)');
	expect(markdownLink('[]*`_\\<>', 'https://example.com/')).toBe('[\\[\\]\\*\\`\\_\\\\&lt;>](https://example.com/)');
}
