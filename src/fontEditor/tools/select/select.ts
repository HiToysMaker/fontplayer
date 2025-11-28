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
	orderedListWithItemsForGlyph,
	ICustomGlyph,
	IGlyphComponent,
} from '../../stores/glyph'
import { Status, editStatus } from '../../stores/font'
import { genEllipseContour, formatPoints, genPolygonContour, genRectangleContour, genPenContour } from '../../../features/font'
import { getStrokeWidth } from '../../stores/global'

type CanvasPoint = {
	x: number,
	y: number,
}

type BoundingBox = {
	minX: number,
	maxX: number,
	minY: number,
	maxY: number,
}

const getBoundingFromPoints = (points: Array<{ x: number, y: number }>, offset: CanvasPoint) => {
	if (!points || !points.length) return null
	let minX = Infinity
	let maxX = -Infinity
	let minY = Infinity
	let maxY = -Infinity
	for (let i = 0; i < points.length; i++) {
		const current = points[i]
		if (typeof current?.x !== 'number' || typeof current?.y !== 'number') continue
		const px = current.x + offset.x
		const py = current.y + offset.y
		if (px < minX) minX = px
		if (px > maxX) maxX = px
		if (py < minY) minY = py
		if (py > maxY) maxY = py
	}
	if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) return null
	return { minX, minY, maxX, maxY } as BoundingBox
}

const isPointInBounding = (point: CanvasPoint, bound: BoundingBox, tolerance: number) => {
	return (
		point.x >= bound.minX - tolerance &&
		point.x <= bound.maxX + tolerance &&
		point.y >= bound.minY - tolerance &&
		point.y <= bound.maxY + tolerance
	)
}

const toVerticesWithOffset = (points: Array<{ x: number, y: number }>, offset: CanvasPoint) => {
	if (!points) return []
	return points
		.filter((point) => typeof point?.x === 'number' && typeof point?.y === 'number')
		.map((point) => ({
			x: point.x + offset.x,
			y: point.y + offset.y,
		}))
}

const pointInPolygon = (point: CanvasPoint, vertices: Array<{ x: number, y: number }>) => {
	if (!vertices.length) return false
	let inside = false
	for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
		const xi = vertices[i].x
		const yi = vertices[i].y
		const xj = vertices[j].x
		const yj = vertices[j].y
		const intersect = ((yi > point.y) !== (yj > point.y)) &&
			(point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || Number.EPSILON) + xi)
		if (intersect) inside = !inside
	}
	return inside
}

const normalizeComponentWithOffset = (component: any, offset: CanvasPoint) => {
	const comp = Object.assign({}, component)
	comp.x = (typeof comp.x === 'number' ? comp.x : 0) + offset.x
	comp.y = (typeof comp.y === 'number' ? comp.y : 0) + offset.y
	return comp
}

const glyphValueContainsPoint = (point: CanvasPoint, glyph: ICustomGlyph, offset: CanvasPoint, tolerance: number): boolean => {
	if (!glyph) return false
	const components = glyph._o?.components || orderedListWithItemsForGlyph(glyph)
	for (let i = components.length - 1; i >= 0; i--) {
		const comp = components[i]
		if (!comp) continue
		if (comp.usedInCharacter === false) continue
		if (comp.visible === false) continue
		if (glyphItemContainsPoint(point, comp, offset, tolerance)) {
			return true
		}
	}
	return false
}

