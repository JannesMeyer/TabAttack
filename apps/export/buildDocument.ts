import assertDefined from '../../lib/assertDefined.js';
import getString from '../../lib/browser/getString.js';
import markdownLink from '../../lib/markdownLink.js';
import syncPrefs from '../syncPrefs.js';
import type { Doc } from './Editor.js';
import showToast from './Toast.js';

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
export default async function buildDocument(sourceTabId?: number, windowId?: number) {
	let p = await syncPrefs.get('format', 'ignorePinned', 'domainBlacklist');
	// TODO: Use TabStore
	let windows = await browser.windows.getAll({ populate: true });

	// Pull a window to the top
	let index = windows.findIndex(w => w.id === windowId);
	if (index > 0) {
		windows.unshift(windows.splice(index, 1).single());
	}

	// Count highlighted tabs. If >1 only export those.
	let highlightedTabs = assertDefined(windows.first().tabs).filter(t => t.highlighted);
	if (highlightedTabs.length > 1) {
		windows = [{ tabs: highlightedTabs, focused: false, incognito: false, alwaysOnTop: false }];
		showToast(getString('toast_highlighted_tabs'));
	}

	for (let w of windows) {
		w.tabs = assertDefined(w.tabs).filter(tab => {

			// Compatibility with The Great Suspender
			let urlStr = assertDefined(tab.url);
			if (urlStr.startsWith('chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html#uri=')) {
				tab.url = urlStr.replace(/^chrome-extension:\/\/klbibkeccnjlkjkiokjodocebajanakg\/suspended\.html#uri=/u, '');
			}

			let url = new URL(urlStr);
			if (protocolBlacklist.has(url.protocol)) {
				return false;
			}
			if (p.domainBlacklist.includes(url.hostname)) {
				return false;
			}
			if (p.ignorePinned && tab.pinned) {
				return false;
			}
			return true;
		});
	}

	// Ignore empty windows
	windows = windows.filter(w => assertDefined(w.tabs).length > 0);

	// Warn the user if all tabs were ignored
	if (windows.length === 0) {
		showToast(getString('toast_no_tabs'));
	}

	// Warn the user if some tabs didn't finish loading
	let loading = windows.flatMap(w => w.tabs?.length ?? 0).reduce((a, b) => a + b);
	if (loading > 0) {
		showToast(getString('toast_loading_tab'), loading);
	}

	// Build document
	return (p.format === 'json' ? makeJson(windows) : makeMarkdown(windows, sourceTabId));
}

/**
 * Build a pretty-printed JSON document from an array of windows
 */
function makeJson(windows: browser.windows.Window[]): Doc {
	let data = windows.map(w => assertDefined(w.tabs).map(({ title, url }) => ({ title, url })));
	return {
		format: 'json',
		text: JSON.stringify(data, undefined, 2),
	};
}

/**
 * Build a markdown document from an array of windows
 */
function makeMarkdown(windows: browser.windows.Window[], sourceTabId?: number): Doc {
	let lines = [];
	let highlightLine = 0;
	for (let wnd of windows) {
		let tabs = assertDefined(wnd.tabs);
		const name = (wnd.incognito ? 'headline_incognito_window' : 'headline_window');
		lines.push('# ' + getString(name, tabs.length));
		lines.push('');
		for (let tab of tabs) {
			lines.push('- ' + markdownLink(tab.title, assertDefined(tab.url)));
			if (tab.id != null && tab.id === sourceTabId) {
				highlightLine = lines.length;
			}
		}
		lines.push('');
		lines.push('');
	}
	lines.pop();
	return { format: 'markdown', text: lines.join('\n'), highlightLine };
}
