var a: HTMLAnchorElement | undefined;
var listeners: ((result: any) => void)[] = [];
var MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 megabyte

/**
 * Download a given text as a file
 *
 * https://github.com/eligrey/FileSaver.js
 * http://html5-demos.appspot.com/static/a.download.html
 */
export function saveTextFile(filename: string, text: string) {
	if (a === undefined) {
		a = document.createElement('a');
	}
	var objectUrl = URL.createObjectURL(new Blob([ text ], { type: 'text/plain' }));
	a.href = objectUrl;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(objectUrl);
}

/**
 * Add file listener
 */
export function onFile(callback: (result: any) => void): void {
	listeners.push(callback);
}

/**
 * Setup a file drop target
 */
export function setupFileTarget(element: HTMLElement) {
	var handler = handleDrag.bind(null, element);
	element.addEventListener('dragover', handler);
	element.addEventListener('dragleave', handler);
	element.addEventListener('drop', handler);
}

/**
 * Setup a file input
 */
export function setupFileInput(element: HTMLInputElement) {
	element.addEventListener('change', handleFileChange);
}

/**
 * HTML5 Drag and Drop
 */
function handleDrag(element: HTMLElement, ev: MouseEvent) {
	ev.preventDefault();
	ev.stopPropagation();

	// Change style
	if (ev.type === 'dragover') {
		(ev as any).dataTransfer.dropEffect = 'copy';
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
function handleFileChange(ev: Event) {
	let el = ev.currentTarget as HTMLInputElement;
	let file = el.files && el.files[0];
	if (file == null) {
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
	reader.addEventListener('load', () => {
		for (var lnr of listeners) {
			lnr(reader.result);
		}
	});
	reader.readAsText(file);

	// Reset the input field, so that the same file can be loaded consecutively
	if (ev.type === 'change') {
		el.value = '';
	}
}