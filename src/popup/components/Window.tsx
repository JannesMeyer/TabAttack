import { Droppable } from '@hello-pangea/dnd';
import React from 'react';
import { useLocalStorage } from '../../common/util/useLocalStorage';
import { cx } from '../../lib/css';
import { TabStore, TWindow } from '../TabStore';
import { Editable } from './Editable';
import { Tab } from './Tab';

type Props = {
	window: TWindow;
	activeWindowId: number | undefined;
	reverse: boolean;
	store: TabStore;
};

export const Window = React.memo(
	({ window: { id, tabs, tabsOverlay, activeTabId }, activeWindowId, reverse, store }: Props) => {
		return (
			<div className={cx('Window', { active: id === activeWindowId })}>
				<WindowTitle id={id} />
				<Droppable key={id} droppableId={id.toString()}>
					{provided => (
						<div {...provided.droppableProps} ref={provided.innerRef} className={'mainTabs'}>
							{(reverse ? (tabsOverlay ?? tabs).toReversed() : (tabsOverlay ?? tabs)).map((tabId, index) => (
								<Tab
									key={tabId}
									store={store}
									tabId={tabId}
									index={index}
									active={tabId === activeTabId}
									windowId={id}
									activeWindowId={activeWindowId}
								/>
							))}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</div>
		);
	},
);

const WindowTitle = React.memo(({ id }: { id: number }) => {
	const input = React.useRef<HTMLInputElement>(null);
	const [value, setValue] = useLocalStorage(`window-${id}`);
	return <Editable ref={input} className={'windowTitle'} value={value || `Window ${id}`} onChange={setValue} />;
});
