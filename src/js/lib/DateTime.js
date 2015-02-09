/**
 * Add a leading zero and convert to String if the number is
 * smaller than 10
 */
function addLeadingZero(number) {
	var str = number.toString();
	if (str.length < 2) {
		str = '0' + str;
	}
	return str;
}

/**
 * Format the current date in a custom format
 * Ex: 2 Feb 2015
 */
export function getDateString() {
	var date = new Date();
	var year = date.getFullYear();
	var monthName = date.toLocaleString('en-US', { month: 'short' });
	var day = date.getDate();

	return `${day} ${monthName} ${year}`;
}

/**
 * Create an ISO 8601 formatted date
 * Ex: 2015-02-05
 */
export function getIsoDateString() {
	var date = new Date();
	var year = date.getFullYear();
	var month = addLeadingZero(date.getMonth() + 1);
	var day = addLeadingZero(date.getDate());

	return `${year}-${month}-${day}`;
}