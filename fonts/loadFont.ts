// APIs not yet included in TypeScript because they are not a Candidate Recommendation

/** https://developer.mozilla.org/en-US/docs/Web/API/FontFace */
declare const FontFace: {
	new(family: string, source: string, options?: { weight?: number }): FontFace;
};

interface FontFace {
	load(): Promise<this>;
}

declare namespace document {
	/** https://developer.mozilla.org/en-US/docs/Web/API/Document/fonts */
	const fonts: {
		add(font: FontFace): void;
	};
}

/**
 * Load font asynchronously
 */
export default function loadFont(family: string, url: string, weight?: number) {
	if (typeof FontFace === 'undefined') {
		throw new Error('FontFace is not supported');
	}
	if (typeof document === 'undefined' || document.fonts == null) {
		throw new Error('FontFaceSet is not supported');
	}
	let font = new FontFace(family, `url('${url}')`, { weight });
	document.fonts.add(font);
	return font.load();
}
