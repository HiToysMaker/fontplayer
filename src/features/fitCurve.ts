/**
 * 该文件包含了贝塞尔曲线拟合的相关方法
 */
/**
 * this file contains related methods for bezier curves fitting
 */

import { bezierCurve } from "./bezierCurve";

export interface IPoint {
	x: number;
	y: number;
}

interface IVector {
	x: number;
	y: number;
}

const fitCurve = (points: Array<IPoint>, maxError: number) => {
	const leftTangent = normalize({
		x: points[1].x - points[0].x,
		y: points[1].y - points[0].y,
	})
	const rightTangent = normalize({
		x: points[points.length - 2].x - points[points.length - 1].x,
		y: points[points.length - 2].y - points[points.length - 1].y,
	})
	return fitCubic(
		points,
		leftTangent,
		rightTangent,
		maxError,
	)
}

const fitCubic: (
	points: Array<IPoint>,
	leftTangent: IVector,
	rightTangent: IVector,
	error: number,
) => Array<any> = (
	points: Array<IPoint>,
	leftTangent: IVector,
	rightTangent: IVector,
	error: number,
) => {
	if (points.length === 2) {
		const dist = norm({
			x: points[1].x - points[0].x,
			y: points[1].y - points[0].y,
		}) / 3.0
		const bezCurve = [
			points[0],
			{
				x: points[0].x + leftTangent.x * dist,
				y: points[0].y + leftTangent.y * dist,
			},
			{
				x: points[1].x + rightTangent.x * dist,
				y: points[1].y + rightTangent.y * dist,
			},
			points[1],
		]
		return [bezCurve]
	}

	let u = chordLengthParamerize(points)
	let bezCurve = generateBezier(points, u, leftTangent, rightTangent) as Array<IPoint>
	const { maxDist: maxError, splitPoint } = computeMaxError(points, bezCurve, u) as {
		maxDist: number,
		splitPoint: number,
	}
	if (maxError < error) {
		return [bezCurve]
	}

	if (maxError < Math.pow(error, 2)) {
		for (let i = 0; i < 20; i++) {
			const uPrime = reparameterize(bezCurve, points, u)
			bezCurve = generateBezier(points, uPrime, leftTangent, rightTangent) as Array<IPoint>
			const { maxDist: maxError, splitPoint } = computeMaxError(points, bezCurve, u) as {
				maxDist: number,
				splitPoint: number,
			}
			if (maxError < error) {
				return [bezCurve]
			}
			u = uPrime
		}
	}

	const beziers = []
	const centerTangent_l = normalize({
		x: points[splitPoint - 1].x - points[splitPoint + 1].x,
		y: points[splitPoint - 1].y - points[splitPoint + 1].y,
	})
	const centerTangent_r = {
		x: -centerTangent_l.x,
		y: -centerTangent_l.y
	}
	beziers.push(...fitCubic(points.slice(0, splitPoint + 1), leftTangent, centerTangent_l, error))
	beziers.push(...fitCubic(points.slice(splitPoint), centerTangent_r, rightTangent, error))
	return beziers
}

