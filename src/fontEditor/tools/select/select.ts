import {
	inComponentBound,
	distance,
	rotatePoint,
	leftTop,
	leftBottom,
	rightTop,
	rightBottom,
	angleBetween,
	getEllipsePoints,
	transformPoints,
	getRectanglePoints,
} from '../../../utils/math'
import {
	mapCanvasX,
	mapCanvasY,
	mapCanvasWidth,
	mapCanvasHeight,
	getCoord,
} from '../../../utils/canvas'
import { initPenEditMode, renderSelectPenEditor } from './penSelect'
import {
	selectControl,
} from '../../stores/select'
import {
	IPenComponent,
	selectedComponent,
	componentsForCurrentCharacterFile,
	selectedComponentUUID,
	setSelectionForCurrentCharacterFile,
	modifyComponentForCurrentCharacterFile,
	selectedFile,
	orderedListWithItemsForCharacterFile,
	orderedListWithItemsForCurrentCharacterFile,
} from '../../stores/files'
import {
	selectedComponent as selectedComponent_glyph,
	componentsForCurrentGlyph,
	selectedComponentUUID as selectedComponentUUID_glyph,
	setSelectionForCurrentGlyph,
	modifyComponentForCurrentGlyph,
	orderedListForCurrentGlyph,
	orderedListWithItemsForCurrentGlyph,
} from '../../stores/glyph'
import { Status, editStatus } from '../../stores/font'
import { genEllipseContour, formatPoints, genPolygonContour, genRectangleContour, genPenContour } from '../../../features/font'

