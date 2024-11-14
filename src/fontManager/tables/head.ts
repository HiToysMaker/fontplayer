import type { IFont } from '../font'
import { encoder } from '../encode'
import * as decode from '../decode'

// head表格式
// head table format
interface IHeadTable {
	majorVersion?: number;
	minorVersion?: number;
	fontRevision?: number;
	checkSumAdjustment?: number;
	magicNumber?: number;
	flags?: number;
	unitsPerEm?: number;
	created?: number;
	modified?: number;
	xMin?: number;
	yMin?: number;
	xMax?: number;
	yMax?: number;
	macStyle?: number;
	lowestRecPPEM?: number;
	fontDirectionHint?: number;
	indexToLocFormat?: number;
	glyphDataFormat?: number;
}

// head表数据类型
// head table data type
const types = {
	majorVersion: 'uint16',
	minorVersion: 'uint16',
	fontRevision: 'Fixed',
	checkSumAdjustment: 'uint32',
	magicNumber: 'uint32',
	flags: 'uint16',
	unitsPerEm: 'uint16',
	created: 'LONGDATETIME',
	modified: 'LONGDATETIME',
	xMin: 'int16',
	yMin: 'int16',
	xMax: 'int16',
	yMax: 'int16',
	macStyle: 'uint16',
	lowestRecPPEM: 'uint16',
	fontDirectionHint: 'int16',
	indexToLocFormat: 'int16',
	glyphDataFormat: 'int16',
}

const getMacStyle = (macStyle: number) => {

}

/**
 * 解析head表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns IHeadTable对象
 */
/**
 * parse head table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns IHeadTable object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	// 获取head表中的键值
	// get keys in head table
	const keys = Object.keys(types)
	const table: IHeadTable = {}

	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i]

		// 根据每个键值对应的数据类型，进行解析
		// parse each key according to its data type
		table[key as keyof typeof table] = decode.decoder[types[key as keyof typeof types] as keyof typeof decode.decoder]() as number
	}
	decode.end()

	font.settings.indexToLocFormat = table.indexToLocFormat
	font.settings.unitsPerEm = table.unitsPerEm

	return table
}

/**
 * 根据IHeadTable对象创建该表的原始数据
 * @param table IHeadTable table
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * generate raw data from IHeadTable table
 * @param table IHeadTable table
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (table: IHeadTable) => {
	let data: Array<number> = []
	
	// 遍历table的每个键值，生成对应数据
	// traverse table, generate data for each key
	Object.keys(table).forEach((key: string) => {
		const type = types[key as keyof typeof types]
		const value = table[key as keyof typeof table]
		// 使用encoder中的方法，根据不同键值对应的数据类型生成数据
		// generate data use encoder according to each key's data type
		const bytes = encoder[type as keyof typeof encoder](value as number)
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
	IHeadTable,
}