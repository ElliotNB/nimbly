module.exports = class MockMutationObserver {
	
	constructor(handler) {
		if (typeof handler !== "function") {
			throw new Error("MutationObserver handler must be a function.");
		}
		this.handler = handler;
		
		setTimeout(() => {
			this.handler();
		}, 1000);
	};
	
	simulateMutation() {
		this.handler();
	};
	
	observe() {
		
	};
	
}