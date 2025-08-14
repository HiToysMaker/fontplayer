/**
 * decode: 用于对字体数据进行解码
 */
/**
 * decode: used for decode font data
 */

let data: DataView
let offset: number

/**
 * 启动新的解码
 * @param _data 字体文件DataView数据
 * @param _offset 当前需要解码的偏移位置
 */
/**
 * start decode
 * @param _data font data, type of DataView
 * @param _offset decoded offset
 */
const start = (_data: DataView, _offset: number) => {
	data = _data
	offset = _offset
}

/**
 * 结束解码
 */
/**
 * stop decode
 */
const end = () => {
	data = new DataView(new ArrayBuffer(0))
	offset = 0
}

/**
 * 获取当前位置
 * @returns offset
 */
/**
 * get current offset
 * @returns offset
 */
const getOffset = () => {
	return offset
}

/**
 * 设置位置
 */
/**
 * set current offset
 */
const setOffset = (_offset: number) => {
	offset = _offset
}

/**
 * 解码器，包含不同数据类型的解码方法
 */
/**
 * decoder, contains decode methods for each different data type
 */
const decoder = {
	uint8: () => {
		const value = data.getUint8(offset)
		offset += 1
		return value
	},
	int8: () => {
		const value = data.getInt8(offset)
		offset += 1
		return value
	},
	uint16: () => {
		const value = data.getUint16(offset)
		offset += 2
		return value
	},
	int16: () => {
		const value = data.getInt16(offset)
		offset += 2
		return value
	},
	uint24: () => {
		const byte1 = data.getUint8(offset)
		const byte2 = data.getUint8(offset + 1)
		const byte3 = data.getUint8(offset + 2)
		const value = (byte1 << 16) | (byte2 << 8) | byte3
		offset += 3
		return value
	},
	uint32: () => {
		const value = data.getUint32(offset)
		offset += 4
		return value
	},
	int32: () => {
		const value = data.getInt32(offset)
		offset += 4
		return value
	},
	bigInt: () => {
		const value = data.getBigInt64(offset)
		offset += 8
		return value
	},
	Fixed: () => {
		return decoder.int32()
	},
	FWORD: () => {
		return decoder.int16()
	},
	UFWORD: () => {
		return decoder.uint16()
	},
	F2DOT14: () => {
		const v = data.getInt16(offset) / 16384
		offset += 2
		return v
	},
	LONGDATETIME: () => {
		const value = Number(data.getBigInt64(offset))
		offset += 8
		return value
	},
	Tag: () => {
		const tagArr: Array<number> = []
		let tagStr: string = ''
		for (let i = 0; i < 4; i++) {
			tagArr.push(data.getUint8(offset + i))
			tagStr += String.fromCharCode(tagArr[i])
		}
		offset += 4
		return {
			tagArr, tagStr,
		}
	},
	Offset16: () => {
		return decoder.uint16()
	},
	Offset32: () => {
		return decoder.uint32()
	},
	Version16Dot16: () => {
		const major = data.getUint16(offset)
		const minor = data.getUint16(offset + 2)
		offset += 4
		return major + minor / 0x1000 / 10
	},
	Card8: () => {
		return decoder.uint8()
	},
	Card16: () => {
		return decoder.uint16()
	},
	OffSize: () => {
		return decoder.uint8()
	},
	SID: () => {
		return decoder.uint16()
	},
}

export {
	start,
	end,
	decoder,
	getOffset,
	setOffset,
}