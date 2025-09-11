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
								} else if (i === 1 && _index === _points.length - 1) {
									// 最后一个锚点（和第一个锚点重合），第二个控制点为第一个锚点的第一个控制点
									selectPenPoint.value = point.uuid
								}
							}
						}
					}
					return
				}
				// if (inComponentBound({ x: _x, y: _y }, component) && component.visible) {
				// 	setSelectionForCurrentGlyph(component.uuid)
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
			setSelectionForCurrentGlyph('')
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
								} else if (i === 1 && _index === _points.length - 1) {
									// 最后一个锚点（和第一个锚点重合），第二个控制点为第一个锚点的第一个控制点
									selectPenPoint.value = point.uuid
								}
							}
						}
					}
					return
				}
				// if (inComponentBound({ x: _x, y: _y }, component) && component.visible) {
				// 	// 选择钢笔路径组件
				// 	setSelectionForCurrentCharacterFile(component.uuid)
				// 	return
				// }
			}
			if (!selectedComponent.value.visible) return
			const { x, y, w, h, rotation, uuid} = selectedComponent.value
			const { x: _x, y: _y } = rotatePoint(
				{ x: getCoord(e.offsetX), y: getCoord(e.offsetY) },
				{ x: x + w / 2, y: y + h / 2 },
				-rotation
			)
			lastX = _x
			lastY = _y
			setSelectionForCurrentCharacterFile('')
		}
	}

	const onMouseMove = (e: MouseEvent) => {
		if (glyph) {
			if (!selectedComponent_glyph.value || !selectedComponent_glyph.value?.visible) return
			const { x, y, w, h, rotation, uuid} = selectedComponent_glyph.value
			const { x: _x, y: _y } = rotatePoint(
				{ x: getCoord(e.offsetX), y: getCoord(e.offsetY) },
				{ x: x + w / 2, y: y + h / 2 },
				-rotation
			)
			const penComponentValue = selectedComponent_glyph.value.value as unknown as IPenComponent
			const { points, closePath } = penComponentValue
			if (mousedown) {
				const _points = R.clone(points)
				_points.map((point: IPoint, index: number) => {
					if (selectPenPoint.value === point.uuid) {
						// 对于闭合路径，起始锚点和收尾锚点重合，应该一致移动
						if (point.type === 'anchor' && closePath && ( index < 2 || index > _points.length - 3 )) {
							if (index < 2) {
								for(let i = _points.length - 2; i < _points.length; i++) {
									if (_points[i].type === 'anchor' && _points[i].x === point.x && _points[i].y === point.y) {
										_points[i].x = _x
										_points[i].y = _y
									}
								}
							} else if (index > _points.length - 3) {
								for(let i = 0; i < 2; i++) {
									if (points[i].type === 'anchor' && _points[i].x === point.x && _points[i].y === point.y) {
										_points[i].x = _x
										_points[i].y = _y
									}
								}
							}
						}

						// 对于闭合路径，起始控制点和收尾控制点重合，应该一致移动
						// TODO

						point.x = _x
						point.y = _y
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
				points.map((point: IPoint, index) => {
					if (distance(_x, _y, point.x, point.y) <= d) {
						if (point.type === 'control' && index === points.length - 1 && points.length >= 2 && point.x === points[1].x && point.y === points[1].y) {
							// 如果未闭合路径，且最后一个控制点和第一个控制点重合，改变第一个控制点
							return
						} else {
							hoverPenPoint.value = point.uuid
						}
					}
				})
			}
			lastX = _x
			lastY = _y
		} else {
			if (!selectedComponent.value || !selectedComponent.value?.visible) return
			const { x, y, w, h, rotation, uuid} = selectedComponent.value
			const { x: _x, y: _y } = rotatePoint(
				{ x: getCoord(e.offsetX), y: getCoord(e.offsetY) },
				{ x: x + w / 2, y: y + h / 2 },
				-rotation
			)
			const penComponentValue = selectedComponent.value.value as unknown as IPenComponent
			const { points, closePath } = penComponentValue
			if (mousedown) {
				const _points = R.clone(points)
				_points.map((point: IPoint, index: number) => {
					if (selectPenPoint.value === point.uuid) {
						// 对于闭合路径，起始锚点和收尾锚点重合，应该一致移动
						if (point.type === 'anchor' && closePath && ( index < 2 || index > _points.length - 3 )) {
							if (index < 2) {
								for(let i = _points.length - 2; i < _points.length; i++) {
									if (_points[i].type === 'anchor' && _points[i].x === point.x && _points[i].y === point.y) {
										_points[i].x = _x
										_points[i].y = _y
									}
								}
							} else if (index > _points.length - 3) {
								for(let i = 0; i < 2; i++) {
									if (points[i].type === 'anchor' && _points[i].x === point.x && _points[i].y === point.y) {
										_points[i].x = _x
										_points[i].y = _y
									}
								}
							}
						}

						// 对于闭合路径，起始控制点和收尾控制点重合，应该一致移动
						// TODO

						point.x = _x
						point.y = _y
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
				points.map((point: IPoint, index) => {
					if (distance(_x, _y, point.x, point.y) <= d) {
						if (point.type === 'control' && index === points.length - 1 && points.length >= 2 && point.x === points[1].x && point.y === points[1].y) {
							// 如果未闭合路径，且最后一个控制点和第一个控制点重合，改变第一个控制点
							return
						} else {
							hoverPenPoint.value = point.uuid
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
		const preview_contour = genPenContour(preview_points)
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
	ctx.translate(_x + _w / 2, _y + _h / 2)
	ctx.rotate(rotation * Math.PI / 180)
	ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
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

// 转换钢笔组件中的点
// transform points
const transformPenPoints = (component: IComponent, canvasRatio: boolean) => {
	const { x, y, w, h, rotation, flipX, flipY, value: penComponentValue } = component
	const { points } = penComponentValue as unknown as IPenComponent
	const _x = canvasRatio ? mapCanvasX(x) : x
	const _y = canvasRatio ? mapCanvasY(y) : y
	const _w = canvasRatio ? mapCanvasWidth(w): w
	const _h = canvasRatio ? mapCanvasHeight(h): h
	let _points = points.map((point: IPoint) => {
		let _point = R.clone(point)
		if (flipX) {
			_point.x = _x + _w / 2 + ((_x + _w / 2) - _point.x)
		}
		if (flipY) {
			_point.y = _y + _h / 2 + ((_y + _h / 2) - _point.y)
		}
		return _point
	})
	const { x: origin_x, y: origin_y, w: origin_w, h: origin_h } = getBound(
		_points.reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
			arr.push({
				x: point.x,
				y: point.y,
			})
			return arr
		}, [])
	)
	_points = _points.map((point: IPoint) => {
		const _point = R.clone(point)
		const { x: _x, y: _y } = _point
		_point.x = x + (_x - origin_x) * w / origin_w
		_point.y = y + (_y - origin_y) * h / origin_h
		return _point
	})
	if (canvasRatio) {
		_points = _points.map((point: IPoint) => {
			return {
				...point,
				...mapCanvasCoords({
					x: point.x,
					y: point.y,
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