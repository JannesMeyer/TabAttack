import isDefined from '../lib/isDefined.js';
import logError from '../lib/logError.js';

/** Maintains a list of the order in which the windows were last focused */
export default class FocusOrder {

	/** The focus order list. Most recent last. */
	private order = new Set<number>();

	constructor() {
		this.reset().catch(logError);
		browser.windows.onFocusChanged.addListener(this.handleFocusChange);
	}

	private async reset() {
		let w = await browser.windows.getLastFocused();
		this.order = new Set();
		if (w.id == null) {
			return;
		}
		this.order.add(w.id);
	}

	/** Update the list whenever a focus change event happens */
	private handleFocusChange = (id: number | undefined) => {
		if (id == null || id === -1) {
			return;
		}
		this.order.delete(id);
		this.order.add(id);
	};

	getLast(...ignoreIds: (number | undefined)[]) {
		let order = Array.from(this.order);
		let ids = new Set(ignoreIds.filter(isDefined));
		if (ids.size > 0) {
			order = order.filter(id => !ids.has(id));
		}
		return order[order.length - 1];
	}

}
