//import 'babel-core/polyfill';
import { throttle } from 'date-tool';
import * as Clipboard from 'clipboard-tool';
import { Tabs, Windows, Popup, ContextMenuItem, BrowserAction } from 'chrome-tool';
import { getString, getURL, onMessage, onCommand } from 'chrome-tool';

import Preferences from './Preferences';
import drawIcon from './helpers/draw-icon';
import * as TitleChangelog from './helpers/title-changelog';
import { buildQuery } from './lib/query-string';
import { markdownLink } from './lib/markdown';


// TODO: make this browser-independent. just logic.

/**
 * The last generated document
 */
var _doc;

/**
 * Boolean that says whether we are in development mode or not
 */
var isDev = (process.env.NODE_ENV !== 'production');

/*
 * Handle browser action
 */
BrowserAction.onClicked(exportAllWindows);

/**
 * Context menu: Export current window (browser action)
 */
new ContextMenuItem('export_current_window', ['browser_action'], function(info, sourceTab) {
	exportCurrentWindow(sourceTab);
}).show();

/**
 * Keyboard shortcut: Export current window
 */
onCommand('export_current_window', function() {
	Tabs.getActive().then(exportCurrentWindow);
});

/*
 * Context menu: Copy link as Markdown
 */
var copyLinkItem = new ContextMenuItem('copy_link', ['link'], function(info, tab) {
	if (info.selectionText) {
		copyLink(info.selectionText, info.linkUrl, 'linkTitle');
		return;
	}

	// Attention: textContent includes text from hidden elements
	var linkProbe = 'var focus = document.querySelector("a:focus"); if (focus) { focus.textContent; }';
	Tabs.executeScript({ code: linkProbe, allFrames: true }, results => {
		var title;
		if (results) {
			// The first truthy element
			title = results.filter(Boolean)[0];
			if (title) {
				// Do the same processing that a browser does when displaying links
				title = title.trim().replace(/[\r\n]+/g, '').replace(/\t+/g, ' ');
			}
		}
		// Copy the link, whether we have a title or not
		copyLink(title, info.linkUrl, 'linkTitle');
	});
});

Preferences.get('showCopyLinkAsMarkdown').then(copyLinkItem.setVisible);
onMessage('show copyLinkItem', copyLinkItem.show);
onMessage('hide copyLinkItem', copyLinkItem.hide);

/**
 * Context menu: Copy page as Markdown link
 */
var copyPageItem = new ContextMenuItem('copy_page', ['page'], function(info, tab) {
	copyLink(tab.title, tab.url, 'documentTitle');
});

Preferences.get('showCopyPageAsMarkdown').then(copyPageItem.setVisible);
onMessage('show copyPageItem', copyPageItem.show);
onMessage('hide copyPageItem', copyPageItem.hide);

/** Global shortcut: Copy active tab as a Markdown link */
onCommand('copy_tab_as_markdown', function() {
	Tabs.getActive().then(tab => copyLink(tab.title, tab.url, 'documentTitle'));
});

/** Global shortcut: Move highlighted tabs left */
onCommand('move_tab_left', () => Tabs.moveHighlighted(-1));

/** Global shortcut: Move highlighted tabs right */
onCommand('move_tab_right', () => Tabs.moveHighlighted(1));

/** Global shortcut: Focus tab to the left */
onCommand('focus_left', () => Tabs.focusLeft());

/** Global shortcut: Focus tab to the right */
onCommand('focus_right', () => Tabs.focusLeft());

/*
 * Global shortcut: Pin highlighted tabs
 */
onCommand('pin_tab', function() {
	Tabs.getHighlighted().then(tabs => {
		for (var tab of tabs) {
			Tabs.update(tab.id, { pinned: !tab.pinned });
		}
	});
});

/*
 * Global shortcut: Duplicate highlighted tabs
 */
onCommand('duplicate_tab', function() {
	Tabs.getHighlighted().then(tabs => {
		for (var tab of tabs) {
			Tabs.duplicate(tab.id);
		}
	});
});

/*
 * Message from output.html: Get document
 */
onMessage('get_document', (message, sender, sendResponse) => {
	if (_doc) {
		sendResponse(_doc);
	} else {
		sendResponse({ error: getString('toast_no_document') });
	}
});

/*
 * Global shortcut: Send the highlighted tabs to another window
 */
