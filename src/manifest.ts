import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { version } from '../package.json';
import { BrowserAction } from './types';

const isFirefox = process.env.TARGET === 'firefox';
const manifest: chrome.runtime.ManifestV3 = {
	manifest_version: 3,
	version,
	name: '__MSG_ext_name__',
	description: '__MSG_ext_description__',
	default_locale: 'en',
	background: isFirefox
		? ({ scripts: ['background.js'] } satisfies chrome.runtime.ManifestV2['background'] as any)
		: { service_worker: 'background.js' },
	options_ui: { page: 'options.html' },
	action: {
		default_icon: 'icons/transparent.png',
		default_title: '__MSG_ext_name__',
		default_popup: `newtab.html?t=${BrowserAction.Dropdown}`,
	},
	chrome_settings_overrides: isFirefox ? { homepage: 'newtab.html' } : undefined,
	chrome_url_overrides: { newtab: 'newtab.html' },
	permissions: ['tabs', 'storage', 'clipboardWrite', 'contextMenus', 'activeTab'],
	icons: {
		48: 'icons/icon-48.png',
		96: 'icons/icon-96.png',
	},
	sidebar_action: isFirefox
		? {
			default_icon: 'icons/firefox/tab.svg',
			default_title: 'Tabs',
			default_panel: `newtab.html?t=${BrowserAction.Sidebar}`,
			browser_style: false,
			open_at_install: false,
		}
		: undefined,
	commands: {
		_execute_action: {
			suggested_key: { default: 'Ctrl+Shift+E' },
			description: 'Show popup',
		},
		_execute_sidebar_action: {
			suggested_key: { default: 'MacCtrl+T' },
			description: 'Show sidebar',
		},
		copy_tab_as_markdown: {
			description: '__MSG_shortcut_copy_tab_as_markdown__',
		},
		move_tab_left: {
			suggested_key: { default: 'Ctrl+Shift+Comma' },
			description: '__MSG_shortcut_move_tab_left__',
		},
		move_tab_right: {
			suggested_key: { default: 'Ctrl+Shift+Period' },
			description: '__MSG_shortcut_move_tab_right__',
		},
		duplicate_tab: {
			description: '__MSG_shortcut_duplicate_tab__',
		},
		pin_tab: {
			description: '__MSG_shortcut_pin_tab__',
		},
	},
	key: isFirefox
		? undefined
		: 'TODO',
	browser_specific_settings: isFirefox
		? {
			gecko: { id: 'tabattack@jannesmeyer.com' },
		}
		: undefined,
};

writeFile(path.join(import.meta.dir, '../dist/manifest.json'), JSON.stringify(manifest, undefined, 2));
