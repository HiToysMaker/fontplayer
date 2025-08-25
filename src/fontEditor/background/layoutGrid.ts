import {
	mapCanvasWidth,
	mapCanvasHeight,
} from '../../utils/canvas'

import { editCharacterFile } from '../stores/files'
import { renderLayout } from '../../features/layout'
import { getStrokeWidth } from '../stores/global'

/**
 * 绘制网格背景
 * @param canvas 画布
 * @param precision 精度
 */
/**
 * paint mesh background
 * @param canvas canvas
 * @param precision precision
 */
const layoutGrid = (
	canvas: HTMLCanvasElement,
) => {
	const { dx, dy, centerSquareSize, size } = editCharacterFile.value.info.gridSettings
	const layoutTree = editCharacterFile.value.info.layoutTree
	const x1 = Math.round((size - centerSquareSize) / 2) + dx
	const x2 = Math.round((size - centerSquareSize) / 2 + centerSquareSize) + dx
	const y1 = Math.round((size - centerSquareSize) / 2) + dy
	const y2 = Math.round((size - centerSquareSize) / 2 + centerSquareSize) + dy
	const barycenter = [mapCanvasWidth(size / 2) + mapCanvasWidth(dx), mapCanvasHeight(size / 2) + mapCanvasHeight(dy)]
	const ctx = (canvas as unknown as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D

	ctx.strokeStyle = '#811616'
	ctx.lineWidth = getStrokeWidth()

	// grid
	ctx.beginPath()
	ctx.moveTo(0, mapCanvasHeight(y1))
	ctx.lineTo(mapCanvasWidth(size), mapCanvasHeight(y1))
	ctx.stroke()
	ctx.closePath()

	ctx.beginPath()
	ctx.moveTo(0, mapCanvasHeight(y2))
	ctx.lineTo(mapCanvasWidth(size), mapCanvasHeight(y2))
	ctx.stroke()
	ctx.closePath()

	ctx.beginPath()
	ctx.moveTo(mapCanvasWidth(x1), 0)
	ctx.lineTo(mapCanvasWidth(x1),mapCanvasHeight(size))
	ctx.stroke()
	ctx.closePath()

	ctx.beginPath()
	ctx.moveTo(mapCanvasWidth(x2), 0)
	ctx.lineTo(mapCanvasWidth(x2), mapCanvasHeight(size))
	ctx.stroke()
	ctx.closePath()

	// center
	ctx.beginPath()
	ctx.strokeStyle = '#153063'
	ctx.rect(
		mapCanvasWidth(size / 2 - centerSquareSize / 4),
		mapCanvasHeight(size / 2 - centerSquareSize / 4),
		mapCanvasWidth(centerSquareSize / 2),
		mapCanvasHeight(centerSquareSize / 2),
	)
	ctx.stroke()
	ctx.closePath()

	// barycenter
	ctx.fillStyle = '#153063'
	ctx.lineWidth = 0
	ctx.beginPath()
	ctx.arc(
		barycenter[0],
		barycenter[1],
		20, 0, 2 * Math.PI
	)
	ctx.closePath()
	ctx.fill()

	if (layoutTree.length) {
		// layout
		renderLayout(
			layoutTree,
			{ x: 0, y: 0, w: size, h: size },
			1,
			{ x1: x1, x2: x2, y1: y1, y2: y2, l: size },
			canvas,
		)
	}
}

export {
	layoutGrid,
}