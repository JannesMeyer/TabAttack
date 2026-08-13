import { useSortable } from '@dnd-kit/react/sortable';
import * as React from 'react';
import { useSnapshot } from 'valtio';
import { cx } from '../../lib/cx';
import { useTabStore } from '../../lib/TabStoreContext';
import { actionType } from '../popup';
import { AudibleIcon } from './icons/AudibleIcon';
import { MutedIcon } from './icons/MutedIcon';
import { TabIcon } from './TabIcon';

const self = location.href;

type Props = {
	windowId: number;
	tabId: number | undefined;
	index?: number;
	helpText?: string;
};

export { d as Tab };
const d = React.memo(function Tab({ windowId, tabId = chrome.tabs.TAB_ID_NONE, index, helpText }: Props) {
	const store = useTabStore();
	const snap = useSnapshot(store.state);
	const tab = snap.tabs.get(tabId);
	const disabled = index == null;
	const { ref, isDragging } = useSortable({
		id: tabId,
		index: index ?? NaN,
		disabled,
		type: 'tab',
		accept: 'tab',
		group: windowId,
	});
	if (!tab) {
		return <div>ERROR: {tabId} not found</div>;
	}
	return (
		<a
			ref={ref}
			draggable={false}
			onPointerUp={ev => {
				if (!visualViewport) {
					return;
				}
				const { clientX: x, clientY: y } = ev;
				const { offsetLeft: left, offsetTop: top, width, height } = visualViewport;
				if (x < left || y < top || x > (left + width) || y > (top + height)) {
					chrome.windows.create({ tabId });
				}
			}}
			onClick={ev => {
				ev.preventDefault();
				chrome.tabs.update(tabId, { active: true });
				chrome.windows.update(windowId, { focused: true });
				if (actionType === 'popup') {
					close();
				}
				if (actionType === 'default') {
					// TODO: only when tab in same window
					// close();
				}
			}}
			onAuxClick={(ev) => {
				if (ev.button === 1) {
					ev.preventDefault();
					chrome.tabs.remove(tabId);
				}
			}}
			href={tab.url}
			className={cx('tab', {
				active: !disabled && snap.activeTabs.get(windowId) === tabId,
				dragging: isDragging,
				pinned: tab.pinned,
				discarded: tab.discarded,
				attention: tab.attention,
			})}
		>
			<TabIcon className={'favicon'} loading={tab.status === 'loading' && tab.url !== self} favIconUrl={tab.favIconUrl} url={tab.url} />
			{(tab.audible || tab.mutedInfo?.muted) && (
				<div
					style={{ display: 'flex' }}
					onClick={ev => {
						ev.preventDefault();
						ev.stopPropagation();
						chrome.tabs.update(tabId, { muted: !tab.mutedInfo?.muted });
					}}
				>
					{tab.mutedInfo?.muted ? <MutedIcon /> : <AudibleIcon />}
				</div>
			)}
			<span className={'title'}>{tab.title}</span>
			{helpText && <span style={{ opacity: 0.5 }}>{helpText}</span>}
		</a>
	);
});
