import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { version } from '../package.json';
import type { ActionType } from './popup/popup';

export type Command = Exclude<keyof typeof manifest['commands'], `_${string}`>;

const firefox = process.env.TARGET === 'firefox';
const manifest = {
	manifest_version: 3,
	version,
	name: '__MSG_ext_name__',
	description: '__MSG_ext_description__',
	default_locale: 'en',
	background: firefox
		? ({ scripts: ['background.js'], type: 'module' } as any)
		: { service_worker: 'background.js', type: 'module' },
	options_ui: { page: 'options.html' },
	action: {
		default_icon: 'icons/transparent.png',
		default_title: '__MSG_ext_name__',
		default_popup: `newtab.html?t=${'popup' satisfies ActionType}`,
	},
	chrome_settings_overrides: firefox ? { homepage: 'newtab.html' } : undefined,
	chrome_url_overrides: { newtab: 'newtab.html' },
	permissions: ['tabs', 'storage'],
	icons: {
		48: 'icons/icon-48.png',
		96: 'icons/icon-96.png',
	},
	sidebar_action: firefox
		? {
			default_icon: 'icons/transparent.png',
			default_title: 'Tabs',
			default_panel: `newtab.html?t=${'sidebar' satisfies ActionType}`,
			browser_style: false,
			open_at_install: false,
		}
		: undefined,
	commands: {
		_execute_action: {
			description: 'Show popup',
			suggested_key: { default: 'MacCtrl+E' },
		},
		_execute_sidebar_action: {
			description: 'Show sidebar',
			suggested_key: { default: 'MacCtrl+S' },
		},
		move_tab_left: {
			description: '__MSG_shortcut_move_tab_left__',
		},
		move_tab_right: {
			description: '__MSG_shortcut_move_tab_right__',
		},
		duplicate_tab: {
			description: '__MSG_shortcut_duplicate_tab__',
			suggested_key: { default: 'MacCtrl+D' },
		},
		pin_tab: {
			description: '__MSG_shortcut_pin_tab__',
		},
	},
	key: firefox
		? undefined
		: 'TODO',
	browser_specific_settings: firefox
		? {
			gecko: { id: 'tabattack@jannesmeyer.com' },
		}
		: undefined,
} satisfies chrome.runtime.ManifestV3;

writeFile(path.join(import.meta.dirname, '../dist/manifest.json'), JSON.stringify(manifest, undefined, 2));
