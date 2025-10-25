import { EllipseComponent } from './EllipseComponent'
import { PenComponent } from './PenComponent'
import { PolygonComponent } from './PolygonComponent'
import { RectangleComponent } from './RectangleComponent'
import { Skeleton } from './Skeleton'
import { Joint } from './Joint'
import { Character } from './Character'
import { fitCurve } from '../../features/fitCurve'
import { bezierCurve } from '../../features/bezierCurve'
import * as R from 'ramda'

interface IGetContoursOption {
	unticlockwise?: boolean;
	skeletonPos?: string;
	weightsVariation?: string;
	weightsVariationPower?: number;
	weightsVariationDir?: string;
	startWeight?: number;
	endWeight?: number;
	weightsVariationFnType?: string;
	in_startWeight?: number;
	in_endWeight?: number;
	out_startWeight?: number;
	out_endWeight?: number;
}

const getLineContours = (name, skeleton, weight, options: IGetContoursOption) => {
	let { startWeight, endWeight } = options || {}
	if (!startWeight) {
		startWeight = weight
	}
	if (!endWeight) {
		endWeight = weight
	}
	let unticlockwise = false
	let skeletonPos = 'center'
	if (options && options.unticlockwise) {
		unticlockwise = options.unticlockwise
	}
	if (options && options.skeletonPos) {
		skeletonPos = options.skeletonPos
	}
  const start = skeleton[`${name}_start`]
	const end = skeleton[`${name}_end`]
	const angle = Math.atan2(end.y - start.y, end.x - start.x)

	const contours = {}

	// 顺时针方向，右上侧为out, 左下侧为in
	// 逆时针方向，左下侧为out, 右上侧为in

	if (skeletonPos === 'center' && !unticlockwise) {
		contours[`out_${name}_start`] = {
			x: start.x + startWeight / 2 * Math.sin(angle),
			y: start.y - startWeight / 2 * Math.cos(angle),
		}
		contours[`in_${name}_start`] = {
			x: start.x - startWeight / 2 * Math.sin(angle),
			y: start.y + startWeight / 2 * Math.cos(angle),
		}
		contours[`out_${name}_end`] = {
			x: end.x + endWeight / 2 * Math.sin(angle),
			y: end.y - endWeight / 2 * Math.cos(angle),
		}
		contours[`in_${name}_end`] = {
			x: end.x - endWeight / 2 * Math.sin(angle),
			y: end.y + endWeight / 2 * Math.cos(angle),
		}
	}

	else if (skeletonPos === 'center' && unticlockwise) {
		contours[`out_${name}_start`] = {
			x: start.x - startWeight / 2 * Math.sin(angle),
			y: start.y + startWeight / 2 * Math.cos(angle),
		}
		contours[`in_${name}_start`] = {
			x: start.x + startWeight / 2 * Math.sin(angle),
			y: start.y - startWeight / 2 * Math.cos(angle),
		}
		contours[`out_${name}_end`] = {
			x: end.x - endWeight / 2 * Math.sin(angle),
			y: end.y + endWeight / 2 * Math.cos(angle),
		}
		contours[`in_${name}_end`] = {
			x: end.x + endWeight / 2 * Math.sin(angle),
			y: end.y - endWeight / 2 * Math.cos(angle),
		}
	}

	else if (skeletonPos === 'inner' && !unticlockwise) {
		contours[`out_${name}_start`] = {
			x: start.x + startWeight * Math.sin(angle),
			y: start.y - startWeight * Math.cos(angle),
		}
		contours[`in_${name}_start`] = {
			x: start.x,
			y: start.y,
		}
		contours[`out_${name}_end`] = {
			x: end.x + endWeight * Math.sin(angle),
			y: end.y - endWeight * Math.cos(angle),
		}
		contours[`in_${name}_end`] = {
			x: end.x,
			y: end.y,
		}
	}

	return contours
}

const bezierFn = (x: number) : number => {
	const bezier = [
		{ x: 0, y: 0 },
		{ x: 0, y: 0.75 },
		{ x: 0.25, y: 1 },
		{ x: 1, y: 1 },
	]
	return bezierCurve.q(bezier, x).y
}

const bezier1Fn = (x: number) : number => {
	const bezier = [
		{ x: 0, y: 0.3 },
		{ x: 0.15, y: 1.0 },
		{ x: 0.85, y: 1.0 },
		{ x: 1, y: 0.3 },
	]
	return bezierCurve.q(bezier, x).y
}

const getBezierFn = (type: string) => {
  if (type === 'bezier1') {
		return bezier1Fn
	}
	return bezierFn
}

