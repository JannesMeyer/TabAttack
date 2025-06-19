import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { TabStore, type TWindow } from '../TabStore';
import { Tab } from './Tab';

type Props = {
	window: TWindow | undefined;
	activeWindowId: number | undefined;
	store: TabStore;
};

export const WindowTabList = React.memo(
	({ window, activeWindowId, store }: Props) => {
		if (!window) {
			return null;
		}
		const { id, tabs, tabsOverlay, activeTabId } = window;
		return (
			<Droppable key={id} droppableId={`${id} window`} type={'TAB'} direction={'vertical'}>
				{provided => (
					<div {...provided.droppableProps} ref={provided.innerRef} className={'mainTabs'}>
						{((tabsOverlay ?? tabs).toReversed()).map((tabId, index) => (
							<Tab
								key={tabId}
								store={store}
								tabId={tabId}
								index={index}
								windowId={id}
								activeTabId={activeTabId}
								activeWindowId={activeWindowId}
							/>
						))}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		);
	},
);
