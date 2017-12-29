interface ITheme {
	name: string;
	caption: string;
}

export const lightThemes: ITheme[] = [
	{ name: 'chrome',          caption: 'Chrome' },
	{ name: 'clouds',          caption: 'Clouds' },
	{ name: 'crimson_editor',  caption: 'Crimson Editor' },
	{ name: 'dawn',            caption: 'Dawn' },
	{ name: 'dreamweaver',     caption: 'Dreamweaver' },
	{ name: 'eclipse',         caption: 'Eclipse' },
	{ name: 'github',          caption: 'GitHub' },
	{ name: 'solarized_light', caption: 'Solarized Light' },
	{ name: 'textmate',        caption: 'TextMate' },
	{ name: 'tomorrow',        caption: 'Tomorrow' },
	{ name: 'xcode',           caption: 'XCode' },
	{ name: 'kuroir',          caption: 'Kuroir' },
	{ name: 'katzenmilch',     caption: 'KatzenMilch' },
];

export const darkThemes: ITheme[] = [
	{ name: 'ambiance',                caption: 'Ambiance' },
	{ name: 'chaos',                   caption: 'Chaos' },
	{ name: 'clouds_midnight',         caption: 'Clouds Midnight' },
	{ name: 'cobalt',                  caption: 'Cobalt' },
	{ name: 'idle_fingers',            caption: 'idle Fingers' },
	{ name: 'kr_theme',                caption: 'krTheme' },
	{ name: 'merbivore',               caption: 'Merbivore' },
	{ name: 'merbivore_soft',          caption: 'Merbivore Soft' },
	{ name: 'mono_industrial',         caption: 'Mono Industrial' },
	{ name: 'monokai',                 caption: 'Monokai' },
	{ name: 'pastel_on_dark',          caption: 'Pastel on dark' },
	{ name: 'solarized_dark',          caption: 'Solarized Dark' },
	{ name: 'terminal',                caption: 'Terminal' },
	{ name: 'tomorrow_night',          caption: 'Tomorrow Night' },
	{ name: 'tomorrow_night_blue',     caption: 'Tomorrow Night Blue' },
	{ name: 'tomorrow_night_bright',   caption: 'Tomorrow Night Bright' },
	{ name: 'tomorrow_night_eighties', caption: 'Tomorrow Night 80s' },
	{ name: 'twilight',                caption: 'Twilight' },
	{ name: 'vibrant_ink',             caption: 'Vibrant Ink' },
];