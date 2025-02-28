import { getStorageString, hasChineseChar, isChineseChar } from '../utils'
import type { IFont } from '../font'
import { encoder } from '../encode'
import * as decode from '../decode'
import iconv from 'iconv-lite'

// name表格式
// name table format
interface INameTable {
	version: number;
	count: number;
	storageOffset: number;
	nameRecord: Array<INameRecord>;
	langTagCount?: number;
	langTagRecord?: Array<ILangTagRecord>;
	stringPool?: Array<any>;
}

// langTagRecord数据类型
// langTagRecord data type
interface ILangTagRecord {
	length: number;
	langTagOffset: number;
	str: string;
}

// nameRecord数据类型
// nameRecord data type
interface INameRecord {
	platformID: number;
	encodingID: number;
	languageID: number;
	nameID: number;
	length: number;
	stringOffset: number;
	str: string;
}

// name数据类型
// name table data type
const types = {
	version: 'uint16',
	count: 'uint16',
	storageOffset: 'Offset16',
	langTagCount: 'uint16',
	length: 'uint16',
	langTagOffset: 'Offset16',
	platformID: 'uint16',
	encodingID: 'uint16',
	languageID: 'uint16',
	nameID: 'uint16',
	stringOffset: 'Offset16',
	stringPool: 'raw',
}

/**
 * 解析name表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns INameTable对象
 */
