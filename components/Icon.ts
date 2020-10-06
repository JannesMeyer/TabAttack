import assertDefined from '../lib/assertDefined.js';

export default class Icon {

	readonly canvas: HTMLCanvasElement;
	private size: number;
	private scale: number;
	private ctx: CanvasRenderingContext2D;

	constructor(public textColor: string, public bgColor?: string) {
		this.canvas = document.createElement('canvas');
		this.size = 16;
		this.scale = devicePixelRatio;
		this.ctx = this.updateContext();
	}

	setSize(size: number) {
		if (this.size === size) { return; }
		this.size = size;
		this.updateContext();
	}

	setScale(scale: number) {
		if (this.scale === scale) { return; }
		this.scale = scale;
		this.updateContext();
	}

	updateContext() {
		let { canvas, size, scale } = this;
		canvas.width = canvas.height = (size * scale);
		return this.ctx = assertDefined(canvas.getContext('2d'));
	}

	/**
	 * Draws the text (max 3 characters)
	 */
	render(text: string | number) {
		text = text.toString();
		let { canvas, scale, ctx } = this;

		// Clear everything
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw the background
		if (this.bgColor != null) {
			roundedRect(ctx, 0, 0, canvas.width, canvas.height, 3 * scale);
			ctx.fillStyle = this.bgColor;
			ctx.fill();
		}

		// Draw the text
		ctx.font = `${scale * 11}px Roboto` + (text.length > 2 ? ' Condensed' : '');
		ctx.fillStyle = this.textColor;
		ctx.textAlign = 'center';
		ctx.fillText(text, canvas.width / 2, 12 * scale);

		return this;
	}

	get imageData() {
		return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
	}

	renderToIcon(text: string | number) {
		this.render(text);
		return browser.browserAction.setIcon({ imageData: this.imageData });
	}
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 *
 * https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
 */
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
}