import React from 'react';

export function useLocalStorage(key: string) {
	const [value, setValue] = React.useState(() => localStorage.getItem(key));
	const update = React.useCallback((value: string | null) => {
		if (value == null) {
			localStorage.removeItem(key);
		} else {
			localStorage.setItem(key, value);
		}
		setValue(value);
	}, [key]);
	React.useEffect(() => {
		addEventListener('storage', callback);
		return () => {
			removeEventListener('storage', callback);
		};
		function callback(ev: StorageEvent) {
			if (ev.key === key) {
				setValue(ev.newValue);
			}
		}
	}, []);
	return [value, update] as const;
}
