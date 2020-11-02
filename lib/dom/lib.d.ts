// APIs not yet included in TypeScript because they are not a Candidate Recommendation

/** https://developer.mozilla.org/en-US/docs/Web/API/FontFace */
declare const FontFace: {
	new(family: string, source: string, options?: { weight?: number }): FontFace;
};

interface FontFace {
	load(): Promise<this>;
}

interface Document {
	/** https://developer.mozilla.org/en-US/docs/Web/API/Document/fonts */
	fonts: {
		add(font: FontFace): void;
	};
}
