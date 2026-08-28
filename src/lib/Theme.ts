import { proxy } from 'valtio/vanilla';

export type ActionType = 'default' | 'sidebar' | 'popup';

export class Theme {
	readonly colors = proxy({
		main_background: '',
		main_text: '',
		/** Browser action icon color */
		toolbar_text: '',
	});

	constructor(type: ActionType = 'default') {
		const handleFirefoxTheme = (theme: browser._manifest.ThemeType) => {
			const colors = theme.colors ?? {};
			if (type === 'default') {
				this.colors.main_background = color(colors.ntp_background, 'light-dark(#f9f9fb, #2b2a32)');
				this.colors.main_text = color(colors.ntp_text);
			}
			if (type === 'popup') {
				this.colors.main_background = color(colors.popup, 'light-dark(#f9f9fb, #2b2a32)');
				this.colors.main_text = color(colors.popup_text);
			}
			if (type === 'sidebar') {
				this.colors.main_background = color(colors.sidebar, 'light-dark(#f9f9fb, #2b2a32)');
				this.colors.main_text = color(colors.sidebar_text);
			}

			// browser.theme doesn't expose `dark_theme`:
			// https://bugzilla.mozilla.org/show_bug.cgi?id=1542044
			this.colors.toolbar_text = color(colors.icons ?? colors.toolbar_text, 'light-dark(rgb(91, 91, 102), rgb(251, 251, 254))');

			// Alpenglow
			if (theme.images?.additional_backgrounds?.[0]?.startsWith('moz-extension://89194f83-69d3-4f3d-9136-4ffb29c94195/')) {
				// resource://builtin-themes/alpenglow/manifest.json
				this.colors.toolbar_text = `light-dark(${this.colors.toolbar_text}, hsla(271, 100%, 77%, 1))`;
			}
		};

		try {
			browser.theme.onUpdated.addListener(({ theme }) => handleFirefoxTheme(theme));
			browser.theme.getCurrent().then(theme => handleFirefoxTheme(theme));
		} catch {
			// Chrome fallback
		}
	}
}

function color(color: browser._manifest.ThemeColor | undefined | null, fallback = ''): string {
	if (!color) {
		return fallback;
	}
	if (Array.isArray(color)) {
		const [r, g, b, a = 1] = color;
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	}
	return color;
}
