import assert from '../lib/assert.js';
import logError from '../lib/logError.js';

type RequireValues<T, K extends keyof T> = T & Required<Pick<T, K>>;

function requireValues<T, K extends keyof T>(obj: T, ...keys: K[]) {
	for (let k of keys) {
		if (obj[k] == null) {
			throw new Error(`Value for field ${k} is required`);
		}
	}
	return obj as RequireValues<T, K>;
}

export type TWindow = ReturnType<typeof convertWindow>;

function convertWindow(wndw: browser.windows.Window) {
	let { id, type, state, focused, tabs } = requireValues(wndw, 'id', 'type', 'state', 'tabs');
	assert(type === 'normal');
	assert(id !== browser.windows.WINDOW_ID_NONE);
	let ttabs: TTab[] = tabs.map(convertTab);
	// TODO: last focused
	return {
		id,
		state,
		focused,
		tabs: ttabs.toMap(t => t.id),
		activeTabId: ttabs.filter(t => t.active).single().id,
	};
}

export type TTab = ReturnType<typeof convertTab>;

function convertTab(tab: browser.tabs.Tab) {
	return requireValues(tab, 'id', 'url', 'discarded', 'status', 'title', 'windowId');
	// TODO: remove "active" property
}

type OnTabCreated = Parameters<typeof browser.tabs.onCreated.addListener>[0];
type OnTabRemoved = Parameters<typeof browser.tabs.onRemoved.addListener>[0];
type OnTabUpdated = Parameters<typeof browser.tabs.onUpdated.addListener>[0];
type OnTabActivated = Parameters<typeof browser.tabs.onActivated.addListener>[0];

export default class TabMirror {

	listeners = new Set<() => void>();
	private windows = new Map<number, TWindow>();
	private tabToWindowId = new Map<number, number>();

	constructor() {
		this.loadAll().then(() => {
			// Tab event handlers
			browser.windows.onCreated.addListener(w => {
				console.log('window created', w);
			});
			browser.tabs.onCreated.addListener(this.handleTabCreated);
			browser.tabs.onRemoved.addListener(this.handleTabRemoved);
			browser.tabs.onActivated.addListener(this.handleTabActivated);
			try {
				// Firefox is the only browser that currently supports filters
				browser.tabs.onUpdated.addListener(this.handleTabUpdate, { properties: ['title', 'status', 'favIconUrl', 'discarded'] });
			} catch {
				browser.tabs.onUpdated.addListener(this.handleTabUpdate);
			}
		}).catch(logError);
	}

	dispose() {
		browser.tabs.onCreated.removeListener(this.handleTabCreated);
		browser.tabs.onRemoved.removeListener(this.handleTabRemoved);
		browser.tabs.onActivated.removeListener(this.handleTabActivated);
		browser.tabs.onUpdated.removeListener(this.handleTabUpdate);
	}

	private async loadAll() {
		let windows = (await browser.windows.getAll({ windowTypes: ['normal'], populate: true })).map(convertWindow);
		this.windows = windows.toMap(w => w.id);
		this.tabToWindowId = windows.flatMap(w => Array.from(w.tabs.values())).toMap(t => t.id, t => t.windowId);
		this.notify();
	}

	private handleTabCreated: OnTabCreated = x => {
		let tab = convertTab(x);
		this.windows.getOrThrow(tab.windowId).tabs.set(tab.id, tab);
		this.tabToWindowId.set(tab.id, tab.windowId);
		this.notify();
	};

	private handleTabRemoved: OnTabRemoved = (tabId, { windowId, isWindowClosing }) => {
		let w = this.windows.get(windowId);
		if (w == null) {
			return; // Other windowType
		}
		assert(w.tabs.delete(tabId));
		assert(this.tabToWindowId.delete(tabId));
		if (isWindowClosing) {
			assert(this.windows.delete(windowId));
		}
		this.notify();
	};

	/**
	 * When the active tab in a window changes
	 */
	private handleTabActivated: OnTabActivated = ({ tabId, windowId }) => {
		let w = this.windows.get(windowId);
		if (w == null) {
			return; // Other windowType
		}
		// TODO: manually update lastAccessed
		// TODO: update selectedTabId
		w.activeTabId = tabId;
		this.notify();
	};

	/**
	 * Informs us whenever a tab property updates
	 */
	private handleTabUpdate: OnTabUpdated = (tabId, info, fullTab) => {
		let w = this.windows.get(fullTab.windowId);
		if (w == null) {
			return; // Other windowType
		}
		// w.tabs.set(tabId, convertTab(fullTab));
		let tab = w.tabs.getOrThrow(tabId);
		Object.assign(tab, info);
		tab.lastAccessed = fullTab.lastAccessed;
		this.notify();
	};

	private notify() {
		for (let listener of this.listeners) {
			listener();
		}
	}

	getWindows() {
		return this.windows.values();
	}
	
	findTab(tabId: number) {
		let windowId = this.tabToWindowId.getOrThrow(tabId);
		return this.windows.getOrThrow(windowId).tabs.getOrThrow(tabId);
	}
}
