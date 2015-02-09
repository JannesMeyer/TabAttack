/**
 * Check if the string starts with a specific string
 */
export function startsWith(str, searchString) {
	return str.slice(0, searchString.length) === searchString;
}