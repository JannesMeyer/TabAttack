window.addEventListener('message', function(ev) {
  self.postMessage(ev.data);
});

self.on('message', function(msg) {
  window.postMessage(msg, '*');
});