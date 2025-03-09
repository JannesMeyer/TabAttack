import { throwError } from '../lib/throwError';

export class TabCounter {
	private ws = new Map<number, Set<number>>();

	readonly windows: ReadonlyMap<number, ReadonlySet<number>> = this.ws;

	readonly listeners = new Set<(windowId: number) => void>();

	constructor() {
		chrome.windows.getAll({ windowTypes: ['normal'], populate: true }, windows => {
			for (let w of windows) {
				const windowId = w.id ?? throwError();
				this.ws.set(windowId, new Set(w.tabs?.map(t => t.id ?? throwError())));
				this.notify(windowId);
			}
		});

		// Tab events
		chrome.tabs.onCreated.addListener(({ id, windowId }) => {
			this.addTab(windowId ?? throwError(), id ?? throwError());
		});
		chrome.tabs.onDetached.addListener((id, { oldWindowId }) => {
			this.removeTab(oldWindowId, id);
		});
		chrome.tabs.onAttached.addListener((id, { newWindowId }) => {
			this.addTab(newWindowId, id);
		});
		chrome.tabs.onRemoved.addListener((id, { windowId, isWindowClosing }) => {
			this.removeTab(windowId, id, isWindowClosing);
		});
		chrome.tabs.onReplaced.addListener((addedId, removedId) => {
			this.getWindowContainingTab(removedId).add(addedId).delete(removedId);
		});
	}

	private addTab(windowId: number, tabId: number) {
		let tabs = this.ws.get(windowId);
		if (tabs == null) {
			this.ws.set(windowId, tabs = new Set());
		}
		tabs.add(tabId);
		this.notify(windowId);
	}

	private removeTab(windowId: number, tabId: number, isWindowClosing = false) {
		if (isWindowClosing) {
			this.ws.delete(windowId);
			return;
		}
		let tabs = this.ws.get(windowId) ?? throwError();
		if (!tabs.delete(tabId)) {
			throw new Error(`${tabId} was not present in the window`);
		}
		if (tabs.size === 0) {
			this.ws.delete(windowId);
		} else {
			this.notify(windowId);
		}
	}

	private notify(windowId: number) {
		for (let listener of this.listeners) {
			listener(windowId);
		}
	}

	private getWindowContainingTab(tabId: number) {
		for (let w of this.ws.values()) {
			if (w.has(tabId)) {
				return w;
			}
		}
		throw new Error(`Tab ${tabId} not found`);
	}

	getSiblings: (tabId: number) => ReadonlySet<number> = this.getWindowContainingTab;
}
