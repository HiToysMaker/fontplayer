import { describe, it, assert, vi, beforeEach, afterEach } from 'vitest'
import { genPolygonComponent } from '@/fontEditor/tools/polygon'
import { genUUID } from '@/utils/string'

describe('polygon tool', () => {
  beforeEach(() => {
    vi.mock('nanoid', () => {
      return { nanoid: () => 'xxxxxx' }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generate correct polygon component', () => {
    const points = [
      { uuid: genUUID(), x: 50, y: 50 },
      { uuid: genUUID(), x: 100, y: 50 },
      { uuid: genUUID(), x: 100, y: 100 },
      { uuid: genUUID(), x: 50, y: 100 },
      { uuid: genUUID(), x: 50, y: 50 },
    ]
    const closePath = true
    const polygon1 = {
      uuid: genUUID(),
      type: 'polygon',
      name: 'polygon',
      lock: false,
      visible: true,
      value: {
        points: points,
        fillColor: '',
        strokeColor: '#000',
        closePath,
      },
      x: 50,
      y: 50,
      w: 50,
      h: 50,
      rotation: 0,
      flipX: false,
      flipY: false,
      usedInCharacter: true,
    }
    const polygon2 = genPolygonComponent(points, closePath)
    //@ts-ignore
		delete polygon2.value.preview
		//@ts-ignore
		delete polygon2.value.contour
    //@ts-ignore
    assert.deepEqual(polygon1, polygon2)
  })
})