export default function assertDefined<T>(x: T, msg?: string) {
	if (x == null) {
			throw new Error(msg ?? 'Expected a value');
	}
	return x as NonNullable<T>;
}