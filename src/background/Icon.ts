import { resolveLightDark } from '../lib/resolveLightDark';
import type { Theme } from '../lib/Theme';
import { throwError } from '../lib/throwError';

export default class Icon {
	private canvas: OffscreenCanvas;
	private ctx: OffscreenCanvasRenderingContext2D;
	private readonly pixelSize: number;
	private readonly theme: Theme;

	constructor(pixelSize: number, theme: Theme) {
		this.canvas = new OffscreenCanvas(pixelSize, pixelSize);
		this.ctx = this.canvas.getContext('2d', { willReadFrequently: true }) ?? throwError();
		this.ctx.imageSmoothingEnabled = false;
		this.pixelSize = pixelSize;
		this.theme = theme;
	}

	render(total: number): ImageData {
		const { canvas, pixelSize, ctx, theme } = this;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = resolveLightDark(theme.colors.toolbar_text);

		const W = canvas.width;
		const H = canvas.height;
		// Step unit ensures every 2x pixel block maps 1:1 to 1x physical pixels (1 for 16/19px, 2 for 32/38px)
		const step = pixelSize >= 32 ? 2 : 1;
		const gap = step;

		// Determine optimal uniform grid (cols x rows)
		const [cols, rows] = getGridDimensions(total);

		// Compute step-aligned integer tab width and height
		const availableW = W - (cols - 1) * gap;
		const numStepsW = Math.floor(availableW / (cols * step));
		const tabW = numStepsW * step;
		const totalGridW = cols * tabW + (cols - 1) * gap;
		const startX = Math.floor((W - totalGridW) / (2 * step)) * step;

		const availableH = H - (rows - 1) * gap;
		const numStepsH = Math.floor(availableH / (rows * step));
		const tabH = numStepsH * step;
		const totalGridH = rows * tabH + (rows - 1) * gap;
		const startY = Math.floor((H - totalGridH) / (2 * step)) * step;

		// Render exactly 'total' tabs with gravity (filling from bottom to top within each column)
		const maxTabs = Math.min(total, cols * rows);
		for (let i = 0; i < maxTabs; i++) {
			const col = Math.floor(i / rows);
			const row = (rows - 1) - (i % rows);

			const x = startX + col * (tabW + gap);
			const y = startY + row * (tabH + gap);

			ctx.fillRect(x, y, tabW, tabH);
		}

		return ctx.getImageData(0, 0, canvas.width, canvas.height);
	}
}

/**
 * Returns optimal (cols, rows) for a given tab count
 * ensuring rows and cols are strictly monotonically non-decreasing.
 */
function getGridDimensions(total: number): [cols: number, rows: number] {
	if (total <= 2) return [1, 2];
	if (total <= 4) return [1, 4];
	if (total <= 8) return [2, 4];
	if (total <= 12) return [3, 4];
	if (total <= 16) return [4, 4];
	if (total <= 20) return [4, 5];
	return [5, 5];
}
