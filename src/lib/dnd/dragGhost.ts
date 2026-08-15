const DEFAULT_FAVICON_PATH =
	'M8.5 1a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zm2.447 1.75a6.255 6.255 0 0 1 3.756 5.125l-2.229 0A9.426 9.426 0 0 0 10.54 2.75l.407 0zm-2.049 0a8.211 8.211 0 0 1 2.321 5.125l-5.438 0A8.211 8.211 0 0 1 8.102 2.75l.796 0zm-2.846 0 .408 0a9.434 9.434 0 0 0-1.934 5.125l-2.229 0A6.254 6.254 0 0 1 6.052 2.75zm0 11.5a6.252 6.252 0 0 1-3.755-5.125l2.229 0A9.426 9.426 0 0 0 6.46 14.25l-.408 0zm2.05 0a8.211 8.211 0 0 1-2.321-5.125l5.437 0a8.211 8.211 0 0 1-2.321 5.125l-.795 0zm2.846 0-.409 0a9.418 9.418 0 0 0 1.934-5.125l2.229 0a6.253 6.253 0 0 1-3.754 5.125z';

export function createDragGhost(tabIds: number[], fallbackElement?: HTMLElement | null): HTMLElement {
	if (typeof document === 'undefined') {
		return {} as HTMLElement;
	}

	const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
	const iconSize = 16;
	const gap = 6;
	const padX = 10;
	const padY = 6;
	const borderRadius = 8;

	// Collect favicon elements from existing DOM nodes
	const isImg = (el: unknown): el is HTMLImageElement => typeof HTMLImageElement !== 'undefined' && el instanceof HTMLImageElement;
	const isSvg = (el: unknown): el is SVGElement => typeof SVGElement !== 'undefined' && el instanceof SVGElement;

	const favElements: (HTMLImageElement | SVGElement | null)[] = [];
	for (const id of tabIds) {
		const el = document.querySelector<HTMLElement>(`[data-tab="${id}"] .favicon`);
		if (isImg(el) || isSvg(el)) {
			favElements.push(el);
		} else {
			favElements.push(null);
		}
	}

	if (favElements.length === 0 && fallbackElement) {
		const el = fallbackElement.querySelector<HTMLElement>('.favicon');
		if (isImg(el) || isSvg(el)) {
			favElements.push(el);
		}
	}

	const count = Math.max(1, favElements.length);
	const width = padX * 2 + count * iconSize + Math.max(0, count - 1) * gap;
	const height = padY * 2 + iconSize;

	const canvas = document.createElement('canvas');
	canvas.className = 'tab-drag-ghost';
	canvas.width = Math.round(width * dpr);
	canvas.height = Math.round(height * dpr);
	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		return canvas;
	}

	ctx.scale(dpr, dpr);

	// Get computed theme colors from document
	let bgColor = '#2b2a33';
	let textColor = '#ffffff';
	if (typeof window !== 'undefined') {
		const style = getComputedStyle(document.documentElement);
		const tabVar = style.getPropertyValue('--tab').trim();
		const textVar = style.getPropertyValue('--tabtext').trim();
		if (tabVar) bgColor = tabVar;
		if (textVar) textColor = textVar;
	}

	// Draw rounded rectangle container
	ctx.beginPath();
	if (typeof ctx.roundRect === 'function') {
		ctx.roundRect(0, 0, width, height, borderRadius);
	} else {
		ctx.rect(0, 0, width, height);
	}
	ctx.fillStyle = bgColor;
	ctx.fill();

	// Subtle border
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
	ctx.stroke();

	// Draw favicons synchronously from already-rasterized DOM bitmaps
	const defaultPath = typeof Path2D !== 'undefined' ? new Path2D(DEFAULT_FAVICON_PATH) : null;

	favElements.forEach((favEl, i) => {
		const x = padX + i * (iconSize + gap);
		const y = padY;

		if (favEl instanceof HTMLImageElement && favEl.complete && favEl.naturalWidth > 0) {
			try {
				ctx.drawImage(favEl, x, y, iconSize, iconSize);
				return;
			} catch {}
		}

		// Draw vector fallback for SVGs or unrendered images
		if (defaultPath) {
			ctx.save();
			ctx.translate(x, y);
			ctx.fillStyle = textColor;
			ctx.fill(defaultPath);
			ctx.restore();
		}
	});

	return canvas;
}

export function setNativeDragGhost(dataTransfer: DataTransfer, element: HTMLElement): void {
	document.body.appendChild(element);
	element.style.position = 'fixed';
	element.style.top = '-9999px';
	element.style.left = '-9999px';
	element.style.pointerEvents = 'none';
	const offsetX = Math.round(element.offsetWidth / 2);
	const offsetY = Math.round(element.offsetHeight / 2);
	dataTransfer.setDragImage(element, offsetX, offsetY);
	setTimeout(() => element.remove(), 0);
}
