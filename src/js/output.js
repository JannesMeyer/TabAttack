import './setDefaults';
import marked from 'marked';
import Mousetrap from 'mousetrap';
import { getIsoDateString } from './lib/DateTime';
import { getTags, parseHTML } from './lib-browser/DOMHelpers'
import * as FileSystem from './lib-browser/FileSystem';
import * as TabManager from './lib-chrome/TabManager';
import Editor from './components/Editor';

var strings = {
	save: Chrome.getString('action_save'), // ⌘S / Ctrl+S
	close: Chrome.getString('action_close_tabs'), // ⌘Q / Ctrl+Q
	loadFile: Chrome.getString('action_load_file'), // ⌘O / Ctrl+O
	openLinks: Chrome.getString('action_open_links') // ⇧⌘O / Ctrl+Shift+O
};

class Page extends React.Component {

	constructor(props) {
		super(props);
		this.state = { doc: null };
	}

	componentDidMount() {
		// Set title
		document.title = Chrome.getString('ext_name');

		// Request document
		Chrome.sendMessage({ operation: 'get_document' }).then(res => {
			// TODO: better error handling
			if (res.error) {
				makeToast(res.error);
				return;
			}
			this.setState({ doc: res });
		});

		// File loading
		FileSystem.onFile(text => this.setState({ doc: { format: 'markdown', text } }));
		FileSystem.setupFileInput(this.refs.fileInput.getDOMNode());
		FileSystem.setupFileTarget(document.body);

		// Set keyboard shortcuts
		Mousetrap.bind(['command+s', 'ctrl+s'], this.downloadAsTextFile);
		Mousetrap.bind(['command+q', 'ctrl+q'], this.closeOtherTabs);
		Mousetrap.bind(['command+o', 'ctrl+o'], this.loadFile);
		Mousetrap.bind(['command+shift+o', 'ctrl+shift+o'], this.openLinks);
		Mousetrap.stopCallback = () => false;
	}

	/**
	 * Action: Download the editor's content as a text file
	 */
	downloadAsTextFile(ev) {
		ev.preventDefault();
		var filename = getIsoDateString() + '.md';
		var text = this.refs.editor.getContent();
		FileSystem.saveTextFile(filename, text);
	}

	/**
	 * Action: Close all tabs
	 */
	closeOtherTabs(ev) {
		ev.preventDefault();
		Chrome.getCurrentTab().then(tab => {
			TabManager.closeOtherTabs(tab);
		});
	}

	/**
	 * Action: Load file
	 */
	loadFile(ev) {
		ev.preventDefault();
		this.refs.fileInput.getDOMNode().click();
	}

	/**
	 * Action: Open all links in tabs
	 */
	openLinks(ev) {
		ev.preventDefault();
		// Markdown → HTML → DOM
		var text = this.refs.editor.getContent();
		var doc = parseHTML(marked(text));

		// Get all links inside of an <ul>
		var windows = getTags(doc, 'ul').map(ul => {
			ul.parentNode.removeChild(ul);
			return getTags(ul, 'a').map(a => a.href);
		});

		// Check for leftovers
		if (getTags(doc, 'a').length > 0) {
			makeToast(Chrome.getString('link_outside_list_error'));
			return;
		}

		TabManager.restoreWindows(windows);
	}

	render() {
		return (
			<div className="m-container">
				<div className="m-toolbar">
					<input type="file" ref="fileInput" style={{display: 'none'}} />
					<button onClick={this.downloadAsTextFile} className="item-save" title={strings.save}>{strings.save}</button>
					<button onClick={this.closeOtherTabs} className="item-close" title={strings.close}>{strings.close}</button>
					<button onClick={this.loadFile} className="item-load-file" title={strings.loadFile}>{strings.loadFile}</button>
					<button onClick={this.openLinks} className="item-open" title={strings.openLinks}>{strings.openLinks}</button>
				</div>
				<Editor ref="editor" doc={this.state.doc} />
			</div>
		);
	}

}

React.render(<Page />, document.body);