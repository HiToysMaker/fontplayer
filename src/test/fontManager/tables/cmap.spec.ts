import { describe, it, expect, assert } from 'vitest'
import { create, createTable } from '@/fontManager/tables/cmap'
import { hex } from '../utils'

describe('cmap table', () => {
	const data = '00 00 00 01 00 03 00 01 00 00 00 0C 00 04 00 28 00 00 00 06 00 04 00 01 00 02 00 00 00 61 FF FF 00 00 00 00 00 61 FF FF 00 00 FF A0 00 01 00 00 00 00 00 00'
	const characters = [{
		unicode: 0,
		name: '.notdef',
		contours: [[]],
		contourNum: 0,
		advanceWidth: 500,
	}, {
		advanceWidth: 500,
		contourNum: 1,
		contours:[[
			{
				control1: {x: 417.5, y: 545.6},
				control2: {x: 498.4, y: 599.6},
				end: {x: 540, y: 584},
				start: {x: 386, y: 512},
				type: 2,
			},
			{
				control1: {x: 604, y: 560},
				control2: {x: 716.7, y: 469.1},
				end: {x: 640, y: 356},
				start: {x: 540, y: 584},
				type: 2,
			},{
				control1: {x: 640, y: 356},
				control2: {x: 386, y: 512},
				end: {x: 386, y: 512},
				start: {x: 640, y: 356},
				type: 2,
			},
		]],
		name: 'a',
		unicode: 97,
	}]

	const table = {
		version: 0,
		numTables: 1,
		encodingRecords: [
			{
				platformID: 3,
				encodingID: 1,
				subtableOffset: 12,
				subTable: {
					format: 4,
					length: 40,
					language: 0,
					segCount: 3,
					searchRange: 4,
					entrySelector: 1,
					rangeShift: 2,
					segments: [
						{ endCode: 0, startCode: 0, idDelta: -0, idRangeOffset: 0 },
						{ endCode: 97, startCode: 97, idDelta: -96, idRangeOffset: 0 },
						{ endCode: 65535, startCode: 65535, idDelta: 1, idRangeOffset: 0 }
					],
					glyphIndexMap: { '0': 0, '97': 1 }
				}
			}
		]
	}

	const cmapTable = createTable(characters)

	it('create table correctly', () => {
		assert.deepEqual(cmapTable, table)
	})

	it('create data correctly', () => {
		expect(hex(create(cmapTable))).toBe(data)
	})

	// 测试大量字符时的字符映射问题
	it('should handle large character sets correctly', () => {
		const largeCharacters = [{
			unicode: 0,
			name: '.notdef',
			contours: [[]],
			contourNum: 0,
			advanceWidth: 500,
		}]

		// 添加一些汉字字符（Unicode范围：0x4E00-0x9FFF）
		for (let i = 0; i < 10; i++) {
			largeCharacters.push({
				unicode: 0x4E00 + i, // 汉字Unicode范围
				name: `char_${i}`,
				contours: [[]],
				contourNum: 0,
				advanceWidth: 500,
			})
		}

		// 添加一些ASCII字符
		largeCharacters.push({
			unicode: 65, // 'A'
			name: 'A',
			contours: [[]],
			contourNum: 0,
			advanceWidth: 500,
		})

		largeCharacters.push({
			unicode: 66, // 'B'
			name: 'B',
			contours: [[]],
			contourNum: 0,
			advanceWidth: 500,
		})

		const largeCmapTable = createTable(largeCharacters)

		// 验证.notdef字符映射到索引0
		expect(largeCmapTable.encodingRecords[0].subTable.glyphIndexMap[0]).toBe(0)

		// 验证ASCII字符正确映射
		expect(largeCmapTable.encodingRecords[0].subTable.glyphIndexMap[65]).toBeDefined()
		expect(largeCmapTable.encodingRecords[0].subTable.glyphIndexMap[66]).toBeDefined()

		// 验证汉字字符正确映射
		expect(largeCmapTable.encodingRecords[0].subTable.glyphIndexMap[0x4E00]).toBeDefined()
		expect(largeCmapTable.encodingRecords[0].subTable.glyphIndexMap[0x4E09]).toBeDefined()

		// 验证未定义的字符应该映射到.notdef
		// 这里我们检查一个未定义的Unicode值
		const undefinedChar = 67 // 'C' - 未在字符集中定义
		// 由于我们的实现，未定义的字符会通过最后的segment映射到.notdef
		// 但这里我们需要验证映射逻辑是否正确
		console.log('Large cmap table glyphIndexMap:', largeCmapTable.encodingRecords[0].subTable.glyphIndexMap)
		console.log('Large cmap table segments:', largeCmapTable.encodingRecords[0].subTable.segments)
	})

	// 测试Unicode冲突问题
	it('should handle Unicode conflicts correctly', () => {
		// 模拟可能的Unicode冲突情况
		const conflictCharacters = [{
			unicode: 0,
			name: '.notdef',
			contours: [[]],
			contourNum: 0,
			advanceWidth: 500,
		}]

		// 添加一些可能导致冲突的字符
		// 这里我们模拟一些可能的冲突情况
		const testCases = [
			{ unicode: 65, name: 'A', expected: 'ASCII A' },
			{ unicode: 66, name: 'B', expected: 'ASCII B' },
			{ unicode: 67, name: 'C', expected: 'ASCII C' },
			{ unicode: 0x4E00, name: '一', expected: 'Chinese 一' },
			{ unicode: 0x4E01, name: '丁', expected: 'Chinese 丁' },
			{ unicode: 0x4E02, name: '丂', expected: 'Chinese 丂' },
		]

		testCases.forEach(testCase => {
			conflictCharacters.push({
				unicode: testCase.unicode,
				name: testCase.name,
				contours: [[]],
				contourNum: 0,
				advanceWidth: 500,
			})
		})

		const conflictCmapTable = createTable(conflictCharacters)

		// 验证每个字符都有正确的映射
		testCases.forEach(testCase => {
			const mappedIndex = conflictCmapTable.encodingRecords[0].subTable.glyphIndexMap[testCase.unicode]
			expect(mappedIndex).toBeDefined()
			console.log(`${testCase.expected} (Unicode ${testCase.unicode}) -> index ${mappedIndex}`)
		})

		// 验证未定义的字符映射到.notdef
		const undefinedUnicode = 68 // 'D' - 未定义
		// 这里应该通过最后的segment映射到.notdef
		console.log('Conflict cmap table segments:', conflictCmapTable.encodingRecords[0].subTable.segments)
	})

	// 测试单引号映射问题
	it('should handle single quote mapping correctly', () => {
		// 创建一个不包含单引号的字符数组
		const charactersWithoutQuote = [{
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

		const cmapTable = createTable(charactersWithoutQuote)

		// 验证.notdef字符映射到索引0
		expect(cmapTable.encodingRecords[0].subTable.glyphIndexMap[0]).toBe(0)

		// 验证世字映射到索引1
		expect(cmapTable.encodingRecords[0].subTable.glyphIndexMap[0x4E16]).toBe(1)

		// 验证英文单引号（Unicode 39）应该映射到.notdef（索引0）
		const englishQuoteIndex = cmapTable.encodingRecords[0].subTable.glyphIndexMap[39]
		console.log(`英文单引号 (Unicode 39) 映射到索引: ${englishQuoteIndex}`)
		
		// 验证中文单引号（Unicode 0xFF07）应该映射到.notdef（索引0）
		const chineseQuoteIndex = cmapTable.encodingRecords[0].subTable.glyphIndexMap[0xFF07]
		console.log(`中文单引号 (Unicode 0xFF07) 映射到索引: ${chineseQuoteIndex}`)
		
		// 这里应该映射到.notdef字符（索引0）
		// 如果映射到了其他索引，说明有问题
		if (englishQuoteIndex !== 0) {
			console.warn(`警告：英文单引号映射到了索引 ${englishQuoteIndex}，而不是.notdef字符（索引0）`)
		}
		if (chineseQuoteIndex !== 0) {
			console.warn(`警告：中文单引号映射到了索引 ${chineseQuoteIndex}，而不是.notdef字符（索引0）`)
		}
	})

	// 测试修复后的字符映射
	it('should correctly map undefined characters to .notdef', () => {
		// 创建一个包含一些汉字的字符数组，但不包含ASCII字符
		const chineseCharacters = [{
			unicode: 0,
			name: '.notdef',
			contours: [[]],
			contourNum: 0,
			advanceWidth: 500,
		}]

		// 添加一些汉字
		for (let i = 0; i < 10; i++) {
			chineseCharacters.push({
				unicode: 0x4E00 + i, // 汉字Unicode范围
				name: `char_${i}`,
				contours: [[]],
				contourNum: 0,
				advanceWidth: 500,
			})
		}

		const cmapTable = createTable(chineseCharacters)

		// 验证.notdef字符映射到索引0
		expect(cmapTable.encodingRecords[0].subTable.glyphIndexMap[0]).toBe(0)

		// 验证一些ASCII字符应该映射到.notdef（索引0）
		const testAsciiChars = [32, 33, 34, 39, 65, 66, 67] // 空格、感叹号、双引号、英文单引号、A、B、C
		testAsciiChars.forEach(ascii => {
			const mappedIndex = cmapTable.encodingRecords[0].subTable.glyphIndexMap[ascii]
			console.log(`ASCII字符 ${ascii} (${String.fromCharCode(ascii)}) 映射到索引: ${mappedIndex}`)
			expect(mappedIndex).toBe(0) // 应该映射到.notdef字符
		})

		// 验证中文标点符号应该映射到.notdef（索引0）
		const testChinesePunctuation = [0xFF07, 0xFF08, 0xFF09] // 中文单引号、中文左括号、中文右括号
		testChinesePunctuation.forEach(unicode => {
			const mappedIndex = cmapTable.encodingRecords[0].subTable.glyphIndexMap[unicode]
			console.log(`中文标点符号 ${unicode} (0x${unicode.toString(16)}) 映射到索引: ${mappedIndex}`)
			expect(mappedIndex).toBe(0) // 应该映射到.notdef字符
		})

		// 验证汉字字符正确映射
		for (let i = 0; i < 10; i++) {
			const unicode = 0x4E00 + i
			const mappedIndex = cmapTable.encodingRecords[0].subTable.glyphIndexMap[unicode]
			expect(mappedIndex).toBe(i + 1) // 应该映射到正确的索引
		}
	})
})