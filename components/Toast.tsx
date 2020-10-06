import css, { X } from '../lib/css.js';

interface P {
	children?: React.ReactNode;

	/** Seconds that the text is visible for */
	duration?: number;
}

interface S {
	visible: boolean;
}

export default class Toast extends React.Component<P, S> {

	timeoutId: number | undefined;

	constructor(p: P) {
		super(p);
		this.state = { visible: Boolean(p.children) };
	}

	componentWillUnmount() {
		if (this.timeoutId != null) {
			clearTimeout(this.timeoutId);
		}
	}

	// componentWillReceiveProps(nextProps: P) {
	// 	this.setState({ visible: Boolean(nextProps.children) });
	// }

	static css = css`
	& {
		position: fixed;
		left: 0;
		bottom: 25%;
		width: 100%;
		z-index: 900;

		text-align: center;
		pointer-events: none;
	}
	&.hidden {
		opacity: 0;
		transition: opacity 0.2s linear;
	}
	& > div {
		display: inline-block;
		padding: 8px 11px;

		border-radius: 3px;
		background: #262626;
		color: #f0f0f0;
		box-shadow: 0 2px 7px rgba(0, 0, 0, 0.5);
	}`;

	render() {
		let p = this.props;
		let s = this.state;

		// Enter the portal

		if (s.visible) {
			// Refresh the time-to-hide
			if (this.timeoutId != null) {
				clearTimeout(this.timeoutId);
			}
			// Hide after a few seconds
			let duration = (p.duration != null ? p.duration : 2);
			this.timeoutId = setTimeout(() => this.setState({ visible: false }), duration * 1000);

			return ReactDOM.createPortal(
				<div className={X(Toast.css, { hidden: !s.visible })}>
					<div>{p.children}</div>
				</div>, document.body);
		} else {
			return null;
		}
	}

}