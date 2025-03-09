import Preferences from './lib/browser/Preferences';
import { BrowserAction } from './types';

export const localPrefs = new Preferences({
	/** Like first parameter of browser.windows.create() */
	popupWindow: {
		width: 300,
		height: 600,
		top: 0,
		left: 0,
	},
}, chrome.storage.local);

export const syncPrefs = new Preferences({
	action: BrowserAction.Dropdown,
	format: 'markdown',
	domainBlacklist: [
		'mail.google.com',
		'web.whatsapp.com',
		'teams.microsoft.com',
		'open.spotify.com',
	],
	ignorePinned: true,
	chromiumIconColor: '#000000',
	editorTheme: 'katzenmilch',
	editorThemeDarkMode: 'chaos',
	showCopyLinkAsMarkdown: true,
	showCopyPageAsMarkdown: false,
});
