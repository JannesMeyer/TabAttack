import React from 'react';
import { isFirefox } from '../../lib/isFirefox';
import { DefaultIcon } from './icons/DefaultIcon';

const faviconBaseUrl = chrome.runtime.getURL('/_favicon/');

type Props = {
	loading: boolean;
	favIconUrl: string | undefined;
	url: string;
	className?: string;
};

export { memo as TabIcon };
const memo = React.memo(function TabIcon({ loading, favIconUrl, url, ...props }: Props) {
	const [error, setError] = React.useState(false);
	if (error) {
		return <DefaultIcon {...props} />;
	}
	if (loading) {
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
	if (favIconUrl === 'chrome://mozapps/skin/extensions/extension.svg' || url.startsWith('chrome://extensions/')) {
		return (
			<svg {...props} viewBox={'0 0 16 16'} fill='currentColor'>
				<path d='m13.375 16-9.75 0A1.626 1.626 0 0 1 2 14.375L2 11.5a.75.75 0 0 1 .75-.75l1.75 0c.689 0 1.25-.561 1.25-1.25S5.189 8.25 4.5 8.25l-1.75 0A.75.75 0 0 1 2 7.5l0-1.875C2 4.728 2.728 4 3.625 4L6 4l0-1.352C6 1.341 6.938.147 8.238.014A2.502 2.502 0 0 1 11 2.5L11 4l2.375 0C14.272 4 15 4.728 15 5.625l0 8.75c0 .897-.728 1.625-1.625 1.625zM3.25 12l0 2.15.6.6 9.3 0 .6-.6 0-8.3-.6-.6-2.65 0a.75.75 0 0 1-.75-.75l0-2c0-.689-.561-1.25-1.25-1.25s-1.25.561-1.25 1.25l0 2a.75.75 0 0 1-.75.75l-2.75 0-.5.6 0 1.15 1.103 0c1.308 0 2.502.939 2.634 2.24A2.503 2.503 0 0 1 4.5 12l-1.25 0z' />
			</svg>
		);
	}
	if (isFirefox) {
		if (favIconUrl) {
			return <img {...props} src={favIconUrl} onError={() => setError(true)} />;
		}
		return <div {...props} />;
	}
	if (url.startsWith('chrome://')) {
		return <DefaultIcon {...props} />;
	}
	const u = new URL(faviconBaseUrl);
	u.searchParams.set('pageUrl', url);
	u.searchParams.set('size', '16');
	return <img {...props} src={u.toString()} onError={() => setError(true)} />;
});
