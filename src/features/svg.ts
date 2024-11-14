/**
 * svg 相关的一些方法
 */
/**
 * some methods for svg
 */

import type { IComponent, IEllipseComponent, IPenComponent, IPolygonComponent, IRectangleComponent } from '../fontEditor/stores/files'
import { genEllipseComponent } from '../fontEditor/tools/ellipse'
import { genRectComponent } from '../fontEditor/tools/rectangle'
import { genPolygonComponent } from '../fontEditor/tools/polygon'
import { genPenComponent } from '../fontEditor/tools/pen'
import type { IPoint as IPenPoint } from '../fontEditor/stores/pen'
import { genUUID } from '../utils/string'
import * as R from 'ramda'
import { getBound } from '../utils/math'
import type { Component } from '../fontEditor/stores/files'
import { ICustomGlyph, IGlyphComponent, executeScript } from '../fontEditor/stores/glyph'
import { PenComponent } from '../fontEditor/programming/PenComponent'
import { EllipseComponent } from '../fontEditor/programming/EllipseComponent'
import { RectangleComponent } from '../fontEditor/programming/RectangleComponent'
import { PolygonComponent } from '../fontEditor/programming/PolygonComponent'

interface IPoint {
	uuid: string;
	x: number;
	y: number;
}

const parseSvgPath = (path: string) => {
	/**
	 * expected argument lengths
	 * @type {Object}
	 */

	var length: any = {a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0}

	/**
	 * segment pattern
	 * @type {RegExp}
	 */

	var segment = /([astvzqmhlc])([^astvzqmhlc]*)/ig

	/**
	 * parse an svg path data string. Generates an Array
	 * of commands where each command is an Array of the
	 * form `[command, arg1, arg2, ...]`
	 *
	 * @param {String} path
	 * @return {Array}
	 */

	function parse(path: string) {
		var data: Array<any> = []
		//@ts-ignore
		path.replace(segment, (_, command, args) => {
			var type = command.toLowerCase()
			args = parseValues(args)

			// overloaded moveTo
			if (type == 'm' && args.length > 2) {
				data.push([command].concat(args.splice(0, 2)))
				type = 'l'
				command = command == 'm' ? 'l' : 'L'
			}

			while (true) {
				if (args.length == length[type]) {
					args.unshift(command)
					return data.push(args)
				}
				if (args.length < length[type]) throw new Error('malformed path data')
				data.push([command].concat(args.splice(0, length[type])))
			}
		})
		return data
	}

	var number = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/ig

	function parseValues(args: any) {
		var numbers = args.match(number)
		return numbers ? numbers.map(Number) : []
	}

	return parse(path)
}

const parseStrToSvg = (sourceStr: string) => {
	const parser = new DOMParser()
	return parser.parseFromString(sourceStr, "image/svg+xml")
}

