import {
	distance,
} from '../../utils/math'
import {
	mapCanvasX,
	mapCanvasY,
	mapCanvasWidth,
	mapCanvasHeight,
	getCoord,
} from '../../utils/canvas'
import {
	selectControl,
} from '../../fontEditor/stores/glyphLayoutResizer'
import { ICustomGlyph, RectLayoutParams, getRatioLayout, executeScript, editGlyph } from '../stores/glyph'
import { emitter } from '../Event/bus'
import { SubComponentsRoot, editCharacterFile, selectedComponent, selectedItemByUUID } from '../stores/files'

// 变换字形结构时，初始化方法
// initializier for glyph layout resizer
const initLayoutResizer = (canvas: HTMLCanvasElement) => {
	const d = 20
	let lastX = -1
	let lastY = -1
	let mousedown = false
	const _editGlyph = SubComponentsRoot.value ? SubComponentsRoot.value.value : selectedComponent.value.value
	const { ox, oy } = getOrigin()

	if (!_editGlyph.layout) return
	if (_editGlyph.layout.type !== 'rect') return

	const onMouseDown = (e: MouseEvent) => {
		mousedown = true
	}

	const onMouseMove = (e: MouseEvent) => {
		if(!_editGlyph || !_editGlyph?.layout) return
		const { width, height } = _editGlyph.layout.params as RectLayoutParams
		const centerX = canvas.width / 4 + ox
		const centerY = canvas.height / 4 + oy
		const _x = mapCanvasX(centerX - width / 2)
		const _y = mapCanvasY(centerY - height / 2)
		const _w = mapCanvasWidth(width)
		const _h = mapCanvasHeight(height)
		const x = getCoord(e.offsetX)
		const y = getCoord(e.offsetY)
		const mouseX = e.offsetX * 4
		const mouseY = e.offsetY * 4
		const left_top = { x: _x, y: _y }
		const left_bottom = { x, y: _y + _h }
		const right_top = { x: _x + _w, y: _y }
		const right_bottom = { x: _x + _w, y: _y + _h }

		if (mousedown) {
			switch (selectControl.value) {
				case 'scale-left-top': {
					const _width = x < centerX ? (centerX - x) * 2 : width
					const _height = y < centerY ? (centerY - y) * 2 : height;
					(_editGlyph.layout.params as RectLayoutParams).width = _width;
					(_editGlyph.layout.params as RectLayoutParams).height = _height
					break
				}
				case 'scale-right-top': {
					const _width = x > centerX ? (x - centerX) * 2 : width
					const _height = y < centerY ? (centerY - y) * 2 : height;
					(_editGlyph.layout.params as RectLayoutParams).width = _width;
					(_editGlyph.layout.params as RectLayoutParams).height = _height
					break
				}
				case 'scale-left-bottom': {
					const _width = x < centerX ? (centerX - x) * 2 : width
					const _height = y > centerY ? (y - centerY) * 2 : height;
					(_editGlyph.layout.params as RectLayoutParams).width = _width;
					(_editGlyph.layout.params as RectLayoutParams).height = _height
					break
				}
				case 'scale-right-bottom':{
					const _width = x > centerX ? (x - centerX) * 2 : width
					const _height = y > centerY ? (y - centerY) * 2 : height;
					(_editGlyph.layout.params as RectLayoutParams).width = _width;
					(_editGlyph.layout.params as RectLayoutParams).height = _height
					break
				}
			}
			executeScript(_editGlyph)
			emitter.emit('renderPreviewCanvasByUUID', _editGlyph.uuid)
			emitter.emit('renderCharacter', true)
			renderLayoutEditor(canvas)
		}
		if (!mousedown) {
			if (distance(mouseX, mouseY, left_top.x, left_top.y) <= d) {
				selectControl.value = 'scale-left-top'
			} else if (distance(mouseX, mouseY, right_top.x, right_top.y) <= d) {
				selectControl.value = 'scale-right-top'
			} else if (distance(mouseX, mouseY, left_bottom.x, left_bottom.y) <= d) {
				selectControl.value = 'scale-left-bottom'
			} else if (distance(mouseX, mouseY, right_bottom.x, right_bottom.y) <= d) {
				selectControl.value = 'scale-right-bottom'
			} else {
				selectControl.value = 'null'
			}
		}
		lastX = _x
		lastY = _y
	}

	const onMouseUp = (e: MouseEvent) => {
		mousedown = false
	}

	canvas?.addEventListener('mousedown', onMouseDown)
	document.addEventListener('mousemove', onMouseMove)
	document.addEventListener('mouseup', onMouseUp)
	const closeSelect = () => {
		canvas?.removeEventListener('mousedown', onMouseDown)
		document.removeEventListener('mousemove', onMouseMove)
		document.removeEventListener('mouseup', onMouseUp)
	}
	return closeSelect
}

// 渲染字形结构编辑器
// render selection editor for glyph layout resizer
const renderLayoutEditor = (canvas: HTMLCanvasElement) => {
	const d = 5
	const _editGlyph = SubComponentsRoot.value ? SubComponentsRoot.value.value : selectedComponent.value.value
	const { ox, oy } = getOrigin()
	if (!_editGlyph.layout) return
	if (_editGlyph.layout.type === 'rect') {
		const { width, height } = _editGlyph.layout.params as RectLayoutParams
		const x = canvas.width / 4 + ox - width / 2
		const y = canvas.height / 4 + oy - height / 2
		const _x = mapCanvasX(x)
		const _y = mapCanvasY(y)
		const _w = mapCanvasWidth(width)
		const _h = mapCanvasHeight(height)
		const ctx: CanvasRenderingContext2D = canvas?.getContext('2d') as CanvasRenderingContext2D
		ctx.strokeStyle = '#79bbff'
		ctx.translate(_x + _w / 2, _y + _h / 2)
		ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
		ctx.strokeRect(_x, _y, _w, _h)
		ctx.strokeRect(_x - d, _y - d, d * 2, d * 2)
		ctx.strokeRect(_x + _w - d, _y - d, d * 2, d * 2)
		ctx.strokeRect(_x - d, _y + _h - d, d * 2, d * 2)
		ctx.strokeRect(_x + _w - d, _y + _h - d, d * 2, d * 2)
		ctx.setTransform(1, 0, 0, 1, 0, 0)
	}
}

const getOrigin = () => {
	if (SubComponentsRoot.value) {
		let { ox, oy } = selectedComponent.value
		let root = selectedComponent.value
		for (let i = 1; i < editCharacterFile.value.selectedComponentsTree.length - 1; i++) {
			const compUUID = editCharacterFile.value.selectedComponentsTree[i]
			const comp = selectedItemByUUID(root.value.components, compUUID)
			root = comp
			ox += comp.ox
			oy += comp.oy
		}
		return {
			ox, oy,
		}
	}
	return {
		ox: selectedComponent.value.ox,
		oy: selectedComponent.value.oy,
	}
}

export {
	initLayoutResizer,
	renderLayoutEditor,
}