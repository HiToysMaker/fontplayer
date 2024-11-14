import { describe, it, expect, assert } from 'vitest'
import {
  mapCanvasCoords,
	mapCanvasX,
	mapCanvasY,
	mapCanvasWidth,
	mapCanvasHeight,
	unMapCanvasWidth,
	unMapCanvasHeight,
} from '@/utils/canvas'

describe('canvas util methods', () => {
  it('mapCanvasCoords correctly', () => {
		assert.deepEqual(mapCanvasCoords({ x: 10, y: 20 }), { x: 20, y: 40 })
  })

  it('mapCanvasX correctly', () => {
		expect(mapCanvasX(10)).toBe(20)
  })

	it('mapCanvasY correctly', () => {
		expect(mapCanvasY(20)).toBe(40)
  })

	it('mapCanvasWidth correctly', () => {
		expect(mapCanvasWidth(100)).toBe(200)
  })

	it('mapCanvasHeight correctly', () => {
		expect(mapCanvasHeight(100)).toBe(200)
  })

	it('unMapCanvasWidth correctly', () => {
		expect(unMapCanvasWidth(200)).toBe(100)
  })

	it('unMapCanvasHeight correctly', () => {
		expect(unMapCanvasHeight(200)).toBe(100)
  })
})