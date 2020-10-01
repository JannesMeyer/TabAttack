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
				<div className={'m-toast' + (s.visible ? '' : ' s-hidden')}>
					<div>{p.children}</div>
				</div>, document.body);
		} else {
			return null;
		}
	}

}