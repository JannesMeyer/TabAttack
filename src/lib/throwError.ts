export function throwError(error: unknown = new Error()): never {
	if (typeof error === 'string') {
		error = new Error(error);
	}
	throw error;
}
