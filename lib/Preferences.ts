import onMessage from './browser/onMessage.js';
import sendMessage from './browser/sendMessage.js';

export default class Preferences<T> {

  constructor(readonly defaults: T) {}

  /**
   * Requests one ore more preference values and
   * returns the value itself or an object containing
   * all keys and values
   */
  get<X extends keyof T>(...keys: X[]): Promise<Pick<T, X>> {
    let defaults = filterObject(this.defaults, keys);
    return browser.storage.sync.get(defaults) as any;
  }

  /**
   * Requests all values
   */
  getAll(): Promise<T> {
    return browser.storage.sync.get(this.defaults) as any;
  }

  /**
   * Sets multiple values
   */
  async set<X extends keyof T>(items: Pick<T, X>, notify = true) {
		await browser.storage.sync.set(items);
		notify && sendMessage('prefs changed');
	}

	/** Allows to listen for preference changes */
	onChange(callback: (prefs: T) => void) {
		onMessage('prefs changed', callback);
	}
}

function filterObject<T, K extends keyof T>(obj: T, keys: K[]) {
  let result: any = {};
  for (let key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}