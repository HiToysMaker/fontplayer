import { describe, it, expect, assert } from 'vitest'
import {
  isNearPoint,
  distance,
  getBound,
  rotatePoint,
  inComponentBound,
  angleBetween,
  transformPoints,
  getEllipsePoints,
  getRectanglePoints,
} from '@/utils/math'
import { IComponentValue } from '@/fontEditor/stores/files'

describe('math util methods', () => {
  it('calculate isNearPoint correctly', () => {
		expect(isNearPoint(10, 10, 12, 12, 5)).toBe(true)
		expect(isNearPoint(10, 10, 12, 12, 1)).toBe(false)
  })

	it('calculate distance correctly', () => {
		expect(distance(10, 10, 12, 12)).toBe(Math.sqrt(8))
  })

	it('getBound correctly', () => {
		assert.deepEqual(getBound([
			{ x: 10, y: 10 },
			{ x: 5, y: 20 },
			{ x: 15, y: 20 },
			{ x: 10, y: 10 },
		]), {
			x: 5,
			y: 10,
			w: 10,
			h: 10,
		})
  })
	
	it('rotatePoint correctly', () => {
		assert.deepEqual(
			rotatePoint({x: 10, y: 20}, {x: 0, y: 0}, 30),
			{x: -1.339745962155611, y: 22.320508075688775}
		)
  })

	it('calculate inComponentBound correctly', () => {
		const rect = {
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
		expect(inComponentBound({ x: 4, y: 6 }, rect)).toBe(true)
  })

	it('calculate angleBetween correctly', () => {
		expect(angleBetween({x: 10, y: 20}, {x: 50, y: 50})).toBe(18)
  })

	it('transformPoints correctly', () => {
		assert.deepEqual(transformPoints(
			[
				{ x: 10, y: 20 },
				{ x: 20, y: 40 },
				{ x: 10, y: 40 },
				{ x: 10, y: 20 }
			],
			{ x: 50, y: 50, w: 5, h: 5, rotation: 30, flipX: false, flipY: false }
		),
		[
			{x: 52.8349364905389, y: 49.7099364905389},
			{x: 52.1650635094611, y: 55.2900635094611},
			{x: 47.83493649053891, y: 54.0400635094611},
			{x: 52.8349364905389, y: 49.7099364905389},
		])
  })

	it('getEllipsePoints correctly', () => {
		assert.deepEqual(getEllipsePoints(20, 40, 10, 0, 0), [
			{x: -20, y: 0},
			{x: -12, y: 32},
			{x: -4, y: 39.191835884530846},
			{x: 4, y: 39.191835884530846},
			{x: 12, y: 32},
			{x: 12, y: -32},
			{x: 4, y: -39.191835884530846},
			{x: -4, y: -39.191835884530846},
			{x: -12, y: -32},
			{x: -20, y: 0},
		])
  })

	it('getRectanglePoints correctly', () => {
		assert.deepEqual(getRectanglePoints(20, 40, 0, 0), [
			{x: 0, y: 0},
			{x: 20, y: 0},
			{x: 20, y: 40},
			{x: 0, y: 40},
		])
  })
})