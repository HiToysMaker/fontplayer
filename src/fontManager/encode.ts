/**
 * encode: 用于对字体数据进行编码
 */
/**
 * encode: used for encode font data
 */

const LIMIT16 = 32768
const LIMIT32 = 2147483648

interface ITag {
  tagArr: Array<number>,
  tagStr: string,
}
type IValue = number | string | ITag | Array<number> | Array<string> | Array<any>

const wmm = typeof WeakMap === 'function' && new WeakMap()

/**
 * 编码器，包含不同数据类型的编码方法，每个方法输入为IValue类型的数值，输出为每项为8-bit数字的原始数据数组
 */
/**
 * encoder, contains encode mathods for each different data type
 */
const encoder = {
	uint8: (v: IValue) => {
		if (typeof v === 'number' && v >= 0 && v <= 255)
			return [v]
		return false
	},
	int8: (v: IValue) => {
		if (typeof v === 'number' && v >= -128 && v <= 127)
			return [v]
		return false
	},
	uint16: (v: IValue) => {
		if (typeof v !== 'number') return false
		return [(v >> 8) & 0xFF, v & 0xFF]
	},
	int16: (v: IValue) => {
		if (typeof v !== 'number') return false
		let _v = v as number
		if (_v >= LIMIT16) {
			_v = -(2 * LIMIT16 - _v)
		}
		return [(_v >> 8) & 0xFF, _v & 0xFF]
	},
	uint24: (v: IValue) => {
		if (typeof v !== 'number') return false
		return [(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]
	},
	uint32: (v: IValue) => {
		if (typeof v !== 'number') return false
		return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]
	},
	int32: (v: IValue) => {
		if (typeof v !== 'number') return false
		let _v = v as number
		if (v >= LIMIT32) {
			_v = -(2 * LIMIT32 - v)
		}
		return [(_v >> 24) & 0xFF, (_v >> 16) & 0xFF, (_v >> 8) & 0xFF, _v & 0xFF]
	},
	Fixed: (v: IValue) => {
		if (typeof v !== 'number') return false
		// Fixed 格式：16.16 定点数
		// 整数部分占高 16 位，小数部分占低 16 位
		// 例如：50.0 → 50 * 0x10000 = 3276800 = 0x00320000
		const scaledValue = Math.round(v * 0x10000)
		const result = [
			(scaledValue >> 24) & 0xFF,
			(scaledValue >> 16) & 0xFF,
			(scaledValue >> 8) & 0xFF,
			scaledValue & 0xFF
		]
		// 只对版本号打印日志（大于0x00010000的值）
		if (v >= 0x00010000 || v === 0x00030000 || v === 0x00005000) {
			console.log(`[encoder.Fixed] Version: input=0x${v.toString(16).padStart(8, '0')}, scaled=${scaledValue}, bytes=[${result.join(', ')}]`)
		}
		return result
	},
	FWORD: (v: IValue) => {
		if (typeof v !== 'number') return false
		return encoder.int16(v)
	},
	UFWORD: (v: IValue) => {
		if (typeof v !== 'number') return false
		return encoder.uint16(v)
	},
	F2DOT14: (v: IValue) => {

	},
	LONGDATETIME: (v: IValue) => {
		if (typeof v !== 'number') return false
		return [0, 0, 0, 0, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]
	},
	Tag: (v: IValue) => {
		if ((v as string).length === 4) {
			return [
				(v as string).charCodeAt(0),
				(v as string).charCodeAt(1),
				(v as string).charCodeAt(2),
				(v as string).charCodeAt(3)
			]
		} else if ((v as ITag).tagStr && (v as ITag).tagStr.length === 4) {
			return [
				(v as ITag).tagStr.charCodeAt(0),
				(v as ITag).tagStr.charCodeAt(1),
				(v as ITag).tagStr.charCodeAt(2),
				(v as ITag).tagStr.charCodeAt(3)
			]
		}
		return false
	},
	Offset16: (v: IValue) => {
		return encoder.uint16(v)
	},
	Offset24: (v: IValue) => {
		return encoder.uint24(v)
	},
	Offset32: (v: IValue) => {
		return encoder.uint32(v)
	},
	Version16Dot16: (v: IValue) => {
		if (typeof v !== 'number') return false
		
		// Version16Dot16 通常传入的是已编码的十六进制数（如 0x00010000）
		// 不需要再乘以 0x10000，直接拆分为4个字节即可
		console.log(`[encoder.Version16Dot16] Input: 0x${v.toString(16).padStart(8, '0')} (${v})`)
		
		const result = [
			(v >> 24) & 0xFF,
			(v >> 16) & 0xFF,
			(v >> 8) & 0xFF,
			v & 0xFF
		]
		
		console.log(`[encoder.Version16Dot16] Output: [${result.join(', ')}]`)
		return result
	},
	Card8: (v: IValue) => {
		return encoder.uint8(v)
	},
	Card16: (v: IValue) => {
		return encoder.uint16(v)
	},
	OffSize: (v: IValue) => {
		return encoder.uint8(v)
	},
	SID: (v: IValue) => {
		return encoder.uint16(v)
	},
	Name: (v: IValue) => {
		return encoder.String(v)
	},
	String: (v: IValue) => {
		if (typeof v === 'undefined') {
			v = ''
		}
		let bytes = []
		for (let i = 0; i < (v as string).length; i += 1) {
			bytes[i] = (v as string).charCodeAt(i)
		}
		return bytes
	},
	Operand: (v: IValue, type?: string | Array<string>) => {
		let d: Array<number> = []
    if (Array.isArray(type)) {
			for (let i = 0; i < type.length; i += 1) {
				d = d.concat(encoder.Operand((v as Array<string | number>)[i], type[i]));
			}
    } else {
			if (type === 'SID') {
				d = d.concat(encoder.number(v))
			} else if (type === 'offset') {
				d = d.concat(encoder.number32(v))
			} else if (type === 'number') {
				d = d.concat(encoder.number(v))
			} else if (type === 'real') {
				d = d.concat(encoder.real(v))
			} else if (type === 'Fixed') {
				//@ts-ignore
				d = d.concat(encoder.Fixed(v))
			} else if (type === 'number16') {
				d = d.concat(encoder.number16(v))
			} else if (type === 'number32') {
				d = d.concat(encoder.number32(v))
			}
			else {
				throw new Error('Unknown operand type ' + type)
			}
    }
    return d
	},
	number: (v: IValue) => {
		let _v = v as number
		if (_v >= -107 && _v <= 107) {
			return [_v + 139]
		} else if (_v >= 108 && _v <= 1131) {
			_v = _v - 108
			return [(_v >> 8) + 247, _v & 0xFF]
		} else if (_v >= -1131 && _v <= -108) {
			_v = -_v - 108
			return [(_v >> 8) + 251, _v & 0xFF]
		} else if (_v >= -32768 && _v <= 32767) {
			return encoder.number16(_v)
		} else {
			return encoder.number32(_v)
		}
	},
	number16: (v: IValue) => {
		if (typeof v !== 'number') return []
		return [28, (v >> 8) & 0xFF, v & 0xFF]
	},
	number32: (v: IValue) => {
		if (typeof v !== 'number') return []
		return [29, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF]
	},
	real: (v: IValue) => {
		let value = v.toString()
    const m = /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(value)
    if (m) {
      const epsilon = parseFloat('1e' + ((m[2] ? +m[2] : 0) + m[1].length))
      value = (Math.round(v as number * epsilon) / epsilon).toString()
    }

    let nibbles = ''
    for (let i = 0, ii = value.length; i < ii; i += 1) {
			const c = value[i]
			if (c === 'e') {
				nibbles += value[++i] === '-' ? 'c' : 'b'
			} else if (c === '.') {
				nibbles += 'a'
			} else if (c === '-') {
				nibbles += 'e'
			} else {
				nibbles += c
			}
    }

    nibbles += (nibbles.length & 1) ? 'f' : 'ff'
    const out = [30]
    for (let i = 0, ii = nibbles.length; i < ii; i += 2) {
      out.push(parseInt(nibbles.substr(i, 2), 16))
    }

    return out
	},
	CharString: (v: IValue) => {
		if (wmm) {
			const cachedValue = wmm.get(v as Array<any>)
			if (cachedValue !== undefined) {
					return cachedValue
			}
		}

		let d: Array<number> = []
		const length = (v as Array<any>).length

		for (let i = 0; i < length; i += 1) {
			const op: any = (v as Array<any>)[i];
			d = d.concat(encoder[op.type as keyof typeof encoder](op.value))
		}

		if (wmm) {
			wmm.set((v as Array<any>), d)
		}
		return d
	},
	Operator: (v: IValue) => {
		if (typeof v !== 'number') return []
		if (v < 1200) {
			return [v]
		} else {
			return [12, v - 1200]
		}
	},
	op: (v: IValue) => {
		return encoder.uint8(v)
	},
	raw: (v: IValue) => {
		return v
	},
	utf16: (v: IValue) => {
		const b = []
    for (let i = 0; i < (v as string).length; i += 1) {
			const codepoint = (v as string).charCodeAt(i)
			b[b.length] = (codepoint >> 8) & 0xFF
			b[b.length] = codepoint & 0xFF
    }

    return b
	},
}

const setByesAt = (data: Array<number>, bytes: Array<number>, index: number) => {
	for (let i = 0; i < bytes.length; i++) {
		data[index + i] = bytes[i]
	}
	return data
}

export {
	encoder,
	setByesAt,
}

export type {
	IValue,
}