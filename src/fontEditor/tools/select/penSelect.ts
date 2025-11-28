import type { IComponent, IPenComponent } from '../../stores/files'
import {
	inComponentBound,
	distance,
	rotatePoint,
	getBound,
	transformPoints,
} from '../../../utils/math'
import {
	listToMap,
} from '../../../utils/data'
import {
	mapCanvasCoords,
	mapCanvasX,
	mapCanvasY,
	mapCanvasWidth,
	mapCanvasHeight,
	getCoord,
} from '../../../utils/canvas'
import { points, type IPoint } from "../../stores/pen"
import * as R from 'ramda'
import {
	selectControl,
	selectAnchor,
	selectPenPoint,
	hoverPenPoint,
} from '../../stores/select'
import {
	selectedComponent,
	componentsForCurrentCharacterFile,
	selectedComponentUUID,
	setSelectionForCurrentCharacterFile,
	modifyComponentForCurrentCharacterFile,
	selectedFile,
	orderedListWithItemsForCurrentCharacterFile,
} from '../../stores/files'
import {
	selectedComponent as selectedComponent_glyph,
	componentsForCurrentGlyph,
	selectedComponentUUID as selectedComponentUUID_glyph,
	setSelectionForCurrentGlyph,
	modifyComponentForCurrentGlyph,
	orderedListWithItemsForCurrentGlyph,
} from '../../stores/glyph'
import { Status, editStatus } from '../../stores/font'
import { formatPoints, genPenContour } from '../../../features/font'

