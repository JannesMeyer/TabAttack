import type { RangeTuple } from 'fuse.js';
import * as React from 'react';
import { useSnapshot } from 'valtio';
import { cx } from '../../lib/cx';
import { useDndManager, useDraggable, useDroppable } from '../../lib/dnd';
import { useTabStore } from '../../lib/TabStoreContext';
import { actionType } from '../popup';
import { calculateDropIndex } from '../util/calculateDropIndex';
import { AudibleIcon } from './icons/AudibleIcon';
import { MutedIcon } from './icons/MutedIcon';
import { WindowIcon } from './icons/WindowIcon';
import { TabIcon } from './TabIcon';

const self = location.href;

type Props = {
	windowId: number;
	tabId: number | undefined;
	index?: number;
	helpText?: string;
	matchIndices?: readonly RangeTuple[];
};

export { d as Tab };
const d = React.memo(function Tab({ windowId, tabId = chrome.tabs.TAB_ID_NONE, index, helpText, matchIndices: indices }: Props) {
	const store = useTabStore();
	const snap = useSnapshot(store.state);
	const tab = snap.tabs.get(tabId);
	const dndDisabled = index == null;
	const isSelected = snap.selectedTabIds.has(tabId);
	const isMultiDrag = isSelected && snap.selectedTabIds.size > 1;
	const active = !dndDisabled && snap.activeTabs.get(windowId) === tabId;
	const isOtherWindow = snap.initialWindowId != null && windowId !== snap.initialWindowId;

	const {
		draggable,
		onDragStart,
		onDragEnd,
	} = useDraggable({
		id: tabId,
		windowId,
		url: tab?.url,
		disabled: dndDisabled,
		isSelected,
		getDragTabIds: () => {
			const order = snap.tabOrder.get(windowId) ?? [];
			return isMultiDrag
				? order.filter((id): id is number => typeof id === 'number' && snap.selectedTabIds.has(id))
				: [tabId];
		},
		onDragStart: () => {
			if (!isSelected || !isMultiDrag) {
				store.clearSelection();
				store.state.selectedTabIds.add(tabId);
				store.state.lastSelectedTabId = tabId;
			}
		},
		onTearOff: tabIds => {
			if (tabIds.length > 0) {
				chrome.windows.create({ tabId: tabIds[0] }).then(newWin => {
					if (newWin?.id && tabIds.length > 1) {
						chrome.tabs.move(tabIds.slice(1), { windowId: newWin.id, index: -1 });
					}
				});
				store.clearSelection();
			}
		},
	});

	const manager = useDndManager();

	const {
		onDragOver,
		onDragLeave,
		onDrop,
	} = useDroppable({
		id: tabId,
		windowId,
		disabled: dndDisabled,
		calculatePosition: true,
		onDrop: (payload, position) => {
			const order = store.state.tabOrder.get(windowId) ?? [];
			const targetIndex = calculateDropIndex({
				order,
				targetId: tabId,
				sourceWindowId: payload.sourceWindowId,
				targetWindowId: windowId,
				draggedIds: payload.tabIds,
				position,
			});

			if (targetIndex !== -1) {
				const isSameWindow = payload.sourceWindowId === windowId;
				const isNoOp = isSameWindow && payload.tabIds.every((id, idx) => order[targetIndex + idx] === id);
				if (isNoOp) {
					manager.cleanupOnDrop();
				} else {
					chrome.tabs.move(payload.tabIds, { windowId, index: targetIndex });
				}
				store.clearSelection();
			}
		},
	});

	if (!tab) {
		return <div>ERROR: {tabId} not found</div>;
	}

	return (
		<a
			data-tab={tabId}
			data-window={windowId}
			draggable={draggable}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			onClick={(ev) => {
				ev.preventDefault();
				if (ev.shiftKey) {
					store.selectTabRange(windowId, tabId);
					return;
				}
				if (ev.ctrlKey || ev.metaKey) {
					store.toggleTabSelection(tabId);
					return;
				}
				if (isSelected && isMultiDrag) {
					store.clearSelection();
				}
				chrome.tabs.update(tabId, { active: true });
				chrome.windows.update(windowId, { focused: true });
				if (actionType === 'default' || actionType === 'popup') {
					close();
				}
			}}
			onAuxClick={(ev) => {
				if (ev.button === 1) {
					ev.preventDefault();
					if (isMultiDrag) {
						const currentOrder = snap.tabOrder.get(windowId) ?? [];
						const tabsToRemove = currentOrder.filter((id): id is number => typeof id === 'number' && snap.selectedTabIds.has(id));
						chrome.tabs.remove(tabsToRemove);
					} else {
						chrome.tabs.remove(tabId);
					}
				}
			}}
			href={tab.url}
			className={cx('tab', {
				active: active && actionType !== 'default',
				selected: isSelected,
				pinned: tab.pinned,
				discarded: tab.discarded,
				attention: tab.attention,
				audible: tab.audible,
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
			<span className={'title'}>{highlightMatches(tab.title, indices)}</span>
			{isOtherWindow && (
				<span className={'window-indicator'}>
					<WindowIcon />
				</span>
			)}
			{helpText && <span style={{ opacity: 0.5 }}>{helpText}</span>}
		</a>
	);
});

function highlightMatches(text: string | undefined, indices?: readonly RangeTuple[]): React.ReactNode {
	if (!text) {
		return;
	}
	if (!indices || indices.length === 0) {
		return text;
	}

	const elements: React.ReactNode[] = [];
	let lastIndex = 0;

	for (let i = 0; i < indices.length; i++) {
		const range = indices[i];
		if (!range) continue;
		const [start, end] = range;
		if (start > lastIndex) {
			elements.push(text.slice(lastIndex, start));
		}
		const matchStart = Math.max(lastIndex, start);
		const matchEnd = end + 1;
		if (matchStart < matchEnd && matchStart < text.length) {
			elements.push(<b key={i}>{text.slice(matchStart, matchEnd)}</b>);
		}
		lastIndex = Math.max(lastIndex, matchEnd);
	}

	if (lastIndex < text.length) {
		elements.push(text.slice(lastIndex));
	}

	return elements;
}
