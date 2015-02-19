var size = 19;
var borderWidth = 2;
var borderRadius = 3;
var textPosition = 13;
var bigFont = 'bold 11px sans-serif';
var smallFont = 'bold 9px sans-serif';

// http://git.chromium.org/gitweb/?p=chromium/src.git;a=blob;f=chrome/renderer/resources/extensions/set_icon.js;h=f9f2371fe83befca510a118e9c564b343203a2a5;hb=e7cda74cc2dfe47adbf6cbe8c86a0c57b19cad56
// http://git.chromium.org/gitweb/?p=chromium/src.git;a=blob;f=chrome/test/data/extensions/api_test/browser_action/no_icon/update.js;h=e37a28603ecc6a8fc8a521fcfe7bc5514beda63b;hb=e7cda74cc2dfe47adbf6cbe8c86a0c57b19cad56
// https://chromium.googlesource.com/experimental/chromium/src/+/master/chrome/common/extensions/docs/examples/extensions/calendar/javascript/background.js?autodive=0%2F

var canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;

var ctx = canvas.getContext('2d');
ctx.strokeStyle = '#5c5c5c';
ctx.fillStyle = '#5c5c5c';
ctx.lineWidth = borderWidth;
ctx.textAlign = 'center';

var innerSize = size - 2 * borderWidth;
roundedRect(ctx, 0, 0, size, size, borderRadius);
ctx.fill();

/**
 * Draws the icon
 */
export function drawIcon(text) {
	// Clear the inner part of the icon, without ever redrawing the border
	ctx.clearRect(borderWidth, borderWidth, innerSize, innerSize);

	// Draw the text
	ctx.font = (text.length >= 3) ? smallFont : bigFont;
	ctx.fillText(text, size / 2, textPosition);

	return ctx.getImageData(0, 0, size, size)
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