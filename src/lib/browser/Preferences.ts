import React from 'react';

export default class Preferences<T extends Record<string, any>> {
	private value: T;
	private listeners = new Map<keyof T, Set<(newValue: any) => void>>();

	private onChange = (changes: Record<string, chrome.storage.StorageChange>) => {
		for (let [k, change] of Object.entries(changes)) {
			if (this.value.hasOwnProperty(k)) {
				const key = k as keyof T;
				this.value[key] = change.newValue;
				this.listeners.get(key)?.forEach(callback => callback(change.newValue));
			}
		}
	};

	constructor(defaults: T, private area: chrome.storage.StorageArea = chrome.storage.sync) {
		this.value = defaults;
		this.area.get(defaults, v => {
			this.value = v as T;
			for (const [key, callbacks] of this.listeners) {
				callbacks.forEach(callback => callback(this.value[key]));
			}
		});
		this.area.onChanged.addListener(this.onChange);
	}

	get<K extends keyof T>(key: K) {
		return this.value[key];
	}

	watch<K extends keyof T>(key: K, callback: (newValue: T[K]) => void) {
		const list = this.listeners.get(key) ?? new Set();
		this.listeners.set(key, list);
		list.add(callback);
	}

	unwatch<K extends keyof T>(key: K, callback: (newValue: T[K]) => void) {
		if (!this.listeners.get(key)?.delete(callback)) {
			throw new Error('Callback not found');
		}
	}

	use = <K extends keyof T>(key: K) => {
		const [value, setValue] = React.useState(this.value[key]);
		React.useEffect(() => {
			this.watch(key, setValue);
			return () => this.unwatch(key, setValue);
		}, [key]);
		return [value, (value: T[K]) => this.set({ [key]: value } as any)] as const;
	};

	set(items: Partial<T>) {
		return this.area.set(items);
	}
}
