import type _marked from 'marked';
declare var marked: typeof _marked;
// import KeyPress from 'keypress-tool';
import { parseHTML } from './lib/DOM.js';
import * as FileSystem from './lib/FileSystem.js';
import Editor from './components/Editor.js';
import Toast from './components/Toast.js';
import ActionButton from './components/ActionButton.js';
import getString from './lib/browser/getString.js';
import { sendMessage } from './lib/browser/sendMessage.js';
import closeOtherTabs from './lib/browser/closeOtherTabs.js';
import { openWindows } from './components/openWindows.js';
import assertDefined from './lib/assertDefined.js';


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
sendMessage<Doc>('get_document').then(doc => {
  doc ??= { format: 'markdown', text: '' };
	ReactDOM.render(<TabOutput message={doc.message} doc={doc} />, document.body);
}).catch(err => {
	ReactDOM.render(<TabOutput message={err} />, document.body);
});

interface P {
	doc?: Doc;
	message?: string;
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

class TabOutput extends React.Component<P, S> {
	constructor(p: P) {
		super(p);
		this.state = {
			doc: p.doc,
			toastMessage: p.message,
		};

		// Bind methods
		this.showToast = this.showToast.bind(this);
		this.downloadAsTextFile = this.downloadAsTextFile.bind(this);
		this.loadFile = this.loadFile.bind(this);
		this.openLinks = this.openLinks.bind(this);
	}

	showToast(message: string) {
		this.setState({ toastMessage: message });
	}

	componentDidMount() {
		// File loading
		FileSystem.onFile(text => this.setState({
			doc: { format: 'markdown', text },
			toastMessage: undefined
		}));
		FileSystem.setupFileInput(assertDefined(this.fileInput.current));
		FileSystem.setupFileTarget(document.body);
	}

	/**
	 * Action: Download the editor's content as a text file
	 */
	downloadAsTextFile() {
		let doc = this.state.doc;
		if (doc == null) {
			throw new Error('No document loaded');
		}
		let ext = (doc.format === 'json' ? '.json' : '.md');
		let filename = getIsoDateString() + ext;
		let text = assertDefined(this.editor.current).getContent();
		FileSystem.saveTextFile(filename, text);
	}

	/**
	 * Action: Load file
	 */
	loadFile() {
		this.fileInput.current?.click();
	}

	/**
	 * Action: Open all links in tabs
	 */
	openLinks() {
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
	}

  fileInput = React.createRef<HTMLInputElement>();
  editor = React.createRef<Editor>();

	render() {
    let s = this.state;
		return (
			<div className="m-container">
				<div className="m-toolbar">
					<input type="file" ref={this.fileInput} style={{ display: 'none' }} />
					<ActionButton className="item-save" onClick={this.downloadAsTextFile} title={strings.save} />
					<ActionButton className="item-close" onClick={closeOtherTabs} title={strings.close} />
					<ActionButton className="item-load-file" onClick={this.loadFile} title={strings.loadFile} />
					{s.doc?.format === 'markdown' &&
					<ActionButton className="item-open" onClick={this.openLinks} title={strings.openLinks} />}
				</div>
				<Toast duration={4}>{this.state.toastMessage}</Toast>
				<Editor ref={this.editor} doc={s.doc} showToast={this.showToast} />
			</div>
		);
	}
}

/**
 * Formats the current date as per ISO 8601
 * For example: 2015-02-05
 */
export function getIsoDateString(date = new Date()): string {
	var year = date.getFullYear();
	var month = addLeadingZero(date.getMonth() + 1);
	var day = addLeadingZero(date.getDate());

	return `${year}-${month}-${day}`;
}

/**
 * Add a leading zero and convert to string if the number is
 * smaller than 10
 */
function addLeadingZero(number: number): string {
	var str = String(number);
	if (str.length < 2) {
		str = '0' + str;
	}
	return str;
}