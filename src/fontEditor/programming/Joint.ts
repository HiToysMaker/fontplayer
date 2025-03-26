import { mapCanvasX, mapCanvasY } from '../../utils/canvas'
import { IGlyphComponent, IJoint, executeScript } from '../stores/glyph'
import { genUUID } from '../../utils/string'

interface IPoint {
	x: number;
	y: number;
}

class Joint {
	private _x: number
	private _y: number
	public uuid: string
	public name: string

  public constructor (name: string, point: IPoint) {
		this._x = point.x
		this._y = point.y
		this.name = name
		this.uuid = genUUID()
	}

	public render (canvas: HTMLCanvasElement) {
		const d = 4
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
		ctx.beginPath()
		ctx.fillStyle = 'blue'
		ctx.fillRect(mapCanvasX(this.x) - d, mapCanvasY(this.y) - d, d * 2, d * 2)
		ctx.closePath()
		ctx.setTransform(1, 0, 0, 1, 0, 0)
	}

	public getCoords () {
		return {
			x: this.x,
			y: this.y,
		}
	}

	public getPlainCoords () {
		return {
			x: this.x,
			y: this.y,
		}
	}

	get x () {
		return this._x
	}

	get y () {
		return this._y
	}

	public getData = () => {
		return {
			_x: this._x,
			_y: this._y,
			uuid: this.uuid,
			name: this.name,
		}
	}

	public setData = (data) => {
		this._x = data._x
		this._y = data._y
		this.uuid = data.uuid
		this.name = data.name
	}
}

const renderJoint = (canvas, joint) => {
	const d = 4
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
	ctx.beginPath()
	ctx.fillStyle = 'blue'
	ctx.fillRect(mapCanvasX(joint.x) - d, mapCanvasY(joint.y) - d, d * 2, d * 2)
	ctx.closePath()
	ctx.setTransform(1, 0, 0, 1, 0, 0)
}

const renderRefLine = (canvas, refline) => {
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
	const p1 = refline.start
	const p2 = refline.end
	ctx.strokeStyle = 'blue'
	ctx.beginPath()
	ctx.moveTo(mapCanvasX(p1.x), mapCanvasY(p1.y))
	ctx.lineTo(mapCanvasX(p2.x), mapCanvasY(p2.y))
	ctx.stroke()
}

const renderJoints = (rootComponent, canvas) => {
	const traverse = (_component, _ox, _oy) => {
		const ox = _component.ox + _ox
		const oy = _component.oy + _oy
		_component.value._o.getJoints().map((joint) => {
			const { x, y } = joint.getCoords()
			renderJoint(canvas, {
				x: x + ox,
				y: y + oy,
			})
		})
		if (_component.type === 'glyph' && _component.value.components && _component.value.components.length) {
			_component.value.components.map((comp) => {
				traverse(comp, ox, oy)
			})
		}
	}
	traverse(rootComponent, 0, 0)
}

const renderRefLines = (rootComponent, canvas) => {
	const traverse = (_component, _ox, _oy) => {
		const ox = _component.ox + _ox
		const oy = _component.oy + _oy
		_component.value._o.getRefLines().map((_refline) => {
			const start = _component.value._o.getJoint(_refline.start)
			const end = _component.value._o.getJoint(_refline.end)
			const refline = {
				start: {
					x: start.x + ox,
					y: start.y + oy,
				},
				end: {
					x: end.x + ox,
					y: end.y + oy,
				}
			}
			renderRefLine(canvas, refline)
		})
		if (_component.type === 'glyph' && _component.value.components && _component.value.components.length) {
			_component.value.components.map((comp) => {
				traverse(comp, ox, oy)
			})
		}
	}
	traverse(rootComponent, 0, 0)
}

const getJoints = (rootComponent, subComponentUUID) => {
	let joints = []
	const traverse = (_component, _ox, _oy) => {
		const ox = _component.ox + _ox
		const oy = _component.oy + _oy
		if (subComponentUUID === _component.uuid) {
			// 获取该节点Joints数组
			joints = _component.value._o.getJoints().map((joint) => {
				const { x, y } = joint.getCoords()
				return {
					name: joint.name,
					x: x + ox,
					y: y + oy,
				}
			})
		}
		if (_component.type === 'glyph' && _component.value.components && _component.value.components.length) {
			_component.value.components.map((comp) => {
				traverse(comp, ox, oy)
			})
		}
	}
	traverse(rootComponent, 0, 0)
	return joints
}

export {
	Joint,
	renderJoints,
	renderRefLines,
	getJoints,
}

export type {
	IJoint,
}