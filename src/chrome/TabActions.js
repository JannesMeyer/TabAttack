import * as Tabs from 'chrome-tool/tabs';

export function addCountListener(callback) {
  Tabs.onCreated(callback);
  Tabs.onRemoved(callback);
}

export function moveTab(delta) {
  Tabs.moveHighlighted(delta);
}

export function pinTab() {

}