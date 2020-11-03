import glob from 'glob';
import Jasmine from 'jasmine';
import path from 'path';

const ext = '.test.js';

glob('./dist/**/*' + ext, async (err, files) => {
	if (err) { throw err; }
	let jasmine = new Jasmine();
	let specials = { beforeEach, afterEach, beforeAll, afterAll };
	await Promise.all(files.map(f => import(f).then(suite => describe(path.basename(f, ext), () => {
		for (let [n, fn] of Object.entries(suite)) {
			if (specials.hasOwnProperty(n)) {
				specials[n](fn);
			} else if (fn.x) {
				xit(n, fn);
			} else if (fn.f) {
				fit(n, fn);
			} else {
				it(n, fn);
			}
		}
	}))));
	jasmine.randomizeTests(false);
	await jasmine.execute();
});