// 选择组件时，初始化方法
// initializier for component selection
const initSelect = (canvas: HTMLCanvasElement, d: number = 10, glyph: boolean = false) => {
	if (!glyph) {
		if (
			selectedComponent.value &&
			selectedComponent.value.type === 'pen' &&
			(selectedComponent.value.value as unknown as IPenComponent).editMode
		) {
			return initPenEditMode(canvas, d)
		}
	} else {
		if (
			selectedComponent_glyph.value &&
			selectedComponent_glyph.value.type === 'pen' &&
			(selectedComponent_glyph.value.value as unknown as IPenComponent).editMode
		) {
			return initPenEditMode(canvas, d, true)
		}
	}
	let lastX = -1
	let lastY = -1
	let mousedown = false
	let mousemove = false
	const onMouseDown = (e: MouseEvent) => {
		mousedown = true
		mousemove = false
		const comp = glyph ? selectedComponent_glyph.value : selectedComponent.value
		if (!comp || !comp.visible) {
			mousedown = false
			return
		}
	}

	const onMouseMove = (e: MouseEvent) => {
		mousemove = true
		if (!glyph && !selectedComponent.value) return
		if (glyph && !selectedComponent_glyph.value) return
		const comp = glyph ? selectedComponent_glyph.value : selectedComponent.value
		if (!comp || !comp.visible) return
		const { x, y, w, h, rotation, uuid} = comp
		const { x: _x, y: _y } = rotatePoint(
			{ x: getCoord(e.offsetX), y: getCoord(e.offsetY) },
			{ x: x + w / 2, y: y + h / 2 },
			-rotation
		)
		const left_top = { x, y }
		const left_bottom = { x, y: y + h }
		const right_top = { x: x + w, y }
		const right_bottom = { x: x + w, y: y + h }
		let modifyComponent = modifyComponentForCurrentCharacterFile
		if (glyph) {
			modifyComponent = modifyComponentForCurrentGlyph
		}
		if (mousedown) {
			switch (selectControl.value) {
				case 'scale-left-top':
					modifyComponent(uuid, {
						w: w + x - _x,
						h: h + y - _y,
						x: _x,
						y: _y,
					})
					break
				case 'scale-right-top':
					modifyComponent(uuid, {
						w: _x - x,
						h: h + y - _y,
						y: _y,
					})
					break
				case 'scale-left-bottom':
					modifyComponent(uuid, {
						w: w + x - _x,
						x: _x,
						y: _y - y,
					})
					break
				case 'scale-right-bottom':
					modifyComponent(uuid, {
						w: _x - x,
						h: _y - y,
					})
					break
				case 'inner-area':
					modifyComponent(uuid, {
						x: x + _x - lastX,
						y: y + _y - lastY,
					})
					break
				case 'rotate-left-top':
					modifyComponent(uuid, {
						rotation: rotation + angleBetween(
							{ x: _x - (x + w / 2), y: _y - (y + h / 2) },
							{ x: left_top.x - (x + w / 2), y: left_top.y - (y + h / 2) }
						)
					})
					break
				case 'rotate-right-top':
					modifyComponent(uuid, {
						rotation: rotation + angleBetween(
							{ x: _x - (x + w / 2), y: _y - (y + h / 2) },
							{ x: right_top.x - (x + w / 2), y: right_top.y - (y + h / 2) }
						)
					})
					break
				case 'rotate-left-bottom':
					modifyComponent(uuid, {
						rotation: rotation + angleBetween(
							{ x: _x - (x + w / 2), y: _y - (y + h / 2) },
							{ x: left_bottom.x - (x + w / 2), y: left_bottom.y - (y + h / 2) }
						)
					})
					break
				case 'rotate-right-bottom':
					modifyComponent(uuid, {
						rotation: rotation + angleBetween(
							{ x: _x - (x + w / 2), y: _y - (y + h / 2) },
							{ x: right_bottom.x - (x + w / 2), y: right_bottom.y - (y + h / 2) }
						)
					})
					break
			}
		}
		if (!mousedown) {
			if (distance(_x, _y, left_top.x, left_top.y) <= d) {
				selectControl.value = 'scale-left-top'
			} else if (distance(_x, _y, right_top.x, right_top.y) <= d) {
				selectControl.value = 'scale-right-top'
			} else if (distance(_x, _y, left_bottom.x, left_bottom.y) <= d) {
				selectControl.value = 'scale-left-bottom'
			} else if (distance(_x, _y, right_bottom.x, right_bottom.y) <= d) {
				selectControl.value = 'scale-right-bottom'
			} else if (leftTop(_x, _y, left_top.x, left_top.y, d)) {
				selectControl.value = 'rotate-left-top'
			} else if (rightTop(_x, _y, right_top.x, right_top.y, d)) {
				selectControl.value = 'rotate-right-top'
			} else if (leftBottom(_x, _y, left_bottom.x, left_bottom.y, d)) {
				selectControl.value = 'rotate-left-bottom'
			} else if (rightBottom(_x, _y, right_bottom.x, right_bottom.y, d)) {
				selectControl.value = 'rotate-right-bottom'
			} else if (inComponentBound({ x: _x, y: _y }, glyph ? selectedComponent_glyph.value : selectedComponent.value)) {
				selectControl.value = 'inner-area'
			} else {
				const _comp = glyph ? selectedComponent_glyph.value : selectedComponent.value
				const {x,y,w,h} = _comp
				selectControl.value = 'null'
			}
		}
		lastX = _x
		lastY = _y
	}

	const onMouseUp = (e: MouseEvent) => {
		if (!mousemove) {
			if (!glyph) {
				for (let i = orderedListWithItemsForCurrentCharacterFile.value.length - 1; i >= 0; i--) {
					const component = orderedListWithItemsForCurrentCharacterFile.value[i]
					if (selectedComponentUUID.value === component.uuid && inComponentBound({ x: getCoord(e.offsetX), y: getCoord(e.offsetY) }, component, 20) && component.visible) return
					if (inComponentBound({ x: getCoord(e.offsetX), y: getCoord(e.offsetY) }, component, 20) && component.visible) {
						setSelectionForCurrentCharacterFile(component.uuid)
						mousedown = false
						mousemove = false
						selectControl.value = 'null'
						return
					}
				}
				setSelectionForCurrentCharacterFile('')
			} else {
				for (let i = orderedListWithItemsForCurrentGlyph.value.length - 1; i >= 0; i--) {
					const component = orderedListWithItemsForCurrentGlyph.value[i]
					if (selectedComponentUUID_glyph.value === component.uuid && inComponentBound({ x: getCoord(e.offsetX), y: getCoord(e.offsetY) }, component, 20) && component.visible) return
					if (inComponentBound({ x: getCoord(e.offsetX), y: getCoord(e.offsetY) }, component, 20) && component.visible) {
						setSelectionForCurrentGlyph(component.uuid)
						mousedown = false
						mousemove = false
						selectControl.value = 'null'
						return
					}
				}
				setSelectionForCurrentGlyph('')
			}
		}
		const comp = glyph ? selectedComponent_glyph.value : selectedComponent.value
		if (!comp || !comp.visible) return
		if (comp.type !== 'picture') {
			modifyComponentValue()
		}
		mousedown = false
		mousemove = false
		selectControl.value = 'null'
	}

	const onEnter = (e: KeyboardEvent) => {
		const comp = glyph ? selectedComponent_glyph.value : selectedComponent.value
		if (!comp || !comp.visible) return
		if (comp.type !== 'picture') {
			modifyComponentValue()
		}
		if (!glyph) {
			setSelectionForCurrentCharacterFile('')
		} else {
			setSelectionForCurrentGlyph('')
		}
	}
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.code === 'Space') {
			onEnter(e)
		}
	}

	const modifyComponentValue = () => {
		const comp = glyph ? selectedComponent_glyph.value : selectedComponent.value
		if (!comp) return
		let modifyComponent = modifyComponentForCurrentCharacterFile
		if (glyph) {
			modifyComponent = modifyComponentForCurrentGlyph
		}
		let genContour = genPenContour
		const { x, y, w, h, rotation, flipX, flipY, type, uuid } = comp
		let points = []
		if (type === 'polygon') {
			points = comp.value.points
			genContour = genPolygonContour
		} else if (type === 'ellipse') {
			const { radiusX, radiusY } = comp.value
			points = getEllipsePoints(
				radiusX,
				radiusY,
				1000,
				x + radiusX,
				y + radiusY,
			)
			genContour = genEllipseContour
		} else if (type === 'rectangle') {
			const { width, height } = comp.value
			points = getRectanglePoints(
				width,
				height,
				x,
				y,
			)
			genContour = genRectangleContour
		}
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
		const contour = genContour(contour_points)
	
		const scale = 100 / (options.unitsPerEm as number)
		const preview_points = transformed_points.map((point) => {
			return Object.assign({}, point, {
				x: point.x * scale,
				y: point.y * scale,
			})
		})
		const preview_contour = genContour(preview_points)
		modifyComponent(uuid, {
			value: {
				contour: contour,
				preview: preview_contour,
			}
		})
	}

	canvas?.addEventListener('mousedown', onMouseDown)
	document.addEventListener('mousemove', onMouseMove)
	document.addEventListener('mouseup', onMouseUp)
	canvas.addEventListener('keydown', onKeyDown)
	const closeSelect = () => {
		canvas?.removeEventListener('mousedown', onMouseDown)
		document.removeEventListener('mousemove', onMouseMove)
		document.removeEventListener('mouseup', onMouseUp)
		canvas.removeEventListener('keydown', onKeyDown)
		//setSelection('')
	}
	return closeSelect
}

