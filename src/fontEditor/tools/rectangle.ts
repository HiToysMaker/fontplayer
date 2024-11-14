import { genUUID } from '../../utils/string'
import {
	mapCanvasX,
	mapCanvasY,
	mapCanvasWidth,
	mapCanvasHeight,
	getCoord,
} from '../../utils/canvas'
import {
	rectX, rectY, rectWidth, rectHeight,
	setRectX, setRectY, setRectWidth, setRectHeight, setEditing,
} from '../../fontEditor/stores/rectangle'
import { IComponentValue, addComponentForCurrentCharacterFile, selectedFile } from '../../fontEditor/stores/files'
import { addComponentForCurrentGlyph } from '../../fontEditor/stores/glyph'
import { formatPoints, genRectangleContour } from '../../features/font'
import { getRectanglePoints, transformPoints } from '../../utils/math'
import { Status, editStatus } from '../stores/font'

// 长方形工具初始化方法
// initializer for rectangle tool
const initRectangle = (canvas: HTMLCanvasElement, glyph: boolean = false) => {
	let mousedown: boolean = false
	let mousemove: boolean = false
	let lastX = -1
	let lastY = -1
	let mouseDownX = -1
	let mouseDownY = -1
	let cube = false
	const onMouseDown = (e: MouseEvent) => {
		setEditing(true)
		mousedown = true
		mouseDownX = getCoord(e.offsetX)
		mouseDownY = getCoord(e.offsetY)
		lastX = getCoord(e.offsetX)
		lastY = getCoord(e.offsetY)
		window.addEventListener('mouseup', onMouseUp)
		canvas.addEventListener('mousemove', onMouseMove)
		window.addEventListener('keydown', onKeyDown)
		window.addEventListener('keyup', onKeyUp)
	}
	const onMouseMove = (e: MouseEvent) => {
		const _x = getCoord(e.offsetX)
		const _y = getCoord(e.offsetY)
		mousemove = true
		if (mousedown) {
			if (!cube) {
				setRectWidth(Math.abs(_x - mouseDownX))
				setRectHeight(Math.abs(_y - mouseDownY))
				if (_x >= mouseDownX && _y >= mouseDownY) {
					setRectX(mouseDownX)
					setRectY(mouseDownY)
				} else if (_x <= mouseDownX && _y <= mouseDownY) {
					setRectX(_x)
					setRectY(_y)
				} else if (_x >= mouseDownX && _y <= mouseDownY) {
					setRectX(mouseDownX)
					setRectY(_y)
				} else {
					setRectX(_x)
					setRectY(mouseDownY)
				}
			} else {
				const len = Math.max(Math.abs(_x - mouseDownX), Math.abs(_y - mouseDownY))
				const useX = !!(Math.abs(_x - mouseDownX) > Math.abs(_y - mouseDownY))
				setRectWidth(len)
				setRectHeight(len)
				if (_x >= mouseDownX && _y >= mouseDownY) {
					setRectX(mouseDownX)
					setRectY(mouseDownY)
				} else if (_x <= mouseDownX && _y <= mouseDownY) {
					setRectX(mouseDownX - len)
					setRectY(mouseDownY - len)
				} else if (_x >= mouseDownX && _y <= mouseDownY) {
					if (useX) {
						setRectX(mouseDownX)
						setRectY(mouseDownY - len)
					} else {
						setRectX(mouseDownX)
						setRectY(_y)
					}
				} else {
					if (useX) {
						setRectX(_x)
						setRectY(mouseDownY)
					} else {
						setRectX(mouseDownX - len)
						setRectY(mouseDownY)
					}
				}
			}
		}
	}
	const onMouseUp = (e: MouseEvent) => {
		canvas.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
		setEditing(false)
		if (mousemove) {
			if (!glyph) {
				addComponentForCurrentCharacterFile(genRectComponent(rectX.value, rectY.value, rectWidth.value, rectHeight.value))
			} else {
				addComponentForCurrentGlyph(genRectComponent(rectX.value, rectY.value, rectWidth.value, rectHeight.value))
			}
		}
		mousedown = false
		mousemove = false
		cube = false
		mouseDownX = -1
		mouseDownY = -1
		setRectX(-1)
		setRectY(-1)
		setRectWidth(0)
		setRectWidth(0)
	}
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Shift') {
			cube = true
		}
	}
	const onKeyUp = (e: KeyboardEvent) => {
		if (e.key === 'Shift') {
			cube = false
		}
	}
	canvas.addEventListener('mousedown', onMouseDown)
	const closeRectangle = () => {
		canvas.removeEventListener('mousedown', onMouseDown)
		setEditing(false)
	}
	return closeRectangle
}

