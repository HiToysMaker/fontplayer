import { describe, it, expect } from 'vitest'
import { toUnicode } from '@/utils/string'

describe('string util methods', () => {
  it('convert char to unicode correctly', () => {
		expect(toUnicode('a')).toBe('0061')
	})
})