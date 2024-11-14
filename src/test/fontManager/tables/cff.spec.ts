import { describe, it, expect, assert } from 'vitest'
import { create, createTable } from '@/fontManager/tables/cff'
import { hex } from '../utils'

describe('cff table', () => {
	const data = '01 00 04 01 00 01 01 01 0B 54 65 73 74 4D 65 64 69 75 6D 00 01 01 01 27 F8 1C 00 F8 1D 02 F8 1E 03 F8 1F 04 8B 8B F9 B4 F8 88 05 1D 00 00 00 6A 0F 1D 00 00 00 6D 11 8B 1D 00 00 00 97 12 00 05 01 01 02 0D 18 1C 22 61 56 65 72 73 69 6F 6E 20 30 2E 31 54 65 73 74 20 4D 65 64 69 75 6D 54 65 73 74 4D 65 64 69 75 6D 00 00 00 01 87 00 02 01 01 04 25 F8 88 0E F8 88 F8 16 F8 94 15 AB AD DC C1 B5 7B 08 CB 73 F7 05 30 3E FB 05 08 8B 8B FB 92 F7 30 8B 8B 08 0E'
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

	const cffTable = createTable(characters, {
		version: 'Version 0.1',
		fullName: 'Test Medium',
		familyName: 'Test',
		weightName: 'Medium',
		postScriptName: 'TestMedium',
		unitsPerEm: 1000,
		fontBBox: [0, 0, 800, 500]
	})

	const table = {
		header: { major: 1, minor: 0, hdrSize: 4, offSize: 1 },
		nameIndex: { data: [ 'TestMedium' ] },
		globalSubrIndex: { data: [] },
		topDict: {
			version: 'Version 0.1',
			fullName: 'Test Medium',
			familyName: 'Test',
			weight: 'Medium',
			fontBBox: [ 0, 0, 800, 500 ],
			fontMatrix: [ 0.001, 0, 0, 0.001, 0, 0 ],
			charset: 999,
			encoding: 0,
			charStrings: 999,
			private: [ 0, 999 ]
		},
		charsets: { format: 0, data: [ 'a' ] },
		glyphTables: [
			{ numberOfContours: 0, contours: [[]], advanceWidth: 500 },
			{ numberOfContours: 1, contours: [[
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
			]], advanceWidth: 500 }
		],
		stringIndex: { data: [] }
	}

	it('create table correctly', () => {
		assert.deepEqual(cffTable, table)
	})

	it('create data correctly', () => {
		expect(hex(create(cffTable))).toBe(data)
	})
})