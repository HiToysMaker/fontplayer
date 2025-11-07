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
import { draggingJoint, putAtCoord, setEditing, movingJoint, editCharacterFileOnDragging, selectedSubComponentOnDragging, selectedComponentOnDragging, SubComponentsRootOnDragging } from '../stores/glyphDragger'
import { draggable, dragOption, checkJoints } from '../../fontEditor/stores/global'
import { emitter } from '../Event/bus'
import { getJoints } from '../programming/Joint'
import * as R from 'ramda'
import { throttle } from '../../utils/performance'

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
	const glyph = selectedSubComponentOnDragging.value ? selectedSubComponentOnDragging.value.value : selectedComponentOnDragging?.value?.value
	const comp = selectedSubComponentOnDragging.value ? selectedSubComponentOnDragging.value : selectedComponentOnDragging?.value
	const unitsPerEm = selectedFile.value.fontSettings?.unitsPerEm
	if (!editCharacterFileOnDragging.value.glyph_script) {
		editCharacterFileOnDragging.value.glyph_script = {}
	}
	if (dragOption.value === 'default' && !selectedSubComponentOnDragging.value) {
		if (editCharacterFileOnDragging.value?.glyph_script && editCharacterFileOnDragging.value?.glyph_script[comp.uuid]) {
			delete editCharacterFileOnDragging.value?.glyph_script[comp.uuid]
			return
			//executeCharacterScript(editCharacterFile.value)
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
	} else if (dragOption.value === 'default' && !!selectedSubComponentOnDragging.value) {
		if (SubComponentsRootOnDragging.value.value?.glyph_script && SubComponentsRootOnDragging.value.value?.glyph_script[comp.uuid]) {
			delete SubComponentsRootOnDragging.value.value?.glyph_script[comp.uuid]
			return
			//executeScript(SubComponentsRoot.value.value)
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
	} else if (dragOption.value === 'layout' && !selectedSubComponentOnDragging.value) {
		if (draggingJoint.value && putAtCoord.value) {
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
			editCharacterFileOnDragging.value.glyph_script[comp.uuid] = script
			executeCharacterScript(editCharacterFileOnDragging.value)
		} else if (putAtCoord.value) {
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
			editCharacterFileOnDragging.value.glyph_script[comp.uuid] = script
			executeCharacterScript(editCharacterFileOnDragging.value)
		}
	} else if (dragOption.value === 'layout' && !!selectedSubComponentOnDragging.value) {
		if (!SubComponentsRootOnDragging.value.value.glyph_script) {
			SubComponentsRootOnDragging.value.value.glyph_script = {}
		}
		const { ox, oy } = getOrigin2()
		if (draggingJoint.value && putAtCoord.value) {
			const { x, y } = putAtCoord.value
			const layout_width = getRatioLayout2(SubComponentsRootOnDragging.value.value, 'width')
			const layout_height = getRatioLayout2(SubComponentsRootOnDragging.value.value, 'height')
			const ratio_width = (x - (unitsPerEm - layout_width) / 2 - ox) / layout_width
			const ratio_height = (y - (unitsPerEm - layout_height) / 2 - oy) / layout_height

			const _x = selectedSubComponentOnDragging.value.value._o.getJoint(`${draggingJoint.value.name}`)?.x;
			const __x = (unitsPerEm - layout_width) / 2 + layout_width * ratio_width

			let script = `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').ox = (${unitsPerEm} - window.glyph.getRatioLayout('width')) / 2 + window.glyph.getRatioLayout('width') * ${ratio_width} - window.glyph.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.x; }`
			script += `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').oy = (${unitsPerEm} - window.glyph.getRatioLayout('height')) / 2 + window.glyph.getRatioLayout('height') * ${ratio_height} - window.glyph.getGlyph('${comp.name}')?.getJoint('${draggingJoint.value.name}')?.y; }`
			SubComponentsRootOnDragging.value.value.glyph_script[comp.uuid] = script
		} else if (putAtCoord.value) {
			const { x, y } = putAtCoord.value
			const _ox = x - unitsPerEm / 2
			const _oy = y - unitsPerEm / 2
			const layout_width = getRatioLayout2(SubComponentsRootOnDragging.value.value, 'width')
			const layout_height = getRatioLayout2(SubComponentsRootOnDragging.value.value, 'height')
			const ratio_width = (_ox - (unitsPerEm - layout_width) / 2 - ox) / layout_width
			const ratio_height = (_oy - (unitsPerEm - layout_height) / 2 - oy) / layout_height
			let script = `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').ox = (${unitsPerEm} - window.glyph.getRatioLayout('width')) / 2 + window.glyph.getRatioLayout('width') * ${ratio_width}; }`
			script += `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').oy = (${unitsPerEm} - window.glyph.getRatioLayout('height')) / 2 + window.glyph.getRatioLayout('height') * ${ratio_height}; }`
			SubComponentsRootOnDragging.value.value.glyph_script[comp.uuid] = script
		}
		executeScript(SubComponentsRootOnDragging.value.value)
	}
	// executeCharacterScript(editCharacterFile.value)
	// emitter.emit('renderPreviewCanvasByUUID', editCharacterFile.value.uuid)
	emitter.emit('renderCharacter', true)
}

// 字形拖拽工具初始化方法
// initializer for glyph dragger tool
const initGlyphDragger = (canvas: HTMLCanvasElement, editGlyph: boolean = false) => {
	let ox
	let oy
	let _ox
	let _oy
	const unitsPerEm = selectedFile.value.fontSettings?.unitsPerEm

	let mousedown: boolean = false
	let mousemove: boolean = false
	let lastX = -1
	let lastY = -1
	let mouseDownX = -1
	let mouseDownY = -1
	let coords = []
	let isDraggingFirstJoint = false  // 标记是否拖拽第一个关键点

	// 创建时间节流函数，16ms ≈ 60fps
	const throttledRender_skeletonDrag = throttle((glyph, joint, dx, dy) => {
		glyph._o.onSkeletonDrag({
			draggingJoint: joint,
			deltaX: dx,
			deltaY: dy,
		})
		emitter.emit('renderCharacter')
	}, 16, { leading: true, trailing: true })

	const throttledRender_glyphDrag = throttle((dx, dy) => {
		if (!selectedSubComponentOnDragging.value) {
			if (!editCharacterFileOnDragging.value) return
			for (let i = 0; i < editCharacterFileOnDragging.value.components.length; i++) {
				if (editCharacterFileOnDragging.value.components[i].uuid === selectedComponentUUID.value) {
					editCharacterFileOnDragging.value.components[i].ox = _ox + dx
					editCharacterFileOnDragging.value.components[i].oy = _oy + dy
				}
			}
			emitter.emit('renderCharacter')
		} else {
			addScript()
			modifySubComponent({
				ox: _ox + dx,
				oy: _oy + dy,
			})
		}
	}, 16, { leading: true, trailing: true })

	const onMouseDown = (e: MouseEvent) => {
		if (!draggable.value) return
		editCharacterFileOnDragging.value = R.clone(editCharacterFile.value)
		for (let i = 0; i < editCharacterFileOnDragging.value.components.length; i++) {
			const component = editCharacterFileOnDragging.value.components[i]
			if (component.type === 'glyph') {
				executeScript(component.value)
			}
		}
		// joint数据格式：{x, y, name}
		let joints = []
		let glyph = null
		if (selectedSubComponentOnDragging.value) {
			// 当前选中组件为子字形组件
			joints = getJoints(selectedComponentOnDragging?.value, selectedSubComponentOnDragging.value.uuid)
			glyph = selectedSubComponentOnDragging.value.value
		} else if (selectedComponentOnDragging?.value) {
			// 当前选中组件为根目录中组件
			joints = getJoints(selectedComponentOnDragging?.value, selectedComponentOnDragging?.value.uuid)
			glyph = selectedComponentOnDragging?.value?.value
		}
		if (!glyph || !glyph._o) return
		joints = joints.filter(joint => !joint.name.includes('_ref'))
		coords = []
		getLayoutCoords(editCharacterFileOnDragging.value.info.layoutTree, coords)
		mouseDownX = getCoord(e.offsetX)
		mouseDownY = getCoord(e.offsetY)
		const d = 20
		if (checkJoints.value) {
			for (let i = 0; i < joints.length; i++) {
				const { x, y } = joints[i]
				if (distance(x, y, mouseDownX, mouseDownY) <= d) {
					// 拖拽关键点
					draggingJoint.value = joints[i]
					// 如果是第一个关键点，标记为移动整个组件
					isDraggingFirstJoint = (i === 0)
					// 如果不是第一个关键点，且设置了onSkeletonDragStart，则骨架可拖拽
					if (i !== 0 && glyph._o.onSkeletonDragStart) {
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
		// lastX = selectedComponent.value.ox
		// lastY = selectedComponent.value.oy
		_ox = selectedSubComponentOnDragging.value ? selectedSubComponentOnDragging.value.ox : selectedComponentOnDragging.value.ox
		_oy = selectedSubComponentOnDragging.value ? selectedSubComponentOnDragging.value.oy : selectedComponentOnDragging.value.oy
		window.addEventListener('mouseup', onMouseUp)
		// canvas.addEventListener('mousemove', onMouseMove)
	}
	const onMouseMove = (e: MouseEvent) => {
		const d = 20
		const dx = getCoord(e.offsetX) - lastX
		const dy = getCoord(e.offsetY) - lastY
		let glyph = null
		if (editCharacterFileOnDragging.value && selectedSubComponentOnDragging.value) {
			// 当前选中组件为子字形组件
			glyph = selectedSubComponentOnDragging.value.value
		} else if (editCharacterFileOnDragging.value && selectedComponentOnDragging?.value) {
			// 当前选中组件为根目录中组件
			glyph = selectedComponentOnDragging?.value?.value
		} else if (!editCharacterFileOnDragging.value && selectedSubComponent.value) {
			// 当前选中组件为子字形组件
			glyph = selectedSubComponent.value.value
		} else if (!editCharacterFileOnDragging.value && selectedComponent?.value) {
			// 当前选中组件为根目录中组件
			glyph = selectedComponent?.value?.value
		}
		mousemove = true
		if (mousedown) {
			// 没有拖拽joint节点，或者拖拽的是第一个关键点（移动整个组件）
			if (!draggingJoint.value || isDraggingFirstJoint) {
				putAtCoord.value = {
					x: ox + dx + unitsPerEm / 2,
					y: oy + dy + unitsPerEm / 2,
				}
				// if (!selectedSubComponentOnDragging.value) {
				// 	//addScript()
				// 	// modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
				// 	// 	ox: _ox + dx,
				// 	// 	oy: _oy + dy,
				// 	// })
				// 	for (let i = 0; i < editCharacterFileOnDragging.value.components.length; i++) {
				// 		if (editCharacterFileOnDragging.value.components[i].uuid === selectedComponentUUID.value) {
				// 			editCharacterFileOnDragging.value.components[i].ox = _ox + dx
				// 			editCharacterFileOnDragging.value.components[i].oy = _oy + dy
				// 		}
				// 	}
				// 	emitter.emit('renderCharacter')
				// } else {
				// 	addScript()
				// 	modifySubComponent({
				// 		ox: _ox + dx,
				// 		oy: _oy + dy,
				// 	})
				// }
				throttledRender_glyphDrag(dx, dy)
			} else if (glyph._o?.onSkeletonDrag) {
				// 如果设置了onSkeletonDrag，则骨架可拖拽，拖拽骨架则不再移动字形
				// glyph._o.onSkeletonDrag({
				// 	draggingJoint: draggingJoint.value,
				// 	deltaX: dx,
				// 	deltaY: dy,
				// })
				// emitter.emit('renderCharacter')
				throttledRender_skeletonDrag(glyph, draggingJoint.value, dx, dy)
			} else {
				putAtCoord.value = {
					x: ox + draggingJoint.value.x + dx,
					y: oy + draggingJoint.value.y + dy,
				}
				if (!selectedSubComponentOnDragging.value) {
					addScript()
					// modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
					// 	ox: _ox + dx,
					// 	oy: _oy + dy,
					// })
					for (let i = 0; i < editCharacterFileOnDragging.value.components.length; i++) {
						if (editCharacterFileOnDragging.value.components[i].uuid === selectedComponentUUID.value) {
							editCharacterFileOnDragging.value.components[i].ox = _ox + dx
							editCharacterFileOnDragging.value.components[i].oy = _oy + dy
						}
					}
				} else {
					addScript()
					// modifySubComponent({
					// 	ox: _ox + dx,
					// 	oy: _oy + dy,
					// })
					for (let i = 0; i < editCharacterFileOnDragging.value.components.length; i++) {
						if (editCharacterFileOnDragging.value.components[i].uuid === selectedComponentUUID.value) {
							editCharacterFileOnDragging.value.components[i].ox = _ox + dx
							editCharacterFileOnDragging.value.components[i].oy = _oy + dy
						}
					}
				}
			}
		} else if (checkJoints.value) {
			// joint数据格式：{x, y, name}
			let joints = []
			if (selectedSubComponent.value) {
				// 当前选中组件为子字形组件
				joints = getJoints(selectedComponent?.value, selectedSubComponent.value.uuid)
			} else if (selectedComponent?.value) {
				// 当前选中组件为根目录中组件
				joints = getJoints(selectedComponent?.value, selectedComponent?.value.uuid)
			}
			// 过滤掉参考关键点（名称包含 _ref 的关键点）
			joints = joints.filter(joint => !joint.name.includes('_ref'))
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
		if (selectedSubComponentOnDragging.value) {
			// 当前选中组件为子字形组件
			glyph = selectedSubComponentOnDragging.value.value
		} else if (selectedComponentOnDragging?.value) {
			// 当前选中组件为根目录中组件
			glyph = selectedComponentOnDragging?.value?.value
		}
		const dx = getCoord(e.offsetX) - lastX
		const dy = getCoord(e.offsetY) - lastY
		// 只有拖拽非第一个关键点且设置了onSkeletonDragEnd时，才调用骨架拖拽结束
		if (glyph._o?.onSkeletonDragEnd && mousedown && !isDraggingFirstJoint) {
			// 如果设置了onSkeletonDragEnd，则骨架可拖拽
			glyph._o.onSkeletonDragEnd({
				draggingJoint: draggingJoint.value,
				deltaX: dx,
				deltaY: dy,
			})
		}
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
		lastX = 0
		lastY = 0
		putAtCoord.value = null
		draggingJoint.value = null
		isDraggingFirstJoint = false  // 重置第一个关键点拖拽标志
		editCharacterFile.value.glyph_script = R.clone(editCharacterFileOnDragging.value.glyph_script)
		editCharacterFile.value.components = R.clone(editCharacterFileOnDragging.value.components)
		editCharacterFileOnDragging.value = null
		emitter.emit('renderPreviewCanvasByUUIDOnEditing', editCharacterFile.value.uuid)
	}
	canvas.addEventListener('mousedown', onMouseDown)
	canvas.addEventListener('mousemove', onMouseMove)
	const closeGlyphDragger = () => {
		canvas.removeEventListener('mousedown', onMouseDown)
		canvas.removeEventListener('mousemove', onMouseMove)
		editCharacterFileOnDragging.value = null
		isDraggingFirstJoint = false  // 清理时重置标志
		setEditing(false)
	}
	return closeGlyphDragger
}

const renderGlyphSelector = (canvas: HTMLCanvasElement, editGlyph: boolean = false) => {
	let glyph = null
	let comp = null
	if (editCharacterFileOnDragging.value && selectedSubComponentOnDragging.value) {
		// 当前选中组件为子字形组件
		glyph = selectedSubComponentOnDragging.value.value
		comp = selectedSubComponentOnDragging.value
	} else if (editCharacterFileOnDragging.value && selectedComponentOnDragging?.value) {
		// 当前选中组件为根目录中组件
		glyph = selectedComponentOnDragging?.value?.value
		comp = selectedComponentOnDragging.value
	} else if (!editCharacterFileOnDragging.value && selectedSubComponent.value) {
		// 当前选中组件为子字形组件
		glyph = selectedSubComponent.value.value
		comp = selectedSubComponent.value
	} else if (!editCharacterFileOnDragging.value && selectedComponent?.value) {
		// 当前选中组件为根目录中组件
		glyph = selectedComponent?.value?.value
		comp = selectedComponent.value
	}
	if (!glyph) return
	const { ox, oy } = getOrigin()
	let joints = getJoints(comp, comp.uuid)
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
	// ctx.strokeStyle = '#79bbff'
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
	if (selectedSubComponentOnDragging.value) {
		let { ox, oy } = selectedComponentOnDragging.value
		let root = selectedComponentOnDragging.value
		for (let i = 1; i < editCharacterFileOnDragging.value.selectedComponentsTree.length; i++) {
			const compUUID = editCharacterFileOnDragging.value.selectedComponentsTree[i]
			const comp = selectedItemByUUID(root.value.components, compUUID)
			root = comp
			ox += comp.ox
			oy += comp.oy
		}
		return {
			ox, oy,
		}
	} else if (selectedSubComponent.value) {
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
		ox: editCharacterFileOnDragging.value ? selectedComponentOnDragging.value.ox : selectedComponent.value.ox,
		oy: editCharacterFileOnDragging.value ? selectedComponentOnDragging.value.oy : selectedComponent.value.oy,
	}
}

const getOrigin2 = () => {
	if (selectedSubComponentOnDragging.value) {
		let { ox, oy } = selectedComponentOnDragging.value
		let root = selectedComponentOnDragging.value
		for (let i = 1; i < editCharacterFileOnDragging.value.selectedComponentsTree.length - 1; i++) {
			const compUUID = editCharacterFileOnDragging.value.selectedComponentsTree[i]
			const comp = selectedItemByUUID(root.value.components, compUUID)
			root = comp
			ox += comp.ox
			oy += comp.oy
		}
		return {
			ox, oy,
		}
	} else if (selectedSubComponent.value) {
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
		ox: editCharacterFileOnDragging.value ? selectedComponentOnDragging.value.ox : selectedComponent.value.ox,
		oy: editCharacterFileOnDragging.value ? selectedComponentOnDragging.value.oy : selectedComponent.value.oy,
	}
}

export {
	initGlyphDragger,
	renderGlyphSelector,
}