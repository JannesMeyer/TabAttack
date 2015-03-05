import cx from 'react/lib/cx';

export default class Toast extends React.Component {
	constructor(props) {
		this.state = { visible: Boolean(props.children) };
		this.timeoutId = undefined;
	}

	componentDidMount() {
		this.portal = document.createElement('div');
		document.body.appendChild(this.portal);
		this.updateToast();
	}

	componentWillUnmount() {
		clearTimeout(this.timeoutId);
		React.unmountComponentAtNode(this.portal);
	}

	componentWillReceiveProps(nextProps) {
		this.setState({ visible: Boolean(nextProps.children) });
	}

	componentDidUpdate(prevProps, prevState) {
		this.updateToast();
	}

	updateToast() {
		var visible = this.state.visible;

		// Enter the portal
		var toast = React.render(<div className={cx({'m-toast': true, 's-hidden': !visible})}><div>{this.props.children}</div></div>, this.portal);
		if (visible) {
			// Refresh the time-to-hide
			clearTimeout(this.timeoutId);
			// Hide after a few seconds
			this.timeoutId = setTimeout(() => this.setState({ visible: false }), this.props.duration * 1000);
		}
	}

	render() {
		return null;
	}
}
Toast.defaultProps = { duration: 2 };