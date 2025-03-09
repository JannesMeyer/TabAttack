import { Draggable } from '@hello-pangea/dnd';
import * as React from 'react';
import { isFirefox } from '../../lib/browser/runtime';
import { cx } from '../../lib/css';
import { BrowserAction } from '../../types';
import { TabStore } from '../TabStore';

type Props = {
	store: TabStore;
	tabId: number;
	index: number;
	active: boolean;
	windowId: number;
	activeWindowId: number | undefined;
	showTabId?: boolean;
};

export const Tab = React.memo(({ store, tabId, index, active, windowId, activeWindowId, showTabId }: Props) => {
	const { type } = store;
	const tab = store.useTab(tabId);
	const muted = tab.mutedInfo?.muted;
	const isNTP = tab.url === location.href;
	const isActivePage = active && windowId === activeWindowId;
	// if (isNTP) {
	// 	return (
	// 		<Draggable index={index} draggableId={tabId.toString()}>
	// 			{({ draggableProps, dragHandleProps, innerRef }) => <NTP {...draggableProps} {...dragHandleProps} ref={innerRef} />}
	// 		</Draggable>
	// 	);
	// }
	const handleClick = (ev: React.MouseEvent) => {
		if (ev.button !== 0) {
			return;
		}
		ev.preventDefault();
		chrome.tabs.update(tabId, { active: true });
		if (type === BrowserAction.Dropdown) {
			window.close();
		}
		if (windowId === activeWindowId) {
			if (type === BrowserAction.Tab && !isActivePage) {
				window.close();
			} else {
				chrome.windows.update(windowId, { focused: true });
				chrome.tabs.update(tabId, { active: true });
			}
		} else {
			chrome.windows.update(windowId, { focused: true });
		}
	};
	return (
		<Draggable index={index} draggableId={tabId.toString()} isDragDisabled={isActivePage}>
			{({ draggableProps, dragHandleProps, innerRef }) => (
				<a
					draggable={false}
					{...draggableProps}
					{...dragHandleProps}
					ref={innerRef}
					href={tab.url}
					onMouseDown={type === BrowserAction.Tab ? undefined : handleClick}
					onClick={handleClick}
					onAuxClick={(ev) => {
						if (ev.defaultPrevented || ev.button !== 1) {
							return;
						}
						ev.preventDefault();
						if (isActivePage) {
							return;
						}
						chrome.tabs.remove(tabId);
					}}
					className={cx('DisplayTab', tab.status, { discarded: tab.discarded, active: isActivePage, pinned: tab.pinned })}
				>
					<Icon className='favicon' loading={tab.status === 'loading' && !isNTP} favIconUrl={tab.favIconUrl} url={tab.url} />
					{(tab.audible || muted) && (
						<div
							style={{ display: 'flex', padding: 2, margin: -2 }}
							onMouseDown={ev => {
								if (ev.button !== 0) {
									return;
								}
								ev.preventDefault();
								ev.stopPropagation();
							}}
							onClick={ev => {
								ev.preventDefault();
								ev.stopPropagation();
								chrome.tabs.update(tabId, { muted: !muted });
							}}
						>
							<svg viewBox={'0 0 12 12'} width={12} height={12} fill='currentColor'>
								{muted
									? (
										// https://github.com/mozilla/gecko-dev/blob/master/browser/themes/shared/tabbrowser/tab-audio-muted-small.svg
										<path d='m2.791 3.581 1.347-2.294C4.654.408 6 .774 6 1.793v8.413c0 1.02-1.346 1.386-1.862.507L2.791 8.419c-.031-.053-.051-.111-.071-.169H1a1 1 0 0 1-1-1v-2.5a1 1 0 0 1 1-1h1.72a.93.93 0 0 1 .071-.169zm8.325-.081L9.5 5.116 7.884 3.5 7 4.384 8.616 6 7 7.616l.884.884L9.5 6.884 11.116 8.5 12 7.616 10.384 6 12 4.384l-.884-.884z' />
									)
									: (
										// https://github.com/mozilla/gecko-dev/blob/master/browser/themes/shared/tabbrowser/tab-audio-playing-small.svg
										<path d='M7.5 1.881V.595A5.499 5.499 0 0 1 12 6a5.499 5.499 0 0 1-4.5 5.405v-1.286C9.36 9.666 10.75 7.997 10.75 6c0-1.997-1.39-3.666-3.25-4.119zm-3.362-.594L2.791 3.581c-.031.053-.051.111-.071.169H1a1 1 0 0 0-1 1v2.5a1 1 0 0 0 1 1h1.72a.93.93 0 0 0 .071.169l1.347 2.294c.516.879 1.862.513 1.862-.507V1.793C6 .774 4.654.408 4.138 1.287z M7.5 3.193v5.613c1.161-.413 2-1.504 2-2.807s-.839-2.393-2-2.806z' />
									)}
							</svg>
						</div>
					)}
					<div className='title'>
						{tab.pinned ? null : (showTabId ? tabId : (tab.title || (tab.status === 'loading' ? 'Loading...' : 'Untitled')))}
					</div>
				</a>
			)}
		</Draggable>
	);
});

