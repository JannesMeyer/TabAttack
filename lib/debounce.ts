export default function debounce<F extends (...args: any[]) => void>(fn: F, delay: number) {
	let id: number | undefined;
	return function(this: ThisParameterType<F>, ...args: Parameters<F>) {
		clearTimeout(id);
		id = setTimeout(() => fn.apply(this, args), delay);
	};
}
