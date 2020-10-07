import * as TabService from '../lib/tabs.js';
import onCommand from '../lib/browser/onCommand.js';
import isDefined from '../lib/isDefined.js';
import logError from '../lib/logError.js';

/** Global shortcut: Move highlighted tabs left */
onCommand('move_tab_left', () => TabService.moveHighlighted(-1));

/** Global shortcut: Move highlighted tabs right */
onCommand('move_tab_right', () => TabService.moveHighlighted(1));

// /** Global shortcut: Focus tab to the left */
// onCommand('focus_left', () => TabService.focusLeft());

// /** Global shortcut: Focus tab to the right */
// onCommand('focus_right', () => TabService.focusRight());

// Global shortcut: Pin highlighted tabs
onCommand('pin_tab', function() {
	TabService.getHighlighted().then(tabs => {
		for (var tab of tabs) {
			if (tab.id != null) {
				browser.tabs.update(tab.id, { pinned: !tab.pinned });
			}
		}
	});
});

// Global shortcut: Duplicate highlighted tabs
onCommand('duplicate_tab', function() {
	TabService.getHighlighted()
		.then(tabs => Promise.all(tabs.map(t => t.id).filter(isDefined).map(id => browser.tabs.duplicate(id))))
		.catch(logError);
});

// // Global shortcut: Send the highlighted tabs to another window
// onCommand('send_tab', function() {
// 	Promise.all([
// 		TabService.getHighlighted(),
// 		browser.windows.getAll()
// 	]).then(([tabs, windows]) => {
// 		let sourceWindow = assertDefined(windows.find(w => w.focused));
// 		// Get target windows
// 		windows = windows.filter(w => w.type === 'normal' && !w.focused && sourceWindow.incognito === w.incognito);
// 		if (windows.length === 0) {
// 			// Immediately detach to a new window
// 			TabService.moveToNewWindow(tabs, sourceWindow.incognito);
// 		} else {
// 			new Popup({
// 				url: 'selection.html',
// 				params: buildQuery({
// 					numTabs: tabs.length,
// 					windowIds: windows.map(w => w.id).join(';')
// 				}),
// 				parent: {
// 					top: assertDefined(sourceWindow.top),
// 					left: assertDefined(sourceWindow.left),
// 					width: assertDefined(sourceWindow.width),
// 					height: assertDefined(sourceWindow.height),
// 				},
// 				width: 240,
// 				height: 400
// 			}).closed.then(msg => {
// 				if (msg.windowId !== undefined) {
// 					TabService.moveToWindow(tabs, msg.windowId);
// 				} else if (msg.newWindow !== undefined) {
// 					TabService.moveToNewWindow(tabs, sourceWindow.incognito);
// 				}
// 			});
// 		}
// 	});
// });