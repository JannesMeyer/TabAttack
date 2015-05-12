import BrowserAction from 'chrome-tool/browser-action';
import * as Tabs     from 'chrome-tool/tabs';
import * as Windows  from 'chrome-tool/windows';
import * as Runtime  from 'chrome-tool/runtime';
import * as Commands from 'chrome-tool/commands';
import drawIcon      from './helpers/draw-icon';
import { getString } from 'chrome-tool/i18n';

import Preferences from './Preferences';
export { Preferences, URL, getString };

var _doc;

export function addButtonListener(callback) {
	BrowserAction.onClicked(callback);
}

export function addTabCountListener(callback) {
	Tabs.onCreated(callback);
	Tabs.onRemoved(callback);
}

/**
 * Update icon with the current tab count
 */
export function updateIcon() {
	Tabs.count().then(count => {
		BrowserAction.setIcon({ imageData: drawIcon(count) });
	});
}

export function onCommand(id, callback) {
	Commands.onCommand(id, callback);
}

export function moveTab(delta) {
	Tabs.moveHighlighted(delta);
}

export function pinActiveTab() {

}

export function getAllWindows(sourceTab) {
	return Windows.getAll({ populate: true });
}

export function getCurrentWindow(sourceTab) {
	return Windows.get(sourceTab.windowId, { populate: true });
}

export function convertWindows(windows) {
	return windows.map(wnd => {
		var incognito = wnd.incognito;
		var loadingTabs = 0;
		var tabs = wnd.tabs.map(tab => {
			var title = tab.title;
			var url = tab.url;
			var isPinned = tab.pinned;
			var active = tab.active && wnd.focused;

			var isLoading = (tab.status === 'loading');
			if (isLoading) {
				++loadingTabs;
			}

			return { title, url, isPinned, active };
		});

		return { tabs, incognito, loadingTabs };
	});
}

export function openDocument(sourceTab, doc) {
  _doc = doc;

  // if (sourceTab.url === 'chrome://newtab/' && !sourceTab.incognito) {
  //  return Promise.all([ Tabs.create({ url }), Tabs.remove(sourceTab.id) ]);
  // }
  Tabs.create({
  	url: Runtime.getURL('data/output.html'),
  	openerTabId: sourceTab.id
  });
}