const getCurveContours = (name, skeleton, weight, options: IGetContoursOption) => {
	let { startWeight, endWeight, in_startWeight, in_endWeight, out_startWeight, out_endWeight } = options || {}
	if (!startWeight) {
		if (options && options.weightsVariation) {
			if (options.weightsVariationDir === 'reverse') {
				startWeight = weight
			} else {
				startWeight = 0
			}
		} else {
			startWeight = weight
		}
	}
	if (!endWeight) {
		if (options && options.weightsVariation) {
			if (options.weightsVariationDir === 'reverse') {
				endWeight = 0
			} else {
				endWeight = weight
			}
		} else {
			endWeight = weight
		}
	}
	if (!in_startWeight) {
		in_startWeight = startWeight / 2
	}
	if (!in_endWeight) {
		in_endWeight = endWeight / 2
	}
	if (!out_startWeight) {
		out_startWeight = startWeight / 2
	}
	if (!out_endWeight) {
		out_endWeight = endWeight / 2
	}
	let unticlockwise = false
	let skeletonPos = 'center'
	if (options && options.unticlockwise) {
		unticlockwise = options.unticlockwise
	}
	if (options && options.skeletonPos) {
		skeletonPos = options.skeletonPos
	}
	const bezier = [
		skeleton[`${name}_start`],
		{
			x: skeleton[`${name}_start`].x + 2 / 3 * (skeleton[`${name}_bend`].x - skeleton[`${name}_start`].x),
			y: skeleton[`${name}_start`].y + 2 / 3 * (skeleton[`${name}_bend`].y - skeleton[`${name}_start`].y),
		},
		{
			x: skeleton[`${name}_end`].x + 2 / 3 * (skeleton[`${name}_bend`].x - skeleton[`${name}_end`].x),
			y: skeleton[`${name}_end`].y + 2 / 3 * (skeleton[`${name}_bend`].y - skeleton[`${name}_end`].y),
		},
		skeleton[`${name}_end`],
	]

	// 顺时针方向，右上侧为out, 左下侧为in
	// 逆时针方向，左下侧为out, 右上侧为in
	const out_points = []
	const in_points = []
	const n = 100

	const in_weights = []
	const out_weights = []
	for (let i = 0; i <= n; i++) {
		if (!options) {
			break
		} else if (options.weightsVariation === 'linear') {
			// 字重为线性变化
			if (options.weightsVariationDir === 'reverse') {
				// 字重变化方向为由收尾到起始方向
				const j = n - i
				const f = j / n
				in_weights.push(in_endWeight + (in_startWeight - in_endWeight) * f)
				out_weights.push(out_endWeight + (out_startWeight - out_endWeight) * f)
			} else {
				// 字重变化为由起始到收尾方向
				const f = i / n
				in_weights.push(in_startWeight + (in_endWeight - in_startWeight) * f)
				out_weights.push(out_startWeight + (out_endWeight - out_startWeight) * f)
			}
		} else if (options.weightsVariation === 'pow') {
			// 字重变化为幂变化，options.weightsVariationPower取值范围为[0, 2]
			if (options.weightsVariationDir === 'reverse') {
				// 字重变化方向为由收尾到起始方向
				const j = n - i
				const f = Math.pow(j / n, options.weightsVariationPower)
				in_weights.push(in_endWeight + (in_startWeight - in_endWeight) * f)
				out_weights.push(out_endWeight + (out_startWeight - out_endWeight) * f)
			} else {
				// 字重变化为由起始到收尾方向
				const f = Math.pow(i / n, options.weightsVariationPower)
				in_weights.push(in_startWeight + (in_endWeight - in_startWeight) * f)
				out_weights.push(out_startWeight + (out_endWeight - out_startWeight) * f)
			}
		} else if (options.weightsVariation === 'log') {
			// 字重变化为幂变化，options.weightsVariationPower取值范围为[0, 2]
			if (options.weightsVariationDir === 'reverse') {
				// 字重变化方向为由收尾到起始方向
				const j = n - i
				//const f = Math.pow(j / n, options.weightsVariationPower)
				const f = Math.pow(Math.log(j / n + 1) / Math.log(2), options.weightsVariationPower)
				in_weights.push(in_endWeight + (in_startWeight - in_endWeight) * f)
				out_weights.push(out_endWeight + (out_startWeight - out_endWeight) * f)
			} else {
				// 字重变化为由起始到收尾方向
				//const f = Math.pow(i / n, options.weightsVariationPower)
				const f = Math.pow(Math.log(i / n + 1) / Math.log(2), options.weightsVariationPower)
				in_weights.push(in_startWeight + (in_endWeight - in_startWeight) * f)
				out_weights.push(out_startWeight + (out_endWeight - out_startWeight) * f)
			}
		} else if (options.weightsVariation === 'bezier') {
			const fn = getBezierFn(options.weightsVariationFnType)
			// 字重变化为幂变化，options.weightsVariationPower取值范围为[0, 2]
			if (options.weightsVariationDir === 'reverse') {
				// 字重变化方向为由收尾到起始方向
				const j = n - i
				//const f = Math.pow(j / n, options.weightsVariationPower)
				const f = fn(j / n)
				in_weights.push(in_endWeight + (in_startWeight - in_endWeight) * f)
				out_weights.push(out_endWeight + (out_startWeight - out_endWeight) * f)
			} else {
				// 字重变化为由起始到收尾方向
				//const f = Math.pow(i / n, options.weightsVariationPower)
				const f = fn(i / n)
				in_weights.push(in_startWeight + (in_endWeight - in_startWeight) * f)
				out_weights.push(out_startWeight + (out_endWeight - out_startWeight) * f)
			}
		}
	}

	let lastPoint = bezierCurve.q(bezier, 0)
	let lastK = bezierCurve.qprime(bezier, 0)
	let lastAngle = Math.atan2(lastK.y, lastK.x)

	for (let t = 1; t <= n + 1; t++) {
		let point = lastPoint
		let k = lastK
		let angle = lastAngle
		const _inweight = in_weights.length ? in_weights[t - 1] : in_startWeight
		const _outweight = out_weights.length ? out_weights[t - 1] : out_startWeight
		if (t < (n + 1)) {
			point = bezierCurve.q(bezier, t / n)
			k = bezierCurve.qprime(bezier, t / n)
			angle = Math.atan2(k.y, k.x)
		}
		if (skeletonPos === 'center' && !unticlockwise) {
			out_points.push({
				x: lastPoint.x + _outweight * Math.sin(lastAngle),
				y: lastPoint.y - _outweight * Math.cos(lastAngle),
			})
			in_points.push({
				x: lastPoint.x - _inweight * Math.sin(lastAngle),
				y: lastPoint.y + _inweight * Math.cos(lastAngle),
			})
		}
		else if (skeletonPos === 'inner' && !unticlockwise) {
			out_points.push({
				x: lastPoint.x + (_outweight + _inweight)* Math.sin(lastAngle),
				y: lastPoint.y - (_outweight + _inweight) * Math.cos(lastAngle),
			})
			in_points.push({
				x: lastPoint.x,
				y: lastPoint.y,
			})
		}
		else if (skeletonPos === 'center' && unticlockwise) {
			out_points.push({
				x: lastPoint.x - _outweight * Math.sin(lastAngle),
				y: lastPoint.y + _outweight * Math.cos(lastAngle),
			})
			in_points.push({
				x: lastPoint.x + _inweight * Math.sin(lastAngle),
				y: lastPoint.y - _inweight * Math.cos(lastAngle),
			})
		}
		else if (skeletonPos === 'inner' && unticlockwise) {
			out_points.push({
				x: lastPoint.x - (_outweight + _inweight) * Math.sin(lastAngle),
				y: lastPoint.y + (_outweight + _inweight) * Math.cos(lastAngle),
			})
			in_points.push({
				x: lastPoint.x,
				y: lastPoint.y,
			})
		}
		lastPoint = point
		lastK = k
		lastAngle = angle
	}
	const { curves: out_curves } = fitCurvesByPoints(out_points)
	const { curves: in_curves } = fitCurvesByPoints(in_points)
	const contours = {}
	contours[`out_${name}_points`] = out_points
	contours[`in_${name}_points`] = in_points
	contours[`out_${name}_curves`] = out_curves
	contours[`in_${name}_curves`] = in_curves
	return contours
}

