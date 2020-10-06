import prefs from '../preferences.js';
import getString from '../lib/browser/getString.js';
import { Ace } from 'ace-builds';

interface P {
	doc: any;
	showToast: (message: string) => void;
}

/**
 * Ace editor component
 */
export default class Editor extends React.Component<P> {

	editor!: Ace.Editor;

	constructor(p: P) {
		super(p);
	}

	componentDidMount() {
		this.editor = ace.edit('editor');
		this.editor.setOption('fontSize', 14);
		this.editor.setOption('showLineNumbers', false);
		this.editor.setOption('showPrintMargin', false);
		prefs.get('editorTheme').then(({ editorTheme }) => {
			this.editor.setTheme('ace/theme/' + editorTheme);
		});
		this.updateContent();
		addEventListener('beforeunload', this.handleUnload);
		addEventListener('copy', this.handleCopy);
	}

	componentWillUnmount() {
		this.editor.destroy();
		removeEventListener('beforeunload', this.handleUnload);
		removeEventListener('copy', this.handleCopy);
	}

	shouldComponentUpdate(nextProps: P) {
		return this.props.doc !== nextProps.doc;
	}

	handleUnload = (ev: BeforeUnloadEvent) => {
		if (this.editor.session.getUndoManager().isAtBookmark()) {
			return;
		}
		let message = getString('confirm_unload');
		ev.returnValue = message;
		return message;
	};

	handleCopy = (ev: any) => {
		if (ev.clipboardData.getData('text/plain') !== '') {
			return;
		}
		ev.clipboardData.setData('text/plain', this.getContent());
		this.props.showToast(getString('toast_copied_document'));
	};

	componentDidUpdate() {
		this.updateContent();
	}

	updateContent() {
		var doc = this.props.doc;
		if (!doc) { return; }

		this.editor.session.setMode('ace/mode/' + doc.format);
		// session.setValue: see https://github.com/ajaxorg/ace/issues/1243
		this.editor.session.setValue(doc.text);
		this.editor.gotoLine(doc.highlightLine ?? 0, 0, false);
		this.editor.focus();
	}

	getContent() {
		this.editor.session.getUndoManager().bookmark();
		return this.editor.getValue();
	}

	render() {
		return <div id="editor" />;
	}

}