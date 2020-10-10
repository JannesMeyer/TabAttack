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

export default function writeClipboard(text: string): void {
	clipboardText = text;
	let success = document.execCommand('copy');
	if (!success) {
		console.warn('Could not copy because the browser does not allow it.');
	}
}