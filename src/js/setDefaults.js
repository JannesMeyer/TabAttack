import Chrome from './lib-chrome/Chrome';

Chrome.setDefaults({
	format: 'markdown',
	ignorePinned: false,
	protocolBlacklist: [ 'chrome-devtools:', 'chrome:', 'chrome-extension:', 'opera:' ],
	domainBlacklist: [ 'mail.google.com', 'inbox.google.com' ],
	editorTheme: 'kuroir'
});