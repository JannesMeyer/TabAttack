import type { DropPosition } from '../../lib/dnd';

export function calculateDropIndex({
	order,
	targetId,
	sourceWindowId,
	targetWindowId,
	draggedIds,
	position = 'bottom',
}: {
	order: (number | undefined)[];
	targetId: number;
	sourceWindowId: number;
	targetWindowId: number;
	draggedIds: number[];
	position?: DropPosition;
}): number {
	const currentTabIndex = order.indexOf(targetId);
	if (currentTabIndex === -1) {
		return -1;
	}

	const rawIndex = position === 'top' ? currentTabIndex + 1 : currentTabIndex;

	if (sourceWindowId === targetWindowId) {
		const tabsBeforeTarget = draggedIds.filter(id => {
			const idx = order.indexOf(id);
			return idx !== -1 && idx < rawIndex;
		}).length;
		return rawIndex - tabsBeforeTarget;
	}

	return rawIndex;
}
