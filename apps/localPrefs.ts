import Preferences from '../lib/browser/Preferences.js';

/** Matches first parameter of browser.windows.create() */
let popupWindow: Required<Pick<NonNullable<Parameters<typeof browser.windows.create>[0]>, 'height' | 'width' | 'top' | 'left'>> = {
	width: 300,
	height: 600,
	top: 0,
	left: 0,
};

export default new Preferences({ popupWindow }, 'local');
