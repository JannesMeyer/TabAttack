import React, { createContext, useContext, useMemo } from 'react';
import { DragDropManager } from './DragDropManager';

const defaultManager = new DragDropManager();
const DndContext = createContext<DragDropManager>(defaultManager);

export function DndProvider({ children }: { children: React.ReactNode }) {
	const manager = useMemo(() => new DragDropManager(), []);
	return <DndContext.Provider value={manager}>{children}</DndContext.Provider>;
}

export function useDndManager(): DragDropManager {
	return useContext(DndContext) ?? defaultManager;
}
