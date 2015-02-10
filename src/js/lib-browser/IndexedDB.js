var database;

function getDB() {
  // Return existing database handle
  if (database) {
    return Promise.resolve(database);
  }

  // Open database
  return new Promise((resolve, reject) => {
    var openRequest = indexedDB.open('title_changes', 3);
    openRequest.onerror = reject;
    openRequest.onupgradeneeded = event => {
      log(event);
      database = openRequest.result;
      database.onerror = reject;
      // Setup stores
      database.createObjectStore('titles', { autoIncrement: true });
    };
    openRequest.onsuccess = event => {
      log(event);
      database = openRequest.result;
      database.onerror = log;
      resolve(database);
    };
  });
}

function log(ev) {
  var req = ev.target;
  console.log(req.constructor.name + ': ' + ev.type, req.result || req.error || null);
}

// TODO: overwrite old titles
/**
 * Add a log entry to the database
 */
export function logTitleChange(url, domain, originalTitle, newTitle) {
  getDB().then(db => {
    db.transaction(['titles'], 'readwrite')
      .objectStore('titles')
      .add({ url, domain, originalTitle, newTitle, created: new Date() })
      .onsuccess = log;
  });
}

/**
 * Delete all log entries from the database
 */
export function deleteAllTitles() {
  getDB().then(db => {
    db.transaction(['titles'], 'readwrite')
      .objectStore('titles')
      .clear();
  });
}