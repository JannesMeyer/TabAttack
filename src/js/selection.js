import KeyPress from 'keypress-tool';
import { parseQuery } from './lib/query-string';
import { removeChildren } from './lib-browser/dom-tool';

// Get the parameters
var query = parseQuery(location.search);
var windowIds = query.windowIds.split(';').map(Number);
var numTabs = Number(query.numTabs);

// Set the title
document.title = Chrome.getString('move_tab', numTabs);

// Build DOM
var listState = [{
	name: Chrome.getString('new_window'),
	returnValue: undefined
}];
var buttons;
var focusIndex;
Promise.all(windowIds.map(id => Chrome.getWindow(id, { populate: true }))).then(windows => {
	for (var wnd of windows) {
		listState.push({
			name: Chrome.getString('window_with_tab', wnd.tabs.length),
			tabs: wnd.tabs,
			returnValue: wnd.id
		});
	}
	buttons = renderButtons(document.body);
	buttons[0].focus();
});

KeyPress('tab', ['shift']).addListener(moveFocus.bind(null, -1));
KeyPress('up').addListener(moveFocus.bind(null, -1));
KeyPress('tab').addListener(moveFocus.bind(null, 1));
KeyPress('down').addListener(moveFocus.bind(null, 1));

KeyPress('esc').addListener(close);
window.addEventListener('blur', close);
window.addEventListener('unload', close);

/**
 * Close the popup without returning anything
 */
function close(ev) {
	Chrome.sendMessage('popup_close');
	window.close();
}

/**
 * Button click handler
 */
function clickHandler(ev) {
	var windowId = listState[focusIndex].returnValue;
	Chrome.sendMessage('popup_return', { windowId });
	window.close();
}

/**
 * Focus change event handler
 */
function focusHandler(ev) {
	for (var i = 0; i < buttons.length; ++i) {
		if (buttons[i] === ev.target) {
			focusIndex = i;
		}
	}
}

/**
 * Move the focus by delta items in the tab order
 */
function moveFocus(delta) {
	var index = (buttons.length + focusIndex + delta) % buttons.length;
	buttons[index].focus();
	buttons[index].scrollIntoView(delta < 0);
}

/**
 * Render the buttons to the root element
 */
function renderButtons(root) {
	// Remove children from root
	removeChildren(root);

	// Render
	var main = document.createElement('div');
	var buttons = listState.map((item, i) => {
		var button = document.createElement('button');
		main.appendChild(button);

		var text = document.createTextNode(item.name);
		button.appendChild(text);

		// Register events
		button.addEventListener('focus', focusHandler);
		button.addEventListener('click', clickHandler);

		// Tab preview
		if (item.tabs) {
			var tabs = document.createElement('div');
			button.appendChild(tabs);

			for (var tab of item.tabs) {
				var favicon = document.createElement('img');
				favicon.src = 'chrome://favicon/' + tab.url;
				tabs.appendChild(favicon);
			}
		}

		return button;
	});
	// Attach tree to the DOM
	root.appendChild(main);
	return buttons;
}