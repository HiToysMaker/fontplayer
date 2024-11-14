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
	public rootComponent: IGlyphComponent
	public componentsTree: Array<string>
	public component: IGlyphComponent
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
		const { ox, oy } = this.getOrigin()
		if (ox || oy) {
			ctx.translate(mapCanvasX(ox), mapCanvasY(oy))
		}
		ctx.beginPath()
		ctx.fillStyle = 'blue'
		ctx.fillRect(mapCanvasX(this.x) - d, mapCanvasY(this.y) - d, d * 2, d * 2)
		ctx.closePath()
		ctx.setTransform(1, 0, 0, 1, 0, 0)
	}

	public putAt (x: number, y: number) {
		const { ox, oy } = this.getOrigin()
		const _coords = this.getCoords()
		if (!this.component) return false
		const dx = x - _coords.x
		const dy = y - _coords.y
		this.component.ox = dx
		this.component.oy = dy
	}

	public putAtJoint (joint: Joint, options: { deltaX: number, deltaY: number } = { deltaX: 0, deltaY: 0 }) {
		if (!this.component) return false
		const coords = joint.getCoords()
		const _coords = this.getCoords()
		const x = coords.x + options.deltaX
		const y = coords.y + options.deltaY
		const dx = x - _coords.x
		const dy = y - _coords.y
		this.component.ox = dx
		this.component.oy = dy
	}

	public getOrigin = () => {
		if (this.rootComponent) {
			let origin = {
				ox: this.rootComponent.ox,
				oy: this.rootComponent.oy,
			}
			let root = this.rootComponent
			for (let i = 1; i < this.componentsTree.length; i++) {
				const uuid = this.componentsTree[i]
				for (let j = 0; j < root.value.components.length; j++) {
					const comp = root.value.components[j]
					if (comp.uuid === uuid) {
						origin.ox += (comp as IGlyphComponent).ox
						origin.oy += (comp as IGlyphComponent).oy
						root = comp as IGlyphComponent
						break
					}
				}
			}
			return origin
		}
		return {
			ox: this.component ? this.component.ox : 0,
			oy: this.component ? this.component.oy : 0,
		}
	}

	public getCoords () {
		const { ox, oy } = this.getOrigin()
		return {
			x: this.x + ox,
			y: this.y + oy,
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

const linkComponentsForJoints = (component) => {
	let rootComponent = component
	let tree = [rootComponent.uuid]
	const link = (_component, _tree) => {
		_component.value._o.getJoints().map((joint) => {
			const __tree = Object.assign([], _tree)
			__tree.push(_component.uuid)
			joint.component = _component
			joint.rootComponent = rootComponent
			joint.componentsTree = __tree
		})
		if (_component.type === 'glyph' && _component.value.components && _component.value.components.length) {
			_component.value.components.map((comp) => {
				const __tree = Object.assign([], _tree)
				__tree.push(comp.uuid)
				executeScript(comp.value)
				link(comp, __tree)
			})
		}
	}
	link(component, tree)
}

export {
	Joint,
	linkComponentsForJoints,
}

export type {
	IJoint,
}