/**
 * parse name table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns INameTable object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	const version = decode.decoder[types['version'] as keyof typeof decode.decoder]() as number
	const count = decode.decoder[types['version'] as keyof typeof decode.decoder]() as number
	const storageOffset = decode.decoder[types['storageOffset'] as keyof typeof decode.decoder]() as number
	const nameRecord = []
	for (let i = 0; i < count; i++) {
		const platformID = decode.decoder[types['platformID'] as keyof typeof decode.decoder]() as number
		const encodingID = decode.decoder[types['encodingID'] as keyof typeof decode.decoder]() as number
		const languageID = decode.decoder[types['languageID'] as keyof typeof decode.decoder]() as number
		const nameID = decode.decoder[types['nameID'] as keyof typeof decode.decoder]() as number
		const length = decode.decoder[types['length'] as keyof typeof decode.decoder]() as number
		const stringOffset = decode.decoder[types['stringOffset'] as keyof typeof decode.decoder]() as number
		const str = getStorageString(data, stringOffset, length)
		nameRecord.push({
			platformID,
			encodingID,
			languageID,
			nameID,
			length,
			stringOffset,
			str,
		})
	}

	const table: INameTable = {
		version,
		count,
		storageOffset,
		nameRecord
	}

	if (version >= 1) {
		table.langTagCount = decode.decoder[types['version'] as keyof typeof decode.decoder]() as number
		table.langTagRecord = []
		if (table.langTagCount) {
			for (let i = 0; i < table.langTagCount; i++) {
				const length = decode.decoder[types['length'] as keyof typeof decode.decoder]() as number
				const langTagOffset = decode.decoder[types['langTagOffset'] as keyof typeof decode.decoder]() as number
				const str = getStorageString(data, langTagOffset, length)
				table.langTagRecord.push({
					length,
					langTagOffset,
					str,
				})
			}
		}
	}

	decode.end()

	return table
}

// NameIDs for the name table.
const nameTableNames = [
	'copyright',              // 0
	'fontFamily',             // 1
	'fontSubfamily',          // 2
	'uniqueID',               // 3
	'fullName',               // 4
	'version',                // 5
	'postScriptName',         // 6
	'trademark',              // 7
	'manufacturer',           // 8
	'designer',               // 9
	'description',            // 10
	'manufacturerURL',        // 11
	'designerURL',            // 12
	'license',                // 13
	'licenseURL',             // 14
	'reserved',               // 15
	'preferredFamily',        // 16
	'preferredSubfamily',     // 17
	'compatibleFullName',     // 18
	'sampleText',             // 19
	'postScriptFindFontName', // 20
	'wwsFamily',              // 21
	'wwsSubfamily'            // 22
]

const macLanguages = {
	0: 'en',
	1: 'fr',
	2: 'de',
	3: 'it',
	4: 'nl',
	5: 'sv',
	6: 'es',
	7: 'da',
	8: 'pt',
	9: 'no',
	10: 'he',
	11: 'ja',
	12: 'ar',
	13: 'fi',
	14: 'el',
	15: 'is',
	16: 'mt',
	17: 'tr',
	18: 'hr',
	19: 'zh-Hant',
	20: 'ur',
	21: 'hi',
	22: 'th',
	23: 'ko',
	24: 'lt',
	25: 'pl',
	26: 'hu',
	27: 'es',
	28: 'lv',
	29: 'se',
	30: 'fo',
	31: 'fa',
	32: 'ru',
	33: 'zh',
	34: 'nl-BE',
	35: 'ga',
	36: 'sq',
	37: 'ro',
	38: 'cz',
	39: 'sk',
	40: 'si',
	41: 'yi',
	42: 'sr',
	43: 'mk',
	44: 'bg',
	45: 'uk',
	46: 'be',
	47: 'uz',
	48: 'kk',
	49: 'az-Cyrl',
	50: 'az-Arab',
	51: 'hy',
	52: 'ka',
	53: 'mo',
	54: 'ky',
	55: 'tg',
	56: 'tk',
	57: 'mn-CN',
	58: 'mn',
	59: 'ps',
	60: 'ks',
	61: 'ku',
	62: 'sd',
	63: 'bo',
	64: 'ne',
	65: 'sa',
	66: 'mr',
	67: 'bn',
	68: 'as',
	69: 'gu',
	70: 'pa',
	71: 'or',
	72: 'ml',
	73: 'kn',
	74: 'ta',
	75: 'te',
	76: 'si',
	77: 'my',
	78: 'km',
	79: 'lo',
	80: 'vi',
	81: 'id',
	82: 'tl',
	83: 'ms',
	84: 'ms-Arab',
	85: 'am',
	86: 'ti',
	87: 'om',
	88: 'so',
	89: 'sw',
	90: 'rw',
	91: 'rn',
	92: 'ny',
	93: 'mg',
	94: 'eo',
	128: 'cy',
	129: 'eu',
	130: 'ca',
	131: 'la',
	132: 'qu',
	133: 'gn',
	134: 'ay',
	135: 'tt',
	136: 'ug',
	137: 'dz',
	138: 'jv',
	139: 'su',
	140: 'gl',
	141: 'af',
	142: 'br',
	143: 'iu',
	144: 'gd',
	145: 'gv',
	146: 'ga',
	147: 'to',
	148: 'el-polyton',
	149: 'kl',
	150: 'az',
	151: 'nn'
}

// MacOS language ID → MacOS script ID
//
// Note that the script ID is not sufficient to determine what encoding
// to use in TrueType files. For some languages, MacOS used a modification
// of a mainstream script. For example, an Icelandic name would be stored
// with smRoman in the TrueType naming table, but the actual encoding
// is a special Icelandic version of the normal Macintosh Roman encoding.
// As another example, Inuktitut uses an 8-bit encoding for Canadian Aboriginal
// Syllables but MacOS had run out of available script codes, so this was
// done as a (pretty radical) "modification" of Ethiopic.
//
// http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/Readme.txt
const macLanguageToScript = {
	0: 0,  // langEnglish → smRoman
	1: 0,  // langFrench → smRoman
	2: 0,  // langGerman → smRoman
	3: 0,  // langItalian → smRoman
	4: 0,  // langDutch → smRoman
	5: 0,  // langSwedish → smRoman
	6: 0,  // langSpanish → smRoman
	7: 0,  // langDanish → smRoman
	8: 0,  // langPortuguese → smRoman
	9: 0,  // langNorwegian → smRoman
	10: 5,  // langHebrew → smHebrew
	11: 1,  // langJapanese → smJapanese
	12: 4,  // langArabic → smArabic
	13: 0,  // langFinnish → smRoman
	14: 6,  // langGreek → smGreek
	15: 0,  // langIcelandic → smRoman (modified)
	16: 0,  // langMaltese → smRoman
	17: 0,  // langTurkish → smRoman (modified)
	18: 0,  // langCroatian → smRoman (modified)
	19: 2,  // langTradChinese → smTradChinese
	20: 4,  // langUrdu → smArabic
	21: 9,  // langHindi → smDevanagari
	22: 21,  // langThai → smThai
	23: 3,  // langKorean → smKorean
	24: 29,  // langLithuanian → smCentralEuroRoman
	25: 29,  // langPolish → smCentralEuroRoman
	26: 29,  // langHungarian → smCentralEuroRoman
	27: 29,  // langEstonian → smCentralEuroRoman
	28: 29,  // langLatvian → smCentralEuroRoman
	29: 0,  // langSami → smRoman
	30: 0,  // langFaroese → smRoman (modified)
	31: 4,  // langFarsi → smArabic (modified)
	32: 7,  // langRussian → smCyrillic
	33: 25,  // langSimpChinese → smSimpChinese
	34: 0,  // langFlemish → smRoman
	35: 0,  // langIrishGaelic → smRoman (modified)
	36: 0,  // langAlbanian → smRoman
	37: 0,  // langRomanian → smRoman (modified)
	38: 29,  // langCzech → smCentralEuroRoman
	39: 29,  // langSlovak → smCentralEuroRoman
	40: 0,  // langSlovenian → smRoman (modified)
	41: 5,  // langYiddish → smHebrew
	42: 7,  // langSerbian → smCyrillic
	43: 7,  // langMacedonian → smCyrillic
	44: 7,  // langBulgarian → smCyrillic
	45: 7,  // langUkrainian → smCyrillic (modified)
	46: 7,  // langByelorussian → smCyrillic
	47: 7,  // langUzbek → smCyrillic
	48: 7,  // langKazakh → smCyrillic
	49: 7,  // langAzerbaijani → smCyrillic
	50: 4,  // langAzerbaijanAr → smArabic
	51: 24,  // langArmenian → smArmenian
	52: 23,  // langGeorgian → smGeorgian
	53: 7,  // langMoldavian → smCyrillic
	54: 7,  // langKirghiz → smCyrillic
	55: 7,  // langTajiki → smCyrillic
	56: 7,  // langTurkmen → smCyrillic
	57: 27,  // langMongolian → smMongolian
	58: 7,  // langMongolianCyr → smCyrillic
	59: 4,  // langPashto → smArabic
	60: 4,  // langKurdish → smArabic
	61: 4,  // langKashmiri → smArabic
	62: 4,  // langSindhi → smArabic
	63: 26,  // langTibetan → smTibetan
	64: 9,  // langNepali → smDevanagari
	65: 9,  // langSanskrit → smDevanagari
	66: 9,  // langMarathi → smDevanagari
	67: 13,  // langBengali → smBengali
	68: 13,  // langAssamese → smBengali
	69: 11,  // langGujarati → smGujarati
	70: 10,  // langPunjabi → smGurmukhi
	71: 12,  // langOriya → smOriya
	72: 17,  // langMalayalam → smMalayalam
	73: 16,  // langKannada → smKannada
	74: 14,  // langTamil → smTamil
	75: 15,  // langTelugu → smTelugu
	76: 18,  // langSinhalese → smSinhalese
	77: 19,  // langBurmese → smBurmese
	78: 20,  // langKhmer → smKhmer
	79: 22,  // langLao → smLao
	80: 30,  // langVietnamese → smVietnamese
	81: 0,  // langIndonesian → smRoman
	82: 0,  // langTagalog → smRoman
	83: 0,  // langMalayRoman → smRoman
	84: 4,  // langMalayArabic → smArabic
	85: 28,  // langAmharic → smEthiopic
	86: 28,  // langTigrinya → smEthiopic
	87: 28,  // langOromo → smEthiopic
	88: 0,  // langSomali → smRoman
	89: 0,  // langSwahili → smRoman
	90: 0,  // langKinyarwanda → smRoman
	91: 0,  // langRundi → smRoman
	92: 0,  // langNyanja → smRoman
	93: 0,  // langMalagasy → smRoman
	94: 0,  // langEsperanto → smRoman
	128: 0,  // langWelsh → smRoman (modified)
	129: 0,  // langBasque → smRoman
	130: 0,  // langCatalan → smRoman
	131: 0,  // langLatin → smRoman
	132: 0,  // langQuechua → smRoman
	133: 0,  // langGuarani → smRoman
	134: 0,  // langAymara → smRoman
	135: 7,  // langTatar → smCyrillic
	136: 4,  // langUighur → smArabic
	137: 26,  // langDzongkha → smTibetan
	138: 0,  // langJavaneseRom → smRoman
	139: 0,  // langSundaneseRom → smRoman
	140: 0,  // langGalician → smRoman
	141: 0,  // langAfrikaans → smRoman
	142: 0,  // langBreton → smRoman (modified)
	143: 28,  // langInuktitut → smEthiopic (modified)
	144: 0,  // langScottishGaelic → smRoman (modified)
	145: 0,  // langManxGaelic → smRoman (modified)
	146: 0,  // langIrishGaelicScript → smRoman (modified)
	147: 0,  // langTongan → smRoman
	148: 6,  // langGreekAncient → smRoman
	149: 0,  // langGreenlandic → smRoman
	150: 0,  // langAzerbaijanRoman → smRoman
	151: 0   // langNynorsk → smRoman
}

// While Microsoft indicates a region/country for all its language
// IDs, we omit the region code if it's equal to the "most likely
// region subtag" according to Unicode CLDR. For scripts, we omit
// the subtag if it is equal to the Suppress-Script entry in the
// IANA language subtag registry for IETF BCP 47.
//
// For example, Microsoft states that its language code 0x041A is
// Croatian in Croatia. We transform this to the BCP 47 language code 'hr'
// and not 'hr-HR' because Croatia is the default country for Croatian,
// according to Unicode CLDR. As another example, Microsoft states
// that 0x101A is Croatian (Latin) in Bosnia-Herzegovina. We transform
// this to 'hr-BA' and not 'hr-Latn-BA' because Latin is the default script
// for the Croatian language, according to IANA.
//
// http://www.unicode.org/cldr/charts/latest/supplemental/likely_subtags.html
// http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
const windowsLanguages = {
	0x0436: 'af',
	0x041C: 'sq',
	0x0484: 'gsw',
	0x045E: 'am',
	0x1401: 'ar-DZ',
	0x3C01: 'ar-BH',
	0x0C01: 'ar',
	0x0801: 'ar-IQ',
	0x2C01: 'ar-JO',
	0x3401: 'ar-KW',
	0x3001: 'ar-LB',
	0x1001: 'ar-LY',
	0x1801: 'ary',
	0x2001: 'ar-OM',
	0x4001: 'ar-QA',
	0x0401: 'ar-SA',
	0x2801: 'ar-SY',
	0x1C01: 'aeb',
	0x3801: 'ar-AE',
	0x2401: 'ar-YE',
	0x042B: 'hy',
	0x044D: 'as',
	0x082C: 'az-Cyrl',
	0x042C: 'az',
	0x046D: 'ba',
	0x042D: 'eu',
	0x0423: 'be',
	0x0845: 'bn',
	0x0445: 'bn-IN',
	0x201A: 'bs-Cyrl',
	0x141A: 'bs',
	0x047E: 'br',
	0x0402: 'bg',
	0x0403: 'ca',
	0x0C04: 'zh-HK',
	0x1404: 'zh-MO',
	0x0804: 'zh',
	0x1004: 'zh-SG',
	0x0404: 'zh-TW',
	0x0483: 'co',
	0x041A: 'hr',
	0x101A: 'hr-BA',
	0x0405: 'cs',
	0x0406: 'da',
	0x048C: 'prs',
	0x0465: 'dv',
	0x0813: 'nl-BE',
	0x0413: 'nl',
	0x0C09: 'en-AU',
	0x2809: 'en-BZ',
	0x1009: 'en-CA',
	0x2409: 'en-029',
	0x4009: 'en-IN',
	0x1809: 'en-IE',
	0x2009: 'en-JM',
	0x4409: 'en-MY',
	0x1409: 'en-NZ',
	0x3409: 'en-PH',
	0x4809: 'en-SG',
	0x1C09: 'en-ZA',
	0x2C09: 'en-TT',
	0x0809: 'en-GB',
	0x0409: 'en',
	0x3009: 'en-ZW',
	0x0425: 'et',
	0x0438: 'fo',
	0x0464: 'fil',
	0x040B: 'fi',
	0x080C: 'fr-BE',
	0x0C0C: 'fr-CA',
	0x040C: 'fr',
	0x140C: 'fr-LU',
	0x180C: 'fr-MC',
	0x100C: 'fr-CH',
	0x0462: 'fy',
	0x0456: 'gl',
	0x0437: 'ka',
	0x0C07: 'de-AT',
	0x0407: 'de',
	0x1407: 'de-LI',
	0x1007: 'de-LU',
	0x0807: 'de-CH',
	0x0408: 'el',
	0x046F: 'kl',
	0x0447: 'gu',
	0x0468: 'ha',
	0x040D: 'he',
	0x0439: 'hi',
	0x040E: 'hu',
	0x040F: 'is',
	0x0470: 'ig',
	0x0421: 'id',
	0x045D: 'iu',
	0x085D: 'iu-Latn',
	0x083C: 'ga',
	0x0434: 'xh',
	0x0435: 'zu',
	0x0410: 'it',
	0x0810: 'it-CH',
	0x0411: 'ja',
	0x044B: 'kn',
	0x043F: 'kk',
	0x0453: 'km',
	0x0486: 'quc',
	0x0487: 'rw',
	0x0441: 'sw',
	0x0457: 'kok',
	0x0412: 'ko',
	0x0440: 'ky',
	0x0454: 'lo',
	0x0426: 'lv',
	0x0427: 'lt',
	0x082E: 'dsb',
	0x046E: 'lb',
	0x042F: 'mk',
	0x083E: 'ms-BN',
	0x043E: 'ms',
	0x044C: 'ml',
	0x043A: 'mt',
	0x0481: 'mi',
	0x047A: 'arn',
	0x044E: 'mr',
	0x047C: 'moh',
	0x0450: 'mn',
	0x0850: 'mn-CN',
	0x0461: 'ne',
	0x0414: 'nb',
	0x0814: 'nn',
	0x0482: 'oc',
	0x0448: 'or',
	0x0463: 'ps',
	0x0415: 'pl',
	0x0416: 'pt',
	0x0816: 'pt-PT',
	0x0446: 'pa',
	0x046B: 'qu-BO',
	0x086B: 'qu-EC',
	0x0C6B: 'qu',
	0x0418: 'ro',
	0x0417: 'rm',
	0x0419: 'ru',
	0x243B: 'smn',
	0x103B: 'smj-NO',
	0x143B: 'smj',
	0x0C3B: 'se-FI',
	0x043B: 'se',
	0x083B: 'se-SE',
	0x203B: 'sms',
	0x183B: 'sma-NO',
	0x1C3B: 'sms',
	0x044F: 'sa',
	0x1C1A: 'sr-Cyrl-BA',
	0x0C1A: 'sr',
	0x181A: 'sr-Latn-BA',
	0x081A: 'sr-Latn',
	0x046C: 'nso',
	0x0432: 'tn',
	0x045B: 'si',
	0x041B: 'sk',
	0x0424: 'sl',
	0x2C0A: 'es-AR',
	0x400A: 'es-BO',
	0x340A: 'es-CL',
	0x240A: 'es-CO',
	0x140A: 'es-CR',
	0x1C0A: 'es-DO',
	0x300A: 'es-EC',
	0x440A: 'es-SV',
	0x100A: 'es-GT',
	0x480A: 'es-HN',
	0x080A: 'es-MX',
	0x4C0A: 'es-NI',
	0x180A: 'es-PA',
	0x3C0A: 'es-PY',
	0x280A: 'es-PE',
	0x500A: 'es-PR',

	// Microsoft has defined two different language codes for
	// “Spanish with modern sorting” and “Spanish with traditional
	// sorting”. This makes sense for collation APIs, and it would be
	// possible to express this in BCP 47 language tags via Unicode
	// extensions (eg., es-u-co-trad is Spanish with traditional
	// sorting). However, for storing names in fonts, the distinction
	// does not make sense, so we give “es” in both cases.
	0x0C0A: 'es',
	0x040A: 'es',

	0x540A: 'es-US',
	0x380A: 'es-UY',
	0x200A: 'es-VE',
	0x081D: 'sv-FI',
	0x041D: 'sv',
	0x045A: 'syr',
	0x0428: 'tg',
	0x085F: 'tzm',
	0x0449: 'ta',
	0x0444: 'tt',
	0x044A: 'te',
	0x041E: 'th',
	0x0451: 'bo',
	0x041F: 'tr',
	0x0442: 'tk',
	0x0480: 'ug',
	0x0422: 'uk',
	0x042E: 'hsb',
	0x0420: 'ur',
	0x0843: 'uz-Cyrl',
	0x0443: 'uz',
	0x042A: 'vi',
	0x0452: 'cy',
	0x0488: 'wo',
	0x0485: 'sah',
	0x0478: 'ii',
	0x046A: 'yo'
}

// Returns a IETF BCP 47 language code, for example 'zh-Hant'
// for 'Chinese in the traditional script'.
function getLanguageCode(platformID: number, languageID: number, ltag: Array<any>) {
	switch (platformID) {
		case 0:  // Unicode
			if (languageID === 0xFFFF) {
					return 'und';
			} else if (ltag) {
					return ltag[languageID];
			}

			break;

		case 1:  // Macintosh
			return macLanguages[languageID as keyof typeof macLanguages]

		case 3:  // Windows
			return windowsLanguages[languageID as keyof typeof windowsLanguages]
	}

	return undefined
}

const utf16 = 'utf-16'

// MacOS script ID → encoding. This table stores the default case,
// which can be overridden by macLanguageEncodings.
const macScriptEncodings = {
	0: 'macintosh',           // smRoman
	1: 'x-mac-japanese',      // smJapanese
	2: 'x-mac-chinesetrad',   // smTradChinese
	3: 'x-mac-korean',        // smKorean
	6: 'x-mac-greek',         // smGreek
	7: 'x-mac-cyrillic',      // smCyrillic
	9: 'x-mac-devanagai',     // smDevanagari
	10: 'x-mac-gurmukhi',     // smGurmukhi
	11: 'x-mac-gujarati',     // smGujarati
	12: 'x-mac-oriya',        // smOriya
	13: 'x-mac-bengali',      // smBengali
	14: 'x-mac-tamil',        // smTamil
	15: 'x-mac-telugu',       // smTelugu
	16: 'x-mac-kannada',      // smKannada
	17: 'x-mac-malayalam',    // smMalayalam
	18: 'x-mac-sinhalese',    // smSinhalese
	19: 'x-mac-burmese',      // smBurmese
	20: 'x-mac-khmer',        // smKhmer
	21: 'x-mac-thai',         // smThai
	22: 'x-mac-lao',          // smLao
	23: 'x-mac-georgian',     // smGeorgian
	24: 'x-mac-armenian',     // smArmenian
	25: 'x-mac-chinesesimp',  // smSimpChinese
	26: 'x-mac-tibetan',      // smTibetan
	27: 'x-mac-mongolian',    // smMongolian
	28: 'x-mac-ethiopic',     // smEthiopic
	29: 'x-mac-ce',           // smCentralEuroRoman
	30: 'x-mac-vietnamese',   // smVietnamese
	31: 'x-mac-extarabic'     // smExtArabic
}

// MacOS language ID → encoding. This table stores the exceptional
// cases, which override macScriptEncodings. For writing MacOS naming
// tables, we need to emit a MacOS script ID. Therefore, we cannot
// merge macScriptEncodings into macLanguageEncodings.
//
// http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/Readme.txt
const macLanguageEncodings = {
	15: 'x-mac-icelandic',    // langIcelandic
	17: 'x-mac-turkish',      // langTurkish
	18: 'x-mac-croatian',     // langCroatian
	24: 'x-mac-ce',           // langLithuanian
	25: 'x-mac-ce',           // langPolish
	26: 'x-mac-ce',           // langHungarian
	27: 'x-mac-ce',           // langEstonian
	28: 'x-mac-ce',           // langLatvian
	30: 'x-mac-icelandic',    // langFaroese
	37: 'x-mac-romanian',     // langRomanian
	38: 'x-mac-ce',           // langCzech
	39: 'x-mac-ce',           // langSlovak
	40: 'x-mac-ce',           // langSlovenian
	143: 'x-mac-inuit',       // langInuktitut
	146: 'x-mac-gaelic'       // langIrishGaelicScript
}

interface IMap {
	[key: string | number]: any
}

type IArr = Array<number | string>

function getEncoding(platformID: number, encodingID: number, languageID: number) {
	switch (platformID) {
		case 0:  // Unicode
			return utf16

		case 1:  // Apple Macintosh
			return macLanguageEncodings[languageID as keyof typeof macLanguageEncodings] || macScriptEncodings[encodingID as keyof typeof macScriptEncodings]

		case 3:  // Microsoft Windows
			if (encodingID === 1 || encodingID === 10) {
				return utf16
			}

			break
	}

	return undefined;
}

const reverseDict = (dict: IMap | IArr) => {
	const result: IMap = {}
	for (let key in dict) {
		result[dict[key]] = parseInt(key)
	}

	return result
}

const findSubArray = (needle: string | Array<number>, haystack: Array<any>,) => {
	const needleLength = needle.length
	const limit = haystack.length - needleLength + 1

	loop:
	for (let pos = 0; pos < limit; pos++) {
		for (; pos < limit; pos++) {
			for (let k = 0; k < needleLength; k++) {
				if (haystack[pos + k] !== needle[k]) {
					continue loop
				}
			}

			return pos
		}
	}

	return -1
}

const addStringToPool = (s: string | Array<number>, pool: Array<any>,) => {
	let offset = findSubArray(s, pool)
	if (offset < 0) {
		offset = pool.length
		let i = 0
		const len = s.length
		for (; i < len; ++i) {
			pool.push(s[i])
		}
	}
	return offset
}

const eightBitMacEncodings = {
	'x-mac-croatian':  // Python: 'mac_croatian'
	'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø' +
	'¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊©⁄€‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ',
	'x-mac-cyrillic':  // Python: 'mac_cyrillic'
	'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњ' +
	'јЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю',
	'x-mac-gaelic': // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/GAELIC.TXT
	'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØḂ±≤≥ḃĊċḊḋḞḟĠġṀæø' +
	'ṁṖṗɼƒſṠ«»… ÀÃÕŒœ–—“”‘’ṡẛÿŸṪ€‹›Ŷŷṫ·Ỳỳ⁊ÂÊÁËÈÍÎÏÌÓÔ♣ÒÚÛÙıÝýŴŵẄẅẀẁẂẃ',
	'x-mac-greek':  // Python: 'mac_greek'
	'Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦€ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩ' +
	'άΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ\u00AD',
	'x-mac-icelandic':  // Python: 'mac_iceland'
	'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' +
	'¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
	'x-mac-inuit': // http://unicode.org/Public/MAPPINGS/VENDORS/APPLE/INUIT.TXT
	'ᐃᐄᐅᐆᐊᐋᐱᐲᐳᐴᐸᐹᑉᑎᑏᑐᑑᑕᑖᑦᑭᑮᑯᑰᑲᑳᒃᒋᒌᒍᒎᒐᒑ°ᒡᒥᒦ•¶ᒧ®©™ᒨᒪᒫᒻᓂᓃᓄᓅᓇᓈᓐᓯᓰᓱᓲᓴᓵᔅᓕᓖᓗ' +
	'ᓘᓚᓛᓪᔨᔩᔪᔫᔭ… ᔮᔾᕕᕖᕗ–—“”‘’ᕘᕙᕚᕝᕆᕇᕈᕉᕋᕌᕐᕿᖀᖁᖂᖃᖄᖅᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖠᖡᖢᖣᖤᖥᖦᕼŁł',
	'x-mac-ce':  // Python: 'mac_latin2'
	'ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅ' +
	'ņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ',
	macintosh:  // Python: 'mac_roman'
	'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' +
	'¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
	'x-mac-romanian':  // Python: 'mac_romanian'
	'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂȘ∞±≤≥¥µ∂∑∏π∫ªºΩăș' +
	'¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›Țț‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
	'x-mac-turkish':  // Python: 'mac_turkish'
	'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' +
	'¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙˆ˜¯˘˙˚¸˝˛ˇ'
}

// Helper function for encodeMACSTRING. Returns a dictionary for mapping
// Unicode character codes to their 8-bit MacOS equivalent. This table
// is not exactly a super cheap data structure, but we do not care because
// encoding Macintosh strings is only rarely needed in typical applications.
const macEncodingTableCache = typeof WeakMap === 'function' && new WeakMap();
let macEncodingCacheKeys: IMap
const getMacEncodingTable = (encoding: string) => {
	// Since we use encoding as a cache key for WeakMap, it has to be
	// a String object and not a literal. And at least on NodeJS 2.10.1,
	// WeakMap requires that the same String instance is passed for cache hits.
	if (!macEncodingCacheKeys) {
		macEncodingCacheKeys = {}
		for (let e in eightBitMacEncodings) {
			/*jshint -W053 */  // Suppress "Do not use String as a constructor."
			macEncodingCacheKeys[e] = new String(e)
		}
	}

	const cacheKey = macEncodingCacheKeys[encoding]
	if (cacheKey === undefined) {
		return undefined
	}

	// We can't do "if (cache.has(key)) {return cache.get(key)}" here:
	// since garbage collection may run at any time, it could also kick in
	// between the calls to cache.has() and cache.get(). In that case,
	// we would return 'undefined' even though we do support the encoding.
	if (macEncodingTableCache) {
		const cachedTable = macEncodingTableCache.get(cacheKey);
		if (cachedTable !== undefined) {
			return cachedTable
		}
	}

	const decodingTable = eightBitMacEncodings[encoding as keyof typeof eightBitMacEncodings]
	if (decodingTable === undefined) {
		return undefined
	}

	const encodingTable: IMap = {}
	for (let i = 0; i < decodingTable.length; i++) {
		encodingTable[decodingTable.charCodeAt(i)] = i + 0x80
	}

	if (macEncodingTableCache) {
		macEncodingTableCache.set(cacheKey, encodingTable)
	}

	return encodingTable
}

