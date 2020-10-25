import bs = browser.storage;

export default class Preferences<T> {

	private area: bs.StorageArea;

	constructor(readonly defaults: T, private areaName: 'local' | 'sync' = 'sync') {
		if (areaName === 'local') {
			this.area = bs.local;

		} else if (areaName === 'sync') {
			this.area = bs.sync;

		} else {
			throw new Error(`Unsupported storage area ${areaName}`);
		}
	}

	/**
	 * Requests one ore more preference values and
	 * returns the value itself or an object containing
	 * all keys and values
	 */
	get<K extends keyof T>(...keys: K[]) {
		let defaults = filterObject(this.defaults, keys);
		return this.area.get(defaults) as Promise<Pick<T, K>>;
	}

	// TODO: Allow removal of change handler
	getWithUpdates<K extends keyof T>(...keys: K[]) {
		// Create default object
		let obj = filterObject(this.defaults, keys);

		// Get values
		let promise = this.area.get(obj) as Promise<Pick<T, K>>;
		promise.then(result => Object.assign(obj, result));

		// Listen for changes
		let fn: undefined | ((p: Pick<T, K>) => void);
		bs.onChanged.addListener((changes, area) => {
			if (this.areaName !== area) {
				return;
			}
			let changedKeys = new Set<K>();
			for (let key of keys) {
				let change = changes[key];
				if (change) {
					obj[key] = change.newValue;
					changedKeys.add(key);
				}
			}
			if (fn && changedKeys.size > 0) {
				fn(obj);
			}
		});

		return { obj, promise, onUpdate: (onChange: typeof fn) => fn = onChange };
	}

	/**
	 * Requests all values
	 */
	getAll() {
		return this.area.get(this.defaults) as Promise<T>;
	}

	/**
	 * Sets multiple values
	 */
	async set<K extends keyof T>(items: Pick<T, K>) {
		await this.area.set(items);
	}
}

function filterObject<T, K extends keyof T>(obj: T, keys: K[]) {
	let result: Partial<Pick<T, K>> = {};
	for (let key of keys) {
		result[key] = obj[key];
	}
	return result as Pick<T, K>;
}
