import { describe, it, assert } from 'vitest'
import { listToMap } from '@/utils/data'

describe('data util methods', () => {
  it('convert list to map correctly', () => {
		assert.deepEqual(listToMap([
			{
				uuid: '1',
				x: 1,
				y: 2,
			},
			{
				uuid: '2',
				x: 3,
				y: 4,
			},
			{
				uuid: '3',
				x: 5,
				y: 6,
			}
		], 'uuid'), {
			'1': {
				uuid: '1',
				x: 1,
				y: 2,
			},
			'2': {
				uuid: '2',
				x: 3,
				y: 4,
			},
			'3': {
				uuid: '3',
				x: 5,
				y: 6,
			}
		})
  })
})