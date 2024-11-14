import { describe, it, assert, expect } from 'vitest'
import { addComponentForCurrentCharacterFile, files, editCharacterFileUUID, IComponent, selectedFileUUID } from '@/fontEditor/stores/files'
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
				components: [],
				groups: [],
				orderedList: [],
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
	const rectX = 10
	const rectY = 20
	const rectWidth = 50
	const rectHeight = 100
	const rect = genRectComponent(
		rectX,
		rectY,
		rectWidth,
		rectHeight,
	) as unknown as IComponent
	addComponentForCurrentCharacterFile(rect)

	it('components\' has correct length after adding', () => {
    expect(files.value[0].characterList[0].components.length).toBe(1)
  })

  it('add componnent for current editing character correctly', () => {
    assert.deepEqual(files.value[0].characterList[0].components[0], rect)
  })
})