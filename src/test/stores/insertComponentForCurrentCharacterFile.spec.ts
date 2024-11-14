import { describe, it, assert, expect } from 'vitest'
import { insertComponentForCurrentCharacterFile, files, editCharacterFileUUID, IComponent, selectedFileUUID, IComponentValue } from '@/fontEditor/stores/files'
import { genUUID, toUnicode } from '@/utils/string'
import { genRectComponent } from '@/fontEditor/tools/rectangle'

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
	const insertedRect = genRectComponent(
		50,
		50,
		100,
		100,
	) as unknown as IComponent
	insertedRect.uuid = 'comp-2'
	insertComponentForCurrentCharacterFile(insertedRect, {
		uuid: 'comp-1',
		pos: 'prev',
	})

	it('components\' has correct length after inserting', () => {
    expect(files.value[0].characterList[0].components.length).toBe(2)
  })

  it('insert componnent correctly (just push into component list)', () => {
    assert.deepEqual(files.value[0].characterList[0].components[1], insertedRect)
  })

	it('insert componnent into ordered list correctly (update order list for ordering)', () => {
    expect(files.value[0].characterList[0].orderedList[0].uuid).toBe('comp-2')
  })
})