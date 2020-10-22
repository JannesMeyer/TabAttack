type RequireValues<T, K extends keyof T> = T & Required<Pick<T, K>>;

export default function requireValues<T, K extends keyof T>(obj: T, ...keys: K[]) {
	for (let k of keys) {
		if (obj[k] == null) {
			throw new Error(`Value for field ${k} is required`);
		}
	}
	return obj as RequireValues<T, K>;
}
