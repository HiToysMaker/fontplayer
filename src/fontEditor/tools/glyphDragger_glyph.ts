import { genUUID } from '../../utils/string'
import {
	mapCanvasX,
	mapCanvasY,
	mapCanvasWidth,
	mapCanvasHeight,
	getCoord,
} from '../../utils/canvas'
import { editGlyph, executeScript, getRatioLayout, getRatioLayout2, modifyComponentForCurrentGlyph, modifySubComponent, selectedComponent as selectedComponent_glyph, selectedComponentUUID, selectedSubComponent, SubComponentsRoot } from '../../fontEditor/stores/glyph'
import { draggingJoint, putAtCoord, setEditing, movingJoint } from '../stores/glyphDragger_glyph'
import { draggable, dragOption, checkJoints } from '../../fontEditor/stores/global'
import { emitter } from '../Event/bus'
import { selectedItemByUUID } from '../stores/files'
import { getJoints } from '../programming/Joint'

const getBound = (joints) => {
	let x_min = Infinity
	let y_min = Infinity
	let x_max = -Infinity
	let y_max = -Infinity
	joints.map(joint => {
		const { x, y } = joint
		if (x < x_min) {
			x_min = x
		}
		if (x > x_max) {
			x_max = x
		}
		if (y < y_min) {
			y_min = y
		}
		if (y > y_max) {
			y_max = y
		}
	})
	return {
		x: x_min, y: y_min, w: x_max - x_min, h: y_max - y_min, 
	}
}

const distance = (x1, y1, x2, y2) => {
	return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
}

const addScript = () => {
	const glyph = selectedSubComponent.value ? selectedSubComponent.value.value : selectedComponent_glyph?.value?.value
	const comp = selectedSubComponent.value ? selectedSubComponent.value : selectedComponent_glyph?.value
	const unitsPerEm = 1000//selectedFile.value.fontSettings?.unitsPerEm
	
	if (!editGlyph.value.glyph_script) {
		editGlyph.value.glyph_script = {}
	}

	if (dragOption.value === 'default' && !selectedSubComponent.value) {
		if (editGlyph.value?.glyph_script && editGlyph.value?.glyph_script[comp.uuid]) {
			delete editGlyph.value?.glyph_script[comp.uuid]
			return
		}
	} else if (dragOption.value === 'default' && !!selectedSubComponent.value) {
		if (SubComponentsRoot.value.value?.glyph_script && SubComponentsRoot.value.value?.glyph_script[comp.uuid]) {
			delete SubComponentsRoot.value.value?.glyph_script[comp.uuid]
			return
		}
	} else if (dragOption.value === 'layout' && editGlyph.value.layout && !selectedSubComponent.value) {
		if (draggingJoint.value && putAtCoord.value) {
			const { x, y } = putAtCoord.value
			const layout_width = getRatioLayout(glyph, 'width')
			const layout_height = getRatioLayout(glyph, 'height')
			const ratio_width = (x - (unitsPerEm - layout_width) / 2) / layout_width
			const ratio_height = (y - (unitsPerEm - layout_height) / 2) / layout_height
			let script = `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').ox = (${unitsPerEm} - window.glyph.getRatioLayout('width')) / 2 + window.glyph.getRatioLayout('width') * ${ratio_width} - window.glyph.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.x; }`
			script += `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').oy = (${unitsPerEm} - window.glyph.getRatioLayout('height')) / 2 + window.glyph.getRatioLayout('height') * ${ratio_height} - window.glyph.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.y; }`
			editGlyph.value.glyph_script[comp.uuid] = script
		} else if (putAtCoord.value) {
			const { x, y } = putAtCoord.value
			const _ox = x - unitsPerEm / 2
			const _oy = y - unitsPerEm / 2
			const layout_width = getRatioLayout(glyph, 'width')
			const layout_height = getRatioLayout(glyph, 'height')
			const ratio_width = (_ox - (unitsPerEm - layout_width) / 2) / layout_width
			const ratio_height = (_oy - (unitsPerEm - layout_height) / 2) / layout_height
			let script = `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').ox = (${unitsPerEm} - window.glyph.getRatioLayout('width')) / 2 + window.glyph.getRatioLayout('width') * ${ratio_width}; }`
			script += `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').oy = (${unitsPerEm} - window.glyph.getRatioLayout('height')) / 2 + window.glyph.getRatioLayout('height') * ${ratio_height}; }`
			editGlyph.value.glyph_script[comp.uuid] = script
		}
	} else if (dragOption.value === 'layout' && !!selectedSubComponent.value) {
		if (!SubComponentsRoot.value.value.glyph_script) {
			SubComponentsRoot.value.value.glyph_script = {}
		}
		const { ox, oy } = getOrigin2()
		if (draggingJoint.value && putAtCoord.value) {
			const { x, y } = putAtCoord.value
			const layout_width = getRatioLayout2(SubComponentsRoot.value.value, 'width')
			const layout_height = getRatioLayout2(SubComponentsRoot.value.value, 'height')
			const ratio_width = (x - (unitsPerEm - layout_width) / 2 - ox) / layout_width
			const ratio_height = (y - (unitsPerEm - layout_height) / 2 - oy) / layout_height

			const _x = selectedSubComponent.value.value._o.getJoint(`${draggingJoint.value.name}`)?.x;
			const __x = (unitsPerEm - layout_width) / 2 + layout_width * ratio_width

			let script = `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').ox = (${unitsPerEm} - window.glyph.getRatioLayout('width')) / 2 + window.glyph.getRatioLayout('width') * ${ratio_width} - window.glyph.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.x; }`
			script += `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').oy = (${unitsPerEm} - window.glyph.getRatioLayout('height')) / 2 + window.glyph.getRatioLayout('height') * ${ratio_height} - window.glyph.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.y; }`
			SubComponentsRoot.value.value.glyph_script[comp.uuid] = script
		} else if (putAtCoord.value) {
			const { x, y } = putAtCoord.value
			const _ox = x - unitsPerEm / 2
			const _oy = y - unitsPerEm / 2
			const layout_width = getRatioLayout2(SubComponentsRoot.value.value, 'width')
			const layout_height = getRatioLayout2(SubComponentsRoot.value.value, 'height')
			const ratio_width = (_ox - (unitsPerEm - layout_width) / 2 - ox) / layout_width
			const ratio_height = (_oy - (unitsPerEm - layout_height) / 2 - oy) / layout_height
			let script = `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').ox = (${unitsPerEm} - window.glyph.getRatioLayout('width')) / 2 + window.glyph.getRatioLayout('width') * ${ratio_width}; }`
			script += `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').oy = (${unitsPerEm} - window.glyph.getRatioLayout('height')) / 2 + window.glyph.getRatioLayout('height') * ${ratio_height}; }`
			SubComponentsRoot.value.value.glyph_script[comp.uuid] = script
		}
		executeScript(SubComponentsRoot.value.value)
	}

	executeScript(editGlyph.value)
	emitter.emit('renderGlyphPreviewCanvasByUUID', editGlyph.value.uuid)
	emitter.emit('renderGlyph', true)
	// if (editGlyph.value.layout && editingLayout.value) {
	//   renderLayoutEditor(canvas, editGlyph.value, 0, 0)
	// }
}

