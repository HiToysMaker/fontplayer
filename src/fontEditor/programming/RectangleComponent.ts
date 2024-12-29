import { mapCanvasX, mapCanvasY } from '../../utils/canvas'
import { getRectanglePoints } from '../../utils/math';
import { selectedFile } from '../stores/files';
import { formatPoints, genRectangleContour } from '../../features/font';
import * as R from 'ramda';

interface IOption {
	offset?: {
    x: number,
    y: number,
  };
	scale: number;
}

class RectangleComponent {
	public x: number
	public y: number
	public width: number
	public height: number
	public type: string = 'glyph-rectangle'
	public usedInCharacter: boolean = true
	public contour: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []
	public contour2: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []
	public preview: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []

	constructor (x: number, y: number, width: number, height: number) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
	}

	public render (canvas: HTMLCanvasElement, options: IOption = {
		offset: { x: 0, y: 0 },
		scale: 1
	}) {
		const scale = options.scale
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
		ctx.strokeStyle = '#000'
		ctx.translate(mapCanvasX(options.offset.x) * scale, mapCanvasY(options.offset.y) * scale)
		ctx.beginPath()
		ctx.rect(mapCanvasX(this.x) * scale, mapCanvasY(this.y) * scale, mapCanvasX(this.width) * scale, mapCanvasY(this.height) * scale)
		ctx.stroke()
		ctx.closePath()
		ctx.setTransform(1, 0, 0, 1, 0, 0)
	}

	public getData = () => {
		return {
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height,
			type: this.type,
			usedInCharacter: this.usedInCharacter,
			contour: R.clone(this.contour),
			preview: R.clone(this.preview),
		}
	}

	public setData = (data) => {
		this.x = data.x
		this.y = data.y
		this.width = data.width
		this.height = data.height
		this.type = data.type
		this.usedInCharacter = data.usedInCharacter
		this.contour = R.clone(data.contour)
		this.preview = R.clone(data.preview)
	}

	public updateData = (isGlyph: boolean = true) => {
		const points = getRectanglePoints(
			this.width,
			this.height,
			this.x,
			this.y,
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
		const contour = genRectangleContour(contour_points)
	
		const scale = 100 / (options.unitsPerEm as number)
		const preview_points = points.map((point) => {
			return Object.assign({}, point, {
				x: point.x * scale,
				y: point.y * scale,
			})
		})
		const preview_contour = genRectangleContour(preview_points)

		this.contour = contour
		this.preview = preview_contour
	}

	public updateData2 = () => {
		const points = getRectanglePoints(
			this.width,
			this.height,
			this.x,
			this.y,
		)
		const contour = genRectangleContour(points)
		this.contour2 = contour
	}
}

export {
	RectangleComponent,
}