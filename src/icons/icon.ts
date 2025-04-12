import { Theme } from '../common/helpers/Theme';
import { throwError } from '../lib/throwError';

const size = 16;

export default class Icon {
	private canvas: OffscreenCanvas;
	private ctx: OffscreenCanvasRenderingContext2D;

	constructor(private scale: number, private theme: Theme) {
		const w = Math.floor(size * scale);
		this.canvas = new OffscreenCanvas(w, w);
		this.ctx = this.canvas.getContext('2d', { willReadFrequently: true }) ?? throwError();
	}

	render(count: number, active: number) {
		const { canvas, scale, ctx, theme } = this;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		const a = 4 * scale;
		const gap = 2 * scale;
		for (let i = 0; i < Math.min(16, count); i++) {
			const col = i % 4;
			const row = Math.floor(i / 4);
			ctx.fillStyle = i === active ? theme.toolbar_text : `color-mix(in srgb, ${theme.toolbar_text} 15%, transparent)`;
			ctx.fillRect(col * a, row * (a + gap), a, a);
		}
		return ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
	}
}
