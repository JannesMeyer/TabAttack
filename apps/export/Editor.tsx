import getString from '../../lib/browser/getString.js';
import { Ace } from 'ace-builds';
import css from '../../lib/css.js';
import assertDefined from '../../lib/assertDefined.js';

export interface Doc {
	text?: string;
	highlightLine?: number;
	format?: 'markdown' | 'json' | 'text' | 'xml';
}

interface P extends Doc {
	theme?: string;
	fontSize?: number;
	onMessage(message: string): void;
}

/** Ace editor component */
export default class Editor extends React.Component<P> {

	editor!: Ace.Editor;

	componentDidMount() {
		let editor = this.editor = ace.edit(assertDefined(this.ref.current));
		let p = this.props;
		if (p.theme != null) {
			editor.setTheme(p.theme);
		}
		editor.setOption('showLineNumbers', false);
		editor.setOption('showPrintMargin', false);
		if (p.fontSize != null) {
			editor.setOption('fontSize', p.fontSize);
		}
		this.setFormat();
		this.setText();
		addEventListener('beforeunload', this.handleUnload);
		addEventListener('copy', this.handleCopy);
	}

	setFormat() {
		let { props: p, editor } = this;
		editor.session.setMode('ace/mode/' + (p.format ?? 'text'));
	}

	setText() {
		let { props: p, editor } = this;
		// session.setValue: https://github.com/ajaxorg/ace/issues/1243
		editor.session.setValue(p.text ?? '');
		editor.gotoLine(p.highlightLine ?? 0, 0, false);
		editor.focus();
	}

	componentWillUnmount() {
		this.editor.destroy();
		removeEventListener('beforeunload', this.handleUnload);
		removeEventListener('copy', this.handleCopy);
	}

	private handleUnload = (ev: BeforeUnloadEvent) => {
		if (this.editor.session.getUndoManager().isAtBookmark()) {
			return;
		}
		return ev.returnValue = getString('confirm_unload');
	};

	private handleCopy = (ev: Event) => {
		let cb = (ev as ClipboardEvent).clipboardData;
		if (cb == null || cb.getData('text/plain') !== '') {
			return;
		}
		cb.setData('text/plain', this.getContent());
		this.props.onMessage(getString('toast_copied_document'));
	};

	componentDidUpdate(op: Readonly<P>) {
		let { props: p, editor } = this;
		if (p.theme !== op.theme) {
			p.theme && editor.setTheme(p.theme);
		}
		if (p.format !== op.format) {
			this.setFormat();
		}
		if (p.text !== op.text) {
			this.setText();
		}
	}

	getContent() {
		this.editor.session.getUndoManager().bookmark();
		return this.editor.getValue();
	}

	static readonly css = css`
	.ace_underline {
		text-decoration: none !important;
	}`;

	ref = React.createRef<HTMLDivElement>();

	render() {
		return <div ref={this.ref} />;
	}

}