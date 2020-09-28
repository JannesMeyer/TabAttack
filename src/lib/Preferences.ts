export default class Preferences<T extends browser.storage.StorageObject> {

  constructor(readonly defaults: T) {}

  /**
   * Requests one ore more preference values and
   * returns the value itself or an object containing
   * all keys and values
   */
  get<X extends keyof T>(...keys: X[]): Promise<Pick<T, X>> {
    let defaults = filterObject(this.defaults, keys);
    return browser.storage.sync.get(defaults);
  }

  /**
   * Requests all values
   */
  getAll(): Promise<T> {
    return browser.storage.sync.get(null);
  }

  /**
   * Sets multiple values
   */
  set<X extends keyof T>(items: Pick<T, X>) {
    return browser.storage.sync.set(items);
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