/**
 * Gets active tab in the last focused window.
 */
export default function getActiveTab(): Promise<browser.tabs.Tab> {
  return browser.tabs.query({ lastFocusedWindow: true, active: true }).then(t => t[0]);
}
