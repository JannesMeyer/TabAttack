export default function getUrlParams() {
	return Object.fromEntries(location.search.substring(1).split('&').filter(s => s.length).map(s => {
		let [k, v] = s.split('='); // TODO: what if there's more than 1 equal sign?
		return [k, v ?? '1'];
	}));
}
