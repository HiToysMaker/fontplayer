import { bezierCurve } from "../../features/bezierCurve";
import { PenComponent } from "./PenComponent";
import { fitCurve } from "../../features/fitCurve";

interface IPoint {
	x: number;
	y: number;
}

interface IPath {
	type: string;
	start: IPoint;
	end: IPoint;
	control1?: IPoint;
	control2?: IPoint;
}

class Skeleton {
	private skeleton: Array<IPath> = []
	private weight: number
	private pointer: IPoint

  constructor (weight: number) {
		this.skeleton = []
		this.weight = weight
	}

	public moveTo (x, y) {
		this.pointer = {
			x, y
		}
	}

	public lineTo (x, y) {
		if (!this.pointer) return false
		this.skeleton.push({
			type: 'line',
			start: { x: this.pointer.x, y: this.pointer.y },
			end: { x, y },
		})
		this.pointer = { x, y }
	}

	public quadraticBezierTo (x1, y1, x2, y2) {
		if (!this.pointer) return false
		this.skeleton.push({
			type: 'quadratic-bezier',
			start: { x: this.pointer.x, y: this.pointer.y },
			control1: { x: x1, y: y1 },
			end: { x: x2, y: y2 },
		})
		this.pointer = { x: x2, y: y2 }
	}

	public cubicBezierTo (x1, y1, x2, y2, x3, y3) {
		if (!this.pointer) return false
		this.skeleton.push({
			type: 'cubic-bezier',
			start: { x: this.pointer.x, y: this.pointer.y },
			control1: { x: x1, y: y1 },
			control2: { x: x2, y: y2 },
			end: { x: x3, y: y3 },
		})
		this.pointer = { x: x3, y: y3 }
	}

	public fitCurveTo (points: Array<IPoint>) {
		if (!this.pointer) return false
		const beziers = fitCurve([this.pointer, ...points], 2)
		beziers.map((bezier) => {
			this.skeleton.push({
				type: 'cubic-bezier',
				start: bezier[0],
				control1: bezier[1],
				control2: bezier[2],
				end: bezier[3],
			})
			this.pointer = { x: bezier[3].x, y: bezier[3].y }
		})
	}

