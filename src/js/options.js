import './setDefaults';
import { lightThemes, darkThemes } from './lib-browser/aceThemeList';

console.log('lightThemes', Object.keys(lightThemes).length);
console.log('darkThemes', Object.keys(darkThemes).length);

// Setup
var toastNode = document.querySelector('.m-toast');
var formatSelect = document.querySelector('.m-export-format');
var ignorePinnedCheckbox = document.querySelector('.m-ignore-pinned');
var blacklistTextarea = document.querySelector('.m-filter');
var editorThemeSelect = document.querySelector('.m-editor-theme');
updateFormState();

// Useful for testing purposes:
// chrome.storage.sync.clear()
// chrome.storage.sync.get(function(p) { console.log(p) })

/*
 * Submit handler: Save options to chrome.storage.sync
 */
document.querySelector('form').addEventListener('submit', ev => {
	ev.preventDefault();
	Chrome.setPreferences({
		format: formatSelect.value,
		ignorePinned: ignorePinnedCheckbox.checked,
		domainBlacklist: blacklistTextarea.value.split('\n').map(v => v.trim()).filter(v => v !== ''),
		editorTheme: editorThemeSelect.value
	}).then(() => {
		// Let the user know the options were saved
		showToast(Chrome.getString('options_saved'));
	});
});

/**
 * Restore form state with data from chrome.storage.sync
 */
function updateFormState() {
	Chrome.getPreferences().then(prefs => {
		formatSelect.value = prefs.format;
		ignorePinnedCheckbox.checked = prefs.ignorePinned;
		blacklistTextarea.value = prefs.domainBlacklist.join('\n');
	});
}

/**
 * Show a toast
 *
 * @param text
 * @param duration in seconds
 */
function showToast(text, duration = 2) {
	toastNode.firstChild.firstChild.nodeValue = text;
	toastNode.classList.remove('s-hidden');
	setTimeout(() => toastNode.classList.add('s-hidden'), duration * 1000);
}