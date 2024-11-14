import { describe, it, expect, assert } from 'vitest'
import { parse, create } from '@/fontManager/tables/hhea'
import { hex, unhex } from '../utils'
import { IFont } from '@/fontManager/font'

describe('hhea table', () => {
	const data = '00 01 00 00 03 20 FF 38 00 00 03 E8 00 00 00 00 03 E8 00 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 02'
	
	const hheaTable = {
		majorVersion: 0x0001,
		minorVersion: 0x0000,
		ascender: 800,
		descender: -200,
		lineGap: 0,
		advanceWidthMax: 1000,
		minLeftSideBearing: 0,
		minRightSideBearing: 0,
		xMaxExtent: 1000,
		caretSlopeRise: 1,
		caretSlopeRun: 0,
		caretOffset: 0,
		reserved0: 0,
		reserved1: 0,
		reserved2: 0,
		reserved3: 0,
		metricDataFormat: 0,
		numberOfHMetrics: 2,
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
		assert.deepEqual(parse(unhex(data), 0, font), hheaTable)
	})

	it('create data correctly', () => {
		expect(hex(create(hheaTable))).toBe(data)
	})
})