	public genComponent () {
		if (!this.skeleton.length) return null
		const contour1 = []
		const contour2 = []
		let dir = 1
		for (let i = 0; i < this.skeleton.length; i++) {
			const path = this.skeleton[i]
			if (path.type === 'line') {
				let sign = 1
				if (path.start.x === path.end.x) {
					if (i > 0 && i < this.skeleton.length - 1) {
						sign = this.skeleton[i - 1].start.x - this.skeleton[i + 1].end.x
						sign /= Math.abs(sign)
					} else if (i > 0) {
						sign = this.skeleton[i - 1].start.x - this.skeleton[i].start.x
						sign /= Math.abs(sign)
					} else if (i < this.skeleton.length - 1) {
						sign = this.skeleton[i].start.x - this.skeleton[i + 1].end.x
						sign /= Math.abs(sign)
					}
				}
				const k = - (path.start.y - path.end.y) / (path.start.x - path.end.x) * sign
				const angle = Math.atan(k)
				const path1 = {
					type: 'line',
					start: {
						x: path.start.x - this.weight / 2 * Math.sin(angle),
						y: path.start.y - this.weight / 2 * Math.cos(angle),
					},
					end: {
						x: path.end.x - this.weight / 2 * Math.sin(angle),
						y: path.end.y - this.weight / 2 * Math.cos(angle),
					},
					k1: k,
				}
				const path2 = {
					type: 'line',
					start: {
						x: path.start.x + this.weight / 2 * Math.sin(angle),
						y: path.start.y + this.weight / 2 * Math.cos(angle),
					},
					end: {
						x: path.end.x + this.weight / 2 * Math.sin(angle),
						y: path.end.y + this.weight / 2 * Math.cos(angle),
					},
					k1: k,
				}
				if (path.start.x === path.end.x) {
					if (i === 0) {
						if (this.skeleton.length > 1) {
							const nextPath = this.skeleton[i + 1]
							if (nextPath.end.x - path.end.x <= 0) {
								contour1.push(path2)
								contour2.push(path1)
							} else {
								contour1.push(path1)
								contour2.push(path2)
							}
						} else {
							contour1.push(path1)
							contour2.push(path2)
						}
					} else {
						const lastPath = this.skeleton[i - 1]
						if (lastPath.start.x - path.start.x <= 0) {
							contour1.push(path1)
							contour2.push(path2)
						} else {
							contour1.push(path2)
							contour2.push(path1)
						}
					}
				} else if (path.start.x - path.end.x < 0) {
					contour1.push(path1)
					contour2.push(path2)
				} else {
					contour1.push(path2)
					contour2.push(path1)
				}
			} else if (path.type === 'quadratic-bezier') {
				// const k1 = - (path.start.y - path.control1.y) / (path.start.x - path.control1.x)
				// const k2 = - (path.control1.y - path.end.y) / (path.control1.x - path.end.x)
				// const angle1 = Math.atan(k1)
				// const angle2 = Math.atan(k2)
				// const start1 = {
				// 	x: path.start.x - this.weight / 2 * Math.sin(angle1),
				// 	y: path.start.y - this.weight / 2 * Math.cos(angle1),
				// }
				// const end1 = {
				// 	x: path.end.x - this.weight / 2 * Math.sin(angle2),
				// 	y: path.end.y - this.weight / 2 * Math.cos(angle2),
				// }
				// const start2 = {
				// 	x: path.start.x + this.weight / 2 * Math.sin(angle1),
				// 	y: path.start.y + this.weight / 2 * Math.cos(angle1),
				// }
				// const end2 = {
				// 	x: path.end.x + this.weight / 2 * Math.sin(angle2),
				// 	y: path.end.y + this.weight / 2 * Math.cos(angle2),
				// }
				// const i1 = intersection(k1, start1.x, getCoordY(start1.y), k2, end1.x, getCoordY(end1.y))
				// const i2 = intersection(k1, start2.x, getCoordY(start2.y), k2, end2.x, getCoordY(end2.y))
				// contour1.push({
				// 	type: 'quadratic-bezier',
				// 	start: start1,
				// 	control1: { x: i1.x, y: getCanvasY(i1.y) },
				// 	end: end1,
				// 	k1,
				// 	k2,
				// })
				// contour2.push({
				// 	type: 'quadratic-bezier',
				// 	start: start2,
				// 	control1: { x: i2.x, y: getCanvasY(i2.y) },
				// 	end: end2,
				// 	k1,
				// 	k2,
				// })
				const bezier = [ path.start, path.control1, path.control1, path.end ]
				addContours(bezier, contour1, contour2, [{pos: 0, weight: this.weight}, {pos: 1, weight: this.weight}])
			} else if (path.type === 'cubic-bezier') {
				// const k1 = - (path.start.y - path.control1.y) / (path.start.x - path.control1.x)
				// const k2 = - (path.control2.y - path.end.y) / (path.control2.x - path.end.x)
				// const k3 = - (path.control1.y - path.control2.y) / (path.control1.x - path.control2.x)
				// const angle1 = Math.atan(k1)
				// const angle2 = Math.atan(k2)
				// const angle3 = Math.atan(k3)
				// const p1 = {
				// 	x: path.control1.x - this.weight / 2 * Math.sin(angle3),
				// 	y: path.control1.y - this.weight / 2 * Math.cos(angle3),
				// }
				// const p2 = {
				// 	x: path.control1.x + this.weight / 2 * Math.sin(angle3),
				// 	y: path.control1.y + this.weight / 2 * Math.cos(angle3),
				// }
				// const start1 = {
				// 	x: path.start.x - this.weight / 2 * Math.sin(angle1),
				// 	y: path.start.y - this.weight / 2 * Math.cos(angle1),
				// }
				// const end1 = {
				// 	x: path.end.x - this.weight / 2 * Math.sin(angle2),
				// 	y: path.end.y - this.weight / 2 * Math.cos(angle2),
				// }
				// const start2 = {
				// 	x: path.start.x + this.weight / 2 * Math.sin(angle1),
				// 	y: path.start.y + this.weight / 2 * Math.cos(angle1),
				// }
				// const end2 = {
				// 	x: path.end.x + this.weight / 2 * Math.sin(angle2),
				// 	y: path.end.y + this.weight / 2 * Math.cos(angle2),
				// }
				// const i11 = intersection(k1, start1.x, getCoordY(start1.y), k3, p1.x, getCoordY(p1.y))
				// const i12 = intersection(k3, p1.x, getCoordY(p1.y), k2, end1.x, getCoordY(end1.y))
				// const i21 = intersection(k1, start2.x, getCoordY(start2.y), k3, p2.x, getCoordY(p2.y))
				// const i22 = intersection(k3, p2.x, getCoordY(p2.y), k2, end2.x, getCoordY(end2.y))
				// contour1.push({
				// 	type: 'cubic-bezier',
				// 	start: start1,
				// 	control1: { x: i11.x, y: getCanvasY(i11.y) },
				// 	control2: { x: i12.x, y: getCanvasY(i12.y) },
				// 	end: end1,
				// 	k1,
				// 	k2,
				// 	k3,
				// })
				// contour2.push({
				// 	type: 'cubic-bezier',
				// 	start: start2,
				// 	control1: { x: i21.x, y: getCanvasY(i21.y) },
				// 	control2: { x: i22.x, y: getCanvasY(i22.y) },
				// 	end: end2,
				// 	k1,
				// 	k2,
				// 	k3,
				// })
				const bezier = [ path.start, path.control1, path.control2, path.end ]
				addContours(bezier, contour1, contour2, [{pos: 0, weight: this.weight}, {pos: 1, weight: this.weight}])
			}
		}
		const component = new PenComponent()
		component.beginPath()
		component.moveTo(contour1[0].start.x, contour1[0].start.y)
		for (let i = 0; i < contour1.length; i++) {
			const path = contour1[i]
			if (path.type === 'line') {
				if (i < contour1.length - 1) {
					const nextPath = contour1[i + 1]
					const point = intersection(path.k1, path.start.x, getCoordY(path.start.y), nextPath.k1, nextPath.start.x, getCoordY(nextPath.start.y))
					component.lineTo(point.x, getCanvasY(point.y))
				} else {
					component.lineTo(path.end.x, path.end.y)
				}
			} else if (path.type === 'quadratic-bezier') {
				if (i < contour1.length - 1) {
					const nextPath = contour1[i + 1]
					const point = intersection(path.k2, path.end.x, getCoordY(path.end.y), nextPath.k1, nextPath.start.x, getCoordY(nextPath.start.y))
					component.quadraticBezierTo(path.control1.x, path.control1.y, point.x, getCanvasY(point.y))
				} else {
					component.quadraticBezierTo(path.control1.x, path.control1.y, path.end.x, path.end.y)
				}
			} else if (path.type === 'cubic-bezier') {
				if (i < contour1.length - 1) {
					const nextPath = contour1[i + 1]
					const point = intersection(path.k3, path.end.x, getCoordY(path.end.y), nextPath.k1, nextPath.start.x, getCoordY(nextPath.start.y))
					component.bezierTo(path.control1.x, path.control1.y, path.control2.x, path.control2.y, point.x, getCanvasY(point.y))
				} else {
					component.bezierTo(path.control1.x, path.control1.y, path.control2.x, path.control2.y, path.end.x, path.end.y)
				}
			}
		}
		component.lineTo(contour2[contour2.length - 1].end.x, contour2[contour2.length - 1].end.y)
		for (let i = contour2.length - 1; i >= 0; i--) {
			const path = contour2[i]
			if (path.type === 'line') {
				if (i > 0) {
					const nextPath = contour2[i - 1]
					const nextK = nextPath.k3 ? nextPath.k3 : nextPath.k2 ? nextPath.k2 : nextPath.k1
					const point = intersection(path.k1, path.start.x, getCoordY(path.start.y), nextK, nextPath.end.x, getCoordY(nextPath.end.y))
					component.lineTo(point.x, getCanvasY(point.y))
				} else {
					component.lineTo(path.start.x, path.start.y)
				}
			} else if (path.type === 'quadratic-bezier') {
				if (i > 0) {
					const nextPath = contour2[i - 1]
					const nextK = nextPath.k3 ? nextPath.k3 : nextPath.k2 ? nextPath.k2 : nextPath.k1
					const point = intersection(path.k1, path.start.x, getCoordY(path.start.y), nextK, nextPath.end.x, getCoordY(nextPath.end.y))
					component.quadraticBezierTo(path.control1.x, path.control1.y, point.x, getCanvasY(point.y))
				} else {
					component.quadraticBezierTo(path.control1.x, path.control1.y, path.start.x, path.start.y)
				}
			} else if (path.type === 'cubic-bezier') {
				if (i > 0) {
					const nextPath = contour2[i - 1]
					const nextK = nextPath.k3 ? nextPath.k3 : nextPath.k2 ? nextPath.k2 : nextPath.k1
					const point = intersection(path.k1, path.start.x, getCoordY(path.start.y), nextK, nextPath.end.x, getCoordY(nextPath.end.y))
					component.bezierTo(path.control2.x, path.control2.y, path.control1.x, path.control1.y, point.x, getCanvasY(point.y))
				} else {
					component.bezierTo(path.control2.x, path.control2.y, path.control1.x, path.control1.y, path.start.x, path.start.y)
				}
			}
		}
		component.lineTo(contour1[0].start.x, contour1[0].start.y)
		component.closePath()
		return component
	}

