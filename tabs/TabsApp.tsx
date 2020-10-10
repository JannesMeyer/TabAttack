import assertDefined from '../lib/assertDefined.js';
import closeOtherTabs from '../lib/browser/closeOtherTabs.js';
import getString from '../lib/browser/getString.js';
import { openWindows } from '../lib/browser/openWindows.js';
import css from '../lib/css.js';
import getIsoDate from '../lib/date/getIsoDate.js';
import { parseHTML } from '../lib/DOM.js';
import getUrlParams from '../lib/dom/getUrlParams.js';
import ready from '../lib/dom/ready.js';
import FileLoader from '../lib/files/FileLoader.js';
import { saveTextFile } from '../lib/files/saveTextFile.js';
import { AceThemeModule, getAceThemeModule } from '../lib/getAceThemes.js';
import logError from '../lib/logError.js';
import prefersDark from '../lib/prefersDark.js';
import prefs from '../preferences.js';
import ActionButton from './ActionButton.js';
import Editor from './Editor.js';
import Toast from './Toast.js';

let params = getUrlParams();
ready().then(root => ReactDOM.render(<TabsApp sourceTabId={params.t} />, root));

interface P {
	window?: number;
	sourceTabId?: string;
}

interface S {
	theme?: AceThemeModule;
	format?: 'markdown' | 'json';
	text?: string;
	highlightLine?: number;
	toastMessage?: string;
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

	state: Readonly<S> = {};

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
	loadFile = () => assertDefined(this.fileInput.current).click();

	/** Open all links in tabs */
	openLinks = () => {
		// Markdown → HTML → DOM
		let text = assertDefined(this.editor.current).getContent();
		let doc = parseHTML(marked(text));

		// Get all links inside of an <ul>
		let windows = Array.from(doc.getElementsByTagName('ul')).map(ul => {
			ul.parentNode?.removeChild(ul);
			return Array.from(ul.getElementsByTagName('a')).map(a => a.href);
		});

		// Check for leftovers
		if (doc.getElementsByTagName('a').length > 0) {
			this.showToast(getString('link_outside_list_error'));
			return;
		}

		// TODO: Show errors in a popup
		return openWindows(windows);
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
				theme={s.theme}
				format={s.format}
				showToast={this.showToast}
				fontSize={16}
			/>}
		</>;
	}
}