// 多条连续贝塞尔曲线骨架，可以用这个方法获取轮廓
const getCurveContours2 = (name, skeleton, weight, options: IGetContoursOption) => {
	let { startWeight, endWeight, in_startWeight, in_endWeight, out_startWeight, out_endWeight } = options || {}
	if (!startWeight) {
		if (options && options.weightsVariation) {
			if (options.weightsVariationDir === 'reverse') {
				startWeight = weight
			} else {
				startWeight = 0
			}
		} else {
			startWeight = weight
		}
	}
	if (!endWeight) {
		if (options && options.weightsVariation) {
			if (options.weightsVariationDir === 'reverse') {
				endWeight = 0
			} else {
				endWeight = weight
			}
		} else {
			endWeight = weight
		}
	}
	if (!in_startWeight) {
		in_startWeight = startWeight / 2
	}
	if (!in_endWeight) {
		in_endWeight = endWeight / 2
	}
	if (!out_startWeight) {
		out_startWeight = startWeight / 2
	}
	if (!out_endWeight) {
		out_endWeight = endWeight / 2
	}
	let unticlockwise = false
	let skeletonPos = 'center'
	if (options && options.unticlockwise) {
		unticlockwise = options.unticlockwise
	}
	if (options && options.skeletonPos) {
		skeletonPos = options.skeletonPos
	}

	const beziers = []
	for (let i = 0; i < skeleton.length; i++) {
		const { start, control1, control2, end, bend } = skeleton[i]
		if (control1 && control2) {
			// cubic bezier
			beziers.push([start, control1, control2, end])
		} else if (bend) {
			// quadratic bezier
			beziers.push([start, {
				x: start.x + 2 / 3 * (bend.x - start.x),
				y: start.y + 2 / 3 * (bend.y - start.y),
			}, {
				x: end.x + 2 / 3 * (bend.x - end.x),
				y: end.y + 2 / 3 * (bend.y - end.y),
			}, end])
		} else {
			const l = distance(start, end) * 0.3
			beziers.push([start, getPointOnLine(start, end, l), getPointOnLine(end, start, l), end])
		}
	}

	// 顺时针方向，右上侧为out, 左下侧为in
	// 逆时针方向，左下侧为out, 右上侧为in
	const out_points = []
	const in_points = []
	const n = 100

	const in_weights = []
	const out_weights = []
	for (let i = 0; i <= n * beziers.length; i++) {
		if (!options) {
			break
		} else if (options.weightsVariation === 'linear') {
			// 字重为线性变化
			if (options.weightsVariationDir === 'reverse') {
				// 字重变化方向为由收尾到起始方向
				const j = n - i
				const f = j / n
				in_weights.push(in_endWeight + (in_startWeight - in_endWeight) * f)
				out_weights.push(out_endWeight + (out_startWeight - out_endWeight) * f)
			} else {
				// 字重变化为由起始到收尾方向
				const f = i / n
				in_weights.push(in_startWeight + (in_endWeight - in_startWeight) * f)
				out_weights.push(out_startWeight + (out_endWeight - out_startWeight) * f)
			}
		} else if (options.weightsVariation === 'pow') {
			// 字重变化为幂变化，options.weightsVariationPower取值范围为[0, 2]
			if (options.weightsVariationDir === 'reverse') {
				// 字重变化方向为由收尾到起始方向
				const j = n - i
				const f = Math.pow(j / n, options.weightsVariationPower)
				in_weights.push(in_endWeight + (in_startWeight - in_endWeight) * f)
				out_weights.push(out_endWeight + (out_startWeight - out_endWeight) * f)
			} else {
				// 字重变化为由起始到收尾方向
				const f = Math.pow(i / n, options.weightsVariationPower)
				in_weights.push(in_startWeight + (in_endWeight - in_startWeight) * f)
				out_weights.push(out_startWeight + (out_endWeight - out_startWeight) * f)
			}
		} else if (options.weightsVariation === 'log') {
			// 字重变化为幂变化，options.weightsVariationPower取值范围为[0, 2]
			if (options.weightsVariationDir === 'reverse') {
				// 字重变化方向为由收尾到起始方向
				const j = n - i
				//const f = Math.pow(j / n, options.weightsVariationPower)
				const f = Math.pow(Math.log(j / n + 1) / Math.log(2), options.weightsVariationPower)
				in_weights.push(in_endWeight + (in_startWeight - in_endWeight) * f)
				out_weights.push(out_endWeight + (out_startWeight - out_endWeight) * f)
			} else {
				// 字重变化为由起始到收尾方向
				//const f = Math.pow(i / n, options.weightsVariationPower)
				const f = Math.pow(Math.log(i / n + 1) / Math.log(2), options.weightsVariationPower)
				in_weights.push(in_startWeight + (in_endWeight - in_startWeight) * f)
				out_weights.push(out_startWeight + (out_endWeight - out_startWeight) * f)
			}
		} else if (options.weightsVariation === 'bezier') {
			const fn = getBezierFn(options.weightsVariationFnType)
			// 字重变化为幂变化，options.weightsVariationPower取值范围为[0, 2]
			if (options.weightsVariationDir === 'reverse') {
				// 字重变化方向为由收尾到起始方向
				const j = n - i
				//const f = Math.pow(j / n, options.weightsVariationPower)
				const f = fn(j / n)
				in_weights.push(in_endWeight + (in_startWeight - in_endWeight) * f)
				out_weights.push(out_endWeight + (out_startWeight - out_endWeight) * f)
			} else {
				// 字重变化为由起始到收尾方向
				//const f = Math.pow(i / n, options.weightsVariationPower)
				const f = fn(i / n)
				in_weights.push(in_startWeight + (in_endWeight - in_startWeight) * f)
				out_weights.push(out_startWeight + (out_endWeight - out_startWeight) * f)
			}
		}
	}

	let lastPoint = bezierCurve.q(beziers[0], 0)
	let lastK = bezierCurve.qprime(beziers[0], 0)
	if (lastK.x === 0 && lastK.y === 0) {
		lastK = { x: 0, y: 1 }
	}
	let lastAngle = Math.atan2(lastK.y, lastK.x)

	for (let t = 1; t <= n * beziers.length; t++) {
		let point = lastPoint
		let k = lastK
		let angle = lastAngle
		let bezierIndex = Math.floor((t - 1) / n)
		if (bezierIndex >= beziers.length) {
			bezierIndex = beziers.length - 1
		}
		const bezier = beziers[bezierIndex]
		let t_local = t % n
		if (t_local === 0) {
			t_local = n
		}
		const _inweight = in_weights.length ? in_weights[t - 1] : in_startWeight
		const _outweight = out_weights.length ? out_weights[t - 1] : out_startWeight
		if (t_local < (n + 1)) {
			point = bezierCurve.q(bezier, t_local / n)
			k = bezierCurve.qprime(bezier, t_local / n)
			if (k.x === 0 && k.y === 0) {
				k = { x: 0, y: 1 }
			}
			angle = Math.atan2(k.y, k.x)
		}
		if (skeletonPos === 'center' && !unticlockwise) {
			out_points.push({
				x: lastPoint.x + _outweight * Math.sin(lastAngle),
				y: lastPoint.y - _outweight * Math.cos(lastAngle),
			})
			in_points.push({
				x: lastPoint.x - _inweight * Math.sin(lastAngle),
				y: lastPoint.y + _inweight * Math.cos(lastAngle),
			})
			if (t === n * beziers.length) {
				out_points.push({
					x: point.x + _outweight * Math.sin(angle),
					y: point.y - _outweight * Math.cos(angle),
				})
				in_points.push({
					x: point.x - _inweight * Math.sin(angle),
					y: point.y + _inweight * Math.cos(angle),
				})
			}
		}
		else if (skeletonPos === 'inner' && !unticlockwise) {
			out_points.push({
				x: lastPoint.x + (_outweight + _inweight)* Math.sin(lastAngle),
				y: lastPoint.y - (_outweight + _inweight) * Math.cos(lastAngle),
			})
			in_points.push({
				x: lastPoint.x,
				y: lastPoint.y,
			})
			if (t === n * beziers.length) {
				out_points.push({
					x: point.x + (_outweight + _inweight) * Math.sin(angle),
					y: point.y - (_outweight + _inweight) * Math.cos(angle),
				})
				in_points.push({
					x: point.x,
					y: point.y,
				})
			}
		}
		else if (skeletonPos === 'center' && unticlockwise) {
			out_points.push({
				x: lastPoint.x - _outweight * Math.sin(lastAngle),
				y: lastPoint.y + _outweight * Math.cos(lastAngle),
			})
			in_points.push({
				x: lastPoint.x + _inweight * Math.sin(lastAngle),
				y: lastPoint.y - _inweight * Math.cos(lastAngle),
			})
			if (t === n * beziers.length) {
				out_points.push({
					x: point.x - _outweight * Math.sin(angle),
					y: point.y + _outweight * Math.cos(angle),
				})
				in_points.push({
					x: point.x + _inweight * Math.sin(angle),
					y: point.y - _inweight * Math.cos(angle),
				})
			}
		}
		else if (skeletonPos === 'inner' && unticlockwise) {
			out_points.push({
				x: lastPoint.x - (_outweight + _inweight) * Math.sin(lastAngle),
				y: lastPoint.y + (_outweight + _inweight) * Math.cos(lastAngle),
			})
			in_points.push({
				x: lastPoint.x,
				y: lastPoint.y,
			})
			if (t === n * beziers.length) {
				out_points.push({
					x: point.x - (_outweight + _inweight) * Math.sin(angle),
					y: point.y + (_outweight + _inweight) * Math.cos(angle),
				})
				in_points.push({
					x: point.x,
					y: point.y,
				})
			}
		}
		lastPoint = point
		lastK = k
		lastAngle = angle
	}
	const { curves: out_curves } = fitCurvesByPoints(out_points)
	const { curves: in_curves } = fitCurvesByPoints(in_points)
	const contours = {}
	contours[`out_${name}_points`] = out_points
	contours[`in_${name}_points`] = in_points
	contours[`out_${name}_curves`] = out_curves
	contours[`in_${name}_curves`] = in_curves
	return contours
}

