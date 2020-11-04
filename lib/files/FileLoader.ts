import assertDefined from '../assertDefined.js';
import css from '../css.js';

export default class FileLoader {

	static css = css`
	&::before,
	&::after {
		content: ' ';
		position: absolute;
		z-index: 1000;
		display: block;
		pointer-events: none;
	}
	&::before {
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.5);
	}
	&::after {
		top: 9px;
		left: 9px;
		right: 9px;
		bottom: 9px;
		border: 7px dashed #1f68e0;
	}`;

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
		assertDefined(this.dragTarget).classList.add(FileLoader.css);
	};

	private handleDragLeave = () => {
		assertDefined(this.dragTarget).classList.remove(FileLoader.css);
	};

	private handleDrop = (ev: DragEvent) => {
		this.handleDragLeave();
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
