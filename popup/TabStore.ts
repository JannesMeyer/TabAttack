import assert from '../lib/assert.js';
import logError from '../lib/logError.js';
import requireValues from '../lib/requireValues.js';
import bt = browser.tabs;
import bw = browser.windows;

type OnTabRemoved = Parameters<typeof bt.onRemoved.addListener>[0];
type OnTabUpdated = Parameters<typeof bt.onUpdated.addListener>[0];
type OnTabActivated = Parameters<typeof bt.onActivated.addListener>[0];

export type TWindow = ReturnType<typeof TabStore.convertWindow>;
export interface TTab extends ReturnType<typeof TabStore.convertTab> {}

class TabStore {

	listeners = new Set<() => void>();

	private windows = new Map<number, TWindow>();

	static convertWindow(wndw: bw.Window) {
		let { id, type, state, focused, tabs } = requireValues(wndw, 'id', 'type', 'state');
		assert(id !== bw.WINDOW_ID_NONE);
		
		// TODO: last focused
		return {
			id,
			type,
			state,
			focused,
			tabListVersion: 0,
			activeTabId: tabs?.filter(t => t.active).single().id,
		};
	}
	
	private tabs = new Map<number, TTab>();

	static convertTab(tab: bt.Tab) {
		return requireValues(tab, 'id', 'url', 'discarded', 'status', 'title', 'windowId');
		// TODO: remove "active" property
	}

	constructor() {
		this.loadAll().then(() => {
			// Event handlers
			bw.onCreated.addListener(this.handleWindowCreated);
			bw.onRemoved.addListener(this.handleWindowRemoved);
			bt.onCreated.addListener(this.handleTabCreated);
			bt.onRemoved.addListener(this.handleTabRemoved);
			bt.onActivated.addListener(this.handleTabActivated);
			try {
				// Firefox is the only browser that currently supports filters
				bt.onUpdated.addListener(this.handleTabUpdate, { properties: ['title', 'status', 'favIconUrl', 'discarded'] });
			} catch {
				bt.onUpdated.addListener(this.handleTabUpdate);
			}
		}).catch(logError);
	}

	dispose() {
		bw.onCreated.removeListener(this.handleWindowCreated);
		bw.onRemoved.removeListener(this.handleWindowRemoved);
		bt.onCreated.removeListener(this.handleTabCreated);
		bt.onRemoved.removeListener(this.handleTabRemoved);
		bt.onActivated.removeListener(this.handleTabActivated);
		bt.onUpdated.removeListener(this.handleTabUpdate);
	}

	private async loadAll() {
		let windows = await bw.getAll({ populate: true });
		this.windows = windows.map(TabStore.convertWindow).toMap(w => w.id);
		this.tabs = windows.flatMap(w => Array.from(w.tabs!.values(), TabStore.convertTab)).toMap(t => t.id);
		this.notify();
	}

	private handleWindowCreated = (w: bw.Window) => {
		let converted = TabStore.convertWindow(w);
		this.windows.set(converted.id, converted);
		this.notify();
	};

	private handleWindowRemoved = (windowId: number) => {
		assert(this.windows.delete(windowId));
		this.notify();
	};

	private handleTabCreated = (tab: bt.Tab) => {
		let x = TabStore.convertTab(tab);
		this.tabs.set(x.id, x);

		// Update tab list
		this.windows.getOrThrow(tab.windowId).tabListVersion++;
		
		this.notify();
	};

	private handleTabRemoved: OnTabRemoved = (tabId, { windowId, isWindowClosing }) => {
		assert(this.tabs.delete(tabId));

		// Update tab list
		this.windows.getOrThrow(windowId).tabListVersion++;

		!isWindowClosing && this.notify();
	};

	/**
	 * When the active tab in a window changes
	 */
	private handleTabActivated: OnTabActivated = ({ tabId, windowId }) => {
		let w = this.windows.getOrThrow(windowId);
		// TODO: manually update lastAccessed
		// TODO: update selectedTabId
		w.activeTabId = tabId;
		this.notify();
	};

	/**
	 * Informs us whenever a tab property updates
	 */
	private handleTabUpdate: OnTabUpdated = (tabId, info, fullTab) => {
		// w.tabs.set(tabId, convertTab(fullTab));
		let tab = this.tabs.getOrThrow(tabId);
		Object.assign(tab, info);
		tab.lastAccessed = fullTab.lastAccessed;
		this.notify();
	};

	private notify() {
		for (let listener of this.listeners) {
			listener();
		}
	}

	getWindows(): ReadonlyMap<number, Readonly<TWindow>> {
		return this.windows;
	}

	getTabs(): ReadonlyMap<number, Readonly<TTab>> {
		return this.tabs;
	}
}

export default new TabStore;
