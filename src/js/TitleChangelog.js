var database;

/**
 * Open a database (create it if it doesn't exist yet)
 */
function getDB() {
	// Return existing database handle
	if (database) {
		return Promise.resolve(database);
	}

	// Open database
	return new Promise((resolve, reject) => {
		var openRequest = indexedDB.open('title_changes', 7);
		openRequest.onerror = reject;
		openRequest.onupgradeneeded = event => {
			console.log('Upgrading database…');
			database = openRequest.result;
			database.onerror = reject;

			// database.deleteObjectStore('titles');
			database.createObjectStore('titles', { keyPath: 'url' });

			// store.createIndex('created', 'created', { unique: false });
			// db.createObjectStore('array-keypath', { keyPath: ['a', 'c'] });
			// db.createObjectStore('dotted-keypath', { keyPath: 'a.b' });
			// store.put({ a: 6, b: 6, c: 7 }, [5, 6]);
			// store.createIndex('by_ac', ['a', 'c']);
		};
		openRequest.onsuccess = event => {
			console.log('Database opened.');
			database = openRequest.result;
			database.onerror = log;
			resolve(database);
		};
	});
}

/**
 * Error callback: Log the event to the console
 */
function log(ev) {
	var req = ev.target;
	console.log(req.constructor.name + ': ' + ev.type, req.result || req.error || null);
}

/**
 * Add a log entry to the database
 */
export function logChange(url, originalTitle, newTitle) {
	var entry = {
		url,
		originalTitle,
		newTitle,
		lastModified: new Date()
	};
	getDB().then(db => {
		db.transaction('titles', 'readwrite')
		  .objectStore('titles')
		  .put(entry)
		  .onsuccess = log;
	});
}

/**
 * Read the list of title changes
 */
export function getChanges(callback) {
	var titleChanges = [];
	getDB().then(db => {
		db.transaction('titles')
		  .objectStore('titles')
		  .openCursor()
		  .onsuccess = event => {
				var cursor = event.target.result;
				if (cursor) {
					titleChanges.push(cursor.value);
					cursor.continue();
				} else {
					callback(titleChanges);
				}
			};
	});
}