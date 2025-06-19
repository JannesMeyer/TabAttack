import React from 'react';
import { throwError } from '../lib/throwError';
import { BrowserAction } from '../types';

export type TWindow = Readonly<{
	id: number;
	type: chrome.windows.windowTypeEnum;
	incognito: boolean;
	activeTabId: number | undefined;
	tabs: readonly number[];
	tabsOverlay?: readonly number[];
}>;

export type TTab = Readonly<{
	id: number;
	url: string;
	status: string;
	title: string;
	initialWindowId: number;
	mutedInfo: chrome.tabs.MutedInfo | undefined;
	discarded: boolean;
	audible: boolean | undefined;
	favIconUrl: string | undefined;
	pinned: boolean;
	attention: boolean | undefined;
	cookieStoreId: string | undefined;
}>;

export class TabStore {
	public readonly type: BrowserAction;
	public affinity: { tabId?: number; windowId?: number } = {};

	private windows = new Map<number, TWindow>();
	// private windowIdOffset = 0;
	public windowList: TWindow[] = [];
	readonly windowListeners = new Set<() => void>();
	private windowSubscribe = (onChange: () => void) => {
		this.windowListeners.add(onChange);
		return () => this.windowListeners.delete(onChange);
	};

	private tabs = new Map<number, TTab>();
	private tabListeners = new Set<(tabId: number) => void>();

