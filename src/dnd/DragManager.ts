import type { Draggable } from './Draggable';

export class DragManager {
	private draggables = new Set<Draggable>();

	constructor() {}

	register(draggable: Draggable) {
		this.draggables.add(draggable);
	}

	unregister(draggable: Draggable) {
		this.draggables.delete(draggable);
	}

	getGroup(member: Draggable): Draggable[] {
		const { type, group } = member.options;
		const result: Draggable[] = [];
		for (const x of this.draggables) {
			if (x.options.type === type && x.options.group === group) {
				result.push(x);
			}
		}
		result.sort((a, b) => a.options.index - b.options.index);
		return result;
	}
}
