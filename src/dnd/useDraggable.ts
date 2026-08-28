import { useEffect, useMemo } from 'react';
import { Draggable, type DraggableOptions } from './Draggable';
import { useDragManager } from './useDragManager';

export function useDraggable(options: DraggableOptions) {
	const manager = useDragManager();
	const draggable = useMemo(() => new Draggable(options, manager), []);
	useEffect(() => () => draggable.destroy(), []);
	draggable.options = options;
	return draggable;
}
