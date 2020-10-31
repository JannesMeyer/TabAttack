import fs from 'fs';
import child_process from 'child_process';
import debounce from './dist/lib/debounce.js';

const dir = 'dist';
const scriptPath = process.argv[2];

run();
fs.watch(dir, { recursive: true })
	.on('change', debounce(run, 200))
	.on('error', console.error);

function run() {
	child_process.fork(scriptPath).on('error', console.error);
}
