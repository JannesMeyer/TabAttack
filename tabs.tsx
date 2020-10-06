import type _marked from 'marked';
declare var marked: typeof _marked;
// import KeyPress from 'keypress-tool';
import { parseHTML } from './lib/DOM.js';
import { saveTextFile } from './lib/files/saveTextFile.js';
import FileLoader from './lib/files/FileLoader.js';
import Editor from './components/Editor.js';
import Toast from './components/Toast.js';
import ActionButton from './components/ActionButton.js';
import getString from './lib/browser/getString.js';
import { sendMessage } from './lib/browser/sendMessage.js';
import closeOtherTabs from './lib/browser/closeOtherTabs.js';
import { openWindows } from './lib/browser/openWindows.js';
import assertDefined from './lib/assertDefined.js';
import prefs from './preferences.js';
import getAceThemes, { AceThemeModule, getAceTheme } from './lib/getAceThemes.js';
import css from './lib/css.js';


// Load strings
document.title = getString('ext_name');
var strings = {
	save:      getString('action_save'),
	close:     getString('action_close_tabs'),
	loadFile:  getString('action_load_file'),
	openLinks: getString('action_open_links')
};

// var ctrlS      = KeyPress('S', 'ctrl');
// var ctrlQ      = KeyPress('Q', 'ctrl');
// var ctrlO      = KeyPress('O', 'ctrl');
// var ctrlShiftO = KeyPress('O', 'ctrl', 'shift');

// Load document
let root = document.querySelector('body > main');
Promise.all([
	prefs.get('editorTheme'),
	getAceThemes(),
	sendMessage<Doc>('get_document'),
]).then(([prefs, tl, doc]) => {
	return getAceTheme(tl.themesByName[prefs.editorTheme].theme).then(theme => {
		ReactDOM.render(<TabsApp message={doc.message} doc={doc} theme={theme} />, root);
	});
}).catch(err => {
	console.error(err, browser.runtime.lastError);
	ReactDOM.render(<TabsApp message={err} />, root);
});

interface P {
	doc?: Doc;
	message?: string;
	theme?: AceThemeModule;
}

interface S {
	doc?: Doc;
	toastMessage?: string;
}

interface Doc {
	format: 'markdown' | 'json';
	text?: string;
	message?: string;
}

css`
.Toolbar {
	flex: 0 0 auto;
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

class TabsApp extends React.Component<P, S> {

	private editor = React.createRef<Editor>();
	private fileInput = React.createRef<HTMLInputElement>();
	private fileLoader?: FileLoader;

	constructor(p: P) {
		super(p);
		this.state = {
			doc: p.doc,
			toastMessage: p.message,
		};
	}

	componentDidMount() {
		this.fileLoader = new FileLoader(text => this.setState({
			doc: { text, format: 'markdown' },
			toastMessage: undefined,
		}), this.fileInput.current, document.body);
	}
	
	componentWillUnmount() {
		this.fileLoader?.dispose();
	}

	showToast = (message: string) => {
		this.setState({ toastMessage: message });
	};

	/** Download the editor's content as a text file */
	downloadAsTextFile = () => {
		let doc = this.state.doc;
		if (doc == null) {
			throw new Error('No document loaded');
		}
		let ext = (doc.format === 'json' ? '.json' : '.md');
		let filename = getIsoDateString() + ext;
		let text = assertDefined(this.editor.current).getContent();
		saveTextFile(filename, text, 'text/markdown');
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

		openWindows(windows);
	};

	render() {
		let { props: p, state: s} = this;
		return <>
			<div className={(p.theme?.cssClass ?? '') + ' Toolbar'}>
				<ActionButton className="item-save" onClick={this.downloadAsTextFile} title={strings.save} />
				<ActionButton className="item-load-file" onClick={this.loadFile} title={strings.loadFile} />
				<ActionButton className="item-close" onClick={closeOtherTabs} title={strings.close} />
				{s.doc?.format === 'markdown' &&
					<ActionButton className="item-open" onClick={this.openLinks} title={strings.openLinks} />}
				<input type="file" ref={this.fileInput} />
				<div className="ace_print-margin" />
			</div>
			<Toast duration={4}>{s.toastMessage}</Toast>
			<Editor ref={this.editor} doc={s.doc} showToast={this.showToast} fontSize={16} />
		</>;
	}
}

/**
 * Formats the current date as per ISO 8601
 * For example: 2015-02-05
 */
function getIsoDateString(date = new Date()): string {
	let year = date.getFullYear();
	let month = addLeadingZero(date.getMonth() + 1);
	let day = addLeadingZero(date.getDate());
	return `${year}-${month}-${day}`;
}

/**
 * Add a leading zero and convert to string if the number is
 * smaller than 10
 */
function addLeadingZero(number: number): string {
	let str = String(number);
	if (str.length < 2) {
		str = '0' + str;
	}
	return str;
}