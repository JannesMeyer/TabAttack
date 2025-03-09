import { throwError } from '../lib/throwError';

const size = 16;

export default class Icon {
	readonly canvas: OffscreenCanvas;
	private ctx: OffscreenCanvasRenderingContext2D;

	public textColor?: string;

	constructor(private scale: number) {
		const w = Math.floor(size * scale);
		this.canvas = new OffscreenCanvas(w, w);
		this.setScale(scale);
		this.ctx = this.canvas.getContext('2d', { willReadFrequently: true }) ?? throwError();
	}

	setScale(scale: number) {
		this.scale = scale;
		let { canvas } = this;
		let w = Math.floor(size * scale);
		if (canvas.width !== w) canvas.width = w;
		if (canvas.height !== w) canvas.height = w;
		return this;
	}

	render(text: string) {
		let { canvas, scale, ctx } = this;

		// Clear everything
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw the text
		ctx.font = `${scale * 11}px Roboto` + (text.length > 2 ? ' Condensed' : '');
		ctx.textAlign = 'center';
		ctx.fillStyle = this.textColor ?? '#f0f';
		ctx.fillText(text, canvas.width / 2, 12 * scale);
		return this;
	}

	getImageData() {
		return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
	}
}
