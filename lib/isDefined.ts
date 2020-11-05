export default function isDefined<T>(x: T | undefined | null): x is NonNullable<T> {
	return (x != null);
}
