export default function assertDefined<T>(value: T, message?: string) {
	if (value == null) {
		throw new Error(message ?? 'Expected a value');
	}
	return value as NonNullable<T>;
}
