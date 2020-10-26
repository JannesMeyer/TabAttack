import assert from '../../lib/assert.js';
import requireValues from '../../lib/requireValues.js';
import bt = browser.tabs;
import bw = browser.windows;

type OnTabRemoved = Parameters<typeof bt.onRemoved.addListener>[0];
type OnTabUpdated = Parameters<typeof bt.onUpdated.addListener>[0];
type OnTabActivated = Parameters<typeof bt.onActivated.addListener>[0];
type OnTabDetached = Parameters<typeof bt.onDetached.addListener>[0];
type OnTabAttached = Parameters<typeof bt.onAttached.addListener>[0];
type OnTabMoved = Parameters<typeof bt.onMoved.addListener>[0];

export interface TWindow extends ReturnType<typeof TabStore.convertWindow> {}
export interface TTab extends ReturnType<typeof TabStore.convertTab> {}

class TabStore {

	listeners = new Set<() => void>();

	private lastFocused = bw.WINDOW_ID_NONE;

	private windows = new Map<number, TWindow>();

	static convertWindow(wndw: bw.Window) {
		let { id, type, state, focused, tabs, incognito } = requireValues(wndw, 'id', 'type', 'state');
		assert(id !== bw.WINDOW_ID_NONE);
		return {
			id,
			type,
			state,
			focused,
			incognito,
			focusOrder: id,
			tabListVersion: 0,
			activeTabId: tabs?.filter(t => t.active).single().id,
		};
	}
	
	private tabs = new Map<number, TTab>();

	static convertTab(tab: bt.Tab) {
		return requireValues(tab, 'id', 'url', 'status', 'title', 'windowId');
		// TODO: remove "active" property
	}

	async init(observeFocus: boolean, focusedWindowId?: number) {
		let windows = await bw.getAll({ populate: true });
		this.windows = windows.map(TabStore.convertWindow).toMap(w => w.id);
		this.tabs = windows.flatMap(w => w.tabs?.map(TabStore.convertTab) ?? []).toMap(t => t.id);

		// Event handlers
		bw.onCreated.addListener(this.handleWindowCreated);
		bw.onRemoved.addListener(this.handleWindowRemoved);
		observeFocus && bw.onFocusChanged.addListener(this.handleWindowFocusChanged);
		bt.onCreated.addListener(this.handleTabCreated);
		bt.onDetached.addListener(this.handleTabDetached);
		bt.onAttached.addListener(this.handleTabAttached);
		bt.onMoved.addListener(this.handleTabMoved);
		bt.onRemoved.addListener(this.handleTabRemoved);
		bt.onActivated.addListener(this.handleTabActivated);
		try {
			// Firefox is the only browser that currently supports filters
			bt.onUpdated.addListener(this.handleTabUpdate, { properties: ['title', 'status', 'favIconUrl', 'discarded', 'audible', 'mutedInfo'] });
		} catch {
			bt.onUpdated.addListener(this.handleTabUpdate);
		}

		// Set last focused window
		this.handleWindowFocusChanged(focusedWindowId);
	}

	dispose() {
		bw.onCreated.removeListener(this.handleWindowCreated);
		bw.onRemoved.removeListener(this.handleWindowRemoved);
		bw.onFocusChanged.removeListener(this.handleWindowFocusChanged);
		bt.onCreated.removeListener(this.handleTabCreated);
		bt.onDetached.removeListener(this.handleTabDetached);
		bt.onAttached.removeListener(this.handleTabAttached);
		bt.onMoved.removeListener(this.handleTabMoved);
		bt.onRemoved.removeListener(this.handleTabRemoved);
		bt.onActivated.removeListener(this.handleTabActivated);
		bt.onUpdated.removeListener(this.handleTabUpdate);
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

	private handleWindowFocusChanged = (windowId: number | undefined) => {
		if (windowId === bw.WINDOW_ID_NONE) {
			return;
		}
		let w = this.windows.get(windowId);
		if (w == null || w.type !== 'normal') {
			return;
		}
		w.focusOrder = Date.now();

		// Notify if different
		if (this.lastFocused !== w.id) {
			this.lastFocused = w.id;
			this.notify();
		}
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

	private handleTabDetached: OnTabDetached = (id, { oldWindowId }) => {
		let tab = this.tabs.getOrThrow(id);
		tab.windowId = bw.WINDOW_ID_NONE;

		// Update tab list
		this.windows.getOrThrow(oldWindowId).tabListVersion++;
		this.notify();
	};
	
	private handleTabAttached: OnTabAttached = (id, { newWindowId, newPosition }) => {
		let tab = this.tabs.getOrThrow(id);
		tab.windowId = newWindowId;
		tab.index = newPosition;

		// Update tab list
		this.windows.getOrThrow(newWindowId).tabListVersion++;
		this.notify();
	};

	private handleTabMoved: OnTabMoved = (tabId, { toIndex, windowId }) => {
		let tab = this.tabs.getOrThrow(tabId);
		tab.index = toIndex;

		// Update list
		this.windows.getOrThrow(windowId).tabListVersion++;
		this.notify();
	};

	/**
	 * When the active tab in a window changes
	 */
	private handleTabActivated: OnTabActivated = ({ tabId, windowId }) => {
		let w = this.windows.getOrThrow(windowId);
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

	getTabsForWindow(windowId: number) {
		return Array.from(this.tabs.values()).filter(t => t.windowId === windowId);
	}
	
	focusPreviousWindow() {
		browser.windows.update(this.lastFocused, { focused: true });
	}
}

export default new TabStore;
