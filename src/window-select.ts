import KeyPress from 'keypress-tool';
import { parseQuery } from './lib/QueryString';
import { removeChildren } from './lib/DOM';
import getString from './lib/browser/getString';
import { sendMessage } from './lib/browser/sendMessage';
import assertDefined from './lib/assertDefined';

let returned = false;

// Get the parameters
let query = parseQuery(location.search);
let windowIds = query.windowIds.split(';').map(Number);
let numTabs = Number(query.numTabs);

// Set the title
document.title = getString('move_tab', numTabs);

// Build DOM
let listState: { name: string, returnValue: number, tabs?: browser.tabs.Tab[] }[] = [
  { name: getString('new_window'), returnValue: -1 }
];
let buttons: HTMLButtonElement[];
let focusIndex: number;
Promise.all(
	windowIds.map(id => browser.windows.get(id, { populate: true }))
).then(windows => {
	for (let w of windows) {
		listState.push({
			name: getString('window_with_tab', assertDefined(w.tabs).length),
			tabs: assertDefined(w.tabs),
			returnValue: assertDefined(w.id),
		});
	}
	buttons = renderButtons(document.body);
	buttons[0].focus();
});

KeyPress('Tab', 'shift').addListener(moveFocus.bind(null, -1));
KeyPress('Up').addListener(moveFocus.bind(null, -1));
KeyPress('Tab').addListener(moveFocus.bind(null, 1));
KeyPress('Down').addListener(moveFocus.bind(null, 1));

KeyPress('Esc').addListener(() => returnMessage());
window.addEventListener('blur', () => returnMessage());
window.addEventListener('unload', () => returnMessage());

/**
 * Closing the popup without returning anything
 */
function returnMessage(val: { newWindow?: boolean, windowId?: number } = {}) {
	if (!returned) {
		sendMessage('popup_close', val);
		returned = true;
		window.close();
	}
}

/**
 * Button click handler
 */
function clickHandler() {
	let windowId = listState[focusIndex].returnValue;
	if (windowId === -1) {
		returnMessage({ newWindow: true });
	} else {
		returnMessage({ windowId });
	}
}

/**
 * Focus change event handler
 */
function focusHandler(ev: FocusEvent) {
	for (let i = 0; i < buttons.length; ++i) {
		if (buttons[i] === ev.target) {
			focusIndex = i;
		}
	}
}

/**
 * Move the focus by delta items in the tab order
 */
function moveFocus(delta: number) {
	let index = (buttons.length + focusIndex + delta) % buttons.length;
	buttons[index].focus();
	buttons[index].scrollIntoView(delta < 0);
}

/**
 * Render the buttons to the root element
 */
function renderButtons(root: HTMLElement) {
	// Remove children from root
	removeChildren(root);

	// Render
	let main = document.createElement('div');
	let buttons = listState.map(item => {
		let button = document.createElement('button');
		main.appendChild(button);

		let text = document.createTextNode(item.name);
		button.appendChild(text);

		// Register events
		button.addEventListener('focus', focusHandler);
		button.addEventListener('click', clickHandler);

		// Tab preview
		if (item.tabs) {
			let tabs = document.createElement('div');
			button.appendChild(tabs);

			for (let tab of item.tabs) {
				let favicon = document.createElement('img');
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