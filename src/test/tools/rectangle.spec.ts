import { describe, it, assert, vi, beforeEach, afterEach } from 'vitest'
import { genRectComponent } from '@/fontEditor/tools/rectangle'
import { genUUID } from '@/utils/string'

describe('rectange tool', () => {
  beforeEach(() => {
    vi.mock('nanoid', () => {
      return { nanoid: () => 'xxxxxx' }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generate correct rectangle component', () => {
    const rectX = 10
    const rectY = 20
    const rectWidth = 50
    const rectHeight = 100
    const rect1 = {
      uuid: genUUID(),
      type: 'rectangle',
      name: 'rectangle',
      lock: false,
      visible: true,
      value: {
        width: rectWidth,
        height: rectHeight,
        fillColor: '',
        strokeColor: '#000',
      },
      x: 10,
      y: 20,
      w: 50,
      h: 100,
      rotation: 0,
      flipX: false,
      flipY: false,
      usedInCharacter: true,
    }
    const rect2 = genRectComponent(
      rectX,
      rectY,
      rectWidth,
      rectHeight,
    )
    //@ts-ignore
		delete rect2.value.preview
		//@ts-ignore
		delete rect2.value.contour
    //@ts-ignore
    assert.deepEqual(rect1, rect2)
  })
})