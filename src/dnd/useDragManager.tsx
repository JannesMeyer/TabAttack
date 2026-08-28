import React, { useContext, useMemo } from 'react';
import { throwError } from '../lib/throwError';
import { DragManager } from './DragManager';

const Context = React.createContext<DragManager | undefined>(undefined);
Context.displayName = 'DragManagerContext';

export const DragManagerContext = ({ children }: { children: React.ReactNode }) => {
	const value = useMemo(() => new DragManager(), []);
	return <Context.Provider value={value}>{children}</Context.Provider>;
};

export function useDragManager() {
	return useContext(Context) ?? throwError('Must be used within a DragManagerContext');
}
