import Preferences from "./lib/Preferences";

const prefs = new Preferences({
	format: 'markdown',
	protocolBlacklist: [
		'chrome:',
		'chrome-extension:',
		'chrome-devtools:',
		'opera:'
	],
	domainBlacklist: [
		'mail.google.com',
		'inbox.google.com',
		'www.facebook.com',
		'web.whatsapp.com',
		'play.spotify.com',
		'grooveshark.com'
	],
	ignorePinned: true,
	editorTheme: 'katzenmilch',
	showCopyLinkAsMarkdown: true,
	showCopyPageAsMarkdown: false
});
export type Prefs = typeof prefs.defaults;
export default prefs;