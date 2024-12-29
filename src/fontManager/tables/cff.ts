import type { IFont } from '../font'
import type { ILine, ICubicBezierCurve, IPoint, ICharacter, IQuadraticBezierCurve } from '../character'
import { PathType } from '../character'
import { encoder } from '../encode'
import * as decode from '../decode'
import * as R from 'ramda'
import { loaded, total, loading } from '../../fontEditor/stores/global'

// cff表格式
// cff table format
interface ICffTable {
	header: IHeader;
	nameIndex: INameIndex;
	topDictIndex?: ITopDictIndex;
	stringIndex?: IStringIndex;
	globalSubrIndex: IGlobalSubrIndex;
	encodings?: IEncodings;
	charsets?: ICharSets;
	charStringIndex?: ICharStringIndex;
	topDict: any;
	glyphTables?: Array<IGlyphTable>;
}

// cff数据类型
// cff table data type
const types = {
	major: 'Card8',
	minor: 'Card8',
	hdrSize: 'Card8',
	offSize: 'Card8',
}

interface IGlyphTable {
	numberOfContours: number;
	contours: Array<Array<ILine | ICubicBezierCurve | IQuadraticBezierCurve>>;
	commands?: Array<any>;
	advanceWidth: number;
}

interface IHeader {
	major: number;
	minor: number;
	hdrSize: number;
	offSize: number;
}

interface INameIndex {
	index?: IIndex;
	data: Array<any>;
}

interface ITopDictIndex {
	index?: IIndex;
	data: Array<any>;
}

interface IStringIndex {
	index?: IIndex;
	data: Array<any>;
}

interface IGlobalSubrIndex {
	index?: IIndex;
	data: Array<any>;
}

interface IEncodings {
	format: number;
	nCodes?: number;
	code?: Array<number>;
	nRanges?: number;
	Range1?: Array<any>;
	nSups?: number;
	supplement?: Array<any>;
}

// interface ICharSets {
// 	format: number;
// 	glyphs?: Array<any>;
// 	Range1?: Array<any>;
// 	Range2?: Array<any>;
// }
interface ICharSets {
	format: number;
	data: Array<string>;
}


interface ICharStringIndex {
	index?: IIndex;
	data: Array<any>;
}

interface IIndex {
	count: number;
	offSize: number;
	offset: Array<number | bigint>;
	data: Array<any>;
}

const TOP_DICT_META = [
	{name: 'ros', op: 1230, type: ['SID', 'SID', 'number']},
	{name: 'version', op: 0, type: 'SID'},
	{name: 'notice', op: 1, type: 'SID'},
	{name: 'copyright', op: 1200, type: 'SID'},
	{name: 'fullName', op: 2, type: 'SID'},
	{name: 'familyName', op: 3, type: 'SID'},
	{name: 'weight', op: 4, type: 'SID'},
	{name: 'isFixedPitch', op: 1201, type: 'number', value: 0},
	{name: 'italicAngle', op: 1202, type: 'number', value: 0},
	{name: 'underlinePosition', op: 1203, type: 'number', value: -100},
	{name: 'underlineThickness', op: 1204, type: 'number', value: 50},
	{name: 'paintType', op: 1205, type: 'number', value: 0},
	{name: 'charstringType', op: 1206, type: 'number', value: 2},
	{
		name: 'fontMatrix',
		op: 1207,
		type: ['real', 'real', 'real', 'real', 'real', 'real'],
		value: [0.001, 0, 0, 0.001, 0, 0]
	},
	{name: 'uniqueId', op: 13, type: 'number'},
	{name: 'fontBBox', op: 5, type: ['number', 'number', 'number', 'number'], value: [0, 0, 0, 0]},
	{name: 'strokeWidth', op: 1208, type: 'number', value: 0},
	{name: 'xuid', op: 14, type: [], value: null},
	{name: 'charset', op: 15, type: 'offset', value: 0},
	{name: 'encoding', op: 16, type: 'offset' },
	{name: 'charStrings', op: 17, type: 'offset', value: 0},
	{name: 'private', op: 18, type: ['number', 'offset']},
	{name: 'cidFontVersion', op: 1231, type: 'number', value: 0},
	{name: 'cidFontRevision', op: 1232, type: 'number', value: 0},
	{name: 'cidFontType', op: 1233, type: 'number', value: 0},
	{name: 'cidCount', op: 1234, type: 'number', value: 8720},
	{name: 'uidBase', op: 1235, type: 'number'},
	{name: 'fdArray', op: 1236, type: 'offset'},
	{name: 'fdSelect', op: 1237, type: 'offset'},
	{name: 'fontName', op: 1238, type: 'SID'}
]

const FONT_DICT_META = [
	{name: 'ros', op: 1230, type: ['SID', 'SID', 'number']},
	{name: 'version', op: 0, type: 'SID'},
	{name: 'notice', op: 1, type: 'SID'},
	{name: 'copyright', op: 1200, type: 'SID'},
	{name: 'fullName', op: 2, type: 'SID'},
	{name: 'familyName', op: 3, type: 'SID'},
	{name: 'weight', op: 4, type: 'SID'},
	{name: 'isFixedPitch', op: 1201, type: 'number' },
	{name: 'italicAngle', op: 1202, type: 'number' },
	{name: 'underlinePosition', op: 1203, type: 'number' },
	{name: 'underlineThickness', op: 1204, type: 'number' },
	{name: 'paintType', op: 1205, type: 'number' },
	{name: 'charstringType', op: 1206, type: 'number' },
	{
		name: 'fontMatrix',
		op: 1207,
		type: ['real', 'real', 'real', 'real', 'real', 'real']
	},
	{name: 'uniqueId', op: 13, type: 'number'},
	{name: 'fontBBox', op: 5, type: ['number', 'number', 'number', 'number'] },
	{name: 'strokeWidth', op: 1208, type: 'number' },
	{name: 'xuid', op: 14, type: [] },
	{name: 'charset', op: 15, type: 'offset' },
	{name: 'encoding', op: 16, type: 'offset' },
	{name: 'charStrings', op: 17, type: 'offset' },
	{name: 'fontName', op: 1238, type: 'SID'},
	{name: 'private', op: 18, type: ['number', 'offset']},
	{name: 'cidFontVersion', op: 1231, type: 'number' },
	{name: 'cidFontRevision', op: 1232, type: 'number' },
	{name: 'cidFontType', op: 1233, type: 'number' },
	{name: 'cidCount', op: 1234, type: 'number' },
	{name: 'uidBase', op: 1235, type: 'number'},
	{name: 'fdArray', op: 1236, type: 'offset'},
	{name: 'fdSelect', op: 1237, type: 'offset'},
]

const PRIVATE_DICT_META = [
	{ name: 'BlueValues', op: 6, type: ['number', 'number', 'number', 'number'] },
	{ name: 'OtherBlues', op: 7, type: ['number', 'number'] },
	{ name: 'FamilyBlues', op: 8, type: 'array' },
	{ name: 'FamilyOtherBlues', op: 9, type: 'array' },
	{ name: 'BlueScale', op: 1209, type: 'real' },
	{ name: 'BlueShift', op: 1210, type: 'number' },
	{ name: 'BlueFuzz', op: 1211, type: 'number' },
	{ name: 'StdHW', op: 10, type: 'number' },
	{ name: 'StdVW', op: 11, type: 'number' },
	{ name: 'StemSnapH', op: 1212, type: 'array' },
	{ name: 'StemSnapV', op: 1213, type: 'array' },
	{ name: 'ForceBold', op: 1214, type: 'number' },
	{ name: 'LanguageGroup', op: 1217, type: 'number' },
	{ name: 'ExpansionFactor', op: 1218, type: 'real' },
	{ name: 'initialRandomSeed', op: 1219, type: 'number' },
	{ name: 'Subrs', op: 19, type: 'offset' },
	{ name: 'defaultWidthX', op: 20, type: 'number' },
	{ name: 'nominalWidthX', op: 21, type: 'number' }
]