// 选择钢笔组件时，初始化方法
// initializier for pen component selection
const initPenEditMode = (canvas: HTMLCanvasElement, d: number = 5, glyph: boolean = false) => {
	let lastX = -1
	let lastY = -1
	let mousedown = false
	// 保存进入编辑模式时的初始边界框，用于坐标映射的一致性
	let initialOriginBounds: { x: number, y: number, w: number, h: number } | null = null
	
	const onMouseDown = (e: MouseEvent) => {
		document.addEventListener('mouseup', onMouseUp)
		canvas.addEventListener('keydown', onKeyDown)
		if (glyph) {
			mousedown = true
			for (let i = orderedListWithItemsForCurrentGlyph.value.length - 1; i >=0; i--) {
				const component = orderedListWithItemsForCurrentGlyph.value[i] as IComponent
				const { x: _x, y: _y } = rotatePoint(
					{ x: getCoord(e.offsetX), y: getCoord(e.offsetY) },
					{ x: component.x + component.w / 2, y: component.y + component.h / 2 },
					-component.rotation
				)
				if (selectedComponentUUID_glyph.value === component.uuid && component.visible) {
					const _points = transformPenPoints(selectedComponent_glyph.value, false)
					for (let i = 0; i < _points.length - 1; i++) {
						const point = _points[i]
						// 鼠标移动至point
						if (distance(_x, _y, point.x, point.y) <= d) {
							if (point.type === 'anchor') {
								// 选择锚点
								selectAnchor.value = point.uuid
								selectPenPoint.value = point.uuid
								// 初始化 lastX 和 lastY，避免使用上一次的值导致意外移动
								lastX = _x
								lastY = _y
								return
							} else if (selectAnchor.value) {
								// 选择控制点
								const _index: number = (() => {
									for (let j = 0; j < _points.length; j++) {
										if (_points[j].uuid === selectAnchor.value) {
											return j
										}
									}
									return -1
								})()
								if (i <= _index + 4 && i >= _index - 4) {
									selectPenPoint.value = point.uuid
									// 初始化 lastX 和 lastY，避免使用上一次的值导致意外移动
									lastX = _x
									lastY = _y
									return
								} else if (i === 1 && _index === _points.length - 1) {
									// 最后一个锚点（和第一个锚点重合），第二个控制点为第一个锚点的第一个控制点
									selectPenPoint.value = point.uuid
									// 初始化 lastX 和 lastY，避免使用上一次的值导致意外移动
									lastX = _x
									lastY = _y
									return
								}
							}
						}
					}
					// 点击在组件边界框内但没有点击到锚点或控制点，清除之前的状态
					selectPenPoint.value = ''
					selectAnchor.value = ''
					hoverPenPoint.value = ''
					mousedown = false
					return
				}
				// if (inComponentBound({ x: _x, y: _y }, component) && component.visible) {
				// 	setSelectionForCurrentGlyph(component.uuid)
				// 	return
				// }
			}
			if (!selectedComponent_glyph.value || !selectedComponent_glyph.value.visible) {
				mousedown = false
				return
			}
			const { x, y, w, h, rotation, uuid} = selectedComponent_glyph.value
			const { x: _x, y: _y } = rotatePoint(
				{ x: getCoord(e.offsetX), y: getCoord(e.offsetY) },
				{ x: x + w / 2, y: y + h / 2 },
				-rotation
			)
			lastX = _x
			lastY = _y
			setSelectionForCurrentGlyph('')
			// 修复：清除选中点状态
			selectPenPoint.value = ''
			selectAnchor.value = ''
			hoverPenPoint.value = ''
			// 修复：点击空白处时，将 mousedown 设置为 false，防止之后移动点
			mousedown = false
		} else {
			mousedown = true
			for (let i = orderedListWithItemsForCurrentCharacterFile.value.length - 1; i >= 0; i--) {
				const component = orderedListWithItemsForCurrentCharacterFile.value[i]
				const { x: _x, y: _y } = rotatePoint(
					{ x: getCoord(e.offsetX), y: getCoord(e.offsetY) },
					{ x: component.x + component.w / 2, y: component.y + component.h / 2 },
					-component.rotation
				)
				if (selectedComponentUUID.value === component.uuid && component.visible) {
					const _points = transformPenPoints(selectedComponent.value, false)
					for (let i = 0; i < _points.length - 1; i++) {
						const point = _points[i]
						// 鼠标移动至point
						if (distance(_x, _y, point.x, point.y) <= d) {
							if (point.type === 'anchor') {
								// 选择锚点
								selectAnchor.value = point.uuid
								selectPenPoint.value = point.uuid
								// 初始化 lastX 和 lastY，避免使用上一次的值导致意外移动
								lastX = _x
								lastY = _y
								return
							} else if (selectAnchor.value) {
								// 选择控制点
								const _index: number = (() => {
									for (let j = 0; j < _points.length; j++) {
										if (_points[j].uuid === selectAnchor.value) {
											return j
										}
									}
									return -1
								})()
								if (i <= _index + 4 && i >= _index - 4) {
									selectPenPoint.value = point.uuid
									// 初始化 lastX 和 lastY，避免使用上一次的值导致意外移动
									lastX = _x
									lastY = _y
									return
								} else if (i === 1 && _index === _points.length - 1) {
									// 最后一个锚点（和第一个锚点重合），第二个控制点为第一个锚点的第一个控制点
									selectPenPoint.value = point.uuid
									// 初始化 lastX 和 lastY，避免使用上一次的值导致意外移动
									lastX = _x
									lastY = _y
									return
								}
							}
						}
					}
					// 点击在组件边界框内但没有点击到锚点或控制点，清除之前的状态
					selectPenPoint.value = ''
					selectAnchor.value = ''
					hoverPenPoint.value = ''
					mousedown = false
					return
				}
				// if (inComponentBound({ x: _x, y: _y }, component) && component.visible) {
				// 	// 选择钢笔路径组件
				// 	setSelectionForCurrentCharacterFile(component.uuid)
				// 	return
				// }
			}
			if (!selectedComponent.value.visible) {
				mousedown = false
				return
			}
			const { x, y, w, h, rotation, uuid} = selectedComponent.value
			const { x: _x, y: _y } = rotatePoint(
				{ x: getCoord(e.offsetX), y: getCoord(e.offsetY) },
				{ x: x + w / 2, y: y + h / 2 },
				-rotation
			)
			lastX = _x
			lastY = _y
			setSelectionForCurrentCharacterFile('')
			// 修复：清除选中点状态
			selectPenPoint.value = ''
			selectAnchor.value = ''
			hoverPenPoint.value = ''
			// 修复：点击空白处时，将 mousedown 设置为 false，防止之后移动点
			mousedown = false
		}
	}

	const onMouseMove = (e: MouseEvent) => {
		if (glyph) {
			if (!selectedComponent_glyph.value || !selectedComponent_glyph.value?.visible) return
			const { x, y, w, h, rotation, flipX, flipY, uuid} = selectedComponent_glyph.value
			// 先反向旋转鼠标坐标，抵消canvas的rotation变换
			let { x: _x, y: _y } = rotatePoint(
				{ x: getCoord(e.offsetX), y: getCoord(e.offsetY) },
				{ x: x + w / 2, y: y + h / 2 },
				-rotation
			)
			const penComponentValue = selectedComponent_glyph.value.value as unknown as IPenComponent
			const { points, closePath } = penComponentValue
			
			// 在首次进入编辑模式时，保存初始边界框，确保坐标映射的一致性
			// 这样即使点被拖拽到边界框外，也不会影响其他点的变换位置
			if (!initialOriginBounds) {
				initialOriginBounds = getBound(
					points.reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
						arr.push({
							x: point.x,
							y: point.y,
						})
						return arr
					}, [])
				)
				// 将固定边界框存储到模块级变量中，供transformPenPoints使用
				editModeFixedBounds.set(uuid, initialOriginBounds)
			}
			
			// 使用固定的初始边界框，而不是当前点的边界框
			const { x: origin_x, y: origin_y, w: origin_w, h: origin_h } = initialOriginBounds
			
			if (mousedown && selectPenPoint.value) {
				// 需要将鼠标坐标映射回原始点空间（考虑flipX/flipY）
				// transformPoints的完整变换（当rotation=0时）：
				//   1. 翻转：p_flipped（原始空间）
				//   2. 平移：p_translated = p_flipped + (x - origin_x)
				//   3. 缩放：p_final = x + (p_translated - x) * w / origin_w
				//   完整：p_final = x + (p_flipped - origin_x) * w / origin_w
				// 
				// 反向映射（完全反向transformPoints的步骤）：
				//   步骤1：反向缩放：p_translated = x + (p_final - x) * origin_w / w
				//   步骤2：反向平移：p_flipped = p_translated - (x - origin_x)
				//   步骤3：反向翻转：p_original
				
				// 直接从完整公式反向：p_final = x + (p_flipped - origin_x) * w / origin_w
				// 反向：p_flipped = origin_x + (p_final - x) * origin_w / w
				let flippedPoint = {
					x: origin_x + (_x - x) * origin_w / w,
					y: origin_y + (_y - y) * origin_h / h,
				}
				
				// 反向翻转（从翻转后坐标恢复到原始坐标）
				let mousePoint = { ...flippedPoint }
				if (flipX) {
					const origin_center_x = origin_x + origin_w / 2
					mousePoint.x = 2 * origin_center_x - flippedPoint.x
				}
				if (flipY) {
					const origin_center_y = origin_y + origin_h / 2
					mousePoint.y = 2 * origin_center_y - flippedPoint.y
				}
				
				const _points = R.clone(points)
				_points.map((point: IPoint, index: number) => {
					if (selectPenPoint.value === point.uuid) {
						// 对于闭合路径，起始锚点和收尾锚点重合，应该一致移动
						if (point.type === 'anchor' && closePath && ( index < 2 || index > _points.length - 3 )) {
							if (index < 2) {
								for(let i = _points.length - 2; i < _points.length; i++) {
									if (_points[i].type === 'anchor' && _points[i].x === point.x && _points[i].y === point.y) {
										_points[i].x = mousePoint.x
										_points[i].y = mousePoint.y
									}
								}
							} else if (index > _points.length - 3) {
								for(let i = 0; i < 2; i++) {
									if (points[i].type === 'anchor' && _points[i].x === point.x && _points[i].y === point.y) {
										_points[i].x = mousePoint.x
										_points[i].y = mousePoint.y
									}
								}
							}
						}

						// 对于闭合路径，起始控制点和收尾控制点重合，应该一致移动
						// TODO

						point.x = mousePoint.x
						point.y = mousePoint.y
					}
					return point
				})
				modifyComponentForCurrentGlyph(uuid, {
					value: {
						points: _points
					}
				})
			}
			if (!mousedown) {
				// hover和点击检测时，需要使用变换后的点坐标来比较
				const _points = transformPenPoints(selectedComponent_glyph.value, false)
				_points.map((point: IPoint, index) => {
					if (distance(_x, _y, point.x, point.y) <= d) {
						// 找到对应的原始点
						const originalPoint = points.find(p => p.uuid === point.uuid)
						if (originalPoint) {
							if (originalPoint.type === 'control' && index === points.length - 1 && points.length >= 2 && originalPoint.x === points[1].x && originalPoint.y === points[1].y) {
								// 如果未闭合路径，且最后一个控制点和第一个控制点重合，改变第一个控制点
								return
							} else {
								hoverPenPoint.value = originalPoint.uuid
							}
						}
					}
				})
			}
			lastX = _x
			lastY = _y
		} else {
			if (!selectedComponent.value || !selectedComponent.value?.visible) return
			const { x, y, w, h, rotation, flipX, flipY, uuid} = selectedComponent.value
			// 先反向旋转鼠标坐标，抵消canvas的rotation变换
			let { x: _x, y: _y } = rotatePoint(
				{ x: getCoord(e.offsetX), y: getCoord(e.offsetY) },
				{ x: x + w / 2, y: y + h / 2 },
				-rotation
			)
			const penComponentValue = selectedComponent.value.value as unknown as IPenComponent
			const { points, closePath } = penComponentValue
			
			// 在首次进入编辑模式时，保存初始边界框，确保坐标映射的一致性
			// 这样即使点被拖拽到边界框外，也不会影响其他点的变换位置
			if (!initialOriginBounds) {
				initialOriginBounds = getBound(
					points.reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
						arr.push({
							x: point.x,
							y: point.y,
						})
						return arr
					}, [])
				)
				// 将固定边界框存储到模块级变量中，供transformPenPoints使用
				editModeFixedBounds.set(uuid, initialOriginBounds)
			}
			
			// 使用固定的初始边界框，而不是当前点的边界框
			const { x: origin_x, y: origin_y, w: origin_w, h: origin_h } = initialOriginBounds
			
			if (mousedown && selectPenPoint.value) {
				// 需要将鼠标坐标映射回原始点空间（考虑flipX/flipY）
				// transformPoints的完整变换（当rotation=0时）：
				//   1. 翻转：p_flipped（原始空间）
				//   2. 平移：p_translated = p_flipped + (x - origin_x)
				//   3. 缩放：p_final = x + (p_translated - x) * w / origin_w
				//   完整：p_final = x + (p_flipped - origin_x) * w / origin_w
				// 
				// 反向映射（完全反向transformPoints的步骤）：
				//   步骤1：反向缩放：p_translated = x + (p_final - x) * origin_w / w
				//   步骤2：反向平移：p_flipped = p_translated - (x - origin_x)
				//   步骤3：反向翻转：p_original
				
				// 直接从完整公式反向：p_final = x + (p_flipped - origin_x) * w / origin_w
				// 反向：p_flipped = origin_x + (p_final - x) * origin_w / w
				let flippedPoint = {
					x: origin_x + (_x - x) * origin_w / w,
					y: origin_y + (_y - y) * origin_h / h,
				}
				
				// 反向翻转（从翻转后坐标恢复到原始坐标）
				let mousePoint = { ...flippedPoint }
				if (flipX) {
					const origin_center_x = origin_x + origin_w / 2
					mousePoint.x = 2 * origin_center_x - flippedPoint.x
				}
				if (flipY) {
					const origin_center_y = origin_y + origin_h / 2
					mousePoint.y = 2 * origin_center_y - flippedPoint.y
				}
				
				const _points = R.clone(points)
				_points.map((point: IPoint, index: number) => {
					if (selectPenPoint.value === point.uuid) {
						// 对于闭合路径，起始锚点和收尾锚点重合，应该一致移动
						if (point.type === 'anchor' && closePath && ( index < 2 || index > _points.length - 3 )) {
							if (index < 2) {
								for(let i = _points.length - 2; i < _points.length; i++) {
									if (_points[i].type === 'anchor' && _points[i].x === point.x && _points[i].y === point.y) {
										_points[i].x = mousePoint.x
										_points[i].y = mousePoint.y
									}
								}
							} else if (index > _points.length - 3) {
								for(let i = 0; i < 2; i++) {
									if (points[i].type === 'anchor' && _points[i].x === point.x && _points[i].y === point.y) {
										_points[i].x = mousePoint.x
										_points[i].y = mousePoint.y
									}
								}
							}
						}

						// 对于闭合路径，起始控制点和收尾控制点重合，应该一致移动
						// TODO

						point.x = mousePoint.x
						point.y = mousePoint.y
					}
					return point
				})
				modifyComponentForCurrentCharacterFile(uuid, {
					value: {
						points: _points
					}
				})
			}
			if (!mousedown) {
				// hover和点击检测时，需要使用变换后的点坐标来比较
				const _points = transformPenPoints(selectedComponent.value, false)
				_points.map((point: IPoint, index) => {
					if (distance(_x, _y, point.x, point.y) <= d) {
						// 找到对应的原始点
						const originalPoint = points.find(p => p.uuid === point.uuid)
						if (originalPoint) {
							if (originalPoint.type === 'control' && index === points.length - 1 && points.length >= 2 && originalPoint.x === points[1].x && originalPoint.y === points[1].y) {
								// 如果未闭合路径，且最后一个控制点和第一个控制点重合，改变第一个控制点
								return
							} else {
								hoverPenPoint.value = originalPoint.uuid
							}
						}
					}
				})
			}
			lastX = _x
			lastY = _y
		}
	}

	const onMouseUp = (e: MouseEvent) => {
		const comp = glyph ? selectedComponent_glyph.value : selectedComponent.value
		if (!comp || !comp.visible) return

		modifyComponentValue()
		mousedown = false
		selectControl.value = 'null'
		document.removeEventListener('mouseup', onMouseUp)
		canvas.removeEventListener('keydown', onKeyDown)
	}

	const onEnter = (e: KeyboardEvent) => {
		const comp = glyph ? selectedComponent_glyph.value : selectedComponent.value
		if (!comp || !comp.visible) return
		modifyComponentValue()
		if (!glyph) {
			setSelectionForCurrentCharacterFile('')
		} else {
			setSelectionForCurrentGlyph('')
		}
	}

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.code === 'Enter') {
			onEnter(e)
		}
	}

	const modifyComponentValue = () => {
		const comp = glyph ? selectedComponent_glyph.value : selectedComponent.value
		if (!comp || !comp.visible) return
		let modifyComponent = modifyComponentForCurrentCharacterFile
		if (glyph) {
			modifyComponent = modifyComponentForCurrentGlyph
		}
		const { x, y, w, h, rotation, flipX, flipY, type, uuid } = comp
		const points = comp.value.points
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
		const preview_contour = genPenContour(preview_points, true)
		modifyComponent(uuid, {
			value: {
				contour: contour,
				preview: preview_contour,
			}
		})
	}

	canvas?.addEventListener('mousedown', onMouseDown)
	document.addEventListener('mousemove', onMouseMove)
	//document.addEventListener('mouseup', onMouseUp)
	const closeSelect = () => {
		canvas?.removeEventListener('mousedown', onMouseDown)
		document.removeEventListener('mousemove', onMouseMove)
		document.removeEventListener('mouseup', onMouseUp)
		canvas.removeEventListener('keydown', onKeyDown)
		selectAnchor.value = ''
		selectPenPoint.value = ''
		hoverPenPoint.value = ''

		// 如果组件仍在编辑模式，关闭编辑模式以触发边界框重新计算
		// 这可以防止在切换界面时，编辑模式仍然开启但边界框没有被更新的问题
		if (glyph) {
			// 遍历所有组件，关闭所有仍在编辑模式的钢笔组件
			const components = orderedListWithItemsForCurrentGlyph.value
			for (let i = 0; i < components.length; i++) {
				const comp = components[i]
				if (comp && comp.type === 'pen' && comp.visible) {
					const penComponentValue = comp.value as unknown as IPenComponent
					if (penComponentValue.editMode) {
						modifyComponentForCurrentGlyph(comp.uuid, {
							value: {
								editMode: false
							}
						})
					}
				}
			}
		} else {
			// 遍历所有组件，关闭所有仍在编辑模式的钢笔组件
			const components = orderedListWithItemsForCurrentCharacterFile.value
			for (let i = 0; i < components.length; i++) {
				const comp = components[i]
				if (comp && comp.type === 'pen' && comp.visible) {
					const penComponentValue = comp.value as unknown as IPenComponent
					if (penComponentValue.editMode) {
						modifyComponentForCurrentCharacterFile(comp.uuid, {
							value: {
								editMode: false
							}
						})
					}
				}
			}
		}
		
		// 重置初始边界框，以便下次进入编辑模式时重新计算
		// 注意：不要在这里删除 editModeFixedBounds，应该在 stores 中关闭编辑模式时删除
		// 这样才能在重新计算边界框时获取到初始边界框
		initialOriginBounds = null
	}
	return closeSelect
}

