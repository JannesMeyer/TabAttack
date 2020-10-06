export interface AceTheme {
	name: string;
	caption: string;
	isDark: boolean;
}

export default function getAceThemes() {
	return new Promise<AceTheme[]>(resolve => {
		ace.config.loadModule('ace/ext/themelist', ({ themes }) => resolve(themes));
	});
}