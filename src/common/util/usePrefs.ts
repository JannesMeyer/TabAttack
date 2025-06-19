import React from 'react';

export function usePref<V>(key: string, initialValue: V, area: chrome.storage.StorageArea = chrome.storage.sync) {
	const [value, setValue] = React.useState(initialValue);
	React.useEffect(() => {
		area.get(key, (result) => {
			if (Object.hasOwn(result, key)) {
				setValue(result[key]);
			}
		});
		area.onChanged.addListener(onChange);
		return () => area.onChanged.removeListener(onChange);
		function onChange(changes: Record<string, chrome.storage.StorageChange>) {
			if (Object.hasOwn(changes, key)) {
				setValue(changes[key]?.newValue);
			}
		}
	}, [key, area]);
	return [value, (value: V) => {
		setValue(value);
		return area.set({ [key]: value });
	}] as const;
}
