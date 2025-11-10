import type { IFont } from '../font'
import { encoder } from '../encode'
import * as decode from '../decode'

// os2表格式
// os2 table format
interface IOS2Table {
	version: number;
	xAvgCharWidth: number;
	usWeightClass: number;
	usWidthClass: number;
	fsType: number;
	ySubscriptXSize: number;
	ySubscriptYSize: number;
	ySubscriptXOffset: number;
  ySubscriptYOffset: number;
	ySuperscriptXSize: number;
	ySuperscriptYSize: number;
	ySuperscriptXOffset: number;
	ySuperscriptYOffset: number;
	yStrikeoutSize: number;
	yStrikeoutPosition: number;
	sFamilyClass: number;
	panose: Array<number>;
	ulUnicodeRange1: number;
  ulUnicodeRange2: number;
  ulUnicodeRange3: number;
  ulUnicodeRange4: number;
	achVendID: ITag | string;
	fsSelection: number;
	usFirstCharIndex: number;
	usLastCharIndex: number;
	sTypoAscender: number;
	sTypoDescender: number;
	sTypoLineGap: number;
	usWinAscent: number;
	usWinDescent: number;
	ulCodePageRange1?: number;
	ulCodePageRange2?: number;
	sxHeight?: number;
	sCapHeight?: number;
	usDefaultChar?: number;
	usBreakChar?: number;
	usMaxContext?: number;
	usLowerOpticalPointSize?: number;
	usUpperOpticalPointSize?: number;
}

// os2表数据类型
// os2 table data type
const types = {
	version: 'uint16',
	xAvgCharWidth: 'int16',
	usWeightClass: 'uint16',
	usWidthClass: 'uint16',
	fsType: 'uint16',
	ySubscriptXSize: 'int16',
	ySubscriptYSize: 'int16',
	ySubscriptXOffset: 'int16',
  ySubscriptYOffset: 'int16',
	ySuperscriptXSize: 'int16',
	ySuperscriptYSize: 'int16',
	ySuperscriptXOffset: 'int16',
	ySuperscriptYOffset: 'int16',
	yStrikeoutSize: 'int16',
	yStrikeoutPosition: 'int16',
	sFamilyClass: 'int16',
	panose: 'uint8',
	ulUnicodeRange1: 'uint32',
  ulUnicodeRange2: 'uint32',
  ulUnicodeRange3: 'uint32',
  ulUnicodeRange4: 'uint32',
	achVendID: 'Tag',
	fsSelection: 'uint16',
	usFirstCharIndex: 'uint16',
	usLastCharIndex: 'uint16',
	sTypoAscender: 'int16',
	sTypoDescender: 'int16',
	sTypoLineGap: 'int16',
	usWinAscent: 'uint16',
	usWinDescent: 'uint16',
	ulCodePageRange1: 'uint32',
	ulCodePageRange2: 'uint32',
	sxHeight: 'int16',
	sCapHeight: 'int16',
	usDefaultChar: 'uint16',
	usBreakChar: 'uint16',
	usMaxContext: 'uint16',
	usLowerOpticalPointSize: 'uint16',
	usUpperOpticalPointSize: 'uint16',
}

const baseFieldOrder = [
	'version',
	'xAvgCharWidth',
	'usWeightClass',
	'usWidthClass',
	'fsType',
	'ySubscriptXSize',
	'ySubscriptYSize',
	'ySubscriptXOffset',
	'ySubscriptYOffset',
	'ySuperscriptXSize',
	'ySuperscriptYSize',
	'ySuperscriptXOffset',
	'ySuperscriptYOffset',
	'yStrikeoutSize',
	'yStrikeoutPosition',
	'sFamilyClass',
	'panose',
	'ulUnicodeRange1',
	'ulUnicodeRange2',
	'ulUnicodeRange3',
	'ulUnicodeRange4',
	'achVendID',
	'fsSelection',
	'usFirstCharIndex',
	'usLastCharIndex',
	'sTypoAscender',
	'sTypoDescender',
	'sTypoLineGap',
	'usWinAscent',
	'usWinDescent',
] as const

const versionOneFields = ['ulCodePageRange1', 'ulCodePageRange2'] as const
const versionTwoFields = ['sxHeight', 'sCapHeight', 'usDefaultChar', 'usBreakChar', 'usMaxContext'] as const
const versionFiveFields = ['usLowerOpticalPointSize', 'usUpperOpticalPointSize'] as const