const getIntersection = (item1, item2) => {
	let curve1 = null
	let curve2 = null
	let line1 = null
	let line2 = null
	if (item1.type === 'line') {
		line1 = item1
	} else if (item1.type === 'curve') {
		curve1 = item1 
	}
	if (item2.type === 'line') {
		if (line1) {
			line2 = item2
		} else {
			line1 = item2
		}
	} else if (item2.type === 'curve') {
		if (curve1) {
			curve2 = item2
		} else {
			curve1 = item2
		}
	}

	if (curve2) {
    // 遍历第一条曲线的所有线段
    for (let i = 0; i < curve1.points.length - 1; i++) {
			const p1 = curve1.points[i]
			const p2 = curve1.points[i + 1]

			// 遍历第二条曲线的所有线段
			for (let j = 0; j < curve2.points.length - 1; j++) {
				const p3 = curve2.points[j]
				const p4 = curve2.points[j + 1]

				// 计算两条线段的交点
				const intersection = calculateIntersection(p1, p2, p3, p4)
				if (intersection) {
					return {
						corner: intersection,
						corner_index: [i, j],
					}
				}
			}
    }
	} else if (line2) {
		// 两条轮廓都为直线
		return {
			corner: calculateLineIntersection(line1.start, line1.end, line2.start, line2.end),
			corner_index: 0,
		}
	} else if (line1 && curve1) {
		// 一条轮廓为曲线，另一条为直线
		let lastPoint = curve1.points[0]
		for (let i = 1; i < curve1.points.length; i++) {
			const point = curve1.points[i]
			const intersection = calculateIntersection(lastPoint, point, line1.start, line1.end)
			if (intersection) {
				return {
					corner: intersection,
					corner_index: i,
				}
			}
		}
	}

	return {
		corner: null,
		corner_index: 0,
	}
}

