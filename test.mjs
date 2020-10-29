import glob from 'glob';
import Jasmine from 'jasmine';
import './dist/lib/extensions.js';

glob('./dist/**/*.test.js', async (err, files) => {
	if (err) { throw err; }
	let jasmine = new Jasmine();
	await Promise.all(files.map(f => import(f)));
	jasmine.execute();
});
