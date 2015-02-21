/**
 * Check if the string starts with a specific string
 */
export function startsWith(str, searchString) {
	return str.slice(0, searchString.length) === searchString;
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}