import { describe, expect, it } from 'bun:test';
import { resolveLightDark } from './resolveLightDark';

describe('resolveLightDark', () => {
	it('extracts named colors', () => {
		expect(resolveLightDark('light-dark(red, blue)', false)).toBe('red');
		expect(resolveLightDark('light-dark(red, blue)', true)).toBe('blue');
	});

	it('handles colors with commas inside arguments', () => {
		const light = 'rgb(255, 255, 255)';
		const dark = 'rgb(0, 0, 0)';
		expect(resolveLightDark(`light-dark(${light}, ${dark})`, false)).toBe(light);
		expect(resolveLightDark(`light-dark(${light}, ${dark})`, true)).toBe(dark);
	});

	it('returns original color if not light-dark function', () => {
		expect(resolveLightDark('#f00', false)).toBe('#f00');
		expect(resolveLightDark('#f00', true)).toBe('#f00');
		expect(resolveLightDark('rgba(0, 0, 0, 0.5)', false)).toBe('rgba(0, 0, 0, 0.5)');
	});

	it('handles extra whitespace', () => {
		expect(resolveLightDark('light-dark( #ffffff , #000000 )', false)).toBe('#ffffff');
		expect(resolveLightDark('light-dark( #ffffff , #000000 )', true)).toBe('#000000');
	});

	it('defaults to light', () => {
		expect(resolveLightDark('light-dark(red, blue)')).toBe('red');
	});
});
