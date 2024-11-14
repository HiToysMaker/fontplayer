import type { IPoint } from '../stores/pen'
import { genUUID } from '../../utils/string'
import { mapCanvasX, mapCanvasY } from '../../utils/canvas'
import { formatPoints, genPenContour } from '../../features/font'
import { selectedFile } from '../stores/files'
import * as R from 'ramda'

interface IOption {
	offset?: {
    x: number,
    y: number,
  };
	scale?: number;
}

class PenComponent {
	public points: Array<IPoint>
	private hasPathBegan: boolean = false
	public type: string = 'glyph-pen'
	public usedInCharacter: boolean = true
	public contour: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []
	public preview: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []

	public constructor () {

	}

	public beginPath () {
		this.hasPathBegan = true
		this.points = []
	}

	public closePath () {
		this.hasPathBegan = false
	}

	public moveTo (x: number, y: number) {
		if (this.hasPathBegan && !this.points.length) {
			this.points[0] = {
				uuid: genUUID(),
        type: 'anchor',
        x,
        y,
        origin: null,
			}
		}
	}

	public bezierTo (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
		if (this.hasPathBegan && !!this.points.length) {
			const uuid1 = this.points[this.points.length - 1].uuid
			const uuid2 = genUUID()
			this.points.push({
				uuid: genUUID(),
        type: 'control',
        x: x1,
        y: y1,
        origin: uuid1,
			})
			this.points.push({
				uuid: genUUID(),
        type: 'control',
        x: x2,
        y: y2,
        origin: uuid2,
			})
			this.points.push({
				uuid: uuid2,
        type: 'anchor',
        x: x3,
        y: y3,
        origin: null,
			})
		}
	}

	public quadraticBezierTo (x1: number, y1: number, x2: number, y2: number) {
		if (this.hasPathBegan && !!this.points.length) {
			const uuid1 = this.points[this.points.length - 1].uuid
			const uuid2 = genUUID()
			this.points.push({
				uuid: genUUID(),
        type: 'control',
        x: this.points[this.points.length - 1].x + 2 / 3 * (x1 - this.points[this.points.length - 1].x),
				y: this.points[this.points.length - 1].y + 2 / 3 * (y1 - this.points[this.points.length - 1].y),
        origin: uuid1,
			})
			this.points.push({
				uuid: genUUID(),
        type: 'control',
				x: x2 + 2 / 3 * (x1 - x2),
				y: y2 + 2 / 3 * (y1 - y2),
        origin: uuid2,
			})
			this.points.push({
				uuid: uuid2,
        type: 'anchor',
        x: x2,
        y: y2,
        origin: null,
			})
		}
	}

	public lineTo (x: number, y: number) {
		if (this.hasPathBegan && !!this.points.length) {
			const uuid1 = this.points[this.points.length - 1].uuid
			const uuid2 = genUUID()
			this.points.push({
				uuid: genUUID(),
        type: 'control',
        x: this.points[this.points.length - 1].x,
        y: this.points[this.points.length - 1].y,
        origin: uuid1,
			})
			this.points.push({
				uuid: genUUID(),
        type: 'control',
        x,
        y,
        origin: uuid2,
			})
			this.points.push({
				uuid: uuid2,
        type: 'anchor',
        x,
        y,
        origin: null,
			})
		}
	}

	public render (canvas: HTMLCanvasElement, options: IOption = {
		offset: { x: 0, y: 0 },
		scale: 1,
	}) {
		const scale = options.scale
		if (this.points.length >= 4) {
			const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
			ctx.strokeStyle = '#000'
			ctx.translate(mapCanvasX(options.offset.x) * scale, mapCanvasY(options.offset.y) * scale)
			ctx.beginPath()
			ctx.moveTo(mapCanvasX(this.points[0].x) * scale, mapCanvasY(this.points[0].y) * scale)
			for (let i = 1; i < this.points.length; i += 3) {
				ctx.bezierCurveTo(
					mapCanvasX(this.points[i].x) * scale, mapCanvasY(this.points[i].y) * scale,
					mapCanvasX(this.points[i + 1].x) * scale, mapCanvasY(this.points[i + 1].y) * scale,
					mapCanvasX(this.points[i + 2].x) * scale, mapCanvasY(this.points[i + 2].y) * scale,
				)
			}
			ctx.stroke()
			ctx.closePath()
			ctx.setTransform(1, 0, 0, 1, 0, 0)
		}
	}

	public getData = () => {
		return {
			points: R.clone(this.points),
			type: this.type,
			hasPathBegan: this.hasPathBegan,
			usedInCharacter: this.usedInCharacter,
			contour: R.clone(this.contour),
			preview: R.clone(this.preview),
		}
	}

	public setData = (data) => {
		this.points = R.clone(data.points)
		this.type = data.type
		this.hasPathBegan = data.hasPathBegan
		this.usedInCharacter = data.usedInCharacter
		this.contour = R.clone(data.contour)
		this.preview = R.clone(data.preview)
	}

	public updateData = (isGlyph: boolean = true) => {
		const points = this.points
		let options = {
			unitsPerEm: 1000,
			descender: -200,
			advanceWidth: 1000,
		}
		if (!isGlyph) {
			options.unitsPerEm = selectedFile.value.fontSettings.unitsPerEm
			options.descender = selectedFile.value.fontSettings.descender
			options.advanceWidth = selectedFile.value.fontSettings.unitsPerEm
		}
		const contour_points = formatPoints(points, options, 1)
		const contour = genPenContour(contour_points)
	
		const scale = 100 / (options.unitsPerEm as number)
		const preview_points = points.map((point) => {
			return Object.assign({}, point, {
				x: point.x * scale,
				y: point.y * scale,
			})
		})
		const preview_contour = genPenContour(preview_points)

		this.contour = contour
		this.preview = preview_contour
	}
}

export {
	PenComponent,
}