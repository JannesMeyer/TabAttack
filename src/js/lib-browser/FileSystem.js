var a;
var listeners;
var MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 megabyte

/**
 * Download a given text as a file
 *
 * https://github.com/eligrey/FileSaver.js
 * http://html5-demos.appspot.com/static/a.download.html
 */
export function saveTextFile(filename, text) {
	if (a === undefined) { a = document.createElement('a'); }
	var objectUrl = URL.createObjectURL(new Blob([ text ], { type: 'text/plain' }));
	a.href = objectUrl;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(objectUrl);
}

/**
 * Add file listener
 */
export function onFile(callback) {
	if (listeners === undefined) { listeners = []; }
	listeners.push(callback);
}

/**
 * Setup a file drop target
 */
export function setupFileTarget(element) {
	var handler = handleDrag.bind(null, element);
	element.addEventListener('dragover', handler);
	element.addEventListener('dragleave', handler);
	element.addEventListener('drop', handler);
}

/**
 * Setup a file input
 */
export function setupFileInput(element) {
	element.addEventListener('change', handleFileChange);
}

/**
 * HTML5 Drag and Drop
 */
function handleDrag(element, ev) {
	ev.preventDefault();
	ev.stopPropagation();

	// Change style
	if (ev.type === 'dragover') {
		ev.dataTransfer.dropEffect = 'copy';
		element.classList.add('s-dnd-hover');
	} else {
		element.classList.remove('s-dnd-hover');
	}

	// Process drop
	if (ev.type === 'drop') {
		handleFileChange(ev);
	}
}

/**
 * Read file using the FileReader API
 */
function handleFileChange(ev) {
	var file = (ev.target.files || ev.dataTransfer.files)[0];
	if (!file) {
		return;
	}
	console.log(`File: '${file.name}' / '${file.type}' / ${Math.round(file.size / 1024)} KB`);
	if (file.size > MAX_FILE_SIZE) {
		// TODO: Don't use alert() but return an error instead
		alert('The selected file is bigger than 1 MB.');
		return;
	}

	// Read file
	var reader = new FileReader();
	reader.addEventListener('load', ev => {
		for (var lnr of listeners) {
			lnr(ev.target.result);
		}
	});
	reader.readAsText(file);

	// Reset the input field, so that the same file can be loaded consecutively
	if (ev.type === 'change') {
		ev.target.value = '';
	}
}