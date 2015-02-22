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

/**
 * Returns a function, that, when invoked, will only be triggered at most once
 * during a given window of time. Normally, the throttled function will run
 * as much as it can, without ever going more than once per `wait` duration;
 * but if you'd like to disable the execution on the leading edge, pass
 * `{leading: false}`. To disable execution on the trailing edge, ditto.
 *
 * Taken from Underscore.js 1.8.2
 */
export function throttle(func, wait, options) {
	var context, args, result;
	var timeout = null;
	var previous = 0;
	if (!options) options = {};
	var later = function() {
		previous = options.leading === false ? 0 : Date.now();
		timeout = null;
		result = func.apply(context, args);
		if (!timeout) context = args = null;
	};
	return function() {
		var now = Date.now();
		if (!previous && options.leading === false) previous = now;
		var remaining = wait - (now - previous);
		context = this;
		args = arguments;
		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		} else if (!timeout && options.trailing !== false) {
			timeout = setTimeout(later, remaining);
		}
		return result;
	};
}


/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds.
 */
export function debounce(fn, wait, hash) {
	var timeouts = {};

	// Called everytime a timeout fires
	function tick(key) {
		var timeout = timeouts[key];

		var delta = Date.now() - timeout.timestamp;
		if (delta < wait) {
			// No call, start a new timeout
			timeout.t = setTimeout(tick.bind(undefined, key), wait - delta);
		} else {
			// Call now! Clean up
			delete timeouts[key];
			fn.apply(timeout.this, timeout.arguments);
		}
	}

	// Called from the outside instead of the original function
	return function() {
		// Hash this call
		var key;
		if (typeof hash === 'number') {
			key = arguments[hash];
		} else if (typeof hash === 'function') {
			key = hash.apply(undefined, arguments);
		} else {
			key = 'all';
		}

		// Get or create object for this key
		var timeout;
		if (timeouts[key]) {
			timeout = timeouts[key];
		} else {
			timeout = timeouts[key] = { t: setTimeout(tick.bind(undefined, key), wait) };
		}
		// Update values
		timeout.this = this;
		timeout.arguments = arguments;
		timeout.timestamp = Date.now();
	};
}