const encodeMACSTRING = (str: string, encoding: string | undefined) => {
	const table = getMacEncodingTable(encoding as string)
	if (table === undefined) {
		return []
	}

	const result = []
	for (let i = 0; i < str.length; i++) {
		let c = str.charCodeAt(i)

		// In all eight-bit Mac encodings, the characters 0x00..0x7F are
		// mapped to U+0000..U+007F; we only need to look up the others.
		if (c >= 0x80) {
			c = table[c]
			if (c === undefined) {
				// str contains a Unicode character that cannot be encoded
				// in the requested encoding.
				return []
			}
		}
		result[i] = c
		// result.push(c);
	}

	return result
}

interface IPlainNameRecord {
	nameID: number,
	nameLabel: string,
	platformID: number,
	encodingID: number,
	langID: number,
	value: string,
	default: boolean,
}

const createTable2 = (names: Array<any>) => {
	const nameRecord = [];
	const stringPool: Array<any> = []

	for (let i = 0; i < names.length; i++) {
		const { value, nameID, langID, encodingID, platformID } = names[i]
		if (platformID != 3) break
		let winName = encoder.utf16(value)
		const winNameOffset = addStringToPool(winName, stringPool)
		nameRecord.push({
			platformID: 3,
			encodingID: encodingID,
			languageID: langID,
			nameID: nameID,
			length: winName.length,
			stringOffset: winNameOffset,
		})
	}

	nameRecord.sort(function(a, b) {
		return ((a.platformID - b.platformID) ||
						(a.encodingID - b.encodingID) ||
						(a.languageID - b.languageID) ||
						(a.nameID - b.nameID))
	})

	const nameTable = {
		version: 0,
		count: nameRecord.length,
		storageOffset: 6 + nameRecord.length * 12,
		nameRecord,
		stringPool,
	}
	return nameTable
}

