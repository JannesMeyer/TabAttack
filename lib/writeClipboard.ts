let clipboardText: string | undefined;

document.addEventListener('copy', ev => {
	if (clipboardText == null || ev.clipboardData == null) {
		clipboardText = undefined;
		return;
	}
	ev.preventDefault();
	ev.clipboardData.setData('text/plain', clipboardText);
	clipboardText = undefined;
});

export default function writeClipboard(text: string) {
	clipboardText = text;
	return document.execCommand('copy');
}
