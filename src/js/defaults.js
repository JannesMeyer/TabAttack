Chrome.setDefaults({
	format: 'markdown',
	protocolBlacklist: [ 'chrome-devtools:', 'chrome:', 'chrome-extension:', 'opera:' ],
	domainBlacklist: [ 'mail.google.com', 'inbox.google.com' ],
	ignorePinned: false,
	editorTheme: 'katzenmilch',
	showCopyLinkAsMarkdown: true,
	showCopyPageAsMarkdown: false
});