const parseSvgToComponents = (root: HTMLElement): Array<IComponent> => {
	const length = root.childNodes.length
	let components: Array<IComponent> = []
	for (let i = 0; i < length; i++) {
		const node: HTMLElement = root.childNodes[i] as HTMLElement
		const type = node.tagName
		if (type === 'path') {
			const commands = parseSvgPath(node.getAttribute('d') as string)
			const _components = parsePathCommandsToComponents(commands) as unknown as IComponent;
			// if (component) {
			//   (component.value as unknown as IPenComponent).fillColor = node.getAttribute('fill') || '#000';
			//   (component.value as unknown as IPenComponent).strokeColor = node.getAttribute('stroke') || '#000';
			//   components.push(component)
			// }
			components = components.concat(_components)
		}
		if (type === 'g') {
			components.push(...parseSvgToComponents(node))
		}
		if (type === 'ellipse') {
			const ellipseX = Number(node.getAttribute('cx'))
			const ellipseY = Number(node.getAttribute('cy'))
			const radiusX = Number(node.getAttribute('rx'))
			const radiusY = Number(node.getAttribute('ry'))
			const component = genEllipseComponent(ellipseX, ellipseY, radiusX, radiusY) as unknown as IComponent;
			(component.value as unknown as IEllipseComponent).fillColor = node.getAttribute('fill') || '#000';
			(component.value as unknown as IEllipseComponent).strokeColor = node.getAttribute('stroke') || '#000';
			components.push(component)
		}
		if (type === 'rect') {
			const rectX = Number(node.getAttribute('x')) | 0
			const rectY = Number(node.getAttribute('y')) | 0
			const rectWidth = Number(node.getAttribute('width'))
			const rectHeight = Number(node.getAttribute('height'))
			const component = genRectComponent(rectX, rectY, rectWidth, rectHeight) as unknown as IComponent;
			(component.value as unknown as IRectangleComponent).fillColor = node.getAttribute('fill') || '#000';
			(component.value as unknown as IRectangleComponent).strokeColor = node.getAttribute('stroke') || '#000';
			components.push(component)
		}
		if (type === 'line') {
			const x1 = Number(node.getAttribute('x1'))
			const y1 = Number(node.getAttribute('y1'))
			const x2 = Number(node.getAttribute('x2'))
			const y2 = Number(node.getAttribute('y2'))
			const points = [
				{ x: x1, y: y1, uuid: genUUID() },
				{ x: x2, y: y2, uuid: genUUID() },
			]
			const component = genPolygonComponent(points, false) as unknown as IComponent;
			(component.value as unknown as IPenComponent).strokeColor = node.getAttribute('stroke') || '#000';
			components.push(component)
		}
		if (type === 'polygon') {
			const points: Array<IPoint> = (node.getAttribute('points') as string).split(' ').map((point: string) => {
				const arr = point.split(',')
				return { uuid: genUUID(), x: Number(arr[0]), y: Number(arr[1]) }
			})
			points.push(R.clone(points[0]))
			const component = genPolygonComponent(points, true) as unknown as IComponent;
			(component.value as unknown as IPolygonComponent).fillColor = node.getAttribute('fill') || '#000';
			(component.value as unknown as IPolygonComponent).strokeColor = node.getAttribute('stroke') || '#000';
			components.push(component)
		}
		if (type === 'polyline') {
			const points: Array<IPoint> = (node.getAttribute('points') as string).split(' ').map((point: string) => {
				const arr = point.split(',')
				return { uuid: genUUID(), x: Number(arr[0]), y: Number(arr[1]) }
			})
			const closePath = node.getAttribute('fill') === 'none' ? false : true
			if (closePath) {
				points.push({ uuid: genUUID(), x: points[0].x, y: points[0].y })
			}
			const component = genPolygonComponent(points, closePath) as unknown as IComponent;
			(component.value as unknown as IPolygonComponent).strokeColor = node.getAttribute('stroke') || '#000';
			(component.value as unknown as IPolygonComponent).fillColor = node.getAttribute('fill') || '#000';
			components.push(component)
		}
		if (type === 'circle') {
			const ellipseX = Number(node.getAttribute('cx'))
			const ellipseY = Number(node.getAttribute('cy'))
			const radiusX = Number(node.getAttribute('r'))
			const radiusY = radiusX
			const component = genEllipseComponent(ellipseX, ellipseY, radiusX, radiusY) as unknown as IComponent;
			(component.value as unknown as IEllipseComponent).fillColor = node.getAttribute('fill') || '#000';
			(component.value as unknown as IEllipseComponent).strokeColor = node.getAttribute('stroke') || '#000';
			components.push(component)
		}
	}
	return components
}

