/** Concatenates classNames */
export function cx(...names: (string | undefined | null | false | Record<string, unknown>)[]) {
	return names.map(n => {
		if (n == null || n === false) {
			return;
		}
		if (typeof n === 'string') {
			return n;
		}
		return Object.keys(n).filter(k => n[k]);
	}).flat().join(' ');
}
