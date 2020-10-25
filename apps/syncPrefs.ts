import Preferences from '../lib/browser/Preferences.js';

export default new Preferences({
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
