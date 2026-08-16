import { argbFromHex, Hct, hexFromArgb, TonalPalette } from '@material/material-color-utilities';

export type ChromeTheme = {
	frame: string;
	activeTab: string;
	accentSubtle: string;
	background: string;
	text: string;
	textMuted: string;
	tabHover: string;
	tabBorder: string;
};

type Variant = 'TonalSpot' | 'Neutral';
type Baseline = Pick<ChromeTheme, 'frame' | 'activeTab' | 'accentSubtle'>;

/** @see https://chromium.googlesource.com/chromium/src/+/main/ui/webui/resources/cr_components/theme_color_picker/color_utils.ts */
export const LIGHT_BLUE: Baseline = {
	frame: '#d3e3fd',
	activeTab: '#0b57d0',
	accentSubtle: '#c7c7c7',
};
export const DARK_BLUE: Baseline = {
	frame: '#0842a0',
	activeTab: '#a8c7fa',
	accentSubtle: '#757575',
};
export const LIGHT_GREY: Baseline = {
	frame: '#e3e3e3',
	activeTab: '#0b57d0',
	accentSubtle: '#c7c7c7',
};
export const DARK_GREY: Baseline = {
	frame: '#474747',
	activeTab: '#a8c7fa',
	accentSubtle: '#757575',
};

/**
 * @see https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/webui/cr_components/theme_color_picker/customize_chrome_colors.cc
 */
export const CHROME_THEMES = [
	preset({ seed: '#0B57D0', variant: 'TonalSpot' }),
	preset({ seed: '#E3E3E3', variant: 'Neutral' }),
	preset({ seed: rgb(140, 171, 228), variant: 'TonalSpot' }),
	preset({ seed: rgb(140, 171, 228), variant: 'Neutral' }),
	preset({ seed: rgb(136, 136, 136), variant: 'Neutral' }),
	preset({ seed: rgb(38, 166, 154), variant: 'TonalSpot' }),
	preset({ seed: rgb(0, 255, 0), variant: 'TonalSpot' }),
	preset({ seed: rgb(135, 186, 129), variant: 'Neutral' }),
	preset({ seed: rgb(250, 223, 115), variant: 'TonalSpot' }),
	preset({ seed: rgb(255, 128, 0), variant: 'TonalSpot' }),
	preset({ seed: rgb(252, 219, 201), variant: 'Neutral' }),
	preset({ seed: rgb(243, 178, 190), variant: 'TonalSpot' }),
	preset({ seed: rgb(243, 178, 190), variant: 'Neutral' }),
	preset({ seed: rgb(255, 0, 255), variant: 'TonalSpot' }),
	preset({ seed: rgb(229, 213, 252), variant: 'TonalSpot' }),
];

function preset({ seed, variant }: { seed: string; variant: Variant }) {
	const light = generateTheme(seed, false, variant);
	const dark = generateTheme(seed, true, variant);
	if (seed === '#0B57D0') {
		return { light: { ...light, ...LIGHT_BLUE }, dark: { ...dark, ...DARK_BLUE } };
	}
	if (seed === '#E3E3E3') {
		return { light: { ...light, ...LIGHT_GREY }, dark: { ...dark, ...DARK_GREY } };
	}
	return { light, dark };
}

function rgb(r: number, g: number, b: number): string {
	return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Derives theme colors from a seed color and scheme variant.
 * @see https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/webui/cr_components/theme_color_picker/theme_color_picker_handler.cc
 */
function generateTheme(
	seedHex: string,
	isDark: boolean,
	variant: Variant,
): ChromeTheme {
	const { primaryPalette, secondaryPalette, neutralPalette, neutralVariantPalette } = generatePalettes(seedHex, variant);
	if (isDark) {
		return {
			frame: hexFromArgb(primaryPalette.tone(30)),
			activeTab: hexFromArgb(primaryPalette.tone(80)),
			accentSubtle: hexFromArgb(secondaryPalette.tone(50)),
			background: hexFromArgb(neutralPalette.tone(6)),
			text: hexFromArgb(neutralPalette.tone(90)),
			textMuted: hexFromArgb(neutralVariantPalette.tone(70)),
			tabHover: hexFromArgb(primaryPalette.tone(25)),
			tabBorder: hexFromArgb(neutralVariantPalette.tone(30)),
		};
	} else {
		return {
			frame: hexFromArgb(primaryPalette.tone(90)),
			activeTab: hexFromArgb(primaryPalette.tone(40)),
			accentSubtle: hexFromArgb(primaryPalette.tone(80)),
			background: hexFromArgb(neutralPalette.tone(98)),
			text: hexFromArgb(neutralPalette.tone(10)),
			textMuted: hexFromArgb(neutralVariantPalette.tone(40)),
			tabHover: hexFromArgb(primaryPalette.tone(85)),
			tabBorder: hexFromArgb(neutralVariantPalette.tone(80)),
		};
	}
}

interface DynamicPalettes {
	primaryPalette: TonalPalette;
	secondaryPalette: TonalPalette;
	neutralPalette: TonalPalette;
	neutralVariantPalette: TonalPalette;
}

function generatePalettes(seedHex: string, variant: Variant): DynamicPalettes {
	const hue = Hct.fromInt(argbFromHex(seedHex)).hue;
	if (variant === 'TonalSpot') {
		return {
			primaryPalette: TonalPalette.fromHueAndChroma(hue, 40.0),
			secondaryPalette: TonalPalette.fromHueAndChroma(hue, 16.0),
			neutralPalette: TonalPalette.fromHueAndChroma(hue, 6.0),
			neutralVariantPalette: TonalPalette.fromHueAndChroma(hue, 8.0),
		};
	} else {
		const huesToChromas = [
			[0, 12.0],
			[260, 12.0],
			[315, 20.0],
			[360, 12.0],
		] as const;
		const primaryChroma = getAdjustedChroma(hue, huesToChromas);
		return {
			primaryPalette: TonalPalette.fromHueAndChroma(hue, primaryChroma),
			secondaryPalette: TonalPalette.fromHueAndChroma(hue, 8.0),
			neutralPalette: TonalPalette.fromHueAndChroma(hue, 2.0),
			neutralVariantPalette: TonalPalette.fromHueAndChroma(hue, 2.0),
		};
	}
}

/**
 * Generates tonal palettes matching Chromium's ui::GeneratePalette() in:
 * @see https://chromium.googlesource.com/chromium/src/+/main/ui/color/dynamic_color/palette_factory.cc
 */
function getAdjustedChroma(sourceHue: number, huesToChromas: readonly (readonly [number, number])[]): number {
	for (const [hue, chroma] of huesToChromas) {
		if (sourceHue <= hue) return chroma;
	}
	return huesToChromas[0]![1];
}
