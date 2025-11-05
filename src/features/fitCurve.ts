/**
 * 该文件包含了贝塞尔曲线拟合的相关方法
 */
/**
 * this file contains related methods for bezier curves fitting
 */

import { bezierCurve } from "./bezierCurve"
import paper from 'paper'

export interface IPoint {
	x: number;
	y: number;
}

interface IVector {
	x: number;
	y: number;
}

/**
 * 固定使用指定数量的曲线拟合轮廓点
 * Fixed number of curves to fit contour points
 * @param points 输入点数组 / Input points array
 * @param _maxError 最大误差（此参数在固定曲线数时不起作用）/ Max error (not used in fixed mode)
 * @param curvesNum 固定的曲线数量 / Fixed number of curves (default: 3)
 * @returns 贝塞尔曲线数组 / Array of Bezier curves
 */
const fitCurveFixed = (points: Array<IPoint>, _maxError: number, curvesNum: number = 3) => {
	if (points.length < 2) {
		return []
	}
	
	// 如果点数太少，无法分成指定数量的曲线
	if (points.length < curvesNum + 1) {
		// 退化为单条曲线
		const leftTangent = normalize({
			x: points[1].x - points[0].x,
			y: points[1].y - points[0].y,
		})
		const rightTangent = normalize({
			x: points[points.length - 2].x - points[points.length - 1].x,
			y: points[points.length - 2].y - points[points.length - 1].y,
		})
		const u = chordLengthParamerize(points)
		const bezCurve = generateBezier(points, u, leftTangent, rightTangent)
		return [bezCurve]
	}
	
	// 计算每个点的累积弧长参数（chord length）
	const chordLengths = [0]
	for (let i = 1; i < points.length; i++) {
		const dist = norm({
			x: points[i].x - points[i - 1].x,
			y: points[i].y - points[i - 1].y,
		})
		chordLengths.push(chordLengths[i - 1] + dist)
	}
	const totalLength = chordLengths[chordLengths.length - 1]
	
	// 按弧长均匀分割成 curvesNum 段
	const splitIndices: number[] = [0]
	for (let i = 1; i < curvesNum; i++) {
		const targetLength = (totalLength * i) / curvesNum
		// 找到最接近目标长度的点索引
		let bestIdx = 1
		let minDiff = Math.abs(chordLengths[1] - targetLength)
		for (let j = 2; j < points.length - 1; j++) {
			const diff = Math.abs(chordLengths[j] - targetLength)
			if (diff < minDiff) {
				minDiff = diff
				bestIdx = j
			}
		}
		splitIndices.push(bestIdx)
	}
	splitIndices.push(points.length - 1)
	
	// 为每段生成一条贝塞尔曲线
	const beziers: Array<Array<IPoint>> = []
	
	for (let i = 0; i < curvesNum; i++) {
		const startIdx = splitIndices[i]
		const endIdx = splitIndices[i + 1]
		const segmentPoints = points.slice(startIdx, endIdx + 1)
		
		// 计算左切线
		let leftTangent: IVector
		if (i === 0) {
			// 第一段：使用起始点的切线
			leftTangent = normalize({
				x: segmentPoints[1].x - segmentPoints[0].x,
				y: segmentPoints[1].y - segmentPoints[0].y,
			})
		} else {
			// 中间段：使用前一个分割点的切线（基于前后点）
			const prevIdx = Math.max(startIdx - 1, 0)
			const nextIdx = Math.min(startIdx + 1, points.length - 1)
			leftTangent = normalize({
				x: points[nextIdx].x - points[prevIdx].x,
				y: points[nextIdx].y - points[prevIdx].y,
			})
		}
		
		// 计算右切线
		let rightTangent: IVector
		if (i === curvesNum - 1) {
			// 最后一段：使用结束点的切线
			rightTangent = normalize({
				x: segmentPoints[segmentPoints.length - 2].x - segmentPoints[segmentPoints.length - 1].x,
				y: segmentPoints[segmentPoints.length - 2].y - segmentPoints[segmentPoints.length - 1].y,
			})
		} else {
			// 中间段：使用下一个分割点的切线（基于前后点，方向相反）
			const prevIdx = Math.max(endIdx - 1, 0)
			const nextIdx = Math.min(endIdx + 1, points.length - 1)
			const tangent = normalize({
				x: points[nextIdx].x - points[prevIdx].x,
				y: points[nextIdx].y - points[prevIdx].y,
			})
			rightTangent = { x: -tangent.x, y: -tangent.y }
		}
		
		// 生成参数化
		const u = chordLengthParamerize(segmentPoints)
		
		// 生成贝塞尔曲线
		const bezCurve = generateBezier(segmentPoints, u, leftTangent, rightTangent) as Array<IPoint>
		beziers.push(bezCurve)
	}
	
	return beziers
}

const fitCurve = (points: Array<IPoint>, _maxError: number) => {
	const maxError = _maxError
	//const simplifiedPoints = rdp(points, 2)
	// const leftTangent = normalize({
	// 	x: simplifiedPoints[1].x - simplifiedPoints[0].x,
	// 	y: simplifiedPoints[1].y - simplifiedPoints[0].y,
	// })
	// const rightTangent = normalize({
	// 	x: simplifiedPoints[simplifiedPoints.length - 2].x - simplifiedPoints[simplifiedPoints.length - 1].x,
	// 	y: simplifiedPoints[simplifiedPoints.length - 2].y - simplifiedPoints[simplifiedPoints.length - 1].y,
	// })
	// return fitCubic(
	// 	simplifiedPoints,
	// 	leftTangent,
	// 	rightTangent,
	// 	maxError,
	// )
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

const rdp = (points, epsilon) => {
	if (points.length <= 2) return points;

	let maxDist = 0;
	let index = 0;
	const start = points[0];
	const end = points[points.length - 1];

	for (let i = 1; i < points.length - 1; i++) {
		const dist = perpendicularDistance(points[i], start, end);
		if (dist > maxDist) {
			maxDist = dist;
			index = i;
		}
	}

	if (maxDist > epsilon) {
		const left = rdp(points.slice(0, index + 1), epsilon);
		const right = rdp(points.slice(index), epsilon);
		return left.slice(0, -1).concat(right);
	} else {
		return [start, end];
	}
};

const perpendicularDistance = (point, start, end) => {
	const area = Math.abs(
			(start.x * (end.y - point.y) + end.x * (point.y - start.y) + point.x * (start.y - end.y)) / 2
	);
	const base = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
	return (2 * area) / base;
};

export {
	fitCurve,
	fitCurveFixed,
}