	public setweight (weight: number) {
		this.weight = weight
	}

	public getWeight () {
		return this.weight
	}

	public static getContours (bezier, weights) {
		const contour1 = []
		const contour2 = []
		addContours(bezier, contour1, contour2, weights)
		return {
			contour1,
			contour2,
		}
	}
}

const intersection = (k1, x1, y1, k2, x2, y2) => {
	if (k1 === Infinity || k1 === -Infinity) {
		const x = x1
		const y = k2 * (x - x2) + y2
		return {
			x, y,
		}
	}	else if (k2 === Infinity || k2 === -Infinity) {
		const x = x2
		const y = k1 * (x - x1) + y1
		return {
			x, y,
		}
	}
	const x = ((y2 - y1) + (k1 * x1 - k2 * x2)) / (k1 - k2)
	const y = (-k1 * y2 + k2 * y1 + (x2 - x1) * k1 * k2) / (k2 - k1)
	return {
		x, y,
	}
}

const getCoordY = (canvasY: number) => {
	return -(canvasY - 250)
}

const getCanvasY = (coordY: number) => {
	return -coordY + 250
}

const addContours = (bezier, contour1, contour2, weights: Array<{
	pos: number,
	weight: number,
}>) => {

// const addContours = (bezier, contour1, contour2, weight, endweight) => {
	const points1 = []
	const points2 = []
	const n = 1000
	let lastPoint = bezierCurve.q(bezier, 0)
	let lastK = bezierCurve.qprime(bezier, 0)
	let lastAngle = Math.atan(-lastK.y / lastK.x)
	const arr = weights.sort((a, b) => a.pos - b.pos)
	const weight_arr = []
	let weight0 = 0
	for (let i = 0; i < arr.length; i++) {
		const { pos, weight } = arr[i]
		if (pos < 1 && i < arr.length - 1) {
			const { pos: nextPos, weight: nextweight } = arr[i + 1]
			if (pos === 0) {
				weight0 = weight
			}
			for (let m = Math.round(n * pos); m < Math.round(n * nextPos); m++) {
				weight_arr[m] = weight0 + (nextweight - weight0) / Math.round(n * (nextPos - pos)) * (m - Math.round(n * pos))
			}
			weight0 = weight_arr[weight_arr.length - 1]
		} else {
			for (let m = Math.round(n * pos); m < n; m++) {
				weight_arr[m] = weight
			}
		}
	}
	for (let t = 1; t < n; t++) {
		const _weight = weight_arr[t]//weight + (endweight - weight) / n * t
		const point = bezierCurve.q(bezier, t / 1000)
		const k = bezierCurve.qprime(bezier, t / 1000)
		const angle = Math.atan(-k.y / k.x)
		if (lastAngle <= 0 || (point.y - lastPoint.y < 0)) {
			points1.push({
				x: lastPoint.x - _weight / 2 * Math.sin(lastAngle),
				y: lastPoint.y - _weight / 2 * Math.cos(lastAngle),
			})
			points2.push({
				x: lastPoint.x + _weight / 2 * Math.sin(lastAngle),
				y: lastPoint.y + _weight / 2 * Math.cos(lastAngle),
			})
		} else {
			points2.push({
				x: lastPoint.x - _weight / 2 * Math.sin(lastAngle),
				y: lastPoint.y - _weight / 2 * Math.cos(lastAngle),
			})
			points1.push({
				x: lastPoint.x + _weight / 2 * Math.sin(lastAngle),
				y: lastPoint.y + _weight / 2 * Math.cos(lastAngle),
			})
		}
		lastPoint = point
		lastK = k
		lastAngle = angle
	}
	const beziers1 = fitCurve(points1, 2)
	const beziers2 = fitCurve(points2, 2)
	beziers1.map((bezier) => {
		const k1 = - (bezier[0].y - bezier[1].y) / (bezier[0].x - bezier[1].x)
		const k2 = - (bezier[2].y - bezier[3].y) / (bezier[2].x - bezier[3].x)
		const k3 = - (bezier[1].y - bezier[2].y) / (bezier[1].x - bezier[2].x)
		const path = {
			type: 'cubic-bezier',
			start: bezier[0],
			control1: bezier[1],
			control2: bezier[2],
			end: bezier[3],
			k1,
			k2,
			k3,
		}
		contour1.push(path)
	})
	beziers2.map((bezier) => {
		const k1 = - (bezier[0].y - bezier[1].y) / (bezier[0].x - bezier[1].x)
		const k2 = - (bezier[2].y - bezier[3].y) / (bezier[2].x - bezier[3].x)
		const k3 = - (bezier[1].y - bezier[2].y) / (bezier[1].x - bezier[2].x)
		const path = {
			type: 'cubic-bezier',
			start: bezier[0],
			control1: bezier[1],
			control2: bezier[2],
			end: bezier[3],
			k1,
			k2,
			k3,
		}
		contour2.push(path)
	})
}

export {
	Skeleton,
}