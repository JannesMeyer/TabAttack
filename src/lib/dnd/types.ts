export type DropPosition = 'top' | 'bottom';

export type TabDragPayload = {
	tabIds: number[];
	sourceWindowId: number;
};

export type ActiveDropTarget = {
	id: number | string;
	position: DropPosition;
};
