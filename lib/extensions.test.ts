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
