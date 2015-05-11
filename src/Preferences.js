var defaults = {
	format: 'markdown',
	protocolBlacklist: [
		'chrome:',
		'chrome-extension:',
		'chrome-devtools:',
		'opera:',
		'resource:',
		'about:'
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
			if (arguments.length === 1) {
				return Promise.resolve(defaults[arguments[0]]);
			} else {
				return Promise.resolve(defaults);
			}
		},
		getAll() {
			return Promise.resolve(defaults);
		}
	};
}

export default prefs;