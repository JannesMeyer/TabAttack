import '../lib/Array.extensions.js';
import assertDefined from '../lib/assertDefined.js';
import closeOtherTabs from '../lib/browser/closeOtherTabs.js';
import getString from '../lib/browser/getString.js';
import css from '../lib/css.js';
import getIsoDate from '../lib/date/getIsoDate.js';
import UrlQuery from '../lib/dom/UrlQuery.js';
import ready from '../lib/dom/ready.js';
import FileLoader from '../lib/files/FileLoader.js';
import { saveTextFile } from '../lib/files/saveTextFile.js';
import { AceThemeModule, getAceThemeModule } from '../lib/getAceThemes.js';
import logError from '../lib/logError.js';
import prefersDark from '../lib/prefersDark.js';
import prefs from '../preferences.js';
import ActionButton from './ActionButton.js';
import Editor, { Doc } from './Editor.js';
import showToast from './Toast.js';
import buildDocument from './buildDocument.js';

let p = UrlQuery.fromString();
let params: P = {
	isImport: p.getBoolean('import'),
	tabId: p.getNumber('tab'),
	windowId: p.getNumber('window'),
};
ready().then(root => ReactDOM.render(<TabsApp {...params}  />, root));

interface P {
	isImport: boolean | undefined;
	tabId: number | undefined;
	windowId: number | undefined;
}

interface S extends Doc {
	theme?: AceThemeModule;
}

class TabsApp extends React.Component<P, S> {

	private editor = React.createRef<Editor>();
	private fileInput = React.createRef<HTMLInputElement>();
	private fileLoader?: FileLoader;
	static readonly str = {
		save:      getString('action_save'),
		close:     getString('action_close_tabs'),
		loadFile:  getString('action_load_file'),
		openLinks: getString('action_open_links'),
	};

	constructor(p: P) {
		super(p);
		this.state = {};
		this.load().catch(logError);
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
		this.fileLoader = new FileLoader(text => this.setState({
			text,
			format: 'markdown',
		}), this.fileInput.current, document.body);

		// Load theme
		prefs.onChange(() => this.updateTheme().catch(logError), true);
		prefersDark.addEventListener('change', () => this.updateTheme().catch(logError));

		// import KeyPress from 'keypress-tool';
		// var ctrlS      = KeyPress('S', 'ctrl');
		// var ctrlQ      = KeyPress('Q', 'ctrl');
		// var ctrlO      = KeyPress('O', 'ctrl');
		// var ctrlShiftO = KeyPress('O', 'ctrl', 'shift');
	}

	async updateTheme() {
		let { editorTheme, editorThemeDarkMode } = await prefs.get('editorTheme', 'editorThemeDarkMode');
		let name = (prefersDark.matches ? editorThemeDarkMode : editorTheme);
		this.setState({ theme: await getAceThemeModule(name) });
	}
	
	componentWillUnmount() {
		this.fileLoader?.dispose();
	}

	/** Download the editor's content as a text file */
	downloadAsTextFile = () => {
		// TODO: fix extension and mime type
		let ext = (this.state.format === 'json' ? '.json' : '.md');
		let text = assertDefined(this.editor.current).getContent();
		saveTextFile(getIsoDate() + ext, text, 'text/markdown');
	};

	/** Open file upload dialog */
	loadFile = () => this.fileInput.current?.click();

	/** Open all links in tabs */
	openLinks = () => this.openLinksAsync().catch((e: Error) => showToast(e.message));

	async openLinksAsync() {
		// Markdown → HTML → DOM
		let text = assertDefined(this.editor.current).getContent();
		let html = marked(text);
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

		await Promise.all(windows.map(url => browser.windows.create({ url })));
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

	render() {
		let { state: s } = this;
		return <>
			<div className={'Toolbar ' + (s.theme?.cssClass ?? '')}>
				<ActionButton onClick={this.downloadAsTextFile} title={TabsApp.str.save} />
				<ActionButton onClick={this.loadFile} title={TabsApp.str.loadFile} />
				<ActionButton onClick={closeOtherTabs} title={TabsApp.str.close} />
				<ActionButton onClick={this.openLinks} title={TabsApp.str.openLinks} />
				<a href="https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts" target="_blank">Keyboard Shortcuts</a>
				<input type="file" ref={this.fileInput} />
				<div className="ace_print-margin" />
			</div>

			{s.theme && <Editor
				ref={this.editor}
				text={s.text}
				highlightLine={s.highlightLine}
				theme={s.theme.theme}
				format={s.format}
				onMessage={showToast}
				fontSize={16}
			/>}
		</>;
	}
}