// 渲染组件选择编辑器
// render selection editor for selected component
const renderSelectEditor = (canvas: HTMLCanvasElement, d: number = 10, glyph: boolean = false) => {
	if (!glyph && !selectedComponent.value) return
	if (glyph && !selectedComponent_glyph.value) return
	if (!glyph) {
		if (
			selectedComponent.value.type === 'pen' &&
			(selectedComponent.value.value as unknown as IPenComponent).editMode
		) {
			renderSelectPenEditor(canvas, d)
			return
		}
	} else {
		if (
			selectedComponent_glyph.value.type === 'pen' &&
			(selectedComponent_glyph.value.value as unknown as IPenComponent).editMode
		) {
			renderSelectPenEditor(canvas, d, true)
			return
		}
	}
	const { x, y, w, h, rotation } = glyph ? selectedComponent_glyph.value : selectedComponent.value
	const _x = mapCanvasX(x)
	const _y = mapCanvasY(y)
	const _w = mapCanvasWidth(w)
	const _h = mapCanvasHeight(h)
	const ctx: CanvasRenderingContext2D = canvas?.getContext('2d') as CanvasRenderingContext2D
	ctx.strokeStyle = '#79bbff'
	ctx.translate(_x + _w / 2, _y + _h / 2)
	ctx.rotate(rotation * Math.PI / 180)
	ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
	ctx.strokeRect(_x, _y, _w, _h)
	ctx.strokeRect(_x - d, _y - d, d * 2, d * 2)
	ctx.strokeRect(_x + _w - d, _y - d, d * 2, d * 2)
	ctx.strokeRect(_x - d, _y + _h - d, d * 2, d * 2)
	ctx.strokeRect(_x + _w - d, _y + _h - d, d * 2, d * 2)
	ctx.setTransform(1, 0, 0, 1, 0, 0)
}

export {
	initSelect,
	renderSelectEditor,
}