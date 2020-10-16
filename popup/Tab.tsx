import { isFirefox } from '../lib/browser/runtime.js';
import css, { X } from '../lib/css.js';

interface P {
	id: number | undefined;
	active: boolean;
	favIconUrl: string | undefined;
	url: string | undefined;
	title: string | undefined;
	status: string | undefined;
	discarded: boolean;
	selected: boolean;
	tab: browser.tabs.Tab;
	showURL: boolean;
	hidden: boolean;
	onMouseDown?(tab: browser.tabs.Tab, event: React.MouseEvent): void;
	onClick?(tab: browser.tabs.Tab, event: React.MouseEvent): void;
	onAuxClick?(tab: browser.tabs.Tab, event: React.MouseEvent): void;
}

export default class Tab extends React.Component<P> {

	static readonly css = css`
	& {
		font: inherit;
		color: inherit;
		text-decoration: none;
		outline: none; /* Disable focus outline */

		position: relative;
		display: block;
		padding: 6px 0;
		padding-left: 34px;
		border: 2px solid transparent;
	}

	&.showURL {
		padding-top: 4px;
	}
	&.hidden {
		display: none;
	}
	body:not(.inactive) &.selected {
		box-shadow: inset 0 0 0 1px #0a84ff;
	}
	& img {
		box-sizing: content-box;
		display: block;
		width: 16px;
		height: 16px;
		border-radius: 2px;
		position: absolute;
		top: 6px;
		left: 13px;
	}
	@media (resolution: 2dppx), (resolution: 3dppx), (resolution: 4dppx), (resolution: 5dppx) {
		& img {
			image-rendering: pixelated;
		}
	}
	& .Title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-right: 7px;
		line-height: 1.5;
	}
	&.showURL .Title {
		white-space: pre;
		color: #777;
	}
	&.showURL .Title::first-line {
		color: #000;
	}
	/* Active tab indicator */
	&.active {
		background: #f4f4f4;
	}
	&.active::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 4px;
		bottom: 2px;
		width: 3px;
		background: #0a84ff;
	}
	&:hover {
		background: #eee;
	}
	@media (prefers-color-scheme: dark) {
		&.active {
			background: #323234;
		}
		&:hover {
			background: #252526;
		}
	}`;

	render() {
		let { tab, status, discarded, active, hidden, selected, showURL, ...p } = this.props;
		
		let favicon: string;
		if (status === 'loading') {
			// From Firefox (chrome://browser/skin/tabbrowser/tab-loading.png)
			favicon = (devicePixelRatio > 1 ? '/icons/tab-loading@2x.png' : '/icons/tab-loading.png');

		} else if (tab.favIconUrl) {
			// Extensions don't have access to this (in Firefox)
			if (tab.favIconUrl === 'chrome://mozapps/skin/extensions/extension.svg') {
				favicon = '/icons/extension.svg';

			} else {
				favicon = tab.favIconUrl;
			}

		} else if (!isFirefox) {
			favicon = 'chrome://favicon/size/16@' + devicePixelRatio + 'x/' + tab.url;
			
		} else {
			favicon = 'chrome://branding/content/icon32.png';
		}

		let text: string;
		if (showURL) {
			text = decodeURI((p.url ?? '').replace(/^[^:]+:[/]+(www\.)?/, '').replace(/\//, '\n/'));

		} else {
			text = p.title || 'Untitled';
		}

		return <a
			href={p.url}
			onMouseDown={ev => p.onMouseDown?.(tab, ev)}
			onClick={ev => p.onClick?.(tab, ev)}
			onAuxClick={ev => p.onAuxClick?.(tab, ev)}
			className={X(Tab.css, status, { discarded, active, selected, hidden, showURL })}
		>
			<img src={favicon} />
			<div className="Title">{text}</div>
		</a>;
	}

}
