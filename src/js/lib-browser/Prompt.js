/**
 * Ask the user a question using a prompt() dialog
 */
export function ask(question, defaultAnswer = '') {
	return new Promise((resolve, reject) => {
		var res = prompt(question, defaultAnswer);

		if (res !== null) {
			resolve(res);
		} else {
			reject(new Error('The user cancelled the dialog'));
		}
	});
}