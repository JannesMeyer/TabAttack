import Icon from './apps/background/Icon.js';
import loadFont from './lib/dom/loadFont.js';
import assertDefined from './lib/assertDefined.js';

const scales = [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
const prefersDark = matchMedia('(prefers-color-scheme: dark)');
const icons = Array(500).fill(null).map((_, i) => new Icon(assertDefined(scales[i % scales.length])));

// Wait for fonts to load
Promise.all([
	loadFont('Roboto', '/fonts/Roboto-Bold.woff2'),
	loadFont('Roboto Condensed', '/fonts/Roboto-Condensed-Bold.woff2'),
]).then(() => {
	icons.forEach(({ canvas }) => document.body.appendChild(canvas));
	renderIcons();
	prefersDark.addEventListener('change', renderIcons);
});

/** Renders all icons */
function renderIcons() {
	let color = (prefersDark.matches ? '#fff' : '#000');
	icons.forEach((icon, i) => {
		icon.textColor = color;
		icon.render(++i);
	});
}
