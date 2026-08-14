export function setupNativeMessaging() {
	if (typeof browser === 'undefined' || !browser.runtime?.connectNative) {
		return;
	}

	let port: browser.runtime.Port | null = null;

	function sendTabs() {
		if (!port) return;
		chrome.tabs.query({}).then((tabs) => {
			port?.postMessage({ type: 'TABS_UPDATE', tabs });
		}).catch(() => {});
	}

	function connect() {
		try {
			port = browser.runtime.connectNative('tabattack');

			port.onMessage.addListener((msg: unknown) => {
				const data = msg as { type?: string } | undefined;
				if (data?.type === 'GET_TABS') {
					chrome.tabs.query({}).then((tabs) => {
						port?.postMessage({ type: 'TABS_RESPONSE', tabs });
					}).catch(() => {});
				}
			});

			port.onDisconnect.addListener(() => {
				port = null;
			});

			// Initial send once connected
			sendTabs();
		} catch {
			port = null;
		}
	}

	connect();

	return {
		sendTabs,
	};
}
