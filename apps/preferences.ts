import Preferences from '../lib/browser/Preferences.js';

const prefs = new Preferences({
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
});
export type Prefs = typeof prefs.defaults;
export default prefs;
