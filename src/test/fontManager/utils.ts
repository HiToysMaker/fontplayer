const hex = (bytes) => {
	const values = []
	for (let i = 0; i < bytes.length; i++) {
		const b = bytes[i]
		if (b < 16) {
			values.push('0' + b.toString(16))
		} else {
			values.push(b.toString(16))
		}
	}

	return values.join(' ').toUpperCase()
}

const unhex = (str) => {
	str = str.split(' ').join('')
	const len = str.length / 2
	const data = new DataView(new ArrayBuffer(len), 0)
	for (let i = 0; i < len; i++) {
		data.setUint8(i, parseInt(str.slice(i * 2, i * 2 + 2), 16))
	}

	return data
}

const decodeVersion = (v) => {
	const data = new DataView(new Uint8Array([(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]).buffer)
	const major = data.getUint16(0)
	const minor = data.getUint16(2)
	return major + minor / 0x1000 / 10
}

export { hex, unhex, decodeVersion }