const glyphItemContainsPoint = (point: CanvasPoint, component: any, offset: CanvasPoint, tolerance: number): boolean => {
	if (!component) return false
	if (component.type === 'glyph') {
		const glyphComponent = component as IGlyphComponent
		const childOffset = {
			x: offset.x + (glyphComponent.ox || 0),
			y: offset.y + (glyphComponent.oy || 0),
		}
		// 对于嵌套的字形组件，使用相同的 tolerance，但不要累积
		return glyphComponentContainsPoint(point, glyphComponent, tolerance, childOffset)
	}
	// 先检查具体类型的组件（这些有精确的内容检测）
	switch (component.type) {
		case 'glyph-pen': {
			// 恢复边界框检测，用于初步筛选
			const anchors = Array.isArray(component.points)
				? component.points.filter((item: any) => item && item.type === 'anchor')
				: []
			const bound = getBoundingFromPoints(anchors.length ? anchors : component.points, offset)
			if (!bound) return false
			return isPointInBounding(point, bound, tolerance)
		}
		case 'glyph-polygon': {
			const vertices = toVerticesWithOffset(component.points, offset)
			if (!vertices.length) return false
			const bound = getBoundingFromPoints(vertices, { x: 0, y: 0 })
			if (!bound) return false
			if (!isPointInBounding(point, bound, tolerance)) return false
			// 多边形需要精确检查是否在多边形内部，不能只依赖边界框
			return pointInPolygon(point, vertices)
		}
		case 'glyph-rectangle': {
			const x = (component.x || 0) + offset.x
			const y = (component.y || 0) + offset.y
			const width = component.width || 0
			const height = component.height || 0
			// 矩形组件，检查是否在矩形内部
			return (
				point.x >= x - tolerance &&
				point.x <= x + width + tolerance &&
				point.y >= y - tolerance &&
				point.y <= y + height + tolerance
			)
		}
		case 'glyph-ellipse': {
			const centerX = (component.centerX || 0) + offset.x
			const centerY = (component.centerY || 0) + offset.y
			const radiusX = component.radiusX || 0
			const radiusY = component.radiusY || 0
			if (!radiusX || !radiusY) return false
			const dx = point.x - centerX
			const dy = point.y - centerY
			const rx = radiusX + tolerance
			const ry = radiusY + tolerance
			// 椭圆组件，检查是否在椭圆内部
			return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1
		}
		default:
			// 对于未知类型的组件，如果有边界框信息，不进行检测
			// 因为边界框可能过大，导致误选
			// 只检测已知类型的精确内容
			return false
	}
}

const glyphComponentContainsPoint = (point: CanvasPoint, component: IGlyphComponent, tolerance: number, offset?: CanvasPoint): boolean => {
	if (!component || !component.visible) return false
	
	const glyph = component.value
	if (!glyph) return false
	
	const baseOffset = offset || {
		x: component.ox || 0,
		y: component.oy || 0,
	}
	
	// 优先精确检查是否在字形内容内部，只检查字形实际的子组件内容
	// 这是最精确的检测方式，可以避免误选其他字形组件
	if (glyphValueContainsPoint(point, glyph, baseOffset, tolerance || 15)) {
		return true
	}
	
	// 移除边界框检测，因为它不够精确，容易导致选错组件
	// 只依赖精确的内容检测
	
	return false
}

// 计算点到组件路径的距离（用于当多个组件边界框重叠时选择最近的）
const getDistanceToComponentPath = (point: CanvasPoint, component: any, offset: CanvasPoint = { x: 0, y: 0 }): number => {
	if (!component) return Infinity
	
	if (component.type === 'glyph') {
		// 对于字形组件，计算到内部子组件的最小距离
		const glyphComponent = component as IGlyphComponent
		const glyph = glyphComponent.value
		if (!glyph) return Infinity
		
		const baseOffset = {
			x: offset.x + (glyphComponent.ox || 0),
			y: offset.y + (glyphComponent.oy || 0),
		}
		
		// 获取字形内部的所有子组件
		const components = glyph._o?.components || orderedListWithItemsForGlyph(glyph)
		let minDistance = Infinity
		
		for (const comp of components) {
			if (!comp || comp.visible === false) continue
			const dist = getDistanceToGlyphItemPath(point, comp, baseOffset)
			minDistance = Math.min(minDistance, dist)
		}
		
		return minDistance
	}
	
	// 对于其他组件，直接计算距离
	return getDistanceToGlyphItemPath(point, component, offset)
}

