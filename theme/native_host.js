#!/opt/homebrew/bin/node
import fs from "node:fs";
import net from "node:net";

const SOCKET_PATH = "/tmp/tabattack.sock";
const CACHE_FILE = "/tmp/tabattack_tabs.json";

let pendingCallbacks = [];

function readMessage() {
	const lengthBuf = Buffer.alloc(4);
	let bytesRead = 0;
	try {
		bytesRead = fs.readSync(0, lengthBuf, 0, 4, null);
	} catch {
		return null;
	}
	if (bytesRead < 4) return null;

	const msgLen = lengthBuf.readUInt32LE(0);
	const msgBuf = Buffer.alloc(msgLen);
	let totalRead = 0;
	while (totalRead < msgLen) {
		const chunk = fs.readSync(0, msgBuf, totalRead, msgLen - totalRead, null);
		if (chunk === 0) break;
		totalRead += chunk;
	}

	try {
		return JSON.parse(msgBuf.toString("utf8"));
	} catch {
		return null;
	}
}

function sendMessage(msg) {
	try {
		const jsonBuf = Buffer.from(JSON.stringify(msg), "utf8");
		const lengthBuf = Buffer.alloc(4);
		lengthBuf.writeUInt32LE(jsonBuf.length, 0);
		process.stdout.write(Buffer.concat([lengthBuf, jsonBuf]));
	} catch {
		// Output stream closed
	}
}

function startUnixSocket() {
	if (fs.existsSync(SOCKET_PATH)) {
		try {
			fs.unlinkSync(SOCKET_PATH);
		} catch {}
	}

	const server = net.createServer((socket) => {
		socket.on("data", (data) => {
			const reqStr = data.toString("utf8").trim();
			if (reqStr === "GET_TABS" || reqStr.startsWith("{")) {
				pendingCallbacks.push((response) => {
					try {
						socket.write(JSON.stringify(response) + "\n");
					} catch {}
					socket.end();
				});
				sendMessage({ type: "GET_TABS" });
			} else {
				socket.write(JSON.stringify({ error: "Unknown command" }) + "\n");
				socket.end();
			}
		});
	});

	server.listen(SOCKET_PATH, () => {
		fs.chmodSync(SOCKET_PATH, 0o777);
	});

	process.on("exit", () => {
		try {
			if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);
		} catch {}
	});
}

function main() {
	startUnixSocket();

	while (true) {
		const msg = readMessage();
		if (!msg) break;

		if (msg.type === "TABS_RESPONSE" || msg.type === "TABS_UPDATE") {
			try {
				fs.writeFileSync(CACHE_FILE, JSON.stringify(msg.tabs ?? msg, null, 2));
			} catch {}

			const callbacks = pendingCallbacks;
			pendingCallbacks = [];
			for (const cb of callbacks) {
				cb(msg.tabs ?? msg);
			}
		}
	}
}

main();
