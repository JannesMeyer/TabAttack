const debug = false;

/** VSCode-debug-friendly log output */
export default function log(...params: unknown[]) {
	/* eslint-disable-next-line no-console */
	debug && console.log(params.map(x => (typeof x === 'object' ? JSON.stringify(x, undefined, '  ') : x)).join(' '));
}
