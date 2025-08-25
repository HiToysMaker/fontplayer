import { createFont, hasChar } from '@/fontManager/font'
import { describe, it, expect, test } from 'vitest'

describe('font', () => {
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
				control1: {x: 417, y: 545},
				control2: {x: 498, y: 599},
				end: {x: 540, y: 584},
				start: {x: 386, y: 512},
				type: 2,
			},
			{
				control1: {x: 604, y: 560},
				control2: {x: 716, y: 469},
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

	it('create correct number of tables', async () => {
		const font = await createFont(characters, {
			familyName: 'Test',
			styleName: 'Medium',
			unitsPerEm: 1000,
			ascender: 800,
			descender: -200,
		})
		expect(font.tables.length).toBe(9)
	})

	test('hasChar method', async () => {
		const font = await createFont(characters, {
			familyName: 'Test',
			styleName: 'Medium',
			unitsPerEm: 1000,
			ascender: 800,
			descender: -200,
		})
		expect(hasChar(font, 'a')).toBe(true)
	})
})