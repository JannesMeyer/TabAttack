// APIs not yet included in TypeScript because they are not a Candidate Recommendation

/** https://developer.mozilla.org/en-US/docs/Web/API/FontFace */
declare var FontFace: {
	new(family: string, source: string, options?: { weight?: number }): FontFace;
};

interface FontFace {
	load(): Promise<this>;
}

declare namespace document {
	/** https://developer.mozilla.org/en-US/docs/Web/API/Document/fonts */
	var fonts: {
		add(font: FontFace): void;
	};
}

/**
 * Load font asynchronously
 */
export default async function loadFont(family: string, url: string, weight = 700) {
	if (typeof FontFace === 'undefined') {
		throw new Error('FontFace is not supported');
	}
	let font = new FontFace(family, `url('${url}')`, { weight });
	await font.load();
	if (typeof document !== 'undefined') {
		document.fonts?.add(font);
	}
	return font;
}
