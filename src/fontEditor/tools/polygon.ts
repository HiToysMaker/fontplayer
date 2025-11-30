import { genUUID } from '@/utils/string'
import { isNearPoint, getBound } from '@/utils/math'
import * as R from 'ramda'
import type { IPoint, IPoints } from '@/fontEditor/stores/polygon'
import {
	getCoord,
	mapCanvasCoords,
} from '@/utils/canvas'
import {
	points,
	setPoints,
	setEditing,
	mousedown,
	mousemove,
	editing,
} from '@/fontEditor/stores/polygon'
import { IComponentValue, addComponentForCurrentCharacterFile, selectedFile } from '@/fontEditor/stores/files'
import { addComponentForCurrentGlyph } from '@/fontEditor/stores/glyph'
import { formatPoints, genPolygonContour } from '@/features/font'
import { transformPoints } from '@/utils/math'
import { Status, editStatus } from '../stores/font'
import { OpType, saveState, StoreType } from '../stores/edit'
import { getStrokeWidth } from '../stores/global'

// 多边形工具初始化方法
// initializer for polygon tool
const initPolygon = (canvas: HTMLCanvasElement, glyph: boolean = false) => {
	mousedown.value = false
	mousemove.value = false
	const nearD = 5
	let closePath = false
	const onMouseDown = (e: MouseEvent) => {
		if (!points.value.length) {
			// 保存状态
			saveState('创建多边形组件', [
				StoreType.Polygon,
				glyph ? StoreType.EditGlyph : StoreType.EditCharacter
			],
				OpType.Undo
			)
		}
		setEditing(true)
		mousedown.value = true
		if (!points.value.length) {
			const _point: IPoint = {
				uuid: genUUID(),
				x: getCoord(e.offsetX),
				y: getCoord(e.offsetY),
			}
			const _points = R.clone(points.value)
			_points.push(_point)
			setPoints(_points)
		}
	}
	const onMouseMove = (e: MouseEvent) => {
		if (!points.value.length || !editing) return
		const _points = R.clone(points.value)
		if (!mousedown.value) {
			if (!mousemove.value) {
				// 保存状态
				saveState('创建多边形组件', [
					StoreType.Polygon,
					glyph ? StoreType.EditGlyph : StoreType.EditCharacter
				],
					OpType.Undo
				)
				// 第一次移动鼠标
				const _point = {
					uuid: genUUID(),
					x: getCoord(e.offsetX),
					y: getCoord(e.offsetY),
				}
				_points.push(_point)
				setPoints(_points)
				mousemove.value = true
			} else {
				// 移动鼠标
				const _point = _points[_points.length - 1]
				_point.x = getCoord(e.offsetX)
				_point.y = getCoord(e.offsetY)
				closePath = false
				if (isNearPoint(getCoord(e.offsetX), getCoord(e.offsetY), points.value[0].x, points.value[0].y, nearD)) {
					_point.x = points.value[0].x
					_point.y = points.value[0].y
					closePath = true
				}
				setPoints(_points)
				mousemove.value = true
			}
		}
	}
	const onMouseUp = (e: MouseEvent) => {
		if (!points.value.length || !editing) return
		mousedown.value = false
		mousemove.value = false
		if (closePath) {
			setEditing(false)
			if (!glyph) {
				addComponentForCurrentCharacterFile(genPolygonComponent(R.clone(points.value), true))
			} else {
				addComponentForCurrentGlyph(genPolygonComponent(R.clone(points.value), true))
			}
			setPoints([])
			closePath = false
		}
	}
	const onEnter = (e: KeyboardEvent) => {
		if (!points.value.length || !editing) return
		// 至少需要2个点才能构成多边形
		if (points.value.length < 2) return
		
		const _points = R.clone(points.value)
		// 添加闭合点（第一个点的位置）
		const point = {
			uuid: genUUID(),
			x: points.value[0].x,
			y: points.value[0].y,
		}
		_points.push(point)
		
		setEditing(false)
		// 使用已经添加闭合点的 _points 来生成组件
		if (!glyph) {
			addComponentForCurrentCharacterFile(genPolygonComponent(_points, true))
		} else {
			addComponentForCurrentGlyph(genPolygonComponent(_points, true))
		}
		setPoints([])
		closePath = false
	}
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.code === 'Enter') {
			onEnter(e)
		}
	}
	canvas.addEventListener('mousedown', onMouseDown)
	window.addEventListener('mousemove', onMouseMove)
	window.addEventListener('mouseup', onMouseUp)
	window.addEventListener('keydown', onKeyDown)
	const closePolygon = () => {
		canvas.removeEventListener('mousedown', onMouseDown)
		window.removeEventListener('mouseup', onMouseUp)
		window.removeEventListener('keydown', onKeyDown)
		window.removeEventListener('mousemove', onMouseMove)
		setEditing(false)
		setPoints([])
		closePath = false
	}
	return closePolygon
}

