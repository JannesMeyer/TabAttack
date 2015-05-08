var defaults = {
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
};

if (typeof chrome !== 'undefined') {
	var Preferences = require('chrome-tool/Preferences');
	var prefs = new Preferences(defaults);
} else {
	var prefs = {
		get() {
			return defaults;
		},
		getAll() {
			return defaults;
		}
	};
}

export default prefs;