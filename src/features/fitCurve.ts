/**
 * 该文件包含了贝塞尔曲线拟合的相关方法
 */
/**
 * this file contains related methods for bezier curves fitting
 */

import { bezierCurve } from "./bezierCurve"
import paper from 'paper'
import { useFixedCurves } from '../fontEditor/stores/global'

export interface IPoint {
	x: number;
	y: number;
}

interface IVector {
	x: number;
	y: number;
}

const _fitCurve = (points: Array<IPoint>, maxError: number, curvesNum: number = 5) => {
	if (useFixedCurves.value) {
		return fitCurveFixed(points, maxError, curvesNum)
	}
	return fitCurve(points, maxError)
}

/**
 * 固定使用指定数量的曲线拟合轮廓点（基于误差驱动的分割策略）
 * Fixed number of curves to fit contour points (error-driven split strategy)
 * @param points 输入点数组 / Input points array
 * @param maxError 最大误差阈值 / Max error threshold
 * @param curvesNum 固定的曲线数量 / Fixed number of curves (default: 3)
 * @returns 贝塞尔曲线数组 / Array of Bezier curves
 */
const fitCurveFixed = (points: Array<IPoint>, maxError: number, curvesNum: number = 5) => {
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
	
	// 定义一个段的结构
	interface Segment {
		startIdx: number
		endIdx: number
		points: Array<IPoint>
		leftTangent: IVector
		rightTangent: IVector
		bezCurve: Array<IPoint> | null
		maxError: number
		splitPoint: number
	}
	
	// 初始化：整个点集作为一个段
	const leftTangent = normalize({
		x: points[1].x - points[0].x,
		y: points[1].y - points[0].y,
	})
	const rightTangent = normalize({
		x: points[points.length - 2].x - points[points.length - 1].x,
		y: points[points.length - 2].y - points[points.length - 1].y,
	})
	
	// 创建初始段并拟合
	const segments: Segment[] = [{
		startIdx: 0,
		endIdx: points.length - 1,
		points: points,
		leftTangent: leftTangent,
		rightTangent: rightTangent,
		bezCurve: null,
		maxError: 0,
		splitPoint: 0
	}]
	
	// 拟合初始段
	fitSegment(segments[0], maxError)
	
	// 迭代分割，直到达到目标曲线数量
	while (segments.length < curvesNum) {
		// 找到误差最大的段
		let maxErrorSegment = segments[0]
		let maxErrorSegmentIdx = 0
		
		for (let i = 1; i < segments.length; i++) {
			if (segments[i].maxError > maxErrorSegment.maxError) {
				maxErrorSegment = segments[i]
				maxErrorSegmentIdx = i
			}
		}
		
		// 如果误差最大的段已经很小，或者点数太少，就在最长的段上分割
		if (maxErrorSegment.maxError < maxError || maxErrorSegment.points.length < 4) {
			// 找到点数最多的段
			let longestSegment = segments[0]
			let longestSegmentIdx = 0
			for (let i = 1; i < segments.length; i++) {
				if (segments[i].points.length > longestSegment.points.length) {
					longestSegment = segments[i]
					longestSegmentIdx = i
				}
			}
			
			if (longestSegment.points.length < 4) {
				// 没有可以分割的段了，退出
				break
			}
			
			maxErrorSegment = longestSegment
			maxErrorSegmentIdx = longestSegmentIdx
		}
		
		// 分割这个段
		const splitIdx = maxErrorSegment.splitPoint
		
		// 计算中间切线
		const centerTangent_l = normalize({
			x: maxErrorSegment.points[splitIdx - 1].x - maxErrorSegment.points[splitIdx + 1].x,
			y: maxErrorSegment.points[splitIdx - 1].y - maxErrorSegment.points[splitIdx + 1].y,
		})
		const centerTangent_r: IVector = {
			x: -centerTangent_l.x,
			y: -centerTangent_l.y
		}
		
		// 创建左段
		const leftSegment: Segment = {
			startIdx: maxErrorSegment.startIdx,
			endIdx: maxErrorSegment.startIdx + splitIdx,
			points: maxErrorSegment.points.slice(0, splitIdx + 1),
			leftTangent: maxErrorSegment.leftTangent,
			rightTangent: centerTangent_l,
			bezCurve: null,
			maxError: 0,
			splitPoint: 0
		}
		
		// 创建右段
		const rightSegment: Segment = {
			startIdx: maxErrorSegment.startIdx + splitIdx,
			endIdx: maxErrorSegment.endIdx,
			points: maxErrorSegment.points.slice(splitIdx),
			leftTangent: centerTangent_r,
			rightTangent: maxErrorSegment.rightTangent,
			bezCurve: null,
			maxError: 0,
			splitPoint: 0
		}
		
		// 拟合新段
		fitSegment(leftSegment, maxError)
		fitSegment(rightSegment, maxError)
		
		// 替换原段为新的两段
		segments.splice(maxErrorSegmentIdx, 1, leftSegment, rightSegment)
	}
	
	// 返回所有段的贝塞尔曲线
	return segments.map(seg => seg.bezCurve).filter(curve => curve !== null)
}

/**
 * 拟合一个段并计算误差
 * Fit a segment and compute error
 */
const fitSegment = (segment: any, maxError: number) => {
	const { points, leftTangent, rightTangent } = segment
	
	if (points.length === 2) {
		const dist = norm({
			x: points[1].x - points[0].x,
			y: points[1].y - points[0].y,
		}) / 3.0
		segment.bezCurve = [
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
		segment.maxError = 0
		segment.splitPoint = Math.floor(points.length / 2)
		return
	}
	
	// 生成参数化
	let u = chordLengthParamerize(points)
	
	// 生成贝塞尔曲线
	let bezCurve = generateBezier(points, u, leftTangent, rightTangent) as Array<IPoint>
	
	// 计算最大误差
	let errorResult = computeMaxError(points, bezCurve, u) as {
		maxDist: number,
		splitPoint: number,
	}
	
	// 如果误差较大且在合理范围内，尝试重新参数化优化（最多迭代5次）
	if (errorResult.maxDist >= maxError && errorResult.maxDist < Math.pow(maxError, 2)) {
		for (let i = 0; i < 5; i++) {
			const uPrime = reparameterize(bezCurve, points, u)
			bezCurve = generateBezier(points, uPrime, leftTangent, rightTangent) as Array<IPoint>
			const newErrorResult = computeMaxError(points, bezCurve, uPrime) as {
				maxDist: number,
				splitPoint: number,
			}
			
			if (newErrorResult.maxDist < errorResult.maxDist) {
				errorResult = newErrorResult
				u = uPrime
			} else {
				break // 不再改善，停止迭代
			}
		}
	}
	
	segment.bezCurve = bezCurve
	segment.maxError = errorResult.maxDist
	segment.splitPoint = errorResult.splitPoint
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
	_fitCurve,
}