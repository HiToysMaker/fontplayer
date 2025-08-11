import { mapCanvasX, mapCanvasY } from '../../utils/canvas'
import { getEllipsePoints } from '../../utils/math';
import { selectedFile } from '../stores/files';
import { formatPoints, genEllipseContour, translate } from '../../features/font';
import * as R from 'ramda';
import { computeCoords } from '../canvas/canvas';

interface IOption {
	offset?: {
    x: number,
    y: number,
  };
	scale: number;
	grid?: any;
}

class EllipseComponent {
	public centerX: number
	public centerY: number
	public radiusX: number
	public radiusY: number
	public type: string = 'glyph-ellipse'
	public usedInCharacter: boolean = true
	public contour: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []
	public contour2: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []
	public preview: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []

	constructor (centerX: number, centerY: number, radiusX: number, radiusY: number) {
		this.centerX = centerX
		this.centerY = centerY
		this.radiusX = radiusX
		this.radiusY = radiusY
	}

	public render (canvas: HTMLCanvasElement, options: IOption = {
		offset: { x: 0, y: 0 },
		scale: 1,
	}) {
		const scale = options.scale
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
		ctx.strokeStyle = '#000'
		ctx.translate(mapCanvasX(options.offset.x) * scale, mapCanvasY(options.offset.y) * scale)
		ctx.beginPath()
		ctx.ellipse(mapCanvasX(this.centerX) * scale, mapCanvasY(this.centerY) * scale, mapCanvasX(this.radiusX) * scale, mapCanvasY(this.radiusY) * scale, 0, 0, Math.PI * 2)
		ctx.stroke()
		ctx.closePath()
		ctx.setTransform(1, 0, 0, 1, 0, 0)
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
		let points = getEllipsePoints(
			this.radiusX,
			this.radiusY,
			1000,
			this.centerX + this.radiusX,
			this.centerY + this.radiusY,
		)
		const scale = options.scale
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
		ctx.strokeStyle = '#000'
		ctx.beginPath()
		const start = computeCoords(options.grid, translate({ x: points[0].x, y: points[0].y }))
		ctx.moveTo(mapCanvasX(start.x) * scale, mapCanvasY(start.y) * scale)
		for (let i = 1; i < points.length; i++) {
			const { x, y } = computeCoords(options.grid, translate({ x: points[i].x, y: points[i].y }))
			ctx.lineTo(mapCanvasX(x) * scale, mapCanvasY(y) * scale)
		}
		ctx.lineTo(mapCanvasX(start.x) * scale, mapCanvasY(start.y) * scale)
		ctx.stroke()
		ctx.closePath()
		ctx.setTransform(1, 0, 0, 1, 0, 0)
	}

	public getData = () => {
		return {
			centerX: this.centerX,
			centerY: this.centerY,
			radiusX: this.radiusX,
			radiusY: this.radiusY,
			usedInCharacter: this.usedInCharacter,
			contour: R.clone(this.contour),
			preview: R.clone(this.preview),
		}
	}

	public setData = (data) => {
		this.centerX = data.centerX
		this.centerY = data.centerY
		this.radiusX = data.radiusX
		this.radiusY = data.radiusY
		this.type = data.type
		this.usedInCharacter = data.usedInCharacter
		if (data.contour) {
			this.contour = R.clone(data.contour)
		}
		if (data.preview) {
			this.preview = R.clone(data.preview)
		}
	}

	public updateData = (isGlyph: boolean = true, offset: { x: number, y: number }, grid?: any) => {
		let points: any = getEllipsePoints(
			this.radiusX,
			this.radiusY,
			1000,
			this.centerX,
			this.centerY,
		)
		points = points.map((point) => {
			const p = translate(point, offset)
			if (grid) {
				return computeCoords(grid, p)
			} else {
				return p
			}
		})
		if (grid) {
			points = points.map((point) => {
				return computeCoords(grid, point)
			})
		}
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
		const contour = genEllipseContour(contour_points)
	
		const scale = 100 / (options.unitsPerEm as number)
		const preview_points = points.map((point) => {
			return Object.assign({}, point, {
				x: point.x * scale,
				y: point.y * scale,
			})
		})
		const preview_contour = genEllipseContour(preview_points)

		this.contour = contour
		this.preview = preview_contour
	}

	public updateData2 = () => {
		const points = getEllipsePoints(
			this.radiusX,
			this.radiusY,
			1000,
			this.centerX,
			this.centerY,
		)
		const contour = genEllipseContour(points)
		this.contour2 = contour
	}
}

export {
	EllipseComponent,
}