var parser;

/**
 * Use element.getElementsByTagName() and convert the result into an Array
 */
export function getTags(element, tagName) {
	var x = element.getElementsByTagName(tagName);
	for (var i = 0, a = []; i < x.length; i++) {
		a[i] = x[i];
	}
	return a;
}

/**
 * Parse a HTML string into its DOM representation
 */
export function parseHTML(string) {
	if (!parser) {
		parser = new DOMParser();
	}
	return parser.parseFromString(string, 'text/html');
}

/**
 * Clear all children of a node
 */
export function removeChildren(node) {
	while (node.lastChild) {
	  node.removeChild(node.lastChild);
	}
}

/**
 * Check if the element is a place where text can be entered
 */
export function isInputElement(el) {
	return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

/**
 * Finds the nearest ancestor element with the specified tag name
 */
export function findNode(el, nodeName) {
	nodeName = nodeName.toUpperCase();
	do {
		if (el.nodeName === nodeName) {
			return el;
		}
		el = el.parentNode;
	} while (el !== null);
}

/**
 * Select a node's contents
 */
export function selectNodeContents(node) {
	var selection = window.getSelection();
	selection.removeAllRanges();
	var range = document.createRange();
	range.selectNodeContents(node); // TODO: better than selectNode()?
	selection.addRange(range);
}