const calculateIntersection = (p1, p2, p3, p4) => {
	// 计算分母
	const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
	// 平行或重合
	if (denominator === 0) return p2;

	// 计算参数 ua 和 ub
	const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
	const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

	// 检查参数是否在有效范围内
	if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
		// 计算交点坐标
		return {
			x: p1.x + ua * (p2.x - p1.x),
			y: p1.y + ua * (p2.y - p1.y)
		};
	}

	// 如果没有交点，返回 null
	return null;
}

const calculateLineIntersection = (p1, p2, p3, p4) => {
	// 计算分母
	const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
	// 平行或重合
	if (denominator === 0) return p2;

	// 计算参数 ua 和 ub
	const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
	const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

	// 计算交点坐标
	return {
			x: p1.x + ua * (p2.x - p1.x),
			y: p1.y + ua * (p2.y - p1.y)
	};
}

const fitCurvesByPoints = (points: Array<{ x: number, y: number }>) => {
	const _curves = fitCurve(points, 3.5)
	const curves = []
	for (let i = 0; i < _curves.length; i++) {
		const curve = _curves[i]
		curves.push({
			start: curve[0],
			control1: curve[1],
			control2: curve[2],
			end: curve[3],
		})
	}
	return {
		curves,
	}
}

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}

const getAngle = (A, B, C) => {
  // 计算向量 BA
  const BA = { x: A.x - B.x, y: A.y - B.y }
  // 计算向量 BC
  const BC = { x: C.x - B.x, y: C.y - B.y }
  
  // 使用 atan2 计算每个向量的角度
  const angleBA = Math.atan2(BA.y, BA.x)
  const angleBC = Math.atan2(BC.y, BC.x)
  
  // 计算角度差
  let angle = angleBA - angleBC
  
  // 确保角度在 [0, 2π] 范围内
  if (angle < 0) {
    angle += 2 * Math.PI
  }
  if (angle > Math.PI) {
    angle = 2 * Math.PI - angle
  }
  
  return angle
}

