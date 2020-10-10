/**
 * Formats the current date as per ISO 8601
 * For example: 2015-02-05
 */
export default function getIsoDate(d = new Date()) {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number) {
	return n.toString().padStart(2, '0');
}