export default function ready() {
	if (typeof addEventListener === 'undefined' || typeof document === 'undefined') {
		throw new Error('No browser');
	}
	return new Promise<Element>(resolve => addEventListener('DOMContentLoaded', () => {
		let el = document.querySelector('body > main');
		if (el == null) {
			throw new Error('body > main is missing');
		}
		resolve(el);
	}));
}
