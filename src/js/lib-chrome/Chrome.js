import '../lib/object-assign';

var messageHandlers = new Map();
var commandHandlers = new Map();

// TODO: Lazy initialization
var Chrome = {
	// Tabs
	createTab:            dechromeify(chrome.tabs, chrome.tabs.create),
	getTab:               dechromeify(chrome.tabs, chrome.tabs.get),
	getCurrentTab:        dechromeify(chrome.tabs, chrome.tabs.getCurrent),
	moveTabs:             dechromeify(chrome.tabs, chrome.tabs.move),
	queryTabs:            dechromeify(chrome.tabs, chrome.tabs.query),
	removeTabs:           dechromeify(chrome.tabs, chrome.tabs.remove),
	updateTab:            dechromeify(chrome.tabs, chrome.tabs.update),
	duplicateTab:         dechromeify(chrome.tabs, chrome.tabs.duplicate),

	// Windows
	createWindow:         dechromeify(chrome.windows, chrome.windows.create),
	getWindow:            dechromeify(chrome.windows, chrome.windows.get),
	getAllWindows:        dechromeify(chrome.windows, chrome.windows.getAll),
	getLastFocusedWindow: dechromeify(chrome.windows, chrome.windows.getLastFocused),
	updateWindow:         dechromeify(chrome.windows, chrome.windows.update),
	removeWindow:         dechromeify(chrome.windows, chrome.windows.remove),

	// Preferences (see Chrome.setDefaults below)
	_getPreferences:      dechromeify(chrome.storage.sync, chrome.storage.sync.get),
	setPreferences:       dechromeify(chrome.storage.sync, chrome.storage.sync.set),
	clearPreferences:     dechromeify(chrome.storage.sync, chrome.storage.sync.clear),

	// Message passing
	_sendMessage:          dechromeify(chrome.runtime, chrome.runtime.sendMessage, { responseErrors: true }),

	// Runtime
	getURL:               alias(chrome.runtime, chrome.runtime.getURL),

	// Management
	getExtensionInfo:     dechromeify(chrome.management, chrome.management.getSelf)
};

/**
 * Convert an async Chrome function into one that returns a Promise
 */
function dechromeify(myThis, fn, opts = {}) {
	return (...myArgs) => {
		return new Promise((resolve, reject) => {
			// Callback for Chrome
			myArgs.push(function(one) {
				if (chrome.runtime.lastError) {
					// Chrome API error
					reject.call(this, chrome.runtime.lastError);
				} else if (opts.responseErrors && one !== undefined && one.error !== undefined) {
					// Call value error
					reject.call(this, one.error);
				} else {
					resolve.apply(this, arguments);
				}
			});

			// Execute Chrome function
			fn.apply(myThis, myArgs);
		});
	};
}

/**
 * Rename a sync function
 */
function alias(myThis, fn) {
	return (...myArgs) => fn.apply(myThis, myArgs);
}

/**
 * Inject default values into `Chrome.getPreferences`
 */
Chrome.setDefaults = function(defaults) {
	if (Chrome.getPreferences) {
		console.warn('Setting the defaults more than once');
	}

	/**
	 * Create request object with default values for the keys
	 *
	 * @param keys: Array of String
	 */
	function objectWithDefaults(keys) {
		if (!Array.isArray(keys)) {
			throw new Error('Not an array');
		}
		var request = {};
		for (var key of keys) {
			if (!defaults.hasOwnProperty(key)) {
				throw new Error(`No default value for '${key}' found`);
			}
			request[key] = defaults[key];
		}
		return request;
	}

	/**
	 * Request several preference values
	 *
	 * @param keys: Array of String
	 * @returns a promise that resolves to an object with the items
	 */
	Chrome.getPreferences = function(keys) {
		if (keys === undefined) {
			return Chrome._getPreferences(defaults);
		}
		return Chrome._getPreferences(objectWithDefaults(keys));
	};

	/**
	 * Request one preference value
	 *
	 * @param key: String
	 * @returns a promise that resolves to the vale
	 */
	Chrome.getPreference = function(key) {
		return Chrome._getPreferences(objectWithDefaults([ key ])).then(items => items[key]);
	};
};

Chrome.sendMessage = function(operation, message) {
	return Chrome._sendMessage(Object.assign({ _chrome_operation: operation }, message));
}

/**
 * Add message handler
 */
Chrome.onMessage = function(operation, handler) {
	if (messageHandlers.size === 0) {
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			var operation = message._chrome_operation;
			if (messageHandlers.has(operation)) {
				delete message._chrome_operation;
				messageHandlers.get(operation)(message, sender, sendResponse);
			}
		});
	}
	messageHandlers.set(operation, handler);
};

/**
 * Add keyboard shortcut handler
 */
Chrome.onCommand = function(command, handler) {
	if (commandHandlers.size === 0) {
		chrome.commands.onCommand.addListener(command => {
			if (commandHandlers.has(command)) {
				commandHandlers.get(command)();
			}
		});
	}
	commandHandlers.set(command, handler);
};

/*
 * Add browser action handler
 */
Chrome.onBrowserAction = function(handler) {
	chrome.browserAction.onClicked.addListener(handler);
};

/**
 * Get internationalized string
 */
Chrome.getString = function(name, substitution) {
	if (substitution !== undefined) {
		if (typeof substitution === 'number' && substitution > 1) {
			return chrome.i18n.getMessage(name + 's', [ substitution ]);
		}
		return chrome.i18n.getMessage(name, [ substitution ]);
	}
	return chrome.i18n.getMessage(name);
};

export default Chrome;