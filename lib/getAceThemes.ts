export interface AceTheme {
	name: string;
	theme: string;
	caption: string;
	isDark: boolean;
}

export default function getAceThemes() {
	return new Promise<{ themes: AceTheme[], themesByName: { [name: string]: AceTheme } }>(resolve => {
		ace.config.loadModule('ace/ext/themelist', resolve);
	});
}

export function getAceTheme(theme: string) {
	return new Promise<any>(resolve => {
		ace.config.loadModule(theme, resolve);
	});
}