import onCommand from '../lib/browser/onCommand.js';
import ContextMenuItem from '../lib/ContextMenuItem.js';
import getActiveTab from '../lib/browser/getActiveTab.js';
import openTabsEditor from './openTabsEditor.js';

new ContextMenuItem({
	id: 'export_current_window',
	contexts: ['browser_action'],
	onclick: (_, tab) => openTabsEditor(tab, true),
});
onCommand('export_current_window', () => getActiveTab().then(tab => openTabsEditor(tab, true)));
