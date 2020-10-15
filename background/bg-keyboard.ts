import * as TabService from '../lib/tabs.js';
import onCommand from '../lib/browser/onCommand.js';
import isDefined from '../lib/isDefined.js';
import logError from '../lib/logError.js';

/** Global shortcut: Move highlighted tabs left */
onCommand('move_tab_left', () => TabService.moveHighlighted(-1));

/** Global shortcut: Move highlighted tabs right */
onCommand('move_tab_right', () => TabService.moveHighlighted(1));

// Global shortcut: Pin highlighted tabs
onCommand('pin_tab', function() {
	TabService.getHighlighted().then(tabs => {
		for (let tab of tabs) {
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
