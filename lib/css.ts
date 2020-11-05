/** Inserts CSS into the current page by adding a <style> tag to the <head> */
export default function css(style: TemplateStringsArray): string {
	if (typeof document === 'undefined') {
		return 'no-document';
	}
	let st = document.createElement('style');
	st.id = 'css-' + getId(5);
	let text = style.join('').replace(/&/gu, '.' + st.id);
	st.appendChild(document.createTextNode(text));
	document.head.appendChild(st);
	return st.id;
}

/** Returns a string of random numbers and characters */
function getId(length: number): string {
	if (length < 1) {
		throw new Error('length needs to be at least 1');
	}
	let n = Math.floor(Math.random() * (36 ** length));
	if (n === Infinity) {
		throw new Error(`length ${length} is too long to generate`);
	}
	return n.toString(36).padStart(length, '0');
}

/** Concatenates classNames */
export function x(...names: (string | undefined | null | Record<string, unknown>)[]) {
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
