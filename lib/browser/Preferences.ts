import bs = browser.storage;

interface StorageChange<T> {
	oldValue?: T;
	newValue?: T;
}

export default class Preferences<T> {

	private area: bs.StorageArea;

	constructor(readonly defaults: T, private areaName: 'local' | 'sync' = 'sync') {
		this.area = bs[areaName];
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
		type Changes = { [X in K]?: StorageChange<T[X]> };
		let fn: ((changes: Changes) => void) | undefined;
		bs.onChanged.addListener((changes, area) => {
			if (this.areaName !== area) {
				return;
			}
			for (let [k, change] of Object.entries(changes)) {
				if (!obj.hasOwnProperty(k)) {
					delete changes[k];
					continue;
				}
				obj[k as K] = change.newValue;
			}
			fn?.(changes as Changes);
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
	set<K extends keyof T>(items: Pick<T, K>) {
		return this.area.set(items);
	}
}

function filterObject<T, K extends keyof T>(obj: T, keys: K[]) {
	let result: Partial<Pick<T, K>> = {};
	for (let key of keys) {
		result[key] = obj[key];
	}
	return result as Pick<T, K>;
}
