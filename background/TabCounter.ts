import assertDefined from '../lib/assertDefined.js';

export default class TabCounter {
	
	private windows = new Map<number, Set<number>>();
	
	readonly listeners = new Set<(windowId?: number) => void>();

	async attach() {
		// Initial count
		let windows = await browser.windows.getAll({ windowTypes: ['normal'], populate: true });
		for (let w of windows) {
			this.windows.set(assertDefined(w.id), new Set(w.tabs?.map(t => assertDefined(t.id))));
		}
		// Tab created
		browser.tabs.onCreated.addListener(tab => {
			let windowId = assertDefined(tab.windowId);
			let tabId = assertDefined(tab.id);
			let tabs = this.windows.get(windowId);
			if (tabs == null) {
				this.windows.set(windowId, tabs = new Set());
			}
			tabs.add(tabId);
			this.notify(windowId);
		});
		// Tab removed
		browser.tabs.onRemoved.addListener(tabId => {
			for (let [windowId, tabs] of this.windows) {
				if (tabs.delete(tabId)) {
					this.notify(windowId);
				}
			}
		});
		// Window removed
		browser.windows.onRemoved.addListener(windowId => {
			this.windows.delete(windowId);
		});
	}

	private notify(windowId?: number) {
		for (let listener of this.listeners) {
			listener(windowId);
		}
	}
	
	getWindows() {
		return this.windows.entries();
	}

	getWindow(windowId: number) {
		return assertDefined(this.windows.get(windowId));
	}

}
