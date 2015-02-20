// .m-toast {
// 	pointer-events: none;
// 	position: fixed;
// 	left: 0;
// 	bottom: 25%;
// 	width: 100%;
// 	text-align: center;
// }
// .m-toast.s-hidden {
// 	opacity: 0;
// 	transition: opacity 0.2s linear;
// }
// .m-toast > div {
// 	display: inline-block;
// 	padding: 8px 11px;
// 	border-radius: 3px;
// 	font-size: 12px;

// 	background: #262626;
// 	color: #f0f0f0;
// 	box-shadow: 0 2px 7px rgba(0, 0, 0, 0.5);
// }

var Toast = React.createClass({

	show(text, duration = 2) {
		var node = this.getDOMNode();
		node.firstChild.firstChild.nodeValue = text;
		node.classList.remove('s-hidden');
		setTimeout(() => node.classList.add('s-hidden'), duration * 1000);
	},

	render() {
		return <div className="m-toast s-hidden"><div>placeholder</div></div>;
	}

});

export default Toast;


// // Setup toast
// var timeout;
// var toastNode = document.querySelector('.m-toast');
// /**
//  * Show a toast
//  */
// function makeToast(text) {
// 	toastNode.firstChild.nodeValue = text;
// 	toastNode.classList.remove('s-hidden');

// 	// Refresh the time-to-hide
// 	if (timeout !== undefined) {
// 		clearTimeout(timeout);
// 	}
// 	timeout = setTimeout(() => toastNode.classList.add('s-hidden'), 4000);
// }