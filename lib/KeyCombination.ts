interface Options {
	ctrl?: boolean;
	meta?: boolean;
	alt?: boolean;
	shift?: boolean;
	macCtrl?: boolean;
	preventDefault?: boolean;
	stopPropagation?: boolean;
	repeat?: boolean;
}

interface KbEvent extends Pick<KeyboardEvent, 'defaultPrevented' | 'preventDefault' | 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'repeat'> {
	target: unknown;
	currentTarget: unknown;
}

const enum KeyName {
	// Control Characters: https://www.w3.org/TR/uievents-key/#control
	Backspace,
	Tab,
	Enter,
	Escape,
	Delete,
	Space,

	// Navigation keys: https://www.w3.org/TR/uievents-key/#keys-navigation
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,

	End,
	Home,
	PageDown,
	PageUp,
}

const isBrowser = (typeof window !== 'undefined');

/**
 * We're using this to determine which modifier key should be used for ctrl key combinations.
 * On Macs the command key is used for key combinations that usually use the ctrl key.
 */
const isMac = (isBrowser && navigator.platform.includes('Mac'));

const noBubbleTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Handles a specific key combination */
export default class KeyCombination {

	private listener?: () => void;

	readonly options: Readonly<Required<Options>>;

	readonly key: string;

	/**
	 * Creates a KeyPress object which can be used as an event handler
	 * @param key Case-sensitive key identifier (https://www.w3.org/TR/uievents-key/)
	 */
	constructor(key: keyof typeof KeyName | (string & {}), options: Options = {}) {
		if (key === 'Space') {
			key = ' ';
		}
		this.key = key;
		// Default values
		let m = this.options = {
			alt: options.alt ?? false,
			ctrl: options.ctrl ?? false,
			macCtrl: options.macCtrl ?? false,
			meta: options.meta ?? false,
			shift: options.shift ?? false,
			preventDefault: options.preventDefault ?? true,
			stopPropagation: options.stopPropagation ?? false,
			repeat: options.repeat ?? false,
		};

		// Do some processing for macOS
		if (isMac && m.ctrl) {
			m.ctrl = false;
			m.meta = true;
		}
		if (m.macCtrl) {
			m.ctrl = true;
		}
		this.options = m;
	}

	on(listener?: () => void) {
		this.listener = listener;
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
	handle = (ev: KbEvent) => {
		if (ev.defaultPrevented) {
			return;
		}
		let { options: m } = this;
		if (!m.repeat && ev.repeat) {
			return;
		}
		if (ev.key !== this.key ||
			ev.ctrlKey !== m.ctrl ||
			ev.metaKey !== m.meta ||
			ev.shiftKey !== m.shift ||
			ev.altKey !== m.alt) {
			return;
		}
		if (ev.target !== ev.currentTarget && noBubbleTags.has((ev.target as HTMLElement).tagName)) {
			return;
		}

		// We have a match!
		m.preventDefault && ev.preventDefault();
		this.listener!();
	};
}

export function Key(...args: ConstructorParameters<typeof KeyCombination>) {
	return new KeyCombination(...args);
}