import type { IFont } from '../font'
import { encoder, setByesAt } from '../encode'
import type { ICharacter } from '../character'
import * as decode from '../decode'
import * as R from 'ramda'

// cmap表格式
// cmap table format
interface ICmapTable {
	version: number;
	numTables: number;
	encodingRecords: Array<IEncodingRecords>;
	glyphIndexMap?: any;
}

// encodingRecords数据类型
// encodingRecords data type
interface IEncodingRecords {
	platformID: number;
	encodingID: number;
	subtableOffset: number;
	subTable?: any;
}

// cmap数据类型
// cmap table data type
const types = {
	version: 'uint16',
	numTables: 'uint16',
	platformID: 'uint16',
	encodingID: 'uint16',
	subtableOffset: 'Offset32',
	format: 'uint16',
	length: 'uint16',
	language: 'uint16',
	segCountX2: 'uint16',
	searchRange: 'uint16',
	entrySelector: 'uint16',
	rangeShift: 'uint16',
	endCode: 'uint16',
	reservedPad: 'uint16',
	startCode: 'uint16',
	idDelta: 'int16',
	idRangeOffsets: 'uint16',
	glyphIdArray: 'uint16',
}

/**
 * 解析cmap表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns ICmapTable对象
 */
/**
 * parse cmap table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns ICmapTable object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	let _offset = offset
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, _offset)
	const version = decode.decoder[types['version'] as keyof typeof decode.decoder]() as number
	const numTables = decode.decoder[types['numTables'] as keyof typeof decode.decoder]() as number
	_offset = decode.getOffset()
	decode.end()
	const encodingRecords = []
	const glyphIndexMap = {}

	for (let i = 0; i < numTables; i++) {
		// 启动一个新的decoder
		// start a new decoder
		decode.start(data, _offset)
		const platformID = decode.decoder[types['platformID'] as keyof typeof decode.decoder]()
		const encodingID = decode.decoder[types['encodingID'] as keyof typeof decode.decoder]()
		const subtableOffset = decode.decoder[types['subtableOffset'] as keyof typeof decode.decoder]() as number
		_offset = decode.getOffset()
		decode.end()
		const subTable = getSubTable(data, offset + subtableOffset, glyphIndexMap)
		encodingRecords.push({
			platformID,
			encodingID,
			subtableOffset,
			subTable,
		})
	}

	const table = {
		version,
		numTables,
		encodingRecords,
		glyphIndexMap,
	}

	return table
}

/**
 * 获取 encodingRecords 子表
 * @param data 字体文件DataView数据
 * @param offset 当前子表的位置
 * @param glyphIndexMap glyph字形和索引的对应映射
 * @returns 对应格式的 encodingRecords 子表
 */
/**
 * get encodingRecords subtable
 * @param data font data, type of DataView
 * @param offset offset of current subtable
 * @param glyphIndexMap glyph and index map
 * @returns subtable according to its format
 */
