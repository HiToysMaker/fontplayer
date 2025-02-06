import { genUUID } from '../../utils/string'
import { isNearPoint, getBound } from '../../utils/math'
import * as R from 'ramda'
import type { IPoint } from '../../fontEditor/stores/pen'
import {
	getCoord,
	mapCanvasCoords,
} from '../../utils/canvas'
import {
	points,
	setPoints,
	setEditing,
	editing,
	mousedown,
	mousemove,
} from '../../fontEditor/stores/pen'
import { addComponentForCurrentCharacterFile, IComponentValue, selectedFile } from '../../fontEditor/stores/files'
import { addComponentForCurrentGlyph } from '../../fontEditor/stores/glyph'
import { formatPoints, genPenContour } from '../../features/font'
import { transformPoints } from '../../utils/math'
import { Status, editStatus } from '../stores/font'
import { OpType, saveState, StoreType } from '../stores/edit'

let eventListenersMap: any = {}
// 钢笔工具初始化方法
// initializer for pen tool
const initPen = (canvas: HTMLCanvasElement, glyph: boolean = false) => {
	mousedown.value = false
	mousemove.value = false
	eventListenersMap = {}
	let editAnchor: any = null
	const controlScale = 0.35
	const nearD = 5
	let closePath = false
	let _lastControl: IPoint
	let _controlIndex: number
	const onMouseDown = (e: MouseEvent) => {
		if (!points.value.length) {
			// 保存状态
			saveState('新建钢笔组件锚点', [
				StoreType.Pen,
				glyph ? StoreType.EditGlyph : StoreType.EditCharacter],
			OpType.Undo)
		}
		mousedown.value = true
		setEditing(true)
		if (!points.value.length) {
			// 第一个锚点
			const _anchor: IPoint = {
				uuid: genUUID(),
				type: 'anchor',
				x: getCoord(e.offsetX),
				y: getCoord(e.offsetY),
				origin: null,
				isShow: true,
			}
			const _control: IPoint = {
				uuid: genUUID(),
				type: 'control',
				x: getCoord(e.offsetX),
				y: getCoord(e.offsetY),
				origin: _anchor.uuid,
				isShow: true,
			}
			editAnchor = {
				uuid: _anchor.uuid,
				index: 0,
			}
			setPoints([_anchor, _control])
			editAnchor = {
				uuid: points.value[0].uuid,
				index: 0,
			}
		} else {
			editAnchor = {
				uuid: points.value[points.value.length - 2].uuid,
				index: points.value.length - 2,
			}
		}
	}
	const onMouseMove = (e: MouseEvent) => {
		if (!points.value.length || !editing) return
		const _points = R.clone(points.value)
		if (mousedown.value) {
			if (_lastControl) _points[_controlIndex] = _lastControl
			// 长按鼠标
			if (editAnchor.index === 0) {
				//第一个锚点
				let _anchor = _points[editAnchor.index]
				let _control = _points[editAnchor.index + 1]
				//将第一个锚点对应的控制点设置为鼠标移动位置
				_control.x = getCoord(e.offsetX)
				_control.y = getCoord(e.offsetY)
				_control.isShow = true
			} else {
				// 后续锚点
				let _anchor = _points[editAnchor.index]
				let _control1 = _points[editAnchor.index - 1]
				let _control2 = _points[editAnchor.index + 1]
				//将锚点对应的后续控制点设置为鼠标移动位置
				_control2.x = getCoord(e.offsetX)
				_control2.y = getCoord(e.offsetY)
				_control2.isShow = true
				//将锚点对应的前接控制点设置为与后续控制点对称的位置
				_control1.x = _anchor.x - (getCoord(e.offsetX) - _anchor.x)
				_control1.y = _anchor.y - (getCoord(e.offsetY) - _anchor.y)
				_control1.isShow = true
			}
			mousemove.value = true
			setPoints(_points)
		}
		if (!mousedown.value) {
			if (!mousemove.value && _points.length) {
				// 第一次移动鼠标
				// 保存状态
				saveState('新建钢笔组件锚点', [
					StoreType.Pen,
					glyph ? StoreType.EditGlyph : StoreType.EditCharacter],
				OpType.Undo)
				_lastControl = Object.assign({}, _points[_points.length - 1])
				_controlIndex = _points.length - 1
				const _anchor = {
					uuid: genUUID(),
					type: 'anchor',
					x: getCoord(e.offsetX),
					y: getCoord(e.offsetY),
					origin: null,
					isShow: true,
				}
				const _control1 = {
					uuid: genUUID(),
					type: 'control',
					x: _anchor.x,
					y: _anchor.y,
					origin: _anchor.uuid,
					isShow: false,
				}
				const _control2 = {
					uuid: genUUID(),
					type: 'control',
					x: _anchor.x,
					y: _anchor.y,
					origin: _anchor.uuid,
					isShow: false,
				}
				_points.push(_control1, _anchor, _control2)
				setPoints(_points)
				mousemove.value = true
			} else if (_points.length) {
				// 移动鼠标
				_controlIndex = _points.length - 4
				const _anchor = _points[_points.length - 2]
				const _control1 = _points[_points.length - 3]
				const _control2 = _points[_points.length - 1]
				_anchor.x = getCoord(e.offsetX)
				_anchor.y = getCoord(e.offsetY)
				_control2.x = getCoord(e.offsetX)
				_control2.y = getCoord(e.offsetY)
				closePath = false
				// 当鼠标移动至第一个锚点所在位置附近时，自动闭合路径
				if (isNearPoint(getCoord(e.offsetX), getCoord(e.offsetY), points.value[0].x, points.value[0].y, nearD)) {
					// 将最后一个锚点位置设置为第一个锚点位置
					_anchor.x = points.value[0].x
					_anchor.y = points.value[0].y
					// 自动延切线与第一条贝塞尔曲线进行连接
					_control2.x = points.value[1].x
					_control2.y = points.value[1].y
					_control1.x = points.value[0].x - (points.value[1].x - points.value[0].x)
					_control1.y = points.value[0].y - (points.value[1].y - points.value[0].y)
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
		editAnchor = null
		if (closePath) {
			// canvas.removeEventListener('mousemove', onMouseMove)
			// window.removeEventListener('mouseup', onMouseUp)
			// window.removeEventListener('keydown', onKeyDown)
			setEditing(false)
			const component = genPenComponent(R.clone(points).value, true)
			setPoints([])
			if (!glyph) {
				addComponentForCurrentCharacterFile(component)
			} else {
				addComponentForCurrentGlyph(component)
			}
			_lastControl = undefined
			_controlIndex = undefined
			closePath = false
			editAnchor = null
		}
	}
	const onEnter = (e: KeyboardEvent) => {
		if (!points.value.length || !editing) return
		const _points = R.clone(points.value)
		if (points.value.length >= 2) {
			const _anchor = {
				uuid: genUUID(),
				type: 'anchor',
				x: points.value[0].x,
				y: points.value[0].y,
				origin: null,
				isShow: true,
			}
			const _control1 = {
				uuid: genUUID(),
				type: 'control',
				x: points.value[0].x,//points.value[1].x,
				y: points.value[0].y,//points.value[1].y,
				origin: _anchor.uuid,
				isShow: false,
			}
			const _control2 = {
				uuid: genUUID(),
				type: 'control',
				x: points.value[0].x,//points.value[0].x - (points.value[1].x - points.value[0].x),
				y: points.value[0].y,//points.value[0].y - (points.value[1].y - points.value[0].y),
				origin: _anchor.uuid,
				isShow: false,
			}
			_points.push(_control1, _anchor, _control2)
			setPoints(_points)
		}
		//canvas && canvas.removeEventListener('mousemove', onMouseMove)
		//window.removeEventListener('mouseup', onMouseUp)
		//window.removeEventListener('keydown', onKeyDown)
		setEditing(false)
		if (!glyph) {
			addComponentForCurrentCharacterFile(genPenComponent(R.clone(points).value, true))
		} else {
			addComponentForCurrentGlyph(genPenComponent(R.clone(points).value, true))
		}
		setPoints([])
		_lastControl = undefined
		_controlIndex = undefined
		closePath = false
		editAnchor = null
	}
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.code === 'Enter') {
			onEnter(e)
		}
	}
	canvas.addEventListener('mousedown', onMouseDown)
	canvas.addEventListener('mousemove', onMouseMove)
	window.addEventListener('mouseup', onMouseUp)
	window.addEventListener('keydown', onKeyDown)
	const closePen = () => {
		canvas.removeEventListener('mousedown', onMouseDown)
		canvas.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
		window.removeEventListener('keydown', onKeyDown)
		setEditing(false)
		setPoints([])
		_lastControl = undefined
		_controlIndex = undefined
		closePath = false
		editAnchor = null
	}
	return closePen
}

// 渲染钢笔编辑工具
// render pen editor
const renderPenEditor = (canvas: HTMLCanvasElement) => {
	const ctx: CanvasRenderingContext2D = (canvas as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
	const _points = points.value.map((point: IPoint) => {
		return {
			isShow: point.isShow,
			...mapCanvasCoords({
				x: point.x,
				y: point.y,
			}),
		}
	})
	if (!_points.length) return
	const w = 10
	ctx.strokeStyle = '#000'
	ctx.fillStyle = '#000'
	ctx.beginPath()
	ctx.moveTo(_points[0].x, _points[0].y)
	if (_points.length >= 4) {
		ctx.bezierCurveTo(_points[1].x, _points[1].y, _points[2].x, _points[2].y, _points[3].x, _points[3].y)
	}
	for (let i = 3; i < _points.length - 1; i += 3) {
		if (i + 3 >= _points.length) break
		ctx.bezierCurveTo(_points[i + 1].x, _points[i + 1].y, _points[i + 2].x, _points[i + 2].y, _points[i + 3].x, _points[i + 3].y)
	}
	ctx.stroke()
	ctx.closePath()

	for (let i = 0; i < _points.length - 1; i += 3) {
		_points[i].isShow && ctx.fillRect(_points[i].x - w / 2, _points[i].y - w / 2, w, w)
		_points[i + 1].isShow && ctx.strokeRect(_points[i + 1].x - w / 2, _points[i + 1].y - w / 2, w, w)
		if ((i + 2) > _points.length - 1) break
		_points[i + 2].isShow && ctx.strokeRect(_points[i + 2].x - w / 2, _points[i + 2].y - w / 2, w, w)
	}

	ctx.beginPath()
	ctx.moveTo(_points[0].x, _points[0].y)
	ctx.lineTo(_points[1].x, _points[1].y)
	ctx.stroke()
	ctx.closePath()
	for (let i = 3; i < _points.length - 1; i += 3) {
		if (_points[i - 1].isShow) {
			ctx.beginPath()
			ctx.moveTo(_points[i].x, _points[i].y)
			ctx.lineTo(_points[i - 1].x, _points[i - 1].y)
			ctx.stroke()
			ctx.closePath()
		}
		if (_points[i + 1].isShow) {
			ctx.beginPath()
			ctx.moveTo(_points[i].x, _points[i].y)
			ctx.lineTo(_points[i + 1].x, _points[i + 1].y)
			ctx.stroke()
			ctx.closePath()
		}
	}
}

//// 生成钢笔组件
//// generate pen component
//const genPenComponent = (
//	points: Array<IPoint>,
//	closePath: boolean,
//	fillColor: string = '',
//	strokeColor: string = '#000',
//) => {
//	const { x, y, w, h } = getBound(points.reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
//		arr.push({
//			x: point.x,
//			y: point.y,
//		})
//		return arr
//	}, []))
//	return {
//		uuid: genUUID(),
//		type: 'pen',
//		name: 'pen',
//		lock: false,
//		visible: true,
//		value: {
//			points: points,
//			fillColor,
//			strokeColor,
//			closePath,
//			editMode: false,
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

// 生成钢笔组件
// generate pen component
const genPenComponent = (
	points: Array<IPoint>,
	closePath: boolean,
	fillColor: string = '',
	strokeColor: string = '#000',
) => {
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
	const contour = genPenContour(contour_points)

	const scale = 100 / (options.unitsPerEm as number)
	const preview_points = transformed_points.map((point) => {
		return Object.assign({}, point, {
			x: point.x * scale,
			y: point.y * scale,
		})
	})
	const preview_contour = genPenContour(preview_points)

	return {
		uuid: genUUID(),
		type: 'pen',
		name: 'pen',
		lock: false,
		visible: true,
		value: {
			points: points,
			fillColor,
			strokeColor,
			closePath,
			editMode: false,
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
	initPen,
	renderPenEditor,
	genPenComponent,
}