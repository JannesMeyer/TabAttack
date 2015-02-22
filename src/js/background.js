import './defaults';
import { drawIcon } from './Icon';
import * as TitleChangelog from './TitleChangelog';
import 'babel/polyfill';
import debounce from './lib/debounce';
import * as TabManager from './lib-chrome/TabManager';
import { markdownLink } from './lib/Markdown';
import { writeClipboard } from './lib-browser/Clipboard';
import { showPopup } from './lib-chrome/Popup';
import { getProtocol } from './lib/URLTools';

/**
 * The last generated document
 */
var doc;

/**
 * ID of the created context menu item
 */
var contextMenuId;

/*
 * Handle browser action
 */
Chrome.onBrowserAction(sourceTab => {
	// TODO: check for tab.status === 'complete' and issue a warning if not
	Promise.all([
		Chrome.getPreferences([ 'format', 'ignorePinned', 'domainBlacklist', 'protocolBlacklist' ]),
		Chrome.getAllWindows({ populate: true })
	]).then(([ prefs, windows ]) => {
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
				return !prefs.protocolBlacklist.includes(url.protocol) &&
				       !prefs.domainBlacklist.includes(url.hostname) &&
				       !(prefs.ignorePinned && tab.pinned);
			});
		}

		// Ignore empty windows
		windows = windows.filter(wnd => wnd.tabs.length > 0);

		// Create document
		var buildDocument = (prefs.format === 'json') ? buildJSONDocument : buildMarkdownDocument;
		doc = buildDocument(windows, sourceTab.id);

		// Open document in a new tab
		TabManager.show(sourceTab, chrome.runtime.getURL('output.html'));
	});
});

function addContextMenuItem() {
	contextMenuId = chrome.contextMenus.create({
		title: Chrome.getString('context_menu'),
		contexts: [ 'link' ],
		onclick: info => copyLink(info.selectionText, info.linkUrl, 'linkTitle')
	});
}

function removeContextMenuItem() {
	chrome.contextMenus.remove(contextMenuId);
}

/*
 * Context menu: Copy link as Markdown
 */
Chrome.getPreference('showCopyLinkAsMarkdown').then(show => show ? addContextMenuItem() : undefined);
Chrome.onMessage('add_context_menu', addContextMenuItem);
Chrome.onMessage('remove_context_menu', removeContextMenuItem);

/*
 * Global shortcut: Copy active tab as a Markdown link
 */
Chrome.onCommand('copy_tab_as_markdown', () => {
	TabManager.getActiveTab().then(tab => copyLink(tab.title, tab.url, 'documentTitle'));
});

/*
 * Global shortcut: Move highlighted tabs left
 */
Chrome.onCommand('move_tab_left', () => {
	TabManager.moveTabs(-1);
});

/*
 * Global shortcut: Move highlighted tabs right
 */
Chrome.onCommand('move_tab_right', () => {
	TabManager.moveTabs(+1);
});

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
		sendResponse({ error: 'No document found' });
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
		windows = windows.filter(w => w.type === 'normal' && !w.focused);
		if (windows.length === 0) {
			// Immediately detach to a new window
			TabManager.moveTabsToWindow(tabs);
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
		if (title === null || title === '') {
			return;
		}

		// Shortcut: Use the naked domain name
		if (title === 'd') {
			title = new URL(url).hostname.replace(/^www\./, '');
		} else
		// Log changes. This will not trigger in production.
		if (type === 'documentTitle' && title !== originalTitle && process.env.NODE_ENV !== 'production') {
			TitleChangelog.logChange(originalTitle, title, url);
		}

		// Copy the title and URL as a Markdown link
		writeClipboard(markdownLink(title, url));
}

/**
 * Build a markdown document from an array of windows
 */
function buildMarkdownDocument(windows, sourceTabId) {
	var lines = [], highlightLine = 0;
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
 * Build a pretty-printed JSON document
 */
function buildJSONDocument(windows, sourceTabId) {
	windows = windows.map(w => w.tabs.map(t => ({ title: t.title, url: t.url })));
	return { format: 'json', text: JSON.stringify(windows, undefined, 2) };
}

/**
 * Update icon with the current tab count
 */
function updateIcon() {
	TabManager.getTabCount().then(count => {
		chrome.browserAction.setIcon({ imageData: drawIcon(count) });
	});
}

/**
 * Debounced version of updateIcon()
 */
var handleTabChange = debounce(updateIcon, 200);

updateIcon();
chrome.tabs.onCreated.addListener(handleTabChange);
chrome.tabs.onRemoved.addListener(handleTabChange);