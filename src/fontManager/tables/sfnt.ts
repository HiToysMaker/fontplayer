import { encoder } from '../encode'
import type { ITableConfig } from '../font'
import { tableTool } from '../table'
import { computeCheckSum } from '../utils'
import { parseTablesToCharacters } from '../character'
import type { IFont } from '../font'
import type { ITable } from '../table'
import * as decode from '../decode'
import * as R from 'ramda'
import { incrementProgress, reserveProgressBudget, setProgressMessage, yieldToEventLoop } from '../utils/progress'

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

const recordFieldOrder = ['tag', 'checkSum', 'offset', 'length'] as const

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
	for (const key of recordFieldOrder) {
		const type = types[key]
		const value = record[key]
		const bytes = encoder[type as keyof typeof encoder](value)
		if (bytes) {
			data = data.concat(bytes)
		}
	}
	return data
}

const createConfig = (config: ITableConfig) => {
	let data: Array<number> = []
	
	// 按OpenType规范的严格顺序输出字段
	// 1. sfntVersion (4字节)
	const sfntVersion = (config as any).sfntVersion
	let sfntVersionBytes: number[] | false = false
	
	if (typeof sfntVersion === 'number') {
		// TrueType格式：0x00010000
		sfntVersionBytes = encoder.uint32(sfntVersion)
	} else if (typeof sfntVersion === 'string') {
		// CFF格式：'OTTO'
		sfntVersionBytes = encoder.Tag(sfntVersion)
	}
	
	if (sfntVersionBytes) {
		data = data.concat(sfntVersionBytes)
		console.log(`✅ sfntVersion encoded: ${sfntVersionBytes.length} bytes [${sfntVersionBytes.join(', ')}]`)
	} else {
		console.error('❌ Failed to encode sfntVersion:', sfntVersion)
	}
	
	// 2. 其他字段按顺序
	const fieldOrder = ['numTables', 'searchRange', 'entrySelector', 'rangeShift']
	for (const key of fieldOrder) {
		const type = types[key as keyof typeof types]
		const value = (config as any)[key]
		const bytes = encoder[type as keyof typeof encoder](value)
		if (bytes) {
			data = data.concat(bytes)
		}
	}
	
	console.log(`✅ Config header: ${data.length} bytes total (expected: 12)`)
	if (data.length !== 12) {
		console.error(`❌ Config header size mismatch! Got ${data.length}, expected 12`)
	}
	
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

const parse2 = (data: DataView, offset: number, length: number) => {
	const bytes = []
	for (let i = 0; i < length; i++) {
		const byte = data.getUint8(offset + i)
		bytes.push(byte)
	}
	return bytes
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
const create = async (tables: any, mark: string = '') => {
	let checksum = 0
	const _tables = []
	const recordMap = {}
	const tablesDataMap = {}
	const keys: Array<string> = []
	for (const key in tables) {
		if (Object.prototype.hasOwnProperty.call(tables, key)) {
			keys.push(key)
		}
	}
	const numTables = keys.length
	const highestPowerOf2 = Math.pow(2, log2(numTables))
	const searchRange = 16 * highestPowerOf2
	
	// 根据字体格式设置sfntVersion
	// TrueType格式（有glyf表）：0x00010000
	// CFF格式（有CFF表）：'OTTO'
	const hasTrueTypeOutlines = !!tables['glyf']
	const hasCFFOutlines = !!tables['CFF ']
	const sfntVersion = hasTrueTypeOutlines ? 0x00010000 : 'OTTO'
	
	console.log(`\n=== Font Format Detection ===`)
	console.log(`Has glyf table: ${hasTrueTypeOutlines}`)
	console.log(`Has CFF table: ${hasCFFOutlines}`)
	console.log(`sfntVersion: ${typeof sfntVersion === 'number' ? '0x' + sfntVersion.toString(16).padStart(8, '0') : sfntVersion} (${hasTrueTypeOutlines ? 'TrueType' : 'CFF'})`)
	console.log(`==============================\n`)
	
	const configData = createConfig({
		sfntVersion: sfntVersion,
		numTables,
		searchRange,
		entrySelector: log2(highestPowerOf2),
		rangeShift: numTables * 16 - searchRange,
	})
	checksum += computeCheckSum(configData)
	checksum %= 0x100000000 // 防止溢出
	
  let recordsData: Array<number> = []
  let tablesData: Array<number> = []

	// 第1步：先对keys排序（OpenType要求表目录按字母顺序）
	keys.sort((key1, key2) => {
		if (key1 > key2) {
			return 1
		} else {
			return -1
		}
	})

	// 第2步：按排序后的顺序计算offset并生成数据
  let offset = configData.length + (createRecord({tag: 'xxxx', checkSum: 0, offset: 0, length: 0}).length * numTables)
	let count = 0
	while (offset % 4 !== 0) {
		offset++
		count++
	}
	
	console.log(`\n📋 Processing ${keys.length} tables in order: ${keys.join(', ')}\n`)
	reserveProgressBudget(keys.length + 1)
	setProgressMessage('序列化 SFNT 表中…')
	
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i]
		console.log(`⏳ [${i+1}/${keys.length}] Creating table: ${key}...`)
		const t = tables[key]
		let tableData = null
		const tableStart = Date.now()
		setProgressMessage(`序列化 ${key} 表 (${i + 1}/${keys.length})`)
		
		// 特殊处理：loca表需要使用glyf序列化后的真实offsets
		if (key === 'loca' && (t as any)._needsRealOffsets) {
			const glyfTableRef = (t as any)._glyfTableRef
			if (glyfTableRef && (glyfTableRef as any)._generatedOffsets) {
				console.log('\n=== Creating loca table with real offsets ===')
				const realOffsets = (glyfTableRef as any)._generatedOffsets
				console.log(`Using real offsets from glyf serialization: ${realOffsets.length} entries`)
				console.log(`First offsets: [${realOffsets.slice(0, 5).join(', ')}...]`)
				console.log(`Last offsets: [...${realOffsets.slice(-5).join(', ')}]`)
				
				// 创建正确的loca表对象
				const realLocaTable = {
					version: (t as any).version || 1,
					offsets: realOffsets
				}
				
				tableData = tableTool[key].create(realLocaTable, { version: realLocaTable.version })
				console.log('✅ loca table created with real offsets\n')
			} else {
				console.error('❌ ERROR: glyf table was not serialized yet or has no offsets!')
				tableData = tableTool[key].create(t)
			}
		} else if (key === 'CFF ') {
			tableData = await tableTool[key].create(t)
		} else {
			tableData = tableTool[key].create(t)
		}
		if (tableData && typeof (tableData as any).then === 'function') {
			tableData = await tableData
		}
		console.log(`   ✅ Table ${key} created: ${tableData.length} bytes`)

		console.log(`   ⏳ Computing checksum for ${key}...`)
		tablesDataMap[key] = tableData
		let checkSum = computeCheckSum(tableData)
		checkSum %= 0x100000000
		console.log(`   ✅ Checksum for ${key}: 0x${checkSum.toString(16)}`)
		
		if (key === 'head' && mark === 'final') {
			const t2 = R.clone(t)
			t2.checkSumAdjustment = 0x00000000
			// head表不是CFF，直接create
			const tableData2 = tableTool[key].create(t2)
			checkSum = computeCheckSum(tableData2)
			checkSum %= 0x100000000
		}
		
		const tableLength = tableData.length
		const recordData = createRecord({
			tag: key,
			checkSum,
			offset,
			length: tableLength,
		})
		
		_tables.push({
			name: key,
			table: t,
			config: {
				tableTag: {
					tagStr: key,
				},
				checkSum,
				offset,
				length: tableLength,
			}
		})
		
		if (key === 'name') {
			console.log('=== NAME TABLE DEBUG ===')
			console.log('Total checksum before name:', checksum)
			console.log('Name table offset:', offset)
			console.log('Name table length:', tableLength)
			console.log('Name record data:', recordData)
			console.log('Name checksum:', checkSum)
		}
		
		// 立即拼接recordData（按排序后的顺序）
		recordsData = recordsData.concat(recordData)
		
		const tableDuration = Date.now() - tableStart
		console.log(`   ⏱ ${key} table serialized in ${tableDuration}ms`)

		checksum += computeCheckSum(recordData)
		checksum %= 0x100000000 // 每次累加后都做模运算，防止溢出
		checksum += computeCheckSum(tableData)
		checksum %= 0x100000000
		
		// 立即拼接tableData（按排序后的顺序）
		tablesData = tablesData.concat(tableData)
		offset += tableLength
		
		// 4字节对齐
		while (offset % 4 !== 0) {
			offset++
			tablesData = tablesData.concat(encoder.uint8(0) as Array<number>)
		}
		incrementProgress(undefined, 1)
		await yieldToEventLoop(i + 1, 1)
	}
	
	// 在表目录和表数据之间添加padding（如果需要）
	for (let i = 0; i < count; i++) {
		recordsData = recordsData.concat(encoder.uint8(0) as Array<number>)
	}

	checksum %= 0x100000000 // 最终确保checksum在32位范围内
	
	console.log('\n=== FINAL DATA ASSEMBLY ===')
	console.log('Config data length:', configData.length)
	console.log('Records data length:', recordsData.length)
	console.log('Tables data length:', tablesData.length)
	console.log('Total:', configData.length + recordsData.length + tablesData.length)
	
	// 验证name record在最终数据中的位置
	const nameRecordIndex = keys.indexOf('name')
	if (nameRecordIndex >= 0) {
		const nameRecordStart = configData.length + nameRecordIndex * 16
		console.log('\n=== NAME RECORD VERIFICATION ===')
		console.log('Name record index in sorted keys:', nameRecordIndex)
		console.log('Name record should start at:', nameRecordStart)
		
		const finalData = [...configData, ...recordsData, ...tablesData]
		console.log('Name record in final data [' + nameRecordStart + '-' + (nameRecordStart + 15) + ']:')
		console.log(finalData.slice(nameRecordStart, nameRecordStart + 16))
		console.log('  Tag:', finalData.slice(nameRecordStart, nameRecordStart + 4).map(b => String.fromCharCode(b)).join(''))
		console.log('  CheckSum:', [finalData[nameRecordStart + 4], finalData[nameRecordStart + 5], finalData[nameRecordStart + 6], finalData[nameRecordStart + 7]])
		console.log('  Offset:', (finalData[nameRecordStart + 8] << 24) | (finalData[nameRecordStart + 9] << 16) | (finalData[nameRecordStart + 10] << 8) | finalData[nameRecordStart + 11])
		console.log('  Length:', (finalData[nameRecordStart + 12] << 24) | (finalData[nameRecordStart + 13] << 16) | (finalData[nameRecordStart + 14] << 8) | finalData[nameRecordStart + 15])
	}
	console.log('===============================\n')
	incrementProgress('合并 SFNT 数据', 1)

	return {
		data: [...configData, ...recordsData, ...tablesData],
		tables: _tables,
		tablesDataMap,
		checksum,
	}
}

export {
	parse,
	create,
}