const getRadiusPointsOnCurve = (_points, radius, reverse: boolean = false) => {
	let length = 0
	let points = R.clone(_points)
	if (reverse) {
		// 如果需要从末尾开始计算，反转points
		points.reverse()
	}

	if (!radius) {
		// radius为0
		const { curves: final_curves } = fitCurvesByPoints(points)
		const _curve = [final_curves[0].start, final_curves[0].control1, final_curves[0].control2, final_curves[0].end]
		const _k = bezierCurve.qprime(getBezierCurve(final_curves[0]), 0)
		const _angle = Math.atan2(_k.y, _k.x)
		const _line = {
			start: points[0],
			end: {
				x: points[0].x + Math.cos(_angle) * 100,
				y: points[0].y + Math.sin(_angle) * 100,
			},
		}
		return {
			point: points[0],
			index: 0,
			tangent: _line,
			final_curves: reverse ? reverseCurves(final_curves) : final_curves,
		}
	}
	for (let i = 1; i < points.length; i++) {
		length += distance(points[i], points[i - 1])
		if (length >= radius) {
			const { curves: final_curves } = fitCurvesByPoints(points.slice(i))
			const _curve = [final_curves[0].start, final_curves[0].control1, final_curves[0].control2, final_curves[0].end]
			const _k = bezierCurve.qprime(getBezierCurve(final_curves[0]), 0)
			const _angle = Math.atan2(_k.y, _k.x)
			const _line = {
				start: points[i],
				end: {
					x: points[i].x + Math.cos(_angle) * 100,
					y: points[i].y + Math.sin(_angle) * 100,
				},
			}
			return {
				point: points[i],
				index: i,
				tangent: _line,
				final_curves: reverse ? reverseCurves(final_curves) : final_curves,
			}
		}
	}
	const { curves: final_curves } = fitCurvesByPoints(points)
	const _curve = [final_curves[0].start, final_curves[0].control1, final_curves[0].control2, final_curves[0].end]
	const _k = bezierCurve.qprime(getBezierCurve(final_curves[0]), 0)
	const _angle = Math.atan2(_k.y, _k.x)
	const _line = {
		start: points[points.length - 1],
		end: {
			x: points[points.length - 1].x + Math.cos(_angle) * 100,
			y: points[points.length - 1].y + Math.sin(_angle) * 100,
		},
	}
	return {
		point: points[points.length - 1],
		index: points.length - 1,
		tangent: _line,
		final_curves: reverse ? reverseCurves(final_curves) : final_curves,
	}
}

const reverseCurves = (curves) => {
	const final_curves = []
	for (let i = curves.length - 1; i >= 0; i--) {
		const curve = {
			start: curves[i].end,
			control1: curves[i].control2,
			control2: curves[i].control1,
			end: curves[i].start
		}
		final_curves.push(curve)
	}
	return final_curves
}

const getBezierCurve = (curve) => {
	const _curve = [curve.start, curve.control1, curve.control2, curve.end]
	return _curve
}

const getCurvesPoints = (curves) => {
	const n = 100
	const points = []
	for (let i = 0; i < curves.length; i++) {
		const curve = curves[i]
		const _curve = [curve.start, curve.control1, curve.control2, curve.end]
		for (let j = 0; j <= n; j++) {
			const point = bezierCurve.q(_curve, j / n)
			points.push(point)
		}
	}
	return points
}

const getTurnAngles = (p1, p2, p3) => {
	const angle1 = Math.atan2(p1.y - p2.y, p2.x - p1.x)
	const angle2 = Math.atan2(p3.y - p2.y, p2.x - p3.x)
	const inner_angle = angle2 - angle1
	const mid_angle = angle1 + inner_angle / 2
	return {
		angle1,
		angle2,
		inner_angle,
		mid_angle,
	}
}

