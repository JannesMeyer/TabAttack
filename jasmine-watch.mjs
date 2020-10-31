import fs from 'fs';
import child_process from 'child_process';
import debounce from './dist/lib/debounce.js';

run();
let handleChange = debounce(run, 200);
fs.watch('./dist', { recursive: true }, ev => ev === 'change' && handleChange());
function run() {
	child_process.fork('jasmine.mjs').addListener('error', console.error);
}
