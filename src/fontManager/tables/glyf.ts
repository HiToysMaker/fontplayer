import type { IFont } from '../font'
import type { ILocaTable } from './loca'
import * as decode from '../decode'
import { ICubicBezierCurve, ILine, IQuadraticBezierCurve, PathType } from '../character'
import * as R from 'ramda'

// glyf表格式
// glyf table format
interface IGlyfTable {
	glyphTables: Array<IGlyphTable>;
}

// glyph表格式
// glyph table format
interface IGlyphTable {
	numberOfContours: number;
	xMin: number;
	yMin: number;
	xMax: number;
	yMax: number;
	endPtsOfContours: Array<number>;
	instructionLength: number;
	instructions: Array<number>;
	contours: Array<IContour>;
	flags?: Array<number>;
	isComposite?: boolean;
	components?: Array<any>;
}

// contour数据类型
// contour data type
interface IContour {
	xCoordinates: Array<number>;
	yCoordinates: Array<number>;
	points: Array<IPoint>;
	paths: Array<Path>;
}

interface IPoint {
	x?: number;
	y?: number;
	onCurve?: boolean;
}

type Path = ILine | IQuadraticBezierCurve | ICubicBezierCurve

const transformPoint = (point, transform) => {
	return {
		x: transform.xScale * point.x + transform.scale01 * point.y + transform.dx,
		y: transform.scale10 * point.x + transform.yScale * point.y + transform.dy,
	}
}

/**
 * 解析glyf表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns IGlyfTable对象
 */
/**
 * parse glyf table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns IGlyfTable object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	const table: IGlyfTable = {
		glyphTables: []
	}
	const numGlyphs = font.settings.numGlyphs as number
	const offsets = (font.tables?.filter((table) => table.name === 'loca')[0].table as unknown as ILocaTable).offsets
	for (let i = 0; i < numGlyphs; i++) {
		table.glyphTables.push(parseGlyph(data, offset + offsets[i], font))
	}
	for (let i = 0; i < numGlyphs; i++) {
		const glyfTable = table.glyphTables[i]
		if (glyfTable.isComposite) {
			glyfTable.contours = []
			for (var j = 0; j < glyfTable.components.length; j += 1) {
				const component = glyfTable.components[j]
				const componentGlyph = table.glyphTables[component.glyphIndex]
				if (componentGlyph.contours.length) {
					let contours = []
					if (component.matchedPoints === undefined) {
						contours = R.clone(componentGlyph.contours)
						for (let n = 0; n < contours.length; n++) {
							const contour = contours[n].paths
							for (let m = 0; m < contour.length; m++) {
								const path = contour[m]
								path.start = transformPoint(path.start, component)
								path.end = transformPoint(path.end, component)
								if (path.type === PathType.QUADRATIC_BEZIER) {
									path.control = transformPoint(path.control, component)
								}
							}
						}
					} else {
						let points = []
						for (let n = 0; n < glyfTable.contours.length; n++) {
							const contour = glyfTable.contours[n]
							points = points.concat(contour.points)
						}

						let componentPoints = []
						for (let n = 0; n < componentGlyph.contours.length; n++) {
							const contour = componentGlyph.contours[n]
							componentPoints = componentPoints.concat(contour.points)
						}

						if ((component.matchedPoints[0] > points.length - 1) ||
							(component.matchedPoints[1] > points.length - 1)) {
							break
						}
						var firstPt = points[component.matchedPoints[0]]
						var secondPt = componentPoints[component.matchedPoints[1]]
						var transform = {
							xScale: component.xScale, scale01: component.scale01,
							scale10: component.scale10, yScale: component.yScale,
							dx: 0, dy: 0
						}
						secondPt = transformPoint(secondPt, transform)
						transform.dx = firstPt.x - secondPt.x
						transform.dy = firstPt.y - secondPt.y
						contours = R.clone(componentGlyph.contours)
						for (let n = 0; n < contours.length; n++) {
							const contour = contours[n].paths
							for (let m = 0; m < contour.length; m++) {
								const path = contour[m]
								path.start = transformPoint(path.start, transform)
								path.end = transformPoint(path.start, transform)
								if (path.type === PathType.QUADRATIC_BEZIER) {
									path.control = transformPoint(path.control, transform)
								}
							}
						}
					}
					glyfTable.contours.push(...contours)
				}
			}
		}
	}
	return table
}

/**
 * 解析glyph字形
 * @param data 字体文件DataView数据
 * @param offset 当前字形的位置
 * @param font 字体对象
 * @returns IGlyphTable对象
 */
