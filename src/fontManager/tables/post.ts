import { getVersion } from '../utils'
import type { IFont } from '../font'
import { encoder } from '../encode'
import * as decode from '../decode'

// post表格式
// post table format
interface IPostTable {
	version: number;
	italicAngle: number;
	underlinePosition: number;
	underlineThickness: number;
	isFixedPitch: number;
	minMemType42: number;
	maxMemType42: number;
	minMemType1: number;
	maxMemType1: number;
	glyphNames?: Array<IGlyphName>;
	offsets?: Array<number>;
}

// GlyphName表数据类型
// GlyphName data type
interface IGlyphName {
	index: number;
	code?: number;
	name?: string;
}

// post表数据类型
// post table data type
const types = {
	version: 'Version16Dot16',
	italicAngle: 'Fixed',
	underlinePosition: 'FWORD',
	underlineThickness: 'FWORD',
	isFixedPitch: 'uint32',
	minMemType42: 'uint32',
	maxMemType42: 'uint32',
	minMemType1: 'uint32',
	maxMemType1: 'uint32',
	numGlyphs: 'uint16',
	glyphNameIndex: 'uint16',
	stringData: 'uint8',
	offset: 'int8',
}

/**
 * 解析post表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns IPostTable对象
 */
/**
 * parse post table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns IPostTable object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	const version = decode.decoder[types['version'] as keyof typeof decode.decoder]() as number
	const italicAngle = decode.decoder[types['italicAngle'] as keyof typeof decode.decoder]() as number
	const underlinePosition = decode.decoder[types['underlinePosition'] as keyof typeof decode.decoder]() as number
	const underlineThickness = decode.decoder[types['underlineThickness'] as keyof typeof decode.decoder]() as number
	const isFixedPitch = decode.decoder[types['isFixedPitch'] as keyof typeof decode.decoder]() as number
	const minMemType42 = decode.decoder[types['minMemType42'] as keyof typeof decode.decoder]() as number
	const maxMemType42 = decode.decoder[types['maxMemType42'] as keyof typeof decode.decoder]() as number
	const minMemType1 = decode.decoder[types['minMemType1'] as keyof typeof decode.decoder]() as number
	const maxMemType1 = decode.decoder[types['maxMemType1'] as keyof typeof decode.decoder]() as number

	const table: IPostTable = {
		version,
		italicAngle,
		underlinePosition,
		underlineThickness,
		isFixedPitch,
		minMemType42,
		maxMemType42,
		minMemType1,
		maxMemType1,
	}

	if (version === 2.0) {
		const numGlyphs = decode.decoder[types['numGlyphs'] as keyof typeof decode.decoder]() as number
		const glyphNames: Array<IGlyphName> = []
		let count = 0
		for (let i = 0; i < numGlyphs; i++) {
			const index = decode.decoder[types['glyphNameIndex'] as keyof typeof decode.decoder]() as number
			const glyphName: IGlyphName = { index }
			if (index >= 258 && index < 65535) {
				glyphName.code = decode.decoder['uint8']()
				glyphName.name = String.fromCharCode(glyphName.code)
				count++
			}
			glyphNames.push(glyphName)
		}
		table.glyphNames = glyphNames
	}

	if (version === 2.5) {
		const numGlyphs = decode.decoder[types['numGlyphs'] as keyof typeof decode.decoder]() as number
		for (let i = 0; i < numGlyphs; i++) {
			table.offsets?.push(decode.decoder['int8']())
		}
	}
	decode.end()

	return table
}

/**
 * 根据IPostTable对象创建该表的原始数据
 * @param table IPostTable table
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * generate raw data from IHeadTable table
 * @param table IPostTable table
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (table: IPostTable) => {
	let data: Array<number> = []
	
	console.log(`\n=== Creating post table ===`)
	console.log(`Version: 0x${table.version.toString(16).padStart(8, '0')} (decimal: ${table.version})`)

	// 遍历table的每个键值，生成对应数据
	// traverse table, generate data for each key
	Object.keys(table).forEach((key: string) => {
		const type = types[key as keyof typeof types]
		const value = table[key as keyof typeof table]

		// 使用encoder中的方法，根据不同键值对应的数据类型生成数据
		// generate data use encoder according to each key's data type
		let bytes: Array<number> = []
		if (key === 'glyphNames') {
			const glyphNames = value as Array<IGlyphName>
			bytes = bytes.concat(encoder[types['numGlyphs'] as keyof typeof encoder](glyphNames.length) as Array<number>)
			for (let i = 0; i < glyphNames.length; i++) {
				bytes = bytes.concat(encoder[type as keyof typeof encoder](glyphNames[i].index) as Array<number>)
			}
			for (let i = 0; i < glyphNames.length; i++) {
				if (glyphNames[i].index >= 258 && glyphNames[i].index < 65535)
					bytes = bytes.concat(encoder[type as keyof typeof encoder](glyphNames[i].name as string) as Array<number>)
			}
		} else if (key === 'offsets') {
			const offsets = value as Array<number>
			bytes = bytes.concat(encoder[types['numGlyphs'] as keyof typeof encoder](offsets.length) as Array<number>)
			for (let i = 0; i < offsets.length; i++) {
				bytes = bytes.concat(encoder[type as keyof typeof encoder](offsets[i]) as Array<number>)
			}
		} else {
			bytes = bytes.concat(encoder[type as keyof typeof encoder](value as number) as Array<number>)
		}
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
	IPostTable,
}