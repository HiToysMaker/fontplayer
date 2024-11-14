import { genUUID } from '../../utils/string'
import {
	mapCanvasX,
	mapCanvasY,
	mapCanvasWidth,
	mapCanvasHeight,
	getCoord,
} from '../../utils/canvas'
import { ICharacterFile, IComponentValue, editCharacterFile, executeCharacterScript, modifyComponentForCurrentCharacterFile, selectedComponent, selectedComponentUUID, selectedFile, selectedSubComponent, SubComponentsRoot, selectedItemByUUID, modifySubComponent } from '../../fontEditor/stores/files'
import { executeScript, getRatioLayout2, selectedComponent as selectedComponent_glyph } from '../../fontEditor/stores/glyph'
import { getRatioCoords } from '../../features/layout'
import { draggingJoint, putAtCoord, setEditing, movingJoint } from '../stores/glyphDragger'
import { draggable, dragOption, checkJoints } from '../../fontEditor/stores/global'
import { emitter } from '../Event/bus'
import { linkComponentsForJoints } from '../programming/Joint'

const getBound = (joints) => {
	let x_min = Infinity
	let y_min = Infinity
	let x_max = -Infinity
	let y_max = -Infinity
	joints.map(joint => {
		const { x, y } = joint.getPlainCoords()
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

const getLayoutCoords = (layoutTree, coords) => {
	for (let i = 0; i < layoutTree.length; i++) {
		if (!layoutTree[i].children || layoutTree[i].children.length === 0) {
			const { dx, dy, size, centerSquareSize } = (editCharacterFile.value as ICharacterFile).info.gridSettings
			const x1 = Math.round((size - centerSquareSize) / 2) + dx
			const x2 = Math.round((size - centerSquareSize) / 2 + centerSquareSize) + dx
			const y1 = Math.round((size - centerSquareSize) / 2) + dy
			const y2 = Math.round((size - centerSquareSize) / 2 + centerSquareSize) + dy
			for (let m = 0; m < layoutTree[i].coordsSegment; m++) {
				for (let n = 0; n < layoutTree[i].coordsSegment; n++) {
					const coord = getRatioCoords(layoutTree[i], m, n, layoutTree[i].coordsSegment, {
						x1, x2, y1, y2, l: size,
					})
					coords.push({
						x: coord.x,
						y: coord.y,
						col: m,
						row: n,
						id: layoutTree[i].id,
						layout: layoutTree[i],
					})
				}
			}
		} else if (layoutTree[i].children && layoutTree[i].children.length) {
			getLayoutCoords(layoutTree[i].children, coords)
		}
	}
}

const distance = (x1, y1, x2, y2) => {
	return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
}

const addScript = (editGlyph?, coords?) => {
	const glyph = selectedSubComponent.value ? selectedSubComponent.value.value : selectedComponent?.value?.value
	const comp = selectedSubComponent.value ? selectedSubComponent.value : selectedComponent?.value
	const unitsPerEm = selectedFile.value.fontSettings?.unitsPerEm
	if (!editCharacterFile.value.glyph_script) {
		editCharacterFile.value.glyph_script = {}
	}
	if (dragOption.value === 'default' && !selectedSubComponent.value) {
		if (editCharacterFile.value?.glyph_script && editCharacterFile.value?.glyph_script[comp.uuid]) {
			delete editCharacterFile.value?.glyph_script[comp.uuid]
			executeCharacterScript(editCharacterFile.value)
		}
		//if (draggingJoint.value) {
		//	const { x, y } = putAtCoord.value
		//	let script = `if (window.character.getComponent('${comp.name}')) { window.character.getComponent('${comp.name}').ox = ${x} - window.character.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.x; }`
		//	script += `if (window.character.getComponent('${comp.name}')) { window.character.getComponent('${comp.name}').oy = ${y} - window.character.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.y; }`
		//	editCharacterFile.value.glyph_script[comp.uuid] = script
		//} else {
		//	const { x, y } = putAtCoord.value
		//	const script = `if (window.character.getComponent('${comp.name}')) { window.character.getComponent('${comp.name}').ox = ${x} - ${unitsPerEm / 2};window.character.getComponent('${comp.name}').oy = ${y} - ${unitsPerEm / 2} }`
		//	editCharacterFile.value.glyph_script[comp.uuid] = script
		//}
	} else if (dragOption.value === 'default' && !!selectedSubComponent.value) {
		if (SubComponentsRoot.value.value?.glyph_script && SubComponentsRoot.value.value?.glyph_script[comp.uuid]) {
			delete SubComponentsRoot.value.value?.glyph_script[comp.uuid]
			executeScript(SubComponentsRoot.value.value)
		}
		//if (draggingJoint.value) {
		//	const { x, y } = putAtCoord.value
		//	let script = `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').ox = ${x} - window.glyph.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.x; }`
		//	script += `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').oy = ${y} - window.glyph.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.y; }`
		//	SubComponentsRoot.value.value.glyph_script[comp.uuid] = script
		//} else {
		//	const { x, y } = putAtCoord.value
		//	const script = `if (window.character.getComponent('${comp.name}')) { window.character.getComponent('${comp.name}').ox = ${x} - ${unitsPerEm / 2};window.character.getComponent('${comp.name}').oy = ${y} - ${unitsPerEm / 2} }`
		//	SubComponentsRoot.value.value.glyph_script[comp.uuid] = script
		//}
	} else if (dragOption.value === 'layout' && !selectedSubComponent.value) {
		if (draggingJoint.value) {
			let coord = null
			let dx = 0
			let dy = 0
			let d = Infinity
			const { x, y } = putAtCoord.value
			for (let i = 0; i < coords.length; i++) {
				const _coord = coords[i]
				const _d = distance(x, y, _coord.x,  _coord.y)
				if (_d < d) {
					d = _d
					coord = _coord
					dx = x - coord.x
					dy = y - coord.y
				}
			}
			const coords_script = `const ratio_coord = window.character.getRatioCoords(window.character.getLayoutByID('${coord.id}'),${coord.col},${coord.row},${coord.layout.coordsSegment})`
			let script = `${coords_script};`
			script += `if (window.character.getComponent('${comp.name}')) { window.character.getComponent('${comp.name}').ox = ratio_coord.x+${dx} - window.character.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.x; }`
			script += `if (window.character.getComponent('${comp.name}')) { window.character.getComponent('${comp.name}').oy = ratio_coord.y+${dy} - window.character.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.y; }`
			editCharacterFile.value.glyph_script[comp.uuid] = script
			executeCharacterScript(editCharacterFile.value)
		} else {
			let coord = null
			let dx = 0
			let dy = 0
			let d = Infinity
			const { x, y } = putAtCoord.value
			for (let i = 0; i < coords.length; i++) {
				const _coord = coords[i]
				const _d = distance(x, y, _coord.x,  _coord.y)
				if (_d < d) {
					d = _d
					coord = _coord
					dx = x - coord.x
					dy = y - coord.y
				}
			}
			const coords_script = `const ratio_coord = window.character.getRatioCoords(window.character.getLayoutByID('${coord.id}'),${coord.col},${coord.row},${coord.layout.coordsSegment})`
			const script = `${coords_script};window.character.getComponent('${comp.name}')?.ox = ratio_coord.x + ${dx} - ${unitsPerEm / 2};window.character.getComponent('${comp.name}')?.oy = ratio_coord.y + ${dy} - ${unitsPerEm / 2}`
			editCharacterFile.value.glyph_script[comp.uuid] = script
			executeCharacterScript(editCharacterFile.value)
		}
	} else if (dragOption.value === 'layout' && !!selectedSubComponent.value) {
		if (!SubComponentsRoot.value.value.glyph_script) {
			SubComponentsRoot.value.value.glyph_script = {}
		}
		const { ox, oy } = getOrigin2()
		if (draggingJoint.value) {
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
		} else {
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
	// executeCharacterScript(editCharacterFile.value)
	emitter.emit('renderPreviewCanvasByUUID', editCharacterFile.value.uuid)
	emitter.emit('renderCharacter', true)
}

// 字形拖拽工具初始化方法
// initializer for glyph dragger tool
const initGlyphDragger = (canvas: HTMLCanvasElement, editGlyph: boolean = false) => {
	const glyph = selectedSubComponent.value ? selectedSubComponent.value.value : selectedComponent?.value?.value
	let { ox, oy } = getOrigin()
	let _ox
	let _oy
	if (!glyph) return
	const unitsPerEm = selectedFile.value.fontSettings?.unitsPerEm

	let mousedown: boolean = false
	let mousemove: boolean = false
	let lastX = -1
	let lastY = -1
	let mouseDownX = -1
	let mouseDownY = -1
	let coords = []
	const onMouseDown = (e: MouseEvent) => {
		if (!draggable.value) return
		const glyph = selectedSubComponent.value ? selectedSubComponent.value.value : selectedComponent?.value?.value
		if (!glyph) return
		coords = []
		getLayoutCoords(editCharacterFile.value.info.layoutTree, coords)
		const joints = glyph._o?.getJoints()
		mouseDownX = getCoord(e.offsetX)
		mouseDownY = getCoord(e.offsetY)
		const d = 20
		if (checkJoints.value) {
			for (let i = 0; i < joints.length; i++) {
				if (!joints[i].component || !joints[i].rootComponent || !joints[i].componentsTree) {
					linkComponentsForJoints(selectedComponent?.value)
				}
				const { x, y } = joints[i].getCoords()
				if (distance(x, y, mouseDownX, mouseDownY) <= d) {
					draggingJoint.value = joints[i]
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
		// lastX = selectedComponent.value.ox
		// lastY = selectedComponent.value.oy
		_ox = selectedSubComponent.value ? selectedSubComponent.value.ox : selectedComponent.value.ox
		_oy = selectedSubComponent.value ? selectedSubComponent.value.oy : selectedComponent.value.oy
		window.addEventListener('mouseup', onMouseUp)
		// canvas.addEventListener('mousemove', onMouseMove)
	}
	const onMouseMove = (e: MouseEvent) => {
		const d = 20
		const dx = getCoord(e.offsetX) - lastX
		const dy = getCoord(e.offsetY) - lastY
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
					modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
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
			} else {
				putAtCoord.value = {
					x: ox + draggingJoint.value.x + dx,
					y: oy + draggingJoint.value.y + dy,
				}
				if (!selectedSubComponent.value) {
					addScript()
					modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
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
			const glyph = selectedSubComponent.value ? selectedSubComponent.value.value : selectedComponent?.value?.value
			const joints = glyph._o?.getJoints()
			const d = 10
			let mark = false
			const mouseMoveX = getCoord(e.offsetX)
			const mouseMoveY = getCoord(e.offsetY)
			for (let i = 0; i < joints.length; i++) {
				if (!joints[i].component || !joints[i].rootComponent || !joints[i].componentsTree) {
					linkComponentsForJoints(selectedComponent?.value)
				}
				const { x, y } = joints[i].getCoords()
				if (distance(x, y, mouseMoveX, mouseMoveY) <= d) {
					movingJoint.value = joints[i]
					mark = true
				}
			}
			!mark && (movingJoint.value = null)
		}
	}
	const onMouseUp = (e: MouseEvent) => {
		window.removeEventListener('mouseup', onMouseUp)
		setEditing(false)
		if (mousemove) {
			// addScript(glyph, coords)
			addScript(editGlyph, coords)
		}
		mousedown = false
		mousemove = false
		mouseDownX = -1
		mouseDownY = -1
		putAtCoord.value = null
		draggingJoint.value = null
	}
	canvas.addEventListener('mousedown', onMouseDown)
	canvas.addEventListener('mousemove', onMouseMove)
	const closeGlyphDragger = () => {
		canvas.removeEventListener('mousedown', onMouseDown)
		canvas.removeEventListener('mousemove', onMouseMove)
		setEditing(false)
	}
	return closeGlyphDragger
}

const renderGlyphSelector = (canvas: HTMLCanvasElement, editGlyph: boolean = false) => {
	const glyph = selectedSubComponent.value ? selectedSubComponent.value.value : selectedComponent?.value?.value
	const { ox, oy } = getOrigin()
	if (!glyph) return
	const { x, y, w, h } = getBound(glyph._o?.getJoints())
	const _x = mapCanvasX(x + ox)
	const _y = mapCanvasY(y + oy)
	const _w = mapCanvasWidth(w)
	const _h = mapCanvasHeight(h)
	const d = 5
	const ctx = canvas.getContext('2d')
	ctx.strokeStyle = '#79bbff'
	ctx.strokeRect(_x, _y, _w, _h)
	ctx.strokeRect(_x - d, _y - d, d * 2, d * 2)
	ctx.strokeRect(_x + _w - d, _y - d, d * 2, d * 2)
	ctx.strokeRect(_x - d, _y + _h - d, d * 2, d * 2)
	ctx.strokeRect(_x + _w - d, _y + _h - d, d * 2, d * 2)

	// moving joint
	if (movingJoint.value && checkJoints.value) {
		const _d = 10
		const { x, y } = movingJoint.value.getPlainCoords()
		const _x = mapCanvasX(x + ox)
		const _y = mapCanvasY(y + oy)
		ctx.fillStyle = 'red'
		ctx.fillRect(_x - _d, _y - _d, 2 * _d, 2 * _d)
	}

	// dragging joint
	if (draggingJoint.value && checkJoints.value) {
		const { x, y } = draggingJoint.value.getPlainCoords()
		const _d = 10
		const _x = mapCanvasX(x + ox)
		const _y = mapCanvasY(y + oy)
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
		let { ox, oy } = selectedComponent.value
		let root = selectedComponent.value
		for (let i = 1; i < editCharacterFile.value.selectedComponentsTree.length; i++) {
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

const getOrigin2 = () => {
	if (selectedSubComponent.value) {
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
	initGlyphDragger,
	renderGlyphSelector,
}