const getSubTable = (data: DataView, offset: number, glyphIndexMap: any) => {
	let subTable = null

	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	const format = decode.decoder[types['format'] as keyof typeof decode.decoder]()

	// 根据format解析子表，目前支持4、12
	// parse subtable according to format, support 4,12
	switch (format) {
		case 4: {
			const length = decode.decoder[types['length'] as keyof typeof decode.decoder]() as number
			const language = decode.decoder[types['language'] as keyof typeof decode.decoder]() as number
			const segCountX2 = decode.decoder[types['segCountX2'] as keyof typeof decode.decoder]() as number
			const searchRange = decode.decoder[types['searchRange'] as keyof typeof decode.decoder]() as number
			const entrySelector = decode.decoder[types['entrySelector'] as keyof typeof decode.decoder]() as number
			const rangeShift = decode.decoder[types['rangeShift'] as keyof typeof decode.decoder]() as number

			const segCount = segCountX2 / 2

			const segments = []
			const _offset = decode.getOffset()
			decode.end()

			for (let i = 0; i < segCount; i++) {
				const endCode = data.getUint16(_offset + i * 2)
				const startCode = data.getUint16(_offset + segCount * 2 + 2 + i * 2)
				const idDelta = data.getInt16(_offset + segCount * 4 + 2 + i * 2)
				const idRangeOffset = data.getUint16(_offset + segCount * 6 + 2 + i * 2)
				segments.push({
					endCode,
					startCode,
					idDelta,
					idRangeOffset,
				})

				for (let c = startCode; c <= endCode; c += 1) {
					let glyphIndex
					if (idRangeOffset !== 0) {
						const idOffset = _offset + segCount * 6 + 2 + i * 2 + (c - startCode) * 2 + idRangeOffset
						glyphIndex = data.getUint16(idOffset)
						if (glyphIndex !== 0) {
							glyphIndex = (glyphIndex + idDelta) & 0xFFFF;
						}
					} else {
						glyphIndex = (c + idDelta) & 0xFFFF;
					}

					glyphIndexMap[c] = glyphIndex
				}
			}

			subTable = {
				format,
				length,
				language,
				segCount,
				searchRange,
				entrySelector,
				rangeShift,
				glyphIndexMap,
				segments,
			}
			break
		}
		case 12: {
			const reserved = decode.decoder['uint16']()
			const length = decode.decoder['uint32']()
			const language = decode.decoder['uint32']()
			const groupCount = decode.decoder['uint32']()
			const _offset = decode.getOffset()
			decode.end()
			const groups = []
			for (let i = 0; i < groupCount; i++) {
				const startCharCode = data.getUint32(_offset + i * 12)
				const endCharCode = data.getUint32(_offset + i * 12 + 4)
				let startGlyphId = data.getUint32(_offset + i * 12 + 8)
				groups.push({
					startCharCode,
					endCharCode,
					startGlyphId,
				})
				for (let c = startCharCode; c <= endCharCode; c++) {
					glyphIndexMap[c] = startGlyphId
					startGlyphId++
				}
		  }
			return {
				format,
				reserved,
				length,
				language,
				groupCount,
				glyphIndexMap,
				groups,
			}
			break
		}
	}

	decode.end()

	return subTable
}

/**
 * 根据字符数组创建cmap表
 * @param characters 字符数组
 * @returns cmap表
 */
/**
 * create cmap table according tp characters
 * @param characters characters array
 * @returns cmap table
 */
