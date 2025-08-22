import type { ICharacter } from './character'
import type { ITable } from './table'
import { getUnicodeRange } from './tables/os_2'
import { getMetrics } from './character'
import type { IHeadTable } from './tables/head'
import type { IHheaTable } from './tables/hhea'
import type { IOS2Table } from './tables/os_2'
import type { IMaxpTable } from './tables/maxp'
import type { INameTable } from './tables/name'
import type { IPostTable } from './tables/post'
import type { ICmapTable } from './tables/cmap'
import type { IHmtxTable } from './tables/hmtx'
import type { IGlyfTable } from './tables/glyf'
import type { ILocaTable } from './tables/loca'
import type { ICffTable } from './tables/cff'
import { create as createFontData, parse as parseFontData } from './tables/sfnt'
import { createTable as createCmapTable } from './tables/cmap'
import { createTable as createNameTable, nameTableNames, createTable2 as createNameTable2 } from './tables/name'
import { createTable as createCffTable } from './tables/cff'
import { computeCheckSum, hasChineseChar, isChineseChar } from './utils'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { convertToPinyin } from 'tiny-pinyin'
import { encoder } from './encode'
import { loaded, total, loading } from '../fontEditor/stores/global'

// font对象数据类型
// font object data type
interface IFont {
  characters: Array<ICharacter>;
	settings: ISettings;
	tableConfig?: ITableConfig;
	tables?: Array<ITable>;
	rawData?: DataView;
	bytes?: Array<number>;
	buffer?: ArrayBuffer;
	checksum?: number;
}

// font settings 数据类型
// font settings data type
interface ISettings {
	numGlyphs?: number;
	numberOfHMetrics?: number;
	indexToLocFormat?: number;
	gsubrs?: Array<any>;
	gsubrsBias?: number;
	defaultWidthX?: number;
	nominalWidthX?: number;
	isCIDFont?: boolean;
	subrs?: Array<any>;
	subrsBias?: number;
	unitsPerEm?: number;
	ascender?: number;
	descender?: number;
}

// table config对象数据类型，包含每个表的基础信息
// table config data type which contains basic info of each table
interface ITableConfig {
	sfntVersion: number | string;
	numTables: number;
	searchRange: number;
	entrySelector: number;
	rangeShift: number;
}

// font option 配置信息数据类型
// font option data type
interface IOption {
	familyName: string;
	styleName?: string;
	fullName?: string;
	postScriptName?: string;
	designer?: string;
	designerURL?: string;
	manufacturer?: string;
	manufacturerURL?: string;
	license?: string;
	licenseURL?: string;
	version?: string;
	description?: string;
	copyright?: string;
	trademark?: string;
	unitsPerEm: number;
	ascender: number;
	descender: number;
	createdTimestamp?: number;
	tables?: any;
}

const average = (vs: Array<number>) => {
	let sum = 0
	for (let i = 0; i < vs.length; i += 1) {
		sum += vs[i]
	}

	return sum / vs.length
}

/**
 * 解析字体
 * @param buffer 包含字体信息的ArrayBuffur
 * @returns font对象
 */
/**
 * parse font data
 * @param buffer ArrayBuffur for font data
 * @returns font object
 */
const parseFont = (buffer: ArrayBuffer) => {
	const data = new DataView(buffer)
	const font: IFont = {
		characters: [],
		settings: {},
		rawData: data,
		buffer,
		tables: []
	}
	return parseFontData(data, font)
}

/**
 * 创建字体
 * @param characters 包含每个字符信息的数组
 * @param options 配置选项
 * @returns font对象
 */
/**
 * create font
 * @param characters characters array contain info of each character
 * @param options font options
 * @returns font object
 */
