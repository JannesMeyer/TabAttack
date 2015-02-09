import Mousetrap from 'mousetrap';
import { parseQuery } from './lib/URLTools';
import { removeChildren } from './lib-browser/DOMHelpers';
import * as TabManager from './lib-chrome/TabManager';

// Get the parameters
var queryItems = parseQuery(location.search);
var targets = queryItems.windows.split(';').map(Number);
var numTabs = parseInt(queryItems.tabs);

// Set the title
document.title = Chrome.getString('move_tab', numTabs);

// Build DOM
var listState = [{
	name: 'New window',
	returnValue: undefined
}];
var buttons;
var focusIndex;
Promise.all(targets.map(id => Chrome.getWindow(id, { populate: true }))).then(windows => {
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

Mousetrap.bind(['shift+tab', 'up'], ev => {
	ev.preventDefault();
	moveFocus(-1);
});
Mousetrap.bind(['tab', 'down'], ev => {
	ev.preventDefault();
	moveFocus(+1);
});

Mousetrap.bind('esc', window.close);
window.addEventListener('blur', window.close, false);
// function close(ev) {
// 	Chrome.sendMessage({ operation: 'popup_close' });
// 	window.close();
// }
// window.addEventListener('unload', close, false);

/**
 * Button click handler
 */
function clickHandler(ev) {
	var windowId = listState[focusIndex].returnValue;
	Chrome.sendMessage({ operation: 'popup_close', windowId });
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