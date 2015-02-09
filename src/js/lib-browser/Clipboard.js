var textarea;

export function writeClipboard(text) {
	if (textarea === undefined) {
		textarea = document.createElement('textarea');
		document.body.appendChild(textarea);
	}
	textarea.value = text;
	textarea.select();
	// If the string is empty, this might make a "bing" sound.
	document.execCommand('copy');
}