/**
 * parse glyph table
 * @param data font data, type of DataView
 * @param offset offset of current glyph
 * @param font font object
 * @returns IGlyphTable object
 */
const parseGlyph = (data: DataView, offset: number, font: IFont) => {
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)

	const numberOfContours = decode.decoder['int16']()
	const xMin = decode.decoder['int16']()
	const yMin = decode.decoder['int16']()
	const xMax = decode.decoder['int16']()
	const yMax = decode.decoder['int16']()
	const endPtsOfContours = []
	let components = []
	let isComposite = false
	const instructions = []
	const contours: Array<IContour> = []
	let px = 0
	let py = 0

	if (numberOfContours < 0) {
		isComposite = true
		components = []
		let moreComponents = true
		let flags
		while (moreComponents) {
			flags = decode.decoder['uint16']()
			const component = {
				glyphIndex: decode.decoder['uint16'](),
				xScale: 1,
				scale01: 0,
				scale10: 0,
				yScale: 1,
				dx: 0,
				dy: 0,
				matchedPoints: undefined,
			}
			if ((flags & 1) > 0) {
				if ((flags & 2) > 0) {
					component.dx = decode.decoder['int16']()
					component.dy = decode.decoder['int16']()
				} else {
					component.matchedPoints = [decode.decoder['uint16'](), decode.decoder['uint16']()]
				}
			} else {
				if ((flags & 2) > 0) {
					component.dx = decode.decoder['int8']()
					component.dy = decode.decoder['int8']()
				} else {
					component.matchedPoints = [decode.decoder['uint8'](), decode.decoder['uint8']()]
				}
			}

			if ((flags & 8) > 0) {
				component.xScale = component.yScale = decode.decoder['F2DOT14']()
			} else if ((flags & 64) > 0) {
				component.xScale = decode.decoder['F2DOT14']()
				component.yScale = decode.decoder['F2DOT14']()
			} else if ((flags & 128) > 0) {
				component.xScale = decode.decoder['F2DOT14']()
				component.scale01 = decode.decoder['F2DOT14']()
				component.scale10 = decode.decoder['F2DOT14']()
				component.yScale = decode.decoder['F2DOT14']()
			}

			components.push(component)
			moreComponents = !!(flags & 32)
		}
		if (flags & 0x100) {
			const instructionLength = decode.decoder['uint16']()
			for (let i = 0; i < instructionLength; i++) {
				instructions.push(decode.decoder['uint8']())
			}
		}
	}

	for (let i = 0; i < numberOfContours; i++) {
		endPtsOfContours.push(decode.decoder['uint16']())
	}
	const instructionLength = decode.decoder['uint16']()
	for (let i = 0; i < instructionLength; i++) {
		instructions.push(decode.decoder['uint8']())
	}
	const flags: Array<number> = []
	const pointsCount = endPtsOfContours[endPtsOfContours.length - 1] + 1
	for (let j = 0; j < pointsCount; j++) {
		const flag = decode.decoder['uint8']()
		flags.push(flag)
		if ((flag & 8) > 0) {
			const count = decode.decoder['uint8']()
			for (let n = 0; n < count; n++) {
				flags.push(flag)
				j += 1
			}
		}
	}
	for (let i = 0; i < numberOfContours; i++) {
		const xCoordinates: Array<number> = []
		const yCoordinates: Array<number> = []
		const points: Array<IPoint> = []
		const paths: Array<Path> = []
		contours.push({
			xCoordinates,
			yCoordinates,
			points,
			paths,
		})
	}
	for (let i = 0; i < numberOfContours; i++) {
		const start = i > 0 ? endPtsOfContours[i - 1] + 1 : 0
		const end = endPtsOfContours[i]
		for (let j = start; j <= end; j++) {
			const x = parseGlyphCoordinate(decode.decoder, flags[j], px, 2, 16)
			contours[i].xCoordinates.push(x)
			contours[i].points.push({
				x,
				onCurve: !!(flags[j] & 1),
			})
			px = x
		}
	}
	for (let i = 0; i < numberOfContours; i++) {
		const start = i > 0 ? endPtsOfContours[i - 1] + 1 : 0
		const end = endPtsOfContours[i]
		for (let j = start; j <= end; j++) {
			const y = parseGlyphCoordinate(decode.decoder, flags[j], py, 4, 32)
			contours[i].yCoordinates.push(y)
			contours[i].points[j - start].y = y
			py = y
			// if (contours[i].flags[j] & 4) {
			// 	contours[i].yCoordinates.push(decode.decoder['uint8']())
			// } else {
			// 	contours[i].yCoordinates.push(decode.decoder['int16']())
			// }
		}
	}

	for (let i = 0; i < numberOfContours; i++) {
		const contour = contours[i]
		const points = contour.points

		let prev = null
		let curr = points[points.length - 1]
		let next = points[0]
		let pointer = null
	
		if (curr.onCurve) {
			pointer = curr
		} else {
			if (next.onCurve) {
				pointer = next
			} else {
				const start = {x: (curr.x + next.x) * 0.5, y: (curr.y + next.y) * 0.5};
				pointer = start
			}
		}

		for (let i = 0; i < points.length; i++) {
			prev = curr
			curr = next
			next = points[(i + 1) % points.length]
	
			if (curr.onCurve) {
				const path: ILine = {
					type: PathType.LINE,
					start: {
						x: pointer.x,
						y: pointer.y,
					},
					end: {
						x: curr.x,
						y: curr.y,
					},
				}
				pointer = curr
				contour.paths.push(path)
			} else {
				let prev2 = prev
				let next2 = next
	
				if (!prev.onCurve) {
					prev2 = { x: (curr.x + prev.x) * 0.5, y: (curr.y + prev.y) * 0.5 }
				}
	
				if (!next.onCurve) {
					next2 = { x: (curr.x + next.x) * 0.5, y: (curr.y + next.y) * 0.5 }
				}

				const path: IQuadraticBezierCurve = {
					type: PathType.QUADRATIC_BEZIER,
					start: {
						x: pointer.x,
						y: pointer.y,
					},
					end: {
						x: next2.x,
						y: next2.y,
					},
					control: {
						x: curr.x,
						y: curr.y,
					}
				}
				pointer = next2
				contour.paths.push(path)
			}
		}
	}

	decode.end()

	const table = {
		numberOfContours,
		xMin,
		yMin,
		xMax,
		yMax,
		endPtsOfContours,
		instructionLength,
		instructions,
		contours,
		flags,
		isComposite,
		components,
	}

	return table
}

const parseGlyphCoordinate = (decoder, flag, previousValue, shortVectorBitMask, sameBitMask) => {
	let v
	if ((flag & shortVectorBitMask) > 0) {
		v = decoder['uint8']()
		if ((flag & sameBitMask) === 0) {
			v = -v
		}

		v = previousValue + v
	} else {
		if ((flag & sameBitMask) > 0) {
			v = previousValue;
		} else {
			v = previousValue + decoder['int16']()
		}
	}

	return v
}

const create = (table: IGlyfTable) => {

}

export {
	parse,
	create,
}

export type {
	IGlyfTable,
}