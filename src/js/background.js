import '6to5/polyfill';
import debounce from './lib/debounce';
import * as TabManager from './lib-chrome/TabManager';
import { markdownLink } from './lib/Markdown';
import { writeClipboard } from './lib-browser/Clipboard';
import { drawIcon } from './Icon';
import { showPopup } from './lib-chrome/Popup';
import { getProtocol } from './lib/URLTools';

var protocolBlacklist = new Set([ 'chrome-devtools:', 'chrome:', 'chrome-extension:', 'opera:' ]);
// TODO: Make this list configurable
// var domainBlacklist = new Set([ 'mail.google.com' ]);
var doc, iconLocked = false;
var isDevMode = false;

/*
 * Check whether this is a development install
 */
Chrome.getExtensionInfo().then(info => {
	isDevMode = (info.installType === 'development');
});

/*
 * Handle browser action
 */
Chrome.onBrowserAction(sourceTab => {
	// TODO: check for tab.status === 'complete' and issue a warning if not
	Chrome.getAllWindows({ populate: true }).then(windows => {
		// Pull a window to the top
		// TODO: reverse order of windows/tabs completely instead
		var index = windows.findIndex(w => w.id === sourceTab.windowId);
		if (index > 0) {
			windows.unshift(windows.splice(index, 1)[0]);
		}

		// Filter some urls
		for (var wnd of windows) {
			wnd.tabs = wnd.tabs.filter(tab => {
				var url = new URL(tab.url);
				return !protocolBlacklist.has(url.protocol); //!domainBlacklist.has(url.hostname)
			});
		}

		// Ignore empty windows
		windows = windows.filter(wnd => wnd.tabs.length > 0);

		// Create markdown document
		doc = buildDocument(windows, sourceTab.id);

		// Open document in a new tab
		TabManager.show(sourceTab, chrome.runtime.getURL('output.html'));
	});
});

/*
 * Global shortcut: Copy current tab as a markdown link
 */
Chrome.onCommand('copy_current_page', () => {
	TabManager.getActiveTab().then(tab => {
		// Let the user modify the title (or use the domain shortcut)
		var title = prompt(tab.title, tab.title);
		if (title === null || title === '') {
			return;
		}

		var url = new URL(tab.url);
		if (title === 'd') {
			// Shortcut: Use naked domain name as title
			title = url.hostname.replace(/^www\./, '');
		} else if (title !== tab.title && isDevMode) {
			// Record title changes (only in dev mode)
			require('./TitleChangelog').logChange(tab.url, tab.title, title);
		}

		// Copy the title and url as a markdown link
		writeClipboard(markdownLink(title, tab.url));
	});
});

/*
 * Global shortcut: Move selected tabs left
 */
Chrome.onCommand('move_tab_left', () => {
	TabManager.moveTabs(-1);
});

/*
 * Global shortcut: Move selected tabs right
 */
Chrome.onCommand('move_tab_right', () => {
	TabManager.moveTabs(+1);
});

/*
 * Global shortcut: Pin selected tabs
 */
Chrome.onCommand('pin_tab', () => {
	TabManager.getHighlightedTabs().then(tabs => {
		for (var tab of tabs) {
			Chrome.updateTab(tab.id, { pinned: !tab.pinned });
		}
	});
});

/*
 * Global shortcut: Duplicate selected tabs
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
		sendResponse(doc)
	} else {
		sendResponse({ error: 'No document found' });
	}
});

/*
 * Global shortcut: Send the selected tabs to another window
 */
Chrome.onCommand('detach_highlighted_pages', () => {
	Promise.all([
		TabManager.getHighlightedTabs(),
		Chrome.getAllWindows()
	]).then(([tabs, windows]) => {
		var sourceWindow = windows.find(w => w.focused);
		// Get target windows
		windows = windows.filter(w => w.type === 'normal' && !w.focused);
		if (windows.length === 0) {
			// Immediately detach to a new window
			TabManager.moveTabsToWindow(tabs);
		} else {
			// Ask the user what to do
			var url = chrome.runtime.getURL('selection.html') + '?tabs=' + tabs.length + '&windows=' + windows.map(w => w.id).join(';');
			showPopup({ url, parent: sourceWindow, width: 220, height: 300 }, response => {
				TabManager.moveTabsToWindow(tabs, response.windowId);
			});
		}
	});
});

/**
 * Build a markdown document from an array of windows
 */
function buildDocument(windows, sourceTabId) {
	var lines = [], highlightLine = 0;
	for (var wnd of windows) {
		lines.push('# ' + Chrome.getString('headline_window', wnd.tabs.length));
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
	return { text: lines.join('\n'), highlightLine, created: new Date() };
}

/**
 * Update icon with the current tab count
 */
function updateIcon() {
	if (iconLocked) {
		return;
	}
	iconLocked = true;
	TabManager.getTabCount().then(count => {
		chrome.browserAction.setIcon({ imageData: drawIcon(count.toString()) });
		iconLocked = false;
	});
}

/**
 * Debounced version of updateIcon()
 */
var onTabChange = debounce(updateIcon, 200);

updateIcon();
chrome.tabs.onCreated.addListener(onTabChange);
chrome.tabs.onRemoved.addListener(onTabChange);