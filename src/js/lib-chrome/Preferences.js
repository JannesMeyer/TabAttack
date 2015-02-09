var defaults = {
	tabThreshold: 15
};

function objectWithDefaults(keys) {
	var obj = {}, i, key;
	for (i = 0; i < keys.length; ++i) {
		key = keys[i];
		obj[key] = defaults.hasOwnProperty(key) ? defaults[key] : undefined;
	}
	return obj;
}

export function getOne(key) {
	return Chrome.getPreferences(objectWithDefaults([key]))
		.then(function(items) {
			return items[key];
		});
}

export function getMany(keys) {
	return Chrome.getPreferences(objectWithDefaults(keys));
}