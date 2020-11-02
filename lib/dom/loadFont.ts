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
