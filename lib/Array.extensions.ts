/* eslint-disable @typescript-eslint/no-unused-vars */

interface Array<T> {
	first(): T;
	single(): T;
	toMap: typeof toMap;
}

interface ReadonlyArray<T> {
	first(): T;
	single(): T;
	toMap: typeof toMap;
}

Array.prototype.first = function first<T>(this: readonly T[]): T {
	if (this.length < 1) {
		throw new Error('Empty array');
	}
	return this[0] as T;
};

Array.prototype.single = function single<T>(this: readonly T[]): T {
	if (this.length !== 1) {
		throw new Error('The number of elements in the array does not equal one');
	}
	return this[0] as T;
};

function toMap<T, K>(this: readonly T[], getKey: (item: T) => K): Map<K, T>;
function toMap<T, K, V>(this: readonly T[], getKey: (item: T) => K, getValue: (item: T) => V): Map<K, V>;
function toMap<T, K, V>(this: readonly T[], getKey: (item: T) => K, getValue?: (item: T) => V) {
	let map = new Map<K, T | V>();
	for (let item of this) {
		let k = getKey(item);
		if (map.has(k)) {
			throw new Error(`The key ${k} already exists in the Map`);
		}
		let v = (getValue ? getValue(item) : item);
		map.set(k, v);
	}
	return map;
}
Array.prototype.toMap = toMap;

interface Map<K, V> {
	get(key: K | undefined): V | undefined;

	/**
	 * Returns the value of the specified key in the map.
	 * If it doesn't exist throws an error.
	 */
	getOrThrow(key: K | undefined): V;
}

interface ReadonlyMap<K, V> {
	get(key: K | undefined): V | undefined;

	/**
	 * Returns the value of the specified key in the map.
	 * If it doesn't exist throws an error.
	 */
	getOrThrow(key: K | undefined): V;
}

Map.prototype.getOrThrow = function getOrThrow<K, V>(this: ReadonlyMap<K, V>, key: K): V {
	let value = this.get(key);
	if (value == null) {
		throw new Error(`Key ${key} could not be found in the Map`);
	}
	return value;
};