const createFont = async (characters: Array<ICharacter>, options: IOption) => {
	let enName = ''
	for(let i = 0; i < options.familyName.length; i++) {
		const charcode = options.familyName[i].charCodeAt(0)
		if (!(charcode >= 0x21 && charcode <= 0x7E)) {
			enName += `${charcode}`
		} else {
			enName += `${options.familyName[i]}`
		}
	}

	if (hasChineseChar(options.familyName)) {
		enName = convertToPinyin(options.familyName)
	}

	const fontNames = {
		fontFamily: {
			en: options.familyName || ' ',
			zh: options.familyName || ' ',
		},
		fontSubfamily: {
			en: 'Regular',//options.styleName || ' ',
			zh: '常规体',//options.styleName || ' ',
		},
		fullName: {
			en: options.fullName || options.familyName + ' ' + options.styleName,
			zh: options.fullName || options.familyName + ' ' + '常规体',//options.styleName
		},
		//postScriptName: {en: options.postScriptName || (options.familyName + options.styleName).replace(/\s/g, '')},
		postScriptName: {
			en: options.postScriptName || (enName + '-' + options.styleName).replace(/\s/g, '').slice(0, 63),
			zh: options.postScriptName || (enName + '-' + options.styleName).replace(/\s/g, '').slice(0, 63),
		},
		designer: {
			en: options.designer || ' ',
			zh: options.designer || ' ',
		},
		designerURL: {
			en: options.designerURL || ' ',
			zh: options.designerURL || ' ',
		},
		manufacturer: {
			en: options.manufacturer || ' ',
			zh: options.manufacturer || ' ',
		},
		manufacturerURL: {
			en: options.manufacturerURL || ' ',
			zh: options.manufacturerURL || ' ',
		},
		license: {
			en: options.license || ' ',
			zh: options.license || ' ',
		},
		licenseURL: {
			en: options.licenseURL || ' ',
			zh: options.licenseURL || ' ',
		},
		version: {
			en: options.version || 'Version 1.0',
			zh: options.version || 'Version 1.0',
		},
		description: {
			en: options.description || ' ',
			zh: options.description || ' ',
		},
		copyright: {
			en: options.copyright || ' ',
			zh: options.copyright || ' ',
		},
		trademark: {
			en: options.trademark || ' ',
			zh: options.trademark || ' ',
		}
	}

	const name_keys = Object.keys(fontNames)
	for (let i = 0; i < name_keys.length; i++) {
		const enName = fontNames[name_keys[i]].en
		if (hasChineseChar(enName)) {
			fontNames[name_keys[i]].en = convertToPinyin(enName)
		}
	}

	// 创建基础font对象
	// create basic font object
	const font: IFont = {
		characters,
		settings: {
			unitsPerEm: options.unitsPerEm || 1000,
			ascender: options.ascender,
			descender: options.descender,
		}
	}

	// 计算一些基础信息
	// compute some basic info
	const xMins = []
	const yMins = []
	const xMaxs = []
	const yMaxs = []
	const advanceWidths = []
	const leftSideBearings = []
	const rightSideBearings = []
	let firstCharIndex
	let lastCharIndex = 0
	let ulUnicodeRange1 = 0
	let ulUnicodeRange2 = 0
	let ulUnicodeRange3 = 0
	let ulUnicodeRange4 = 0
	let m = 0

	const compute = async (): Promise<void> => {
		// 检查是否完成所有字符处理
		if (m >= characters.length) {
			return
		}

		loaded.value++
		if (loaded.value >= total.value) {
			loading.value = false
			loaded.value = 0
			total.value = 0
			return
		}
		const character = characters[m]
		const unicode = character.unicode | 0

		if ((firstCharIndex as number) > unicode || firstCharIndex === undefined) {
			if (unicode > 0) {
				firstCharIndex = unicode
			}
		}

		if (lastCharIndex < unicode) {
			lastCharIndex = unicode
		}

		const position = getUnicodeRange(unicode)
		if (position < 32) {
			ulUnicodeRange1 |= 1 << position;
		} else if (position < 64) {
			ulUnicodeRange2 |= 1 << position - 32;
		} else if (position < 96) {
			ulUnicodeRange3 |= 1 << position - 64;
		} else if (position < 123) {
			ulUnicodeRange4 |= 1 << position - 96;
		} else {
			throw new Error('Unicode ranges bits > 123 are reserved for internal usage');
		}
		//if (unicode === 0) continue
		const metrics = getMetrics(character)
		xMins.push(metrics.xMin)
		yMins.push(metrics.yMin)
		xMaxs.push(metrics.xMax)
		yMaxs.push(metrics.yMax)
		leftSideBearings.push(metrics.leftSideBearing)
		rightSideBearings.push(metrics.rightSideBearing)
		advanceWidths.push(character.advanceWidth)
		character.xMin = metrics.xMin
		character.xMax = metrics.xMax
		character.yMin = metrics.yMin
		character.yMax = metrics.yMax
		character.rightSideBearing = metrics.rightSideBearing
		character.leftSideBearing = metrics.leftSideBearing

		m++
		// 检查是否还有更多字符需要处理
		if (m < characters.length) {
			if (m % 100 === 0) {
			// 每100个字符后，给UI更多时间更新
			await new Promise(resolve => setTimeout(resolve, 0))
			}
			// 继续处理下一个字符
			return compute()
		}
	}

	await compute()

	const globals = {
		xMin: Math.min.apply(null, xMins),
		yMin: Math.min.apply(null, yMins),
		xMax: Math.max.apply(null, xMaxs),
		yMax: Math.max.apply(null, yMaxs),
		advanceWidthMax: Math.max.apply(null, advanceWidths as Array<number>),
		advanceWidthAvg: advanceWidths.reduce((a, b) => a + b, 0) / advanceWidths.length,
		minLeftSideBearing: Math.min.apply(null, leftSideBearings),
		maxLeftSideBearing: Math.max.apply(null, leftSideBearings),
		minRightSideBearing: Math.min.apply(null, rightSideBearings),
		ascender: options.ascender,
		descender: options.descender,
	}

	// 精确设置Unicode范围位，避免设置不包含字符的范围
	// 重新计算Unicode范围位，只包含实际存在的字符
	ulUnicodeRange1 = 0
	ulUnicodeRange2 = 0
	ulUnicodeRange3 = 0
	ulUnicodeRange4 = 0
	
	// 只对实际存在的字符设置Unicode范围位
	for (let i = 0; i < characters.length; i++) {
		const character = characters[i]
		const unicode = character.unicode | 0
		if (unicode === 0) continue // 跳过.notdef字符
		
		const position = getUnicodeRange(unicode)
		if (position < 32) {
			ulUnicodeRange1 |= 1 << position;
		} else if (position < 64) {
			ulUnicodeRange2 |= 1 << position - 32;
		} else if (position < 96) {
			ulUnicodeRange3 |= 1 << position - 64;
		} else if (position < 123) {
			ulUnicodeRange4 |= 1 << position - 96;
		}
	}
	
	const _headTable = options.tables ? options.tables.head : {}
	const convertToFlags = (flags: Array<boolean>) => {
		let _flags = 0
		for (let i = 0; i < flags.length; i++) {
			if (flags[i]) {
				_flags += Math.pow(2, i)
			}
		}
		return _flags
	}
	const convertToMacStyle = (macStyle: Array<number>) => {
		let _macStyle = 0
		for (let i = 0; i < macStyle.length; i++) {
			if (macStyle[i]) {
				_macStyle += Math.pow(2, i)
			}
		}
		return _macStyle
	}

	// 定义head表
	// define head table
	const headTable = {
		majorVersion: _headTable.majorVersion || 0x0001,
		minorVersion: _headTable.minorVersion || 0x0000,
		fontRevision: _headTable.fontRevision || 0x00010000,
		checkSumAdjustment: 0,
		magicNumber: 0x5F0F3CF5,
		flags: _headTable.flags ? convertToFlags(_headTable.flags) : 3,
		unitsPerEm: options.unitsPerEm,
		created: _headTable.created?.timestamp || Math.floor(options.createdTimestamp || Date.now() / 1000) + 2082844800,
		modified: _headTable.modified?.timestamp || Math.floor(Date.now() / 1000) + 2082844800,
		xMin: 0,//globals.xMin,
		yMin: -200,//globals.yMin,
		xMax: 1000,//globals.xMax,
		yMax: 800,//globals.yMax,
		macStyle: _headTable.macStyle ? convertToMacStyle(_headTable.macStyle) : 0,
		lowestRecPPEM: _headTable.lowestRecPPEM || 7,
		fontDirectionHint: _headTable.fontDirectionHint || 2,
		indexToLocFormat: 0,
		glyphDataFormat: 0,
	}

	const _hheaTable = options.tables ? options.tables.hhea : {}

	// 定义hhea表
	// define hhea table
	const hheaTable = {
		majorVersion: _hheaTable.majorVersion || 0x0001,
		minorVersion: _hheaTable.minorVersion || 0x0000,
		ascender: options.ascender,
		descender: options.descender,
		lineGap: _hheaTable.lineGap || 0,
		advanceWidthMax: globals.advanceWidthMax,
		minLeftSideBearing: globals.minLeftSideBearing,
		minRightSideBearing: globals.minRightSideBearing,
		xMaxExtent: globals.maxLeftSideBearing + (globals.xMax - globals.xMin),
		caretSlopeRise: _hheaTable.caretSlopeRise || 1,
		caretSlopeRun: _hheaTable.caretSlopeRun || 0,
		caretOffset: _hheaTable.caretOffset || 0,
		reserved0: 0,
		reserved1: 0,
		reserved2: 0,
		reserved3: 0,
		metricDataFormat: 0,
		numberOfHMetrics: characters.length
	}

	// 定义maxp表
	// define maxp table
	const maxpTable = {
		version: 0x00005000,
		numGlyphs: characters.length,
	}

	const _os2Table = options.tables ? options.tables.os2 : {}
	const convertToFsSelection = (fsSelection: Array<boolean>) => {
		let _fsSelection = 0
		for (let i = 0; i < fsSelection.length; i++) {
			if (fsSelection[i]) {
				_fsSelection += Math.pow(2, i)
			}
		}
		return _fsSelection
	}

	// 定义os2表
	// define os2 table
	const os2Table = {
		version: 0x0005,
		xAvgCharWidth: Math.round(globals.advanceWidthAvg),
		usWeightClass: _os2Table.usWeightClass || 400,
		usWidthClass: _os2Table.usWidthClass || 5,
		fsType: _os2Table.fsType || 0,
		ySubscriptXSize: _os2Table.ySubscriptXSize || 650,
		ySubscriptYSize: _os2Table.ySubscriptYSize || 699,
		ySubscriptXOffset: _os2Table.ySubscriptXOffset || 0,
		ySubscriptYOffset: _os2Table.ySubscriptYOffset || 140,
		ySuperscriptXSize: _os2Table.ySuperscriptXSize || 650,
		ySuperscriptYSize: _os2Table.ySuperscriptYSize || 699,
		ySuperscriptXOffset: _os2Table.ySuperscriptXOffset || 0,
		ySuperscriptYOffset: _os2Table.ySuperscriptYOffset || 479,
		yStrikeoutSize: _os2Table.yStrikeoutSize || 49,
		yStrikeoutPosition: _os2Table.yStrikeoutPosition || 258,
		sFamilyClass: _os2Table.sFamilyClass || 0,
		panose: _os2Table.panose || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		ulUnicodeRange1,
		ulUnicodeRange2,
		ulUnicodeRange3,
		ulUnicodeRange4,
		achVendID: _os2Table.achVendID || 'UKWN',
		fsSelection: _os2Table.fsSelection ? convertToFsSelection(_os2Table.fsSelection) : 64,
		usFirstCharIndex: firstCharIndex,
		usLastCharIndex: lastCharIndex,
		sTypoAscender: globals.ascender,
		sTypoDescender: globals.descender,
		sTypoLineGap: _hheaTable.lineGap || 0,
		usWinAscent: options.ascender || 800,//globals.yMax,
		usWinDescent: -options.descender || 200,//Math.abs(globals.yMin),
		ulCodePageRange1: (1 << 0) | (1 << 18) | (1 << 20),//1,
		ulCodePageRange2: 0,//0,
		sxHeight: metricsForChar(font, 'xyvw', {yMax: Math.round(globals.ascender / 2)}).yMax,
		sCapHeight: metricsForChar(font, 'HIKLEFJMNTZBDPRAGOQSUVWXY', globals).yMax,
		usDefaultChar: hasChar(font, ' ') ? 32 : 0,
		usBreakChar: hasChar(font, ' ') ? 32 : 0,
		usMaxContext: 0,
		usLowerOpticalPointSize: _os2Table.usLowerOpticalPointSize || 8,
		usUpperOpticalPointSize: _os2Table.usUpperOpticalPointSize || 72,
	}

	// 定义hmtx表
	// define hmtx table
	const hmtxTable: IHmtxTable = {
		hMetrics: [],
	}

	for (let i = 0; i < characters.length; i++) {
		const character = characters[i]
		const advanceWidth = character.advanceWidth || 0
		const leftSideBearing = Math.round(character.leftSideBearing || 0)
		hmtxTable.hMetrics.push({
			advanceWidth,
			lsb: leftSideBearing,
		})
	}

	// 定义cmap表
	// define cmap table
	const cmapTable = createCmapTable(characters)

	// 定义name表
	// define name table
	const getEnglishName = (name: string) => {
		const translations = fontNames[name as keyof typeof fontNames]
		if (translations) {
			return translations.en
		}
	}
	const englishFamilyName = getEnglishName('fontFamily')
	const englishStyleName = getEnglishName('fontSubfamily')
	const englishFullName = englishFamilyName + '-' + englishStyleName;
	let postScriptName = getEnglishName('postScriptName');
	if (!postScriptName) {
		postScriptName = (englishFamilyName as string).replace(/\s/g, '') + '-' + englishStyleName;
	}

	const names: any = {}
	for (let n in fontNames) {
		names[n] = fontNames[n as keyof typeof fontNames]
	}

	if (!names.uniqueID) {
		names.uniqueID = { en: englishFullName, zh: englishFullName }//getEnglishName('manufacturer') + ':' + englishFullName}
		// names.uniqueID = {
		// 	en: postScriptName,
		// 	zh: postScriptName,
		// }
	}

	if (!names.postScriptName) {
		names.postScriptName = { en: postScriptName, zh: postScriptName }
	}

	// if (!names.preferredFamily) {
	// 	names.preferredFamily = fontNames.fontFamily
	// }

	// if (!names.preferredSubfamily) {
	// 	names.preferredSubfamily = fontNames.fontSubfamily
	// }

	const languageTags: Array<any> = []
	//const nameTable = createNameTable(names, languageTags)
	const nameTable = options.tables ? createNameTable2(options.tables.name) : createNameTable(names, languageTags)

	const _postTable = options.tables ? options.tables.post : {}

	// 定义post表
	// define post table
	const postTable = {
		version: 0x00030000,
		italicAngle: _postTable.italicAngle || 0,
		underlinePosition: _postTable.underlinePosition || 0,
		underlineThickness: _postTable.underlineThickness || 0,
		isFixedPitch: _postTable.isFixedPitch || 1,
		minMemType42: _postTable.minMemType42 || 0,
		maxMemType42: _postTable.maxMemType42 || 0,
		minMemType1: _postTable.minMemType1 || 0,
		maxMemType1: _postTable.maxMemType1 || 0,
	}

	// 定义cff表
	// define cff table
	const cffTable = createCffTable(characters, {
		version: getEnglishName('version'),
		fullName: englishFullName,
		familyName: englishFamilyName,
		weightName: englishStyleName,
		postScriptName: postScriptName,
		unitsPerEm: font.settings.unitsPerEm,
		fontBBox: [0, globals.yMin, globals.ascender, globals.advanceWidthMax]
	})

	const tables = {
		'head': headTable,
		'hhea': hheaTable,
		'maxp': maxpTable,
		'OS/2': os2Table,
		'name': nameTable,
		'cmap': cmapTable,
		'post': postTable,
		'hmtx': hmtxTable,
		'CFF ': cffTable,
	}
	headTable.checkSumAdjustment = 0x00000000

	let _font = await createFontData(tables, 'checksum')

	const checkSum = _font.checksum
	//const checkSum = computeCheckSum(_font.data)
	headTable.checkSumAdjustment = 0xB1B0AFBA - (checkSum % 0x100000000)
	const checkSumAdjustmentData = encoder.uint32(headTable.checkSumAdjustment)
	
	if (headTable.checkSumAdjustment < 0) {
		headTable.checkSumAdjustment = (headTable.checkSumAdjustment + 0x100000000) % 0x100000000
	}

	const { data: fontData, tables: fontTables, tablesDataMap: fontDataMap } = _font

	fontData[164] = checkSumAdjustmentData[0]
	fontData[165] = checkSumAdjustmentData[1]
	fontData[166] = checkSumAdjustmentData[2]
	fontData[167] = checkSumAdjustmentData[3]

	// 创建字体数据
	// create font data
	font.bytes = fontData

	const keys = Object.keys(tables)
	keys.sort((key1, key2) => {
		if (key1 > key2) {
			return 1
		} else {
			return -1
		}
	})
	font.tables = fontTables
	return font
}

