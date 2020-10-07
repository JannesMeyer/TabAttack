import assertDefined from '../lib/assertDefined.js';
import getString from '../lib/browser/getString.js';
import onCommand from '../lib/browser/onCommand.js';
import onMessage from '../lib/browser/onMessage.js';
import ContextMenuItem from '../lib/ContextMenuItem.js';
import logError from '../lib/logError.js';
import markdownLink from '../lib/markdownLink.js';
import * as TabService from '../lib/tabs.js';
import writeClipboard from '../lib/writeClipboard.js';
import prefs from '../preferences.js';

/** Global shortcut: Copy active tab as a Markdown link */
onCommand('copy_tab_as_markdown', function() {
	TabService.getActive().then(tab => copyLink(tab.title, assertDefined(tab.url), 'documentTitle'));
});


// Context menu: Copy link as Markdown
const copyLinkCmi = new ContextMenuItem({
	id: 'copy_link',
	contexts: ['link'],
	onclick(info, tab) {
		let url = assertDefined(info.linkUrl);
		if (info.selectionText) {
			copyLink(info.selectionText, url, 'linkTitle');
			return;
		}
		if (tab.id == null) {
			return;
		}

		// Attention: textContent includes text from hidden elements
		let linkProbe = 'var focus = document.querySelector("a:focus"); if (focus) { focus.textContent; }';
		browser.tabs.executeScript(tab.id, { code: linkProbe, allFrames: true }).then(x => {
			let results: (string | undefined)[] = x as any;
			let title: string | undefined;
			if (results) {
				// The first truthy element
				title = results.filter(Boolean)[0];
				if (title != null) {
					// Do the same processing that a browser does when displaying links
					title = title.trim().replace(/[\r\n]+/g, '').replace(/\t+/g, ' ');
				}
			}
			// Copy the link, whether we have a title or not
			copyLink(title, url, 'linkTitle');
		});
	},
});
prefs.get('showCopyLinkAsMarkdown').then(({ showCopyLinkAsMarkdown: x }) => {
	copyLinkCmi.setVisible(x).catch(logError);
});
onMessage('show copyLinkItem', () => copyLinkCmi.setVisible(true).catch(logError));
onMessage('hide copyLinkItem', () => copyLinkCmi.setVisible(false).catch(logError));

// Context menu: Copy page as Markdown link
const copyPageCmi = new ContextMenuItem({
	id: 'copy_page',
	contexts: ['page'],
	onclick(_info, tab) {
		copyLink(tab.title, assertDefined(tab.url), 'documentTitle');
	},
});
prefs.get('showCopyPageAsMarkdown').then(({ showCopyPageAsMarkdown: x }) => {
	copyPageCmi.setVisible(x).catch(logError);
});
onMessage('show copyPageItem', () => copyPageCmi.setVisible(true).catch(logError));
onMessage('hide copyPageItem', () => copyPageCmi.setVisible(false).catch(logError));


/**
 * Let the user modify link title and then copy it as Markdown
 */
function copyLink(originalTitle: string | undefined, url: string, _type: 'documentTitle' | 'linkTitle') {
	// Let the user modify the title
	var title = prompt(getString('prompt_title_change', originalTitle), originalTitle);

	// Cancelled?
	if (title === null) {
		return;
	}
	title = title.trim();

	// Shortcut: Use the naked domain name
	if (title === '') {
		title = new URL(url).hostname.replace(/^www\./, '');
	}

	// Copy the title and URL as a Markdown link
	writeClipboard(markdownLink(title, url));
}