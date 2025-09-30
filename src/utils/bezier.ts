import { bezierCurve } from '../features/bezierCurve';
import { FP } from '../fontEditor/programming/FPUtils'

// 计算贝塞尔曲线的边界框
const getBezierBoundingBox = (points: Array<IPoint>) => {
  let minX = points[0].x, maxX = points[0].x;
  let minY = points[0].y, maxY = points[0].y;
  
  for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
  }
  
  return { minX, minY, maxX, maxY };
}

// 检查两个边界框是否相交
const boundingBoxesIntersect = (bbox1, bbox2) => {
  return !(bbox1.maxX < bbox2.minX || bbox2.maxX < bbox1.minX || 
           bbox1.maxY < bbox2.minY || bbox2.maxY < bbox1.minY);
}

const testIntersect = (points1, points2) => {
  const bbox1 = getBezierBoundingBox(points1)
  const bbox2 = getBezierBoundingBox(points2)
  if (boundingBoxesIntersect(bbox1, bbox2)) {
    const intersection = FP.getIntersection(
      { type: 'curve', points: getCurvesPoints(points1) },
      { type: 'curve', points: getCurvesPoints(points2) }
    )
    if (intersection.corner) {
      return true
    }
  }
}

const getCurvesPoints = (points) => {
	const n = 100
	const _points = []
	for (let i = 0; i < points.length - 1; i+=3) {
		const _curve = [points[i], points[i + 1], points[i + 2], points[i + 3]]
		for (let j = 0; j <= n; j++) {
			const point = bezierCurve.q(_curve, j / n)
			_points.push(point)
		}
	}
	return _points
}

export {
  getBezierBoundingBox,
  boundingBoxesIntersect,
  testIntersect,
}