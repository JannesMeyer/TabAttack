import assert from '../../lib/assert.js';
import requireValues from '../../lib/requireValues.js';
import bt = browser.tabs;
import bw = browser.windows;

const debug = false;

function log(...params: unknown[]) {
	debug && console.log(params.map(x => typeof x === 'object' ? JSON.stringify(x, undefined, '  ') : x).join(' '));
}

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

	static convertWindow(wndw: bw.Window, allTabs: Iterable<TTab>) {
		let { id, type, state, focused, incognito, ...w } = requireValues(wndw, 'id', 'type', 'state');
		assert(id !== bw.WINDOW_ID_NONE);
		let tabs: TTab[] = [];
		for (let t of w.tabs?.map(TabStore.convertTab) ?? Array.from(allTabs).filter(t => t.windowId === id)) {
			// Index is only the initial index. It is never updated
			tabs[t.index] = t;
		}
		return {
			id,
			type,
			state,
			focused,
			incognito,
			focusOrder: id,
			tabs,
			activeTabId: tabs.find(t => t.active)?.id,
		};
	}
	
	private tabs = new Map<number, TTab>();

	static convertTab(tab: bt.Tab) {
		return requireValues(tab, 'id', 'url', 'status', 'title', 'windowId');
		// TODO: remove "active" property
	}

	async init(observeFocus: boolean, focusedWindowId?: number) {
		let windows = await bw.getAll({ populate: true });
		this.windows = windows.map(w => TabStore.convertWindow(w, this.tabs.values())).toMap(w => w.id);
		this.tabs = Array.from(this.windows.values(), w => w.tabs).flat().toMap(t => t.id);

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
		log('window created', w.id);
		let converted = TabStore.convertWindow(w, this.tabs.values());
		this.windows.set(converted.id, converted);
		this.notify();
	};

	private handleWindowRemoved = (windowId: number) => {
		log('window closed', windowId);
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

	private handleTabCreated = (t: bt.Tab) => {
		log('tab created', t.id);
		let tab = TabStore.convertTab(t);
		this.tabs.set(tab.id, tab);

		
		let w = this.windows.get(t.windowId);
		if (w == null) {
			// In Firefox the tabCreated event fires before windowCreated, so the window properties
			// are not known yet
			return;
		}
		if (w.tabs[t.index]?.id === t.id) {
			// This tab could already be in the array, if the windowCreated event fired first
			return;
		}

		// Update tab list
		w.tabs = w.tabs.slice();
		w.tabs.splice(t.index, 0, tab);
		this.notify();
	};

	private handleTabRemoved: OnTabRemoved = (tabId, { windowId, isWindowClosing }) => {
		log('tab closed', tabId);
		assert(this.tabs.delete(tabId));

		// Update tab list
		if (isWindowClosing) {
			return;
		}
		let w = this.windows.getOrThrow(windowId);
		w.tabs = w.tabs.filter(t => t.id !== tabId);
		this.notify();
	};

	private handleTabDetached: OnTabDetached = (tabId, { oldWindowId }) => {
		log('tab detached', tabId);
		let tab = this.tabs.getOrThrow(tabId);
		tab.windowId = bw.WINDOW_ID_NONE;

		// Update tab list
		let w = this.windows.getOrThrow(oldWindowId);
		let tabs = w.tabs.filter(t => t.id !== tabId);
		assert(tabs.length === w.tabs.length - 1);
		w.tabs = tabs;
		this.notify();
	};
	
	private handleTabAttached: OnTabAttached = (tabId, { newWindowId, newPosition }) => {
		log('tab attached', tabId);
		let tab = this.tabs.getOrThrow(tabId);
		tab.windowId = newWindowId;

		// Update tab list
		let w = this.windows.getOrThrow(newWindowId);
		w.tabs = w.tabs.slice();
		w.tabs.splice(newPosition, 0, tab);
		this.notify();
	};

	private handleTabMoved: OnTabMoved = (tabId, { windowId, fromIndex, toIndex }) => {
		log('tab moved', tabId);
		// Update list
		let w = this.windows.getOrThrow(windowId);
		let tab = w.tabs[fromIndex];
		assert(tab?.id === tabId);
		w.tabs = w.tabs.slice().moveItem(fromIndex, toIndex);
		this.notify();
	};

	/**
	 * When the active tab in a window changes
	 */
	private handleTabActivated: OnTabActivated = ({ tabId, windowId }) => {
		let w = this.windows.get(windowId);
		if (w == null) {
			// It is possible that this event fires before windowCreate
			return;
		}
		// TODO: update selectedTabId
		w.activeTabId = tabId;
		this.notify();
	};

	/**
	 * Informs us whenever a tab property updates
	 */
	private handleTabUpdate: OnTabUpdated = (tabId, info, fullTab) => {
		log('tab update', tabId, info);
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

	focusPreviousWindow() {
		return bw.update(this.lastFocused, { focused: true });
	}
}

export default new TabStore;
