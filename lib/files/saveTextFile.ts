/**
 * Trigger a file download with the given filename and content
 */
export function saveTextFile(filename: string, content: string, type: 'text/plain' | 'text/markdown' | 'application/json') {
	type += ';charset=utf-8';
	let a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([content], { type }));
	a.download = filename;
	a.rel = 'noopener';
	a.target = '_blank';
	a.click();
	URL.revokeObjectURL(a.href);
}
