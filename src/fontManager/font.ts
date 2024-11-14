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
import { createTable as createNameTable } from './tables/name'
import { createTable as createCffTable } from './tables/cff'
import { computeCheckSum } from './utils'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

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
const createFont = (characters: Array<ICharacter>, options: IOption) => {
	const fontNames = {
		fontFamily: {en: options.familyName || ' '},
		fontSubfamily: {en: options.styleName || ' '},
		fullName: {en: options.fullName || options.familyName + ' ' + options.styleName},
		postScriptName: {en: options.postScriptName || (options.familyName + options.styleName).replace(/\s/g, '')},
		designer: {en: options.designer || ' '},
		designerURL: {en: options.designerURL || ' '},
		manufacturer: {en: options.manufacturer || ' '},
		manufacturerURL: {en: options.manufacturerURL || ' '},
		license: {en: options.license || ' '},
		licenseURL: {en: options.licenseURL || ' '},
		version: {en: options.version || 'Version 0.1'},
		description: {en: options.description || ' '},
		copyright: {en: options.copyright || ' '},
		trademark: {en: options.trademark || ' '}
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

	for (let i = 0; i < characters.length; i += 1) {
		const character = characters[i]
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
		if (unicode === 0) continue
		const metrics = getMetrics(character)
		xMins.push(metrics.xMin)
		yMins.push(metrics.yMin)
		xMaxs.push(metrics.xMax)
		yMaxs.push(metrics.yMax)
		leftSideBearings.push(metrics.leftSideBearing)
		rightSideBearings.push(metrics.rightSideBearing)
		advanceWidths.push(character.advanceWidth)
	}

	const globals = {
		xMin: Math.min.apply(null, xMins),
		yMin: Math.min.apply(null, yMins),
		xMax: Math.max.apply(null, xMaxs),
		yMax: Math.max.apply(null, yMaxs),
		advanceWidthMax: Math.max.apply(null, advanceWidths as Array<number>),
		advanceWidthAvg: average(advanceWidths as Array<number>),
		minLeftSideBearing: Math.min.apply(null, leftSideBearings),
		maxLeftSideBearing: Math.max.apply(null, leftSideBearings),
		minRightSideBearing: Math.min.apply(null, rightSideBearings),
		ascender: options.ascender,
		descender: options.descender,
	}

	// 定义head表
	// define head table
	const headTable = {
		majorVersion: 0x0001,
		minorVersion: 0x0000,
		fontRevision: 0x00010000,
		checkSumAdjustment: 0,
		magicNumber: 0x5F0F3CF5,
		flags: 3,
		unitsPerEm: options.unitsPerEm,
		created: options.createdTimestamp || Date.now() / 1000,
		modified: Date.now() / 1000,
		xMin: globals.xMin,
		yMin: globals.yMin,
		xMax: globals.xMax,
		yMax: globals.yMax,
		macStyle: 0,
		lowestRecPPEM: 3,
		fontDirectionHint: 2,
		indexToLocFormat: 0,
		glyphDataFormat: 0,
	}

	// 定义hhea表
	// define hhea table
	const hheaTable = {
		majorVersion: 0x0001,
		minorVersion: 0x0000,
		ascender: options.ascender,
		descender: options.descender,
		lineGap: 0,
		advanceWidthMax: globals.advanceWidthMax,
		minLeftSideBearing: globals.minLeftSideBearing,
		minRightSideBearing: globals.minRightSideBearing,
		xMaxExtent: globals.maxLeftSideBearing + (globals.xMax - globals.xMin),
		caretSlopeRise: 1,
		caretSlopeRun: 0,
		caretOffset: 0,
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

	// 定义os2表
	// define os2 table
	const os2Table = {
		version: 0x0003,
		xAvgCharWidth: Math.round(globals.advanceWidthAvg),
		usWeightClass: 0,
		usWidthClass: 0,
		fsType: 0,
		ySubscriptXSize: 650,
		ySubscriptYSize: 699,
		ySubscriptXOffset: 0,
		ySubscriptYOffset: 140,
		ySuperscriptXSize: 650,
		ySuperscriptYSize: 699,
		ySuperscriptXOffset: 0,
		ySuperscriptYOffset: 479,
		yStrikeoutSize: 49,
		yStrikeoutPosition: 258,
		sFamilyClass: 0,
		panose: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		ulUnicodeRange1,
		ulUnicodeRange2,
		ulUnicodeRange3,
		ulUnicodeRange4,
		achVendID: 'XXXX',
		fsSelection: 0,
		usFirstCharIndex: firstCharIndex,
		usLastCharIndex: lastCharIndex,
		sTypoAscender: globals.ascender,
		sTypoDescender: globals.descender,
		sTypoLineGap: 0,
		usWinAscent: globals.yMax,
		usWinDescent: Math.abs(globals.yMin),
		ulCodePageRange1: 1,
		ulCodePageRange2: 0,
		sxHeight: metricsForChar(font, 'xyvw', {yMax: Math.round(globals.ascender / 2)}).yMax,
		sCapHeight: metricsForChar(font, 'HIKLEFJMNTZBDPRAGOQSUVWXY', globals).yMax,
		usDefaultChar: hasChar(font, ' ') ? 32 : 0,
		usBreakChar: hasChar(font, ' ') ? 32 : 0,
		usMaxContext: 0,
	}

	// 定义hmtx表
	// define hmtx table
	const hmtxTable: IHmtxTable = {
		hMetrics: [],
	}

	for (let i = 0; i < characters.length; i++) {
		const character = characters[i]
		const advanceWidth = character.advanceWidth || 0
		const leftSideBearing = character.leftSideBearing || 0
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
	const englishFullName = englishFamilyName + ' ' + englishStyleName;
	let postScriptName = getEnglishName('postScriptName');
	if (!postScriptName) {
		postScriptName = (englishFamilyName as string).replace(/\s/g, '') + '-' + englishStyleName;
	}

	const names: any = {}
	for (let n in fontNames) {
		names[n] = fontNames[n as keyof typeof fontNames]
	}

	if (!names.uniqueID) {
		names.uniqueID = {en: getEnglishName('manufacturer') + ':' + englishFullName}
	}

	if (!names.postScriptName) {
		names.postScriptName = {en: postScriptName}
	}

	if (!names.preferredFamily) {
		names.preferredFamily = fontNames.fontFamily
	}

	if (!names.preferredSubfamily) {
		names.preferredSubfamily = fontNames.fontSubfamily
	}

	const languageTags: Array<any> = []
	const nameTable = createNameTable(names, languageTags)

	// 定义post表
	// define post table
	const postTable = {
		version: 0x00030000,
		italicAngle: 0,
		underlinePosition: 0,
		underlineThickness: 0,
		isFixedPitch: 0,
		minMemType42: 0,
		maxMemType42: 0,
		minMemType1: 0,
		maxMemType1: 0,
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
		'OS/2': os2Table,
		'maxp': maxpTable,
		'name': nameTable,
		'post': postTable,
		'cmap': cmapTable,
		'hmtx': hmtxTable,
		'CFF ': cffTable,
	}
	const checkSum = computeCheckSum(createFontData(tables).data)
	headTable.checkSumAdjustment = 0xB1B0AFBA - checkSum

	// 创建字体数据
	// create font data
	const { data: fontData, tables: fontTables, tablesDataMap: fontDataMap } = createFontData(tables)

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