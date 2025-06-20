import { Theme } from '../common/helpers/Theme';
import { throwError } from '../lib/throwError';

const size = 16;

export default class Icon {
	private canvas: OffscreenCanvas;
	private ctx: OffscreenCanvasRenderingContext2D;
	private readonly scale: number;
	private readonly theme: Theme;

	constructor(scale: number, theme: Theme) {
		const w = Math.floor(size * scale);
		this.canvas = new OffscreenCanvas(w, w);
		this.ctx = this.canvas.getContext('2d', { willReadFrequently: true }) ?? throwError();
		this.scale = scale;
		this.theme = theme;
	}

	render(total: number, index: number) {
		const { canvas, scale, ctx, theme } = this;
		const bars = Math.min(3, total);
		const isTop = index >= total - 1;
		const isBottom = index === 0;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (let i = 0; i < bars; i++) {
			if (i === 0 && isTop || i === 1 && !isTop && !isBottom || i === 2 && isBottom) {
				ctx.fillStyle = theme.toolbar_text;
			} else {
				ctx.fillStyle = `color-mix(in srgb, ${theme.toolbar_text} 15%, transparent)`;
			}
			ctx.beginPath();
			ctx.roundRect(0, i * 6 * scale, canvas.width, 4 * scale, scale);
			ctx.fill();
		}
		return ctx.getImageData(0, 0, canvas.width, canvas.height);
	}
}
