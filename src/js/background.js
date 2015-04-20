import 'babel-core/polyfill';
import './defaults';
import * as Clipboard from 'clipboard-tool';
import { throttle } from 'date-tool';
import * as Icon from './Icon';
import * as TitleChangelog from './TitleChangelog';
import * as TabManager from './lib-chrome/TabManager';
import { moveTabs } from './lib-chrome/TabManager.moveTabs';
import { markdownLink } from './lib/markdown';
import { showPopup } from './lib-chrome/Popup';

/**
 * The last generated document
 */
var doc;

/**
 * ID of the created context menu item
 */
var contextMenuId;

/**
 * Boolean that says whether we are in development mode or not
 */
var isDev = (process.env.NODE_ENV !== 'production');

/*
 * Handle browser action
 */
Chrome.onBrowserAction(exportAllWindows);

// TODO
chrome.contextMenus.create({
	title: 'Only current window',
	contexts: [ 'browser_action' ],
	onclick: (info, sourceTab) => exportCurrentWindow(sourceTab)
});

// TODO
Chrome.onCommand('export_current_window', () => {
	TabManager.getActiveTab().then(exportCurrentWindow);
});

/**
 * Add context menu item
 */
function addContextMenuItem(name, contexts, onclick) {
	var title = Chrome.getString('context_menu_' + name)
	return chrome.contextMenus.create({ title, contexts, onclick });
}

/*
 * Context menu: Copy link as Markdown
 */
Chrome.getPreference('showCopyLinkAsMarkdown').then(show => {
	if (!show) { return; }
	contextMenuId = addContextMenuItem('copy_link', ['link'], handleCopyLinkAsMarkdown);
});
Chrome.onMessage('add_context_menu', () => {
	contextMenuId = addContextMenuItem('copy_link', ['link'], handleCopyLinkAsMarkdown);
});
Chrome.onMessage('remove_context_menu', () => {
	chrome.contextMenus.remove(contextMenuId);
});

/**
 * Context menu: Copy page as Markdown link
 */
Chrome.getPreference('showCopyPageAsMarkdown').then(show => {
	if (!show && !isDev) { return; }
	// TODO: make this configurable in the options and release it
	addContextMenuItem('copy_page', ['page'], (info, tab) => {
		copyLink(tab.title, tab.url, 'documentTitle')
	});
});

/**
 * Copy link as markdown
 */
function handleCopyLinkAsMarkdown(info, tab) {
	if (info.selectionText) {
		copyLink(info.selectionText, info.linkUrl, 'linkTitle');
		return;
	}

	// Attention: textContent includes text from hidden elements
	var linkProbe = 'var focus = document.querySelector("a:focus"); if (focus) { focus.textContent; }';
	// Inserting the link probe...
	chrome.tabs.executeScript({ code: linkProbe, allFrames: true }, results => {
		var title;
		if (results) {
			// Get the first element of the array that is not falsy
			title = results.filter(Boolean)[0];
			if (title) {
				// Do the same processing that a browser does when displaying links
				title = title.trim().replace(/[\r\n]+/g, '').replace(/\t+/g, ' ');
			}
		}
		// Copy the link, whether we have a title or not
		copyLink(title, info.linkUrl, 'linkTitle');
	});
}

/*
 * Global shortcut: Copy active tab as a Markdown link
 */
Chrome.onCommand('copy_tab_as_markdown', () => {
	TabManager.getActiveTab().then(tab => copyLink(tab.title, tab.url, 'documentTitle'));
});

/*
 * Global shortcut: Move highlighted tabs left
 */
Chrome.onCommand('move_tab_left', moveTabs.bind(undefined, -1));

/*
 * Global shortcut: Move highlighted tabs right
 */
Chrome.onCommand('move_tab_right', moveTabs.bind(undefined, 1));

/*
 * Global shortcut: Pin highlighted tabs
 */
Chrome.onCommand('pin_tab', () => {
	TabManager.getHighlightedTabs().then(tabs => {
		for (var tab of tabs) {
			Chrome.updateTab(tab.id, { pinned: !tab.pinned });
		}
	});
});

/*
 * Global shortcut: Duplicate highlighted tabs
 */
Chrome.onCommand('duplicate_tab', () => {
	TabManager.getHighlightedTabs().then(tabs => {
		for (var tab of tabs) {
			Chrome.duplicateTab(tab.id);
		}
	});
});

/*
 * Message from output.html: Get document
 */
Chrome.onMessage('get_document', (message, sender, sendResponse) => {
	if (doc) {
		sendResponse(doc);
	} else {
		sendResponse({ error: Chrome.getString('toast_no_document') });
	}
});

/*
 * Global shortcut: Send the highlighted tabs to another window
 */
