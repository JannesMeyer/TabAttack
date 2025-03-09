/**
 * Load font asynchronously
 */
export default function loadFont(family: string, url: string, weight?: number) {
	if (typeof FontFace === 'undefined') {
		throw new Error('FontFace is not supported');
	}
	let font = new FontFace(family, `url('${url}')`, { weight: weight?.toString() });
	return font.load();
}
