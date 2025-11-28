import { genUUID } from '../../utils/string'
import {
	mapCanvasX,
	mapCanvasY,
	mapCanvasWidth,
	mapCanvasHeight,
	getCoord,
} from '../../utils/canvas'
import {
	radiusX, radiusY, ellipseX, ellipseY,
	setRadiusX, setRadiusY, setEllipseX, setEllipseY, setEditing,
} from '../stores/ellipse'
import { IComponentValue, addComponentForCurrentCharacterFile, selectedFile } from '../stores/files'
import { addComponentForCurrentGlyph } from '../stores/glyph'
import { formatPoints, genEllipseContour } from '../../features/font'
import { getEllipsePoints, transformPoints } from '../../utils/math'
import { Status, editStatus } from '../stores/font'
import { OpType, saveState, StoreType } from '../stores/edit'
import { getStrokeWidth } from '../stores/global'

// 椭圆工具初始化方法
// initializer for ellipse tool
let eventListenersMap: any = {}
const initEllipse = (canvas: HTMLCanvasElement, glyph: boolean = false) => {
	let mousedown: boolean = false
	let mousemove: boolean = false
	let lastX = -1
	let lastY = -1
	let mouseDownX = -1
	let mouseDownY = -1
	let circle = false
	const onMouseDown = (e: MouseEvent) => {
		// 保存状态
		saveState('创建椭圆组件', [
			StoreType.Ellipse,
			glyph ? StoreType.EditGlyph : StoreType.EditCharacter
		],
			OpType.Undo,
		)
		setEditing(true)
		mousedown = true
		mouseDownX = getCoord(e.offsetX)
		mouseDownY = getCoord(e.offsetY)
		lastX = getCoord(e.offsetX)
		lastY = getCoord(e.offsetY)
	}
	const onMouseMove = (e: MouseEvent) => {
		if (!mousedown) return
		const _x = getCoord(e.offsetX)
		const _y = getCoord(e.offsetY)
		mousemove = true
		if (mousedown) {
			if (!circle) {
				setRadiusX(Math.abs(_x - mouseDownX) / 2)
				setRadiusY(Math.abs(_y - mouseDownY) / 2)
				if (_x >= mouseDownX && _y >= mouseDownY) {
					setEllipseX(mouseDownX)
					setEllipseY(mouseDownY)
				} else if (_x <= mouseDownX && _y <= mouseDownY) {
					setEllipseX(_x)
					setEllipseY(_y)
				} else if (_x >= mouseDownX && _y <= mouseDownY) {
					setEllipseX(mouseDownX)
					setEllipseY(_y)
				} else {
					setEllipseX(_x)
					setEllipseY(mouseDownY)
				}
			} else {
				const r = Math.max(Math.abs(_x - mouseDownX), Math.abs(_y - mouseDownY)) / 2
				const useX = !!(Math.abs(_x - mouseDownX) > Math.abs(_y - mouseDownY))
				setRadiusX(r)
				setRadiusY(r)
				if (_x >= mouseDownX && _y >= mouseDownY) {
					setEllipseX(mouseDownX)
					setEllipseY(mouseDownY)
				} else if (_x <= mouseDownX && _y <= mouseDownY) {
					setEllipseX(mouseDownX - 2 * r)
					setEllipseY(mouseDownY - 2 * r)
				} else if (_x >= mouseDownX && _y <= mouseDownY) {
					if (useX) {
						setEllipseX(mouseDownX)
						setEllipseY(mouseDownY - 2 * r)
					} else {
						setEllipseX(mouseDownX)
						setEllipseY(_y)
					}
				} else {
					if (useX) {
						setEllipseX(_x)
						setEllipseY(mouseDownY)
					} else {
						setEllipseX(mouseDownX - 2 * r)
						setEllipseY(mouseDownY)
					}
				}
			}
		}
	}
	const onMouseUp = (e: MouseEvent) => {
		setEditing(false)
		if (mousemove) {
			const component = genEllipseComponent(ellipseX.value, ellipseY.value, radiusX.value, radiusY.value)
			mousedown = false
			mousemove = false
			mouseDownX = -1
			mouseDownY = -1
			circle = false
			setEllipseX(-1)
			setEllipseY(-1)
			setRadiusX(0)
			setRadiusY(0)
			// 保存状态
			saveState('创建椭圆组件',
				[
					StoreType.Ellipse,
					glyph ? StoreType.EditGlyph : StoreType.EditCharacter
				],
				OpType.Undo,
				{
					newRecord: false,
				}
			)
			if (!glyph) {
				addComponentForCurrentCharacterFile(component)
			} else {
				addComponentForCurrentGlyph(component)
			}
		} else {
			mousedown = false
			mousemove = false
			mouseDownX = -1
			mouseDownY = -1
			circle = false
			setEllipseX(-1)
			setEllipseY(-1)
			setRadiusX(0)
			setRadiusY(0)
		}
	}
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Shift') {
			circle = true
		}
	}
	const onKeyUp = (e: KeyboardEvent) => {
		if (e.key === 'Shift') {
			circle = false
		}
	}
	canvas.addEventListener('mousedown', onMouseDown)
	window.addEventListener('mouseup', onMouseUp)
	canvas.addEventListener('mousemove', onMouseMove)
	window.addEventListener('keydown', onKeyDown)
	window.addEventListener('keyup', onKeyUp)
	const closeEllipse = () => {
		canvas.removeEventListener('mousedown', onMouseDown)
		canvas.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
		window.removeEventListener('keydown', onKeyDown)
		window.removeEventListener('keyup', onKeyUp)
		setEditing(false)
	}
	return closeEllipse
}

