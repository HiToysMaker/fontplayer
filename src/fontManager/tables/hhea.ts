import type { IFont } from '../font'
import { encoder } from '../encode'
import * as decode from '../decode'

// hhea表格式
// hhea table format
interface IHheaTable {
	majorVersion?: number;
	minorVersion?: number;
	ascender?: number;
	descender?: number;
	lineGap?: number;
	advanceWidthMax?: number;
	minLeftSideBearing?: number;
	minRightSideBearing?: number;
	xMaxExtent?: number;
	caretSlopeRise?: number;
	caretSlopeRun?: number;
	caretOffset?: number;
	reserved0?: number;
	reserved1?: number;
	reserved2?: number;
	reserved3?: number;
	metricDataFormat?: number;
	numberOfHMetrics?: number;
}

// hhea表数据类型
// hhea table data type
const types = {
	majorVersion: 'uint16',
	minorVersion: 'uint16',
	ascender: 'FWORD',
	descender: 'FWORD',
	lineGap: 'FWORD',
	advanceWidthMax: 'UFWORD',
	minLeftSideBearing: 'FWORD',
	minRightSideBearing: 'FWORD',
	xMaxExtent: 'FWORD',
	caretSlopeRise: 'int16',
	caretSlopeRun: 'int16',
	caretOffset: 'int16',
	reserved0: 'int16',
	reserved1: 'int16',
	reserved2: 'int16',
	reserved3: 'int16',
	metricDataFormat: 'int16',
	numberOfHMetrics: 'uint16',
}

const fieldOrder = [
	'majorVersion',
	'minorVersion',
	'ascender',
	'descender',
	'lineGap',
	'advanceWidthMax',
	'minLeftSideBearing',
	'minRightSideBearing',
	'xMaxExtent',
	'caretSlopeRise',
	'caretSlopeRun',
	'caretOffset',
	'reserved0',
	'reserved1',
	'reserved2',
	'reserved3',
	'metricDataFormat',
	'numberOfHMetrics',
] as const

/**
 * 解析hhea表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns IHheaTable对象
 */
/**
 * parse hhea table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns IHheaTable object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	// 获取head表中的键值
	// get keys in hhea table
	const table: IHheaTable = {}

	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	for (const key of fieldOrder) {
		// 根据每个键值对应的数据类型，进行解析
		// parse each key according to its data type
		table[key] = decode.decoder[types[key] as keyof typeof decode.decoder]() as number
	}
	decode.end()

	font.settings.numberOfHMetrics = table.numberOfHMetrics
	font.settings.ascender = table.ascender
	font.settings.descender = table.descender

	return table
}

/**
 * 根据IHheaTable对象创建该表的原始数据
 * @param table IHheaTable table
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * generate raw data from IHheaTable table
 * @param table IHheaTable table
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (table: IHheaTable) => {
	let data: Array<number> = []

	// 遍历table的每个键值，生成对应数据
	// traverse table, generate data for each key
	for (const key of fieldOrder) {
		const value = table[key]
		if (value === undefined) continue
		const type = types[key]
		// 使用encoder中的方法，根据不同键值对应的数据类型生成数据
		// generate data use encoder according to each key's data type
		const bytes = encoder[type as keyof typeof encoder](value as number)
		if (bytes) {
			data = data.concat(bytes)
		}
	}

	return data
}

export {
	parse,
	create,
}

export type {
	IHheaTable,
}