// 渲染长方形编辑工具
// render rectangle editor
const renderRectangleEditor = (canvas: HTMLCanvasElement, d: number = 5) => {
	const ctx: CanvasRenderingContext2D = (canvas as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
	const { x, y, w, h } = getBound(rectX.value, rectY.value, rectWidth.value, rectHeight.value)
	const _x = mapCanvasX(x)
	const _y = mapCanvasY(y)
	const _w = mapCanvasWidth(w)
	const _h = mapCanvasHeight(h)
	ctx.strokeStyle = '#000'
	ctx.strokeRect(_x, _y, _w, _h)
	ctx.strokeStyle = '#79bbff'
	ctx.strokeRect(_x, _y, _w, _h)
	ctx.strokeRect(_x - d, _y - d, d * 2, d * 2)
	ctx.strokeRect(_x + _w - d, _y - d, d * 2, d * 2)
	ctx.strokeRect(_x - d, _y + _h - d, d * 2, d * 2)
	ctx.strokeRect(_x + _w - d, _y + _h - d, d * 2, d * 2)
}

// 获取长方形包围层大小
// get bound for rectangle
const getBound = (rectX: number, rectY: number, rectWidth: number, rectHeight: number) => {
	return {
		x: rectX,
		y: rectY,
		w: rectWidth,
		h: rectHeight,
	}
}

//// 生成长方形组件
//// generate rectangle component
//const genRectComponent = (
//	rectX: number,
//	rectY: number,
//	rectWidth: number,
//	rectHeight: number,
//) => {
//	return {
//		uuid: genUUID(),
//		type: 'rectangle',
//		name: 'rectangle',
//		lock: false,
//		visible: true,
//		value: {
//			width: rectWidth,
//			height: rectHeight,
//			fillColor: '',
//			strokeColor: '#000',
//		} as unknown as IComponentValue,
//		x: rectX,
//		y: rectY,
//		w: rectWidth,
//		h: rectHeight,
//		rotation: 0,
//		flipX: false,
//		flipY: false,
//		usedInCharacter: true,
//	}
//}

// 生成长方形组件
// generate rectangle component
const genRectComponent = (
	rectX: number,
	rectY: number,
	rectWidth: number,
	rectHeight: number,
) => {
	const points = getRectanglePoints(
		rectWidth,
		rectHeight,
		rectX,
		rectY,
	)
	const { x, y, w, h } = getBound(rectX, rectY, rectWidth, rectHeight)
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
	const contour = genRectangleContour(contour_points)

	const scale = 100 / (options.unitsPerEm as number)
	const preview_points = transformed_points.map((point) => {
		return Object.assign({}, point, {
			x: point.x * scale,
			y: point.y * scale,
		})
	})
	const preview_contour = genRectangleContour(preview_points)

	return {
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
			preview: preview_contour,
			contour: contour,
		} as unknown as IComponentValue,
		x: rectX,
		y: rectY,
		w: rectWidth,
		h: rectHeight,
		rotation: 0,
		flipX: false,
		flipY: false,
		usedInCharacter: true,
	}
}

export {
	initRectangle,
	renderRectangleEditor,
	genRectComponent,
}