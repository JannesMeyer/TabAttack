export interface AceTheme {
	name: string;
	theme: string;
	caption: string;
	isDark: boolean;
}

export interface AceThemeModule extends AceTheme {
	cssClass: string;
}

export function getAceThemeList() {
	return new Promise<{ themes: AceTheme[], themesByName: { [name: string]: AceTheme } }>(resolve => {
		ace.config.loadModule('ace/ext/themelist', resolve);
	});
}

export function getAceTheme(theme: AceTheme) {
	return new Promise<AceThemeModule>(resolve => {
		ace.config.loadModule(theme.theme, ({ cssClass }) => resolve({ ...theme, cssClass }));
	});
}