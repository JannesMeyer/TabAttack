import 'babel-core/polyfill';
import { throttle } from 'date-tool';
import * as Clipboard from 'clipboard-tool';
import { Tabs, Windows, Popup, ContextMenuItem, BrowserAction } from 'chrome-tool';
import { getString, getURL, onMessage, onCommand } from 'chrome-tool';

import Preferences from './Preferences';
import drawIcon from './helpers/draw-icon';
import * as TitleChangelog from './helpers/title-changelog';
import { buildQuery } from './lib/query-string';
import { markdownLink } from './lib/markdown';

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

/*
 * Global shortcut: Copy active tab as a Markdown link
 */
onCommand('copy_tab_as_markdown', function() {
	Tabs.getActive().then(tab => copyLink(tab.title, tab.url, 'documentTitle'));
});

/*
 * Global shortcut: Move highlighted tabs left
 */
onCommand('move_tab_left', Tabs.moveHighlighted.bind(null, -1));

/*
 * Global shortcut: Move highlighted tabs right
 */
onCommand('move_tab_right', Tabs.moveHighlighted.bind(null, 1));

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