import { mapCanvasX, mapCanvasY } from '../../utils/canvas'
import { getEllipsePoints } from '../../utils/math';
import { selectedFile } from '../stores/files';
import { formatPoints, genEllipseContour } from '../../features/font';
import * as R from 'ramda';

interface IOption {
	offset?: {
    x: number,
    y: number,
  };
	scale: number;
}

class EllipseComponent {
	public centerX: number
	public centerY: number
	public radiusX: number
	public radiusY: number
	public type: string = 'glyph-ellipse'
	public usedInCharacter: boolean = true
	public contour: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []
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
		this.contour = R.clone(data.contour)
		this.preview = R.clone(data.preview)
	}

	public updateData = (isGlyph: boolean = true) => {
		const points = getEllipsePoints(
			this.radiusX,
			this.radiusY,
			1000,
			this.centerX,
			this.centerY,
		)
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
}

export {
	EllipseComponent,
}