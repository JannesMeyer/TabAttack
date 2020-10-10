import assertDefined from '../lib/assertDefined.js';
import getString from '../lib/browser/getString.js';
import markdownLink from '../lib/markdownLink.js';
import { Prefs } from '../preferences.js';

interface Doc {
	format: 'markdown' | 'json';
	text: string;
	highlightLine?: number;
}

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

/**
 * Filter some tabs and windows out, then build the document
 */
export default function buildDocument(sourceTab: browser.tabs.Tab, windows: browser.windows.Window[], p: Pick<Prefs, 'format' | 'ignorePinned' | 'domainBlacklist'>) {
	// TODO: reverse the order of the windows
	// Pull a window to the top
	let index = windows.findIndex(wnd => wnd.id === sourceTab.windowId);
	if (index > 0) {
		windows.unshift(assertDefined(windows.splice(index, 1)[0]));
	}

	// Count highlighted tabs. If >1 only export those.
	let highlightedTabs = assertDefined(windows.first().tabs).filter(t => t.highlighted);
	if (highlightedTabs.length > 1) {
		windows = [ { tabs: highlightedTabs, focused: false, incognito: false, alwaysOnTop: false } ];
	}

	// Filter some urls out and count the number of tabs that are still loading
	let loadingTabs = 0;
	for (let w of windows) {
		w.tabs = assertDefined(w.tabs).filter(tab => {

			// Compatibility with The Great Suspender
			let urlStr = assertDefined(tab.url);
			if (urlStr.startsWith('chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html#uri=')) {
				tab.url = urlStr.replace(/^chrome-extension:\/\/klbibkeccnjlkjkiokjodocebajanakg\/suspended\.html#uri=/, '');
			}

			let url = new URL(urlStr);

			return !protocolBlacklist.has(url.protocol) && !p.domainBlacklist.includes(url.hostname) && !(p.ignorePinned && tab.pinned);
		});
		// Count the number of loading tabs
		loadingTabs += w.tabs.reduce((n, tab) => n + (tab.status === 'loading' ? 1 : 0), 0);
	}

	// Ignore empty windows
	windows = windows.filter(wnd => assertDefined(wnd.tabs).length > 0);

	// Build document
	let doc;
	if (p.format === 'json') {
		doc = buildJSONDocument(windows);
	} else {
		doc = buildMarkdownDocument(windows, assertDefined(sourceTab.id));
	}

	// Tell the user if only highlighted tabs were exported
	if (highlightedTabs.length > 1) {
		throw new Error(getString('toast_highlighted_tabs'));
		
	} else if (windows.length === 0) {
		// Warn the user if all tabs were ignored
		throw new Error(getString('toast_no_tabs'));

	} else if (loadingTabs > 0) {
		// Warn the user if some tabs didn't finish loading
		throw new Error(getString('toast_loading_tab', loadingTabs));
	}

	return doc;
}

/**
 * Build a pretty-printed JSON document from an array of windows
 */
function buildJSONDocument(windows: browser.windows.Window[]): Doc {
	let w = windows.map(w => assertDefined(w.tabs).map(t => ({ title: t.title, url: t.url })));
	return {
		format: 'json',
		text: JSON.stringify(w, undefined, 2),
	};
}

/**
 * Build a markdown document from an array of windows
 */
function buildMarkdownDocument(windows: browser.windows.Window[], sourceTabId: number): Doc {
	let lines = [];
	let highlightLine = 0;
	for (let wnd of windows) {
		let tabs = assertDefined(wnd.tabs);
		const name = (wnd.incognito ? 'headline_incognito_window' : 'headline_window');
		lines.push('# ' + getString(name, tabs.length));
		lines.push('');
		for (let tab of tabs) {
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