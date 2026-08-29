import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { version } from '../package.json';
import type { ActionType } from './lib/Theme';

export type Command = Exclude<keyof typeof manifest['commands'], `_${string}`>;

const target = process.env.TARGET as 'chrome' | 'firefox' | 'safari';
const sidebar = `newtab.html?t=${'sidebar' satisfies ActionType}`;
const manifest = {
	manifest_version: 3,
	version,
	name: '__MSG_ext_name__',
	description: '__MSG_ext_description__',
	default_locale: 'en',
	background: target === 'firefox' || target === 'safari'
		? ({ scripts: ['background.js'], type: 'module' } as any)
		: { service_worker: 'background.js', type: 'module' },
	options_ui: { page: 'options.html' },
	action: {
		default_icon: 'icons/' + (target === 'firefox' ? 'transparent.png' : 'icon-48.png'),
		default_title: '__MSG_ext_name__',
		default_popup: `newtab.html?t=${'popup' satisfies ActionType}`,
	},
	chrome_settings_overrides: target === 'firefox' ? { homepage: 'newtab.html' } : undefined,
	chrome_url_overrides: { newtab: 'newtab.html' },
	permissions: target === 'firefox' ? ['tabs', 'storage'] : ['tabs', 'storage', 'favicon', 'sidePanel'],
	icons: {
		48: 'icons/icon-48.png',
		96: 'icons/icon-96.png',
	},
	sidebar_action: target === 'firefox'
		? {
			default_icon: 'icons/transparent.png',
			default_title: 'Tabs',
			default_panel: sidebar,
			browser_style: false,
			open_at_install: false,
		} satisfies browser._manifest._WebExtensionManifestSidebarAction
		: undefined,
	side_panel: target === 'chrome' ? { default_path: sidebar } : undefined,
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
	key: target === 'firefox' ? undefined : 'TODO',
	browser_specific_settings: target === 'firefox' ? { gecko: { id: 'tabattack@jannesmeyer.com' } } : undefined,
} satisfies chrome.runtime.ManifestV3;

writeFile(path.join(import.meta.dirname, '../dist/manifest.json'), JSON.stringify(manifest, undefined, 2));
