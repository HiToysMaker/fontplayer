import { encoder } from '../encode'
import type { ITableConfig } from '../font'
import { tableTool } from '../table'
import { computeCheckSum } from '../utils'
import { parseTablesToCharacters } from '../character'
import type { IFont } from '../font'
import type { ITable } from '../table'
import * as decode from '../decode'

const types = {
	sfntVersion: 'Tag',
	numTables: 'uint16',
	searchRange: 'uint16',
	entrySelector: 'uint16',
	rangeShift: 'uint16',
	tag: 'Tag',
	checkSum: 'uint32',
	offset: 'uint32',
	length: 'uint32',
}

interface IRecord {
	tag: ITag | string;
	checkSum: number;
	offset: number;
	length: number;
}

// Tag数据类型
// Tag data type
interface ITag {
  tagArr: Array<number>,
  tagStr: string,
}

const log2 = (v: number) => {
	return Math.log(v) / Math.log(2) | 0
}

const createRecord = (record: IRecord) => {
	let data: Array<number> = []
	Object.keys(record).forEach((key: string) => {
		const type = types[key as keyof typeof types]
		const value = record[key as keyof typeof record]
		const bytes = encoder[type as keyof typeof encoder](value)
		if (bytes) {
			data = data.concat(bytes)
		}
	})
	return data
}

const createConfig = (config: ITableConfig) => {
	let data: Array<number> = []
	Object.keys(config).forEach((key: string) => {
		const type = types[key as keyof typeof types]
		const value = config[key as keyof typeof config]
		const bytes = encoder[type as keyof typeof encoder](value)
		if (bytes) {
			data = data.concat(bytes)
		}
	})
	return data
}

const updateCharactersByTables = (font: IFont) => {
	font.characters = parseTablesToCharacters(font.tables as Array<ITable>)
}

/**
 * 解析font数据
 * @param data 字体文件DataView数据
 * @param font 字体对象
 * @returns font 字体对象
 */
/**
 * parse font data
 * @param data font data, type of DataView
 * @param font font object
 * @returns font object
 */
const parse = (data: DataView, font: IFont) => {
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, 0)
	const sfntVersion = decode.decoder[types['sfntVersion'] as keyof typeof decode.decoder]() as number
	const numTables = decode.decoder[types['numTables'] as keyof typeof decode.decoder]() as number
	const searchRange = decode.decoder[types['searchRange'] as keyof typeof decode.decoder]() as number
	const entrySelector = decode.decoder[types['entrySelector'] as keyof typeof decode.decoder]() as number
	const rangeShift = decode.decoder[types['rangeShift'] as keyof typeof decode.decoder]() as number
	const tableConfig = {
		sfntVersion,
		numTables,
		searchRange,
		entrySelector,
		rangeShift,
	}
	font.tableConfig = tableConfig
	for (let i = 0; i < numTables; i++) {
		const tableTag = decode.decoder[types['tag'] as keyof typeof decode.decoder]() as ITag
		const checkSum = decode.decoder[types['checkSum'] as keyof typeof decode.decoder]() as number
		const offset = decode.decoder[types['offset'] as keyof typeof decode.decoder]() as number
		const length = decode.decoder[types['length'] as keyof typeof decode.decoder]() as number
		const table: ITable = {
			name: tableTag.tagStr,
			table: null,
			config: {
				tableTag,
				checkSum,
				offset,
				length,
			},
		};
		(font.tables as Array<ITable>).push(table)
	}

	decode.end()

	const orderMap: any = {
		'head': 1,
		'maxp': 2,
		'loca': 3,
		'hhea': 4,
		'name': 5,
		'post': 6,
		'OS/2': 7,
		'hmtx': 8,
		'cmap': 9,
		'glyf': 10,
		'CFF ': 11,
	}
	font.tables = (font.tables as Array<ITable>).filter((table: ITable) => orderMap[table.name]).sort((a: ITable, b: ITable) => orderMap[a.name] - orderMap[b.name])
	font.tables.map((table: ITable) => {
		table.table = tableTool[table.name]?.parse(data, table.config.offset, font)
	})
	updateCharactersByTables(font)
	return font
}

/**
 * 生成font数据
 * @param tables font包含的表
 * @returns font数据
 */
/**
 * create font data
 * @param tables font tables
 * @returns font data
 */
const create = (tables: any) => {
	const _tables = []
	const tablesDataMap = {}
	const keys = Object.keys(tables)
	keys.sort((key1, key2) => {
		if (key1 > key2) {
			return 1
		} else {
			return -1
		}
	})
	const numTables = keys.length
	const highestPowerOf2 = Math.pow(2, log2(numTables))
	const searchRange = 16 * highestPowerOf2
	const configData = createConfig({
		sfntVersion: 'OTTO',
		numTables,
		searchRange,
		entrySelector: log2(highestPowerOf2),
		rangeShift: numTables * 16 - searchRange,
	})
  let recordsData: Array<number> = []
  let tablesData: Array<number> = []

  let offset = configData.length + (createRecord({tag: 'xxxx', checkSum: 0, offset: 0, length: 0}).length * numTables)
	while (offset % 4 !== 0) {
		offset++
		recordsData = recordsData.concat(encoder.uint8(0) as Array<number>)
	}

	for (let i = 0; i < keys.length; i++) {
		const t = tables[keys[i]]
		const tableData = tableTool[keys[i]].create(t)
		tablesDataMap[keys[i]] = tableData
		const checkSum = computeCheckSum(tableData)
		const tableLength = tableData.length
		const recordData = createRecord({
			tag: keys[i],
			checkSum,
			offset,
			length: tableLength,
		})
		_tables.push({
			name: keys[i],
			table: t,
			config: {
				tableTag: {
					tagStr: keys[i],
				},
				checkSum,
				offset,
				length: tableLength,
			}
		})
		recordsData = recordsData.concat(recordData)
		tablesData = tablesData.concat(tableData)
		offset += tableLength
	}
	return {
		data: [...configData, ...recordsData, ...tablesData],
		tables: _tables,
		tablesDataMap,
	}
}

export {
	parse,
	create,
}