import markdownLink from './markdownLink.js';

export function escapesTitle() {
	expect(markdownLink('', 'https://example.com/?a=\')')).toBe('[Untitled](https://example.com/?a=\'%29)');
	expect(markdownLink('[]*`_\\<>', 'https://example.com/')).toBe('[\\[\\]\\*\\`\\_\\\\&lt;>](https://example.com/)');
}
