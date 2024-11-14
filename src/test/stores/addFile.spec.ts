import { describe, it, assert, vi, beforeEach, afterEach, expect } from 'vitest'
import { addFile, files } from '@/fontEditor/stores/files'
import { genUUID } from '@/utils/string'

describe('add file', () => {
  beforeEach(() => {
    vi.mock('nanoid', () => {
      return { nanoid: () => 'xxxxxx' }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('has correct files\' length after adding files', () => {
		files.value = []
		const file1 = {
			uuid: genUUID(),
			characterList: [],
			name: 'file1',
			width: 500,
			height: 500,
			saved: false,
			iconsCount: 0,
		}
		const file2 = {
			uuid: genUUID(),
			characterList: [],
			name: 'file2',
			width: 100,
			height: 100,
			saved: false,
			iconsCount: 0,
		}
		addFile(file1)
		addFile(file2)
    expect(files.value.length).toBe(2)
  })

	it('add file correctly into files array', () => {
		files.value = []
		const file1 = {
			uuid: genUUID(),
			characterList: [],
			name: 'file1',
			width: 500,
			height: 500,
			saved: false,
			iconsCount: 0,
		}
		addFile(file1)
		assert.deepEqual(files.value[0], file1)
	})
})