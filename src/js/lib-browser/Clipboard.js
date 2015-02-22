var textToCopy;
document.addEventListener('copy', ev => {
	ev.preventDefault();
	ev.clipboardData.setData('text/plain', textToCopy);
	textToCopy = '';
});

export function writeClipboard(text) {
	textToCopy = text;
	document.execCommand('copy');
}

// var textarea = document.createElement('textarea');
// document.body.appendChild(textarea);
// export function writeClipboard(text) {
// 	textarea.value = text;
// 	textarea.select();
// 	// If the text is empty, this might make a "bing" sound.
// 	document.execCommand('copy');
// 	textarea.value = '';
// }