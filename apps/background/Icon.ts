import assertDefined from '../../lib/assertDefined.js';
import prefersDark from '../../lib/prefersDark.js';

export default class Icon {

	readonly canvas: HTMLCanvasElement;
	private size = 16;
	private ctx: CanvasRenderingContext2D;

	/** Text color (normal mode) */
	public textColor = '#f0f';

	/** Text color (dark mode) */
	public textColorDark = '#f0f';

	public bgColor?: string;

	constructor(private scale: number) {
		this.canvas = document.createElement('canvas');
		this.setScale(scale);
		this.ctx = assertDefined(this.canvas.getContext('2d'));
	}

	setScale(scale: number) {
		this.scale = scale;
		let { canvas, size } = this;
		let w = Math.floor(size * scale);
		if (canvas.width !== w) { canvas.width = w; }
		if (canvas.height !== w) { canvas.height = w; }
		return this;
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
		ctx.textAlign = 'center';

		// TODO: prefersDark needs to be moved to allow caching
		// Read prefersDark because of Chrome bug:
		// https://bugs.chromium.org/p/chromium/issues/detail?id=968651
		// https://bugs.chromium.org/p/chromium/issues/detail?id=893175
		ctx.fillStyle = assertDefined(prefersDark.matches ? this.textColorDark : this.textColor);

		ctx.fillText(text, canvas.width / 2, 12 * scale);

		return this;
	}

	get imageData() {
		return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
	}
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 *
 * https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
 */
function roundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) {
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
