import { capitalize } from '../lib/StringTools';
import { isInputElement } from './DOMHelpers';

// http://www.quirksmode.org/js/keys.html
// Only some keys work in fullscreen in Safari:
// tab, enter, space, left, up, right, down, ; = , - . / ` [\ ] '

var hasWindow = (typeof window !== 'undefined');

/**
 * We're using this to determine which modifier key should be used for ctrl key combinations.
 * On Macs the command key is used for key combinations that usually use the ctrl key.
 */
var isMac = (hasWindow && window.navigator.platform.indexOf('Mac') !== -1);

/**
 * Map from strings to keyCodes
 */
var keyCodeMap = {
	'backspace': 8,
	'tab': 9,
	'clear': 12,
	'enter': 13,
	'return': 13,
	'esc': 27,
	'space': 32,
	'left': 37,
	'up': 38,
	'right': 39,
	'down': 40,
	'del': 46,
	'home': 36,
	'end': 35,
	'pageup': 33,
	'pagedown': 34,
	// TODO: F1-F12
	',': 188,
	'.': 190,
	'/': 191,
	'`': 192,
	'-': 189,
	'=': 187,
	';': 186,
	'\'': 222,
	'[': 219,
	']': 221,
	'\\': 220,
	'a': 65, 'b': 66, 'c': 67, 'd': 68,
	'e': 69, 'f': 70, 'g': 71, 'h': 72,
	'i': 73, 'j': 74, 'k': 75, 'l': 76,
	'm': 77, 'n': 78, 'o': 79, 'p': 80,
	'q': 81, 'r': 82, 's': 83, 't': 84,
	'u': 85, 'v': 86, 'w': 87, 'x': 88,
	'y': 89, 'z': 90
};

/**
 * Contains a ListenerBucket for each seen key combination hash
 */
var buckets = Object.create(null);

// Install the event handler
if (hasWindow) {
	window.addEventListener('keydown', handleKeyDown);
}

/**
 * Event handler: key down
 */
function handleKeyDown(ev) {
	var hash = ev.keyCode + '-' + (ev.ctrlKey  ? '1' : '0') + (ev.metaKey  ? '1' : '0')
		                          + (ev.shiftKey ? '1' : '0') + (ev.altKey   ? '1' : '0');
	var bucket = buckets[hash];
	if (bucket === undefined || bucket.length === 0) {
		return;
	}
	bucket = bucket.filter(lnr => lnr.inputEl || !isInputElement(ev.target));
	if (bucket.length === 0) {
		return;
	}
	if (!bucket.executeDefault) {
		ev.stopPropagation();
		ev.preventDefault();
	}
	for (var lnr of bucket) {
		lnr.call(this, ev);
	}
}

/**
 * A container for callbacks
 */
class ListenerBucket extends Array {

	constructor(char, modifiers, executeDefault) {
		this.keyName = capitalize(char);
		this.modifiers = modifiers;
		this.executeDefault = executeDefault;
	}

	toString() {
		var m = this.modifiers;
		if (isMac) {
			return (m.has('ctrl')  ? '⌃' : '') + (m.has('alt')   ? '⌥' : '') +
			       (m.has('shift') ? '⇧' : '') + (m.has('meta')  ? '⌘' : '') +
			       this.keyName;
		} else {
			return (m.has('meta')  ? 'Win+'   : '') + (m.has('ctrl')  ? 'Ctrl+'  : '') +
			       (m.has('alt')   ? 'Alt+'   : '') + (m.has('shift') ? 'Shift+' : '') +
			       this.keyName;
		}
	}

	addListener(callback, inputEl = false) {
		if (!hasWindow) { return; }
		// Just tack an attribute on the function. Why not?
		callback.inputEl = inputEl;
		this.push(callback);
	}

	removeListener(callback) {
		if (!hasWindow) { return; }
		// TODO: remove from array
	}

}

/**
 * Parse string to keyCode (numbers get returned unchanged)
 */
function parseChar(char) {
	if (typeof char === 'number') {
		return char;
	}
	if (typeof char !== 'string') {
		throw new TypeError('First argument must be a string or number');
	}
	char = char.toLowerCase();
	if (!keyCodeMap.hasOwnProperty(char)) {
		throw new Error('Key not found');
	}
	return keyCodeMap[char];
}

/**
 * Get the bucket for this specific key combination
 */
export default function KeyPress(char, options = []) {
	// TODO: What if the options are capitalized?
	var m = new Set(options);

	// Do some mangling for OS X
	if (isMac && m.has('ctrl')) {
		m.delete('ctrl');
		m.add('meta');
	}
	if (m.has('macctrl')) {
		m.add('ctrl');
	}

	// Compute hash for this key combination
	var hash = parseChar(char) + '-' + (m.has('ctrl')  ? '1' : '0') + (m.has('meta') ? '1' : '0')
		                               + (m.has('shift') ? '1' : '0') + (m.has('alt')  ? '1' : '0');

	// Return the ListenerBucket for this key combination
	if (buckets[hash] === undefined) {
		// TODO: what if char is a number? we need a mapping from a keyCode to its name
		return buckets[hash] = new ListenerBucket(char, m, m.has('executeDefault'));
	} else {
		// TODO: update executeDefault
		return buckets[hash];
	}
}