/**
 * 将字体数据转换为ArrayBuffer格式
 * @param font 字体对象
 * @returns buffer
 */
/**
 * convert font data to ArrayBuffer
 * @param font font object
 * @returns buffer
 */
const toArrayBuffer = (font: IFont) => {
	if (font.bytes) {
    const buffer = new ArrayBuffer(font.bytes.length)
    const intArray = new Uint8Array(buffer)
    for (let i = 0; i < font.bytes.length; i++) {
      intArray[i] = font.bytes[i]
    }

    return buffer
	} else if (font.rawData) {
		return font.rawData.buffer
	}
}

const metricsForChar = (font: IFont, chars: string, notFoundMetrics: any) => {
	for (let i = 0; i < chars.length; i += 1) {
		const index: number = getCharacterIndex(font, chars[i]);
		if (index > 0) {
			const character = font.characters[index]
			return getMetrics(character)
		}
	}

	return notFoundMetrics
}

const getCharacterIndex = (font: IFont, char: string) => {
	const code = char.codePointAt(0)
    const characters = font.characters
    if (characters) {
			for (let i = 0; i < characters.length; i ++) {
				const character = characters[i]
				if (character.unicode === code) return i
			}
    }
    return -1
}

const hasChar = (font: IFont, char: string) => {
	return getCharacterIndex(font, char) !== -1
}

export {
	parseFont,
	createFont,
	toArrayBuffer,
	hasChar,
}

export type {
	IFont,
	ISettings,
	ITableConfig,
	IOption,
}