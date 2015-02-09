/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds.
 */
function debounce(fn, wait, hash) {
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

export default debounce;