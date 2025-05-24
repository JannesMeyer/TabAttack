import 'ace-builds/src-noconflict/ace';
import { type Theme, themes } from 'ace-builds/src-noconflict/ext-themelist';

export interface AceTheme extends Theme {
	cssClass: string;
}

export const aceThemes = themes;

// export async function getAceThemeModule(name: string) {
// 	let t = assertDefined(themesByName[name]);
// 	return new Promise<AceThemeModule>(resolve => {
// 		// config.loadModule(t.theme, ({ cssClass }) => resolve({ ...t, cssClass }));
// 		resolve(themes[0] as AceThemeModule);
// 	});
// }
