if (typeof chrome !== 'undefined') {
	module.exports = require('./browser-chrome');
} else {
	module.exports = require('./browser-firefox');
}