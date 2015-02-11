var Chrome = {
	// Tabs
	createTab:            dechromeify(chrome.tabs, chrome.tabs.create),
	getTab:               dechromeify(chrome.tabs, chrome.tabs.get),
	getCurrentTab:        dechromeify(chrome.tabs, chrome.tabs.getCurrent),
	moveTabs:             dechromeify(chrome.tabs, chrome.tabs.move),
	queryTabs:            dechromeify(chrome.tabs, chrome.tabs.query),
	removeTabs:           dechromeify(chrome.tabs, chrome.tabs.remove),
	updateTab:            dechromeify(chrome.tabs, chrome.tabs.update),

	// Windows
	createWindow:         dechromeify(chrome.windows, chrome.windows.create),
	getWindow:            dechromeify(chrome.windows, chrome.windows.get),
	getAllWindows:        dechromeify(chrome.windows, chrome.windows.getAll),
	getLastFocusedWindow: dechromeify(chrome.windows, chrome.windows.getLastFocused),
	updateWindow:         dechromeify(chrome.windows, chrome.windows.update),
	removeWindow:         dechromeify(chrome.windows, chrome.windows.remove),

	// Preferences
	getPreferences:       dechromeify(chrome.storage.sync, chrome.storage.sync.get),
	setPreferences:       dechromeify(chrome.storage.sync, chrome.storage.sync.set),

	// Message passing
	sendMessage:          dechromeify(chrome.runtime, chrome.runtime.sendMessage),

	// Runtime
	getURL:               alias(chrome.runtime, chrome.runtime.getURL),

	// Management
	getExtensionInfo:     dechromeify(chrome.management, chrome.management.getSelf)
};
var messageHandlers = new Map();
var commandHandlers = new Map();

/**
 * Convert an async Chrome function into one that returns a Promise
 */
function dechromeify(myThis, fn) {
	return (...myArgs) => {
		return new Promise((resolve, reject) => {
			// Callback for Chrome
			myArgs.push(function() {
				if (chrome.runtime.lastError) {
					reject(chrome.runtime.lastError);
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
 * The message dispatcher
 */
function dispatchMessage(message, sender, sendResponse) {
	if (messageHandlers.has(message.operation)) {
		messageHandlers.get(message.operation)(message, sender, sendResponse);
	}
}

/**
 * The command dispatcher
 */
function dispatchCommand(command) {
	if (commandHandlers.has(command)) {
		commandHandlers.get(command)();
	}
}

/**
 * Add message handler
 */
Chrome.onMessage = function(operation, handler) {
	if (messageHandlers.size === 0) {
		chrome.runtime.onMessage.addListener(dispatchMessage);
	}
	messageHandlers.set(operation, handler);
};

/**
 * Add keyboard shortcut handler
 */
Chrome.onCommand = function(command, handler) {
	if (commandHandlers.size === 0) {
		chrome.commands.onCommand.addListener(dispatchCommand);
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
		if (substitution === 1) {
			return chrome.i18n.getMessage(name, [ substitution ]);
		} else {
			return chrome.i18n.getMessage(name + 's', [ substitution ]);
		}
	}
	return chrome.i18n.getMessage(name);
};

export default Chrome;