const cffStandardStrings = [
	'.notdef', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quoteright',
	'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two',
	'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater',
	'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
	'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore',
	'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
	'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', 'exclamdown', 'cent', 'sterling',
	'fraction', 'yen', 'florin', 'section', 'currency', 'quotesingle', 'quotedblleft', 'guillemotleft',
	'guilsinglleft', 'guilsinglright', 'fi', 'fl', 'endash', 'dagger', 'daggerdbl', 'periodcentered', 'paragraph',
	'bullet', 'quotesinglbase', 'quotedblbase', 'quotedblright', 'guillemotright', 'ellipsis', 'perthousand',
	'questiondown', 'grave', 'acute', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent', 'dieresis', 'ring',
	'cedilla', 'hungarumlaut', 'ogonek', 'caron', 'emdash', 'AE', 'ordfeminine', 'Lslash', 'Oslash', 'OE',
	'ordmasculine', 'ae', 'dotlessi', 'lslash', 'oslash', 'oe', 'germandbls', 'onesuperior', 'logicalnot', 'mu',
	'trademark', 'Eth', 'onehalf', 'plusminus', 'Thorn', 'onequarter', 'divide', 'brokenbar', 'degree', 'thorn',
	'threequarters', 'twosuperior', 'registered', 'minus', 'eth', 'multiply', 'threesuperior', 'copyright',
	'Aacute', 'Acircumflex', 'Adieresis', 'Agrave', 'Aring', 'Atilde', 'Ccedilla', 'Eacute', 'Ecircumflex',
	'Edieresis', 'Egrave', 'Iacute', 'Icircumflex', 'Idieresis', 'Igrave', 'Ntilde', 'Oacute', 'Ocircumflex',
	'Odieresis', 'Ograve', 'Otilde', 'Scaron', 'Uacute', 'Ucircumflex', 'Udieresis', 'Ugrave', 'Yacute',
	'Ydieresis', 'Zcaron', 'aacute', 'acircumflex', 'adieresis', 'agrave', 'aring', 'atilde', 'ccedilla', 'eacute',
	'ecircumflex', 'edieresis', 'egrave', 'iacute', 'icircumflex', 'idieresis', 'igrave', 'ntilde', 'oacute',
	'ocircumflex', 'odieresis', 'ograve', 'otilde', 'scaron', 'uacute', 'ucircumflex', 'udieresis', 'ugrave',
	'yacute', 'ydieresis', 'zcaron', 'exclamsmall', 'Hungarumlautsmall', 'dollaroldstyle', 'dollarsuperior',
	'ampersandsmall', 'Acutesmall', 'parenleftsuperior', 'parenrightsuperior', '266 ff', 'onedotenleader',
	'zerooldstyle', 'oneoldstyle', 'twooldstyle', 'threeoldstyle', 'fouroldstyle', 'fiveoldstyle', 'sixoldstyle',
	'sevenoldstyle', 'eightoldstyle', 'nineoldstyle', 'commasuperior', 'threequartersemdash', 'periodsuperior',
	'questionsmall', 'asuperior', 'bsuperior', 'centsuperior', 'dsuperior', 'esuperior', 'isuperior', 'lsuperior',
	'msuperior', 'nsuperior', 'osuperior', 'rsuperior', 'ssuperior', 'tsuperior', 'ff', 'ffi', 'ffl',
	'parenleftinferior', 'parenrightinferior', 'Circumflexsmall', 'hyphensuperior', 'Gravesmall', 'Asmall',
	'Bsmall', 'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall', 'Hsmall', 'Ismall', 'Jsmall', 'Ksmall', 'Lsmall',
	'Msmall', 'Nsmall', 'Osmall', 'Psmall', 'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall', 'Vsmall', 'Wsmall',
	'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary', 'onefitted', 'rupiah', 'Tildesmall', 'exclamdownsmall',
	'centoldstyle', 'Lslashsmall', 'Scaronsmall', 'Zcaronsmall', 'Dieresissmall', 'Brevesmall', 'Caronsmall',
	'Dotaccentsmall', 'Macronsmall', 'figuredash', 'hypheninferior', 'Ogoneksmall', 'Ringsmall', 'Cedillasmall',
	'questiondownsmall', 'oneeighth', 'threeeighths', 'fiveeighths', 'seveneighths', 'onethird', 'twothirds',
	'zerosuperior', 'foursuperior', 'fivesuperior', 'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior',
	'zeroinferior', 'oneinferior', 'twoinferior', 'threeinferior', 'fourinferior', 'fiveinferior', 'sixinferior',
	'seveninferior', 'eightinferior', 'nineinferior', 'centinferior', 'dollarinferior', 'periodinferior',
	'commainferior', 'Agravesmall', 'Aacutesmall', 'Acircumflexsmall', 'Atildesmall', 'Adieresissmall',
	'Aringsmall', 'AEsmall', 'Ccedillasmall', 'Egravesmall', 'Eacutesmall', 'Ecircumflexsmall', 'Edieresissmall',
	'Igravesmall', 'Iacutesmall', 'Icircumflexsmall', 'Idieresissmall', 'Ethsmall', 'Ntildesmall', 'Ogravesmall',
	'Oacutesmall', 'Ocircumflexsmall', 'Otildesmall', 'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall',
	'Uacutesmall', 'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall', 'Thornsmall', 'Ydieresissmall', '001.000',
	'001.001', '001.002', '001.003', 'Black', 'Bold', 'Book', 'Light', 'Medium', 'Regular', 'Roman', 'Semibold']

const cffStandardEncoding = [
	'', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
	'', '', '', '', 'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quoteright',
	'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash', 'zero', 'one', 'two',
	'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater',
	'question', 'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
	'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore',
	'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
	'u', 'v', 'w', 'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', '', '', '', '', '', '', '', '',
	'', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
	'exclamdown', 'cent', 'sterling', 'fraction', 'yen', 'florin', 'section', 'currency', 'quotesingle',
	'quotedblleft', 'guillemotleft', 'guilsinglleft', 'guilsinglright', 'fi', 'fl', '', 'endash', 'dagger',
	'daggerdbl', 'periodcentered', '', 'paragraph', 'bullet', 'quotesinglbase', 'quotedblbase', 'quotedblright',
	'guillemotright', 'ellipsis', 'perthousand', '', 'questiondown', '', 'grave', 'acute', 'circumflex', 'tilde',
	'macron', 'breve', 'dotaccent', 'dieresis', '', 'ring', 'cedilla', '', 'hungarumlaut', 'ogonek', 'caron',
	'emdash', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'AE', '', 'ordfeminine', '', '', '',
	'', 'Lslash', 'Oslash', 'OE', 'ordmasculine', '', '', '', '', '', 'ae', '', '', '', 'dotlessi', '', '',
	'lslash', 'oslash', 'oe', 'germandbls']

const cffExpertEncoding = [
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', 'space', 'exclamsmall', 'Hungarumlautsmall', '', 'dollaroldstyle', 'dollarsuperior',
    'ampersandsmall', 'Acutesmall', 'parenleftsuperior', 'parenrightsuperior', 'twodotenleader', 'onedotenleader',
    'comma', 'hyphen', 'period', 'fraction', 'zerooldstyle', 'oneoldstyle', 'twooldstyle', 'threeoldstyle',
    'fouroldstyle', 'fiveoldstyle', 'sixoldstyle', 'sevenoldstyle', 'eightoldstyle', 'nineoldstyle', 'colon',
    'semicolon', 'commasuperior', 'threequartersemdash', 'periodsuperior', 'questionsmall', '', 'asuperior',
    'bsuperior', 'centsuperior', 'dsuperior', 'esuperior', '', '', 'isuperior', '', '', 'lsuperior', 'msuperior',
    'nsuperior', 'osuperior', '', '', 'rsuperior', 'ssuperior', 'tsuperior', '', 'ff', 'fi', 'fl', 'ffi', 'ffl',
    'parenleftinferior', '', 'parenrightinferior', 'Circumflexsmall', 'hyphensuperior', 'Gravesmall', 'Asmall',
    'Bsmall', 'Csmall', 'Dsmall', 'Esmall', 'Fsmall', 'Gsmall', 'Hsmall', 'Ismall', 'Jsmall', 'Ksmall', 'Lsmall',
    'Msmall', 'Nsmall', 'Osmall', 'Psmall', 'Qsmall', 'Rsmall', 'Ssmall', 'Tsmall', 'Usmall', 'Vsmall', 'Wsmall',
    'Xsmall', 'Ysmall', 'Zsmall', 'colonmonetary', 'onefitted', 'rupiah', 'Tildesmall', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'exclamdownsmall', 'centoldstyle', 'Lslashsmall', '', '', 'Scaronsmall', 'Zcaronsmall', 'Dieresissmall',
    'Brevesmall', 'Caronsmall', '', 'Dotaccentsmall', '', '', 'Macronsmall', '', '', 'figuredash', 'hypheninferior',
    '', '', 'Ogoneksmall', 'Ringsmall', 'Cedillasmall', '', '', '', 'onequarter', 'onehalf', 'threequarters',
    'questiondownsmall', 'oneeighth', 'threeeighths', 'fiveeighths', 'seveneighths', 'onethird', 'twothirds', '',
    '', 'zerosuperior', 'onesuperior', 'twosuperior', 'threesuperior', 'foursuperior', 'fivesuperior',
    'sixsuperior', 'sevensuperior', 'eightsuperior', 'ninesuperior', 'zeroinferior', 'oneinferior', 'twoinferior',
    'threeinferior', 'fourinferior', 'fiveinferior', 'sixinferior', 'seveninferior', 'eightinferior',
    'nineinferior', 'centinferior', 'dollarinferior', 'periodinferior', 'commainferior', 'Agravesmall',
    'Aacutesmall', 'Acircumflexsmall', 'Atildesmall', 'Adieresissmall', 'Aringsmall', 'AEsmall', 'Ccedillasmall',
    'Egravesmall', 'Eacutesmall', 'Ecircumflexsmall', 'Edieresissmall', 'Igravesmall', 'Iacutesmall',
    'Icircumflexsmall', 'Idieresissmall', 'Ethsmall', 'Ntildesmall', 'Ogravesmall', 'Oacutesmall',
    'Ocircumflexsmall', 'Otildesmall', 'Odieresissmall', 'OEsmall', 'Oslashsmall', 'Ugravesmall', 'Uacutesmall',
    'Ucircumflexsmall', 'Udieresissmall', 'Yacutesmall', 'Thornsmall', 'Ydieresissmall']


