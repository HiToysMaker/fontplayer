import { describe, it, expect, assert } from 'vitest'
import { modifyComponentForCurrentCharacterFile, files, editCharacterFileUUID, selectedFileUUID, IComponentValue } from '@/fontEditor/stores/files'
import { genUUID, toUnicode } from '@/utils/string'

describe('add component for current character', () => {
	files.value = [{
		uuid: 'file-1',
		characterList: [
			{
				uuid: 'char-1',
				type: 'text',
				character: {
					uuid: genUUID(),
					text: 'a',
					unicode: toUnicode('a'),
					//@ts-ignore
					components: [],
				},
				components: [
					{
						uuid: 'comp-1',
						type: 'rectangle',
						name: 'rectangle',
						lock: false,
						visible: true,
						value: {
							width: 10,
							height: 10,
							fillColor: '',
							strokeColor: '#000',
						} as unknown as IComponentValue,
						x: 0,
						y: 0,
						w: 10,
						h: 10,
						rotation: 0,
						flipX: false,
						flipY: false,
						usedInCharacter: true,
					}
				],
				groups: [],
				orderedList: [{ uuid: 'comp-1', type: 'rectangle' }],
				selectedComponentsUUIDs: [],
				view: {
					zoom: 100,
					translateX: 0,
					translateY: 0,
				}
			}
		],
		name: 'file1',
		width: 500,
		height: 500,
		saved: false,
		iconsCount: 0,
	}]
	selectedFileUUID.value = 'file-1'
	editCharacterFileUUID.value = 'char-1'
	modifyComponentForCurrentCharacterFile('comp-1', {
		x: 10,
		y: 10,
		w: 100,
		h: 100,
		rotation: 10,
		flipX: true,
		flipY: true,
		usedInCharacter: false,
		value: {
			width: 100,
			height: 100,
			fillColor: 'white',
			strokeColor: '#fff',
		}
	})

  it('modify x correctly', () => {
    expect(files.value[0].characterList[0].components[0].x).toBe(10)
  })

	it('modify y correctly', () => {
    expect(files.value[0].characterList[0].components[0].y).toBe(10)
  })

	it('modify w correctly', () => {
    expect(files.value[0].characterList[0].components[0].w).toBe(100)
  })

	it('modify h correctly', () => {
    expect(files.value[0].characterList[0].components[0].h).toBe(100)
  })

	it('modify rotation correctly', () => {
    expect(files.value[0].characterList[0].components[0].rotation).toBe(10)
  })

	it('modify flipX correctly', () => {
    expect(files.value[0].characterList[0].components[0].flipX).toBe(true)
  })

	it('modify flipY correctly', () => {
    expect(files.value[0].characterList[0].components[0].flipY).toBe(true)
  })

	it('modify usedInCharacter correctly', () => {
    expect(files.value[0].characterList[0].components[0].usedInCharacter).toBe(false)
  })

	it('modify value correctly', () => {
    assert.deepEqual(files.value[0].characterList[0].components[0].value, {
			width: 100,
			height: 100,
			fillColor: 'white',
			strokeColor: '#fff',
		} as unknown as IComponentValue)
  })
})