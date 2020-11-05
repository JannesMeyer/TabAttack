import './extensions.js';

export function arrayFirst() {
	expect([1, 2].first()).toBe(1);
	expect(() => [].first()).toThrowError();
}

export function arraySingle() {
	expect([1].single()).toBe(1);
	expect(() => [1, 2].single()).toThrowError();
}

export function mapGet() {
	let m = new Map<number, number>();
	expect(() => m.getOrThrow(undefined)).toThrowError();
	expect(m.get(undefined)).toBeUndefined();
}

export function arrayMove() {
	let a = [1, 2, 3, 4, 5];
	a.moveItem(0, 3);
	expect(a).toEqual([2, 3, 4, 1, 5]);
	a.moveItem(3, 0);
	expect(a).toEqual([1, 2, 3, 4, 5]);
}
