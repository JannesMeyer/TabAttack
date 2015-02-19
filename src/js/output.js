import marked from 'marked';
import Mousetrap from 'mousetrap';
import { getIsoDateString } from './lib/DateTime';
import { getTags, parseHTML } from './lib-browser/DOMHelpers'
import * as FileSystem from './lib-browser/FileSystem';
import * as TabManager from './lib-chrome/TabManager';

// Setup toast
var timeout;
var toastNode = document.querySelector('.m-toast');

// Setup toolbar
var fileInput = document.querySelector('.m-file-input');
FileSystem.onFile(setEditorContent);
FileSystem.setupFileInput(fileInput);
FileSystem.setupFileTarget(document.body);

var saveButton = document.querySelector('.item-save');
var closeButton = document.querySelector('.item-close');
var loadButton = document.querySelector('.item-load-file');
var openButton = document.querySelector('.item-open');
saveButton.addEventListener('click', downloadAsTextFile);
closeButton.addEventListener('click', closeOtherTabs);
loadButton.addEventListener('click', loadFile);
openButton.addEventListener('click', openLinks);

// Make keyboard shortcuts
Mousetrap.bind(['command+s', 'ctrl+s'], downloadAsTextFile);
Mousetrap.bind(['command+q', 'ctrl+q'], closeOtherTabs);
Mousetrap.bind(['command+o', 'ctrl+o'], loadFile);
Mousetrap.bind(['command+shift+o', 'ctrl+shift+o'], openLinks);
Mousetrap.stopCallback = () => false;

// Setup ACE
var editor = ace.edit('editor');
editor.setOption('fontSize', '14px');
editor.setOption('showLineNumbers', false);
editor.setOption('showPrintMargin', false);
editor.$blockScrolling = Infinity;
editor.setTheme('ace/theme/kuroir');

Chrome.sendMessage({ operation: 'get_document' }).then(res => {
	if (res.error) {
		makeToast(res.error);
	} else {
		setEditorContent(res.text, res.format, res.highlightLine);
	}
});

/*
 * Copy the whole editor's content when nothing is selected
 */
window.addEventListener('copy', ev => {
	if (ev.clipboardData.getData('text/plain') !== '') {
		return;
	}
	ev.clipboardData.setData('text/plain', editor.getValue());
	makeToast('Copied the whole document');
});

/*
 * Confirm closing the tabs when there are unsaved changes
 */
window.addEventListener('beforeunload', ev => {
	if (!editor.session.getUndoManager().isClean()) {
		var message = Chrome.getString('confirm_unload');
		ev.returnValue = message;
		return message;
	}
});

/**
 * Download the editor's content as a text file
 */
function downloadAsTextFile(ev) {
	ev.preventDefault();
	FileSystem.saveFile(getIsoDateString() + '.md', editor.getValue());
	editor.session.getUndoManager().markClean();
}

/**
 * Close all tabs except the current one
 */
function closeOtherTabs(ev) {
	ev.preventDefault();
	Chrome.getCurrentTab().then(tab => {
		TabManager.closeOtherTabs(tab);
	});
}

/**
 * Replaces the text content of the editor
 *
 * @param text
 * @param mode: possible values are 'markdown' and 'json'
 * @param highlightLine line in which to place the cursor
 */
function setEditorContent(text, mode, highlightLine = 0) {
	if (mode) {
		editor.session.setMode('ace/mode/' + mode);
	}
	//session.setvalue: see https://github.com/ajaxorg/ace/issues/1243
	editor.session.setValue(text);
	editor.gotoLine(highlightLine);
	editor.focus();
}


/**
 * Show an 'Open File' dialog
 */
function loadFile(ev) {
	ev.preventDefault();
	fileInput.click();
}

/**
 * Open all links in the editor
 */
function openLinks(ev) {
	ev.preventDefault();
	var doc = parseHTML(marked(editor.getValue()));
	var windows = getTags(doc, 'ul').map(ul => {
		ul.parentNode.removeChild(ul);
		return getTags(ul, 'a').map(a => a.href);
	});

	if (getTags(doc, 'a').length > 0) {
		makeToast('Not all links are inside of a list');
	} else {
		TabManager.restoreWindows(windows);
	}
}

/**
 * Show a toast
 */
function makeToast(text) {
	toastNode.firstChild.nodeValue = text;
	toastNode.classList.remove('s-hidden');

	// Refresh the time-to-hide
	if (timeout !== undefined) {
		clearTimeout(timeout);
	}
	timeout = setTimeout(() => toastNode.classList.add('s-hidden'), 4000);
}