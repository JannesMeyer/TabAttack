interface Options {
	ctrl: boolean;
	meta: boolean;
	alt: boolean;
	shift: boolean;
	macCtrl: boolean;
	preventDefault: boolean;
	stopPropagation: boolean;
	ignoreInputElements: boolean;
	repeat: boolean;
}

interface KBE extends Pick<KeyboardEvent, 'defaultPrevented' | 'preventDefault' | 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'repeat'> {
	target: unknown;
}

export enum K {
	// Control Characters: https://www.w3.org/TR/uievents-key/#control
	Backspace = 'Backspace',
	Tab = 'Tab',
	Enter = 'Enter',
	Escape = 'Escape',
	Delete = 'Delete',
	Space = ' ',

	// Navigation keys: https://www.w3.org/TR/uievents-key/#keys-navigation
	ArrowDown = 'ArrowDown',
	ArrowLeft = 'ArrowLeft',
}

const isBrowser = (typeof window !== 'undefined');

/**
 * We're using this to determine which modifier key should be used for ctrl key combinations.
 * On Macs the command key is used for key combinations that usually use the ctrl key.
 */
const isMac = (isBrowser && navigator.platform.includes('Mac'));

/** Handles a specific key combination */
export default class KeyDown {

	private listener?: () => void;
	private options: Options = {
		alt: false,
		ctrl: false,
		macCtrl: false,
		meta: false,
		shift: false,
		preventDefault: true,
		stopPropagation: false,
		ignoreInputElements: false,
		repeat: false,
	};

	/**
	 * Creates a KeyPress object which can be used as an event handler
	 * @param key Case-sensitive key identifier (https://www.w3.org/TR/uievents-key/)
	 * @param options 
	 */
	constructor(private key: string, options: Partial<Options> = {}) {
		// Default values
		Object.assign(this.options, options);

		// Do some processing for macOS
		if (isMac && options.ctrl) {
			options.ctrl = false;
			options.meta = true;
		}
		if (options.macCtrl) {
			options.ctrl = true;
		}
	}

	setListener(listener: () => void, global = false) {
		this.removeListener();
		this.listener = listener;
		global && addEventListener('keydown', this.handle);
		return this;
	}

	removeListener() {
		this.listener = undefined;
		removeEventListener('keydown', this.handle);
		return this;
	}

	toString() {
		let m = this.options;
		if (isMac) {
			return (m.ctrl  ? '⌃' : '') + (m.alt   ? '⌥' : '') + (m.shift ? '⇧' : '') + (m.meta  ? '⌘' : '') + this.key;
		}
		return (m.meta  ? 'Win + '   : '') + (m.ctrl  ? 'Ctrl + '  : '') + (m.alt   ? 'Alt + '   : '') + (m.shift ? 'Shift + ' : '') + this.key;
	}

	/**
	 * KeyboardEvent handler.
	 * Compatible with DOM and React events.
	 */
	handle = (ev: KBE) => {
		if (ev.defaultPrevented || this.listener == null) {
			return;
		}
		let { options } = this;
		if (!options.repeat && ev.repeat) {
			return;
		}
		if (ev.key !== this.key ||
			ev.ctrlKey !== options.ctrl ||
			ev.metaKey !== options.meta ||
			ev.shiftKey !== options.shift ||
			ev.altKey !== options.alt) {
			return;
		}
		if (options.ignoreInputElements && isInputElement(ev.target)) {
			return;
		}

		// We have a match!
		options.preventDefault && ev.preventDefault();
		this.listener();
	};
}

/**
 * Check if the element is a place where text can be entered
 */
function isInputElement(el: unknown): boolean {
	return !(el instanceof HTMLElement) ||
		el.tagName === 'INPUT' ||
		el.tagName === 'TEXTAREA' ||
		el.tagName === 'SELECT' ||
		el.isContentEditable;
}