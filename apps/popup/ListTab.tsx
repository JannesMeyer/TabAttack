import { isFirefox } from '../../lib/browser/runtime.js';
import css, { X } from '../../lib/css.js';
import { TTab } from './TabStore.js';

interface P extends Pick<TTab, 'id' | 'status' | 'url' | 'title' | 'favIconUrl' | 'active' | 'discarded' | 'audible' | 'mutedInfo' | 'pinned'> {
	selected: boolean;
	showURL: boolean;
	hidden: boolean;
	onMouseDown(tabId: number, event: React.MouseEvent): void;
	onClick(tabId: number, event: React.MouseEvent): void;
	onAuxClick(tabId: number, event: React.MouseEvent): void;
}
export { P as ListTabProps };

export default class ListTab extends React.PureComponent<P> {

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
		transition: opacity 0.2s;
	}
	&.showURL {
		padding-top: 4px;
	}
	&.hidden {
		display: none;
	}
	&.discarded {
		opacity: 0.25;
	}
	&.selected, &:hover {
		opacity: 1;
	}
	body:not(.inactive) &.selected {
		box-shadow: inset 0 0 0 1px #0a84ff;
	}
	& .favicon {
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
	& .title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-right: 7px;
		line-height: 1.5;
	}
	&.showURL .title {
		white-space: pre;
		color: #777;
	}
	&.showURL .title::first-line {
		color: #000;
	}
	& .sound {
		cursor: default;
	}
	&:hover {
		background: #eee;
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
	&.pinned {
		background-color: #ece8e0;	
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
		let { discarded, active, hidden, selected, audible, pinned, showURL, ...p } = this.props;
		let muted = p.mutedInfo?.muted;
		
		let favicon: string;
		if (p.status === 'loading') {
			// From Firefox (chrome://browser/skin/tabbrowser/tab-loading.png)
			favicon = (devicePixelRatio > 1 ? '/icons/firefox/tab-loading@2x.png' : '/icons/firefox/tab-loading.png');

		} else if (p.favIconUrl) {
			// Extensions don't have access to this (in Firefox)
			if (p.favIconUrl === 'chrome://mozapps/skin/extensions/extension.svg') {
				favicon = '/icons/firefox/extension.svg';

			} else {
				favicon = p.favIconUrl;
			}

		} else if (!isFirefox) {
			favicon = 'chrome://favicon/size/16@' + devicePixelRatio + 'x/' + p.url;
			
		} else {
			favicon = 'chrome://branding/content/icon32.png';
		}

		let text: string;
		if (showURL) {
			text = decodeURI((p.url ?? '').replace(/^[^:]+:[/]+(www\.)?/, '').replace(/\//, '\n/'));

		} else if (p.title) {
			text = p.title;

		} else if (p.status === 'loading') {
			text = 'Loading...';

		} else {
			text = 'Untitled';
		}

		return <a
			href={p.url}
			onMouseDown={ev => p.onMouseDown(p.id, ev)}
			onClick={ev => p.onClick(p.id, ev)}
			onAuxClick={ev => p.onAuxClick(p.id, ev)}
			className={X(ListTab.css, p.status, { discarded, active, selected, hidden, showURL, pinned })}
		>
			<img className="favicon" src={favicon} />
			<div className="title">{text}</div>
			{(audible || muted) && <img
				className="sound"
				src={muted ? '/icons/firefox/tab-audio-muted.svg' : '/icons/firefox/tab-audio-playing.svg'}
				onClick={this.handleMute}
			/>}
		</a>;
	}

	handleMute = (ev: React.MouseEvent) => {
		ev.preventDefault();
		ev.stopPropagation();
		browser.tabs.update(this.props.id, { muted: !this.props.mutedInfo?.muted });
	};
}
