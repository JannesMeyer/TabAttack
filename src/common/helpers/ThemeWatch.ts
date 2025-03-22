type Colors = browser._manifest._ThemeTypeColors;

export class ThemeWatch {
	private light = true;
	private colors: Colors = {};
	readonly listeners = new Set<() => void>();

	constructor() {
		const query = matchMedia('(prefers-color-scheme: dark)');
		query.addEventListener('change', ev => this.setDark(ev.matches));
		this.setDark(query.matches);

		try {
			browser.theme.onUpdated.addListener(({ theme }) => this.setTheme(theme));
			browser.theme.getCurrent().then(theme => this.setTheme(theme));
		} catch {
			// syncPrefs.watch('iconColor', value => {}});
		}
	}

	private setDark(dark: boolean) {
		this.light = !dark;
		this.listeners.forEach(l => l());
	}

	private setTheme(theme: browser._manifest.ThemeType) {
		this.colors = theme.colors ?? {};
		this.listeners.forEach(l => l());
	}

	/**
	 * Light/Dark default colors
	 * https://github.com/mozilla/gecko-dev/blob/183fbe6a6510d460b00429db65dbfa2bf538106e/browser/themes/addons/light/manifest.json
	 * https://github.com/mozilla/gecko-dev/blob/183fbe6a6510d460b00429db65dbfa2bf538106e/browser/themes/addons/dark/manifest.json
	 */
	getColors() {
		const { colors } = this;
		return {
			accentcolor: null,
			bookmark_text: color(colors.bookmark_text),
			button_background_active: color(colors.button_background_active),
			button_background_hover: color(colors.button_background_hover),
			frame_inactive: color(colors.frame_inactive),
			frame: color(colors.frame),
			icons_attention: color(colors.icons_attention),
			icons: color(colors.icons),
			ntp_background: color(colors.ntp_background) ?? 'light-dark(#f9f9fb, #2b2a32)',
			ntp_card_background: color(colors.ntp_card_background),
			ntp_text: color(colors.ntp_text),
			popup_border: color(colors.popup_border),
			popup_highlight_text: color(colors.popup_highlight_text),
			popup_highlight: color(colors.popup_highlight),
			popup_text: color(colors.popup_text),
			popup: color(colors.popup),
			sidebar_border: color(colors.sidebar_border),
			sidebar_highlight_text: color(colors.sidebar_highlight_text),
			sidebar_highlight: color(colors.sidebar_highlight),
			sidebar_text: color(colors.sidebar_text),
			sidebar: color(colors.sidebar),
			tab_background_separator: color(colors.tab_background_separator),
			tab_background_text: color(colors.tab_background_text),
			tab_line: color(colors.tab_line),
			tab_loading: color(colors.tab_loading),
			tab_selected: color(colors.tab_selected),
			tab_text: color(colors.tab_text),
			textcolor: null,
			toolbar_bottom_separator: color(colors.toolbar_bottom_separator),
			toolbar_field_border_focus: color(colors.toolbar_field_border_focus),
			toolbar_field_border: color(colors.toolbar_field_border),
			toolbar_field_focus: color(colors.toolbar_field_focus),
			toolbar_field_highlight_text: color(colors.toolbar_field_highlight_text),
			toolbar_field_highlight: color(colors.toolbar_field_highlight),
			toolbar_field_separator: null,
			toolbar_field_text_focus: color(colors.toolbar_field_text_focus),
			toolbar_field_text: color(colors.toolbar_field_text),
			toolbar_field: color(colors.toolbar_field),
			toolbar_text: color(colors.toolbar_text),
			toolbar_top_separator: color(colors.toolbar_top_separator),
			toolbar_vertical_separator: color(colors.toolbar_vertical_separator),
			toolbar: color(colors.toolbar),
		} satisfies Record<keyof Colors, unknown>;
	}

	/**
	 * --toolbarbutton-icon-fill
	 * @see https://github.com/mozilla/gecko-dev/blob/2684272ea75417c74de526f3e1ee809bd7ac9931/browser/themes/shared/browser-colors.css#L123
	 */
	get toolbar_text() {
		return color(this.colors.toolbar_text) ?? (this.light ? 'rgb(91, 91, 102)' : 'rgb(251, 251, 254)');
	}
}

function color(color: browser._manifest.ThemeColor | undefined | null) {
	if (color == null) {
		return null;
	}
	if (typeof color === 'string') {
		return color;
	}
	const [r, g, b, a = 1] = color;
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}
