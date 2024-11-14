import { describe, it, expect, assert } from 'vitest'
import { parse, create } from '@/fontManager/tables/post'
import { hex, unhex, decodeVersion } from '../utils'
import { IFont } from '@/fontManager/font'

describe('post table', () => {
  const data = '00 03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00'

  const postTable = {
		version: 0x00030000,
		italicAngle: 0,
		underlinePosition: 0,
		underlineThickness: 0,
		isFixedPitch: 0,
		minMemType42: 0,
		maxMemType42: 0,
		minMemType1: 0,
		maxMemType1: 0,
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
			...postTable,
			version: decodeVersion(postTable.version)
		}))
  })

  it('create data correctly', () => {
    expect(hex(create(postTable))).toBe(data)
  })
})