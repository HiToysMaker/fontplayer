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
})