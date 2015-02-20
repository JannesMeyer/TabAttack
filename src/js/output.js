import './setDefaults';
import marked from 'marked';
import Mousetrap from 'mousetrap';
import { getIsoDateString } from './lib/DateTime';
import { getTags, parseHTML } from './lib-browser/DOMHelpers'
import * as FileSystem from './lib-browser/FileSystem';
import * as TabManager from './lib-chrome/TabManager';
import Editor from './components/Editor';

var strings = {
	save:      Chrome.getString('action_save'), // ⌘S / Ctrl+S
	close:     Chrome.getString('action_close_tabs'), // ⌘Q / Ctrl+Q
	loadFile:  Chrome.getString('action_load_file'), // ⌘O / Ctrl+O
	openLinks: Chrome.getString('action_open_links') // ⇧⌘O / Ctrl+Shift+O
};

// TODO: fix this
function makeToast(text) {
	alert(text);
}

class Page extends React.Component {

	constructor(props) {
		super(props);
		this.state = { doc: props.doc };

		this.downloadAsTextFile = this.downloadAsTextFile.bind(this);
		this.closeOtherTabs = this.closeOtherTabs.bind(this);
		this.loadFile = this.loadFile.bind(this);
		this.openLinks = this.openLinks.bind(this);
	}

	componentDidMount() {
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
		var doc = this.state.doc;
		var ext = (doc && doc.format === 'json') ? '.json' : '.md';
		var filename = getIsoDateString() + ext;
		var text = this.refs.editor.getContent();
		FileSystem.saveTextFile(filename, text);
		ev.preventDefault();
	}

	/**
	 * Action: Close all tabs
	 */
	closeOtherTabs(ev) {
		Chrome.getCurrentTab().then(tab => {
			TabManager.closeOtherTabs(tab);
		});
		ev.preventDefault();
	}

	/**
	 * Action: Load file
	 */
	loadFile(ev) {
		this.refs.fileInput.getDOMNode().click();
		ev.preventDefault();
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
		var openButton = this.state.doc.format === 'markdown' && <button onClick={this.openLinks} className="item-open" title={strings.openLinks}>{strings.openLinks}</button>;
		return (
			<div className="m-container">
				<div className="m-toolbar">
					<input type="file" ref="fileInput" style={{display: 'none'}} />
					<button onClick={this.downloadAsTextFile} className="item-save" title={strings.save}>{strings.save}</button>
					<button onClick={this.closeOtherTabs} className="item-close" title={strings.close}>{strings.close}</button>
					<button onClick={this.loadFile} className="item-load-file" title={strings.loadFile}>{strings.loadFile}</button>
					{openButton}
				</div>
				<Editor ref="editor" doc={this.state.doc} />
			</div>
		);
	}

}

// Load
document.title = Chrome.getString('ext_name');
Chrome.sendMessage({ operation: 'get_document' }).then(response => {
	React.render(<Page doc={response} />, document.body);
}).catch(err => {
	makeToast(err);
	React.render(<Page />, document.body);
});