const parsePathCommandsToComponents = (commands: Array<any>) => {
	const contours: Array<Array<IPenPoint>> = [[]]
	const components: Array<IComponent> = []
	//const beziersPoints: Array<IPenPoint> = []
	if (!commands.length) return null
	if (commands[0][0] !== 'M') return null
	const pointAt = {
		x: commands[0][1],
		y: commands[0][2],
	}
	const pointTo = {
		x: commands[0][1],
		y: commands[0][2],
	}
	contours[0].push({
		uuid: genUUID(),
		x: pointAt.x,
		y: pointAt.y,
		type: 'anchor',
		origin: null,
		isShow: true,
	})
	let closePath = false
	let length = commands.length
	// if (commands[commands.length - 1][0] === 'z') {
	//   closePath = true
	//   length -= 1
	// }
	let contourIndex = 0
	for (let i = 1; i < length; i++) {
		const command = commands[i]
		const type = command[0]
		if (type === 'M' || type === 'm') {
			if (closePath) {
				pointTo.x = contours[contourIndex][0].x
				pointTo.y = contours[contourIndex][0].y
				const control1 = {
					uuid: genUUID(),
					x: pointAt.x,
					y: pointAt.y,
					type: 'control',
					origin: contours[contourIndex][contours[contourIndex].length - 1].uuid,
					isShow: true,
				}
				const anchor2 = {
					uuid: genUUID(),
					x: pointTo.x,
					y: pointTo.y,
					type: 'anchor',
					origin: null,
					isShow: true,
				}
				const control2 = {
					uuid: genUUID(),
					x: pointTo.x,
					y: pointTo.y,
					type: 'control',
					origin: anchor2.uuid,
					isShow: true,
				}
				contours[contourIndex].push(control1, control2, anchor2)
			}
			components.push(genPenComponent(contours[contourIndex], closePath) as unknown as IComponent)
			closePath = false
			pointTo.x = type === 'm' ? pointAt.x + command[1] : command[1]
			pointTo.y = type === 'm' ? pointAt.y + command[2] : command[2]
			contourIndex += 1
			contours[contourIndex] = [{
				uuid: genUUID(),
				x: pointTo.x,
				y: pointTo.y,
				type: 'anchor',
				origin: null,
				isShow: true,
			}]
		} else if (type === 'Z' || type === 'z') {
			closePath = true
		} else if (type === 'L' || type === 'l') {
			pointTo.x = type === 'l' ? pointAt.x + command[1] : command[1]
			pointTo.y = type === 'l' ? pointAt.y + command[2] : command[2]
			const control1 = {
				uuid: genUUID(),
				x: pointAt.x,
				y: pointAt.y,
				type: 'control',
				origin: contours[contourIndex][contours[contourIndex].length - 1].uuid,
				isShow: true,
			}
			const anchor2 = {
				uuid: genUUID(),
				x: pointTo.x,
				y: pointTo.y,
				type: 'anchor',
				origin: null,
				isShow: true,
			}
			const control2 = {
				uuid: genUUID(),
				x: pointTo.x,
				y: pointTo.y,
				type: 'control',
				origin: anchor2.uuid,
				isShow: true,
			}
			contours[contourIndex].push(control1, control2, anchor2)
		}
		if (type === 'H' || type === 'h') {
			pointTo.x = type === 'h' ? pointAt.x + command[1] : command[1]
			pointTo.y = type === pointAt.y
			const control1 = {
				uuid: genUUID(),
				x: pointAt.x,
				y: pointAt.y,
				type: 'control',
				origin: contours[contourIndex][contours[contourIndex].length - 1].uuid,
				isShow: true,
			}
			const anchor2 = {
				uuid: genUUID(),
				x: pointTo.x,
				y: pointTo.y,
				type: 'anchor',
				origin: null,
				isShow: true,
			}
			const control2 = {
				uuid: genUUID(),
				x: pointTo.x,
				y: pointTo.y,
				type: 'control',
				origin: anchor2.uuid,
				isShow: true,
			}
			contours[contourIndex].push(control1, control2, anchor2)
		}
		if (type === 'V' || type === 'v') {
			pointTo.x = type === pointAt.x
			pointTo.y = type === 'v' ? pointAt.y + command[1] : command[1]
			const control1 = {
				uuid: genUUID(),
				x: pointAt.x,
				y: pointAt.y,
				type: 'control',
				origin: contours[contourIndex][contours[contourIndex].length - 1].uuid,
				isShow: true,
			}
			const anchor2 = {
				uuid: genUUID(),
				x: pointTo.x,
				y: pointTo.y,
				type: 'anchor',
				origin: null,
				isShow: true,
			}
			const control2 = {
				uuid: genUUID(),
				x: pointTo.x,
				y: pointTo.y,
				type: 'control',
				origin: anchor2.uuid,
				isShow: true,
			}
			contours[contourIndex].push(control1, control2, anchor2)
		}
		if (type === 'C' || type === 'c') {
			pointTo.x = type === 'c' ? pointAt.x + command[5] : command[5]
			pointTo.y = type === 'c' ? pointAt.y + command[6] : command[6]
			const control1 = {
				uuid: genUUID(),
				x: type === 'c' ? pointAt.x + command[1] : command[1],
				y: type === 'c' ? pointAt.y + command[2] : command[2],
				type: 'control',
				origin: contours[contourIndex][contours[contourIndex].length - 1].uuid,
				isShow: true,
			}
			const anchor2 = {
				uuid: genUUID(),
				x: pointTo.x,
				y: pointTo.y,
				type: 'anchor',
				origin: null,
				isShow: true,
			}
			const control2 = {
				uuid: genUUID(),
				x: type === 'c' ? pointAt.x + command[3] : command[3],
				y: type === 'c' ? pointAt.y + command[4] : command[4],
				type: 'control',
				origin: anchor2.uuid,
				isShow: true,
			}
			contours[contourIndex].push(control1, control2, anchor2)
		}
		if (type === 'S' || type === 's') {
			pointTo.x = type === 's' ? pointAt.x + command[3] : command[3]
			pointTo.y = type === 's' ? pointAt.y + command[4] : command[4]
			const lastCommand = commands[i - 1][0]
			const _control = {
				x: pointAt.x,
				y: pointAt.y,
			}
			if (lastCommand.match(/[CcSsQqTt]/g)) {
				const lastControl = contours[contourIndex][contours[contourIndex].length - 2]
				_control.x = pointAt.x + pointAt.x - lastControl.x
				_control.y = pointAt.y + pointAt.y - lastControl.y
			}
			const control1 = {
				uuid: genUUID(),
				x: _control.x,
				y: _control.y,
				type: 'control',
				origin: contours[contourIndex][contours[contourIndex].length - 1].uuid,
				isShow: true,
			}
			const anchor2 = {
				uuid: genUUID(),
				x: pointTo.x,
				y: pointTo.y,
				type: 'anchor',
				origin: null,
				isShow: true,
			}
			const control2 = {
				uuid: genUUID(),
				x: type === 's' ? pointAt.x + command[1] : command[1],
				y: type === 's' ? pointAt.y + command[2] : command[2],
				type: 'control',
				origin: anchor2.uuid,
				isShow: true,
			}
			contours[contourIndex].push(control1, control2, anchor2)
		}
		if (type === 'Q' || type === 'q') {
			pointTo.x = type === 'q' ? pointAt.x + command[3] : command[3]
			pointTo.y = type === 'q' ? pointAt.y + command[4] : command[4]
			const control1 = {
				uuid: genUUID(),
				x: type === 'q' ? pointAt.x + command[1] : command[1],
				y: type === 'q' ? pointAt.y + command[2] : command[2],
				type: 'control',
				origin: contours[contourIndex][contours[contourIndex].length - 1].uuid,
				isShow: true,
			}
			const anchor2 = {
				uuid: genUUID(),
				x: pointTo.x,
				y: pointTo.y,
				type: 'anchor',
				origin: null,
				isShow: true,
			}
			const control2 = {
				uuid: genUUID(),
				x: type === 'q' ? pointAt.x + command[1] : command[1],
				y: type === 'q' ? pointAt.y + command[2] : command[2],
				type: 'control',
				origin: anchor2.uuid,
				isShow: true,
			}
			contours[contourIndex].push(control1, control2, anchor2)
		}
		if (type === 'T' || type === 't') {
			pointTo.x = type === 't' ? pointAt.x + command[1] : command[1]
			pointTo.y = type === 't' ? pointAt.y + command[2] : command[2]
			const lastCommand = commands[i - 1][0]
			const _control = {
				x: pointAt.x,
				y: pointAt.y,
			}
			if (lastCommand.match(/[CcSsQqTt]/g)) {
				const lastControl = contours[contourIndex][contours[contourIndex].length - 2]
				_control.x = pointAt.x + pointAt.x - lastControl.x
				_control.y = pointAt.y + pointAt.y - lastControl.y
			}
			const control1 = {
				uuid: genUUID(),
				x: _control.x,
				y: _control.y,
				type: 'control',
				origin: contours[contourIndex][contours[contourIndex].length - 1].uuid,
				isShow: true,
			}
			const anchor2 = {
				uuid: genUUID(),
				x: pointTo.x,
				y: pointTo.y,
				type: 'anchor',
				origin: null,
				isShow: true,
			}
			const control2 = {
				uuid: genUUID(),
				x: _control.x,
				y: _control.y,
				type: 'control',
				origin: anchor2.uuid,
				isShow: true,
			}
			contours[contourIndex].push(control1, control2, anchor2)
		}
		if (type === 'A' || type === 'a') {
			const rx = command[1]
			const ry = command[2]
			const angle = command[3] * Math.PI / 180
			const flagA = command[4]
			const flagS = command[5]
			pointTo.x = type === 'a' ? pointAt.x + command[6] : command[6]
			pointTo.y = type === 'a' ? pointAt.y + command[7] : command[7]
			console.log('start: ', pointAt)
			console.log('to: ', pointTo)
			const beziers = convertEllipsePathToBeziers(
				rx,
				ry,
				angle,
				flagA,
				flagS,
				pointAt.x,
				pointAt.y,
				pointTo.x,
				pointTo.y,
			)
			beziers.forEach((bezier) => {
				const control1 = {
					uuid: genUUID(),
					x: bezier.cpx1,
					y: bezier.cpy1,
					type: 'control',
					origin: contours[contourIndex][contours[contourIndex].length - 1].uuid,
					isShow: true,
				}
				const anchor2 = {
					uuid: genUUID(),
					x: bezier.en2.x,
					y: bezier.en2.y,
					type: 'anchor',
					origin: null,
					isShow: true,
				}
				const control2 = {
					uuid: genUUID(),
					x: bezier.cpx2,
					y: bezier.cpy2,
					type: 'control',
					origin: anchor2.uuid,
					isShow: true,
				}
				contours[contourIndex].push(control1, control2, anchor2)
			})
			console.log('beziers: ', beziers)
		}
		pointAt.x = pointTo.x
		pointAt.y = pointTo.y
	}
	if (closePath) {
		pointTo.x = contours[contourIndex][0].x
		pointTo.y = contours[contourIndex][0].y
		const control1 = {
			uuid: genUUID(),
			x: pointAt.x,
			y: pointAt.y,
			type: 'control',
			origin: contours[contourIndex][contours[contourIndex].length - 1].uuid,
			isShow: true,
		}
		const anchor2 = {
			uuid: genUUID(),
			x: pointTo.x,
			y: pointTo.y,
			type: 'anchor',
			origin: null,
			isShow: true,
		}
		const control2 = {
			uuid: genUUID(),
			x: pointTo.x,
			y: pointTo.y,
			type: 'control',
			origin: anchor2.uuid,
			isShow: true,
		}
		contours[contourIndex].push(control1, control2, anchor2)
	}
	components.push(genPenComponent(contours[contourIndex], closePath) as unknown as IComponent)
	return components
}

