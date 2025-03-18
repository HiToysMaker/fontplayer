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
}

const getLineContours = (name, skeleton, weight, options: IGetContoursOption) => {
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
			x: start.x + weight / 2 * Math.sin(angle),
			y: start.y - weight / 2 * Math.cos(angle),
		}
		contours[`in_${name}_start`] = {
			x: start.x - weight / 2 * Math.sin(angle),
			y: start.y + weight / 2 * Math.cos(angle),
		}
		contours[`out_${name}_end`] = {
			x: end.x + weight / 2 * Math.sin(angle),
			y: end.y - weight / 2 * Math.cos(angle),
		}
		contours[`in_${name}_end`] = {
			x: end.x - weight / 2 * Math.sin(angle),
			y: end.y + weight / 2 * Math.cos(angle),
		}
	}

	else if (skeletonPos === 'center' && unticlockwise) {
		contours[`out_${name}_start`] = {
			x: start.x - weight / 2 * Math.sin(angle),
			y: start.y + weight / 2 * Math.cos(angle),
		}
		contours[`in_${name}_start`] = {
			x: start.x + weight / 2 * Math.sin(angle),
			y: start.y - weight / 2 * Math.cos(angle),
		}
		contours[`out_${name}_end`] = {
			x: end.x - weight / 2 * Math.sin(angle),
			y: end.y + weight / 2 * Math.cos(angle),
		}
		contours[`in_${name}_end`] = {
			x: end.x + weight / 2 * Math.sin(angle),
			y: end.y - weight / 2 * Math.cos(angle),
		}
	}

	else if (skeletonPos === 'inner' && !unticlockwise) {
		contours[`out_${name}_start`] = {
			x: start.x + weight * Math.sin(angle),
			y: start.y - weight * Math.cos(angle),
		}
		contours[`in_${name}_start`] = {
			x: start.x,
			y: start.y,
		}
		contours[`out_${name}_end`] = {
			x: end.x + weight * Math.sin(angle),
			y: end.y - weight * Math.cos(angle),
		}
		contours[`in_${name}_end`] = {
			x: end.x,
			y: end.y,
		}
	}

	return contours
}

const getCurveContours = (name, skeleton, weight, options: IGetContoursOption) => {
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

	const weights = []
	for (let i = 0; i <= n; i++) {
		if (!options) {
			break
		} else if (options.weightsVariation === 'linear') {
			// 字重为线性变化
			if (options.weightsVariationDir === 'reverse') {
				// 字重变化方向为由收尾到起始方向
				const j = n - i
				const f = j / n
				weights.push(weight * f)
			} else {
				// 字重变化为由起始到收尾方向
				const f = i / n
				weights.push(weight * f)
			}
		} else if (options.weightsVariation === 'pow') {
			// 字重变化为幂变化，options.weightsVariationPower取值范围为[0, 2]
			if (options.weightsVariationDir === 'reverse') {
				// 字重变化方向为由收尾到起始方向
				const j = n - i
				const f = Math.pow(j / n, options.weightsVariationPower)
				weights.push(weight * f)
			} else {
				// 字重变化为由起始到收尾方向
				const f = Math.pow(i / n, options.weightsVariationPower)
				weights.push(weight * f)
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
		const _weight = weights.length ? weights[t - 1] : weight
		if (t < (n + 1)) {
			point = bezierCurve.q(bezier, t / n)
			k = bezierCurve.qprime(bezier, t / n)
			angle = Math.atan2(k.y, k.x)
		}
		if (skeletonPos === 'center' && !unticlockwise) {
			out_points.push({
				x: lastPoint.x + _weight / 2 * Math.sin(lastAngle),
				y: lastPoint.y - _weight / 2 * Math.cos(lastAngle),
			})
			in_points.push({
				x: lastPoint.x - _weight / 2 * Math.sin(lastAngle),
				y: lastPoint.y + _weight / 2 * Math.cos(lastAngle),
			})
		}
		else if (skeletonPos === 'inner' && !unticlockwise) {
			out_points.push({
				x: lastPoint.x + _weight * Math.sin(lastAngle),
				y: lastPoint.y - _weight * Math.cos(lastAngle),
			})
			in_points.push({
				x: lastPoint.x,
				y: lastPoint.y,
			})
		}
		else if (skeletonPos === 'center' && unticlockwise) {
			out_points.push({
				x: lastPoint.x - _weight / 2 * Math.sin(lastAngle),
				y: lastPoint.y + _weight / 2 * Math.cos(lastAngle),
			})
			in_points.push({
				x: lastPoint.x + _weight / 2 * Math.sin(lastAngle),
				y: lastPoint.y - _weight / 2 * Math.cos(lastAngle),
			})
		}
		else if (skeletonPos === 'inner' && unticlockwise) {
			out_points.push({
				x: lastPoint.x - _weight * Math.sin(lastAngle),
				y: lastPoint.y + _weight * Math.cos(lastAngle),
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
	const _curves = fitCurve(points, 2)
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