const generateBezier = (
	points: Array<IPoint>,
	parameters: Array<number>,
	leftTangent: IVector,
	rightTangent: IVector,
) => {
	const bezCurve: Array<IPoint> = [points[0], null, null, points[points.length - 1]] as Array<IPoint>
	const A: Array<Array<Array<number>>> = []
	for (let i = 0; i < parameters.length; i++) {
		const u = parameters[i]
		A[i] = []
		A[i].push([
			leftTangent.x * 3 * Math.pow((1 - u), 2) * u,
			leftTangent.y * 3 * Math.pow((1 - u), 2) * u,
		])
		A[i].push([
			rightTangent.x * 3 * (1 - u) * Math.pow(u, 2),
			rightTangent.y * 3 * (1 - u) * Math.pow(u, 2),
		])
	}
	const C: Array<Array<number>> = [[0, 0], [0, 0]]
	const X: Array<number> = [0, 0]
	for (let i = 0; i < points.length; i++) {
		const point = points[i]
		const u = parameters[i]
		C[0][0] += dot({
			x: A[i][0][0],
			y: A[i][0][1],
		}, {
			x: A[i][0][0],
			y: A[i][0][1],
		})
		C[0][1] += dot({
			x: A[i][0][0],
			y: A[i][0][1],
		}, {
			x: A[i][1][0],
			y: A[i][1][1],
		})
		C[1][0] += dot({
			x: A[i][0][0],
			y: A[i][0][1],
		}, {
			x: A[i][1][0],
			y: A[i][1][1],
		})
		C[1][1] += dot({
			x: A[i][1][0],
			y: A[i][1][1],
		}, {
			x: A[i][1][0],
			y: A[i][1][1],
		})

		const bezierPoint = bezierCurve.q([
			points[0],
			points[0],
			points[points.length - 1],
			points[points.length - 1]
		], u)
		const tmp = {
			x: point.x - bezierPoint.x,
			y: point.y - bezierPoint.y,
		}

		X[0] += dot({
			x: A[i][0][0],
			y: A[i][0][1],
		}, tmp)
		X[1] += dot({
			x: A[i][1][0],
			y: A[i][1][1],
		}, tmp)
	}

	const det_C0_C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1]
	const det_C0_X  = C[0][0] * X[1] - C[1][0] * X[0]
	const det_X_C1  = X[0] * C[1][1] - X[1] * C[0][1]

	const alpha_left = det_C0_C1 === 0 ? 0.0 : det_X_C1 / det_C0_C1
	const alpha_right = det_C0_C1 === 0 ? 0.0 : det_C0_X / det_C0_C1

	const segLength = norm({
		x: points[0].x - points[points.length - 1].x,
		y: points[0].y - points[points.length - 1].y,
	})
	const epsilon = 1.0e-6 * segLength
	if (alpha_left < epsilon || alpha_right < epsilon) {
		bezCurve[1] = {
			x: bezCurve[0].x + leftTangent.x * (segLength / 3),
			y: bezCurve[0].y + leftTangent.y * (segLength / 3),
		}
		bezCurve[2] = {
			x: bezCurve[3].x + rightTangent.x * (segLength / 3),
			y: bezCurve[3].y + rightTangent.y * (segLength / 3),
		}
	} else {
		bezCurve[1] = {
			x: bezCurve[0].x + leftTangent.x * alpha_left,
			y: bezCurve[0].y + leftTangent.y * alpha_left,
		}
		bezCurve[2] = {
			x: bezCurve[3].x + rightTangent.x * alpha_right,
			y: bezCurve[3].y + rightTangent.y * alpha_right,
		}
	}
	return bezCurve
}

const reparameterize = (
	bezier: Array<IPoint>,
	points: Array<IPoint>,
	parameters: Array<number>,
) => {
	const _parameters = []
	for (let i = 0; i < parameters.length; i++) {
		const u = parameters[i]
		const point = points[i]
		_parameters.push(newtonRaphsonRootFind(bezier, point, u))
	}
	return _parameters
}

const newtonRaphsonRootFind = (
	bezier: Array<IPoint>,
	point: IPoint,
	u: number,
) => {
	const bezierPoint: IPoint = bezierCurve.q(bezier, u)
	const d: IVector = {
		x: bezierPoint.x - point.x,
		y: bezierPoint.y - point.y,
	}
	const du1 = bezierCurve.qprime(bezier, u)
	const du2 = bezierCurve.qprimeprime(bezier, u)
	const numerator = d.x * du1.x + d.y * du1.y
	const denominator = Math.pow(du1.x, 2) + d.x * du2.x + Math.pow(du1.y, 2) + d.y * du2.y
	if (denominator === 0.0) {
		return u
	} else {
		return u - numerator / denominator
	}
}

const chordLengthParamerize = (points: Array<IPoint>) => {
	const u = [0.0]
	for (let i = 1; i < points.length; i++) {
		u.push(u[i - 1] + norm({
			x: points[i].x - points[i - 1].x,
			y: points[i].y - points[i - 1].y,
		}))
	}
	for (let i = 0; i < u.length; i++) {
		u[i] = u[i] / u[u.length - 1]
	}
	return u
}

const computeMaxError = (
	points: Array<IPoint>,
	bezier: Array<IPoint>,
	parameters: Array<number>, 
) => {
	let maxDist = 0.0
	let splitPoint = points.length / 2
	for (let i = 0; i < points.length; i++) {
		const bezierPoint = bezierCurve.q(bezier, parameters[i])
		const point = points[i]
		const dist = norm({
			x: bezierPoint.x - point.x,
			y: bezierPoint.y - point.y,
		})
		if (dist > maxDist) {
			maxDist = dist
			splitPoint = i
		}
	}
	return {
		maxDist,
		splitPoint,
	}
}

const normalize = (vec: IVector) => {
	if (vec.x === 0 && vec.y === 0) return { x: 0, y: 0 }
	return {
		x: vec.x / norm(vec),
		y: vec.y / norm(vec),
	}
}

const norm = (vec: IVector) => {
	return Math.sqrt(vec.x * vec.x + vec.y * vec.y)
}

const dot = (p1: IPoint, p2: IPoint) => {
	return p1.x * p2.x + p1.y * p2.y
}

export {
	fitCurve,
}