// Tag数据类型
// Tag data type
interface ITag {
  tagArr: Array<number>,
  tagStr: string,
}

/**
 * 解析os2表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns IOS2Table对象
 */
/**
 * parse os2 table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns IOS2Table object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	const version = decode.decoder[types['version'] as keyof typeof decode.decoder]() as number
	const xAvgCharWidth = decode.decoder[types['xAvgCharWidth'] as keyof typeof decode.decoder]() as number
	const usWeightClass = decode.decoder[types['usWeightClass'] as keyof typeof decode.decoder]() as number
	const usWidthClass = decode.decoder[types['usWidthClass'] as keyof typeof decode.decoder]() as number
	const fsType = decode.decoder[types['fsType'] as keyof typeof decode.decoder]() as number
	const ySubscriptXSize = decode.decoder[types['ySubscriptXSize'] as keyof typeof decode.decoder]() as number
	const ySubscriptYSize = decode.decoder[types['ySubscriptYSize'] as keyof typeof decode.decoder]() as number
	const ySubscriptXOffset = decode.decoder[types['ySubscriptXOffset'] as keyof typeof decode.decoder]() as number
  const ySubscriptYOffset = decode.decoder[types['ySubscriptYOffset'] as keyof typeof decode.decoder]() as number
	const ySuperscriptXSize = decode.decoder[types['ySuperscriptXSize'] as keyof typeof decode.decoder]() as number
	const ySuperscriptYSize = decode.decoder[types['ySuperscriptYSize'] as keyof typeof decode.decoder]() as number
	const ySuperscriptXOffset = decode.decoder[types['ySuperscriptXOffset'] as keyof typeof decode.decoder]() as number
	const ySuperscriptYOffset = decode.decoder[types['ySuperscriptYOffset'] as keyof typeof decode.decoder]() as number
	const yStrikeoutSize = decode.decoder[types['yStrikeoutSize'] as keyof typeof decode.decoder]() as number
	const yStrikeoutPosition = decode.decoder[types['yStrikeoutPosition'] as keyof typeof decode.decoder]() as number
	const sFamilyClass = decode.decoder[types['sFamilyClass'] as keyof typeof decode.decoder]() as number
	const panose = []
	for (let i = 0; i < 10; i++) {
		panose[i] = decode.decoder[types['panose'] as keyof typeof decode.decoder]() as number
	}
	const ulUnicodeRange1 = decode.decoder[types['ulUnicodeRange1'] as keyof typeof decode.decoder]() as number
  const ulUnicodeRange2 = decode.decoder[types['ulUnicodeRange2'] as keyof typeof decode.decoder]() as number
  const ulUnicodeRange3 = decode.decoder[types['ulUnicodeRange3'] as keyof typeof decode.decoder]() as number
  const ulUnicodeRange4 = decode.decoder[types['ulUnicodeRange4'] as keyof typeof decode.decoder]() as number
	const achVendID: ITag = decode.decoder[types['achVendID'] as keyof typeof decode.decoder]() as ITag
	const fsSelection = decode.decoder[types['fsSelection'] as keyof typeof decode.decoder]() as number
	const usFirstCharIndex = decode.decoder[types['usFirstCharIndex'] as keyof typeof decode.decoder]() as number
	const usLastCharIndex = decode.decoder[types['usLastCharIndex'] as keyof typeof decode.decoder]() as number
	const sTypoAscender = decode.decoder[types['sTypoAscender'] as keyof typeof decode.decoder]() as number
	const sTypoDescender = decode.decoder[types['sTypoDescender'] as keyof typeof decode.decoder]() as number
	const sTypoLineGap = decode.decoder[types['sTypoLineGap'] as keyof typeof decode.decoder]() as number
	const usWinAscent = decode.decoder[types['usWinAscent'] as keyof typeof decode.decoder]() as number
	const usWinDescent = decode.decoder[types['usWinDescent'] as keyof typeof decode.decoder]() as number

	const table: IOS2Table = {
		version,
		xAvgCharWidth,
		usWeightClass,
		usWidthClass,
		fsType,
		ySubscriptXSize,
		ySubscriptYSize,
		ySubscriptXOffset,
		ySubscriptYOffset,
		ySuperscriptXSize,
		ySuperscriptYSize,
		ySuperscriptXOffset,
		ySuperscriptYOffset,
		yStrikeoutSize,
		yStrikeoutPosition,
		sFamilyClass,
		panose,
		ulUnicodeRange1,
		ulUnicodeRange2,
		ulUnicodeRange3,
		ulUnicodeRange4,
		achVendID,
		fsSelection,
		usFirstCharIndex,
		usLastCharIndex,
		sTypoAscender,
		sTypoDescender,
		sTypoLineGap,
		usWinAscent,
		usWinDescent,
	}

	if (version >= 1) {
		table.ulCodePageRange1 = decode.decoder[types['ulCodePageRange1'] as keyof typeof decode.decoder]() as number
		table.ulCodePageRange2 = decode.decoder[types['ulCodePageRange2'] as keyof typeof decode.decoder]() as number
	}

	if (version >= 2) {
		table.sxHeight = decode.decoder[types['sxHeight'] as keyof typeof decode.decoder]() as number
		table.sCapHeight = decode.decoder[types['sCapHeight'] as keyof typeof decode.decoder]() as number
		table.usDefaultChar = decode.decoder[types['usDefaultChar'] as keyof typeof decode.decoder]() as number
		table.usBreakChar = decode.decoder[types['usBreakChar'] as keyof typeof decode.decoder]() as number
		table.usMaxContext = decode.decoder[types['usMaxContext'] as keyof typeof decode.decoder]() as number
	}

	if (version >= 5) {
		table.usLowerOpticalPointSize = decode.decoder[types['usLowerOpticalPointSize'] as keyof typeof decode.decoder]() as number
		table.usUpperOpticalPointSize = decode.decoder[types['usUpperOpticalPointSize'] as keyof typeof decode.decoder]() as number
	}
	decode.end()

	return table
}

/**
 * 根据IOS2Table对象创建该表的原始数据
 * @param table IOS2Table table
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * generate raw data from IHeadTable table
 * @param table IOS2Table table
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (table: IOS2Table) => {
	let data: Array<number> = []

	for (const key of baseFieldOrder) {
		const type = types[key]
		if (key === 'panose') {
			const panose = table.panose || new Array(10).fill(0)
			for (let i = 0; i < panose.length; i++) {
				const bytes = encoder[type as keyof typeof encoder](panose[i])
				if (bytes) {
					data = data.concat(bytes)
				}
			}
			continue
		}
		const value = table[key]
		const bytes = encoder[type as keyof typeof encoder](value)
		if (bytes) {
			data = data.concat(bytes)
		}
	}

	if (table.version >= 1) {
		for (const key of versionOneFields) {
			const value = table[key]
			if (value === undefined) continue
			const type = types[key]
			const bytes = encoder[type as keyof typeof encoder](value)
			if (bytes) {
				data = data.concat(bytes)
			}
		}
	}

	if (table.version >= 2) {
		for (const key of versionTwoFields) {
			const value = table[key]
			if (value === undefined) continue
			const type = types[key]
			const bytes = encoder[type as keyof typeof encoder](value)
			if (bytes) {
				data = data.concat(bytes)
			}
		}
	}

	if (table.version >= 5) {
		for (const key of versionFiveFields) {
			const value = table[key]
			if (value === undefined) continue
			const type = types[key]
			const bytes = encoder[type as keyof typeof encoder](value)
			if (bytes) {
				data = data.concat(bytes)
			}
		}
	}
	return data
}

const getPanose = (panose: Array<number>) => {

}

const unicodeRanges = [
	{begin: 0x0000, end: 0x007F}, // Basic Latin
	{begin: 0x0080, end: 0x00FF}, // Latin-1 Supplement
	{begin: 0x0100, end: 0x017F}, // Latin Extended-A
	{begin: 0x0180, end: 0x024F}, // Latin Extended-B
	{begin: 0x0250, end: 0x02AF}, // IPA Extensions
	{begin: 0x02B0, end: 0x02FF}, // Spacing Modifier Letters
	{begin: 0x0300, end: 0x036F}, // Combining Diacritical Marks
	{begin: 0x0370, end: 0x03FF}, // Greek and Coptic
	{begin: 0x2C80, end: 0x2CFF}, // Coptic
	{begin: 0x0400, end: 0x04FF}, // Cyrillic
	{begin: 0x0530, end: 0x058F}, // Armenian
	{begin: 0x0590, end: 0x05FF}, // Hebrew
	{begin: 0xA500, end: 0xA63F}, // Vai
	{begin: 0x0600, end: 0x06FF}, // Arabic
	{begin: 0x07C0, end: 0x07FF}, // NKo
	{begin: 0x0900, end: 0x097F}, // Devanagari
	{begin: 0x0980, end: 0x09FF}, // Bengali
	{begin: 0x0A00, end: 0x0A7F}, // Gurmukhi
	{begin: 0x0A80, end: 0x0AFF}, // Gujarati
	{begin: 0x0B00, end: 0x0B7F}, // Oriya
	{begin: 0x0B80, end: 0x0BFF}, // Tamil
	{begin: 0x0C00, end: 0x0C7F}, // Telugu
	{begin: 0x0C80, end: 0x0CFF}, // Kannada
	{begin: 0x0D00, end: 0x0D7F}, // Malayalam
	{begin: 0x0E00, end: 0x0E7F}, // Thai
	{begin: 0x0E80, end: 0x0EFF}, // Lao
	{begin: 0x10A0, end: 0x10FF}, // Georgian
	{begin: 0x1B00, end: 0x1B7F}, // Balinese
	{begin: 0x1100, end: 0x11FF}, // Hangul Jamo
	{begin: 0x1E00, end: 0x1EFF}, // Latin Extended Additional
	{begin: 0x1F00, end: 0x1FFF}, // Greek Extended
	{begin: 0x2000, end: 0x206F}, // General Punctuation
	{begin: 0x2070, end: 0x209F}, // Superscripts And Subscripts
	{begin: 0x20A0, end: 0x20CF}, // Currency Symbol
	{begin: 0x20D0, end: 0x20FF}, // Combining Diacritical Marks For Symbols
	{begin: 0x2100, end: 0x214F}, // Letterlike Symbols
	{begin: 0x2150, end: 0x218F}, // Number Forms
	{begin: 0x2190, end: 0x21FF}, // Arrows
	{begin: 0x2200, end: 0x22FF}, // Mathematical Operators
	{begin: 0x2300, end: 0x23FF}, // Miscellaneous Technical
	{begin: 0x2400, end: 0x243F}, // Control Pictures
	{begin: 0x2440, end: 0x245F}, // Optical Character Recognition
	{begin: 0x2460, end: 0x24FF}, // Enclosed Alphanumerics
	{begin: 0x2500, end: 0x257F}, // Box Drawing
	{begin: 0x2580, end: 0x259F}, // Block Elements
	{begin: 0x25A0, end: 0x25FF}, // Geometric Shapes
	{begin: 0x2600, end: 0x26FF}, // Miscellaneous Symbols
	{begin: 0x2700, end: 0x27BF}, // Dingbats
	{begin: 0x3000, end: 0x303F}, // CJK Symbols And Punctuation
	{begin: 0x3040, end: 0x309F}, // Hiragana
	{begin: 0x30A0, end: 0x30FF}, // Katakana
	{begin: 0x3100, end: 0x312F}, // Bopomofo
	{begin: 0x3130, end: 0x318F}, // Hangul Compatibility Jamo
	{begin: 0xA840, end: 0xA87F}, // Phags-pa
	{begin: 0x3200, end: 0x32FF}, // Enclosed CJK Letters And Months
	{begin: 0x3300, end: 0x33FF}, // CJK Compatibility
	{begin: 0xAC00, end: 0xD7AF}, // Hangul Syllables
	{begin: 0xD800, end: 0xDFFF}, // Non-Plane 0 *
	{begin: 0x10900, end: 0x1091F}, // Phoenicia
	{begin: 0x4E00, end: 0x9FFF}, // CJK Unified Ideographs
	{begin: 0xE000, end: 0xF8FF}, // Private Use Area (plane 0)
	{begin: 0x31C0, end: 0x31EF}, // CJK Strokes
	{begin: 0xFB00, end: 0xFB4F}, // Alphabetic Presentation Forms
	{begin: 0xFB50, end: 0xFDFF}, // Arabic Presentation Forms-A
	{begin: 0xFE20, end: 0xFE2F}, // Combining Half Marks
	{begin: 0xFE10, end: 0xFE1F}, // Vertical Forms
	{begin: 0xFE50, end: 0xFE6F}, // Small Form Variants
	{begin: 0xFE70, end: 0xFEFF}, // Arabic Presentation Forms-B
	{begin: 0xFF00, end: 0xFFEF}, // Halfwidth And Fullwidth Forms
	{begin: 0xFFF0, end: 0xFFFF}, // Specials
	{begin: 0x0F00, end: 0x0FFF}, // Tibetan
	{begin: 0x0700, end: 0x074F}, // Syriac
	{begin: 0x0780, end: 0x07BF}, // Thaana
	{begin: 0x0D80, end: 0x0DFF}, // Sinhala
	{begin: 0x1000, end: 0x109F}, // Myanmar
	{begin: 0x1200, end: 0x137F}, // Ethiopic
	{begin: 0x13A0, end: 0x13FF}, // Cherokee
	{begin: 0x1400, end: 0x167F}, // Unified Canadian Aboriginal Syllabics
	{begin: 0x1680, end: 0x169F}, // Ogham
	{begin: 0x16A0, end: 0x16FF}, // Runic
	{begin: 0x1780, end: 0x17FF}, // Khmer
	{begin: 0x1800, end: 0x18AF}, // Mongolian
	{begin: 0x2800, end: 0x28FF}, // Braille Patterns
	{begin: 0xA000, end: 0xA48F}, // Yi Syllables
	{begin: 0x1700, end: 0x171F}, // Tagalog
	{begin: 0x10300, end: 0x1032F}, // Old Italic
	{begin: 0x10330, end: 0x1034F}, // Gothic
	{begin: 0x10400, end: 0x1044F}, // Deseret
	{begin: 0x1D000, end: 0x1D0FF}, // Byzantine Musical Symbols
	{begin: 0x1D400, end: 0x1D7FF}, // Mathematical Alphanumeric Symbols
	{begin: 0xFF000, end: 0xFFFFD}, // Private Use (plane 15)
	{begin: 0xFE00, end: 0xFE0F}, // Variation Selectors
	{begin: 0xE0000, end: 0xE007F}, // Tags
	{begin: 0x1900, end: 0x194F}, // Limbu
	{begin: 0x1950, end: 0x197F}, // Tai Le
	{begin: 0x1980, end: 0x19DF}, // New Tai Lue
	{begin: 0x1A00, end: 0x1A1F}, // Buginese
	{begin: 0x2C00, end: 0x2C5F}, // Glagolitic
	{begin: 0x2D30, end: 0x2D7F}, // Tifinagh
	{begin: 0x4DC0, end: 0x4DFF}, // Yijing Hexagram Symbols
	{begin: 0xA800, end: 0xA82F}, // Syloti Nagri
	{begin: 0x10000, end: 0x1007F}, // Linear B Syllabary
	{begin: 0x10140, end: 0x1018F}, // Ancient Greek Numbers
	{begin: 0x10380, end: 0x1039F}, // Ugaritic
	{begin: 0x103A0, end: 0x103DF}, // Old Persian
	{begin: 0x10450, end: 0x1047F}, // Shavian
	{begin: 0x10480, end: 0x104AF}, // Osmanya
	{begin: 0x10800, end: 0x1083F}, // Cypriot Syllabary
	{begin: 0x10A00, end: 0x10A5F}, // Kharoshthi
	{begin: 0x1D300, end: 0x1D35F}, // Tai Xuan Jing Symbols
	{begin: 0x12000, end: 0x123FF}, // Cuneiform
	{begin: 0x1D360, end: 0x1D37F}, // Counting Rod Numerals
	{begin: 0x1B80, end: 0x1BBF}, // Sundanese
	{begin: 0x1C00, end: 0x1C4F}, // Lepcha
	{begin: 0x1C50, end: 0x1C7F}, // Ol Chiki
	{begin: 0xA880, end: 0xA8DF}, // Saurashtra
	{begin: 0xA900, end: 0xA92F}, // Kayah Li
	{begin: 0xA930, end: 0xA95F}, // Rejang
	{begin: 0xAA00, end: 0xAA5F}, // Cham
	{begin: 0x10190, end: 0x101CF}, // Ancient Symbols
	{begin: 0x101D0, end: 0x101FF}, // Phaistos Disc
	{begin: 0x102A0, end: 0x102DF}, // Carian
	{begin: 0x1F030, end: 0x1F09F}  // Domino Tiles
]

const getUnicodeRange = (unicode: number) => {
	for (let i = 0; i < unicodeRanges.length; i += 1) {
		const range = unicodeRanges[i]
		if (unicode >= range.begin && unicode < range.end) {
			return i
		}
	}

	return -1
}

export {
	parse,
	create,
	getPanose,
	getUnicodeRange,
}

export type {
	IOS2Table,
}