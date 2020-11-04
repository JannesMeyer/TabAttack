const isBrowser = (typeof window !== 'undefined');

/**
 * We're using this to determine which modifier key should be used for ctrl key combinations.
 * On Macs the command key is used for key combinations that usually use the ctrl key.
 */
const isMac = (isBrowser && navigator.platform.includes('Mac'));

type KeyName =
	// https://www.w3.org/TR/uievents-key/#keys-ui
	|'Escape'

	// https://www.w3.org/TR/uievents-key/#keys-whitespace
	|'Tab'
	|'Enter'
	|'Space'

	// https://www.w3.org/TR/uievents-key/#keys-editing
	|'Backspace'
	|'Delete'

	// https://www.w3.org/TR/uievents-key/#keys-navigation
	|'ArrowDown'
	|'ArrowLeft'
	|'ArrowRight'
	|'ArrowUp'
	|'End'
	|'Home'
	|'PageDown'
	|'PageUp'

	// https://www.w3.org/TR/uievents-key/#keys-function
	|'F1'
	|'F2'
	|'F3'
	|'F4'
	|'F5'
	|'F6'
	|'F7'
	|'F8'
	|'F9'
	|'F10'
	|'F11'
	|'F12'
;

type TagNames = Uppercase<keyof HTMLElementTagNameMap>;

interface Options {
	ctrl?: boolean;
	meta?: boolean;
	alt?: boolean;
	shift?: boolean;
	macCtrl?: boolean;
	preventDefault?: boolean;
	stopPropagation?: boolean;
	repeat?: boolean;
	noBubbleTags?: TagNames[];
}

interface KbEvent extends Pick<KeyboardEvent, 'defaultPrevented' | 'preventDefault' | 'stopPropagation' | 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'repeat'> {
	target: unknown;
	currentTarget: unknown;
}

/** Handles a specific key combination */
export default class KeyCombination {

	private listener?: () => void;
	private key: string;
	private alt;
	private ctrl;
	private macCtrl;
	private meta;
	private shift;
	private preventDefault;
	private stopPropagation;
	private repeat;
	private noBubbleTags: Set<string>;

	/**
	 * Creates a KeyPress object which can be used as an event handler
	 * @param key Case-sensitive key identifier (https://www.w3.org/TR/uievents-key/)
	 */
	constructor(key: KeyName | (string & {}), options: Options = {}) {
		this.key = (key === 'Space' ? ' ' : key);
		this.alt = options.alt ?? false;
		this.ctrl = options.ctrl ?? false;
		this.macCtrl = options.macCtrl ?? false;
		this.meta = options.meta ?? false;
		this.shift = options.shift ?? false;
		this.preventDefault = options.preventDefault ?? true;
		this.stopPropagation = options.stopPropagation ?? false;
		this.repeat = options.repeat ?? false;
		this.noBubbleTags = new Set(options.noBubbleTags ?? ['INPUT', 'TEXTAREA', 'SELECT']);

		// Do some processing for macOS
		if (isMac && this.ctrl) {
			this.ctrl = false;
			this.meta = true;
		}
		if (this.macCtrl) {
			this.ctrl = true;
		}
	}

	on(listener?: () => void) {
		this.listener = listener;
		return this;
	}

	toString() {
		let { key, ctrl, alt, shift, meta } = this;
		if (key.length === 1) {
			key = key.toLocaleUpperCase();
		}
		if (isMac) {
			return (ctrl ? '⌃' : '') + (alt ? '⌥' : '') + (shift ? '⇧' : '') + (meta ? '⌘' : '') + key;
		}
		return (meta ? 'Win + ' : '') + (ctrl ? 'Ctrl + ' : '') + (alt ? 'Alt + ' : '') + (shift ? 'Shift + ' : '') + key;
	}

	/**
	 * KeyboardEvent handler.
	 * Compatible with DOM and React events.
	 */
	handle = (ev: KbEvent) => {
		if (this.listener == null) {
			throw new Error('Cannot handle events without a listener');
		}
		if (ev.defaultPrevented) {
			return;
		}
		if (!this.repeat && ev.repeat) {
			return;
		}
		if (ev.key !== this.key ||
			ev.ctrlKey !== this.ctrl ||
			ev.metaKey !== this.meta ||
			ev.shiftKey !== this.shift ||
			ev.altKey !== this.alt) {
			return;
		}
		if (ev.target !== ev.currentTarget && this.noBubbleTags.has((ev.target as HTMLElement).tagName)) {
			return;
		}

		// We have a match!
		this.preventDefault && ev.preventDefault();
		this.stopPropagation && ev.stopPropagation();
		this.listener();
	};
}

export function Key(...args: ConstructorParameters<typeof KeyCombination>) {
	return new KeyCombination(...args);
}