import type { IPoint } from '../stores/polygon'
import { genUUID } from '../../utils/string'
import { mapCanvasX, mapCanvasY } from '../../utils/canvas'
import { selectedFile } from '../stores/files'
import { formatPoints, genPolygonContour, translate } from '../../features/font'
import * as R from 'ramda'
import { computeCoords } from '../canvas/canvas'
import { fontRenderStyle } from '../stores/global'

interface IOption {
	offset?: {
    x: number,
    y: number,
  };
	scale?: number;
	grid?: any;
	fillColor?: string;
}

class PolygonComponent {
	public points: Array<IPoint>
	public type: string = 'glyph-polygon'
	private hasPathBegan: Boolean = false
	public usedInCharacter: boolean = true
	public contour: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []
	public contour2: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []
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
        x,
        y,
			}
		}
	}

	public lineTo (x: number, y: number) {
		if (this.hasPathBegan && !!this.points.length) {
			this.points.push({
				uuid: genUUID(),
        x,
        y,
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
			ctx.strokeStyle = options.fillColor || '#000'
			ctx.translate(mapCanvasX(options.offset.x) * scale, mapCanvasY(options.offset.y) * scale)
			ctx.moveTo(mapCanvasX(this.points[0].x) * scale, mapCanvasY(this.points[0].y) * scale)
			for (let i = 1; i < this.points.length; i++) {
				ctx.lineTo(mapCanvasX(this.points[i].x) * scale, mapCanvasY(this.points[i].y) * scale)
			}
			ctx.stroke()
			ctx.setTransform(1, 0, 0, 1, 0, 0)
		}
	}

	public render_grid (canvas: HTMLCanvasElement, options: IOption = {
		offset: { x: 0, y: 0 },
		scale: 1,
		grid: null,
	}) {
		const translate = (point) => {
			return {
				x: options.offset.x + point.x,
				y: options.offset.y + point.y,
			}
		}
		const scale = options.scale
		if (this.points.length >= 4) {
			const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
			ctx.strokeStyle = '#000'
			ctx.beginPath()
			const start = computeCoords(options.grid, translate(this.points[0]))
			ctx.moveTo(mapCanvasX(start.x) * scale, mapCanvasY(start.y) * scale)
			for (let i = 1; i < this.points.length; i++) {
				const { x, y } = computeCoords(options.grid, translate(this.points[i]))
				ctx.lineTo(mapCanvasX(x) * scale, mapCanvasY(y) * scale)
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
		if (data.contour) {
			this.contour = R.clone(data.contour)
		}
		if (data.preview) {
			this.preview = R.clone(data.preview)
		}
	}

	public updateData = (isGlyph: boolean = true, offset: {x: number, y: number}, grid?: any) => {
		let points: any = this.points
		points = points.map((point) => {
			const p = translate(point, offset)
			if (grid) {
				return computeCoords(grid, p)
			} else {
				return p
			}
		})
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
		const contour = genPolygonContour(contour_points)
	
		const scale = 100 / (options.unitsPerEm as number)
		const preview_points = points.map((point) => {
			return Object.assign({}, point, {
				x: point.x * scale,
				y: point.y * scale,
			})
		})
		const preview_contour = genPolygonContour(preview_points)

		this.contour = contour
		this.preview = preview_contour
	}

	public updateData2 = () => {
		const points = this.points
		const contour = genPolygonContour(points)
		this.contour2 = contour
	}
}

export {
	PolygonComponent,
}