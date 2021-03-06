import assertDefined from '../../lib/assertDefined.js';
import getActiveTab from '../../lib/browser/getActiveTab.js';
import onCommand from '../../lib/browser/onCommand.js';
import onMessage from '../../lib/browser/onMessage.js';
import ContextMenuItem from '../../lib/ContextMenuItem.js';
import markdownLink from '../../lib/markdownLink.js';
import writeClipboard from '../../lib/writeClipboard.js';
import syncPrefs from '../syncPrefs.js';

/** Global shortcut: Copy active tab as a Markdown link */
onCommand('copy_tab_as_markdown', () => {
	getActiveTab().then(t => copyLink(t.title, assertDefined(t.url)));
});


// Context menu: Copy link as Markdown
const copyLinkCmi = new ContextMenuItem({
	id: 'copy_link',
	contexts: ['link'],
	onclick(info, tab) {
		let url = assertDefined(info.linkUrl);
		if (info.selectionText) {
			copyLink(info.selectionText, url);
			return;
		}
		if (tab.id == null) {
			return;
		}

		// Attention: textContent includes text from hidden elements
		let linkProbe = 'var focus = document.querySelector("a:focus"); if (focus) { focus.textContent; }';
		browser.tabs.executeScript(tab.id, { code: linkProbe, allFrames: true }).then(x => {
			let results: (string | undefined)[] = x;
			let title: string | undefined;
			if (results) {
				// The first truthy element
				title = results.filter(Boolean)[0];
				if (title != null) {
					// Do the same processing that a browser does when displaying links
					title = title.trim().replace(/[\r\n]+/gu, '').replace(/\t+/gu, ' ');
				}
			}
			// Copy the link, whether we have a title or not
			copyLink(title, url);
		});
	},
});
syncPrefs.get('showCopyLinkAsMarkdown').then(({ showCopyLinkAsMarkdown: x }) => copyLinkCmi.setVisible(x));
onMessage('show copyLinkItem', () => copyLinkCmi.setVisible(true));
onMessage('hide copyLinkItem', () => copyLinkCmi.setVisible(false));

// Context menu: Copy page as Markdown link
const copyPageCmi = new ContextMenuItem({
	id: 'copy_page',
	contexts: ['page'],
	onclick(_info, tab) {
		copyLink(tab.title, assertDefined(tab.url));
	},
});
syncPrefs.get('showCopyPageAsMarkdown').then(({ showCopyPageAsMarkdown: x }) => copyPageCmi.setVisible(x));
onMessage('show copyPageItem', () => copyPageCmi.setVisible(true));
onMessage('hide copyPageItem', () => copyPageCmi.setVisible(false));


/**
 * Copy the title and URL as a Markdown link
 */
function copyLink(title: string | undefined, url: string) {
	writeClipboard(markdownLink(title, url));
}