/**
 * 根据 names 和 ltag 创建name表
 * @param names 包含names信息的数组
 * @param ltag 包含language信息的ltag数组
 * @returns name表
 */
/**
 * create name table according to names and ltag
 * @param names names array
 * @param ltag ltag array
 * @returns name table
 */
const createTable = (names: Array<any>, ltag: Array<any>) => {
	let nameID
	const nameIDs = []

	const namesWithNumericKeys: IMap = {}
	const nameTableIds = reverseDict(nameTableNames)
	for (let key in names) {
		let id = nameTableIds[key]
		if (id === undefined) {
			id = key
		}

		nameID = parseInt(id as string)

		if (isNaN(nameID)) {
			throw new Error('Name table entry "' + key + '" does not exist, see nameTableNames for complete list.');
		}

		namesWithNumericKeys[nameID] = names[key]
		nameIDs.push(nameID)
	}

	const macLanguageIds = reverseDict(macLanguages)
	const windowsLanguageIds = reverseDict(windowsLanguages)

	const nameRecord = [];
	const stringPool: Array<any> = []

	for (let i = 0; i < nameIDs.length; i++) {
		nameID = nameIDs[i];
		const translations = namesWithNumericKeys[nameID]
		for (let lang in translations) {
			//if (lang === 'en') continue
			const text = translations[lang]
			// if (text === ' ')
			// 	continue

			// For MacOS, we try to emit the name in the form that was introduced
			// in the initial version of the TrueType spec (in the late 1980s).
			// However, this can fail for various reasons: the requested BCP 47
			// language code might not have an old-style Mac equivalent;
			// we might not have a codec for the needed character encoding;
			// or the name might contain characters that cannot be expressed
			// in the old-style Macintosh encoding. In case of failure, we emit
			// the name in a more modern fashion (Unicode encoding with BCP 47
			// language tags) that is recognized by MacOS 10.5, released in 2009.
			// If fonts were only read by operating systems, we could simply
			// emit all names in the modern form; this would be much easier.
			// However, there are many applications and libraries that read
			// 'name' tables directly, and these will usually only recognize
			// the ancient form (silently skipping the unrecognized names).

			// let macScript = macLanguageToScript[macLanguage as keyof typeof macLanguageToScript]
			// const macEncoding = getEncoding(macPlatform, macScript, macLanguage)
			// let macName = encodeMACSTRING(text, macEncoding)
			// if (macName === undefined) {
			// 	macPlatform = 0;  // Unicode
			// 	macLanguage = ltag.indexOf(lang)
			// 	if (macLanguage < 0) {
			// 		macLanguage = ltag.length
			// 		ltag.push(lang)
			// 	}

			// 	macScript = 4;  // Unicode 2.0 and later
			// 	macName = encoder.utf16(text)
			// }

			// if (nameID === 1 || nameID === 4 || nameID === 16 || nameID === 3) {
			// 	macLanguage = 2052//macLanguageIds['zh']
			// 	macName = [198, 211, 212, 207, 188, 242, 193, 165]
			// 	//encoder.utf16(text)
			// 	macScript = 25
			// }

			let macPlatform = 1;  // Macintosh
			let macLanguage = macLanguageIds[lang]
			let macName = encoder.utf16(text)
			let encodingID = 0

			if (lang === 'zh') {
				encodingID = 25
				macLanguage = 33
				macName = [...iconv.encode(text, 'gbk')]
			}
			//const macNameOffset = addStringToPool(macName, stringPool)
			
			// if (!((nameID === 1 || nameID === 4 || nameID === 16 || nameID === 3) && lang === 'en')) {
			// 	nameRecord.push({
			// 		platformID: macPlatform,
			// 		encodingID: encodingID,
			// 		languageID: macLanguage,
			// 		nameID: nameID,
			// 		length: macName.length,
			// 		stringOffset: macNameOffset,
			// 	})
			// }

			// nameRecord.push({
			// 	platformID: macPlatform,
			// 	encodingID: encodingID,
			// 	languageID: macLanguage,
			// 	nameID: nameID,
			// 	length: macName.length,
			// 	stringOffset: macNameOffset,
			// })

			let winLanguage = windowsLanguageIds[lang]
			if (winLanguage !== undefined) {
				// if (((nameID === 1 || nameID === 4 || nameID === 16 || nameID === 3) && lang === 'en')) {
				// 	const text = translations['zh']
				// 	let winName = encoder.utf16(text)
				// 	let encodingID = 1
				// 	const winNameOffset = addStringToPool(winName, stringPool)
				// 	nameRecord.push({
				// 		platformID: 3,
				// 		encodingID: encodingID,
				// 		languageID: winLanguage,
				// 		nameID: nameID,
				// 		length: winName.length,
				// 		stringOffset: winNameOffset,
				// 	})
				// } else {
					let winName = encoder.utf16(text)
					let encodingID = 1
					const winNameOffset = addStringToPool(winName, stringPool)
					nameRecord.push({
						platformID: 3,
						encodingID: encodingID,
						languageID: winLanguage,
						nameID: nameID,
						length: winName.length,
						stringOffset: winNameOffset,
					})
				//}

				// if (lang === 'zh') {
				// 	let winName = [...iconv.encode(text, 'gbk')]
				// 	let encodingID = 3
				// 	const winNameOffset = addStringToPool(winName, stringPool)
				// 	nameRecord.push({
				// 		platformID: 3,
				// 		encodingID: encodingID,
				// 		languageID: winLanguage,
				// 		nameID: nameID,
				// 		length: winName.length,
				// 		stringOffset: winNameOffset,
				// 	})
				// }
			}
		}
	}

	nameRecord.sort(function(a, b) {
		return ((a.platformID - b.platformID) ||
						(a.encodingID - b.encodingID) ||
						(a.languageID - b.languageID) ||
						(a.nameID - b.nameID))
	})

	const nameTable = {
		version: 0,
		count: nameRecord.length,
		storageOffset: 6 + nameRecord.length * 12,
		nameRecord,
		stringPool,
	}

	return nameTable
}

