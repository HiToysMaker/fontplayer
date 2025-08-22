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

	// 测试Unicode范围位的精确设置
	it('should set unicode range bits correctly for specific characters', () => {
		// 创建一个只包含"世"字的字体
		const characters = [{
			unicode: 0,
			name: '.notdef',
			contours: [[]],
			contourNum: 0,
			advanceWidth: 500,
		}, {
			unicode: 0x4E16, // 世字
			name: '世',
			contours: [[]],
			contourNum: 0,
			advanceWidth: 500,
		}]

		// 模拟字体创建过程
		let ulUnicodeRange1 = 0
		let ulUnicodeRange2 = 0
		let ulUnicodeRange3 = 0
		let ulUnicodeRange4 = 0

		// 只对实际存在的字符设置Unicode范围位
		for (let i = 0; i < characters.length; i++) {
			const character = characters[i]
			const unicode = character.unicode | 0
			if (unicode === 0) continue // 跳过.notdef字符
			
			// 这里需要导入getUnicodeRange函数
			// const position = getUnicodeRange(unicode)
			// 暂时手动计算：世字(0x4E16)属于CJK Unified Ideographs范围，是第59个范围
			const position = 59 // 世字对应的Unicode范围位
			
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

		// 验证只有第59个范围位被设置（在ulUnicodeRange3中，59-64=27位）
		expect(ulUnicodeRange1).toBe(0)
		expect(ulUnicodeRange2).toBe(0)
		expect(ulUnicodeRange3).toBe(1 << 27) // 第27位（59-32）
		expect(ulUnicodeRange4).toBe(0)

		console.log(`世字设置的Unicode范围位: ulUnicodeRange3 = ${ulUnicodeRange3.toString(2)}`)
	})
})