	constructor(type: BrowserAction) {
		this.type = type;

		addEventListener('storage', (event: StorageEvent) => {
			if (event.key === 'windows') {
				this.notifyWindows();
			}
		});

		chrome.windows.onCreated.addListener((w) => {
			this.saveWindow(w);
			this.notifyWindows();
		});

		chrome.windows.onRemoved.addListener((windowId) => {
			this.windows.delete(windowId);
			this.notifyWindows();
		});

		chrome.tabs.onCreated.addListener((t) => {
			const tab = createTab(t);
			this.tabs.set(tab.id, tab);
			const window = this.windows.get(tab.initialWindowId);
			if (!window) {
				return; // Fires before window.onCreated
			}
			this.setWindow({ ...window, tabs: window.tabs.toSpliced(t.index, 0, tab.id), tabsOverlay: undefined });
			this.notifyWindows();
		});

		chrome.tabs.onRemoved.addListener((tabId, { isWindowClosing, windowId }) => {
			this.tabs.delete(tabId);
			if (!isWindowClosing) {
				const window = this.getWindow(windowId);
				this.setWindow({ ...window, tabs: window.tabs.filter(id => id !== tabId), tabsOverlay: undefined });
				this.notifyWindows();
			}
		});

		chrome.tabs.onDetached.addListener((tabId, { oldWindowId }) => {
			const window = this.getWindow(oldWindowId);
			this.setWindow({ ...window, tabs: window.tabs.filter(id => id !== tabId), tabsOverlay: undefined });
			this.notifyWindows();
		});

		chrome.tabs.onAttached.addListener((tabId, { newWindowId, newPosition }) => {
			const tab = this.tabs.get(tabId) ?? throwError();
			const window = this.getWindow(newWindowId);
			this.setWindow({ ...window, tabs: window.tabs.toSpliced(newPosition, 0, tab.id), tabsOverlay: undefined });
			this.notifyWindows();
		});

		chrome.tabs.onMoved.addListener((_, { windowId, fromIndex, toIndex }) => {
			const window = this.getWindow(windowId);
			this.setWindow({ ...window, tabs: moveItem(window.tabs, fromIndex, toIndex), tabsOverlay: undefined });
			this.notifyWindows();
		});

		chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
			const window = this.windows.get(windowId);
			if (!window) {
				return; // Fires before window.onCreated
			}
			this.setWindow({ ...window, activeTabId: tabId });
			this.notifyWindows();
		});

		chrome.tabs.onUpdated.addListener((tabId, info) => {
			const tab = this.tabs.get(tabId) ?? throwError();
			let updated = false;
			for (const [key, value] of Object.entries(info)) {
				if (tab.hasOwnProperty(key)) {
					(tab as any)[key] = value;
					updated = true;
				}
			}
			if (updated) {
				this.notifyTabs(tabId);
			}
		});

		this.load();
	}

	public getActiveWindowId() {
		const { windowId, tabId } = this.affinity;
		if (windowId != null) {
			return windowId;
		}
		if (tabId != null) {
			return this.windows.values().find(w => w.tabs.includes(tabId))?.id;
		}
		return;
	}

	private async load() {
		const windows = await chrome.windows.getAll({ populate: true });
		this.windows.clear();
		this.tabs.clear();
		// this.windowIdOffset = Math.min(...windows.map(w => w.id).filter(isDefined));
		for (const w of windows) {
			this.saveWindow(w);
			const tabs = w.tabs ?? throwError('missing tabs');
			for (const t of tabs) {
				const tab = createTab(t);
				this.tabs.set(tab.id, tab);
				if (this.type === BrowserAction.Tab && w.focused && t.active) {
					this.affinity = { tabId: tab.id };
				}
			}
		}
		this.notifyWindows();
	}

	private saveWindow(window: chrome.windows.Window) {
		const { id = throwError(), type = throwError(), incognito } = window;
		if (this.type !== BrowserAction.Tab && window.focused) {
			this.affinity = { windowId: id };
		}
		const activeTabId = window.tabs?.find(t => t.active)?.id;
		const tabs: readonly number[] = window.tabs?.map(t => t.id ?? throwError())
			?? this.tabs.values().filter(t => t.initialWindowId === id).map(t => t.id).toArray();
		return this.setWindow({ id, type, incognito, activeTabId, tabs });
	}

	private getWindow(windowId: number) {
		return this.windows.get(windowId) ?? throwError(`Window ${windowId} not found`);
	}

	private setWindow(window: TWindow) {
		this.windows.set(window.id, window);
		return window;
	}

	private notifyWindows() {
		const order = localStorage.getItem('windows')?.split(',').map(Number) ?? [];
		this.windowList = this.windows.values().filter(w => w.type === 'normal').toArray().sort((a, b) =>
			((order.indexOf(a.id) + 1) || Number.MAX_SAFE_INTEGER)
			- ((order.indexOf(b.id) + 1) || Number.MAX_SAFE_INTEGER)
		);
		this.windowListeners.forEach(listener => listener());
	}

	private notifyTabs(tabId: number) {
		this.tabListeners.forEach(listener => listener(tabId));
	}

	moveWindow({ sourceIndex, targetIndex }: { sourceIndex: number; targetIndex: number }) {
		const { windowList } = this;
		windowList.splice(targetIndex, 0, ...windowList.splice(sourceIndex, 1));
		localStorage['windows'] = windowList.map(w => w.id).toString();
	}

	moveTab(data: { tabId: number; sourceWindowId: number; targetWindowId: number; sourceIndex: number; targetIndex: number }) {
		const source = this.getWindow(data.sourceWindowId);
		const sourceIndex = getTabs(source).length - 1 - data.sourceIndex;
		this.setWindow({ ...source, tabsOverlay: getTabs(source).toSpliced(sourceIndex, 1) });

		const target = this.getWindow(data.targetWindowId);
		const targetIndex = getTabs(target).length - data.targetIndex;
		this.setWindow({ ...target, tabsOverlay: getTabs(target).toSpliced(targetIndex, 0, data.tabId) });
		this.notifyWindows();

		chrome.tabs.move(data.tabId, { index: targetIndex, windowId: data.targetWindowId });
	}

	useWindows() {
		return React.useSyncExternalStore(this.windowSubscribe, () => this.windowList);
	}

	useTab(tabId: number) {
		const getValue = () => Object.assign({}, this.tabs.get(tabId)) ?? throwError();
		const [value, setValue] = React.useState(getValue);
		React.useEffect(() => {
			this.tabListeners.add(callback);
			return () => {
				this.tabListeners.delete(callback);
			};
			function callback(id: number) {
				if (id === tabId) {
					setValue(getValue());
				}
			}
		}, []);
		return value;
	}
}

function moveItem<T>(array: readonly T[], fromIndex: number, toIndex: number) {
	const copy = array.slice();
	const removed = copy.splice(fromIndex, 1);
	if (removed.length === 0) {
		throw new Error(`No item at index ${fromIndex}`);
	}
	copy.splice(toIndex, 0, removed[0]!);
	return copy;
}

export function getTabs(window: TWindow) {
	return window.tabsOverlay ?? window.tabs;
}

function createTab(tab: chrome.tabs.Tab): TTab {
	return {
		id: tab.id ?? throwError('missing id'),
		url: tab.url ?? throwError('missing url'),
		status: tab.status ?? throwError('missing status'),
		title: tab.title ?? throwError('missing title'),
		initialWindowId: tab.windowId ?? throwError('missing windowId'),
		mutedInfo: tab.mutedInfo,
		discarded: tab.discarded,
		audible: tab.audible,
		favIconUrl: tab.favIconUrl,
		pinned: tab.pinned,
		attention: (tab as browser.tabs.Tab).attention,
		cookieStoreId: (tab as browser.tabs.Tab).cookieStoreId,
	};
}