/**
 * 解析Index数据
 * @param data 字体文件DataView数据
 * @param offset 当前 index 数据的位置
 * @param parser 对 index 中每项数据的解析器，可选
 * @returns {
 *   data: {
 * 	   index: IIndex对象
 * 		 data: 解析后的data数组
 * 	 },
 *   offset: 新的 offset 偏移位置
 * }
 */
/**
 * parse Index data
 * @param data font data, type of DataView
 * @param offset offset of current index data
 * @param parser parser for each entry in index data
 * @returns {
 *   data: {
 * 	   index: IIndex object
 * 		 data: parsed data array
 * 	 },
 *   offset: new offset
 * }
 */
const parseIndex = (data: DataView, offset: number, parser?: Function) => {
	let configRawData = []
	let offset2 = offset
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)

	let _offset = offset
	const count = decode.decoder['uint16']()
	configRawData.push(data.getUint8(offset2))
	offset2++
	configRawData.push(data.getUint8(offset2))
	offset2++
	const offSize = decode.decoder['uint8']()
	configRawData.push(data.getUint8(offset2))
	offset2++
	const offsetArray = []
	const rawDataArray = []
	const dataArray = []
	if (count !== 0) {
		for (let i = 0; i < count + 1; i++) {
			switch(offSize) {
				case 1: {
					offsetArray.push(decode.decoder['uint8']())
					configRawData.push(data.getUint8(offset2))
					offset2++
					break
				}
				case 2: {
					offsetArray.push(decode.decoder['uint16']())
					configRawData.push(data.getUint8(offset2))
					offset2++
					configRawData.push(data.getUint8(offset2))
					offset2++
					break
				}
				case 3: {
					offsetArray.push(decode.decoder['uint32']())
					configRawData.push(data.getUint8(offset2))
					offset2++
					configRawData.push(data.getUint8(offset2))
					offset2++
					configRawData.push(data.getUint8(offset2))
					offset2++
					configRawData.push(data.getUint8(offset2))
					offset2++
					break
				}
				case 4: {
					offsetArray.push(decode.decoder['bigInt']())
					configRawData.push(data.getUint8(offset2))
					offset2++
					configRawData.push(data.getUint8(offset2))
					offset2++
					configRawData.push(data.getUint8(offset2))
					offset2++
					configRawData.push(data.getUint8(offset2))
					offset2++
					configRawData.push(data.getUint8(offset2))
					offset2++
					configRawData.push(data.getUint8(offset2))
					offset2++
					configRawData.push(data.getUint8(offset2))
					offset2++
					configRawData.push(data.getUint8(offset2))
					offset2++
					break
				}
			}
		}
		_offset = decode.getOffset()
		decode.end()
		for (let i = 0; i < offsetArray.length - 1; i++) {
			const _data = []
			for (let j = offsetArray[i]; j < offsetArray[i + 1]; j++) {
				let tmp = 0
				if (typeof j !== 'bigint')
					tmp = data.getUint8(_offset - 1 + j)
				else
					tmp = data.getUint8(Number(BigInt(_offset - 1) + j))
				_data.push(tmp)
			}
			rawDataArray.push(_data)
			dataArray.push(parser ? parser(_data) : _data)
		}
	}

	return {
		data: {
			configRawData,
			index: {
				count,
				offSize,
				offset: offsetArray,
				data: rawDataArray,
			},
			data: dataArray,
		},
		offset: typeof offsetArray[count] === 'bigint' ? Number(BigInt(_offset - 1) + (count === 0 ? BigInt(0) : (offsetArray[count] as bigint))) : _offset - 1 + (count === 0 ? 0 : (offsetArray[count] as number)),
	}
}

