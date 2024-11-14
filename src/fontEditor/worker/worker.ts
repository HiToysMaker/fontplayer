//@ts-ignore
//self.document = {querySelectorAll(){return []}}
//import './shim'
// import { WorkerEventType } from "."
// import {
// 	contoursToComponents,
// 	componentsToContours,
// } from '@/features/font'
// import { genUUID } from "@/utils/string"

const genUUID = () => {
  function S4() {
    return (((1 + Math.random())*0x10000)|0).toString(16).substring(1)
  }
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4())
}

enum WorkerEventType {
	ParseFont,
}

interface IPenComponent {
  points: any;
  strokeColor: string;
  fillColor: string;
  closePath: boolean;
  editMode: boolean;
}

interface IPolygonComponent {
  points: any;
  strokeColor: string;
  fillColor: string;
  closePath: boolean;
}

interface IRectangleComponent {
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  closePath: boolean;
}

interface IEllipseComponent {
  radiusX: number;
  radiusY: number;
  strokeColor: string;
  fillColor: string;
  closePath: boolean;
}

enum IComponentValue {
  IPenComponent,
  IPolygonComponent,
  IRectangleComponent,
  IEllipseComponent,
  IPictureComponent,
}

interface IComponent {
  uuid: string;
  type: string;
  name: string;
  lock: boolean;
  visible: boolean;
  value: IComponentValue;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  usedInCharacter: boolean;
}

interface ILine {
	type: PathType.LINE;
	start: IPoint;
	end: IPoint;
}

interface IQuadraticBezierCurve {
	type: PathType.QUADRATIC_BEZIER;
	start: IPoint;
	end: IPoint;
	control: IPoint;
}

interface ICubicBezierCurve {
	type: PathType.CUBIC_BEZIER;
	start: IPoint;
	end: IPoint;
	control1: IPoint;
	control2: IPoint;
}

enum PathType {
	LINE,
	QUADRATIC_BEZIER,
	CUBIC_BEZIER,
}

interface IPoint {
  x: number;
  y: number;
}

const getBound = (points: Array<{x: number, y: number}>) => {
  let minx = Infinity
  let miny = Infinity
  let maxx = -Infinity
  let maxy = -Infinity
  for (let i = 0; i < points.length; i++) {
    if (points[i].x < minx) {
      minx = points[i].x
    }
    if (points[i].x > maxx) {
      maxx = points[i].x
    }
    if (points[i].y < miny) {
      miny = points[i].y
    }
    if (points[i].y > maxy) {
      maxy = points[i].y
    }
  }
  return {
    x: minx,
    y: miny,
    w: maxx - minx,
    h: maxy - miny,
  }
}

const genPenComponent = (
  points: Array<IPoint>,
  closePath: boolean,
  fillColor: string = '',
  strokeColor: string = '#000',
) => {
  const { x, y, w, h } = getBound(points.reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
    arr.push({
      x: point.x,
      y: point.y,
    })
    return arr
  }, []))
  return {
    uuid: genUUID(),
    type: 'pen',
    name: 'pen',
    lock: false,
    visible: true,
    value: {
      points: points,
      fillColor,
      strokeColor,
      closePath,
      editMode: false,
    } as unknown as IComponentValue,
    x,
    y,
    w,
    h,
    rotation: 0,
    flipX: false,
    flipY: false,
    usedInCharacter: true,
  }
}

interface IPenPoint {
  uuid: string;
  x: number;
  y: number;
  type: string;
  origin: string | null;
  isShow?: boolean;
}