// 渲染钢笔组件选择编辑器
// render selection editor for selected pen component
const renderSelectPenEditor = (canvas: HTMLCanvasElement, d: number = 10, glyph: boolean = false) => {
	if (!glyph && !selectedComponentUUID.value) return
	if (glyph && !selectedComponentUUID_glyph.value) return
	const comp = glyph ? selectedComponent_glyph.value : selectedComponent.value
	if (!comp.visible) return
	const { x, y, w, h, rotation, flipX, flipY, value: penComponentValue } = comp
	const _x = mapCanvasX(x)
	const _y = mapCanvasY(y)
	const _w = mapCanvasWidth(w)
	const _h = mapCanvasHeight(h)
	const ctx: CanvasRenderingContext2D = canvas?.getContext('2d') as CanvasRenderingContext2D
	const _points = transformPenPoints(glyph ? selectedComponent_glyph.value : selectedComponent.value, true)
	const _map = listToMap(_points, 'uuid')
	// index为selectAnchor对应的索引数值
	const { index, pointType } = (() => {
		for (let i = 0; i < _points.length; i++) {
			if (_points[i].uuid === selectAnchor.value) {
				return {
					index: i,
					pointType: _points[i].type
				}
			}
		}
		return { index: -1, pointType: '' }
	})()
	//ctx.strokeStyle = '#79bbff'
	ctx.strokeStyle = '#153063'
	// transformPenPoints返回的点已经是世界坐标（考虑了x, y, w, h, flipX, flipY），只需要应用旋转
	// 旋转中心是组件的中心
	if (rotation !== 0) {
		ctx.translate(_x + _w / 2, _y + _h / 2)
		ctx.rotate(rotation * Math.PI / 180)
		ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
	}
	if (!selectAnchor.value) {
		for (let i = 0; i < _points.length; i++) {
			if (_points[i].type === 'anchor') {
				ctx.beginPath()
				ctx.ellipse(_points[i].x, _points[i].y, d, d, 0, 0, 2 * Math.PI);
				ctx.stroke()
				ctx.closePath()
			}
		}
	} else {
		for (let i = 0; i < _points.length - 1; i++) {
			if (_points[i].type === 'anchor') {
				ctx.beginPath()
				ctx.ellipse(_points[i].x, _points[i].y, d, d, 0, 0, 2 * Math.PI);
				ctx.stroke()
				ctx.closePath()
			}
			if (_points[i].type === 'control' && i >= index - 4 && i <= index + 4) {
				const originUUID = _points[i].origin as string
				// @ts-ignore
				const originAnchor: IPoint = _map[originUUID]
				ctx.strokeRect(_points[i].x - d, _points[i].y - d, 2 * d, 2 * d)
				ctx.beginPath()
				ctx.moveTo(_points[i].x, _points[i].y)
				ctx.lineTo(originAnchor.x, originAnchor.y)
				ctx.stroke()
				ctx.closePath()
			}
			if (index === _points.length - 1 && _points[i].type === 'control' && i === 1) {
				// 最后一个锚点（和第一个锚点重合），第二个控制点为第一个锚点的第一个控制点
				const originUUID = _points[i].origin as string
				// @ts-ignore
				const originAnchor: IPoint = _map[originUUID]
				ctx.strokeRect(_points[i].x - d, _points[i].y - d, 2 * d, 2 * d)
				ctx.beginPath()
				ctx.moveTo(_points[i].x, _points[i].y)
				ctx.lineTo(originAnchor.x, originAnchor.y)
				ctx.stroke()
				ctx.closePath()
			}
		}
	}
	for (let i = 0; i < _points.length; i++) {
		if (hoverPenPoint.value === _points[i].uuid) {
			ctx.fillStyle = '#79bbff'
			if (_points[i].type === 'anchor') {
				ctx.beginPath()
				ctx.ellipse(_points[i].x, _points[i].y, d, d, 0, 0, 2 * Math.PI);
				ctx.fill()
				ctx.closePath()
			}
			// 只显示选中锚点前后控制点
			if (_points[i].type === 'control' && i >= index - 4 && i <= index + 4) {	
			  ctx.fillRect(_points[i].x - d, _points[i].y - d, 2 * d, 2 * d)
			}

			ctx.fillStyle = '#fff'
		}
	}
	ctx.setTransform(1, 0, 0, 1, 0, 0)
}