const parseType2CharString= (charString: any, index: number, topDict: any, font: IFont) => {
	const contours: Array<Array<ILine | ICubicBezierCurve>> = []
	let contour: Array<ILine | ICubicBezierCurve> = []
	const commands: Array<{ command: string, data: Array<number>, mask?: Array<number> }> = []
	let width: any = null
	let nStems = 0
	let x = 0, y = 0
	const stack: Array<number> = []

	let subrs: any
	let subrsBias: any
	let defaultWidthX
	let nominalWidthX
	if (font.settings.isCIDFont) {
			const fdIndex = topDict._fdSelect[index]
			const fdDict = topDict._fdArray[fdIndex]
			subrs = fdDict._subrs
			subrsBias = fdDict._subrsBias
			defaultWidthX = fdDict._defaultWidthX
			nominalWidthX = fdDict._nominalWidthX
	} else {
			subrs = topDict._subrs
			subrsBias = topDict._subrsBias
			defaultWidthX = topDict._defaultWidthX
			nominalWidthX = topDict._nominalWidthX
	}

	const getWidth = () => {
		if (stack.length % 2 !== 0) {
			width = stack.shift()
		}
	}

	const parse = (charString: any) => {
		let i = 0
		while(i < charString.length) {
			const v = charString[i]
			i++
			switch(v) {
				case 1: {
					// hstem
					width === null && getWidth()
					nStems += stack.length >> 1
					const data: Array<number> = []
					while (stack.length) {
						data.push(stack.shift() as number)
					}
					commands.push({
						command: 'hstem',
						data,
					})
					break
				}
				case 3: {
					// hstem
					width === null && getWidth()
					nStems += stack.length >> 1
					const data: Array<number> = []
					while (stack.length) {
						data.push(stack.shift() as number)
					}
					commands.push({
						command: 'vstem',
						data,
					})
					break
				}
				case 18: {
					// hstemhm
					width === null && getWidth()
					nStems += stack.length >> 1
					const data: Array<number> = []
					while (stack.length) {
						data.push(stack.shift() as number)
					}
					commands.push({
						command: 'hstemhm',
						data,
					})
					break
				}
				case 23: {
					// vstemhm
					width === null && getWidth()
					nStems += stack.length >> 1
					const data: Array<number> = []
					while (stack.length) {
						data.push(stack.shift() as number)
					}
					commands.push({
						command: 'vstemhm',
						data,
					})
					break
				}
				case 19: {
					// hintmask
					width === null && getWidth()
					nStems += stack.length >> 1
					const data: Array<number> = []
					while (stack.length) {
						data.push(stack.shift() as number)
					}
					const mask: Array<number> = []
					let n = (nStems + 7) >> 3
					while (n) {
						mask.push(charString[i + n])
						n--
					}
					i += (nStems + 7) >> 3
					commands.push({
						command: 'hintmask',
						data,
						mask,
					})
					break
				}
				case 20: {
					// cntrmask
					width === null && getWidth()
					nStems += stack.length >> 1
					const data: Array<number> = []
					while (stack.length) {
						data.push(stack.shift() as number)
					}
					const mask: Array<number> = []
					let n = (nStems + 7) >> 3
					while (n) {
						mask.push(charString[i + n])
						n--
					}
					i += (nStems + 7) >> 3
					commands.push({
						command: 'cntrmask',
						data,
						mask,
					})
					break
				}
				case 21: {
					// rmoveto
					width === null && getWidth()
					if (contour.length) {
						contours.push(contour)
						contour = []
					}
					const dy = stack.pop() as number
					const dx = stack.pop() as number
					x += dx
					y += dy
					commands.push({
						command: 'rmoveto',
						data: [dx, dy]
					})
					break
				}
				case 4: {
					// vmoveto
					width === null && getWidth()
					if (contour.length) {
						contours.push(contour)
						contour = []
					}
					const dy = stack.pop() as number
					y += dy
					commands.push({
						command: 'vmoveto',
						data: [dy]
					})
					break
				}
				case 22: {
					// hmoveto
					width === null && getWidth()
					if (contour.length) {
						contours.push(contour)
						contour = []
					}
					const dx = stack.pop() as number
					x += dx
					commands.push({
						command: 'hmoveto',
						data: [dx]
					})
					break
				}
				case 5: {
					// rlineto
					const data = []
					while (stack.length) {
						const dx = stack.shift() as number
						const dy = stack.shift() as number
						contour.push({
							type: PathType.LINE,
							start: {
								x, y,
							},
							end: {
								x: x + dx,
								y: y + dy,
							}
						})
						x += dx
						y += dy
						data.push(dx)
						data.push(dy)
					}
					commands.push({
						command: 'rlineto',
						data
					})
					break
				}
				case 6: {
					// hlineto
					const data = []
					const dx = stack.shift() as number
					data.push(dx)
					contour.push({
						type: PathType.LINE,
						start: {
							x, y,
						},
						end: {
							x: x + dx,
							y,
						}
					})
					x += dx
					while (stack.length) {
						const dx = stack.shift() as number
						const dy = stack.shift() as number
						contour.push({
							type: PathType.LINE,
							start: {
								x, y,
							},
							end: {
								x: x + dx,
								y,
							}
						})
						x += dx
						y += dy
						data.push(dx)
					}
					commands.push({
						command: 'hlineto',
						data
					})
					break
				}
				case 7: {
					// vlineto
					const data = []
					const dy = stack.shift() as number
					data.push(dy)
					contour.push({
						type: PathType.LINE,
						start: {
							x, y,
						},
						end: {
							x,
							y: y + dy,
						}
					})
					y += dy
					while (stack.length) {
						const dx = stack.shift() as number
						const dy = stack.shift() as number
						contour.push({
							type: PathType.LINE,
							start: {
								x, y,
							},
							end: {
								x: x + dx,
								y: y + dy,
							}
						})
						x += dx
						y += dy
						data.push(dx)
						data.push(dy)
					}
					commands.push({
						command: 'vlineto',
						data
					})
					break
				}
				case 8: {
					// rrcurveto
					const data = []
					while (stack.length) {
						const dxa = stack.shift() as number
						const dya = stack.shift() as number
						const dxb = stack.shift() as number
						const dyb = stack.shift() as number
						const dxc = stack.shift() as number
						const dyc = stack.shift() as number
						contour.push({
							type: PathType.CUBIC_BEZIER,
							start: {
								x, y,
							},
							control1: {
								x: x + dxa,
								y: y + dya,
							},
							control2: {
								x: x + dxa + dxb,
								y: y + dya + dyb,
							},
							end: {
								x: x + dxa + dxb + dxc,
								y: y + dya + dyb + dyc,
							}
						})
						x += dxa + dxb + dxc
						y += dya + dyb + dyc
						data.push(dxa, dya, dxb, dyb, dxc, dyc)
					}
					commands.push({
						command: 'rrcurveto',
						data
					})
					break
				}
				case 27: {
					// hhcurveto
					const data = []
					let dy = stack.length % 2 !== 0 ? data.push(stack.shift() as number) && data[0] : 0
					while (stack.length) {
						const dxa = stack.shift() as number
						const dxb = stack.shift() as number
						const dyb = stack.shift() as number
						const dxc = stack.shift() as number
						contour.push({
							type: PathType.CUBIC_BEZIER,
							start: {
								x, y,
							},
							control1: {
								x: x + dxa,
								y: y + dy,
							},
							control2: {
								x: x + dxa + dxb,
								y: y + dy + dyb,
							},
							end: {
								x: x + dxa + dxb + dxc,
								y: y + dy + dyb,
							}
						})
						x += dxa + dxb + dxc
						y += dy + dyb
						data.push(dxa, dxb, dyb, dxc)
					}
					commands.push({
						command: 'hhcurveto',
						data
					})
					break
				}
				case 26: {
					// vvcurveto
					const data = []
					let dx = stack.length % 2 !== 0 ? data.push(stack.shift() as number) && data[0] : 0
					while (stack.length) {
						const dya = stack.shift() as number
						const dxb = stack.shift() as number
						const dyb = stack.shift() as number
						const dyc = stack.shift() as number
						contour.push({
							type: PathType.CUBIC_BEZIER,
							start: {
								x, y,
							},
							control1: {
								x: x + dx,
								y: y + dya,
							},
							control2: {
								x: x + dx + dxb,
								y: y + dya + dyb,
							},
							end: {
								x: x + dx + dxb,
								y: y + dya + dyb,
							}
						})
						x += dx + dxb
						y += dya + dyb + dyc
						data.push(dya, dxb, dyb, dyc)
					}
					commands.push({
						command: 'vvcurveto',
						data
					})
					break
				}
				case 31: {
					// hvcurveto
					const data = []
					while (stack.length > 0) {
						const dxa = stack.shift() as number
						const dxb = stack.shift() as number
						const dyb = stack.shift() as number
						const dyc = stack.shift() as number
						const dxc = stack.length === 1 ? stack.shift() as number : null
						contour.push({
							type: PathType.CUBIC_BEZIER,
							start: {
								x, y,
							},
							control1: {
								x: x + dxa,
								y,
							},
							control2: {
								x: x + dxa + dxb,
								y: y + dyb,
							},
							end: {
								x: dxc === null ? x + dxa + dxb : x + dxa + dxb + dxc,
								y: y + dyb + dyc,
							}
						})
						x += dxc === null ? dxa + dxb : dxa + dxb + dxc
						y += dyb + dyc
						data.push(dxa, dxb, dyb, dyc)
						dxc !== null && data.push(dxc)
						if (stack.length === 0) {
							break
						}
						const dyd = stack.shift() as number
						const dxe = stack.shift() as number
						const dye = stack.shift() as number
						const dxf = stack.shift() as number
						const dyf = stack.length === 1 ? stack.shift() as number : null
						contour.push({
							type: PathType.CUBIC_BEZIER,
							start: {
								x, y,
							},
							control1: {
								x: x,
								y: y + dyd,
							},
							control2: {
								x: x + dxe,
								y: y + dyd + dye,
							},
							end: {
								x: x + dxe + dxf,
								y: dyf === null ? y + dyd + dye : y + dyd + dye + dyf,
							}
						})
						x += dxe + dxf
						y += dyf === null ? dyd + dye : dyd + dye + dyf
						data.push(dxa, dxb, dyb, dyc)
						dyf !== null && data.push(dyf)
					}
					commands.push({
						command: 'hvcurveto',
						data
					})
					break
				}
				case 30: {
					// vhcurveto
					const data = []
					while (stack.length > 0) {
						const dya = stack.shift() as number
						const dxb = stack.shift() as number
						const dyb = stack.shift() as number
						const dxc = stack.shift() as number
						const dyc = stack.length === 1 ? stack.shift() as number : null
						contour.push({
							type: PathType.CUBIC_BEZIER,
							start: {
								x, y,
							},
							control1: {
								x,
								y: y + dya,
							},
							control2: {
								x: x + dxb,
								y: y + dya + dyb,
							},
							end: {
								x: x + dxb + dxc,
								y: dyc === null ? y + dya + dyb : y + dya + dyb + dyc,
							}
						})
						x += dxb + dxc
						y += dyc === null ? dya + dyb : dya + dyb + dyc
						data.push(dya, dxb, dyb, dxc)
						dyc !== null && data.push(dyc)
						if (stack.length === 0) {
							break
						}
						const dxd = stack.shift() as number
						const dxe = stack.shift() as number
						const dye = stack.shift() as number
						const dyf = stack.shift() as number
						const dxf = stack.length === 1 ? stack.shift() as number : null
						contour.push({
							type: PathType.CUBIC_BEZIER,
							start: {
								x, y,
							},
							control1: {
								x: x + dxd,
								y,
							},
							control2: {
								x: x + dxd + dxe,
								y: y + dye,
							},
							end: {
								x: dxf === null ? x + dxd + dxe : x + dxd + dxe + dxf,
								y: y + dye + dyf,
							}
						})
						x += dxf === null ? dxd + dxe : dxd + dxe + dxf
						y += dye + dyf
						data.push(dxd, dxe, dye, dyf)
						dxf !== null && data.push(dxf)
					}
					commands.push({
						command: 'vhcurveto',
						data
					})
					break
				}
				case 24: {
					// rcurveline
					const data = []
					while (stack.length > 2) {
						const dxa = stack.shift() as number
						const dya = stack.shift() as number
						const dxb = stack.shift() as number
						const dyb = stack.shift() as number
						const dxc = stack.shift() as number
						const dyc = stack.shift() as number
						contour.push({
							type: PathType.CUBIC_BEZIER,
							start: {
								x, y,
							},
							control1: {
								x: x + dxa,
								y: y + dya,
							},
							control2: {
								x: x + dxa + dxb,
								y: y + dya + dyb,
							},
							end: {
								x: x + dxa + dxb + dxc,
								y: y + dya + dyb + dyc,
							}
						})
						x += dxa + dxb + dxc
						y += dya + dyb + dyc
						data.push(dxa, dya, dxb, dyb, dxc, dyc)
					}
					const dxd = stack.shift() as number
					const dyd = stack.shift() as number
					contour.push({
						type: PathType.LINE,
						start: {
							x, y,
						},
						end: {
							x: x + dxd,
							y: y + dyd,
						}
					})
					data.push(dxd, dyd)
					commands.push({
						command: 'rcurveline',
						data
					})
					break
				}
				case 25: {
					// rcurveline
					const data = []
					while (stack.length > 6) {
						const dxa = stack.shift() as number
						const dya = stack.shift() as number
						contour.push({
							type: PathType.LINE,
							start: {
								x, y,
							},
							end: {
								x: x + dxa,
								y: y + dya,
							}
						})
						x += dxa
						y += dya
						data.push(dxa, dya)
					}
					const dxb = stack.shift() as number
					const dyb = stack.shift() as number
					const dxc = stack.shift() as number
					const dyc = stack.shift() as number
					const dxd = stack.shift() as number
					const dyd = stack.shift() as number
					contour.push({
						type: PathType.CUBIC_BEZIER,
						start: {
							x, y,
						},
						control1: {
							x: x + dxb,
							y: y + dyb,
						},
						control2: {
							x: x + dxb + dxc,
							y: y + dyb + dyc,
						},
						end: {
							x: x + dxb + dxc + dxd,
							y: y + dxb + dxc + dyd,
						}
					})
					data.push(dxb, dyb, dxc, dyc, dxd, dyd)
					commands.push({
						command: 'rlinecurve',
						data
					})
					break
				}
				case 12: {
					const v = charString[i]
					i++
					switch(v) {
						case 35: {
							// flex
							const data = []
							const dx1 = stack.shift() as number
							const dy1 = stack.shift() as number
							const dx2 = stack.shift() as number
							const dy2 = stack.shift() as number
							const dx3 = stack.shift() as number
							const dy3 = stack.shift() as number
							const dx4 = stack.shift() as number
							const dy4 = stack.shift() as number
							const dx5 = stack.shift() as number
							const dy5 = stack.shift() as number
							const dx6 = stack.shift() as number
							const dy6 = stack.shift() as number
							const fd = stack.shift() as number
							contour.push({
								type: PathType.CUBIC_BEZIER,
								start: {
									x, y,
								},
								control1: {
									x: x + dx1,
									y: y + dy1,
								},
								control2: {
									x: x + dx1 + dx2,
									y: y + dy1 + dy2,
								},
								end: {
									x: x + dx1 + dx2 + dx3,
									y: y + dy1 + dy2 + dy3,
								}
							})
							x += dx1 + dx2 + dx3
							y += dy1 + dy2 + dy3
							contour.push({
								type: PathType.CUBIC_BEZIER,
								start: {
									x, y,
								},
								control1: {
									x: x + dx4,
									y: y + dy4,
								},
								control2: {
									x: x + dx4 + dx5,
									y: y + dy4 + dy5,
								},
								end: {
									x: x + dx4 + dx5 + dx6,
									y: y + dy4 + dy5 + dy6,
								}
							})
							x += dx4 + dx5 + dx6
							y += dy4 + dy5 + dy6
							data.push(dx1, dy1, dx2, dy2, dx3, dy3, dx4, dy4, dx5, dy5, dx6, dy6, fd)
							commands.push({
								command: 'flex',
								data
							})
							break
						}
						case 34: {
							// hflex
							const data = []
							const dx1 = stack.shift() as number
							const dx2 = stack.shift() as number
							const dy2 = stack.shift() as number
							const dx3 = stack.shift() as number
							const dx4 = stack.shift() as number
							const dx5 = stack.shift() as number
							const dx6 = stack.shift() as number
							contour.push({
								type: PathType.CUBIC_BEZIER,
								start: {
									x, y,
								},
								control1: {
									x: x + dx1,
									y,
								},
								control2: {
									x: x + dx1 + dx2,
									y: y + dy2,
								},
								end: {
									x: x + dx1 + dx2 + dx3,
									y: y + dy2,
								}
							})
							contour.push({
								type: PathType.CUBIC_BEZIER,
								start: {
									x, y,
								},
								control1: {
									x: x + dx1 + dx2 + dx3 + dx4,
									y: y + dy2,
								},
								control2: {
									x: x + dx1 + dx2 + dx3 + dx4 + dx5,
									y,
								},
								end: {
									x: x + dx1 + dx2 + dx3 + dx4 + dx5 + dx6,
									y,
								}
							})
							x += dx1 + dx2 + dx3 + dx4 + dx5 + dx6
							data.push(dx1, dx2, dy2, dx3, dx4, dx5, dx6)
							commands.push({
								command: 'hflex',
								data
							})
							break
						}
						case 36: {
							// hflex1
							const data = []
							const dx1 = stack.shift() as number
							const dy1 = stack.shift() as number
							const dx2 = stack.shift() as number
							const dy2 = stack.shift() as number
							const dx3 = stack.shift() as number
							const dx4 = stack.shift() as number
							const dx5 = stack.shift() as number
							const dy5 = stack.shift() as number
							const dx6 = stack.shift() as number
							contour.push({
								type: PathType.CUBIC_BEZIER,
								start: {
									x, y,
								},
								control1: {
									x: x + dx1,
									y: y + dy1,
								},
								control2: {
									x: x + dx1 + dx2,
									y: y + dy1 + dy2,
								},
								end: {
									x: x + dx1 + dx2 + dx3,
									y: y + dy1 + dy2,
								}
							})
							contour.push({
								type: PathType.CUBIC_BEZIER,
								start: {
									x, y,
								},
								control1: {
									x: x + dx1 + dx2 + dx3 + dx4,
									y: y + dy1 + dy2,
								},
								control2: {
									x: x + dx1 + dx2 + dx3 + dx4 + dx5,
									y: y + dy1 + dy2 + dy5,
								},
								end: {
									x: x + dx1 + dx2 + dx3 + dx4 + dx5 + dx6,
									y,
								}
							})
							x += dx1 + dx2 + dx3 + dx4 + dx5 + dx6
							data.push(dx1, dy1, dx2, dy2, dx3, dx4, dx5, dy5, dx6)
							commands.push({
								command: 'hflex1',
								data
							})
							break
						}
						case 37: {
							// flex1
							const data = []
							const dx1 = stack.shift() as number
							const dy1 = stack.shift() as number
							const dx2 = stack.shift() as number
							const dy2 = stack.shift() as number
							const dx3 = stack.shift() as number
							const dy3 = stack.shift() as number
							const dx4 = stack.shift() as number
							const dy4 = stack.shift() as number
							const dx5 = stack.shift() as number
							const dy5 = stack.shift() as number
							const d6 = stack.shift() as number
							const d = Math.abs(dx1 + dx2 + dx3 + dx4 + dx5) - Math.abs(dy1 + dy2 + dy3 + dy4 + dy5)
							contour.push({
								type: PathType.CUBIC_BEZIER,
								start: {
									x, y,
								},
								control1: {
									x: x + dx1,
									y: y + dy1,
								},
								control2: {
									x: x + dx1 + dx2,
									y: y + dy1 + dy2,
								},
								end: {
									x: x + dx1 + dx2 + dx3,
									y: y + dy1 + dy2 + dy3,
								}
							})
							x += dx1 + dx2 + dx3
							y += dy1 + dy2 + dy3
							contour.push({
								type: PathType.CUBIC_BEZIER,
								start: {
									x, y,
								},
								control1: {
									x: x + dx4,
									y: y + dy4,
								},
								control2: {
									x: x + dx4 + dx5,
									y: y + dy4 + dy5,
								},
								end: {
									x: x + dx4 + dx5 + (d > 0 ? d6 : 0),
									y: y + dy4 + dy5 + (d < 0 ? d6 : 0),
								}
							})
							x += dx4 + dx5 + (d > 0 ? d6 : 0)
							y += dy4 + dy5 + (d < 0 ? d6 : 0)
							data.push(dx1, dy1, dx2, dy2, dx3, dy3, dx4, dy4, dx5, dy5, d6)
							commands.push({
								command: 'flex1',
								data
							})
							break
						}
					}
					break
				}
				case 10: {
					// callsubr
					const codeIndex = stack.pop() + subrsBias
					const subrCode = subrs[codeIndex];
					if (subrCode) {
						parse(subrCode)
					}
	
					break
				}
				case 11: {
					// return
					return
				}
				case 14: {
					// endchar
					width && getWidth()
					if (contour.length) {
						contours.push(contour)
					}

					break;
				}
				default: {
					if (v < 32) {
						
					} else if (v < 247) {
						stack.push(v - 139)
					} else if (v < 251) {
						const b1 = charString[i]
						i += 1;
						stack.push((v - 247) * 256 + b1 + 108);
					} else if (v < 255) {
						const b1 = charString[i]
						i += 1
						stack.push(-(v - 251) * 256 - b1 - 108)
					} else {
						const b1 = charString[i]
						const b2 = charString[i + 1]
						const b3 = charString[i + 2]
						const b4 = charString[i + 3]
						i += 4;
						stack.push(((b1 << 24) | (b2 << 16) | (b3 << 8) | b4) / 65536)
					}
					break
				}
			}
		}
	}

	parse(charString)
	if (!width) width = defaultWidthX
	return {
		contours,
		commands,
		advanceWidth: width,
	}
}

