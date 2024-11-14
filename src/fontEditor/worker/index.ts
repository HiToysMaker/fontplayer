const initWorker = () => {
	let worker = null
	if (window.Worker) {
		worker = new Worker(new URL('./worker.ts', import.meta.url))
	}
	return worker
}

enum WorkerEventType {
	ParseFont,
}

export {
	initWorker,
	WorkerEventType,
}