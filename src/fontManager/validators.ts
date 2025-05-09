type IValue = number | string | Array<number> | Array<string> | Array<any>
const LIMIT16 = 32768
const LIMIT32 = 2147483648
const validators = {
	uint8: (v: IValue) => {
		if (typeof v === 'number' && v >= 0 && v <= 255)
			return true
		return false
	},
	int8: (v: IValue) => {
		if (typeof v === 'number' && v >= -128 && v <= 127)
			return true
		return false
	},
	uint16: (v: IValue) => {
		if (typeof v !== 'number') return false
		return true
	},
	int16: (v: IValue) => {
		if (typeof v !== 'number') return false
		return true
	},
	uint24: (v: IValue) => {
		if (typeof v !== 'number') return false
		return true
	},
	uint32: (v: IValue) => {
		if (typeof v !== 'number') return false
		return true
	},
	int32: (v: IValue) => {
		if (typeof v !== 'number') return false
		return true
	},
	Fixed: (v: IValue) => {
		if (typeof v !== 'number') return false
		return true
	},
	FWORD: (v: IValue) => {
		if (typeof v !== 'number') return false
		return true
	},
	UFWORD: (v: IValue) => {
		if (typeof v !== 'number') return false
		return true
	},
	LONGDATETIME: (v: IValue) => {
		if (typeof v !== 'number') return false
    const timestamp = (v - 2082844800) * 1000
    if (new Date(timestamp).getTime() > 0) return true
		return false
	},
  Tag: (v: IValue) => {
    if ((v as string).length === 4) return true
    return false
  }
}

export {
  validators,
}