/**
 * 解析 Dict 数据
 * @param data 字体文件DataView数据
 * @param offset 当前 Dict 数据的位置
 * @param size Dict大小
 * @returns Dict对象
 */
/**
 * parse Dict data
 * @param data font data, type of DataView
 * @param offset offset of current dict data
 * @param size Dict size
 * @returns Dict object
 */
const parseDict = (data: DataView, offset: number = 0, size: number) => {
	const entries = []
	let operands = []

	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)

	while (decode.getOffset() < size) {
		let op = decode.decoder['uint8']()

		// The first byte for each dict item distinguishes between operator (key) and operand (value).
		// Values <= 21 are operators.
		if (op <= 21) {
			// Two-byte operators have an initial escape byte of 12.
			if (op === 12) {
					op = 1200 + decode.decoder['uint8']()
			}

			entries.push([op, operands])
			operands = []
		} else {
			// Since the operands (values) come before the operators (keys), we store all operands in a list
			// until we encounter an operator.
			const { value, offset: __offset } = parseOperand(data, decode.getOffset(), op)
			operands.push(value)
			decode.setOffset(__offset)
		}
	}

	decode.end()

	return entriesToObject(entries);
}


const parseOperand = (data: DataView, offset: number, b0: number) => {
	let b1
	let b2
	let b3
	let b4
	
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)

	if (b0 === 28) {
		b1 = decode.decoder['uint8']()
		b2 = decode.decoder['uint8']()
		return {
			value: b1 << 8 | b2,
			offset: decode.getOffset()
		}
	}

	if (b0 === 29) {
		b1 = decode.decoder['uint8']()
		b2 = decode.decoder['uint8']()
		b3 = decode.decoder['uint8']()
		b4 = decode.decoder['uint8']()
		return {
			value: b1 << 24 | b2 << 16 | b3 << 8 | b4,
			offset: decode.getOffset()
		}
	}

	if (b0 === 30) {
		return parseFloatOperand(data, offset)
	}

	if (b0 >= 32 && b0 <= 246) {
		return {
			value: b0 - 139,
			offset,
		}
	}

	if (b0 >= 247 && b0 <= 250) {
		b1 = decode.decoder['uint8']()
		return {
			value: (b0 - 247) * 256 + b1 + 108,
			offset: decode.getOffset()
		}
	}

	if (b0 >= 251 && b0 <= 254) {
		b1 = decode.decoder['uint8']()
		return {
			value: -(b0 - 251) * 256 - b1 - 108,
			offset: decode.getOffset()
		}
	}

	decode.end()

	throw new Error('Invalid b0 ' + b0)
}

