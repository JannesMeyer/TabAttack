import * as Clipboard from 'clipboard-tool';
import Preferences from '../Services/Preferences';
import drawIcon from '../Services/DrawIcon';
import { buildQuery } from '../Lib/QueryString';
import { markdownLink } from '../Lib/Markdown';
import * as TabService from '../Services/TabService';
import { getString } from '../Services/StringService';
import { onCommand } from '../Lib/BrowserCommand';
import BrowserContextMenu from '../Lib/BrowserContextMenu';
//import * as throttle from 'lodash.throttle';

/**
 * The last generated document
 */
var _doc: IDoc | undefined;

/*
 * Handle browser action
 */
browser.browserAction.onClicked.addListener(exportAllWindows);

/**
 * Context menu: Export current window (browser action)
 */
const exportWindowCmi = 'export_current_window';
browser.contextMenus.create({
  id: exportWindowCmi,
  contexts: [ 'browser_action' ],
  title: getString('context_menu_' + exportWindowCmi),
  onclick(info, sourceTab) {
    exportCurrentWindow(sourceTab);
  },
});

/**
 * Keyboard shortcut: Export current window
 */
onCommand('export_current_window', function() {
	TabService.getActive().then(exportCurrentWindow);
});

/*
 * Context menu: Copy link as Markdown
 */
const copyLinkCmi = new BrowserContextMenu({
  id: 'copy_link',
  contexts: [ 'link' ],
  onclick(info, tab) {
    if (info.selectionText) {
      copyLink(info.selectionText, info.linkUrl, 'linkTitle');
      return;
    }
    if (tab.id == null) {
      return;
    }

    // Attention: textContent includes text from hidden elements
    let linkProbe = 'var focus = document.querySelector("a:focus"); if (focus) { focus.textContent; }';
    browser.tabs.executeScript(tab.id, { code: linkProbe, allFrames: true }).then(results => {
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
  },
});

Preferences.get('showCopyLinkAsMarkdown').then(copyLinkCmi.setVisible);
onMessage('show copyLinkItem', copyLinkCmi.show);
onMessage('hide copyLinkItem', copyLinkCmi.hide);

/**
 * Context menu: Copy page as Markdown link
 */
var copyPageItem = new BrowserContextMenu({
  id: 'copy_page',
  contexts: [ browser.contextMenus.ContextType.page ],
  onclick(info, tab) {
    copyLink(tab.title, tab.url, 'documentTitle');
  },
});

Preferences.get('showCopyPageAsMarkdown').then(copyPageItem.setVisible);
onMessage('show copyPageItem', copyPageItem.show);
onMessage('hide copyPageItem', copyPageItem.hide);

/** Global shortcut: Copy active tab as a Markdown link */
onCommand('copy_tab_as_markdown', function() {
	TabService.getActive().then(tab => copyLink(tab.title, tab.url, 'documentTitle'));
});

/** Global shortcut: Move highlighted tabs left */
onCommand('move_tab_left', () => TabService.moveHighlighted(-1));

/** Global shortcut: Move highlighted tabs right */
onCommand('move_tab_right', () => TabService.moveHighlighted(1));

/** Global shortcut: Focus tab to the left */
onCommand('focus_left', () => TabService.focusLeft());

/** Global shortcut: Focus tab to the right */
onCommand('focus_right', () => TabService.focusRight());

/*
 * Global shortcut: Pin highlighted tabs
 */
onCommand('pin_tab', function() {
	TabService.getHighlighted().then(tabs => {
		for (var tab of tabs) {
      if (tab.id != null) {
        browser.tabs.update(tab.id, { pinned: !tab.pinned });
      }
		}
	});
});

/*
 * Global shortcut: Duplicate highlighted tabs
 */
onCommand('duplicate_tab', function() {
	TabService.getHighlighted().then(tabs => {
		for (var tab of tabs) {
      if (tab.id != null) {
        browser.tabs.duplicate(tab.id);
      }
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
		TabService.getHighlighted(),
		browser.windows.getAll()
	]).then(([tabs, windows]) => {
    let sourceWindow = windows.find(w => w.focused);
		// Get target windows
		windows = windows.filter(w => w.type === 'normal' && !w.focused && sourceWindow && sourceWindow.incognito === w.incognito);
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
				parent: sourceWindow,
				width: 240,
				height: 400
			}).show().then(msg => {
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
function copyLink(originalTitle: string | undefined, url: string | undefined, type: 'documentTitle' | 'linkTitle') {
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
		// if (isDev) {
		// 	TitleChangelog.logChange(originalTitle, title, url, type);
		// }

		// Copy the title and URL as a Markdown link
		Clipboard.write(markdownLink(title, url));
}

/**
 * Exports all windows
 */
function exportAllWindows(sourceTab: browser.tabs.Tab) {
	browser.windows.getAll({ populate: true })
		.then(windows => buildDocument(sourceTab, windows))
		.then(doc => openDocument(sourceTab, doc));
}

/**
 * Exports only the current window
 */
function exportCurrentWindow(sourceTab: browser.tabs.Tab) {
  if (sourceTab.windowId == null) {
    return;
  }
	browser.windows.get(sourceTab.windowId, { populate: true })
		.then(wnd => buildDocument(sourceTab, [ wnd ]))
		.then(doc => openDocument(sourceTab, doc));
}

/**
 * Open the document in a tab
 */
function openDocument(sourceTab: browser.tabs.Tab, doc: IDoc) {
	_doc = doc;
	TabService.open(sourceTab, browser.runtime.getURL('output.html'));
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
function buildJSONDocument(windows: browser.windows.Window[], sourceTabId: number): IDoc {
	let wnd = windows.map(w => (w.tabs || []).map(t => ({ title: t.title, url: t.url })));
	return { format: 'json', text: JSON.stringify(windows, undefined, 2) };
}

/**
 * Build a markdown document from an array of windows
 */
function buildMarkdownDocument(windows: browser.windows.Window[], sourceTabId: number): IDoc {
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

interface IDoc {
  format: 'markdown' | 'json';
  text: string;
  highlightLine?: number;
  message?: string;
}

/**
 * Update icon with the current tab count
 */
function updateIcon() {
	TabService.count().then(count => {
		browser.browserAction.setIcon({ imageData: drawIcon(count.toString()) });
	});
}

/**
 * Debounced version of updateIcon()
 */
var handleTabChange = throttle(updateIcon, 500);

updateIcon();
browser.tabs.onCreated.addListener(handleTabChange);
browser.tabs.onRemoved.addListener(handleTabChange);