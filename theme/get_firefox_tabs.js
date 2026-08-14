import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const SOCKET_PATH = "/tmp/tabattack.sock";
const CACHE_PATH = "/tmp/tabattack_tabs.json";

function queryLiveSocket() {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(SOCKET_PATH)) {
			return reject(new Error("Socket not found"));
		}

		const socket = net.createConnection(SOCKET_PATH);
		let data = "";

		socket.setTimeout(1500);

		socket.on("connect", () => {
			socket.write("GET_TABS\n");
		});

		socket.on("data", (chunk) => {
			data += chunk.toString("utf8");
		});

		socket.on("end", () => {
			try {
				const json = JSON.parse(data.trim());
				resolve(json);
			} catch (err) {
				reject(err);
			}
		});

		socket.on("timeout", () => {
			socket.destroy();
			reject(new Error("Socket timeout"));
		});

		socket.on("error", (err) => {
			reject(err);
		});
	});
}

function decompressMozLz4(buffer) {
	const magic = buffer.subarray(0, 8).toString("utf8");
	if (magic !== "mozLz40\0") {
		throw new Error("Invalid mozLz4 header");
	}
	const uncompressedSize = buffer.readUInt32LE(8);
	const src = buffer.subarray(12);
	const dst = new Uint8Array(uncompressedSize);
	let dPos = 0;
	let sPos = 0;

	while (sPos < src.length && dPos < uncompressedSize) {
		const token = src[sPos++];
		let literalLen = token >> 4;
		if (literalLen === 15) {
			let b;
			while ((b = src[sPos++]) === 255) literalLen += 255;
			literalLen += b;
		}

		for (let i = 0; i < literalLen; i++) {
			dst[dPos++] = src[sPos++];
		}

		if (dPos >= uncompressedSize || sPos >= src.length) break;

		const offset = src[sPos++] | (src[sPos++] << 8);
		let matchLen = (token & 0x0f) + 4;
		if (matchLen === 19) {
			let b;
			while ((b = src[sPos++]) === 255) matchLen += 255;
			matchLen += b;
		}

		const matchPos = dPos - offset;
		for (let i = 0; i < matchLen; i++) {
			dst[dPos++] = dst[matchPos + i];
		}
	}

	return new TextDecoder("utf-8").decode(dst.subarray(0, dPos));
}

function findSessionFile() {
	const home = os.homedir();
	const baseDir = path.join(home, "Library/Application Support/Firefox/Profiles");

	if (!fs.existsSync(baseDir)) {
		throw new Error(`Firefox profiles directory not found: ${baseDir}`);
	}

	const profiles = fs.readdirSync(baseDir);
	for (const profile of profiles) {
		const profilePath = path.join(baseDir, profile);
		const recovery = path.join(profilePath, "sessionstore-backups/recovery.jsonlz4");
		if (fs.existsSync(recovery)) {
			return recovery;
		}
		const backup = path.join(profilePath, "sessionstore-backups/recovery.baklz4");
		if (fs.existsSync(backup)) {
			return backup;
		}
	}

	throw new Error("No Firefox recovery session file found.");
}

async function getTabs() {
	// 1. Try querying native messaging live socket
	try {
		const liveData = await queryLiveSocket();
		if (liveData) {
			return { source: "native-socket", data: liveData };
		}
	} catch {}

	// 2. Try live cache file if available
	if (fs.existsSync(CACHE_PATH)) {
		try {
			const cacheData = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
			return { source: "native-cache", data: cacheData };
		} catch {}
	}

	// 3. Fallback to profile sessionstore file
	const sessionFile = findSessionFile();
	const buffer = fs.readFileSync(sessionFile);
	const jsonStr = decompressMozLz4(buffer);
	return { source: "profile-sessionstore", data: JSON.parse(jsonStr) };
}

async function main() {
	const args = process.argv.slice(2);
	const jsonOutput = args.includes("--json");

	const { source, data } = await getTabs();

	if (jsonOutput) {
		console.log(JSON.stringify(data, null, 2));
		return;
	}

	console.log(`[Source: ${source}]`);

	if (Array.isArray(data)) {
		// Array of tabs from chrome.tabs.query
		const byWindow = new Map();
		for (const tab of data) {
			const winId = tab.windowId ?? 1;
			if (!byWindow.has(winId)) byWindow.set(winId, []);
			byWindow.get(winId).push(tab);
		}

		let totalTabs = 0;
		for (const [winId, tabs] of byWindow) {
			console.log(`\n### Window ${winId} (${tabs.length} tabs)`);
			tabs.forEach((tab, idx) => {
				totalTabs++;
				const title = tab.title || "(Untitled)";
				const url = tab.url || "(No URL)";
				const isPinned = tab.pinned ? " [Pinned]" : "";
				console.log(`${idx + 1}. ${isPinned}${title}\n   ${url}`);
			});
		}
		console.log(`\nTotal Tabs: ${totalTabs}`);
		return;
	}

	if (data.windows) {
		// Sessionstore format
		let totalTabs = 0;
		data.windows.forEach((win, winIdx) => {
			console.log(`\n### Window ${winIdx + 1} (${win.tabs.length} tabs)`);
			win.tabs.forEach((tab, tabIdx) => {
				totalTabs++;
				const entry = tab.entries[tab.index - 1] || tab.entries[tab.entries.length - 1] || {};
				const title = entry.title || "(Untitled)";
				const url = entry.url || "(No URL)";
				const isPinned = tab.pinned ? " [Pinned]" : "";
				console.log(`${tabIdx + 1}. ${isPinned}${title}\n   ${url}`);
			});
		});
		console.log(`\nTotal Tabs: ${totalTabs}`);
	}
}

main();
