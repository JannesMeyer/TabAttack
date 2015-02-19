var iconSize = 19;
var borderWidth = 2;
var borderRadius = 3;

// Load font
var bigFont = 'bold 11px Roboto';
var smallFont = 'bold 10px Roboto Condensed';
var textPosition = 13;
var style = document.createElement('style');
style.innerHTML = `
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 700;
  src: local('Roboto Bold'), local('Roboto-Bold'), url(data/Roboto-Bold.woff2) format('woff2');
}
@font-face {
  font-family: 'Roboto Condensed';
  font-style: normal;
  font-weight: 700;
  src: local('Roboto Condensed Bold'), local('RobotoCondensed-Bold'), url(data/Roboto-Condensed-Bold.woff2) format('woff2');
}`;
document.head.appendChild(style);

// Create off-screen canvas
var canvas = document.createElement('canvas');
canvas.width = canvas.height = iconSize;
var ctx = canvas.getContext('2d');
ctx.strokeStyle = '#5c5c5c';
ctx.fillStyle = '#5c5c5c';
ctx.lineWidth = borderWidth;
ctx.textAlign = 'center';

// Draw the border
var innerSize = iconSize - (2 * borderWidth);
roundedRect(ctx, 0, 0, iconSize, iconSize, borderRadius);
ctx.fill();

/**
 * Draws the text inside the icon
 */
export function drawIcon(text) {
	// Clear the inner part of the icon, without ever redrawing the border
	ctx.clearRect(borderWidth, borderWidth, innerSize, innerSize);

	// Draw the text
	if (text.length >= 3) {
		ctx.font = smallFont;
		ctx.fillText(text, iconSize / 2, textPosition);
	} else {
		ctx.font = bigFont;
		ctx.fillText(text, iconSize / 2, textPosition);
	}

	return ctx.getImageData(0, 0, iconSize, iconSize)
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 *
 * http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
 */
function roundedRect(ctx, x, y, width, height, radius) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
}