const distanceAndFootPoint = (A, B, C) => {
	const { x: x1, y: y1 } = A;
	const { x: x2, y: y2 } = B;
	const { x: x0, y: y0 } = C;

	// 计算线段 AB 的长度
	const dxAB = x2 - x1;
	const dyAB = y2 - y1;
	const ABLength = Math.sqrt(dxAB ** 2 + dyAB ** 2);

	// 辅助变量：交点、newC、比例
	let footPoint, newC, percentageFromA;

	// 处理垂直线（x1 === x2）
	if (x1 === x2) {
		let footY = y0;
		const minY = Math.min(y1, y2);
		const maxY = Math.max(y1, y2);

		// 判断交点是否在线段内
		const isOnSegment = footY >= minY && footY <= maxY;
		if (!isOnSegment) {
				footY = footY < minY ? minY : maxY;
		}

		footPoint = { x: x1, y: footY };
		newC = isOnSegment ? null : { x: x0, y: footY };

		// 计算比例：沿 AB 的 y 方向
		const distanceFromA = Math.abs(footY - y1);
		percentageFromA = ABLength === 0 ? 0 : distanceFromA / Math.abs(y2 - y1);
		percentageFromA = Math.min(1, Math.max(0, percentageFromA)); // 限制在 [0,1]

		return {
			distance: Math.abs(x0 - x1),
			footPoint,
			newC,
			percentageFromA,
		};
	}

	// 处理水平线（y1 === y2）
	if (y1 === y2) {
		let footX = x0;
		const minX = Math.min(x1, x2);
		const maxX = Math.max(x1, x2);

		// 判断交点是否在线段内
		const isOnSegment = footX >= minX && footX <= maxX;
		if (!isOnSegment) {
			footX = footX < minX ? minX : maxX;
		}

		footPoint = { x: footX, y: y1 };
		newC = isOnSegment ? null : { x: footX, y: y0 };

		// 计算比例：沿 AB 的 x 方向
		const distanceFromA = Math.abs(footX - x1);
		percentageFromA = ABLength === 0 ? 0 : distanceFromA / Math.abs(x2 - x1);
		percentageFromA = Math.min(1, Math.max(0, percentageFromA));

		return {
			distance: Math.abs(y0 - y1),
			footPoint,
			newC,
			percentageFromA,
		};
	}

	// 一般情况（非垂直/水平线）
	const m = (y2 - y1) / (x2 - x1);
	const mPerpendicular = -1 / m;

	// 计算交点坐标
	const x = (m * x1 - y1 + y0 - mPerpendicular * x0) / (m - mPerpendicular);
	const y = m * (x - x1) + y1;

	// 判断交点是否在线段 AB 内
	const isOnSegment =
		x >= Math.min(x1, x2) &&
		x <= Math.max(x1, x2) &&
		y >= Math.min(y1, y2) &&
		y <= Math.max(y1, y2);

	if (!isOnSegment) {
		// 限制到端点 A 或 B
		const distToA = Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
		const distToB = Math.sqrt((x - x2) ** 2 + (y - y2) ** 2);
		footPoint = distToA < distToB ? { x: x1, y: y1 } : { x: x2, y: y2 };
	} else {
		footPoint = { x, y };
	}

	// 计算 newC
	newC = isOnSegment
		? null
		: {
				x: x0 + (footPoint.x - x),
				y: y0 + (footPoint.y - y),
			};

	// 计算交点到 A 的沿线段比例
	const dxFoot = footPoint.x - x1;
	const dyFoot = footPoint.y - y1;
	const distanceFromA = Math.sqrt(dxFoot ** 2 + dyFoot ** 2);
	percentageFromA = ABLength === 0 ? 0 : distanceFromA / ABLength;
	percentageFromA = Math.min(1, Math.max(0, percentageFromA)); // 确保在 [0,1]

	return {
		distance: Math.sqrt((x - x0) ** 2 + (y - y0) ** 2),
		footPoint,
		newC,
		percentageFromA,
	};
}

const turnLeft = (start, end, length) => {
	const angle = Math.atan2(start.y - end.y, end.x - start.x)
	const turn_control = {
		x: end.x - length * Math.sin(angle),
		y: end.y - length * Math.cos(angle),
	}
	return turn_control
}

const turnRight = (start, end, length) => {
	const angle = Math.atan2(start.y - end.y, end.x - start.x)
	const turn_control = {
		x: end.x + length * Math.sin(angle),
		y: end.y + length * Math.cos(angle),
	}
	return turn_control
}

const goStraight = (start, end, length) => {
	const angle = Math.atan2(start.y - end.y, end.x - start.x)
	const go_straight = {
		x: end.x + length * Math.cos(angle),
		y: end.y - length * Math.sin(angle),
	}
	return go_straight
}

const turnAngle = (start, end, angle, length) => {
	const angle1 = Math.atan2(start.y - end.y, end.x - start.x)
	// 往左为负，往右为正
	const andle2 = angle1 + angle
	const point = {
		x: start.x + length * Math.cos(angle),
		y: start.y - length * Math.sin(angle),
	}
	return point
}

const turnAngleFromStart = (start, end, angle, length) => {
	const angle1 = Math.atan2(start.y - end.y, end.x - start.x)
	// 逆时针为正，顺时针为负
	const angle2 = angle1 + angle
	const point = {
		x: start.x + length * Math.cos(angle2),
		y: start.y - length * Math.sin(angle2),
	}
	return point
}

