import type str from '../../_locales/en/messages.json';

type Key = keyof typeof str;

/**
 * Returns a translated string
 * https://developer.chrome.com/extensions/i18n#toc
 */
export default function getString(name: Key, substitution?: string | number): string {
	if (typeof substitution === 'number') {
		name += (substitution === 1 ? '_one' : '');
		substitution = substitution.toString();
	}
	return browser.i18n.getMessage(name, substitution);
}