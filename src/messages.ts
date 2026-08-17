import type str from '../dist/_locales/en/messages.json';

type Key = keyof typeof str;

/**
 * Returns a translated string
 * @see https://developer.chrome.com/extensions/i18n
 */
export default function t(name: Key, substitution?: string | number): string {
	if (typeof substitution === 'number') {
		name += substitution === 1 ? '_one' : '';
		substitution = substitution.toString();
	}
	return chrome.i18n.getMessage(name, substitution);
}
