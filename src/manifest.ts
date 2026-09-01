import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { version } from '../package.json';
import type { ActionType } from './lib/Theme';

export type Command = Exclude<keyof typeof commands, `_${string}`>;

const target = process.env.TARGET as 'chrome' | 'firefox' | 'safari';
const sidebar = `newtab.html?t=${'sidebar' satisfies ActionType}`;

const commands = {
	_execute_action: {
		description: 'Show popup',
		suggested_key: {
			default: 'Ctrl+P',
			mac: 'MacCtrl+P',
		},
	},
	sidebar_action: {
		description: 'Show sidebar',
		suggested_key: {
			default: 'Ctrl+S',
			mac: 'MacCtrl+S',
		},
	},
	move_tab_left: {
		description: '__MSG_shortcut_move_tab_left__',
	},
	move_tab_right: {
		description: '__MSG_shortcut_move_tab_right__',
	},
	duplicate_tab: {
		description: '__MSG_shortcut_duplicate_tab__',
	},
	pin_tab: {
		description: '__MSG_shortcut_pin_tab__',
	},
} satisfies chrome.runtime.ManifestV3['commands'];

const manifest: chrome.runtime.ManifestV3 = {
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
	// Temporarily allow React DevTols
	// content_security_policy: {
	// 	extension_pages: "script-src 'self' http://localhost:8097; connect-src 'self' http://localhost:8097 ws://localhost:8097; object-src 'self'",
	// },
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
			open_at_install: false,
		} satisfies browser._manifest._WebExtensionManifestSidebarAction
		: undefined,
	side_panel: target === 'chrome' ? { default_path: sidebar } : undefined,
	commands,
};

if (target === 'firefox') {
	manifest.browser_specific_settings = {
		gecko: {
			id: 'tabattack@jannesmeyer.com',
			data_collection_permissions: {
				required: ['none'],
			},
		},
	} satisfies browser._manifest.BrowserSpecificSettings;
	manifest.commands = Object.fromEntries(Object.entries(commands).map(([k, v]) => [(k as Command) === 'sidebar_action' ? `_execute_${k}` : k, v]));
}

writeFile(path.join(import.meta.dirname, '../dist/manifest.json'), JSON.stringify(manifest, undefined, 2));
