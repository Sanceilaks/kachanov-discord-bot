class Socket extends EventTarget {
	#url = null;
	#ws = null;

	constructor(url) {
		super();

		this.#url = url;

		this.#connect();
	}

	send(type, data) {
		const send = (_) => this.#ws.send(JSON.stringify([type, data]));

		if (this.#ws.readyState === WebSocket.OPEN) return send();

		const checkInterval = setInterval((_) => {
			if (this.#ws.readyState !== WebSocket.CONNECTING)
				clearInterval(checkInterval);
			if (this.#ws.readyState === WebSocket.OPEN) send();
		}, 1000);
	}

	#connect() {
		this.#ws = new WebSocket(this.#url);

		this.#ws.onmessage = (e) => {
			const [action, data] = JSON.parse(e.data);
			this.dispatchEvent(
				new CustomEvent("message", { detail: { action, data } }),
			);
		};

		this.#ws.onclose = (detail) => {
			const { code, reason } = detail;

			if (code >= 4000)
				return this.dispatchEvent(new CustomEvent("close", { detail }));

			setTimeout(this.#connect.bind(this), 1000);
		};
	}
}

export default Socket;
