/**
 * 将三次贝塞尔曲线转换为二次贝塞尔曲线
 * Convert cubic Bezier curves to quadratic Bezier curves
 * 
 * 用于可变字体：CFF使用三次贝塞尔，但glyf/gvar需要二次贝塞尔
 * For variable fonts: CFF uses cubic Bezier, but glyf/gvar needs quadratic Bezier
 */

import { PathType } from '../character'
import type { IPoint, ICubicBezierCurve, IQuadraticBezierCurve, ILine } from '../character'

/**
 * 计算两点之间的距离
 */
function distance(p1: IPoint, p2: IPoint): number {
	const dx = p2.x - p1.x
	const dy = p2.y - p1.y
	return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 在三次贝塞尔曲线上取点
 */
function cubicBezierPoint(t: number, p0: IPoint, p1: IPoint, p2: IPoint, p3: IPoint): IPoint {
	const mt = 1 - t
	const mt2 = mt * mt
	const mt3 = mt2 * mt
	const t2 = t * t
	const t3 = t2 * t
	
	return {
		x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
		y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
	}
}

/**
 * 计算二次贝塞尔曲线与三次贝塞尔曲线之间的最大误差
 */
function calculateError(
	cubic: ICubicBezierCurve,
	quadStart: IPoint,
	quadControl: IPoint,
	quadEnd: IPoint
): number {
	let maxError = 0
	const samples = 10 // 采样点数量
	
	for (let i = 0; i <= samples; i++) {
		const t = i / samples
		
		// 三次贝塞尔曲线上的点
		const cubicPoint = cubicBezierPoint(t, cubic.start, cubic.control1, cubic.control2, cubic.end)
		
		// 二次贝塞尔曲线上的点
		const mt = 1 - t
		const quadPoint: IPoint = {
			x: mt * mt * quadStart.x + 2 * mt * t * quadControl.x + t * t * quadEnd.x,
			y: mt * mt * quadStart.y + 2 * mt * t * quadControl.y + t * t * quadEnd.y,
		}
		
		// 计算误差
		const error = distance(cubicPoint, quadPoint)
		if (error > maxError) {
			maxError = error
		}
	}
	
	return maxError
}

/**
 * 将单个三次贝塞尔曲线转换为一个或多个二次贝塞尔曲线
 * 使用误差容限来决定是否需要分割
 * 
 * @param cubic 三次贝塞尔曲线
 * @param tolerance 允许的最大误差（默认0.5个单位）
 * @returns 二次贝塞尔曲线数组
 */
export function convertCubicToQuadratic(
	cubic: ICubicBezierCurve,
	tolerance: number = 0.5
): IQuadraticBezierCurve[] {
	// 简单近似：使用3/4和1/4点作为控制点
	// 这是一个常用的近似方法
	const control: IPoint = {
		x: (3 * cubic.control1.x + 3 * cubic.control2.x) / 6 + (cubic.start.x + cubic.end.x) / 6,
		y: (3 * cubic.control1.y + 3 * cubic.control2.y) / 6 + (cubic.start.y + cubic.end.y) / 6,
	}
	
	const quadratic: IQuadraticBezierCurve = {
		type: PathType.QUADRATIC_BEZIER,
		start: cubic.start,
		end: cubic.end,
		control: control,
		fill: cubic.fill,
	}
	
	// 计算误差
	const error = calculateError(cubic, cubic.start, control, cubic.end)
	
	// 如果误差小于容限，返回单个二次贝塞尔曲线
	if (error <= tolerance) {
		return [quadratic]
	}
	
	// 如果误差太大，在中点分割三次贝塞尔曲线
	const t = 0.5
	const mt = 1 - t
	
	// De Casteljau算法分割三次贝塞尔曲线
	const p01 = {
		x: mt * cubic.start.x + t * cubic.control1.x,
		y: mt * cubic.start.y + t * cubic.control1.y,
	}
	const p12 = {
		x: mt * cubic.control1.x + t * cubic.control2.x,
		y: mt * cubic.control1.y + t * cubic.control2.y,
	}
	const p23 = {
		x: mt * cubic.control2.x + t * cubic.end.x,
		y: mt * cubic.control2.y + t * cubic.end.y,
	}
	const p012 = {
		x: mt * p01.x + t * p12.x,
		y: mt * p01.y + t * p12.y,
	}
	const p123 = {
		x: mt * p12.x + t * p23.x,
		y: mt * p12.y + t * p23.y,
	}
	const p0123 = {
		x: mt * p012.x + t * p123.x,
		y: mt * p012.y + t * p123.y,
	}
	
	// 创建两个三次贝塞尔曲线
	const cubic1: ICubicBezierCurve = {
		type: PathType.CUBIC_BEZIER,
		start: cubic.start,
		control1: p01,
		control2: p012,
		end: p0123,
		fill: cubic.fill,
	}
	
	const cubic2: ICubicBezierCurve = {
		type: PathType.CUBIC_BEZIER,
		start: p0123,
		control1: p123,
		control2: p23,
		end: cubic.end,
		fill: cubic.fill,
	}
	
	// 递归转换两部分
	return [
		...convertCubicToQuadratic(cubic1, tolerance),
		...convertCubicToQuadratic(cubic2, tolerance),
	]
}

/**
 * 转换整个轮廓（contour）
 * 将所有三次贝塞尔曲线转换为二次贝塞尔曲线
 * 
 * @param contour 原始轮廓（可能包含三次贝塞尔）
 * @param tolerance 允许的最大误差
 * @returns 新轮廓（只包含直线和二次贝塞尔）
 */
export function convertContourToQuadratic(
	contour: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>,
	tolerance: number = 0.5
): Array<ILine | IQuadraticBezierCurve> {
	const result: Array<ILine | IQuadraticBezierCurve> = []
	
	for (const segment of contour) {
		if (segment.type === PathType.CUBIC_BEZIER) {
			// 转换三次贝塞尔为二次贝塞尔
			const quadratics = convertCubicToQuadratic(segment, tolerance)
			result.push(...quadratics)
		} else {
			// 直线和二次贝塞尔直接保留
			result.push(segment as ILine | IQuadraticBezierCurve)
		}
	}
	
	return result
}

/**
 * 转换整个字符的所有轮廓
 * 
 * @param contours 字符的所有轮廓
 * @param tolerance 允许的最大误差
 * @returns 转换后的轮廓
 */
export function convertContoursToQuadratic(
	contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
	tolerance: number = 0.5
): Array<Array<ILine | IQuadraticBezierCurve>> {
	return contours.map(contour => convertContourToQuadratic(contour, tolerance))
}

