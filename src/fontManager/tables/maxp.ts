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

const fieldOrder = [
	'version',
	'numGlyphs',
	'maxPoints',
	'maxContours',
	'maxCompositePoints',
	'maxCompositeContours',
	'maxZones',
	'maxTwilightPoints',
	'maxStorage',
	'maxFunctionDefs',
	'maxInstructionDefs',
	'maxStackElements',
	'maxSizeOfInstructions',
	'maxComponentElements',
	'maxComponentDepth',
] as const

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
	const table: IMaxpTable = {}
	
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	for (const key of fieldOrder) {
		if (version >= 1 || key === 'numGlyphs' || key === 'version') {
			// 根据每个键值对应的数据类型，进行解析
			// parse each key according to its data type
			table[key] = decode.decoder[types[key] as keyof typeof decode.decoder]() as number
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
	
	// 检测版本
	const version = table.version || 0x00005000
	const isTrueType = version === 0x00010000
	
	console.log(`\n=== Creating maxp table ===`)
	console.log(`Version: 0x${version.toString(16).padStart(8, '0')} (${isTrueType ? 'TrueType' : 'CFF'})`)
	
	// 按照OpenType规范的严格字段顺序输出
	// 1. version (4字节)
	const versionBytes = encoder.Version16Dot16(version)
	if (versionBytes) data = data.concat(versionBytes)
	
	// 2. numGlyphs (2字节)
	const numGlyphsBytes = encoder.uint16(table.numGlyphs || 0)
	if (numGlyphsBytes) data = data.concat(numGlyphsBytes)
	
	// 如果是TrueType版本，输出额外字段
	if (isTrueType) {
		const uint16Fields = [
			'maxPoints',
			'maxContours',
			'maxCompositePoints',
			'maxCompositeContours',
			'maxZones',
			'maxTwilightPoints',
			'maxStorage',
			'maxFunctionDefs',
			'maxInstructionDefs',
			'maxStackElements',
			'maxSizeOfInstructions',
			'maxComponentElements',
			'maxComponentDepth',
		]
		
		for (const field of uint16Fields) {
			const value = (table as any)[field] || 0
			const bytes = encoder.uint16(value)
			if (bytes) data = data.concat(bytes)
		}
		
		console.log(`TrueType maxp: ${data.length} bytes`)
		console.log(`  numGlyphs: ${table.numGlyphs}`)
		console.log(`  maxPoints: ${table.maxPoints || 0}`)
		console.log(`  maxContours: ${table.maxContours || 0}`)
	} else {
		console.log(`CFF maxp: ${data.length} bytes`)
	}
	
	console.log(`===========================\n`)
	
	return data
}

export {
	parse,
	create,
}

export type {
	IMaxpTable,
}