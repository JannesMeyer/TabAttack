type SV = string | number | boolean | null | undefined;

export default class UrlQuery<K extends string> {
	
	private entries = new Map<K, string>();

	constructor(values?: Partial<Record<K, SV>>) {
		values && this.setMany(values);
	}

	static fromString(query = location.search) {
		let q = new UrlQuery();
		for (let [k, v] of query.substring(1).split('&').map(s => s.split('='))) {
			if (!k) {
				continue;
			}
			q.set(k, v ?? true);
		}
		return q;
	}

	getString(k: K) {
		return this.entries.get(k);
	}

	getNumber(k: K) {
		let n = Number(this.entries.get(k));
		return (!Number.isNaN(n) ? n : undefined);
	}

	getBoolean(k: K) {
		return this.entries.has(k);
	}

	set(k: K, v: SV) {
		if (v != null) {
			if (typeof v === 'boolean') {
				if (v) {
					v = '';
				} else {
					return;
				}
			}
			this.entries.set(k, v.toString());
		}
		return this;
	}

	setMany(values: Partial<Record<K, SV>>) {
		for (let [k, v] of Object.entries(values) as [K, SV][]) {
			this.set(k, v);
		}
		return this;
	}

	toString() {
		if (this.entries.size === 0) {
			return '';
		}
		return '?' + Array.from(this.entries.entries(), ([k, v]) => v === '' ? k : (k + '=' + encodeURIComponent(v))).join('&');
	}

}