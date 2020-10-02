import Preferences from './lib/Preferences.js';

const prefs = new Preferences({
	format: 'markdown',
	protocolBlacklist: [
		'about:',
		'extension:',
		'moz-extension:',
		'chrome:',
		'chrome-extension:',
		'chrome-devtools:',
		'opera:',
	],
	domainBlacklist: [
		'mail.google.com',
		'web.whatsapp.com',
		'teams.microsoft.com',
		'open.spotify.com',
	],
	ignorePinned: true,
	editorTheme: 'katzenmilch',
	showCopyLinkAsMarkdown: true,
	showCopyPageAsMarkdown: false,
});
export type Prefs = typeof prefs.defaults;
export default prefs;