const createTable = (characters: Array<ICharacter>) => {
	let isPlan0Only = true
	let i

	// 检查是否需要格式12的子表
	// check if it needs format 12 subtable
	for (i = characters.length - 1; i > 0; i -= 1) {
		const character = characters[i]
		if (character.unicode > 65535) {
			isPlan0Only = false
			break
		}
	}

	// 创建cmap表
	// create cmap table
	const cmapTable: ICmapTable = {
		version: 0,
		numTables: isPlan0Only ? 2 : 3,
		encodingRecords: [],
	}
	cmapTable.encodingRecords.push({
		platformID: 0,
		encodingID: 3,
		subtableOffset: isPlan0Only ? 4 + 8 + 8 : (4 + 8 + 8 + 8),
	})
	cmapTable.encodingRecords.push({
		platformID: 3,
		encodingID: 1,
		subtableOffset: isPlan0Only ? 4 + 8 + 8 : (4 + 8 + 8 + 8),
	})
	if (!isPlan0Only) {
		cmapTable.encodingRecords.push({
			platformID: 3,
			encodingID: 10,
			subtableOffset: 4 + 8 + 8 + 8,
		})
	}
	cmapTable.encodingRecords[0].subTable = {
		format: 4,
		length: 0,
		language: 0,
		segCount: 0,
		searchRange: 0,
		entrySelector: 0,
		rangeShift: 0,
	}
	cmapTable.encodingRecords[1].subTable = {
		format: 4,
		length: 0,
		language: 0,
		segCount: 0,
		searchRange: 0,
		entrySelector: 0,
		rangeShift: 0,
	}
	if (!isPlan0Only) {
		cmapTable.encodingRecords[cmapTable.encodingRecords.length - 1].subTable = {
			format: 12,
			reserved: 0,
			length: 0,
			language: 0,
			groupCount : 0,
		}
	}

	const segments = []
	const groups = []
	const glyphIndexMap4: {
		[key: string | number]: string | number
	} = {}
	const glyphIndexMap12: {
		[key: string | number]: string | number
	} = {}
	for (i = 1; i < characters.length; i++) {
			const character = characters[i]
			if (character.unicode <= 65535) {
				segments.push({
					endCode: character.unicode,
					startCode: character.unicode,
					idDelta: -(character.unicode - i),
					idRangeOffset: 0,
				})
				glyphIndexMap4[character.unicode] = i
			} else if (!isPlan0Only) {
				groups.push({
					startCharCode: character.unicode,
					endCharCode: character.unicode,
					startGlyphId: i,
				})
				glyphIndexMap12[character.unicode] = i
			}
	}
	segments.sort(function (a, b) {
		return a.startCode - b.startCode
	})
	segments.push({
		endCode: 0xFFFF,
		startCode: 0xFFFF,
		idDelta: 1,
		idRangeOffset: 0
	})
	if (!isPlan0Only) {
		cmapTable.encodingRecords[cmapTable.encodingRecords.length - 1].subTable.groups = groups
		cmapTable.encodingRecords[cmapTable.encodingRecords.length - 1].subTable.glyphIndexMap = glyphIndexMap12
	}
	cmapTable.encodingRecords[0].subTable.segments = segments
	cmapTable.encodingRecords[1].subTable.segments = R.clone(segments)
	cmapTable.encodingRecords[0].subTable.glyphIndexMap = glyphIndexMap4
	cmapTable.encodingRecords[1].subTable.glyphIndexMap = R.clone(glyphIndexMap4)

  const segCount = segments.length
	cmapTable.encodingRecords[0].subTable.segCount = segCount
	cmapTable.encodingRecords[1].subTable.segCount = segCount
  cmapTable.encodingRecords[0].subTable.searchRange = Math.pow(2, Math.floor(Math.log(segCount) / Math.log(2))) * 2;
	cmapTable.encodingRecords[1].subTable.searchRange = Math.pow(2, Math.floor(Math.log(segCount) / Math.log(2))) * 2;
  cmapTable.encodingRecords[0].subTable.entrySelector = Math.log(cmapTable.encodingRecords[0].subTable.searchRange / 2) / Math.log(2)
	cmapTable.encodingRecords[1].subTable.entrySelector = Math.log(cmapTable.encodingRecords[1].subTable.searchRange / 2) / Math.log(2)
  cmapTable.encodingRecords[0].subTable.rangeShift = segCount * 2 - cmapTable.encodingRecords[0].subTable.searchRange
	cmapTable.encodingRecords[1].subTable.rangeShift = segCount * 2 - cmapTable.encodingRecords[1].subTable.searchRange

  cmapTable.encodingRecords[0].subTable.length = 14 + 2 + segments.length * 8
	cmapTable.encodingRecords[1].subTable.length = 14 + 2 + segments.length * 8

	cmapTable.encodingRecords[1].subtableOffset += cmapTable.encodingRecords[0].subTable.length

	if (!isPlan0Only) {
		cmapTable.encodingRecords[cmapTable.encodingRecords.length - 1].subtableOffset += (cmapTable.encodingRecords[0].subTable.length + cmapTable.encodingRecords[1].subTable.length)
		cmapTable.encodingRecords[cmapTable.encodingRecords.length - 1].subTable.length = 16 + groups.length * 4
		cmapTable.encodingRecords[cmapTable.encodingRecords.length - 1].subTable.groupCount = groups.length
	}
	return cmapTable
}

