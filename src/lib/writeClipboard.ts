export default function writeClipboard(text: string) {
	return navigator.clipboard.writeText(text);
}
