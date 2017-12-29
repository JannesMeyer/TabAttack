/**
 * Returns a translated string
 * https://developer.chrome.com/extensions/i18n#toc
 */
export function getString(name: string, substitution?: string | number): string {
  if (typeof substitution === 'number') {
    name += (substitution === 1 ? '_one' : '_many');
  }
  return browser.i18n.getMessage(name, [ substitution ]);
}