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
	.Tab {
		/* Button reset */
		font: inherit;
		background: none;
		text-align: left;
		color: inherit;
		outline: none;

		position: relative;
		display: block;
		width: 100%;
		padding: 6px 0;
		padding-left: 34px;
		border: 2px solid transparent;
		background-clip: border-box;
	}
	.Tab.hidden {
		display: none;
	}
	body:not(.inactive) .Tab.selected {
		box-shadow: inset 0 0 0 1px #0a84ff;
	}
	.Tab img {
		box-sizing: content-box;
		display: block;
		width: 16px;
		height: 16px;
		border-radius: 2px;
		position: absolute;
		top: 6px;
		left: 13px;
	}
	.Tab_Title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-right: 7px;
		line-height: 1.5;
	}
	.Tab_Title.showURL {
		white-space: pre;
	}
	/* Active tab indicator */
	.Tab.active {
		background: #f4f4f4;
	}
	.Tab.active::before {
		content: '';
		display: block;
		width: 3px;
		height: 90%;
		position: absolute;
		top: 5%;
		left: 4px;
		background: #0a84ff;
	}
	.Tab:hover,
	.Tab.active:hover {
		background: #eee;
	}
	@media (prefers-color-scheme: dark) {
		.Tab.active {
			background: #323234;
		}
		.Tab:hover,
		.Tab.active:hover {
			background: #252526;
		}
	}`;

	render() {
		let { tab, status, discarded, active, hidden, selected, ...p } = this.props;
		
		let favicon: string;
		if (status === 'loading') {
			// From Firefox (chrome://browser/skin/tabbrowser/tab-loading.png)
			favicon = '/icons/tab-loading.png';

		} else if (tab.favIconUrl) {
			// Extensions don't have access to this (in Firefox)
			if (tab.favIconUrl === 'chrome://mozapps/skin/extensions/extension.svg') {
				favicon = '/icons/extension.svg';

			} else {
				favicon = tab.favIconUrl;
			}

		} else if (isFirefox) {
			favicon = 'chrome://branding/content/icon32.png';

		} else {
			favicon = 'chrome://favicon/' + tab.url;
		}

		let text = p.title;
		if (p.showURL) {
			text = (p.url ?? '').replace(/^https?:\/\/(www\.)?/, '').replace(/\//, '\n/');
		}

		return <a
			href={p.url}
			onMouseDown={ev => p.onMouseDown?.(tab, ev)}
			onClick={ev => p.onClick?.(tab, ev)}
			onAuxClick={ev => p.onAuxClick?.(tab, ev)}
			className={X('Tab', status, { discarded, active, selected, hidden })}
		>
			<img src={favicon} />
			<div className={'Tab_Title' + (p.showURL ? ' showURL' : '')}>{text || 'Untitled'}</div>
		</a>;
	}

}
