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