var { ActionButton } = require("sdk/ui/button/action")
var tabs = require('sdk/tabs');

var button = ActionButton({
  id: 'tab-attack',
  label: 'TabAttack',
  icon: {
    16: './icon-16.png',
    32: './icon-32.png',
    64: './icon-64.png'
  },
  onClick: function() {
    for (let tab of tabs) {
      console.log(tab.title);
      console.log(tab.url);
    }
  },
  badge: 0,
  badgeColor: "#00AAAA"
});

tabs.on('open', updateIcon);
tabs.on('close', updateIcon);
updateIcon();

function updateIcon() {
  button.badge = tabs.length;
}