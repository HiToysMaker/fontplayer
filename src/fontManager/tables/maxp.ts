import { getVersion } from '../utils'
import type { IFont } from '../font'
import { encoder } from '../encode'
import type { IValue } from '../encode'
import * as decode from '../decode'

// maxp表格式
// maxp table format
interface IMaxpTable {
	version?: number;
	numGlyphs?: number;
	maxPoints?: number;
	maxContours?: number;
	maxCompositePoints?: number;
	maxCompositeContours?: number;
	maxZones?: number;
	maxTwilightPoints?: number;
	maxStorage?: number;
	maxFunctionDefs?: number;
	maxInstructionDefs?: number;
	maxStackElements?: number;
	maxSizeOfInstructions?: number;
	maxComponentElements?: number;
	maxComponentDepth?: number;
}

// maxp表数据类型
// maxp table data type
const types = {
	version: 'Version16Dot16',
	numGlyphs: 'uint16',
	maxPoints: 'uint16',
	maxContours: 'uint16',
	maxCompositePoints: 'uint16',
	maxCompositeContours: 'uint16',
	maxZones: 'uint16',
	maxTwilightPoints: 'uint16',
	maxStorage: 'uint16',
	maxFunctionDefs: 'uint16',
	maxInstructionDefs: 'uint16',
	maxStackElements: 'uint16',
	maxSizeOfInstructions: 'uint16',
	maxComponentElements: 'uint16',
	maxComponentDepth: 'uint16',
}

/**
 * 解析maxp表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns IMaxpTable对象
 */
/**
 * parse head table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns IMaxpTable object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	// 获取maxp table version
	// get maxp table version
	const version = getVersion(data, offset)

	// 获取maxp表中的键值
	// get keys in maxp table
	const keys = Object.keys(types)
	const table: IMaxpTable = {}
	
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i]

		if (version >= 1 || key === 'numGlyphs' || key === 'version') {
			// 根据每个键值对应的数据类型，进行解析
			// parse each key according to its data type
			table[key as keyof typeof table] = decode.decoder[types[key as keyof typeof types] as keyof typeof decode.decoder]() as number
		}
	}
	decode.end()
	
	font.settings.numGlyphs = table.numGlyphs
	
	return table
}

/**
 * 根据IMaxpTable对象创建该表的原始数据
 * @param table IMaxpTable table
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * generate raw data from IHeadTable table
 * @param table IMaxpTable table
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (table: IMaxpTable) => {
	let data: Array<number> = []

	// 遍历table的每个键值，生成对应数据
	// traverse table, generate data for each key
	Object.keys(table).forEach((key: string) => {
		const type = types[key as keyof typeof types]
		const value = table[key as keyof typeof table] as IValue
		// 使用encoder中的方法，根据不同键值对应的数据类型生成数据
		// generate data use encoder according to each key's data type
		const bytes = encoder[type as keyof typeof encoder](value)
		if (bytes) {
			data = data.concat(bytes)
		}
	})
	return data
}

export {
	parse,
	create,
}

export type {
	IMaxpTable,
}