const contoursToComponents = (contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>, options: {
	unitsPerEm: number,
	descender: number,
	advanceWidth: number,
}) => {
	const components = contours.map((contour) => {
		const points: Array<IPenPoint> = []
		for (let i = 0; i < contour.length; i++) {
			const path = contour[i]
			if (i === 0) {
				points.push({
					uuid: genUUID(),
					x: path.start.x,
					y: path.start.y,
					type: 'anchor',
					origin: null,
					isShow: true,
				})
			}
			switch (path.type) {
				case PathType.LINE: {
					const control1 = {
						uuid: genUUID(),
						x: path.start.x,
						y: path.start.y,
						type: 'control',
						origin: points[points.length - 1].uuid,
						isShow: true,
					}
					const anchor2 = {
						uuid: genUUID(),
						x: path.end.x,
						y: path.end.y,
						type: 'anchor',
						origin: null,
						isShow: true,
					}
					const control2 = {
						uuid: genUUID(),
						x: path.end.x,
						y: path.end.y,
						type: 'control',
						origin: anchor2.uuid,
						isShow: true,
					}
					points.push(control1, control2, anchor2)
					break
				}
				case PathType.QUADRATIC_BEZIER: {
					const control1 = {
						uuid: genUUID(),
						x: path.start.x + 2 / 3 * (path.control.x - path.start.x),
						y: path.start.y + 2 / 3 * (path.control.y - path.start.y),
						type: 'control',
						origin: points[points.length - 1].uuid,
						isShow: true,
					}
					const anchor2 = {
						uuid: genUUID(),
						x: path.end.x,
						y: path.end.y,
						type: 'anchor',
						origin: null,
						isShow: true,
					}
					const control2 = {
						uuid: genUUID(),
						x: path.end.x + 2 / 3 * (path.control.x - path.end.x),
						y: path.end.y + 2 / 3 * (path.control.y - path.end.y),
						type: 'control',
						origin: anchor2.uuid,
						isShow: true,
					}
					points.push(control1, control2, anchor2)
					break
				}
				case PathType.CUBIC_BEZIER: {
					const control1 = {
						uuid: genUUID(),
						x: path.control1.x,
						y: path.control1.y,
						type: 'control',
						origin: points[points.length - 1].uuid,
						isShow: true,
					}
					const anchor2 = {
						uuid: genUUID(),
						x: path.end.x,
						y: path.end.y,
						type: 'anchor',
						origin: null,
						isShow: true,
					}
					const control2 = {
						uuid: genUUID(),
						x: path.control2.x,
						y: path.control2.y,
						type: 'control',
						origin: anchor2.uuid,
						isShow: true,
					}
					points.push(control1, control2, anchor2)
					break
				}
			}
		}
		if (points.length && (points[points.length - 1].x !== points[0].x || points[points.length - 1].x !== points[0].y)) {
			points.push({
				uuid: genUUID(),
				x: points[points.length - 1].x,
				y: points[points.length - 1].y,
				type: 'control',
				origin: points[points.length - 1].uuid,
				isShow: true,
			})
			points.push({
				uuid: genUUID(),
				x: points[0].x,
				y: points[0].y,
				type: 'control',
				origin: points[0].uuid,
				isShow: true,
			})
			points.push({
				uuid: genUUID(),
				x: points[0].x,
				y: points[0].y,
				type: 'anchor',
				origin: points[0].uuid,
				isShow: true,
			})
		}
		return genPenComponent(formatPoints(points, options, 0) as Array<IPenPoint>, true) as unknown as IComponent
	})
	return components
}

const formatPoints = (points: Array<IPenPoint | IPoint>, options: {
	unitsPerEm: number,
	descender: number,
	advanceWidth: number,
}, type: number) => {
	const { unitsPerEm, descender, advanceWidth } = options
	if (type === 0) {
		const scale = 1//width.value / unitsPerEm
		return points.map((point) => {
			let x = point.x + (unitsPerEm - advanceWidth) / 2
			//let y = point.y + unitsPerEm - ascender
			let y = unitsPerEm - point.y
			y = y + descender
			x *= scale
			y *= scale
			return {
				...point,
				x, y
			}
		})
	} else if (type === 1) {
		const scale = 1//unitsPerEm / width.value
		return points.map((point) => {
			let x = point.x * scale
			let y = point.y * scale
			x -= (unitsPerEm - advanceWidth) / 2
			y = y - descender
			y = unitsPerEm - y
			return {
				...point,
				x, y
			}
		})
	}
	return points
}

onmessage = (e) => {
	console.log("Message received from main script");
	//const workerResult = `Result: ${e.data[0] * e.data[1]}`;
	console.log("Posting message back to main script");
	// postMessage(workerResult);

	switch(e.data[0]) {
		case WorkerEventType.ParseFont: {
			const font = e.data[1]
			const width = e.data[2]
			const unitsPerEm = font.settings.unitsPerEm
			const descender = font.settings.descender
			const list = []
			for (let j = 0; j < font.characters.length; j++) {
				const character = font.characters[j]
				//if (!character.unicode || character.name === '.notdef') continue
				if (!character.unicode && !character.name) continue
				const characterComponent = {
					uuid: genUUID(),
					text: character.unicode ? String.fromCharCode(character.unicode) : character.name,
					unicode: character.unicode ? character.unicode.toString(16) : '',
				}
				const uuid = genUUID()
				const characterFile = {
					uuid,
					type: 'text',
					character: characterComponent,
					components: [],
					groups: [],
					orderedList: [],
					selectedComponentsUUIDs: [],
					view: {
						zoom: 100,
						translateX: 0,
						translateY: 0,
					},
					info: {
						gridSettings: {
							dx: 0,
							dy: 0,
							centerSquareSize: width / 3,
							size: width,
						},
						layout: '',
						layoutTree: [],
					},
					script: `function script_${uuid.replaceAll('-', '_')} (character, constants, FP) {\n\t//Todo something\n}`,
				}
				const components = contoursToComponents(character.contours, {
					unitsPerEm,
					descender,
					advanceWidth: character.advanceWidth,
				})
				components.forEach((component) => {
					characterFile.components.push(component)
					characterFile.orderedList.push({
						type: 'component',
						uuid: component.uuid,
					})
				})
				list.push(characterFile)
			}
			postMessage(list)
			break
		}
	}
}