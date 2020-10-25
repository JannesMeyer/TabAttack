import Preferences from '../lib/browser/Preferences.js';
import PopupType from './popup/PopupType.js';

export default new Preferences({
	browserAction: PopupType.ActionPopup,
	format: 'markdown',
	domainBlacklist: [
		'mail.google.com',
		'web.whatsapp.com',
		'teams.microsoft.com',
		'open.spotify.com',
	],
	ignorePinned: true,
	iconColor: '#000000',
	iconColorDarkMode: '#ffffff',
	editorTheme: 'katzenmilch',
	editorThemeDarkMode: 'chaos',
	showCopyLinkAsMarkdown: true,
	showCopyPageAsMarkdown: false,
}, 'sync');