// 字形拖拽工具初始化方法
// initializer for glyph dragger tool
const initGlyphDragger = (canvas: HTMLCanvasElement, editGlyph: boolean = true) => {
	const glyph = selectedSubComponent.value ? selectedSubComponent.value.value : selectedComponent_glyph?.value?.value
	let { ox, oy } = getOrigin()
	let _ox
	let _oy
	if (!glyph) return
	const comp = selectedComponent_glyph.value
	const unitsPerEm = 1000//selectedFile.value.fontSettings?.unitsPerEm

	let mousedown: boolean = false
	let mousemove: boolean = false
	let lastX = -1
	let lastY = -1
	let mouseDownX = -1
	let mouseDownY = -1
	let coords = []
	const onMouseDown = (e: MouseEvent) => {
		if (!draggable.value) return
		// joint数据格式：{x, y, name}
		let joints = []
		let glyph = null
		if (selectedSubComponent.value) {
			// 当前选中组件为子字形组件
			joints = getJoints(selectedComponent_glyph?.value, selectedSubComponent.value.uuid)
			glyph = selectedSubComponent.value.value
		} else if (selectedComponent_glyph?.value) {
			// 当前选中组件为根目录中组件
			joints = getJoints(selectedComponent_glyph?.value, selectedComponent_glyph?.value.uuid)
			glyph = selectedComponent_glyph?.value?.value
		}
		if (!glyph || !glyph._o) return
		mouseDownX = getCoord(e.offsetX)
		mouseDownY = getCoord(e.offsetY)
		const d = 10
		if (checkJoints.value && !draggingJoint.value) {
			for (let i = 0; i < joints.length; i++) {
				const { ox, oy } = getOrigin()
				const { x, y } = joints[i]
				if (distance(x, y, mouseDownX, mouseDownY) <= d) {
					// 拖拽关键点
					draggingJoint.value = joints[i]
					// 如果设置了onSkeletonDragStart，则骨架可拖拽
					if (glyph._o.onSkeletonDragStart) {
						glyph._o.onSkeletonDragStart({
							draggingJoint: draggingJoint.value,
							deltaX: 0,
							deltaY: 0,
						})
					}
				}
			}
		}
		setEditing(true)
		mousedown = true
		lastX = getCoord(e.offsetX)
		lastY = getCoord(e.offsetY)
		const origin = getOrigin()
		ox = origin.ox
		oy = origin.oy
		_ox = selectedSubComponent.value ? selectedSubComponent.value.ox : selectedComponent_glyph.value.ox
		_oy = selectedSubComponent.value ? selectedSubComponent.value.oy : selectedComponent_glyph.value.oy
		// lastX = selectedComponent.value.ox
		// lastY = selectedComponent.value.oy
		window.addEventListener('mouseup', onMouseUp)
	}
	const onMouseMove = (e: MouseEvent) => {
		const d = 20
		const dx = getCoord(e.offsetX) - lastX
		const dy = getCoord(e.offsetY) - lastY
		let glyph = null
		if (selectedSubComponent.value) {
			// 当前选中组件为子字形组件
			glyph = selectedSubComponent.value.value
		} else if (selectedComponent_glyph?.value) {
			// 当前选中组件为根目录中组件
			glyph = selectedComponent_glyph?.value?.value
		}
		mousemove = true
		if (mousedown) {
			// 没有拖拽joint节点
			if (!draggingJoint.value) {
				putAtCoord.value = {
					x: ox + dx + unitsPerEm / 2,
					y: oy + dy + unitsPerEm / 2,
				}
				if (!selectedSubComponent.value) {
					addScript()
					modifyComponentForCurrentGlyph(selectedComponentUUID.value, {
						ox: _ox + dx,
						oy: _oy + dy,
					})
				} else {
					addScript()
					modifySubComponent({
						ox: _ox + dx,
						oy: _oy + dy,
					})
				}
			} else if (glyph._o?.onSkeletonDrag) {
				// 如果设置了onSkeletonDrag，则骨架可拖拽，拖拽骨架则不再移动字形
				glyph._o.onSkeletonDrag({
					draggingJoint: draggingJoint.value,
					deltaX: dx,
					deltaY: dy,
				})
				emitter.emit('renderGlyph')
			} else {
				putAtCoord.value = {
					x: ox + draggingJoint.value.x + dx,
					y: oy + draggingJoint.value.y + dy,
				}
				if (!selectedSubComponent.value) {
					addScript()
					modifyComponentForCurrentGlyph(selectedComponentUUID.value, {
						ox: _ox + dx,
						oy: _oy + dy,
					})
				} else {
					addScript()
					modifySubComponent({
						ox: _ox + dx,
						oy: _oy + dy,
					})
				}
			}
		} else if (checkJoints.value) {
			// joint数据格式：{x, y, name}
			let joints = []
			let glyph = null
			if (selectedSubComponent.value) {
				// 当前选中组件为子字形组件
				joints = getJoints(selectedComponent_glyph?.value, selectedSubComponent.value.uuid)
			} else if (selectedComponent_glyph?.value) {
				// 当前选中组件为根目录中组件
				joints = getJoints(selectedComponent_glyph?.value, selectedComponent_glyph?.value.uuid)
			}
			if (!glyph) return
			const d = 10
			let mark = false
			const mouseMoveX = getCoord(e.offsetX)
			const mouseMoveY = getCoord(e.offsetY)
			for (let i = 0; i < joints.length; i++) {
				const { x, y } = joints[i]
				if (distance(x, y, mouseMoveX, mouseMoveY) <= d) {
					movingJoint.value = joints[i]
					mark = true
				}
			}
			!mark && (movingJoint.value = null)
		}
	}
	const onMouseUp = (e: MouseEvent) => {
		let glyph = null
		if (selectedSubComponent.value) {
			// 当前选中组件为子字形组件
			glyph = selectedSubComponent.value.value
		} else if (selectedComponent_glyph?.value) {
			// 当前选中组件为根目录中组件
			glyph = selectedComponent_glyph?.value?.value
		}
		const dx = getCoord(e.offsetX) - lastX
		const dy = getCoord(e.offsetY) - lastY
		if (glyph._o?.onSkeletonDragEnd && mousedown) {
			// 如果设置了onSkeletonDragEnd，则骨架可拖拽
			glyph._o.onSkeletonDragEnd({
				draggingJoint: draggingJoint.value,
				deltaX: dx,
				deltaY: dy,
			})
		}
		setEditing(false)
		if (mousemove && mousedown) {
			// addScript(glyph, coords)
			window.removeEventListener('mouseup', onMouseUp)
			addScript()
		}
		mousedown = false
		mousemove = false
		mouseDownX = -1
		mouseDownY = -1
		lastX = 0
		lastY = 0
		putAtCoord.value = null
		draggingJoint.value = null
		movingJoint.value = null
	}
	canvas.addEventListener('mousedown', onMouseDown)
	window.addEventListener('mousemove', onMouseMove)
	const closeGlyphDragger = () => {
		canvas.removeEventListener('mousedown', onMouseDown)
		window.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
		setEditing(false)
	}
	return closeGlyphDragger
}