/**
 * 根据INameTable对象创建该表的原始数据
 * @param table INameTable table
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * generate raw data from IHheaTable table
 * @param table INameTable table
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (table: INameTable) => {
	let data: Array<number> = []

	// 遍历table的每个键值，生成对应数据
	// traverse table, generate data for each key
	Object.keys(table).forEach((key: string) => {
		const type = types[key as keyof typeof types]
		const value = table[key as keyof typeof table]

		// 使用encoder中的方法，根据不同键值对应的数据类型生成数据
		// generate data use encoder according to each key's data type
		let bytes: Array<number> = []
		if (key === 'nameRecord') {
			const nameRecord = value as Array<INameRecord>
			for (let i = 0; i < nameRecord.length; i++) {
				const record = nameRecord[i]
				Object.keys(record).forEach((key) => {
					if (key !== 'str') {
						const type = types[key as keyof typeof types]
						const value = record[key as keyof typeof record]
						bytes = bytes.concat(encoder[type as keyof typeof encoder](value) as Array<number>)
					}
				})
			}
		} else if (key === 'langTagRecord') {
			const langTagRecord = value as Array<ILangTagRecord>
			for (let i = 0; i < langTagRecord.length; i++) {
				const record = langTagRecord[i]
				Object.keys(record).forEach((key) => {
					if (key !== 'str') {
						const type = types[key as keyof typeof types]
						const value = record[key as keyof typeof record]
						bytes = bytes.concat(encoder[type as keyof typeof encoder](value) as Array<number>)
					}
				})
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
	createTable2,
	nameTableNames,
}

export type {
	INameTable,
}