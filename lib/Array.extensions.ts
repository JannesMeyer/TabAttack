interface Array<T> {
	first(): T;
	single(): T;
}

interface ReadonlyArray<T> {
	first(): T;
	single(): T;
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
