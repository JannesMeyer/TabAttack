import Icon from './components/Icon.js';
import loadFont from './fonts/loadFont.js';

const scales = [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];

Promise.all([
	loadFont('Roboto', '/fonts/Roboto-Bold.woff2'),
	loadFont('Roboto Condensed', '/fonts/Roboto-Condensed-Bold.woff2'),
]).then(() => Array(500).fill(null).forEach((_, i) => {
	document.body.appendChild(new Icon(scales[i % scales.length], '#000').render(++i).canvas);
}));
