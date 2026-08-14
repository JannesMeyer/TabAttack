import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function decompressMozLz4(buffer) {
	const magic = buffer.subarray(0, 8).toString('utf8');
	if (magic !== 'mozLz40\0') {
		throw new Error('Invalid mozLz4 header');
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

	return new TextDecoder('utf-8').decode(dst.subarray(0, dPos));
}

function findSessionFile() {
	const home = os.homedir();
	const baseDir = path.join(home, 'Library/Application Support/Firefox/Profiles');

	if (!fs.existsSync(baseDir)) {
		throw new Error(`Firefox profiles directory not found: ${baseDir}`);
	}

	const profiles = fs.readdirSync(baseDir);
	for (const profile of profiles) {
		const profilePath = path.join(baseDir, profile);
		const recovery = path.join(profilePath, 'sessionstore-backups/recovery.jsonlz4');
		if (fs.existsSync(recovery)) {
			return recovery;
		}
		const backup = path.join(profilePath, 'sessionstore-backups/recovery.baklz4');
		if (fs.existsSync(backup)) {
			return backup;
		}
	}

	throw new Error('No Firefox recovery session file found.');
}

function main() {
	const args = process.argv.slice(2);
	const jsonOutput = args.includes('--json');
	const sessionFile = args.find((arg) => !arg.startsWith('-')) || findSessionFile();

	const buffer = fs.readFileSync(sessionFile);
	const jsonStr = decompressMozLz4(buffer);
	const data = JSON.parse(jsonStr);

	if (jsonOutput) {
		console.log(JSON.stringify(data, null, 2));
		return;
	}

	let totalTabs = 0;
	data.windows.forEach((win, winIdx) => {
		console.log(`\n### Window ${winIdx + 1} (${win.tabs.length} tabs)`);
		win.tabs.forEach((tab, tabIdx) => {
			totalTabs++;
			const entry = tab.entries[tab.index - 1] || tab.entries[tab.entries.length - 1] || {};
			const title = entry.title || '(Untitled)';
			const url = entry.url || '(No URL)';
			const isPinned = tab.pinned ? ' [Pinned]' : '';
			console.log(`${tabIdx + 1}. ${isPinned}${title}\n   ${url}`);
		});
	});
	console.log(`\nTotal Tabs: ${totalTabs}`);
}

main();
