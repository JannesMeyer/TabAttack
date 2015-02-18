var saveButton = document.getElementById('save');
saveButton.addEventListener('click', saveOptions);

function saveOptions() {
	var filter = document.querySelector('[name=m-filter]').value;
	var ignore_pinned = document.querySelector('[name=ignore-pinned]').checked;
  chrome.storage.sync.set({
    m_filter: filter,
    ignore_pinned: ignore_pinned
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    alert(status);
    setTimeout(function() {
      status.textContent = '';
    }, 3750);
  });
}

function restoreOptions() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    m_filter: "facebook.com\nmail.google.com",
    ignore_pinned: false
  }, function(items) {
    document.querySelector('[name=m-filter]').value = items.m_filter;
	document.querySelector('[name=ignore-pinned]').checked = items.ignore_pinned;
  });
}
document.addEventListener('DOMContentLoaded', restoreOptions);
