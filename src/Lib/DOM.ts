var parser: DOMParser | undefined;

/**
 * Parse a HTML string into its DOM representation
 */
export function parseHTML(str: string) {
	if (parser == null) {
		parser = new DOMParser();
	}
	return parser.parseFromString(str, 'text/html');
}

/**
 * Use element.getElementsByTagName() and convert the result into an Array
 */
export function getTags(tagName: string, element: Element) {
	var list = [];
	var x = element.getElementsByTagName(tagName);
	for (var i = 0; i < x.length; i++) {
		list[i] = x[i];
	}
	return list;
}

/**
 * Check if the element is a place where text can be entered
 */
export function isInputElement(element: HTMLElement) {
	return element.tagName === 'INPUT' ||
	       element.tagName === 'TEXTAREA' ||
	       element.tagName === 'SELECT' ||
	       element.isContentEditable;
}

/**
 * Clear all children of a node
 */
export function removeChildren(node: Node) {
	while (node.lastChild) {
	  node.removeChild(node.lastChild);
	}
}

/**
 * Finds the nearest ancestor node with the specified node name.
 *
 * Useful to find out which link was clicked:
 * findNode('a', event.target)
 */
export function findNode(nodeName: string, node: Node | null) {
	nodeName = nodeName.toUpperCase();
	while (node !== null) {
		if (node.nodeName === nodeName) {
			return node;
		}
		node = node.parentNode;
	}
}

/**
 * Select a node's contents
 */
export function selectNodeContents(node: Node) {
	var selection = window.getSelection();
	selection.removeAllRanges();
	var range = document.createRange();
	range.selectNodeContents(node); // range.selectNode(node);
	selection.addRange(range);
}