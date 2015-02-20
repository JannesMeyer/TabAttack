var database;

if (process.env.NODE_ENV !== 'production') {
	window.print = console.log.bind(console);
	window.getEntry = getEntry;
	window.getAll = getAll;
	window.deleteEntry = deleteEntry;
}

function handleSuccess(ev) {
	if (ev.target.error) {
		this.reject(ev.target.error);
	} else {
		this.resolve(ev.target.result);
	}
}

function getEntry(key) {
	var entry = Promise.defer();
	getDB().then(db => {
		db.transaction('titles').objectStore('titles').get(key).onsuccess = handleSuccess.bind(entry);
	});
	return entry.promise;
}

function getAll() {
	var deferred = Promise.defer();
	var entries = [];
	getDB().then(db => {
		db.transaction('titles').objectStore('titles').openCursor().onsuccess = (ev) => {
			var cursor = ev.target.result;
			if (cursor) {
				entries.push(cursor.value);
				cursor.continue();
			} else {
				deferred.resolve(entries);
			}
		};
	});
	return deferred.promise;
}

function deleteEntry(key) {
	getDB().then(db => {
		db.transaction('titles', 'readwrite').objectStore('titles').delete(key);
	});
}














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
			database = event.target.result;
			database.onerror = reject;
			console.log('Upgrading database…');
			// database.deleteObjectStore('titles');
			database.createObjectStore('titles', { keyPath: 'url' });
		};
		openRequest.onsuccess = event => {
			database = event.target.result;
			database.onerror = function(ev) {
				console.log(ev.target.constructor.name + ': ' + ev.target.error);
			};
			resolve(database);
		};
	});
}

/**
 * Add a log entry to the database
 */
export function logChange(originalTitle, newTitle, url) {
	var entry = { url, originalTitle, newTitle, lastModified: new Date() };
	getDB().then(db => {
		db.transaction('titles', 'readwrite').objectStore('titles').put(entry);
	});
}