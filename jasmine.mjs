import glob from 'glob';
import Jasmine from 'jasmine';
import path from 'path';

const ext = '.test.js';

glob('./dist/**/*' + ext, async (err, files) => {
	if (err) { throw err; }
	let jasmine = new Jasmine();
	await Promise.all(files.map(f => import(f).then(mod => {
		describe(path.basename(f, ext), () =>	Object.entries(mod).filter(([, fn]) => typeof fn === 'function').forEach(([n, fn]) => it(n, fn)));
	})));
	jasmine.execute();
});