// 渲染椭圆编辑工具
// render ellipse editor
const renderEllipseEditor = (canvas: HTMLCanvasElement, d: number = 5) => {
	const ctx: CanvasRenderingContext2D = (canvas as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
	const { x, y, w, h } = getBound(ellipseX.value, ellipseY.value, radiusX.value, radiusY.value)
	const _x = mapCanvasX(x)
	const _y = mapCanvasY(y)
	const _w = mapCanvasWidth(w)
	const _h = mapCanvasHeight(h)
	const _radiusX = mapCanvasWidth(radiusX.value)
	const _radiusY = mapCanvasWidth(radiusY.value)
	ctx.strokeStyle = '#000'
	ctx.lineWidth = getStrokeWidth()
	ctx.beginPath()
	ctx.ellipse(_x + _radiusX, _y + _radiusY, _radiusX, _radiusY, 0, 0, 2 * Math.PI)
	ctx.closePath()
	ctx.stroke()
	ctx.strokeStyle = '#79bbff'
	ctx.strokeRect(_x, _y, _w, _h)
	ctx.strokeRect(_x - d, _y - d, d * 2, d * 2)
	ctx.strokeRect(_x + _w - d, _y - d, d * 2, d * 2)
	ctx.strokeRect(_x - d, _y + _h - d, d * 2, d * 2)
	ctx.strokeRect(_x + _w - d, _y + _h - d, d * 2, d * 2)
}

// 获取椭圆包围层大小
// get bound for ellipse
const getBound = (ellipseX: number, ellipseY: number, radiusX: number, radiusY: number) => {
	return {
		x: ellipseX,
		y: ellipseY,
		w: 2 * radiusX,
		h: 2 * radiusY,
	}
}

//// 生成椭圆组件
//// generate ellipse component
//const genEllipseComponent = (
//	ellipseX: number,
//	ellipseY: number,
//	radiusX: number,
//	radiusY: number,
//) => {
//	return {
//		uuid: genUUID(),
//		type: 'ellipse',
//		name: 'ellipse',
//		lock: false,
//		visible: true,
//		value: {
//			radiusX: radiusX,
//			radiusY: radiusY,
//			fillColor: '',
//			strokeColor: '#000',
//		} as unknown as IComponentValue,
//		x: ellipseX,
//		y: ellipseY,
//		w: 2 * radiusX,
//		h: 2 * radiusY,
//		rotation: 0,
//		flipX: false,
//		flipY: false,
//		usedInCharacter: true,
//	}
//}

// 生成椭圆组件
// generate ellipse component
const genEllipseComponent = (
	ellipseX: number,
	ellipseY: number,
	radiusX: number,
	radiusY: number,
) => {
	let points = getEllipsePoints(
		radiusX,
		radiusY,
		1000,
		ellipseX + radiusX,
		ellipseY + radiusY,
	)
	const { x, y, w, h } = getBound(ellipseX, ellipseY, radiusX, radiusY)
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
	const contour = genEllipseContour(contour_points)

	const scale = 100 / (options.unitsPerEm as number)
	const preview_points = transformed_points.map((point) => {
		return Object.assign({}, point, {
			x: point.x * scale,
			y: point.y * scale,
		})
	})
	const preview_contour = genEllipseContour(preview_points)

	return {
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
			preview: preview_contour,
			contour: contour,
		} as unknown as IComponentValue,
		x: ellipseX,
		y: ellipseY,
		w: 2 * radiusX,
		h: 2 * radiusY,
		rotation: 0,
		flipX: false,
		flipY: false,
		usedInCharacter: true,
	}
}

export {
	initEllipse,
	renderEllipseEditor,
	genEllipseComponent,
}