const parseFloatOperand = (data: DataView, offset: number) => {
	let s = ''
	const eof = 15
	const lookup = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'E', 'E-', null, '-']

	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)

	while (true) {
			const b = decode.decoder['uint8']()
			const n1 = b >> 4
			const n2 = b & 15

			if (n1 === eof) {
					break
			}

			s += lookup[n1]

			if (n2 === eof) {
					break
			}

			s += lookup[n2]
	}

	return {
		value: parseFloat(s),
		offset: decode.getOffset(),
	}
}

const interpretDict = (dict: any, meta: Array<any>, strings: Array<any>) => {
	const newDict: any = {}
	let value;

	// Because we also want to include missing values, we start out from the meta list
	// and lookup values in the dict.
	for (let i = 0; i < meta.length; i += 1) {
			const m = meta[i]

			if (Array.isArray(m.type)) {
					const values = [];
					values.length = m.type.length;
					for (let j = 0; j < m.type.length; j++) {
							value = dict[m.op] !== undefined ? dict[m.op][j] : undefined;
							if (value === undefined) {
									value = m.value !== undefined && m.value[j] !== undefined ? m.value[j] : null;
							}
							if (m.type[j] === 'SID') {
									value = getString(strings, value);
							}
							values[j] = value;
					}
					newDict[m.name] = values;
			} else {
					value = dict[m.op];
					if (value === undefined) {
							value = m.value !== undefined ? m.value : null;
					}

					if (m.type === 'SID') {
							value = getString(strings, value);
					}
					newDict[m.name] = value;
			}
	}

	return newDict;
}

const entriesToObject = (entries: Array<any>) => {
	const o: any = {}
	for (let i = 0; i < entries.length; i += 1) {
		const key = entries[i][0]
		const values = entries[i][1]
		let value;
		if (values.length === 1) {
			value = values[0]
		} else {
			value = values
		}

		if (o.hasOwnProperty(key) && !isNaN(o[key])) {
			throw new Error('Object ' + o + ' already has key ' + key)
		}

		o[key] = value
	}

	return o
}

const parseTopDict = (data: DataView, strings: any) => {
	const dict = parseDict(data, 0, data.byteLength)
	return interpretDict(dict, TOP_DICT_META, strings)
}

const parsePrivateDict = (data: DataView, offset: number, size: number, strings: any) => {
	const dict = parseDict(data, offset, size)
	return interpretDict(dict, PRIVATE_DICT_META, strings)
}

const calcSubroutineBias = (subrs: Array<any>) => {
	let bias
	if (subrs.length < 1240) {
		bias = 107
	} else if (subrs.length < 33900) {
		bias = 1131
	} else {
		bias = 32768
	}

	return bias
}

const gatherTopDicts = (data: DataView, offset: number, cffIndex: any, strings: any) => {
	const topDictArray = []
	for (let iTopDict = 0; iTopDict < cffIndex.length; iTopDict += 1) {
		const topDictData = new DataView(new Uint8Array(cffIndex[iTopDict]).buffer)
		const topDict: any = parseTopDict(topDictData, strings)
		topDict._subrs = []
		topDict._subrsBias = 0
		topDict._defaultWidthX = 0
		topDict._nominalWidthX = 0
		const privateSize = topDict.private[0]
		const privateOffset = topDict.private[1]
		if (privateSize !== 0 && privateOffset !== 0) {
			const privateDict: any = parsePrivateDict(data, privateOffset + offset, privateSize, strings)
			topDict._defaultWidthX = privateDict.defaultWidthX
			topDict._nominalWidthX = privateDict.nominalWidthX
			if (privateDict.subrs !== 0) {
				const subrOffset = privateOffset + privateDict.subrs
				const subrIndex = parseIndex(data, subrOffset + offset)
				topDict._subrs = subrIndex.data
				topDict._subrsBias = calcSubroutineBias(topDict._subrs)
			}
			topDict._privateDict = privateDict
		}
		topDictArray.push(topDict)
	}
	return topDictArray
}

const createFDSelect = (characters) => {
	const bytes = []
	bytes.push(0)
	for (let i = 0; i < characters.length; i++) {
		bytes.push(0)
	}
	return bytes
}

const parseFDSelect = (data: DataView, offset: number, numGlyphs: number, fdArrayCount: number) => {
	const fdSelect = [];
	let fdIndex;
	let _offset = offset
	const format = data.getUint8(offset)
	if (format === 0) {
		// Simple list of nGlyphs elements
		for (let iGid = 0; iGid < numGlyphs; iGid++) {
			fdIndex = data.getUint8(offset + 1 + iGid)
			if (fdIndex >= fdArrayCount) {
				throw new Error('CFF table CID Font FDSelect has bad FD index value ' + fdIndex + ' (FD count ' + fdArrayCount + ')')
			}
			fdSelect.push(fdIndex)
		}
		_offset += numGlyphs + 1
	} else if (format === 3) {
			// Ranges
			const nRanges = data.getUint16(offset + 1)
			let first = data.getUint16(offset + 3)
			if (first !== 0) {
				throw new Error('CFF Table CID Font FDSelect format 3 range has bad initial GID ' + first)
			}
			let next;
			for (let iRange = 0; iRange < nRanges; iRange++) {
				fdIndex = data.getUint8(offset + 5 + iRange * 3)
				next = data.getUint16(offset + 5 + iRange * 3 + 1)
				if (fdIndex >= fdArrayCount) {
					throw new Error('CFF table CID Font FDSelect has bad FD index value ' + fdIndex + ' (FD count ' + fdArrayCount + ')')
				}
				if (next > numGlyphs) {
					throw new Error('CFF Table CID Font FDSelect format 3 range has bad GID ' + next)
				}
				for (; first < next; first++) {
					fdSelect.push(fdIndex)
				}
				first = next
			}
			if (next !== numGlyphs) {
				throw new Error('CFF Table CID Font FDSelect format 3 range has bad final GID ' + next)
			}
			_offset += nRanges * 3 + 5
	} else {
			throw new Error('CFF Table CID Font FDSelect table has unsupported format ' + format)
	}
	return fdSelect
}

/**
 * 解析header数据
 * @param data 字体文件DataView数据
 * @param offset header数据的位置
 * @returns IHeader对象和新的offset
 */
/**
 * parse header data
 * @param data font data, type of DataView
 * @param offset offset of header data
 * @returns IHeader Object and new offset
 */
const parseHeader = (data: DataView, offset: number) => {
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)

	const major = decode.decoder['uint8']()
	const minor = decode.decoder['uint8']()
	const hdrSize = decode.decoder['uint8']()
	const offSize = decode.decoder['uint8']()
	const _data: IHeader = {
		major,
		minor,
		hdrSize,
		offSize,
	}

	const _offset = decode.getOffset()
	decode.end()

	return {
		data: _data,
		offset: _offset,
	}
}

/**
 * 解析encodings数据
 * @param data 字体文件DataView数据
 * @param offset encodings数据的位置
 * @returns IEncodings对象和新的offset
 */
/**
 * parse encodings data
 * @param data font data, type of DataView
 * @param offset offset of encodings data
 * @returns IEcodings Object and new offset
 */
const parseEncodings = (data: DataView, offset: number) => {
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	
	const format = decode.decoder['uint8']()
	const encodings: IEncodings = { format }
	if (format & 0) {
		encodings.nCodes = decode.decoder['uint8']()
		encodings.code = []
		for (let i = 0; i < encodings.nCodes; i += 1) {
			encodings.code.push(decode.decoder['uint8']())
		}
	} else if (format & 1) {
		encodings.nRanges = decode.decoder['uint8']()
		encodings.Range1 = []
		encodings.code = []
		for (let i = 0; i < encodings.nRanges; i += 1) {
			const first = decode.decoder['uint8']()
			const nLeft = decode.decoder['uint8']()
			encodings.Range1.push({
				first,
				nLeft,
			})
			for (let j = first; j <= first + nLeft; j += 1) {
				encodings.code.push(j)
			}
		}
	}
	
	if (format !== 0 && format !== 1) {
		encodings.nSups = decode.decoder['uint8']()
		encodings.supplement = []
		for (let i = 0; i < encodings.nSups; i += 1) {
			const sup: any = {}
			sup.code = decode.decoder['uint8']()
			sup.glyph = decode.decoder['uint8']()
			encodings.supplement.push(sup)
		}
	}

	const _offset = decode.getOffset()
	decode.end()

	return {
		data: encodings,
		offset: _offset,
	}
}

const getString = (stringsData: Array<any>, index: number) => {
	let str = ''
	if (index <= 390) {
		str = cffStandardStrings[index]
	} else {
		str = stringsData[index - 391]
	}

	return str
}

