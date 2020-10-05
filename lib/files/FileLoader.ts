import assertDefined from '../assertDefined.js';

export default class FileLoader {
  
	private readonly dragOverClass = 'file-dragover';

	constructor(
		private onFile: (contents: string, type: string, bytes: number, name: string) => void,
		private fileInput?: HTMLInputElement | null,
		private dragTarget?: HTMLElement | null,
		private maxMB?: number,
	) {
		fileInput?.addEventListener('change', this.handleFileChange);
		dragTarget?.addEventListener('dragover', this.handleDragOver);
		dragTarget?.addEventListener('dragleave', this.handleDragLeave);
		dragTarget?.addEventListener('drop', this.handleDrop);
	}

	dispose() {
		let { fileInput, dragTarget } = this;
		fileInput?.removeEventListener('change', this.handleFileChange);
		dragTarget?.removeEventListener('dragover', this.handleDragOver);
		dragTarget?.removeEventListener('dragleave', this.handleDragLeave);
		dragTarget?.removeEventListener('drop', this.handleDrop);
	}

	private handleFileChange = () => {
		let el = assertDefined(this.fileInput);

		// Read first file
		let file = el.files?.[0];
		file && this.readFile(file);

		// Reset the input field so the same file can be loaded consecutively
		el.value = '';
	}

	private handleDragOver = (ev: DragEvent) => {
		let item = ev.dataTransfer?.items[0];
		if (item?.kind !== 'file') {
			return;
		}
		ev.preventDefault();
		assertDefined(this.dragTarget).classList.add(this.dragOverClass);
	};

	private handleDragLeave = () => {
		assertDefined(this.dragTarget).classList.remove(this.dragOverClass);
	};

	private handleDrop = (ev: DragEvent) => {
		let file = ev.dataTransfer?.items[0]?.getAsFile();
		if (file == null) {
			return;
		}
		ev.preventDefault();
		this.readFile(file);
	};

	private readFile(file: File) {
		// Enforce maximum file size
		if (this.maxMB != null && file.size > this.maxMB * 1024 * 1024) {
			throw new Error(`The selected file is bigger than ${this.maxMB} MB`);
		}

		// Read file as text
		let r = new FileReader();
		r.addEventListener('load', () => {
			if (typeof r.result !== 'string') {
				throw (r.error ?? new Error('Unexpected file result'));
			}
			this.onFile(r.result, file.type, file.size, file.name);
		});
		r.readAsText(file);
	}
}