const turnAngleFromEnd = (start, end, angle, length) => {
	const angle1 = Math.atan2(start.y - end.y, end.x - start.x)
	// 逆时针为正，顺时针为负
	const angle2 = angle1 + angle
	const point = {
		x: end.x + length * Math.cos(angle2),
		y: end.y - length * Math.sin(angle2),
	}
	return point
}

const degreeToRadius = (degree) => {
	return Math.PI * degree / 180
}

const radiusToDegree = (radius) => {
	return radius * 180 / Math.PI
}

const getPointOnLine = (start, end, length) => {
	const angle = Math.atan2(start.y - end.y, end.x - start.x)
	const point = {
		x: start.x + length * Math.cos(angle),
		y: start.y - length * Math.sin(angle),
	}
	return point
}

const getPointOnLineByPercentage = (start, end, percentage) => {
	const point = {
		x: start.x + percentage * (end.x - start.x),
		y: start.y + percentage * (end.y - start.y),
	}
	return point
}

const isPointOnLineSegment = (point, lineStart, lineEnd) => {
	const { x, y } = point;
	const { x: x1, y: y1 } = lineStart;
	const { x: x2, y: y2 } = lineEnd;
	
	// 计算点到线段两端点的距离
	const distToStart = Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
	const distToEnd = Math.sqrt((x - x2) ** 2 + (y - y2) ** 2);
	const segmentLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
	
	// 如果点到两端点距离之和等于线段长度，说明点在线段上
	return Math.abs(distToStart + distToEnd - segmentLength) < 1e-10;
}

const getSquare = (point, sideLength) => {
	const square = [
		{ x: point.x + sideLength / 2, y: point.y - sideLength / 2 },
		{ x: point.x - sideLength / 2, y: point.y - sideLength / 2 },
		{ x: point.x - sideLength / 2, y: point.y + sideLength / 2 },
		{ x: point.x + sideLength / 2, y: point.y + sideLength / 2 },
	]
	return square
}

const getCircle = (point, radius) => {
	const circle = [
		{
			start: { x: point.x, y: point.y - radius },
			control1: { x: point.x - radius / 2, y: point.y - radius },
			control2: { x: point.x - radius, y: point.y - radius / 2 },
			end: { x: point.x - radius, y: point.y },
		},
		{
			start: { x: point.x - radius, y: point.y },
			control1: { x: point.x - radius, y: point.y + radius / 2 },
			control2: { x: point.x - radius / 2, y: point.y + radius },
			end: { x: point.x, y: point.y + radius },
		},
		{
			start: { x: point.x, y: point.y + radius },
			control1: { x: point.x + radius / 2, y: point.y + radius },
			control2: { x: point.x + radius, y: point.y + radius / 2 },
			end: { x: point.x + radius, y: point.y },
		},
		{
			start: { x: point.x + radius, y: point.y },
			control1: { x: point.x + radius, y: point.y - radius / 2 },
			control2: { x: point.x + radius / 2, y: point.y - radius },
			end: { x: point.x, y: point.y - radius },
		},
	]
	return circle
}

const FP = {
	EllipseComponent,
	PenComponent,
	PolygonComponent,
	RectangleComponent,
	Skeleton,
	Joint,
	Character,
	fitCurve,
	getLineContours,
	getCurveContours,
	getIntersection,
	fitCurvesByPoints,
	getRadiusPointsOnCurve,
	distance,
	getCurvesPoints,
	getTurnAngles,
	distanceAndFootPoint,
	turnLeft,
	turnRight,
	goStraight,
	turnAngle,
	getPointOnLine,
	getPointOnLineByPercentage,
	isPointOnLineSegment,
	turnAngleFromStart,
	turnAngleFromEnd,
	degreeToRadius,
	getAngle,
	radiusToDegree,
	getCurveContours2,
	getSquare,
	getCircle,
}

const suggestion_items = [
	{
		item: 'FP',
		type: 'Variable',
	},
	{
		item: 'EllipseComponent',
		type: 'Class',
	},
	{
		item: 'PenComponent',
		type: 'Class',
	},
	{
		item: 'PolygonComponent',
		type: 'Class',
	},
	{
		item: 'RectangleComponent',
		type: 'Class',
	},
	{
		item: 'Skeleton',
		type: 'Class',
	},
	{
		item: 'Joint',
		type: 'Class',
	},
	{
		item: 'Character',
		type: 'Class',
	},
	{
		item: 'beginPath',
		type: 'method',
	},
	{
		item: 'closePath',
		type: 'method',
	},
	{
		item: 'bezierTo',
		type: 'method',
	},
	{
		item: 'quadraticBezierTo',
		type: 'method',
	},
	{
		item: 'cubicBezierTo',
		type: 'method',
	},
	{
		item: 'lineTo',
		type: 'method',
	},
	{
		item: 'genComponent',
		type: 'method',
	},
	{
		item: 'getJoints',
		type: 'method',
	},
	{
		item: 'getComponent',
		type: 'method',
	},
]

export {
	FP,
	suggestion_items,
}