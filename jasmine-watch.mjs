import fs from 'fs';
import child_process from 'child_process';
import debounce from './dist/lib/debounce.js';

const dir = 'dist';
const debounceMs = 200;
const scriptPath = 'jasmine.mjs';

run();
fs.watch(dir, { recursive: true })
	.on('change', debounce(run, debounceMs))
	.on('error', console.error);

function run() {
	child_process.fork(scriptPath).on('error', console.error);
}