// 计算点到字形子组件路径的距离
const getDistanceToGlyphItemPath = (point: CanvasPoint, component: any, offset: CanvasPoint): number => {
	if (!component) return Infinity
	
	if (component.type === 'glyph') {
		// 递归处理嵌套的字形组件
		const glyphComponent = component as IGlyphComponent
		return getDistanceToComponentPath(point, component, {
			x: offset.x + (glyphComponent.ox || 0),
			y: offset.y + (glyphComponent.oy || 0),
		})
	}
	
	// 处理不同类型的组件
	switch (component.type) {
		case 'glyph-pen': {
			// 对于钢笔组件，采样路径点并计算最小距离
			const points = Array.isArray(component.points) ? component.points : []
			if (!points.length) return Infinity
			
			let minDist = Infinity
			for (const pt of points) {
				if (!pt) continue
				const ptPos = {
					x: (pt.x || 0) + offset.x,
					y: (pt.y || 0) + offset.y,
				}
				const dist = Math.sqrt(
					(point.x - ptPos.x) ** 2 + (point.y - ptPos.y) ** 2
				)
				minDist = Math.min(minDist, dist)
			}
			return minDist
		}
		case 'glyph-polygon': {
			// 对于多边形，计算点到多边形边的最短距离
			const vertices = toVerticesWithOffset(component.points, offset)
			if (!vertices.length) return Infinity
			
			// 如果点在多边形内，距离为0
			if (pointInPolygon(point, vertices)) return 0
			
			// 否则计算到各边的最短距离
			let minDist = Infinity
			for (let i = 0; i < vertices.length; i++) {
				const v1 = vertices[i]
				const v2 = vertices[(i + 1) % vertices.length]
				const distResult = distanceAndFootPoint(v1, v2, point)
				minDist = Math.min(minDist, distResult.distance)
			}
			return minDist
		}
		case 'glyph-rectangle': {
			// 对于矩形，计算点到矩形边界的最短距离
			const x = (component.x || 0) + offset.x
			const y = (component.y || 0) + offset.y
			const width = component.width || 0
			const height = component.height || 0
			
			// 如果点在矩形内，距离为0
			if (point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height) {
				return 0
			}
			
			// 计算到矩形边界的最短距离
			const dx = Math.max(0, Math.max(x - point.x, point.x - (x + width)))
			const dy = Math.max(0, Math.max(y - point.y, point.y - (y + height)))
			return Math.sqrt(dx * dx + dy * dy)
		}
		case 'glyph-ellipse': {
			// 对于椭圆，计算点到椭圆边界的最短距离（简化处理）
			const centerX = (component.centerX || 0) + offset.x
			const centerY = (component.centerY || 0) + offset.y
			const radiusX = component.radiusX || 0
			const radiusY = component.radiusY || 0
			if (!radiusX || !radiusY) return Infinity
			
			const dx = point.x - centerX
			const dy = point.y - centerY
			const normalizedX = dx / radiusX
			const normalizedY = dy / radiusY
			const distFromCenter = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY)
			
			// 如果点在椭圆内或边界上，距离为0
			if (distFromCenter <= 1) return 0
			
			// 否则返回到椭圆边界的距离（简化：返回到中心的距离减去半径）
			const actualDist = Math.sqrt(dx * dx + dy * dy)
			const avgRadius = (radiusX + radiusY) / 2
			return Math.max(0, actualDist - avgRadius)
		}
		default:
			// 对于未知类型，尝试使用边界框
			if (typeof component.x === 'number' && typeof component.y === 'number' && 
			    typeof component.w === 'number' && typeof component.h === 'number') {
				const normalizedComponent = normalizeComponentWithOffset(component, offset)
				const x = normalizedComponent.x
				const y = normalizedComponent.y
				const w = normalizedComponent.w
				const h = normalizedComponent.h
				
				// 如果点在边界框内，距离为0
				if (point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h) {
					return 0
				}
				
				// 计算到边界框的最短距离
				const dx = Math.max(0, Math.max(x - point.x, point.x - (x + w)))
				const dy = Math.max(0, Math.max(y - point.y, point.y - (y + h)))
				return Math.sqrt(dx * dx + dy * dy)
			}
			return Infinity
	}
}

