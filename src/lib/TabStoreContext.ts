import { createContext, useContext } from 'react';
import type { TabStore } from './TabStore';
import { throwError } from './throwError';

const TabStoreContext = createContext<TabStore | null>(null);
TabStoreContext.displayName = 'TabStore';
export const TabStoreProvider = TabStoreContext.Provider;

export function useTabStore() {
	return useContext(TabStoreContext) ?? throwError();
}
