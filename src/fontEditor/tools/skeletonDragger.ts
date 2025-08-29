import { genUUID } from '../../utils/string'
import {
	mapCanvasX,
	mapCanvasY,
	mapCanvasWidth,
	mapCanvasHeight,
	getCoord,
} from '../../utils/canvas'
import { editGlyph } from '../../fontEditor/stores/glyph'
import { draggingJoint, putAtCoord, setEditing, movingJoint, editGlyphOnDragging } from '../stores/skeletonDragger'
import { emitter } from '../Event/bus'
import * as R from 'ramda'

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

const getJoints = () => {
  const joints = editGlyphOnDragging.value ? editGlyphOnDragging.value._o?.getJoints().map((joint) => {
    const { x, y } = joint.getCoords()
    return {
      name: joint.name,
      x: x,// + editGlyphOnDragging.value.skelecton?.ox || 0,
      y: y,// + editGlyphOnDragging.value.skelecton?.oy || 0,
    }
  }) : editGlyph.value._o?.getJoints().map((joint) => {
    const { x, y } = joint.getCoords()
    return {
      name: joint.name,
      x: x,
      y: y,
    }
  })
  return joints
}

// 骨架拖拽工具初始化方法
// initializer for skeleton dragger tool
const initSkeletonDragger = (canvas: HTMLCanvasElement) => {
	let ox
	let oy
	let _ox
	let _oy
	const unitsPerEm = 1000 //selectedFile.value.fontSettings?.unitsPerEm

	let mousedown: boolean = false
	let mousemove: boolean = false
	let lastX = -1
	let lastY = -1
	let mouseDownX = -1
	let mouseDownY = -1
	let coords = []
	const onMouseDown = (e: MouseEvent) => {
    editGlyphOnDragging.value = R.clone(editGlyph.value)
		// joint数据格式：{x, y, name}
		let joints = getJoints()
		let glyph = editGlyphOnDragging.value
		if (!glyph || !glyph._o) return
		coords = []
		mouseDownX = getCoord(e.offsetX)
		mouseDownY = getCoord(e.offsetY)
		const d = 20
    for (let i = 0; i < joints.length; i++) {
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
		setEditing(true)
		mousedown = true
		lastX = getCoord(e.offsetX)
		lastY = getCoord(e.offsetY)
		window.addEventListener('mouseup', onMouseUp)
	}
	const onMouseMove = (e: MouseEvent) => {
		const d = 20
		const dx = getCoord(e.offsetX) - lastX
		const dy = getCoord(e.offsetY) - lastY
		let glyph = editGlyphOnDragging.value
		mousemove = true
		if (mousedown) {
			// 没有拖拽joint节点
			if (draggingJoint.value && glyph._o?.onSkeletonDrag) {
				// 如果设置了onSkeletonDrag，则骨架可拖拽，拖拽骨架则不再移动字形
				glyph._o.onSkeletonDrag({
					draggingJoint: draggingJoint.value,
					deltaX: dx,
					deltaY: dy,
				})
				emitter.emit('renderGlyph')
			}
		} else {
			// joint数据格式：{x, y, name}
			let joints = getJoints()
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
		let glyph = editGlyphOnDragging.value
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
		window.removeEventListener('mouseup', onMouseUp)
		setEditing(false)
		mousedown = false
		mousemove = false
		mouseDownX = -1
		mouseDownY = -1
		lastX = 0
		lastY = 0
		putAtCoord.value = null
		draggingJoint.value = null
		editGlyphOnDragging.value = null
	}
	canvas.addEventListener('mousedown', onMouseDown)
	canvas.addEventListener('mousemove', onMouseMove)
	const closeGlyphDragger = () => {
		canvas.removeEventListener('mousedown', onMouseDown)
		canvas.removeEventListener('mousemove', onMouseMove)
		editGlyphOnDragging.value = null
		setEditing(false)
	}
	return closeGlyphDragger
}

const renderSkeletonSelector = (canvas: HTMLCanvasElement, editGlyph: boolean = false) => {
	let joints = getJoints()
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
	if (movingJoint.value) {
		const _d = 10
		const { x, y } = getJoint(movingJoint.value.name)
		const _x = mapCanvasX(x)
		const _y = mapCanvasY(y)
		ctx.fillStyle = 'red'
		ctx.fillRect(_x - _d, _y - _d, 2 * _d, 2 * _d)
	}

	// dragging joint
	if (draggingJoint.value) {
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

export {
	initSkeletonDragger,
	renderSkeletonSelector,
}