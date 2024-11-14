import { describe, it, expect, assert } from 'vitest'
import { parse, create } from '@/fontManager/tables/hmtx'
import { hex, unhex } from '../utils'
import { IFont } from '@/fontManager/font'

describe('hmtx table', () => {
	const data = '01 F4 00 00 01 F4 00 00'

	const hmtxTable = {
		hMetrics: [
			{
				advanceWidth: 500,
				lsb: 0,
			},
			{
				advanceWidth: 500,
				lsb: 0,
			}
		],
		leftSideBearings: [],
	}

	const font: IFont = {
		characters: [],
		settings: {
			unitsPerEm: 1000,
			ascender: 800,
			descender: -200,
			numberOfHMetrics: 2,
			numGlyphs: 2,
		}
	}

  it('parse data correctly', () => {
		assert.deepEqual(parse(unhex(data), 0, font), hmtxTable)
	})

	it('create data correctly', () => {
		expect(hex(create(hmtxTable))).toBe(data)
	})
})