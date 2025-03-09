import '../../lib/extensions';
import { marked } from 'marked';
import React from 'react';
import { createRoot } from 'react-dom/client';
import showToast from '../common/components/Toast';
import KeyCombination from '../common/util/KeyCombination';
import closeOtherTabs from '../lib/browser/closeOtherTabs';
import getString from '../lib/browser/getString';
import css from '../lib/css';
import getIsoDate from '../lib/date/getIsoDate';
import FileLoader from '../lib/files/FileLoader';
import { saveTextFile } from '../lib/files/saveTextFile';
import { AceTheme } from '../lib/getAceThemes';
import { throwError } from '../lib/throwError';
import buildDocument from './buildDocument';
import ActionButton from './components/ActionButton';
import Editor, { Doc } from './components/Editor';

interface P {
	isImport: boolean | undefined;
	tabId: number | undefined;
	windowId: number | undefined;
}

interface S extends Doc {
	theme?: AceTheme;
}

class ExportApp extends React.Component<P, S> {
	private editor = React.createRef<Editor>();
	private fileInput = React.createRef<HTMLInputElement>();
	private fileLoader?: FileLoader;
	static readonly str = {
		save: getString('action_save'),
		close: getString('action_close_tabs'),
		loadFile: getString('action_load_file'),
		openLinks: getString('action_open_links'),
	};

	constructor(p: P) {
		super(p);
		this.state = {};
		this.load();
	}

	async load() {
		let { props: p } = this;
		if (p.isImport) {
			return;
		}
		let doc = await buildDocument(p.tabId, p.windowId);
		this.setState(doc);
	}

	componentDidMount() {
		this.fileLoader = new FileLoader(
			text =>
				this.setState({
					text,
					format: 'markdown',
				}),
			this.fileInput.current,
			document.body,
		);

		// Load theme
		matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.updateTheme());
	}

	async updateTheme() {
		// TODO
		// let { editorTheme, editorThemeDarkMode } = syncPrefs.value;
		// let name = prefersDark.matches ? editorThemeDarkMode : editorTheme;
		// this.setState({ theme: await getAceThemeModule(name) });
	}

	componentWillUnmount() {
		this.fileLoader?.dispose();
	}

	/** Download the editor's content as a text file */
	downloadAsTextFile = () => {
		// TODO: fix extension and mime type
		let ext = this.state.format === 'json' ? '.json' : '.md';
		let text = this.editor.current!.getContent();
		saveTextFile(getIsoDate() + ext, text, 'text/markdown');
	};

	/** Open file upload dialog */
	loadFile = () => this.fileInput.current?.click();

	/** Open all links in tabs */
	openLinks = () => this.openLinksAsync().catch((e: Error) => showToast(e.message));

	async openLinksAsync() {
		// Markdown → HTML → DOM
		let text = this.editor.current!.getContent();
		let html = await marked(text);
		let dom = new DOMParser().parseFromString(html, 'text/html');

		// Get all links inside of an <ul>
		let windows: string[][] = [];
		for (let ul of dom.getElementsByTagName('ul')) {
			ul.parentNode?.removeChild(ul);
			windows.push(Array.from(ul.getElementsByTagName('a'), a => a.href));
		}

		// Check for leftovers
		let extras = dom.getElementsByTagName('a');
		if (extras.length > 0) {
			windows.push(Array.from(extras, a => a.href));
		}

		await Promise.all(windows.map(url => chrome.windows.create({ url })));
	}

	static readonly css = css`
	.Toolbar {
		flex: 0 0 auto;
	}
	.ace_editor {
		flex: 1 1 auto;
	}
	.Toolbar > *:first-child {
		margin-left: 25px;
	}
	.Toolbar .ace_print-margin {
		position: static;
		width: 100%;
		height: 1px;
	}
	input[type=file] {
		display: none;
	}`;

	ctrlS = new KeyCombination('s', { ctrl: true, noBubbleTags: [] });
	ctrlQ = new KeyCombination('q', { ctrl: true, noBubbleTags: [] });
	ctrlO = new KeyCombination('o', { ctrl: true, noBubbleTags: [] });
	ctrlShiftO = new KeyCombination('O', { ctrl: true, shift: true, noBubbleTags: [] });

	render() {
		let { state: s } = this;
		return (
			<>
				<div className={'Toolbar ' + (s.theme?.cssClass ?? '')}>
					<ActionButton onClick={this.downloadAsTextFile} title={ExportApp.str.save} globalKey={this.ctrlS} />
					<ActionButton onClick={this.loadFile} title={ExportApp.str.loadFile} globalKey={this.ctrlO} />
					<ActionButton onClick={closeOtherTabs} title={ExportApp.str.close} globalKey={this.ctrlQ} />
					<ActionButton onClick={this.openLinks} title={ExportApp.str.openLinks} globalKey={this.ctrlShiftO} />
					<a href='https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts' target='_blank' rel='noreferrer'>Keyboard Shortcuts</a>
					<input type='file' ref={this.fileInput} />
					<div className='ace_print-margin' />
				</div>

				{s.theme && (
					<Editor
						ref={this.editor}
						text={s.text}
						highlightLine={s.highlightLine}
						theme={s.theme.theme}
						format={s.format}
						onMessage={showToast}
						fontSize={16}
					/>
				)}
			</>
		);
	}
}

let p = new URLSearchParams(location.search);
createRoot(document.body).render(
	<ExportApp
		isImport={Boolean(p.get('import') ?? throwError())}
		tabId={Number(p.get('tab') ?? throwError())}
		windowId={Number(p.get('window') ?? throwError())}
	/>,
);