/**
 * 解析charsets数据
 * @param data 字体文件DataView数据
 * @param offset encodings数据的位置
 * @param font 字体对象
 * @param stringIndex stringIndex
 * @returns format 和 charset数组
 */
/**
 * parse charsets data
 * @param data font data, type of DataView
 * @param offset offset of charsets data
 * @param font font object
 * @param stringIndex stringIndex
 * @returns format and charset array
 */
const parseCharsets = (data: DataView, offset: number, font: IFont, stringIndex: IStringIndex) => {
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	
	const n = font.settings.numGlyphs ? font.settings.numGlyphs - 1 : 0
	const charset = ['.notdef']
	let _offset = offset

	const format = decode.decoder['uint8']()
	if (format === 0) {
		for (let i = 0; i < n; i += 1) {
			const decoded_data = decode.decoder['uint16']()
			charset.push(getString(stringIndex.data, decoded_data))
		}
		_offset = offset + 1 + n * 2
	} else if (format === 1) {
		while (charset.length <= n) {
			let first = decode.decoder['uint16']()
			_offset += 2
			let nLeft = decode.decoder['uint8']()
			_offset += 1
			for (let i = 0; i <= nLeft; i += 1) {
				charset.push(getString(stringIndex.data, first));
				first += 1;
			}
		}
	} else if (format === 2) {
		while (charset.length <= n) {
			let first = decode.decoder['uint16']()
			_offset += 2
			let nLeft = decode.decoder['uint8']()
			_offset += 1
			for (let i = 0; i <= nLeft; i += 1) {
				charset.push(getString(stringIndex.data, first));
				first += 1;
			}
		}
	} else {
		throw new Error('Unknown charset format ' + format);
	}

	decode.end()

	return {
		format,
		data: charset,
	}
}

/**
 * 解析cff表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns ICffTable对象
 */
/**
 * parse cff table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns ICffTable object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	// 解析header
	// parse header
	const _header = parseHeader(data, offset)
	// 解析name index
	// parse name index
	const _nameIndex = parseIndex(data, _header.offset)
	// 解析topDict index
	// parse topDic index
	const _topDictIndex = parseIndex(data, _nameIndex.offset)
	// 解析string index
	// parse string index
	const _stringIndex = parseIndex(data, _topDictIndex.offset, (bytes: any) => {
    let s = ''
    for (let i = 0; i < bytes.length; i += 1) {
      s += String.fromCharCode(bytes[i])
    }
    return s
	})
	// 解析globalSubrIndex
	// parse globalSubrIndex
	const _globalSubrIndex = parseIndex(data, _stringIndex.offset)

	font.settings.gsubrs = _globalSubrIndex.data.data
	font.settings.gsubrsBias = calcSubroutineBias(_globalSubrIndex.data.data)

	const topDictArray = gatherTopDicts(data, _globalSubrIndex.offset, _topDictIndex.data.data, _stringIndex.data.data)
	const topDict = topDictArray[0]

	if (topDict._privateDict) {
		font.settings.defaultWidthX = topDict._privateDict.defaultWidthX
		font.settings.nominalWidthX = topDict._privateDict.nominalWidthX
	}

	if (topDict.ros[0] !== undefined && topDict.ros[1] !== undefined) {
		font.settings.isCIDFont = true
	}

	if (font.settings.isCIDFont) {
		let fdArrayOffset = topDict.fdArray;
		let fdSelectOffset = topDict.fdSelect;
		if (fdArrayOffset === 0 || fdSelectOffset === 0) {
			throw new Error('Font is marked as a CID font, but FDArray and/or FDSelect information is missing');
		}
		fdArrayOffset += offset
		const fdArrayIndex = parseIndex(data, fdArrayOffset);
		const fdArray = gatherTopDicts(data, offset, fdArrayIndex.data.data, _stringIndex.data.data)
		topDict._fdArray = fdArray
		fdSelectOffset += offset
		topDict._fdSelect = parseFDSelect(data, fdSelectOffset, font.settings.numGlyphs as number, fdArray.length)
	}

	const privateDictOffset = offset + topDict.private[1]
	const privateDict: any = parsePrivateDict(data, privateDictOffset, topDict.private[0], _stringIndex.data.data)
	font.settings.defaultWidthX = privateDict.defaultWidthX
	font.settings.nominalWidthX = privateDict.nominalWidthX

	if (privateDict.subrs !== 0) {
		const subrOffset = privateDictOffset + privateDict.subrs
		const subrIndex = parseIndex(data, subrOffset)
		font.settings.subrs = subrIndex.data.data
		font.settings.subrsBias = calcSubroutineBias(font.settings.subrs)
	} else {
		font.settings.subrs = []
		font.settings.subrsBias = 0
	}

	let _encodings = null
	if (topDict.encoding === 0) {
		_encodings = cffStandardEncoding
	} else if (topDict.encoding === 1) {
		_encodings = cffExpertEncoding
	} else {
		_encodings = parseEncodings(data, offset + topDict.encoding)
	}
	const _charsets = parseCharsets(data, offset + topDict.charset, font, _stringIndex.data)
	const _charStringsIndex = parseIndex(data, offset + topDict.charStrings)

	// 解析每个glyph字形
	// parse each glyph
	const glyphTables = [] 
	for (let i = 0; i < (font.settings.numGlyphs as number); i ++) {
		const charString = _charStringsIndex.data.data[i]
		glyphTables.push(parseType2CharString(charString, i, topDict, font))
	}

	return {
		header: _header,
		nameIndex: _nameIndex,
		topDictIndex: _topDictIndex,
		stringIndex: _stringIndex,
		globalSubrIndex: _globalSubrIndex,
		encodings: _encodings,
		charsets: _charsets,
		charStringIndex: _charStringsIndex,
		topDict,
		glyphTables,
	}
}

const createIndex = (indexData: Array<any>) => {
	let offset = 1
	const offsets = [offset]
	let data: Array<number> = []
	for (let i = 0; i < indexData.length; i += 1) {
		const type = indexData[i].type
		const value = indexData[i].value
		const v = encoder[type as keyof typeof encoder](value)
		data = data.concat(v as unknown as Array<number>)
		offset += v.length
		offsets.push(offset)
	}

	if (data.length === 0) {
		return [0, 0]
	}

	const encodedOffsets: Array<number> = []
	const offSize = 2//(1 + Math.floor(Math.log(offset) / Math.log(2)) / 8) | 0
	const offsetEncoder = [undefined, encoder.uint8, encoder.uint16, encoder.uint24, encoder.uint32][offSize]
	for (let i = 0; i < offsets.length; i += 1) {
		const encodedOffset = (offsetEncoder as Function)(offsets[i])
		Array.prototype.push.apply(encodedOffsets, encodedOffset)
	}

	return Array.prototype.concat(encoder.Card16(indexData.length),
												 encoder.OffSize(offSize),
												 encodedOffsets,
												 data)
}

function equals(a: any, b: any) {
	if (a === b) {
		return true
	} else if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) {
			return false
		}

		for (let i = 0; i < a.length; i += 1) {
			if (!equals(a[i], b[i])) {
				return false
			}
		}

		return true
	} else {
		return false
	}
}

function encodeString(s: any, strings: any) {
	let sid

	let i = cffStandardStrings.indexOf(s)
	if (i >= 0) {
		sid = i
	}

	const encodedString = encodeToASCII(s)
	i = strings.indexOf(encodedString)
	if (i >= 0) {
		sid = i + cffStandardStrings.length
	} else {
		sid = cffStandardStrings.length + strings.length
		strings.push(encodedString)
	}

	return sid

	// let sid

	// let i = cffStandardStrings.indexOf(s)
	// if (i >= 0) {
	// 	sid = i
	// }

	// i = strings.indexOf(s)
	// if (i >= 0) {
	// 	sid = i + cffStandardStrings.length
	// } else {
	// 	sid = cffStandardStrings.length + strings.length
	// 	strings.push(s)
	// }

	// return sid
}

// 将非 US-ASCII 字符转换为合法 ASCII 字符串
function encodeToASCII(s) {
	if (typeof s === 'number') {
		return s
	}
	return s.split('')
					.map(char => {
						const code = char.charCodeAt(0);
						return code < 128
							? char // 如果是 US-ASCII 字符，直接保留
							//: `\\u${code.toString(16).padStart(4, '0')}`; // 否则转为 Unicode 形式
							: `${code.toString(16).padStart(4, '0')}`; // 否则转为 Unicode 形式
					})
					.join('');
	//return s
}

const createDict = (meta: Array<any>, attrs: Array<any>, strings: any) => {
	const m = []
	for (let i = 0; i < meta.length; i += 1) {
		const entry = meta[i]
		let value = attrs[entry.name]
		if (value !== undefined && !equals(value, entry.value)) {
			if (entry.type === 'SID') {
				value = encodeString(value, strings)
			}

			if (Array.isArray(value)) {
				value = Object.assign([], value)
				for (let i = 0; i < value.length; i++) {
					if (entry.type[i] === 'SID') {
						value[i] = encodeString(value[i], strings)
					}
				}
			}

			m.push({op: entry.op, name: entry.name, type: entry.type, value: value})
		}
	}
	let d: Array<number> = []

	for (let i = 0; i < m.length; i += 1) {
		const v = m[i]
		const k = v.op
		d = d.concat(encoder.Operand(v.value, v.type))
		d = d.concat(encoder.Operator(k))
	}

	return d
}

const glyphToOps = (glyph: IGlyphTable) => {
	const ops = [];
	ops.push({name: 'width', type: 'number', value: glyph.advanceWidth});
	let x = 0;
	let y = 0;
	for (let i = 0; i < glyph.contours.length; i ++) {
		if (!glyph.contours[i].length) continue
		const startPath = glyph.contours[i][0]
		const dx = Math.round(startPath.start.x - x)
		const dy = Math.round(startPath.start.y - y)
		ops.push({name: 'dx', type: 'number', value: dx})
		ops.push({name: 'dy', type: 'number', value: dy})
		ops.push({name: 'rmoveto', type: 'op', value: 21})
		x = Math.round(startPath.start.x)
		y = Math.round(startPath.start.y)
		for (let j = 0; j < glyph.contours[i].length; j++) {
			const path = glyph.contours[i][j]
			switch(path.type) {
				case PathType.LINE: {
					const dx = Math.round(path.end.x - x)
					const dy = Math.round(path.end.y - y)
					ops.push({name: 'dx', type: 'number', value: dx})
					ops.push({name: 'dy', type: 'number', value: dy})
					ops.push({name: 'rlineto', type: 'op', value: 5})
					x = Math.round(path.end.x)
					y = Math.round(path.end.y)
					break
				}
				case PathType.CUBIC_BEZIER: {
					const dx1 = Math.round(path.control1.x - x)
					const dy1 = Math.round(path.control1.y - y)
					const dx2 = Math.round(path.control2.x - path.control1.x)
					const dy2 = Math.round(path.control2.y - path.control1.y)
					const dx = Math.round(path.end.x - path.control2.x)
					const dy = Math.round(path.end.y - path.control2.y)
					ops.push({name: 'dx1', type: 'number', value: dx1})
					ops.push({name: 'dy1', type: 'number', value: dy1})
					ops.push({name: 'dx2', type: 'number', value: dx2})
					ops.push({name: 'dy2', type: 'number', value: dy2})
					ops.push({name: 'dx', type: 'number', value: dx})
					ops.push({name: 'dy', type: 'number', value: dy})
					ops.push({name: 'rrcurveto', type: 'op', value: 8})
					x = Math.round(path.end.x)
					y = Math.round(path.end.y)
				}
			}
		}
	}
	ops.push({name: 'endchar', type: 'op', value: 14})
	return ops
}

/**
 * 根据 characters 字符数组 和 options 配置选项创建cff表
 * @param characters 包含每个字符信息的数组
 * @param options 配置选项
 * @returns cff表
 */
