/**
 * 该文件包含了贝塞尔曲线相关的实用方法
 */
/**
 * this file contains related methods for bezier curves
 */

export interface IPoint {
	x: number;
	y: number;
}

interface IVector {
	x: number;
	y: number;
}

const bezierCurve = {
	q: (bezier: Array<IPoint>, t: number) => {
		const p0 = bezier[0]
		const p1 = bezier[1]
		const p2 = bezier[2]
		const p3 = bezier[3]
		const x =
			p0.x * Math.pow((1 - t), 3) +
			3 * p1.x * t * Math.pow((1 - t), 2) +
			3 * p2.x * t * t * (1 - t) +
			p3.x * Math.pow(t, 3)
		const y =
			p0.y * Math.pow((1 - t), 3) +
			3 * p1.y * t * Math.pow((1 - t), 2) +
			3 * p2.y * t * t * (1 - t) +
			p3.y * Math.pow(t, 3)
		return { x, y }
	},
	qprime: (bezier: Array<IPoint>, t: number) => {
		const p0 = bezier[0]
		const p1 = bezier[1]
		const p2 = bezier[2]
		const p3 = bezier[3]
		const x =
			3 * Math.pow((1.0 - t), 2) * (p1.x - p0.x) +
			6 * (1.0 - t) * t * (p2.x - p1.x) +
			3 * Math.pow(t, 2) * (p3.x - p2.x)
		const y =
			3 * Math.pow((1.0 - t), 2) * (p1.y - p0.y) +
			6 * (1.0 - t) * t * (p2.y - p1.y) +
			3 * Math.pow(t, 2) * (p3.y - p2.y)
		return { x, y }
	},
	qprimeprime: (bezier: Array<IPoint>, t: number) => {
		const p0 = bezier[0]
		const p1 = bezier[1]
		const p2 = bezier[2]
		const p3 = bezier[3]
		const x =
			6 * (1.0 - t) * (p2.x - 2 * p1.x + p0.x) +
			6 * t * (p3.x - 2 * p2.x + p1.x)
		const y =
			6 * (1.0 - t) * (p2.y - 2 * p1.y + p0.y) +
			6 * t * (p3.y - 2 * p2.y + p1.y)
		return { x, y }
	},
}

export {
	bezierCurve,
}