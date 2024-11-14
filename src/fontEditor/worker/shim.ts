self.document = {
	//@ts-ignore
  querySelectorAll(){return []},
	//@ts-ignore
	createElement(){
		return {
			setAttribute: () => {},
			addEventListener: () => {},
		}
	},
	addEventListener: () => {},
	head: {
		//@ts-ignore
		appendChild: () => {},
	},
	//@ts-ignore
	queryCommandSupported: () => {},
}

//@ts-ignore
self.UIEvent = class {}

self.window = {
	//@ts-ignore
	navigator: {
		userAgent: '',
	},
	//@ts-ignore
	location: {
		href: '',
	}
}