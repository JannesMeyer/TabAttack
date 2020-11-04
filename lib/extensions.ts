/* eslint-disable @typescript-eslint/no-unused-vars */

interface Array<T> {
	first(): T;
	single(): T;
	toMap: typeof toMap;
	moveItem: typeof moveItem;
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

function moveItem<T>(this: T[], fromIndex: number, toIndex: number) {
	let { length } = this;
	if (fromIndex >= length || toIndex >= length || fromIndex < 0 || toIndex < 0) {
		throw new Error('Index out of bounds');
	}
	let item = this.splice(fromIndex, 1)[0] as T;
	this.splice(toIndex, 0, item);
	return this;
}
Array.prototype.moveItem = moveItem;

interface Map<K, V> {
	get(key: K | undefined): V | undefined;
	getOrThrow(key: K | undefined): V;
	map<T>(fn: (value: V, key: K) => T): T[];
	filter(fn: (value: V, key: K) => unknown): V[];
}

interface ReadonlyMap<K, V> {
	get(key: K | undefined): V | undefined;
	getOrThrow(key: K | undefined): V;
	map<T>(fn: (value: V, key: K) => T): T[];
	filter(fn: (value: V, key: K) => unknown): V[];
}

Map.prototype.getOrThrow = function getOrThrow<K, V>(this: ReadonlyMap<K, V>, key: K): V {
	let value = this.get(key);
	if (value == null) {
		throw new Error(`Key ${key} could not be found in the Map`);
	}
	return value;
};

Map.prototype.map = function map<K, V, T>(this: ReadonlyMap<K, V>, fn: (value: V, key: K) => T): T[] {
	let mapped: T[] = [];
	for (let [k, v] of this) {
		mapped.push(fn(v, k));
	}
	return mapped;
};

Map.prototype.filter = function filter<K, V>(this: ReadonlyMap<K, V>, fn: (value: V, key: K) => unknown): V[] {
	let values: V[] = [];
	for (let [k, v] of this) {
		fn(v, k) && values.push(v);
	}
	return values;
};