/**
 * create cff table according to characters and options
 * @param characters characters array contain each character info
 * @param options options
 * @returns cff table
 */
const createTable = (characters: Array<ICharacter>, options: any) => {
	const fontScale = 1 / options.unitsPerEm
	const cffTable: ICffTable = {
		header: {
			major: 1,
			minor: 0,
			hdrSize: 4,
			offSize: 2,//1,
		},
		nameIndex: {
			data: [options.postScriptName],
		},
		globalSubrIndex: {
			data: [],
		},
		topDict: {
			version: options.version,
			fullName: options.fullName,
			familyName: options.familyName,
			weight: options.weightName,
			fontBBox: options.fontBBox || [0, 0, 0, 0],
			fontMatrix: [fontScale, 0, 0, fontScale, 0, 0],
			charset: 999,
			charStrings: 999,
			//private: [0, 999],
			ros: ['Adobe', 'GB1', 5],
			//ros: ['Adobe', 'Identity', 0],
			cidFontVersion: 1,
			cidFontRevision: 0,
			cidFontType: 0,
			cidCount: characters.length,
			isFixedPitch: 1,
			fdArray: 0,
			fdSelect: 0,
		},
	}

	const characterNames = []

	for (let i = 1; i < characters.length; i++) {
		characterNames.push(characters[i].name)
	}
	const strings: Array<string> = []
	cffTable.charsets = {
		format: 0,
		data: characterNames as Array<string>,
	}
	cffTable.glyphTables = characters.map((character) => {
		return {
			numberOfContours: character.contourNum as number,
			contours: character.contours,
			advanceWidth: character.advanceWidth as number,
		}
	})
	cffTable.stringIndex = {
		data: strings,
	}
	return cffTable
}

let cnt = 0
/**
 * 根据ICffTable对象创建该表的原始数据
 * @param table ICffTable table
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * generate raw data from IHheaTable table
 * @param table ICffTable table
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (_table: ICffTable) => {
	const table = R.clone(_table)
	// 创建header数据
	// create header data
	const header = table.header
	let headerData: Array<number> = []
	const glyphTables = table.glyphTables as Array<IGlyphTable>
	Object.keys(header).forEach((key: string) => {
		const type = types[key as keyof typeof types]
		const value = header[key as keyof typeof header]
		const bytes = encoder[type as keyof typeof encoder](value)
		if (bytes) {
			headerData = headerData.concat(bytes)
		}
	})
	// 创建nameIndex数据
	// create nameIndex data
	const nameIndex = table.nameIndex
	const nameIndexData = createIndex(nameIndex.data.map((item) => {
		return {
			type: 'Name',
			value: item
		}
	}))

	const strings: any = []
	const globalSubrIndexData = [0, 0]
	// 创建charsets数据
	// create charsets data
	const charsets = (table.charsets as ICharSets).data
	let charsetsData: Array<number> = []
	//charsetsData = charsetsData.concat(encoder.Card8(2) as Array<number>)
	charsetsData = charsetsData.concat(encoder.Card8(0) as Array<number>)
	for (let i = 0; i < charsets.length; i += 1) {
		const glyphSID = i + 1//encodeString(glyphName, strings)
		charsetsData = charsetsData.concat(encoder.SID(glyphSID) as Array<number>)
		//charsetsData = charsetsData.concat(encoder.Card16(0) as Array<number>)
	}
	// 创建charstrings数据
	// create charstrings data
	const charStringsIndexRawData = []
	for (let i = 0; i < glyphTables.length; i++) {
		loaded.value++
		if (loaded.value >= total.value) {
			loading.value = false
			loaded.value = 0
			total.value = 0
		}
		const glyph = glyphTables[i]
		const ops = glyphToOps(glyph)
		charStringsIndexRawData.push({type: 'CharString', value: ops})
	}
	const charStringsIndexData = createIndex(charStringsIndexRawData)

	const _fd: any = {
		private: [0, 0],
		fontBBox: table.topDict.fontBBox,
		fontMatrix: table.topDict.fontMatrix,
		fontName: table.topDict.familyName,
		weight: table.topDict.weight,
	}
	let fd = createDict(FONT_DICT_META, _fd, strings)
	let fdIndex = createIndex([{type: 'raw', value: fd}])
	const fdselect = createFDSelect(glyphTables)

	// 创建topDictIndex数据
	// create topDictIndex data
	let topDict = createDict(TOP_DICT_META, table.topDict, strings)
	let topDictIndexData = createIndex([{type: 'raw', value: topDict}])

	const _privateDict = {
		BlueValues: [-16, 0 - (-16), 800, 816 - 800],
		OtherBlues: [-216, -200 - (-216)],
		BlueScale: 0.039625,
		BlueShift: 7,
		BlueFuzz: 1,
		ForcedBold: 0,
		LanguageGroup: 0,
		ExpansionFactor: 0.06,
		initialRandomSeed: 0,
		defaultWidthX: 0,
		nominalWidthX: 0,
		StdHW: 50,
		StdVW: 100,
	}
	//@ts-ignore
	let privateDict = createDict(PRIVATE_DICT_META, _privateDict, strings)

	// 创建stringIndex数据
	// create stringIndex data
	const stringIndex = table.stringIndex as IStringIndex
	const stringIndexData = createIndex(strings.map((item: string) => {
		return {
			type: 'Name',
			value: item
		}
	}))

	const startOffset = headerData.length +
		nameIndexData.length +
		topDictIndexData.length +
		stringIndexData.length +
		globalSubrIndexData.length

	table.topDict.charset = startOffset
	table.topDict.charStrings = table.topDict.charset + charsetsData.length + fdselect.length
	table.topDict.fdArray = table.topDict.charStrings + charStringsIndexData.length
	table.topDict.fdSelect = table.topDict.charset + charsetsData.length

	_fd.private[0] = privateDict.length
	_fd.private[1] = table.topDict.charStrings + charStringsIndexData.length + fdIndex.length
	fd = createDict(FONT_DICT_META, _fd, strings)
	fdIndex = createIndex([{type: 'raw', value: fd}])

	topDict = createDict(TOP_DICT_META, table.topDict, strings)
	topDictIndexData = createIndex([{type: 'raw', value: topDict}])
	const data: Array<number> = [
		...headerData,
		...nameIndexData,
		...topDictIndexData,
		...stringIndexData,
		...globalSubrIndexData,
		...charsetsData,
		...fdselect,
		...charStringsIndexData,
		...fdIndex,
		...privateDict,
	]

	return data
}

export {
	parse,
	create,
	parseType2CharString,
	createTable,
}

export type {
	ICffTable,
	IGlyphTable,
}