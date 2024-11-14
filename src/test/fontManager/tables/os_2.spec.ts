import { describe, it, expect, assert } from 'vitest'
import { parse, create } from '@/fontManager/tables/os_2'
import { hex, unhex } from '../utils'
import { IFont } from '@/fontManager/font'

describe('os/2 table', () => {
	interface ITag {
		tagArr: Array<number>,
		tagStr: string,
	}

	const data = '00 03 03 E8 00 00 00 00 00 00 02 8A 02 BB 00 00 00 8C 02 8A 02 BB 00 00 01 DF 00 31 01 02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 58 58 58 58 00 00 00 00 00 00 03 20 FF 38 00 00 03 E8 00 00 00 00 00 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00'
	
	const os2Table = {
		version: 0x0003,
		xAvgCharWidth: Math.round(1000),
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
		ulUnicodeRange1: 0,
		ulUnicodeRange2: 0,
		ulUnicodeRange3: 0,
		ulUnicodeRange4: 0,
		achVendID: 'XXXX',
		fsSelection: 0,
		usFirstCharIndex: 0,
		usLastCharIndex: 0,
		sTypoAscender: 800,
		sTypoDescender: -200,
		sTypoLineGap: 0,
		usWinAscent: 1000,
		usWinDescent: 0,
		ulCodePageRange1: 1,
		ulCodePageRange2: 0,
		sxHeight: 0,
		sCapHeight: 0,
		usDefaultChar: 0,
		usBreakChar: 0,
		usMaxContext: 0,
	}

	const font: IFont = {
		characters: [],
		settings: {
			unitsPerEm: 1000,
			ascender: 800,
			descender: -200,
		}
	}

  it('parse data correctly', () => {
		const table = parse(unhex(data), 0, font)
		table.achVendID = (table.achVendID as ITag).tagStr
		assert.deepEqual(table, os2Table)
	})

	it('create data correctly', () => {
		expect(hex(create(os2Table))).toBe(data)
	})
})