import onMessage from './browser/onMessage.js';
import sendMessage from './browser/sendMessage.js';
import logError from './logError.js';

export default class Preferences<T> {

	constructor(readonly defaults: T) {}

	/**
	 * Requests one ore more preference values and
	 * returns the value itself or an object containing
	 * all keys and values
	 */
	get<K extends keyof T>(...keys: K[]) {
		let defaults = filterObject(this.defaults, keys);
		return browser.storage.sync.get(defaults) as Promise<Pick<T, K>>;
	}

	async getWithUpdates<X extends keyof T>(...keys: X[]) {
		let x = await this.get(...keys);
		this.onChange(() => this.get(...keys).then(res => Object.assign(x, res)).catch(logError));
		return x;
	}

	/**
	 * Requests all values
	 */
	getAll() {
		return browser.storage.sync.get(this.defaults) as Promise<T>;
	}

	/**
	 * Sets multiple values
	 */
	async set<X extends keyof T>(items: Pick<T, X>, notify = true) {
		await browser.storage.sync.set(items);
		notify && sendMessage('prefs changed');
	}

	/** Allows to listen for preference changes */
	onChange(callback: () => void, leadingCall = false) {
		onMessage('prefs changed', callback);
		leadingCall && callback();
	}
}

function filterObject<T, K extends keyof T>(obj: T, keys: K[]) {
	let result: Partial<Pick<T, K>> = {};
	for (let key of keys) {
		result[key] = obj[key];
	}
	return result as Pick<T, K>;
}
