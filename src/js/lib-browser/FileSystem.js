import { startsWith } from '../lib/StringTools';

var a, listeners;
var MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 megabytes

/**
 * Download a given text as a file
 *
 * https://github.com/eligrey/FileSaver.js
 * http://html5-demos.appspot.com/static/a.download.html
 */
export function saveFile(filename, text) {
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
	if (!startsWith(file.type, 'text/')) {
		// TODO: Don't use alert() but return an error instead
		alert('Not a text document (' + file.type + ')');
		return;
	}
	if (file.size > MAX_FILE_SIZE) {
		// TODO: Don't use alert() but return an error instead
		alert('The selected file is bigger than 50 MB.');
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