/**
 * 根据ICmapTable对象创建该表的原始数据
 * @param table ICmapTable table
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * generate raw data from IHheaTable table
 * @param table ICmapTable table
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (table: ICmapTable) => {
	let data: Array<number> = []

	// 遍历table的每个键值，生成对应数据
	// traverse table, generate data for each key
	Object.keys(table).forEach((key: string) => {
		const type = types[key as keyof typeof types]
		const value = table[key as keyof typeof table]

		// 使用encoder中的方法，根据不同键值对应的数据类型生成数据
		// generate data use encoder according to each key's data type
		let bytes: Array<number> = []
		if (key === 'encodingRecords') {
			const encodingRecords = value as Array<IEncodingRecords>
			for (let i = 0; i < encodingRecords.length; i++) {
				const record = encodingRecords[i]
				Object.keys(record).forEach((key) => {
					if (key !== 'subTable') {
						const type = types[key as keyof typeof types]
						const value = record[key as keyof typeof record]
						bytes = bytes.concat(encoder[type as keyof typeof encoder](value) as Array<number>)
					}
				})
			}
			for (let i = 0; i < encodingRecords.length; i++) {
				const subTable = encodingRecords[i].subTable
				if (subTable.format === 4) {
					Object.keys(subTable).forEach((key) => {
						if (key === 'segCount') {
							const type = types['segCountX2']
							const value = subTable[key as keyof typeof subTable] * 2
							bytes = bytes.concat(encoder[type as keyof typeof encoder](value) as Array<number>)
						} else if (key !== 'glyphIndexMap' && key !== 'segments') {
							const type = types[key as keyof typeof types]
							const value = subTable[key as keyof typeof subTable]
							bytes = bytes.concat(encoder[type as keyof typeof encoder](value) as Array<number>)
						}
					})
					const segments = subTable.segments
					const offset = bytes.length
					setByesAt(bytes, encoder['uint16' as keyof typeof encoder](0) as Array<number>, offset + segments.length * 2)
					for (let i = 0; i < segments.length; i++) {
						const segment = segments[i]
						setByesAt(bytes, encoder[types['endCode'] as keyof typeof encoder](segment.endCode) as Array<number>, offset + i * 2)
						setByesAt(bytes, encoder[types['startCode'] as keyof typeof encoder](segment.startCode) as Array<number>, offset + segments.length * 2 + 2 + i * 2)
						setByesAt(bytes, encoder[types['idDelta'] as keyof typeof encoder](segment.idDelta) as Array<number>, offset + segments.length * 4 + 2 + i * 2)
						setByesAt(bytes, encoder[types['idRangeOffsets'] as keyof typeof encoder](segment.idRangeOffset) as Array<number>, offset + segments.length * 6 + 2 + i * 2)
						for (let c = segment.startCode; c <= segment.endCode; c += 1) {
							const glyphIndex = subTable.glyphIndexMap[c]
							if (segment.idRangeOffset !== 0) {
								const idOffset = offset + segments.length * 8 + 2 + (c - segment.startCode) * 2 + segment.idRangeOffset
								setByesAt(bytes, encoder[types['glyphIdArray'] as keyof typeof encoder](glyphIndex) as Array<number>, idOffset)
							}
						}
					}
				} else if (subTable.format === 12) {
					bytes = bytes.concat(encoder['uint16' as keyof typeof encoder](subTable.format) as Array<number>)
					bytes = bytes.concat(encoder['uint16' as keyof typeof encoder](subTable.reserved) as Array<number>)
					bytes = bytes.concat(encoder['uint32' as keyof typeof encoder](subTable.length) as Array<number>)
					bytes = bytes.concat(encoder['uint32' as keyof typeof encoder](subTable.language) as Array<number>)
					bytes = bytes.concat(encoder['uint32' as keyof typeof encoder](subTable.groupCount) as Array<number>)
					for (let i = 0; i < subTable.groupCount; i++) {
						bytes = bytes.concat(encoder['uint32' as keyof typeof encoder](subTable.groups.startCharCode) as Array<number>)
						bytes = bytes.concat(encoder['uint32' as keyof typeof encoder](subTable.groups.endCharCode) as Array<number>)
						bytes = bytes.concat(encoder['uint32' as keyof typeof encoder](subTable.groups.startGlyphId) as Array<number>)
					}
				}
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
	createTable,
}

export type {
	ICmapTable,
}