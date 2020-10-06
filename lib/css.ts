export default function css(style: TemplateStringsArray): string {
	if (typeof document === 'undefined') {
		return 'no-browser';
	}
	let st = document.createElement('style');
	st.id = 'css-' + getRandomId(5);
	st.innerHTML = style.join('').replace(/&/g, '.' + st.id);
	document.head.appendChild(st);
	return st.id;
}

/** Returns a string of random numbers and characters */
function getRandomId(length: number): string {
	return Math.floor(Math.random() * Math.pow(36, length)).toString(36).padStart(length, '0');
}

/** Concatenates classNames */
export function X(...names: (string | undefined | null | { [name: string]: unknown })[]) {
	return names.map(n => {
		if (n == null) {
			return;
		}
		if (typeof n === 'string') {
			return n;
		}
		return Object.keys(n).filter(k => n[k]);
	}).flat().join(' ');
}