const renderGlyphSelector = (canvas: HTMLCanvasElement, _editGlyph: boolean = true) => {
	const glyph = selectedSubComponent.value ? selectedSubComponent.value.value : selectedComponent_glyph?.value?.value
	const { ox, oy } = getOrigin()
	if (!glyph) return
	//executeScript(editGlyph.value)

	let joints = []
	if (selectedSubComponent.value) {
		// 当前选中组件为子字形组件
		joints = getJoints(selectedComponent_glyph?.value, selectedSubComponent.value.uuid)
	} else if (selectedComponent_glyph?.value) {
		// 当前选中组件为根目录中组件
		joints = getJoints(selectedComponent_glyph?.value, selectedComponent_glyph?.value.uuid)
	}
	const getJoint = (name: string) => {
		for (let i = 0; i < joints.length; i++) {
			if (joints[i].name === name) {
				return joints[i]
			}
		}
		return {
			x: 0,
			y: 0,
		}
	}
	const { x, y, w, h } = getBound(joints)
	const _x = mapCanvasX(x)
	const _y = mapCanvasY(y)
	const _w = mapCanvasWidth(w)
	const _h = mapCanvasHeight(h)
	const d = 5
	const ctx = canvas.getContext('2d')
	ctx.strokeStyle = '#79bbff'
	// ctx.strokeRect(_x, _y, _w, _h)
	// ctx.strokeRect(_x - d, _y - d, d * 2, d * 2)
	// ctx.strokeRect(_x + _w - d, _y - d, d * 2, d * 2)
	// ctx.strokeRect(_x - d, _y + _h - d, d * 2, d * 2)
	// ctx.strokeRect(_x + _w - d, _y + _h - d, d * 2, d * 2)

	// moving joint
	if (movingJoint.value && checkJoints.value) {
		const _d = 10
		const { x, y } = getJoint(movingJoint.value.name)
		const _x = mapCanvasX(x)
		const _y = mapCanvasY(y)
		ctx.fillStyle = 'red'
		ctx.fillRect(_x - _d, _y - _d, 2 * _d, 2 * _d)
	}

	// dragging joint
	if (draggingJoint.value && checkJoints.value) {
		const { x, y } = getJoint(draggingJoint.value.name)
		const _d = 10
		const _x = mapCanvasX(x)
		const _y = mapCanvasY(y)
		ctx.fillStyle = 'red'
		ctx.fillRect(_x - _d, _y - _d, 2 * _d, 2 * _d)
	}

	// putat coord
	if (putAtCoord.value && putAtCoord.value.id) {
		const { x, y } = putAtCoord.value
		const _x = mapCanvasX(x)
		const _y = mapCanvasY(y)
		ctx.fillStyle = 'red'
		ctx.fillRect(_x - d, _y - d, 2 * d, 2 * d)
	}
}

const getOrigin = () => {
	if (selectedSubComponent.value) {
		let { ox, oy } = selectedComponent_glyph.value
		let root = selectedComponent_glyph.value
		for (let i = 1; i < editGlyph.value.selectedComponentsTree.length; i++) {
			const compUUID = editGlyph.value.selectedComponentsTree[i]
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
		ox: selectedComponent_glyph.value.ox,
		oy: selectedComponent_glyph.value.oy,
	}
}

const getOrigin2 = () => {
	if (selectedSubComponent.value) {
		let { ox, oy } = selectedComponent_glyph.value
		let root = selectedComponent_glyph.value
		for (let i = 1; i < editGlyph.value.selectedComponentsTree.length - 1; i++) {
			const compUUID = editGlyph.value.selectedComponentsTree[i]
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
		ox: selectedComponent_glyph.value.ox,
		oy: selectedComponent_glyph.value.oy,
	}
}

export {
	initGlyphDragger,
	renderGlyphSelector,
}