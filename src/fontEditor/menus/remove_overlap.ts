import paper from 'paper'
import type { ILine, IQuadraticBezierCurve, ICubicBezierCurve } from '../../fontManager'
import { PathType } from '../../fontManager'

// 添加精度控制常量
const OVERLAP_REMOVAL_CONFIG = {
  // 路径精度设置
  PATH_PRECISION: 1e-6,
  // 容差值
  TOLERANCE: 1e-8,
  // 最大细分次数
  MAX_SUBDIVISIONS: 10,
  // 曲线细分阈值
  CURVE_SUBDIVISION_THRESHOLD: 0.1,
  // 合并容差
  MERGE_TOLERANCE: 1e-6
}

// 优化后的路径创建函数
const createOptimizedPath = (contour: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>): paper.Path => {
  const path = new paper.Path()
  
  if (contour.length === 0) return path
  
  // 移动到起始点
  const startPoint = new paper.Point(contour[0].start.x, contour[0].start.y)
  path.moveTo(startPoint)
  
  for (let j = 0; j < contour.length; j++) {
    const segment = contour[j]
    
    if (segment.type === PathType.LINE) {
      const lineSegment = segment as unknown as ILine
      const endPoint = new paper.Point(lineSegment.end.x, lineSegment.end.y)
      path.lineTo(endPoint)
    } else if (segment.type === PathType.CUBIC_BEZIER) {
      const cubicSegment = segment as unknown as ICubicBezierCurve
      const control1 = new paper.Point(cubicSegment.control1.x, cubicSegment.control1.y)
      const control2 = new paper.Point(cubicSegment.control2.x, cubicSegment.control2.y)
      const endPoint = new paper.Point(cubicSegment.end.x, cubicSegment.end.y)
      path.cubicCurveTo(control1, control2, endPoint)
    } else if (segment.type === PathType.QUADRATIC_BEZIER) {
      const quadSegment = segment as unknown as IQuadraticBezierCurve
      const control = new paper.Point(quadSegment.control.x, quadSegment.control.y)
      const endPoint = new paper.Point(quadSegment.end.x, quadSegment.end.y)
      
      // 将二次贝塞尔转换为三次贝塞尔
      const cubicControl1 = startPoint.multiply(1/3).add(control.multiply(2/3))
      const cubicControl2 = endPoint.multiply(1/3).add(control.multiply(2/3))
      path.cubicCurveTo(cubicControl1, cubicControl2, endPoint)
    }
    
    // 更新起始点
    startPoint.x = segment.end.x
    startPoint.y = segment.end.y
  }

  path.closePath()
  
  return path
}

// 检查贝塞尔曲线控制点是否有效
const isValidBezierControlPoint = (
  start: paper.Point, 
  control1: paper.Point, 
  control2: paper.Point, 
  end: paper.Point
): boolean => {
  // 检查控制点是否在合理范围内
  const minDistance = OVERLAP_REMOVAL_CONFIG.TOLERANCE
  const maxDistance = start.getDistance(end) * 10 // 控制点不应超过起点终点距离的10倍
  
  const d1 = start.getDistance(control1)
  const d2 = control1.getDistance(control2)
  const d3 = control2.getDistance(end)
  
  return d1 > minDistance && d1 < maxDistance && 
         d2 > minDistance && d2 < maxDistance && 
         d3 > minDistance && d3 < maxDistance
}

// 优化路径合并函数
const mergePathsWithPrecision = (paths: paper.Path[]): paper.Path | null => {
  if (paths.length === 0) return null
  if (paths.length === 1) return paths[0]
  
  // 设置paper.js的全局精度
  paper.settings.precision = OVERLAP_REMOVAL_CONFIG.PATH_PRECISION
  
  let unitedPath = paths[0].clone()
  
  for (let i = 1; i < paths.length; i++) {
    const currentPath = paths[i]
    unitedPath = unitedPath.unite(currentPath) as paper.Path
  }
  
  return unitedPath
}

// 检测字符是否已经不需要去除重叠
const isAlreadyOptimized = (contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>): boolean => {
  if (contours.length <= 1) {
    return true // 单个轮廓不需要去除重叠
  }
  
  // 简化检测逻辑：只检查是否有明显的镂空结构
  // 对于走之旁这种有重叠的字符，不应该被误判为已经优化过
  
  // 检查轮廓之间是否有重叠
  let hasOverlap = false
  for (let i = 0; i < contours.length; i++) {
    for (let j = i + 1; j < contours.length; j++) {
      const contour1 = contours[i]
      const contour2 = contours[j]
      
      // 计算两个轮廓的包围盒
      let minX1 = Infinity, minY1 = Infinity, maxX1 = -Infinity, maxY1 = -Infinity
      let minX2 = Infinity, minY2 = Infinity, maxX2 = -Infinity, maxY2 = -Infinity
      
      for (let k = 0; k < contour1.length; k++) {
        const segment = contour1[k]
        minX1 = Math.min(minX1, segment.start.x, segment.end.x)
        minY1 = Math.min(minY1, segment.start.y, segment.end.y)
        maxX1 = Math.max(maxX1, segment.start.x, segment.end.x)
        maxY1 = Math.max(maxY1, segment.start.y, segment.end.y)
      }
      
      for (let k = 0; k < contour2.length; k++) {
        const segment = contour2[k]
        minX2 = Math.min(minX2, segment.start.x, segment.end.x)
        minY2 = Math.min(minY2, segment.start.y, segment.end.y)
        maxX2 = Math.max(maxX2, segment.start.x, segment.end.x)
        maxY2 = Math.max(maxY2, segment.start.y, segment.end.y)
      }
      
      // 检查包围盒是否重叠
      if (maxX1 >= minX2 && maxX2 >= minX1 && maxY1 >= minY2 && maxY2 >= minY1) {
        hasOverlap = true
        break
      }
    }
    if (hasOverlap) break
  }
  
  // 如果有重叠，说明需要去除重叠，不应该跳过
  // 只有在没有重叠的情况下才认为已经优化过
  return !hasOverlap
}

export {
  mergePathsWithPrecision,
  createOptimizedPath,
  isValidBezierControlPoint,
  OVERLAP_REMOVAL_CONFIG,
  isAlreadyOptimized,
}