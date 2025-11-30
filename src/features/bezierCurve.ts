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

// 计算组合数 C(n, k)
const binomialCoefficient = (n: number, k: number): number => {
	if (k < 0 || k > n) return 0
	if (k === 0 || k === n) return 1
	if (k > n - k) k = n - k // 利用对称性优化
	
	let result = 1
	for (let i = 0; i < k; i++) {
		result = result * (n - i) / (i + 1)
	}
	return result
}

// 多阶贝塞尔曲线（支持 bezier.length >= 3）
const multiBezierCurve = {
	q: (bezier: Array<IPoint>, t: number) => {
		const n = bezier.length - 1 // 阶数
		if (n < 2) {
			throw new Error('Bezier curve requires at least 3 control points')
		}
		
		let x = 0
		let y = 0
		for (let i = 0; i <= n; i++) {
			const binom = binomialCoefficient(n, i)
			const basis = binom * Math.pow(t, i) * Math.pow(1 - t, n - i)
			x += bezier[i].x * basis
			y += bezier[i].y * basis
		}
		return { x, y }
	},
	qprime: (bezier: Array<IPoint>, t: number) => {
		const n = bezier.length - 1 // 阶数
		if (n < 2) {
			throw new Error('Bezier curve requires at least 3 control points')
		}
		
		let x = 0
		let y = 0
		for (let i = 0; i < n; i++) {
			const binom = binomialCoefficient(n - 1, i)
			const basis = binom * Math.pow(t, i) * Math.pow(1 - t, n - 1 - i)
			const diffX = bezier[i + 1].x - bezier[i].x
			const diffY = bezier[i + 1].y - bezier[i].y
			x += n * diffX * basis
			y += n * diffY * basis
		}
		return { x, y }
	},
	qprimeprime: (bezier: Array<IPoint>, t: number) => {
		const n = bezier.length - 1 // 阶数
		if (n < 2) {
			throw new Error('Bezier curve requires at least 3 control points')
		}
		
		let x = 0
		let y = 0
		for (let i = 0; i <= n - 2; i++) {
			const binom = binomialCoefficient(n - 2, i)
			const basis = binom * Math.pow(t, i) * Math.pow(1 - t, n - 2 - i)
			const diffX = bezier[i + 2].x - 2 * bezier[i + 1].x + bezier[i].x
			const diffY = bezier[i + 2].y - 2 * bezier[i + 1].y + bezier[i].y
			x += n * (n - 1) * diffX * basis
			y += n * (n - 1) * diffY * basis
		}
		return { x, y }
	},
}

export {
	bezierCurve,
	multiBezierCurve,
}