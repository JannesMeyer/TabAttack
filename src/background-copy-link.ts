import { getActiveTab } from './lib/browser/getActiveTab';
import onCommand from './lib/browser/onCommand';
import ContextMenuItem from './lib/ContextMenuItem';
import markdownLink from './lib/markdownLink';
import { throwError } from './lib/throwError';
import writeClipboard from './lib/writeClipboard';
import { syncPrefs } from './prefs';

/** Global shortcut: Copy active tab as a Markdown link */
onCommand('copy_tab_as_markdown', () => {
	getActiveTab().then(t => copyLink(t.title, t.url ?? throwError()));
});

// Context menu: Copy link as Markdown
const copyLinkCmi = new ContextMenuItem({
	id: 'copy_link',
	contexts: ['link'],
}, (tab, info) => {
	let url = info.linkUrl ?? throwError();
	if (info.selectionText) {
		copyLink(info.selectionText, url);
		return;
	}
	if (tab.id == null) {
		return;
	}

	// Attention: textContent includes text from hidden elements
	let linkProbe = 'var focus = document.querySelector("a:focus"); if (focus) { focus.textContent; }';
	chrome.tabs.executeScript(tab.id, { code: linkProbe, allFrames: true }).then(x => {
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
});
syncPrefs.watch('showCopyLinkAsMarkdown', value => copyLinkCmi.setVisible(value));

// Context menu: Copy page as Markdown link
const copyPageCmi = new ContextMenuItem({
	id: 'copy_page',
	contexts: ['page'],
}, (tab) => copyLink(tab.title, tab.url ?? throwError()));

syncPrefs.watch('showCopyPageAsMarkdown', value => copyPageCmi.setVisible(value));

/**
 * Copy the title and URL as a Markdown link
 */
function copyLink(title: string | undefined, url: string) {
	writeClipboard(markdownLink(title, url));
}