// 模块级变量：存储编辑模式下的固定边界框（按组件UUID索引）
// 导出以供canvas.ts在渲染曲线时使用
export const editModeFixedBounds: Map<string, { x: number, y: number, w: number, h: number }> = new Map()

// 转换钢笔组件中的点
// transform points
const transformPenPoints = (component: IComponent, canvasRatio: boolean) => {
	const { x, y, w, h, rotation, flipX, flipY, value: penComponentValue, uuid } = component
	const { points, editMode } = penComponentValue as unknown as IPenComponent
	
	// 在编辑模式下，使用固定的初始边界框；否则使用当前点的边界框
	const fixedBounds = editMode ? editModeFixedBounds.get(uuid) : undefined
	
	// 直接使用transformPoints，确保与canvas.ts中的渲染逻辑完全一致
	// 传入rotation: 0，因为旋转会通过ctx.rotate在renderSelectPenEditor中处理
	let _points = transformPoints(
		points.reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
			arr.push({
				x: point.x,
				y: point.y,
			})
			return arr
		}, []),
		{
			x, y, w, h, rotation: 0, flipX, flipY,
		},
		fixedBounds
	).map((point: { x: number, y: number }, index: number) => {
		// 保留原始点的uuid, type, origin等属性
		const originalPoint = points[index]
		return {
			...originalPoint,
			x: point.x,
			y: point.y,
		}
	})
	
	// 如果需要在画布坐标中渲染，应用相同的转换逻辑（与canvas.ts一致）
	if (canvasRatio) {
		const scale = 1 // 编辑模式下scale为1
		_points = _points.map((point: IPoint) => {
			return {
				...point,
				...mapCanvasCoords({
					x: point.x * scale,
					y: point.y * scale,
				})
			}
		})
	}
	return _points
}

export {
	initPenEditMode,
	renderSelectPenEditor,
}