export default function ready() {
	return new Promise(resolve => addEventListener('DOMContentLoaded', resolve));
}