export default function debounce<A extends unknown[]>(fn: (...args: A) => void, delay: number) {
	let id: number | undefined;
	return (...args: A) => {
		clearTimeout(id);
		id = setTimeout(fn, delay, ...args);
	};
}
