import { proxy, subscribe } from 'valtio/vanilla';

export default class Preferences<T extends Record<string, any>> {
	readonly values: T;
	private area: chrome.storage.StorageArea;
	private isUpdatingFromStorage = false;

	constructor(defaults: T, area: chrome.storage.StorageArea = chrome.storage.sync) {
		this.values = proxy<T>({ ...defaults });
		this.area = area;

		this.area.get(defaults, stored => {
			this.isUpdatingFromStorage = true;
			for (const key of Object.keys(defaults) as (keyof T)[]) {
				if (stored[key as string] !== undefined) {
					this.values[key] = stored[key as string] as T[keyof T];
				}
			}
			this.isUpdatingFromStorage = false;
		});

		this.area.onChanged.addListener(changes => {
			this.isUpdatingFromStorage = true;
			for (const [key, change] of Object.entries(changes)) {
				if (key in defaults) {
					const k = key as keyof T;
					this.values[k] = (change.newValue ?? defaults[k]) as T[keyof T];
				}
			}
			this.isUpdatingFromStorage = false;
		});

		subscribe(this.values, () => {
			if (this.isUpdatingFromStorage) return;
			this.area.set({ ...this.values });
		});
	}
}
