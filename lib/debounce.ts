export default function debounce<F extends (...args: any[]) => void>(fn: F, wait: number) {
	let id: number | undefined;
	return function(...args: Parameters<F>) {
		clearTimeout(id);
		id = setTimeout(() => fn(...args), wait);
	};
}
