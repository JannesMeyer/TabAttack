import Preferences from './preferences.js';
import drawIcon from './components/drawIcon.js';
import { buildQuery } from './lib/QueryString.js';
import markdownLink from './lib/markdownLink.js';
import * as TabService from './lib/tabs.js';
import { onCommand } from './lib/browser/onCommand.js';
import ContextMenuItem from './lib/ContextMenuItem.js';
import onMessage from './lib/browser/onMessage.js';
import getString from './lib/browser/getString.js';
import Popup from './lib/Popup.js';
import assertDefined from './lib/assertDefined.js';
import writeClipboard from './lib/writeClipboard.js';
import isDefined from './lib/isDefined.js';

/**
 * The last generated document
 */
var _doc: IDoc | undefined;

// Browser action: All windows
browser.browserAction.onClicked.addListener(tab => exportAllWindows(tab).catch(logError));

// Browser action: Only current window
new ContextMenuItem({
	id: 'export_current_window',
	contexts: ['browser_action'],
	onclick: (_, tab) => exportCurrentWindow(tab),
});

// Keyboard shortcut: Export current window
onCommand('export_current_window', () => TabService.getActive().then(exportCurrentWindow));

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
Preferences.get('showCopyLinkAsMarkdown').then(({ showCopyLinkAsMarkdown: x }) => {
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
Preferences.get('showCopyPageAsMarkdown').then(({ showCopyPageAsMarkdown: x }) => {
	copyPageCmi.setVisible(x).catch(logError);
});
onMessage('show copyPageItem', () => copyPageCmi.setVisible(true).catch(logError));
onMessage('hide copyPageItem', () => copyPageCmi.setVisible(false).catch(logError));

/** Global shortcut: Copy active tab as a Markdown link */
onCommand('copy_tab_as_markdown', function() {
	TabService.getActive().then(tab => copyLink(tab.title, assertDefined(tab.url), 'documentTitle'));
});

/** Global shortcut: Move highlighted tabs left */
onCommand('move_tab_left', () => TabService.moveHighlighted(-1));

/** Global shortcut: Move highlighted tabs right */
onCommand('move_tab_right', () => TabService.moveHighlighted(1));

// /** Global shortcut: Focus tab to the left */
// onCommand('focus_left', () => TabService.focusLeft());

// /** Global shortcut: Focus tab to the right */
// onCommand('focus_right', () => TabService.focusRight());

// Global shortcut: Pin highlighted tabs
onCommand('pin_tab', function() {
	TabService.getHighlighted().then(tabs => {
		for (var tab of tabs) {
			if (tab.id != null) {
				browser.tabs.update(tab.id, { pinned: !tab.pinned });
			}
		}
	});
});

// Global shortcut: Duplicate highlighted tabs
onCommand('duplicate_tab', function() {
	TabService.getHighlighted()
		.then(tabs => Promise.all(tabs.map(t => t.id).filter(isDefined).map(id => browser.tabs.duplicate(id))))
		.catch(logError);
});

// Message from output.html: Get document
onMessage('get_document', (_message, _sender, sendResponse) => {
	if (_doc) {
		sendResponse(_doc);
	} else {
		sendResponse({ error: getString('toast_no_document') });
	}
});

// Global shortcut: Send the highlighted tabs to another window
onCommand('send_tab', function() {
	Promise.all([
		TabService.getHighlighted(),
		browser.windows.getAll()
	]).then(([tabs, windows]) => {
		let sourceWindow = assertDefined(windows.find(w => w.focused));
		// Get target windows
		windows = windows.filter(w => w.type === 'normal' && !w.focused && sourceWindow.incognito === w.incognito);
		if (windows.length === 0) {
			// Immediately detach to a new window
			TabService.moveToNewWindow(tabs, sourceWindow.incognito);
		} else {
			new Popup({
				url: 'selection.html',
				params: buildQuery({
					numTabs: tabs.length,
					windowIds: windows.map(w => w.id).join(';')
				}),
				parent: {
					top: assertDefined(sourceWindow.top),
					left: assertDefined(sourceWindow.left),
					width: assertDefined(sourceWindow.width),
					height: assertDefined(sourceWindow.height),
				},
				width: 240,
				height: 400
			}).closed.then(msg => {
				if (msg.windowId !== undefined) {
					TabService.moveToWindow(tabs, msg.windowId);
				} else if (msg.newWindow !== undefined) {
					TabService.moveToNewWindow(tabs, sourceWindow.incognito);
				}
			});
		}
	});
});

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

/**
 * Exports all windows
 */
async function exportAllWindows(sourceTab: browser.tabs.Tab) {
	let windows = await browser.windows.getAll({ populate: true });
	let doc = await buildDocument(sourceTab, windows);
	return openDocument(sourceTab, doc);
}

/**
 * Exports only the current window
 */
async function exportCurrentWindow(sourceTab: browser.tabs.Tab) {
	if (sourceTab.windowId == null) {
		return;
	}
	let w = await browser.windows.get(sourceTab.windowId, { populate: true })
	let doc = await buildDocument(sourceTab, [w]);
	return openDocument(sourceTab, doc);
}

/**
 * Open the document in a tab
 */
function openDocument(sourceTab: browser.tabs.Tab, doc: IDoc) {
	_doc = doc;
	return TabService.open(sourceTab, browser.runtime.getURL('tab-output.html'));
}

/**
 * Filter some tabs and windows out, then build the document
 */
function buildDocument(sourceTab: browser.tabs.Tab, windows: browser.windows.Window[]) {
	return Preferences.get('format', 'ignorePinned', 'domainBlacklist', 'protocolBlacklist').then(prefs => {
		// TODO: reverse the order of the windows
		// Pull a window to the top
		var index = windows.findIndex(wnd => wnd.id === sourceTab.windowId);
		if (index > 0) {
			windows.unshift(windows.splice(index, 1)[0]);
		}

		// Count highlighted tabs. If >1 only export those.
		var highlightedTabs = assertDefined(windows[0].tabs).filter(t => t.highlighted);
		if (highlightedTabs.length > 1) {
			windows = [ { tabs: highlightedTabs, focused: false, incognito: false, alwaysOnTop: false } ];
		}

		// Filter some urls out and count the number of tabs that are still loading
		var loadingTabs = 0;
		for (var wnd of windows) {
			wnd.tabs = assertDefined(wnd.tabs).filter(tab => {

				// Compatibility with The Great Suspender
				let urlStr = assertDefined(tab.url);
				if (urlStr.startsWith('chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html#uri=')) {
					tab.url = urlStr.replace(/^chrome-extension:\/\/klbibkeccnjlkjkiokjodocebajanakg\/suspended\.html#uri=/, '');
				}

				let url = new URL(urlStr);

				return !prefs.protocolBlacklist.includes(url.protocol) &&
							 !prefs.domainBlacklist.includes(url.hostname) &&
							 !(prefs.ignorePinned && tab.pinned);
			});
			// Count the number of loading tabs
			loadingTabs += wnd.tabs.reduce((n, tab) => n + (tab.status === 'loading' ? 1 : 0), 0);
		}

		// Ignore empty windows
		windows = windows.filter(wnd => assertDefined(wnd.tabs).length > 0);

		// Build document
		let doc;
		if (prefs.format === 'json') {
			doc = buildJSONDocument(windows, assertDefined(sourceTab.id));
		} else {
			doc = buildMarkdownDocument(windows, assertDefined(sourceTab.id));
		}

		// Tell the user if only highlighted tabs were exported
		if (highlightedTabs.length > 1) {
			doc.message = getString('toast_highlighted_tabs');
		} else

		// Warn the user if all tabs were ignored
		if (windows.length === 0) {
			doc.message = getString('toast_no_tabs');
		} else

		// Warn the user if some tabs didn't finish loading
		if (loadingTabs > 0) {
			doc.message = getString('toast_loading_tab', loadingTabs);
		}

		console.log('done', doc);

		return doc;
	});
}

/**
 * Build a pretty-printed JSON document from an array of windows
 */
function buildJSONDocument(windows: browser.windows.Window[], _sourceTabId: number): IDoc {
	let wnd = windows.map(w => assertDefined(w.tabs).map(t => ({ title: t.title, url: t.url })));
	return {
		format: 'json',
		text: JSON.stringify(wnd, undefined, 2),
	};
}

/**
 * Build a markdown document from an array of windows
 */
function buildMarkdownDocument(windows: browser.windows.Window[], sourceTabId: number): IDoc {
	var lines = [];
	var highlightLine = 0;
	for (var wnd of windows) {
		let tabs = assertDefined(wnd.tabs);
		var name = (wnd.incognito ? 'headline_incognito_window' : 'headline_window');
		lines.push('# ' + getString(name, tabs.length));
		lines.push('');
		for (var tab of tabs) {
			lines.push('- ' + markdownLink(tab.title, assertDefined(tab.url)));
			if (tab.id === sourceTabId) {
				highlightLine = lines.length;
			}
		}
		lines.push('');
		lines.push('');
	}
	lines.pop();
	return { format: 'markdown', text: lines.join('\n'), highlightLine };
}

interface IDoc {
	format: 'markdown' | 'json';
	text: string;
	highlightLine?: number;
	message?: string;
}


browser.tabs.onCreated.addListener(updateIcon);
browser.tabs.onRemoved.addListener(updateIcon);
addEventListener('load', updateIcon);

/**
 * Update browser action with the current tab count
 */
function updateIcon() {
	TabService.count().then(count => {
		browser.browserAction.setIcon({ imageData: drawIcon(count.toString()) });
	}).catch(logError);
}

function logError(error: Error) {
	console.error(error.message);
}