// 从 FPUtils 导入 distanceAndFootPoint（如果可用）
// 如果没有，使用简化的距离计算
const distanceAndFootPoint = (A: { x: number, y: number }, B: { x: number, y: number }, C: { x: number, y: number }) => {
	const { x: x1, y: y1 } = A
	const { x: x2, y: y2 } = B
	const { x: x0, y: y0 } = C
	
	const dx = x2 - x1
	const dy = y2 - y1
	const len2 = dx * dx + dy * dy
	
	if (len2 === 0) {
		// A 和 B 重合
		const dist = Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2)
		return { distance: dist, footPoint: { x: x1, y: y1 } }
	}
	
	const t = Math.max(0, Math.min(1, ((x0 - x1) * dx + (y0 - y1) * dy) / len2))
	const footPoint = {
		x: x1 + t * dx,
		y: y1 + t * dy,
	}
	
	const dist = Math.sqrt((x0 - footPoint.x) ** 2 + (y0 - footPoint.y) ** 2)
	return { distance: dist, footPoint }
}

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
			selectControl.value = 'null'
			// 即使没有选中组件，也要添加 mouseup 监听器以便处理点击选择
			document.addEventListener('mouseup', onMouseUp)
			canvas.addEventListener('keydown', onKeyDown)
			return
		}
		// 检查是否点击在组件或控制点上
		const { x, y, w, h, rotation } = comp
		const { x: _x, y: _y } = rotatePoint(
			{ x: getCoord(e.offsetX), y: getCoord(e.offsetY) },
			{ x: x + w / 2, y: y + h / 2 },
			-rotation
		)
		const left_top = { x, y }
		const left_bottom = { x, y: y + h }
		const right_top = { x: x + w, y }
		const right_bottom = { x: x + w, y: y + h }
		// 检查是否点击在控制点上
		const clickedOnScaleControl = 
			distance(_x, _y, left_top.x, left_top.y) <= d ||
			distance(_x, _y, right_top.x, right_top.y) <= d ||
			distance(_x, _y, left_bottom.x, left_bottom.y) <= d ||
			distance(_x, _y, right_bottom.x, right_bottom.y) <= d
		const clickedOnRotateControl =
			leftTop(_x, _y, left_top.x, left_top.y, d) ||
			rightTop(_x, _y, right_top.x, right_top.y, d) ||
			leftBottom(_x, _y, left_bottom.x, left_bottom.y, d) ||
			rightBottom(_x, _y, right_bottom.x, right_bottom.y, d)
		const clickedOnInnerArea = inComponentBound({ x: _x, y: _y }, comp)
		
		if (!clickedOnScaleControl && !clickedOnRotateControl && !clickedOnInnerArea) {
			// 点击空白处，清除状态，但仍需要添加 mouseup 监听器以便处理点击选择
			mousedown = false
			selectControl.value = 'null'
			document.addEventListener('mouseup', onMouseUp)
			canvas.addEventListener('keydown', onKeyDown)
			return
		}
		
		// 初始化 lastX 和 lastY 为当前点击位置，避免使用上一次的值导致意外移动
		lastX = _x
		lastY = _y
		
		// 根据点击位置设置 selectControl.value
		if (clickedOnScaleControl) {
			if (distance(_x, _y, left_top.x, left_top.y) <= d) {
				selectControl.value = 'scale-left-top'
			} else if (distance(_x, _y, right_top.x, right_top.y) <= d) {
				selectControl.value = 'scale-right-top'
			} else if (distance(_x, _y, left_bottom.x, left_bottom.y) <= d) {
				selectControl.value = 'scale-left-bottom'
			} else if (distance(_x, _y, right_bottom.x, right_bottom.y) <= d) {
				selectControl.value = 'scale-right-bottom'
			}
		} else if (clickedOnRotateControl) {
			if (leftTop(_x, _y, left_top.x, left_top.y, d)) {
				selectControl.value = 'rotate-left-top'
			} else if (rightTop(_x, _y, right_top.x, right_top.y, d)) {
				selectControl.value = 'rotate-right-top'
			} else if (leftBottom(_x, _y, left_bottom.x, left_bottom.y, d)) {
				selectControl.value = 'rotate-left-bottom'
			} else if (rightBottom(_x, _y, right_bottom.x, right_bottom.y, d)) {
				selectControl.value = 'rotate-right-bottom'
			}
		} else if (clickedOnInnerArea) {
			selectControl.value = 'inner-area'
		}
		
		document.addEventListener('mouseup', onMouseUp)
		canvas.addEventListener('keydown', onKeyDown)
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
		if (mousedown && selectControl.value !== 'null') {
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
			const clickPoint = {
				x: getCoord(e.offsetX),
				y: getCoord(e.offsetY),
			}
			
			// 收集所有边界框包含点击点的组件
			const candidateComponents: Array<{ component: any, distance: number }> = []
			const componentList = glyph ? orderedListWithItemsForCurrentGlyph.value : orderedListWithItemsForCurrentCharacterFile.value
			
			for (let i = componentList.length - 1; i >= 0; i--) {
				const component = componentList[i]
				if (!component || !component.type || component.type === 'group' || component.visible === false) continue
				
				let isInBounds = false
				
				if (component.type === 'glyph') {
					const glyphComponent = component as IGlyphComponent
					// 对于字形组件，先检查边界框（通过字形内容检测）
					// 使用较大的 tolerance 进行边界框检测
					isInBounds = glyphComponentContainsPoint(clickPoint, glyphComponent, 20)
				} else {
					// 对于其他组件，检查边界框
					isInBounds = inComponentBound(clickPoint, component, 20)
				}
				
				if (isInBounds) {
					// 计算到组件路径的距离
					const dist = getDistanceToComponentPath(clickPoint, component)
					candidateComponents.push({ component, distance: dist })
				}
			}
			
			// 如果点击的是已选中的组件，不切换
			const currentSelectedUUID = glyph ? selectedComponentUUID_glyph.value : selectedComponentUUID.value
			if (currentSelectedUUID) {
				const currentSelected = candidateComponents.find(c => c.component.uuid === currentSelectedUUID)
				if (currentSelected) {
					// 已选中组件在候选列表中，检查是否应该保持选中
					// 如果点击在已选中组件上且没有其他更近的组件，保持选中
					if (currentSelected.distance <= 20) {
						document.removeEventListener('mouseup', onMouseUp)
						canvas.removeEventListener('keydown', onKeyDown)
						return
					}
				}
			}
			
			// 如果有候选组件，选择距离最近的
			if (candidateComponents.length > 0) {
				// 按距离排序，选择最近的
				candidateComponents.sort((a, b) => a.distance - b.distance)
				const closestComponent = candidateComponents[0].component
				
				if (glyph) {
					setSelectionForCurrentGlyph(closestComponent.uuid)
				} else {
					setSelectionForCurrentCharacterFile(closestComponent.uuid)
				}
				
				mousedown = false
				mousemove = false
				selectControl.value = 'null'
				document.removeEventListener('mouseup', onMouseUp)
				canvas.removeEventListener('keydown', onKeyDown)
				return
			}
			
			// 没有找到任何组件，清除选择
			if (glyph) {
				setSelectionForCurrentGlyph('')
			} else {
				setSelectionForCurrentCharacterFile('')
			}
			document.removeEventListener('mouseup', onMouseUp)
			canvas.removeEventListener('keydown', onKeyDown)
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
	ctx.lineWidth = getStrokeWidth()
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