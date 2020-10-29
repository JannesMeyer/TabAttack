describe('extensions', () => {
	it('Array.first', () => {
		expect([1, 2].first()).toBe(1);
		expect(() => [].first()).toThrowError();
	});
});