// 渲染多边形编辑工具
// render polygon editor
const renderPolygonEditor = (points: IPoints, canvas: HTMLCanvasElement) => {
	const ctx: CanvasRenderingContext2D = (canvas as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
	const _points = points.value.map((point: IPoint) => {
		return mapCanvasCoords({
			x: point.x,
			y: point.y,
		})
	})
	if (!_points.length) return
	const w = 10
	ctx.strokeStyle = '#000'
	ctx.lineWidth = getStrokeWidth()
	ctx.fillStyle = '#000'
	ctx.beginPath()
	ctx.moveTo(_points[0].x, _points[0].y)
	for (let i = 1; i < _points.length; i ++) {
		ctx.lineTo(_points[i].x, _points[i].y)
	}
	ctx.stroke()
	ctx.closePath()
	for (let i = 0; i < _points.length; i++) {
		ctx.fillRect(_points[i].x - w / 2, _points[i].y - w / 2, w, w)
	}
}

//// 生成多边形组件
//// generate polygon component
//const genPolygonComponent = (points: Array<IPoint>, closePath: boolean) => {
//	const { x, y, w, h } = getBound(points.reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
//		arr.push({
//			x: point.x,
//			y: point.y,
//		})
//		return arr
//	}, []))
//	return {
//		uuid: genUUID(),
//		type: 'polygon',
//		name: 'polygon',
//		lock: false,
//		visible: true,
//		value: {
//			points: points,
//			fillColor: '',
//			strokeColor: '#000',
//			closePath,
//		} as unknown as IComponentValue,
//		x,
//		y,
//		w,
//		h,
//		rotation: 0,
//		flipX: false,
//		flipY: false,
//		usedInCharacter: true,
//	}
//}

// 生成多边形组件
// generate polygon component
const genPolygonComponent = (points: Array<IPoint>, closePath: boolean) => {
	const { x, y, w, h } = getBound(points.reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
		arr.push({
			x: point.x,
			y: point.y,
		})
		return arr
	}, []))
	const rotation = 0
	const flipX = false
	const flipY = false
	let options = {
		unitsPerEm: 1000,
		descender: -200,
		advanceWidth: 1000,
	}
	if (editStatus.value === Status.Edit) {
		options.unitsPerEm = selectedFile.value.fontSettings.unitsPerEm
		options.descender = selectedFile.value.fontSettings.descender
		options.advanceWidth = selectedFile.value.fontSettings.unitsPerEm
	}

	let transformed_points = transformPoints(points, {
		x, y, w, h, rotation, flipX, flipY,
	})
	const contour_points = formatPoints(transformed_points, options, 1)
	const contour = genPolygonContour(contour_points)

	const scale = 100 / (options.unitsPerEm as number)
	const preview_points = transformed_points.map((point) => {
		return Object.assign({}, point, {
			x: point.x * scale,
			y: point.y * scale,
		})
	})
	const preview_contour = genPolygonContour(preview_points)

	return {
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
			preview: preview_contour,
			contour: contour,
		} as unknown as IComponentValue,
		x,
		y,
		w,
		h,
		rotation: 0,
		flipX: false,
		flipY: false,
		usedInCharacter: true,
	}
}

export {
	initPolygon,
	renderPolygonEditor,
	genPolygonComponent,
}