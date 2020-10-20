import assertDefined from '../lib/assertDefined.js';

export default class TabCounter {
	
	private _windows = new Map<number, Set<number>>();

	readonly windows: ReadonlyMap<number, ReadonlySet<number>> = this._windows;
	
	readonly listeners = new Set<(windowId?: number) => void>();

	async attach() {
		// Initial count
		let windows = await browser.windows.getAll({ windowTypes: ['normal'], populate: true });
		for (let w of windows) {
			this._windows.set(assertDefined(w.id), new Set(w.tabs?.map(t => assertDefined(t.id))));
		}
		// Tab created
		browser.tabs.onCreated.addListener(tab => {
			let windowId = assertDefined(tab.windowId);
			let tabId = assertDefined(tab.id);
			let tabs = this._windows.get(windowId);
			if (tabs == null) {
				this._windows.set(windowId, tabs = new Set());
			}
			tabs.add(tabId);
			this.notify(windowId);
		});
		// Tab removed
		browser.tabs.onRemoved.addListener((tabId, { windowId, isWindowClosing }) => {
			if (isWindowClosing) {
				this._windows.delete(windowId);
				return;
			}
			let tabs = assertDefined(this._windows.get(windowId));
			tabs.delete(tabId) && this.notify(windowId);
		});
	}

	private notify(windowId?: number) {
		for (let listener of this.listeners) {
			listener(windowId);
		}
	}

	getWindowByTabId(tabId: number) {
		for (var [windowId, tabs] of this.windows) {
			if (tabs.has(tabId)) {
				return { windowId, tabs };
			}
		}
		throw new Error(`Tab ${tabId} not found`);
	}

}