const componentsToSvg = (components: Array<IComponent>, width: number, height: number, renderStyle: string = 'default', options: any = {
	isSub: false,
	ox: 0,
	oy: 0,
}) => {
	const { isSub, ox, oy } = options
	let svg = isSub ? '' : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`
	let fillColor = renderStyle === 'contour' ? '' : '#000000'
	for (let i = 0; i < components.length; i++) {
		const component = components[i]
		const { x, y, w, h, rotation } = component
		if (component.type === 'pen') {
			const { points, strokeColor, closePath } = component.value as unknown as IPenComponent
			if (renderStyle === 'default') {
				fillColor = (component.value as unknown as IPenComponent).fillColor || '#000'
			}
			const { x: origin_x, y: origin_y, w: origin_w, h: origin_h } = getBound(points)
			const translateX = x - origin_x
			const translateY = y - origin_y
			const scaleX = w / origin_w
			const scaleY = h / origin_h
			const rotateCenterX = x + w / 2
			const rotateCenterY = y + h / 2
			if (!points.length) continue
			svg += `<path fill="${fillColor}" stroke="${strokeColor}" d="M ${points[0].x},${points[0].y} `
			for (let j = 1; j < points.length; j += 3) {
				svg += `C ${points[j].x},${points[j].y},${points[j + 1].x},${points[j + 1].y},${points[j + 2].x},${points[j + 2].y} `
			}
			if (closePath) {
				svg += 'z'
			}
			svg += `" `
			svg += `transform="translate(${translateX}, ${translateY}) `
			svg += `scale(${scaleX}, ${scaleY}) `
			svg += `rotate(${rotation}, ${rotateCenterX}, ${rotateCenterY})"`
			svg += ' />'
		} else if (component.type === 'polygon') {
			const { points, strokeColor, closePath } = component.value as unknown as IPolygonComponent
			if (renderStyle === 'default') {
				fillColor = (component.value as unknown as IPolygonComponent).fillColor || '#000'
			}
			const { x: origin_x, y: origin_y, w: origin_w, h: origin_h } = getBound(points)
			const translateX = x - origin_x
			const translateY = y - origin_y
			const scaleX = w / origin_w
			const scaleY = h / origin_h
			const rotateCenterX = x + w / 2
			const rotateCenterY = y + h / 2
			if (!points.length) continue
			svg += `<path fill="${fillColor}" stroke="${strokeColor}" d="M ${points[0].x},${points[0].y} `
			for (let j = 1; j < points.length; j++) {
				svg += `L ${points[j].x},${points[j].y} `
			}
			if (closePath) {
				svg += 'z'
			}
			svg += `" `
			svg += `transform="translate(${translateX}, ${translateY}) `
			svg += `scale(${scaleX}, ${scaleY}) `
			svg += `rotate(${rotation}, ${rotateCenterX}, ${rotateCenterY})"`
			svg += ' />'
		} else if (component.type === 'ellipse') {
			const { radiusX, radiusY, strokeColor } = component.value as unknown as IEllipseComponent
			if (renderStyle === 'default') {
				fillColor = (component.value as unknown as IEllipseComponent).fillColor || '#000'
			}
			const translateX = radiusX
			const translateY = radiusY
			const scaleX = w / (radiusX * 2)
			const scaleY = h / (radiusY * 2)
			const rotateCenterX = x + w / 2
			const rotateCenterY = y + h / 2
			svg += `<ellipse fill="${fillColor}" stroke="${strokeColor}" `
			svg += `cx="${x}" cy="${y}" rx="${radiusX}" ry="${radiusY}" `
			svg += `transform="translate(${translateX}, ${translateY}) `
			svg += `scale(${scaleX}, ${scaleY}) `
			svg += `rotate(${rotation}, ${rotateCenterX}, ${rotateCenterY})"`
			svg += ' />'
		} else if (component.type === 'rectangle') {
			const { width, height, strokeColor } = component.value as unknown as IRectangleComponent
			if (renderStyle === 'default') {
				fillColor = (component.value as unknown as IRectangleComponent).fillColor || '#000'
			}
			const scaleX = w / width
			const scaleY = h / height
			const rotateCenterX = x + w / 2
			const rotateCenterY = y + h / 2
			svg += `<rect fill="${fillColor}" stroke="${strokeColor}" `
			svg += `x="${x}" y="${y}" width="${width}" height="${height}" `
			svg += `transform="translate(0, 0) `
			svg += `scale(${scaleX}, ${scaleY}) `
			svg += `rotate(${rotation}, ${rotateCenterX}, ${rotateCenterY})"`
			svg += ' />'
		} else if (component.type === 'glyph-pen') {
			const { points } = component as unknown as PenComponent
			const strokeColor = '#000'
			const closePath = true
			if (renderStyle === 'default') {
				fillColor = '#000'
			}
			if (!points.length) continue
			svg += `<path fill="${fillColor}" stroke="${strokeColor}" d="M ${points[0].x + ox},${points[0].y + oy} `
			for (let j = 1; j < points.length; j += 3) {
				svg += `C ${points[j].x + ox},${points[j].y + oy},${points[j + 1].x + ox},${points[j + 1].y + oy},${points[j + 2].x + ox},${points[j + 2].y + oy} `
			}
			if (closePath) {
				svg += 'z'
			}
			svg += `"`
			svg += ' />'
		} else if (component.type === 'glyph-polygon') {
			const { points } = component as unknown as PolygonComponent
			const strokeColor = '#000'
			const closePath = true
			if (renderStyle === 'default') {
				fillColor = '#000'
			}
			if (!points.length) continue
			svg += `<path fill="${fillColor}" stroke="${strokeColor}" d="M ${points[0].x + ox},${points[0].y + oy} `
			for (let j = 1; j < points.length; j++) {
				svg += `L ${points[j].x + ox},${points[j].y + oy} `
			}
			if (closePath) {
				svg += 'z'
			}
			svg += `"`
			svg += ' />'
		} else if (component.type === 'glyph-ellipse') {
			const { centerX, centerY, radiusX, radiusY } = component as unknown as EllipseComponent
			const strokeColor = '#000'
			if (renderStyle === 'default') {
				fillColor = '#000'
			}
			svg += `<ellipse fill="${fillColor}" stroke="${strokeColor}" `
			svg += `cx="${centerX + ox}" cy="${centerY + oy}" rx="${radiusX}" ry="${radiusY}"`
			svg += ' />'
		} else if (component.type === 'glyph-rectangle') {
			const { x, y, width, height } = component as unknown as RectangleComponent
			const strokeColor = '#000'
			if (renderStyle === 'default') {
				fillColor ='#000'
			}
			svg += `<rect fill="${fillColor}" stroke="${strokeColor}" `
			svg += `x="${x + ox}" y="${y + oy}" width="${width}" height="${height}" `
			svg += '/>'
		} else if (component.type === 'glyph') {
			const glyph = component.value as unknown as ICustomGlyph
			if (!glyph._o) {
				executeScript(glyph)
				glyph._o.getJoints().map((joint) => {
					joint.component = component as unknown as IGlyphComponent
				})
			}
			const subSvg = componentsToSvg(glyph._o.components, width, height, renderStyle, {
				isSub: true,
				ox: ox + (component as unknown as IGlyphComponent).ox,
				oy: oy + (component as unknown as IGlyphComponent).oy,
			})
			svg += subSvg
		}
	}
	!isSub && (svg += '</svg>')
	return svg
}

