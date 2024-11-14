import { describe, it, assert, vi, beforeEach, afterEach } from 'vitest'
import { genEllipseComponent } from '@/fontEditor/tools/ellipse'
import { genUUID } from '@/utils/string'

describe('ellipse tool', () => {
  beforeEach(() => {
    vi.mock('nanoid', () => {
      return { nanoid: () => 'xxxxxx' }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generate correct ellipse component', () => {
    const ellipseX = 50
    const ellipseY = 100
    const radiusX = 40
    const radiusY = 20
    const ellipse1 = {
			uuid: genUUID(),
			type: 'ellipse',
			name: 'ellipse',
			lock: false,
			visible: true,
			value: {
				radiusX: radiusX,
				radiusY: radiusY,
				fillColor: '',
				strokeColor: '#000',
			},
			x: 50,
			y: 100,
			w: 80,
			h: 40,
			rotation: 0,
			flipX: false,
			flipY: false,
			usedInCharacter: true,
    }
    const ellipse2 = genEllipseComponent(ellipseX, ellipseY, radiusX, radiusY)
		//@ts-ignore
		delete ellipse2.value.preview
		//@ts-ignore
		delete ellipse2.value.contour
		//@ts-ignore
    assert.deepEqual(ellipse1, ellipse2)
  })
})