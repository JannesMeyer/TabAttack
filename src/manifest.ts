import { unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { version } from '../package.json';
import icon48 from './icons/icon-48.png';
import icon96 from './icons/icon-96.png';
import transparent from './icons/transparent.png';
import newtab from './newtab.html';
import options from './options.html';
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
	options_ui: { page: options },
	action: {
		default_icon: transparent,
		default_title: '__MSG_ext_name__',
	},
	chrome_settings_overrides: { homepage: newtab },
	chrome_url_overrides: { newtab },
	permissions: ['tabs', 'storage', 'clipboardWrite', 'contextMenus', 'activeTab'],
	icons: {
		48: icon48,
		96: icon96,
	},
	sidebar_action: isFirefox
		? {
			default_icon: 'icons/firefox/tab.svg',
			default_title: 'Tabs',
			default_panel: `${newtab}?t=${BrowserAction.Sidebar}`,
			browser_style: false,
			open_at_install: false,
		}
		: undefined,
	commands: {
		_execute_action: {
			suggested_key: { default: 'Ctrl+Shift+E' },
		},
		_execute_sidebar_action: {
			suggested_key: { default: 'MacCtrl+T' },
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

writeFile(path.join(import.meta.dir, 'manifest.json'), JSON.stringify(manifest, undefined, 2));
unlink(path.join(import.meta.dir, 'manifest.js'));
