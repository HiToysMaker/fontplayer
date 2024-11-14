import { describe, it, expect, assert } from 'vitest'
import { parse, create } from '@/fontManager/tables/maxp'
import { hex, unhex, decodeVersion } from '../utils'
import { IFont } from '@/fontManager/font'

describe('maxp table', () => {
	const data = '00 00 50 00 00 02'

	const maxpTable = {
		version: 0x00005000,
		numGlyphs: 2,
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
		assert.deepEqual(parse(unhex(data), 0, font), Object.assign({}, {
			...maxpTable,
			version: decodeVersion(maxpTable.version),
		}))
	})

	it('create data correctly', () => {
		expect(hex(create(maxpTable))).toBe(data)
	})
})