onCommand('send_tab', function() {
	Promise.all([
		Tabs.getHighlighted(),
		Windows.getAll()
	]).then(([tabs, windows]) => {
		var sourceWindow = windows.find(w => w.focused);
		// Get target windows
		windows = windows.filter(w => w.type === 'normal' && !w.focused && sourceWindow.incognito === w.incognito);
		if (windows.length === 0) {
			// Immediately detach to a new window
			Tabs.moveToNewWindow(tabs, sourceWindow.incognito);
		} else {
			new Popup({
				url: 'selection.html',
				params: buildQuery({
					numTabs: tabs.length,
					windowIds: windows.map(w => w.id).join(';')
				}),
				parent: sourceWindow,
				width: 240,
				height: 400
			}).show().then(msg => {
				if (msg.windowId !== undefined) {
					Tabs.moveToWindow(tabs, msg.windowId);
				} else if (msg.newWindow !== undefined) {
					Tabs.moveToNewWindow(tabs, sourceWindow.incognito);
				}
			});
		}
	});
});

/**
 * Let the user modify link title and then copy it as Markdown
 */
function copyLink(originalTitle, url, type) {
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

		// Log title changes. This will not happen in production.
		if (isDev) {
			TitleChangelog.logChange(originalTitle, title, url, type);
		}

		// Copy the title and URL as a Markdown link
		Clipboard.write(markdownLink(title, url));
}

/**
 * Exports all windows
 */
function exportAllWindows(sourceTab) {
	Windows.getAll({ populate: true })
		.then(buildDocument.bind(null, sourceTab))
		.then(openDocument.bind(null, sourceTab));
}

/**
 * Exports only the current window
 */
function exportCurrentWindow(sourceTab) {
	Windows.get(sourceTab.windowId, { populate: true })
		.then(Array) // Wraps the object in an Array
		.then(buildDocument.bind(null, sourceTab))
		.then(openDocument.bind(null, sourceTab));
}

/**
 * Open the document in a tab
 */
function openDocument(sourceTab, doc) {
	_doc = doc;
	Tabs.open(sourceTab, getURL('output.html'));
}

/**
 * Filter some tabs and windows out, then build the document
 */
function buildDocument(sourceTab, windows) {
	return Preferences.get('format', 'ignorePinned', 'domainBlacklist', 'protocolBlacklist').then(prefs => {
		// TODO: reverse the order of the windows
		// Pull a window to the top
		var index = windows.findIndex(wnd => wnd.id === sourceTab.windowId);
		if (index > 0) {
			windows.unshift(windows.splice(index, 1)[0]);
		}

		// Count highlighted tabs. If >1 only export those.
		var highlightedTabs = windows[0].tabs.filter(t => t.highlighted);
		if (highlightedTabs.length > 1) {
			windows = [ { tabs: highlightedTabs } ];
		}

		// Filter some urls out and count the number of tabs that are still loading
		var loadingTabs = 0;
		for (var wnd of windows) {
			wnd.tabs = wnd.tabs.filter(tab => {

				// Compatibility with The Great Suspender
				if (tab.url.startsWith('chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html#uri=')) {
					tab.url = tab.url.replace(/^chrome-extension:\/\/klbibkeccnjlkjkiokjodocebajanakg\/suspended\.html#uri=/, '');
				}

				var url = new URL(tab.url);

				return !prefs.protocolBlacklist.includes(url.protocol) &&
				       !prefs.domainBlacklist.includes(url.hostname) &&
				       !(prefs.ignorePinned && tab.pinned);
			});
			// Count the number of loading tabs
			loadingTabs += wnd.tabs.reduce((n, tab) => n + (tab.status === 'loading' ? 1 : 0), 0);
		}

		// Ignore empty windows
		windows = windows.filter(wnd => wnd.tabs.length > 0);

		// Build document
		var doc;
		if (prefs.format === 'json') {
			doc = buildJSONDocument(windows, sourceTab.id);
		} else {
			doc = buildMarkdownDocument(windows, sourceTab.id);
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

		return doc;
	});
}

/**
 * Build a pretty-printed JSON document from an array of windows
 */
function buildJSONDocument(windows, sourceTabId) {
	windows = windows.map(w => w.tabs.map(t => ({ title: t.title, url: t.url })));
	return { format: 'json', text: JSON.stringify(windows, undefined, 2) };
}

/**
 * Build a markdown document from an array of windows
 */
function buildMarkdownDocument(windows, sourceTabId) {
	var lines = [];
	var highlightLine = 0;
	for (var wnd of windows) {
		var name = (wnd.incognito ? 'headline_incognito_window' : 'headline_window');
		lines.push('# ' + getString(name, wnd.tabs.length));
		lines.push('');
		for (var tab of wnd.tabs) {
			lines.push('- ' + markdownLink(tab.title, tab.url));
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

/**
 * Update icon with the current tab count
 */
function updateIcon() {
	Tabs.count().then(count => {
		BrowserAction.setIcon({ imageData: drawIcon(count) });
	});
}

/**
 * Debounced version of updateIcon()
 */
var handleTabChange = throttle(updateIcon, 500);

updateIcon();
chrome.tabs.onCreated.addListener(handleTabChange);
chrome.tabs.onRemoved.addListener(handleTabChange);