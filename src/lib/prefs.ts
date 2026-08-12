import Preferences from './Preferences';

export const syncPrefs = new Preferences({
	domainBlacklist: [
		'mail.google.com',
		'web.whatsapp.com',
		'teams.microsoft.com',
		'open.spotify.com',
	],
	ignorePinned: true,
	chromiumIconColor: '#000000',
	showCopyLinkAsMarkdown: true,
	showCopyPageAsMarkdown: false,
});
