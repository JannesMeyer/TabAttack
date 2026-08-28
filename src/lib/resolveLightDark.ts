export const prefersDark = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : undefined;

export function resolveLightDark(color: string, isDark = prefersDark?.matches ?? false): string {
	if (!color.startsWith('light-dark(') || !color.endsWith(')')) {
		return color;
	}
	const inner = color.slice(11, -1);
	for (let i = 0, level = 0; i < inner.length; i++) {
		const c = inner[i];
		if (level === 0 && c === ',') {
			return (isDark ? inner.slice(i + 1) : inner.slice(0, i)).trim();
		}
		if (c === '(') level++;
		if (c === ')') level--;
	}
	return color;
}
