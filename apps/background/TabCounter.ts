import assertDefined from '../../lib/assertDefined.js';
import log from '../../lib/log.js';

// TODO: Need more information per window and per tab (incognito window, tab title, tab url)
export default class TabCounter {

	private ws = new Map<number, Set<number>>();

	readonly windows: ReadonlyMap<number, ReadonlySet<number>> = this.ws;

	readonly listeners = new Set<(windowId: number) => void>();

	async attach() {
		// Initial count
		let windows = await browser.windows.getAll({ windowTypes: ['normal'], populate: true });
		for (let w of windows) {
			this.ws.set(assertDefined(w.id), new Set(w.tabs?.map(t => assertDefined(t.id))));
		}

		// Tab events
		browser.tabs.onCreated.addListener(({ id, windowId }) => {
			log('created', id);
			this.addTab(assertDefined(windowId), assertDefined(id));
		});
		browser.tabs.onDetached.addListener((id, { oldWindowId }) => {
			log('detached', id);
			this.removeTab(oldWindowId, id);
		});
		browser.tabs.onAttached.addListener((id, { newWindowId }) => {
			log('attached', id);
			this.addTab(newWindowId, id);
		});
		browser.tabs.onRemoved.addListener((id, { windowId, isWindowClosing }) => {
			log('removed', id);
			this.removeTab(windowId, id, isWindowClosing);
		});
		browser.tabs.onReplaced.addListener((addedId, removedId) => {
			log('replaced', removedId, addedId);
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
		let tabs = this.ws.getOrThrow(windowId);
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
