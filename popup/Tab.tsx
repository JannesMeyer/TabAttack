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
	hide: boolean;
	onMouseDown?(tab: browser.tabs.Tab, event: React.MouseEvent): void;
	onMouseUp?(tab: browser.tabs.Tab, event: React.MouseEvent): void;
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
	body:not(.inactive) .Tab.selected {
		box-shadow: inset 0 0 0 1px #0a84ff;
	}
	.Tab:hover {
		background: #eee;
	}
	.Tab img {
		box-sizing: content-box;
		display: block;
		width: 16px;
		height: 16px;
		border-radius: 3px;
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
	@media (prefers-color-scheme: dark) {
		.Tab:hover {
			background: #252526;
		}
		.Tab.active {
			background: #323234;
		}
	}`;

	// TODO: Fix this for non-Firefox browsers
	static readonly faviconSubs = new Map([
		// Extensions don't have access to this Firefox URL
		['chrome://mozapps/skin/extensions/extension.svg', '/icons/extension.svg'],

		// Firefox-specific loading icon
		['loading', 'chrome://browser/skin/tabbrowser/tab-loading.png'],

		// Firefox-specific placeholder
		['nofavicon', 'chrome://branding/content/icon32.png'],
	]);

	render() {
		let { tab, status, discarded, active, selected, ...p } = this.props;
		
		let favicon: string;
		if (status === 'loading') {
			favicon = 'loading';
		} else if (tab.favIconUrl == null || tab.favIconUrl === '') {
			// Edge
			if (tab.url?.startsWith('edge://') || tab.url?.startsWith('chrome://')) {
				favicon = 'chrome://favicon/' + tab.url;
			} else {
				favicon = 'nofavicon';
			}
		} else {
			favicon = tab.favIconUrl;
		}
		let sub = Tab.faviconSubs.get(favicon);
		if (sub != null) {
			favicon = sub;
		}

		let text = p.title;
		if (p.showURL) {
			text = (p.url ?? '').replace(/^https?:\/\/(www\.)?/, '').replace(/\//, '\n/');
		}
		return <a
			href={p.url}
			data-id={p.id}
			onMouseDown={ev => p.onMouseDown?.(tab, ev)}
			onMouseUp={ev => p.onMouseUp?.(tab, ev)}
			onClick={ev => ev.preventDefault()}
			className={X('Tab', status, { discarded, active, selected })}
			style={{ display: p.hide ? 'none' : 'block' }}
		>
			<img src={favicon} />
			<div className={'Tab_Title' + (p.showURL ? ' showURL' : '')}>{text || 'Untitled'}</div>
		</a>;
	}

}
