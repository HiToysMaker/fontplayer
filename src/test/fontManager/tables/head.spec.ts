import { describe, it, expect, assert } from 'vitest'
import { parse, create } from '@/fontManager/tables/head'
import { hex, unhex } from '../utils'
import { IFont } from '@/fontManager/font'

describe('head table', () => {
	const data = `00 01 00 00 00 01 00 00 00 00 00 00 5F 0F 3C F5 00 03 03 E8 00 00 00 00 65 1C F6 55 00 00 00 00 65 1C F6 55 00 00 00 00 03 E8 03 E8 00 00 00 03 00 02 00 00 00 00`
	const timestimp = 1696396885
	
	const headTable = {
		majorVersion: 0x0001,
		minorVersion: 0x0000,
		fontRevision: 0x00010000,
		checkSumAdjustment: 0,
		magicNumber: 0x5F0F3CF5,
		flags: 3,
		unitsPerEm: 1000,
		created: timestimp,
		modified: timestimp,
		xMin: 0,
		yMin: 0,
		xMax: 1000,
		yMax: 1000,
		macStyle: 0,
		lowestRecPPEM: 3,
		fontDirectionHint: 2,
		indexToLocFormat: 0,
		glyphDataFormat: 0,
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
		assert.deepEqual(parse(unhex(data), 0, font), headTable)
	})

	it('create data correctly', () => {
		expect(hex(create(headTable))).toBe(data)
	})
})