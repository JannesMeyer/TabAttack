import { proxy } from 'valtio';
import { proxyMap, proxySet } from 'valtio/utils';
import { throwError } from '../lib/throwError';

type Window = Required<Pick<chrome.windows.Window, 'id' | 'type' | 'incognito'>>;
type Tab = ReturnType<typeof createTab>;

const properties = [
	'url',
	'status',
	'title',
	'mutedInfo',
	'discarded',
	'audible',
	'favIconUrl',
	'pinned',
	'attention',
] satisfies (keyof browser.tabs.Tab)[];

function createTab(tab: Pick<browser.tabs.Tab, (typeof properties)[number]>) {
	return {
		url: tab.url ?? throwError('missing url'),
		status: tab.status ?? throwError('missing status'),
		title: tab.title ?? throwError('missing title'),
		mutedInfo: tab.mutedInfo,
		discarded: tab.discarded,
		audible: tab.audible,
		favIconUrl: tab.favIconUrl,
		pinned: tab.pinned,
		attention: tab.attention,
	};
}

export class TabStore {
	state = proxy({
		initialWindowId: undefined as number | undefined,
		windows: proxyMap<number, Window>(),
		tabs: proxyMap<number, Tab>(),
		tabOrder: proxyMap<number, (number | undefined)[]>(),
		activeTabs: proxyMap<number, number>(),
		selectedTabIds: proxySet<number>(),
		lastSelectedTabId: undefined as number | undefined,
	});

	toggleTabSelection(tabId: number, isSelected?: boolean) {
		const willSelect = isSelected ?? !this.state.selectedTabIds.has(tabId);
		if (willSelect) {
			this.state.selectedTabIds.add(tabId);
			this.state.lastSelectedTabId = tabId;
		} else {
			this.state.selectedTabIds.delete(tabId);
			if (this.state.lastSelectedTabId === tabId) {
				this.state.lastSelectedTabId = undefined;
			}
		}
	}

	selectTabRange(windowId: number, toTabId: number) {
		const order = this.state.tabOrder.get(windowId);
		if (!order || order.length === 0) {
			return;
		}
		const toIndex = order.indexOf(toTabId);
		if (toIndex === -1) {
			return;
		}
		const fromId = this.state.lastSelectedTabId;
		const fromIndex = fromId != null ? order.indexOf(fromId) : -1;
		const startIndex = fromIndex !== -1 ? Math.min(fromIndex, toIndex) : toIndex;
		const endIndex = fromIndex !== -1 ? Math.max(fromIndex, toIndex) : toIndex;

		for (let i = startIndex; i <= endIndex; i++) {
			const id = order[i];
			if (typeof id === 'number') {
				this.state.selectedTabIds.add(id);
			}
		}
		this.state.lastSelectedTabId = toTabId;
	}

	selectAllTabs(windowId: number) {
		const order = this.state.tabOrder.get(windowId);
		if (!order) {
			return;
		}
		for (const id of order) {
			if (typeof id === 'number') {
				this.state.selectedTabIds.add(id);
			}
		}
	}

	clearSelection() {
		this.state.selectedTabIds.clear();
		this.state.lastSelectedTabId = undefined;
	}

	constructor() {
		if (typeof chrome !== 'undefined') {
			chrome.windows.onCreated.addListener(({ id = throwError(), type = throwError(), incognito, tabs }) => {
				// console.debug('window created', id);
				this.state.windows.set(id, { id, type, incognito });
				if (tabs) {
					this.state.tabOrder.set(id, tabs.map(t => t.id));
				}
			});

			chrome.windows.onRemoved.addListener(id => {
				// console.debug('window removed', id);
				this.state.windows.delete(id);
				this.state.tabOrder.delete(id);
			});

			chrome.tabs.onCreated.addListener(tab => {
				const id = tab.id ?? throwError();
				// console.debug('tab created', id);
				this.state.tabs.set(id, createTab(tab));
				getOrInsert(this.state.tabOrder, tab.windowId, []).splice(tab.index, 0, id);
			});

			chrome.tabs.onRemoved.addListener((tabId, info) => {
				// console.debug('tab removed', tabId, info);
				this.state.tabs.delete(tabId);
				this.state.selectedTabIds.delete(tabId);
				if (this.state.lastSelectedTabId === tabId) {
					this.state.lastSelectedTabId = undefined;
				}
				const tabOrder = this.state.tabOrder.get(info.windowId);
				if (!info.isWindowClosing && tabOrder) {
					tabOrder.splice(tabOrder.indexOf(tabId), 1);
				}
			});

			chrome.tabs.onDetached.addListener((tabId, info) => {
				// console.debug('tab detached', tabId, info);
				const tabOrder = this.state.tabOrder.get(info.oldWindowId) ?? throwError();
				this.state.tabOrder.set(info.oldWindowId, tabOrder.filter(id => id !== tabId));
			});

			chrome.tabs.onAttached.addListener((tabId, info) => {
				// console.debug('tab attached', tabId, info);
				const tabOrder = this.state.tabOrder.get(info.newWindowId) ?? [];
				this.state.tabOrder.set(info.newWindowId, tabOrder.toSpliced(info.newPosition, 0, tabId));
			});

			chrome.tabs.onMoved.addListener((_, info) => {
				// console.debug('tab moved', _, info);
				this.state.tabOrder.set(info.windowId, moveItem(this.state.tabOrder.get(info.windowId) ?? throwError(), info.fromIndex, info.toIndex));
			});

			chrome.tabs.onActivated.addListener(({ windowId, tabId }) => {
				this.state.activeTabs.set(windowId, tabId);
			});

			chrome.tabs.onUpdated.addListener((tabId, info) => {
				const tab = this.state.tabs.get(tabId) ?? throwError();
				for (const [key, value] of Object.entries(info)) {
					if (Object.hasOwn(tab, key)) {
						(tab as any)[key] = value;
					}
				}
			});

			chrome.windows.getAll({ populate: true }).then((windows) => {
				for (const { id = throwError(), type = throwError(), incognito, tabs = [] } of windows) {
					this.state.windows.set(id, { id, type, incognito });
					this.state.tabOrder.set(id, tabs.map(t => t.id));
					for (const t of tabs) {
						const tabId = t.id ?? throwError();
						const tab = createTab(t);
						this.state.tabs.set(tabId, tab);
						if (t.active) {
							this.state.activeTabs.set(id, tabId);
						}
					}
				}
			});
			chrome.windows.getCurrent().then(({ id }) => this.state.initialWindowId = id);
		}
	}
}

// Native getOrInsert is not supported by valtio yet
function getOrInsert<K, V>(map: Map<K, V>, key: K, defaultValue: V) {
	let value = map.get(key);
	if (value == null) {
		map.set(key, value = defaultValue);
	}
	return value;
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