const Icon = ({ loading, favIconUrl, url, ...props }: { loading: boolean; favIconUrl: string | undefined; url: string; className?: string }) => {
	const [error, setError] = React.useState(false);
	if (error) {
		// chrome://global/skin/icons/defaultFavicon.svg
		// https://github.com/mozilla/gecko-dev/blob/8d67fee56f0e8d736369bd7c970da61950a011be/toolkit/themes/shared/icons/defaultFavicon.svg
		return (
			<svg {...props} viewBox='0 0 16 16' fill='currentColor'>
				<path d='M8.5 1a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zm2.447 1.75a6.255 6.255 0 0 1 3.756 5.125l-2.229 0A9.426 9.426 0 0 0 10.54 2.75l.407 0zm-2.049 0a8.211 8.211 0 0 1 2.321 5.125l-5.438 0A8.211 8.211 0 0 1 8.102 2.75l.796 0zm-2.846 0 .408 0a9.434 9.434 0 0 0-1.934 5.125l-2.229 0A6.254 6.254 0 0 1 6.052 2.75zm0 11.5a6.252 6.252 0 0 1-3.755-5.125l2.229 0A9.426 9.426 0 0 0 6.46 14.25l-.408 0zm2.05 0a8.211 8.211 0 0 1-2.321-5.125l5.437 0a8.211 8.211 0 0 1-2.321 5.125l-.795 0zm2.846 0-.409 0a9.418 9.418 0 0 0 1.934-5.125l2.229 0a6.253 6.253 0 0 1-3.754 5.125z' />
			</svg>
		);
	}
	if (loading) {
		// chrome://global/skin/icons/loading.svg
		// https://github.com/mozilla/gecko-dev/blob/9c395b6371eaea0d15f9c8a37889022be350cf0b/toolkit/themes/shared/icons/loading.svg
		return (
			<svg {...props} viewBox='0 0 16 16' fill='currentColor'>
				<path
					fillRule='evenodd'
					clipRule='evenodd'
					d='M14 2.5H12.5V6C12.5 6.19891 12.421 6.38968 12.2803 6.53033L10.8107 8L12.2803 9.46967C12.421 9.61032 12.5 9.80109 12.5 10V13.5H14V15H2V13.5H3.5V10C3.5 9.80109 3.57902 9.61032 3.71967 9.46967L5.18934 8L3.71967 6.53033C3.57902 6.38968 3.5 6.19891 3.5 6V2.5H2V1H14V2.5ZM5 13.5H11V10.3107L9.21967 8.53033C8.92678 8.23744 8.92678 7.76256 9.21967 7.46967L11 5.68934V2.5H5V5.68934L6.78033 7.46967C7.07322 7.76256 7.07322 8.23744 6.78033 8.53033L5 10.3107V13.5Z'
				/>
			</svg>
		);
	}
	if (favIconUrl === 'chrome://mozapps/skin/extensions/extension.svg') {
		// chrome://mozapps/skin/extensions/extension.svg
		// https://github.com/mozilla/gecko-dev/blob/9c395b6371eaea0d15f9c8a37889022be350cf0b/toolkit/themes/shared/extensions/extension.svg
		return (
			<svg {...props} viewBox={'0 0 16 16'} fill='currentColor'>
				<path d='m13.375 16-9.75 0A1.626 1.626 0 0 1 2 14.375L2 11.5a.75.75 0 0 1 .75-.75l1.75 0c.689 0 1.25-.561 1.25-1.25S5.189 8.25 4.5 8.25l-1.75 0A.75.75 0 0 1 2 7.5l0-1.875C2 4.728 2.728 4 3.625 4L6 4l0-1.352C6 1.341 6.938.147 8.238.014A2.502 2.502 0 0 1 11 2.5L11 4l2.375 0C14.272 4 15 4.728 15 5.625l0 8.75c0 .897-.728 1.625-1.625 1.625zM3.25 12l0 2.15.6.6 9.3 0 .6-.6 0-8.3-.6-.6-2.65 0a.75.75 0 0 1-.75-.75l0-2c0-.689-.561-1.25-1.25-1.25s-1.25.561-1.25 1.25l0 2a.75.75 0 0 1-.75.75l-2.75 0-.5.6 0 1.15 1.103 0c1.308 0 2.502.939 2.634 2.24A2.503 2.503 0 0 1 4.5 12l-1.25 0z' />
			</svg>
		);
	}
	if (favIconUrl) {
		return <img {...props} src={favIconUrl} onError={() => setError(true)} />;
	}
	if (isFirefox) {
		return <div {...props} />;
	}
	return <img {...props} src={'chrome://favicon/size/16@' + devicePixelRatio + 'x/' + url} onError={() => setError(true)} />;
};
