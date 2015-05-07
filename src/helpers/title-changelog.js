import { saveTextFile } from '../lib-browser/FileSystem';

var database;

if (process.env.NODE_ENV !== 'production') {
	window.getEntry = getEntry.bind(null, 'titles');
	window.updateEntry = updateEntry.bind(null, 'titles');
	window.deleteEntry = deleteEntry.bind(null, 'titles');
	window.exportChangeLog = exportChangeLog;
}

function handleSuccess(ev) {
	this.resolve(ev.target.result);
}

function getEntry(store, key) {
	var deferred = Promise.defer();
	getDB().then(db => {
		db.transaction(store).objectStore(store).get(key).onsuccess = handleSuccess.bind(deferred);
	});
	return deferred.promise;
}

function updateEntry(store, entry) {
	var deferred = Promise.defer();
	getDB().then(db => {
		db.transaction(store, 'readwrite').objectStore(store).put(entry).onsuccess = handleSuccess.bind(deferred);
	});
	return deferred.promise;
}

function deleteEntry(store, key) {
	var deferred = Promise.defer();
	getDB().then(db => {
		db.transaction(store, 'readwrite').objectStore(store).delete(key).onsuccess = handleSuccess.bind(deferred);
	});
	return deferred.promise;
}

function getAll(store) {
	return function(db) {
		var deferred = Promise.defer();
		var entries = [];
		db.transaction('titles').objectStore('titles').openCursor().onsuccess = (ev) => {
			var cursor = ev.target.result;
			if (cursor) {
				entries.push(cursor.value);
				cursor.continue();
			} else {
				deferred.resolve(entries);
			}
		};
		return deferred.promise;
	};
}

function exportChangeLog(download = true) {
	getDB().then(getAll('titles')).then(items => {
		var text = JSON.stringify(items, undefined, '\t');
		if (download) {
			saveTextFile('title-change-log.json', text);
		} else {
			console.log(text);
			console.log(items.length + ' items');
		}
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
export function logChange(originalTitle, newTitle, url, type) {
	return updateEntry('titles', {
		url,
		originalTitle,
		newTitle,
		type,
		changed: (originalTitle !== newTitle),
		lastModified: new Date()
	});
}