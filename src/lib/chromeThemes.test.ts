import { describe, expect, test } from 'bun:test';
import { CHROME_THEMES, DARK_BLUE, DARK_GREY, LIGHT_BLUE, LIGHT_GREY } from './chromeThemes';

describe('Chrome themes', () => {
	test('theme 0', () => {
		expect(CHROME_THEMES[0]).toMatchObject({ light: LIGHT_BLUE, dark: DARK_BLUE });
	});

	test('theme 1', () => {
		expect(CHROME_THEMES[1]).toMatchObject({ light: LIGHT_GREY, dark: DARK_GREY });
	});

	test('theme 2', () => {
		expect(CHROME_THEMES[2]).toMatchObject({
			light: { frame: '#d6e3ff', activeTab: '#3a5e98', accentSubtle: '#aac7ff' },
			dark: { frame: '#1f467e', activeTab: '#aac7ff', accentSubtle: '#6e778a' },
		});
	});

	test('theme 3', () => {
		expect(CHROME_THEMES[3]).toMatchObject({
			light: { frame: '#d6e3ff', activeTab: '#525f77', accentSubtle: '#bac7e3' },
			dark: { frame: '#3b475e', activeTab: '#bac7e3', accentSubtle: '#74777f' },
		});
	});

	test('theme 4', () => {
		expect(CHROME_THEMES[4]).toMatchObject({
			light: { frame: '#d4e6e9', activeTab: '#516164', accentSubtle: '#b8cacd' },
			dark: { frame: '#39494c', activeTab: '#b8cacd', accentSubtle: '#6f797a' },
		});
	});

	test('theme 5', () => {
		expect(CHROME_THEMES[5]).toMatchObject({
			light: { frame: '#91f4e7', activeTab: '#006a62', accentSubtle: '#74d7cb' },
			dark: { frame: '#005049', activeTab: '#74d7cb', accentSubtle: '#627c78' },
		});
	});

	test('theme 6', () => {
		expect(CHROME_THEMES[6]).toMatchObject({
			light: { frame: '#bbf1a9', activeTab: '#3b6930', accentSubtle: '#a0d490' },
			dark: { frame: '#23501b', activeTab: '#a0d490', accentSubtle: '#6c7b65' },
		});
	});

	test('theme 7', () => {
		expect(CHROME_THEMES[7]).toMatchObject({
			light: { frame: '#dae6d3', activeTab: '#566253', accentSubtle: '#becab8' },
			dark: { frame: '#3f4a3c', activeTab: '#becab8', accentSubtle: '#72796f' },
		});
	});

	test('theme 8', () => {
		expect(CHROME_THEMES[8]).toMatchObject({
			light: { frame: '#fce27c', activeTab: '#6f5d00', accentSubtle: '#dec663' },
			dark: { frame: '#544600', activeTab: '#dec663', accentSubtle: '#807757' },
		});
	});

	test('theme 9', () => {
		expect(CHROME_THEMES[9]).toMatchObject({
			light: { frame: '#ffdcc7', activeTab: '#8e4e1c', accentSubtle: '#ffb787' },
			dark: { frame: '#713704', activeTab: '#ffb787', accentSubtle: '#90715d' },
		});
	});

	test('theme 10', () => {
		expect(CHROME_THEMES[10]).toMatchObject({
			light: { frame: '#fbdccc', activeTab: '#705a4d', accentSubtle: '#dec1b1' },
			dark: { frame: '#574236', activeTab: '#dec1b1', accentSubtle: '#85746b' },
		});
	});

	test('theme 11', () => {
		expect(CHROME_THEMES[11]).toMatchObject({
			light: { frame: '#ffd9df', activeTab: '#924759', accentSubtle: '#ffb1c0' },
			dark: { frame: '#753041', activeTab: '#ffb1c0', accentSubtle: '#906e74' },
		});
	});

	test('theme 12', () => {
		expect(CHROME_THEMES[12]).toMatchObject({
			light: { frame: '#fadbdf', activeTab: '#70585c', accentSubtle: '#ddbfc3' },
			dark: { frame: '#574145', activeTab: '#ddbfc3', accentSubtle: '#847375' },
		});
	});

	test('theme 13', () => {
		expect(CHROME_THEMES[13]).toMatchObject({
			light: { frame: '#ffd7f5', activeTab: '#834a7d', accentSubtle: '#f6b0ea' },
			dark: { frame: '#693364', activeTab: '#f6b0ea', accentSubtle: '#877082' },
		});
	});

	test('theme 14', () => {
		expect(CHROME_THEMES[14]).toMatchObject({
			light: { frame: '#ebdcff', activeTab: '#6a5294', accentSubtle: '#d4bbff' },
			dark: { frame: '#513a7a', activeTab: '#d4bbff', accentSubtle: '#7c7389' },
		});
	});
});
