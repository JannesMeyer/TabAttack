import assertDefined from './assertDefined.js';

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

export async function getAceThemeModule(name: string) {
	let { themesByName } = await getAceThemeList();
	let t = assertDefined(themesByName[name]);
	return new Promise<AceThemeModule>(resolve => {
		ace.config.loadModule(t.theme, ({ cssClass }) => resolve({ ...t, cssClass }));
	});
}