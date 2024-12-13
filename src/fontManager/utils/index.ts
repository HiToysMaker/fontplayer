const getTag = (data: DataView, offset: number) => {
	const tagArr: Array<number> = []
	let tagStr: string = ''
	for (let i = 0; i < 4; i++) {
		tagArr.push(data.getUint8(offset + i))
		tagStr += String.fromCharCode(tagArr[i])
	}
	return {
		tagArr, tagStr,
	}
}

const getVersion = (data: DataView, offset: number) => {
	const major = data.getUint16(offset)
	const minor = data.getUint16(offset + 2)
	return major + minor / 0x1000 / 10
}

const getStorageString = (data: DataView, offset: number, bytes: number) => {
	const chars = []
    for (let i = 0; i < bytes / 2; i++) {
        chars[i] = data.getUint16(offset + i * 2)
    }
    return String.fromCharCode.apply(null, chars)
}

const computeCheckSum = (_bytes: Array<number>, write: boolean = false) => {
	let bytes = _bytes
	if (!write) {
		bytes = Object.assign([], _bytes)
	}
	while (bytes.length % 4 !== 0) {
		bytes.push(0)
	}

	let sum = 0
	for (let i = 0; i < bytes.length; i += 4) {
		// sum += (bytes[i] << 24) +
		// (bytes[i + 1] << 16) +
		// (bytes[i + 2] << 8) +
		// (bytes[i + 3])
		
		const value = ((bytes[i] << 24) >>> 0) +
		((bytes[i + 1] << 16) >>> 0) +
		((bytes[i + 2] << 8) >>> 0) +
		(bytes[i + 3] >>> 0)

		sum = (sum + value) >>> 0
	}
	
	sum %= 0x100000000
	return sum
}

const hasChineseChar = (text) => {
	let rs = false
	for (let i = 0; i < text.length; i++) {
		if (isChineseChar(text[i])) {
			rs = true
		}
	}
	return rs
}

const isChineseChar = (char) => {
	return /^[\u4E00-\u9FFF]$/.test(char);
}

export {
	getTag,
	getVersion,
	getStorageString,
	computeCheckSum,
	hasChineseChar,
	isChineseChar,
}