Chrome.onCommand('send_tab', () => {
	Promise.all([
		TabManager.getHighlightedTabs(),
		Chrome.getAllWindows()
	]).then(([tabs, windows]) => {
		var sourceWindow = windows.find(w => w.focused);
		// Get target windows
		windows = windows.filter(w => w.type === 'normal' && !w.focused && sourceWindow.incognito === w.incognito);
		if (windows.length === 0) {
			// Immediately detach to a new window
			TabManager.moveTabsToWindow(tabs, undefined, sourceWindow.incognito);
		} else {
			// Ask the user what to do
			var url = chrome.runtime.getURL('selection.html') + '?tabs=' + tabs.length + '&windows=' + windows.map(w => w.id).join(';');
			showPopup({ url, parent: sourceWindow, width: 240, height: 400 }).then(message => {
				TabManager.moveTabsToWindow(tabs, message.windowId);
			}).catch(message => {});
		}
	});
});

/**
 * Let the user modify link title and then copy it as Markdown
 */
function copyLink(originalTitle, url, type) {
		// Let the user modify the title
		var title = prompt(Chrome.getString('prompt_title_change', originalTitle), originalTitle);

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

// TODO
function exportAllWindows(sourceTab) {
	Promise.all([
		Chrome.getPreferences([ 'format', 'ignorePinned', 'domainBlacklist', 'protocolBlacklist' ]),
		Chrome.getAllWindows({ populate: true })
	]).then(([ prefs, windows ]) => {
		doc = buildDocument(sourceTab, windows, prefs);
		TabManager.show(sourceTab, chrome.runtime.getURL('output.html'));
	});
}

// TODO
function exportCurrentWindow(sourceTab) {
	Promise.all([
		Chrome.getPreferences([ 'format', 'ignorePinned', 'domainBlacklist', 'protocolBlacklist' ]),
		Chrome.getLastFocusedWindow({ populate: true })
	]).then(([ prefs, wnd ]) => {
		doc = buildDocument(sourceTab, [ wnd ], prefs);
		TabManager.show(sourceTab, chrome.runtime.getURL('output.html'));
	});
}

/**
 * Filter some tabs and windows out, then build the document
 */
function buildDocument(sourceTab, windows, { protocolBlacklist, domainBlacklist, ignorePinned, format }) {
		// TODO: reverse the order of the windows
		// Pull a window to the top
		var index = windows.findIndex(wnd => wnd.id === sourceTab.windowId);
		if (index > 0) {
			windows.unshift(windows.splice(index, 1)[0]);
		}

		// Count highlighted tabs. If >1 only export those.
		var highlightedTabs = windows[0].tabs.filter(tab => tab.highlighted);
		if (highlightedTabs.length > 1) {
			windows = [ { tabs: highlightedTabs } ];
		}

		// Filter some urls out and count the number of tabs that are still loading
		var loadingTabs = 0;
		for (var wnd of windows) {
			wnd.tabs = wnd.tabs.filter(tab => {
				var url = new URL(tab.url);
				return !protocolBlacklist.includes(url.protocol) &&
				       !domainBlacklist.includes(url.hostname) &&
				       !(ignorePinned && tab.pinned);
			});
			// Count the number of loading tabs
			loadingTabs += wnd.tabs.reduce((n, tab) => n + (tab.status === 'loading' ? 1 : 0), 0);
		}

		// Ignore empty windows
		windows = windows.filter(wnd => wnd.tabs.length > 0);

		// Build document
		var doc;
		if (format === 'json') {
			doc = buildJSONDocument(windows, sourceTab.id);
		} else {
			doc = buildMarkdownDocument(windows, sourceTab.id);
		}

		// Tell the user if only highlighted tabs were exported
		if (highlightedTabs.length > 1) {
			doc.message = Chrome.getString('toast_highlighted_tabs');
		} else

		// Warn the user if all tabs were ignored
		if (windows.length === 0) {
			doc.message = Chrome.getString('toast_no_tabs');
		} else

		// Warn the user if some tabs didn't finish loading
		if (loadingTabs > 0) {
			doc.message = Chrome.getString('toast_loading_tab', loadingTabs);
		}

		return doc;
}

/**
 * Build a pretty-printed JSON document
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
		lines.push('# ' + Chrome.getString(name, wnd.tabs.length));
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
	TabManager.getTabCount().then(count => {
		chrome.browserAction.setIcon({ imageData: Icon.draw(count) });
	});
}

/**
 * Debounced version of updateIcon()
 */
var handleTabChange = throttle(updateIcon, 500);

updateIcon();
chrome.tabs.onCreated.addListener(handleTabChange);
chrome.tabs.onRemoved.addListener(handleTabChange);