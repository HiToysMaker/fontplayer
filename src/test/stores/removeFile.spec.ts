import { describe, it, assert, vi, beforeEach, afterEach, expect } from 'vitest'
import { removeFile, files } from '@/fontEditor/stores/files'

describe('add file', () => {
  beforeEach(() => {
    vi.mock('nanoid', () => {
      return { nanoid: () => 'xxxxxx' }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('remove file correctly', () => {
		const file1 = {
			uuid: '1',
			characterList: [],
			name: 'file1',
			width: 500,
			height: 500,
			saved: false,
			iconsCount: 0,
		}
		const file2 = {
			uuid: '2',
			characterList: [],
			name: 'file2',
			width: 100,
			height: 100,
			saved: false,
			iconsCount: 0,
		}
		files.value = [file1, file2]
		removeFile('1')
    expect(files.value.length).toBe(1)
		assert.deepEqual(files.value[0], file2)
  })
})