const convertEllipsePathToBeziers = (
	rx: number,
	ry: number,
	phi: number,
	flagA: number,
	flagS: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
) => {
	console.log('convert, radius: ', rx, ry, phi)
	const clamp = (value: number, min: number, max: number) => {
		return Math.min(Math.max(value, min), max)
	}

	const svgAngle = (ux: number, uy: number, vx: number, vy: number ) => {
		var dot = ux*vx + uy*vy;
		var len = Math.sqrt(ux*ux + uy*uy) * Math.sqrt(vx*vx + vy*vy)

		var ang = Math.acos( clamp(dot / len,-1,1) )
		if ( (ux*vy - uy*vx) < 0)
			ang = -ang
		// if ( (ux*vy - uy*vx) >= 0)
		//   ang = -ang
		return ang
	}
	
	const generateBezierPoints = (
		rx: number,
		ry: number,
		phi: number,
		flagA: number,
		flagS: number,
		x1: number,
		y1: number,
		x2: number,
		y2: number,
	) => {
		var rX = Math.abs(rx)
		var rY = Math.abs(ry)
	
		var dx2 = (x1 - x2)/2
		var dy2 = (y1 - y2)/2
	
		var x1p =  Math.cos(phi)*dx2 + Math.sin(phi)*dy2
		var y1p = -Math.sin(phi)*dx2 + Math.cos(phi)*dy2
	
		var rxs = rX * rX
		var rys = rY * rY
		var x1ps = x1p * x1p
		var y1ps = y1p * y1p
	
		var cr = x1ps/rxs + y1ps/rys
		if (cr > 1) {
			var s = Math.sqrt(cr)
			rX = s * rX
			rY = s * rY
			rxs = rX * rX
			rys = rY * rY
		}
	
		var dq = (rxs * y1ps + rys * x1ps)
		var pq = (rxs*rys - dq) / dq
		var q = Math.sqrt( Math.max(0,pq) )
		if (flagA === flagS)
			q = -q
		var cxp = q * rX * y1p / rY
		var cyp = - q * rY * x1p / rX
	
		var cx = Math.cos(phi)*cxp - Math.sin(phi)*cyp + (x1 + x2)/2
		var cy = Math.sin(phi)*cxp + Math.cos(phi)*cyp + (y1 + y2)/2

		console.log('start, end', x1, y1, x2, y2, Math.sin(phi)*cxp + Math.cos(phi)*cyp + (y1 + y2)/2)
		console.log('cx, cy: ', cx, cy, x1p, cxp, y1p, cyp)
	
		var theta = svgAngle( 1,0, (x1p-cxp) / rX, (y1p - cyp)/rY )
	
		var delta = svgAngle(
			(x1p - cxp)/rX,
			(y1p - cyp)/rY,
			(-x1p - cxp)/rX,
			(-y1p - cyp)/rY
		)

		// let theta = svgAngle(1, 0, (x1 - cx) / rX, (y1 - cy) / rY)
		// let delta = svgAngle(1, 0, (x2 - cx) / rX, (y2 - cy) / rY)
	
		//delta = delta - Math.PI * 2 * Math.floor(delta / (Math.PI * 2))
		
		//delta = delta % (Math.PI * 2)

		while(delta > Math.PI * 2) {
			delta -= Math.PI * 2
		}
		while (delta < 0) {
			delta += Math.PI * 2
		}

		if (!flagS)
			delta -= 2 * Math.PI
	
		var n1 = theta, n2 = theta + delta

		// while(n2 > Math.PI * 2) {
		//   n2 -= Math.PI * 2
		// }
		// while (n2 < 0) {
		//   n2 += Math.PI * 2
		// }

		console.log('theta, delta: ', theta, delta, ';  n1, n2: ', n1, n2)
	
		// E(n)
		// cx +acosθcosη−bsinθsinη
		// cy +asinθcosη+bcosθsinη
		const E = (n: number) => {
			var enx = cx + rx * Math.cos(phi) * Math.cos(n) - ry * Math.sin(phi) * Math.sin(n)
			var eny = cy + rx * Math.sin(phi) * Math.cos(n) + ry * Math.cos(phi) * Math.sin(n)
			return {x: enx,y: eny}
		}
	
		// E'(n)
		// −acosθsinη−bsinθcosη
		// −asinθsinη+bcosθcosη
		const Ed = (n: number) => {
			var ednx = -1 * rx * Math.cos(phi) * Math.sin(n) - ry * Math.sin(phi) * Math.cos(n)
			var edny = -1 * rx * Math.sin(phi) * Math.sin(n) + ry * Math.cos(phi) * Math.cos(n)
			return {x: ednx, y: edny}
		}
	
		console.log('E: ', E(theta), E(delta))

		var n = []
		n.push(n1)
	
		var interval = Math.PI/4
	
		while(n[n.length - 1] + interval < n2)
			n.push(n[n.length - 1] + interval)
		if (n2 > n1) {
			while(n[n.length - 1] + interval < n2)
				n.push(n[n.length - 1] + interval)
		} else {
			while(n[n.length - 1] - interval > n2)
				n.push(n[n.length - 1] - interval)
		}
	
		n.push(n2)
	
		const getCP = (n1: number, n2: number) => {
			var en1 = E(n1)
			var en2 = E(n2)
			var edn1 = Ed(n1)
			var edn2 = Ed(n2)
			var alpha = Math.sin(n2 - n1) * (Math.sqrt(4 + 3 * Math.pow(Math.tan((n2 - n1)/2), 2)) - 1)/3
	
			return {
				cpx1: en1.x + alpha*edn1.x,
				cpy1: en1.y + alpha*edn1.y,
				cpx2: en2.x - alpha*edn2.x,
				cpy2: en2.y - alpha*edn2.y,
				en1: en1,
				en2: en2
			}

			// return {
			//   cpx1: en1.x + alpha*edn1.x,
			//   cpy1: en1.y - alpha*edn1.y,
			//   cpx2: en2.x - alpha*edn2.x,
			//   cpy2: en2.y + alpha*edn2.y,
			//   en1: en1,
			//   en2: en2
			// }
		}
	
		var cps = []
		for(var i = 0; i < n.length - 1; i++) {
			console.log('test: ', n[i], n[i + 1], getCP(n[i],n[i+1]))
			cps.push(getCP(n[i],n[i+1]))
		}
	
		return cps
	}
	return generateBezierPoints(rx, ry, phi, flagA, flagS, x1, y1, x2, y2)
}

export {
	parseSvgPath,
	parseStrToSvg,
	parseSvgToComponents,
	componentsToSvg,
}
