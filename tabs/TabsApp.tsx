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
import Toast from './Toast.js';
import buildDocument from './buildDocument.js';

ready().then(root => ReactDOM.render(<TabsApp />, root));

interface S extends Doc {
	theme?: AceThemeModule;
	toastMessage?: string;
}

class TabsApp extends React.Component<unknown, S> {

	private editor = React.createRef<Editor>();
	private fileInput = React.createRef<HTMLInputElement>();
	private fileLoader?: FileLoader;
	static readonly str = {
		save:      getString('action_save'),
		close:     getString('action_close_tabs'),
		loadFile:  getString('action_load_file'),
		openLinks: getString('action_open_links'),
	};

	state: Readonly<S> = {};

	loadPromise = this.load().catch(logError);

	async load() {
		let p = UrlQuery.fromString();
		let doc = await buildDocument(p.getNumber('t'), p.getNumber('w'));
		this.setState(doc);
	}

	componentDidMount() {
		this.fileLoader = new FileLoader(text => this.setState({
			text,
			format: 'markdown',
			toastMessage: undefined,
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

	showToast = (message: string) => {
		this.setState({ toastMessage: message });
	};

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
	openLinks = () => {
		// Markdown → HTML → DOM
		let text = assertDefined(this.editor.current?.getContent());
		let html = marked(text);
		let dom = new DOMParser().parseFromString(html, 'text/html');

		// Get all links inside of an <ul>
		let windows: string[][] = [];
		for (let ul of dom.getElementsByTagName('ul')) {
			ul.parentNode?.removeChild(ul);
			windows.push(Array.from(ul.getElementsByTagName('a')).map(a => a.href));
		}
		
		// Check for leftovers
		let extras = dom.getElementsByTagName('a');
		if (extras.length > 0) {
			windows.push(Array.from(extras).map(a => a.href));
		}

		// TODO: Handle errors
		return Promise.all(windows.map(url => browser.windows.create({ url }))).catch(logError);
	};

	static readonly css = css`
	body > main {
		display: flex;
		flex-direction: column;
	}
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
				<ActionButton className="item-save" onClick={this.downloadAsTextFile} title={TabsApp.str.save} />
				<ActionButton className="item-load-file" onClick={this.loadFile} title={TabsApp.str.loadFile} />
				<ActionButton className="item-close" onClick={closeOtherTabs} title={TabsApp.str.close} />
				<ActionButton className="item-open" onClick={this.openLinks} title={TabsApp.str.openLinks} />
				<input type="file" ref={this.fileInput} />
				<div className="ace_print-margin" />
			</div>

			<Toast duration={4}>{s.toastMessage}</Toast>
			
			{s.theme && <Editor
				ref={this.editor}
				text={s.text}
				highlightLine={s.highlightLine}
				theme={s.theme.theme}
				format={s.format}
				showToast={this.showToast}
				fontSize={16}
			/>}
		</>;
	}
}