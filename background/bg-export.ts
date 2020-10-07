import assertDefined from '../lib/assertDefined.js';
import getString from '../lib/browser/getString.js';
import onCommand from '../lib/browser/onCommand.js';
import onMessage from '../lib/browser/onMessage.js';
import ContextMenuItem from '../lib/ContextMenuItem.js';
import logError from '../lib/logError.js';
import markdownLink from '../lib/markdownLink.js';
import prefs from '../preferences.js';
import * as TabService from '../lib/tabs.js';

interface IDoc {
	format: 'markdown' | 'json';
	text: string;
	highlightLine?: number;
	message?: string;
}

/**
 * The last generated document
 */
var _doc: IDoc | undefined;

const protocolBlacklist = new Set([
	'about:',
	'extension:',
	'moz-extension:',
	'chrome:',
	'chrome-extension:',
	'chrome-devtools:',
	'opera:',
	'edge:',
]);

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


// Message from output.html: Get document
onMessage('get_document', (_message, _sender, sendResponse) => {
	if (_doc) {
		sendResponse(_doc);
	} else {
		sendResponse({ error: getString('toast_no_document') });
	}
});

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
	return TabService.open(sourceTab, browser.runtime.getURL('tabs.html'));
}

/**
 * Filter some tabs and windows out, then build the document
 */
function buildDocument(sourceTab: browser.tabs.Tab, windows: browser.windows.Window[]) {
	return prefs.get('format', 'ignorePinned', 'domainBlacklist').then(prefs => {
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

				return !protocolBlacklist.has(url.protocol) &&
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
		const name = (wnd.incognito ? 'headline_incognito_window' : 'headline_window');
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