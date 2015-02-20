import ace from 'brace';
import 'brace/mode/json';
import 'brace/mode/markdown';
import './setDefaults';
import marked from 'marked';
import Mousetrap from 'mousetrap';
import { getIsoDateString } from './lib/DateTime';
import { getTags, parseHTML } from './lib-browser/DOMHelpers'
import * as FileSystem from './lib-browser/FileSystem';
import * as TabManager from './lib-chrome/TabManager';

/**
 * Ace editor component
 */
var Editor = React.createClass({

	editor: null,

	componentDidMount() {
		this.editor = ace.edit('editor');
		this.editor.setOption('fontSize', '14px');
		this.editor.setOption('showLineNumbers', false);
		this.editor.setOption('showPrintMargin', false);
		this.editor.$blockScrolling = Infinity;
		Chrome.getPreferences([ 'editorTheme' ]).then(items => {
			require('brace/theme/' + items.editorTheme);
			this.editor.setTheme('ace/theme/' + items.editorTheme);
		});
		this.updateContent();

		window.addEventListener('beforeunload', this.handleUnload);
		window.addEventListener('copy', this.handleCopy);
	},

	componentWillUnmount() {
		window.removeEventListener('beforeunload', this.handleUnload);
		window.removeEventListener('copy', this.handleCopy);
	},

	componentDidUpdate(prevProps, prevState) {
		this.updateContent();
	},

	updateContent() {
		var doc = this.props.doc;
		if (!doc) {
			return;
		}
		if (doc.format) {
			this.editor.session.setMode('ace/mode/' + doc.format);
		}
		if (doc.text !== undefined) {
			// session.setValue: see https://github.com/ajaxorg/ace/issues/1243
			this.editor.session.setValue(doc.text);
			this.editor.gotoLine(doc.highlightLine || 0);
			this.editor.focus();
		}
	},

	getContent() {
		this.editor.session.getUndoManager().markClean();
		return this.editor.getValue();
	},

	handleUnload(ev) {
		if (this.editor.session.getUndoManager().isClean()) {
			return;
		}
		var message = Chrome.getString('confirm_unload');
		ev.returnValue = message;
		return message;
	},

	handleCopy(ev) {
		if (ev.clipboardData.getData('text/plain') !== '') {
			return;
		}
		ev.clipboardData.setData('text/plain', this.getContent());
		// makeToast('Copied the whole document');
	},

	render() {
		return <div id="editor" />;
	}

});




/**
 * OutputPage component
 */
var OutputPage = React.createClass({

	strings: {
		save: Chrome.getString('action_save'), // ⌘S / Ctrl+S
		close: Chrome.getString('action_close_tabs'), // ⌘Q / Ctrl+Q
		loadFile: Chrome.getString('action_load_file'), // ⌘O / Ctrl+O
		openLinks: Chrome.getString('action_open_links') // ⇧⌘O / Ctrl+Shift+O
	},

	getInitialState() {
		return { doc: null };
	},

	componentWillMount() {
		document.title = Chrome.getString('ext_name');

		Chrome.sendMessage({ operation: 'get_document' }).then(res => {
			// TODO: better error handling
			if (res.error) {
				makeToast(res.error);
				return;
			}
			this.setState({ doc: res });
		});
	},

	componentDidMount() {
		FileSystem.onFile(text => this.setState({ doc: { format: 'markdown', text } }));
		FileSystem.setupFileInput(this.refs.fileInput.getDOMNode());
		FileSystem.setupFileTarget(document.body);

		// Set keyboard shortcuts
		Mousetrap.bind(['command+s', 'ctrl+s'], this.downloadAsTextFile);
		Mousetrap.bind(['command+q', 'ctrl+q'], this.closeOtherTabs);
		Mousetrap.bind(['command+o', 'ctrl+o'], this.loadFile);
		Mousetrap.bind(['command+shift+o', 'ctrl+shift+o'], this.openLinks);
		Mousetrap.stopCallback = () => false;
	},

	/**
	 * Download the editor's content as a text file
	 */
	downloadAsTextFile(ev) {
		ev.preventDefault();
		var filename = getIsoDateString() + '.md';
		var text = this.refs.editor.getContent();
		FileSystem.saveTextFile(filename, text);
	},

	closeOtherTabs(ev) {
		ev.preventDefault();
		Chrome.getCurrentTab().then(tab => {
			TabManager.closeOtherTabs(tab);
		});
	},

	loadFile(ev) {
		ev.preventDefault();
		this.refs.fileInput.getDOMNode().click();
	},

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
	},

	render() {
		var strings = this.strings;
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

});

React.render(<OutputPage />, document.body)