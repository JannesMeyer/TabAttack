/**
 * Opens all windows/tabs that are passed into this function.
 *
 * @param windows: 2-dimensional array of URLs. The first dimension represents a window
 */
export function openWindows(windows: string[][]) {
	return Promise.all(windows.map(url => browser.windows.create({ url })));
}