import { proxy } from 'valtio/vanilla';

export type ActionType = 'default' | 'sidebar' | 'popup';

/** resource://builtin-themes/alpenglow/manifest.json */
const alpenglowDark = {
	icons: 'hsla(271, 100%, 77%, 1)',
	sidebar: 'hsla(250, 43%, 25%, 1)',
	sidebar_text: 'hsla(255, 100%, 94%, 1)',
};

export class Theme {
	readonly colors = proxy({
		main_background: '',
		main_text: '',
		toolbar_text: '',
	});

	constructor(type: ActionType = 'default') {
		/**
		 * Important notes:
		 * - Assumes Proton theme instead of Nova theme (`browser.nova.enabled`).
		 * - Assumes `browser.theme.native-theme` to be disabled.
		 * - `theme` doesn't expose `dark_theme` (https://bugzilla.mozilla.org/show_bug.cgi?id=1542044)
		 */
		const handleFirefoxTheme = (theme: browser._manifest.ThemeType) => {
			const bg = theme.images?.additional_backgrounds;
			const alpenglow = bg?.[0]?.endsWith('/background-noodles-right.svg') && bg?.[1]?.endsWith('/background-noodles-left.svg');
			const { colors } = theme;
			if (type === 'default') {
				this.colors.main_background = c(colors?.ntp_background, 'light-dark(#f9f9fb, #2b2a32)');
				this.colors.main_text = c(colors?.ntp_text);
			}
			if (type === 'popup') {
				this.colors.main_background = c(colors?.popup, 'light-dark(#f9f9fb, #2b2a32)');
				this.colors.main_text = c(colors?.popup_text);
			}
			if (type === 'sidebar') {
				if (alpenglow) {
					this.colors.main_background = `light-dark(${c(colors?.sidebar)}, ${alpenglowDark.sidebar})`;
					this.colors.main_text = `light-dark(${c(colors?.sidebar_text)}, ${alpenglowDark.sidebar_text})`;
				} else {
					this.colors.main_background = colors ? c(colors.sidebar, 'light-dark(#fff, #2d2d2d)') : 'light-dark(#fff, #1c1b22)';
					this.colors.main_text = colors ? c(colors?.sidebar_text, 'light-dark(#272727, #dfdfdf)') : 'light-dark(#272727, #dcdcdd)';
				}
			}
			// Toolbar icons color
			if (alpenglow) {
				this.colors.toolbar_text = `light-dark(${c(colors?.icons ?? colors?.toolbar_text)}, ${alpenglowDark.icons})`;
			} else {
				this.colors.toolbar_text = c(colors?.icons ?? colors?.toolbar_text, 'light-dark(rgb(91, 91, 102), rgb(251, 251, 254))');
			}
			// console.log(JSON.stringify(this.colors, undefined, 2));
		};

		try {
			browser.theme.onUpdated.addListener(({ theme }) => handleFirefoxTheme(theme));
			browser.theme.getCurrent().then(theme => handleFirefoxTheme(theme));
		} catch {
			// Chrome fallback
		}
	}
}

function c(color: browser._manifest.ThemeColor | undefined | null, fallback = ''): string {
	if (!color) {
		return fallback;
	}
	if (Array.isArray(color)) {
		const [r, g, b, a = 1] = color;
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	}
	return color;
}
