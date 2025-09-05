import * as R from "ramda"
import { FP } from "../fontEditor/programming/FPUtils"
import { ICustomGlyph } from "../fontEditor/stores/glyph"
import { bezierCurve } from "./bezierCurve"

const calculateGlyphWeight = (glyph: ICustomGlyph) => {
  const { pointsBonesMap, originalPoints, bones } = glyph.skeleton.skeletonBindData
  const points = (glyph.components[0].value as unknown as IPenComponent).points
  const discrete_points = getDiscretePoints(points)
  const weights = []
  for (let i = 0; i < bones.length; i++) {
    const { avgWeight, boneLength } = calculateWeightAtBone(discrete_points, bones[i])
    weights.push({ avgWeight, boneLength })
  }
  const totalLength = weights.reduce((acc, curr) => acc + curr.boneLength, 0)
  let weight = 0
  for (let i = 0; i < weights.length; i++) {
    const { avgWeight, boneLength } = weights[i]
    weight += avgWeight * boneLength / totalLength
  }
  return weight
}

const updateGlyphWeight = (glyph: ICustomGlyph) => {
  const weight = glyph.parameters.get('字重') as number
  const originWeight = glyph.skeleton.originWeight
  const d = (weight - originWeight) / 2
  const points = glyph.skeleton.skeletonBindData.originalPoints//(glyph.components[0].value as unknown as IPenComponent).points
  const newPoints = R.clone((glyph.components[0].value as unknown as IPenComponent).points)
  for (let i = 0; i < points.length - 1; i+=3) {
    const bezier = [points[i], points[i+1], points[i+2], points[i+3]]
    const angle1 = Math.atan2(bezier[1].y - bezier[0].y, bezier[1].x - bezier[0].x)
    const angle2 = Math.atan2(bezier[3].y - bezier[2].y, bezier[3].x - bezier[2].x)
    const p1 = { x: bezier[0].x - Math.sin(angle1) * d, y: bezier[0].y + Math.cos(angle1) * d }
    const p2 = { x: bezier[1].x - Math.sin(angle1) * d, y: bezier[1].y + Math.cos(angle1) * d }
    const p3 = { x: bezier[2].x - Math.sin(angle2) * d, y: bezier[2].y + Math.cos(angle2) * d }
    const p4 = { x: bezier[3].x - Math.sin(angle2) * d, y: bezier[3].y + Math.cos(angle2) * d }
    newPoints[i].x = p1.x
    newPoints[i].y = p1.y
    newPoints[i+1].x = p2.x
    newPoints[i+1].y = p2.y
    newPoints[i+2].x = p3.x
    newPoints[i+2].y = p3.y
    newPoints[i+3].x = p4.x
    newPoints[i+3].y = p4.y
  };
  (glyph.components[0].value as unknown as IPenComponent).points = newPoints
  return glyph
}

const getDiscretePoints = (points) => {
  const discrete_points = []
  const n = 100
  if (points.length < 4) return points
  for (let i = 0; i < points.length - 1; i+=3) {
    const bezier = [points[i], points[i+1], points[i+2], points[i+3]]
    for (let j = 0; j < n; j++) {
      const t = j / n
      const discrete_point = bezierCurve.q(bezier, t)
      discrete_points.push(discrete_point)
    }
  }
  return discrete_points
}

const calculateWeightAtBone = (discrete_points, bone) => {
  // 计算骨骼法向量
  const angle = Math.atan2(bone.end.y - bone.start.y, bone.end.x - bone.start.x)
  const d = 100
  const p1 = { x: bone.start.x + Math.sin(angle) * d, y: bone.start.y - Math.cos(angle) * d }
  const p2 = { x: bone.end.x + Math.sin(angle) * d, y: bone.end.y - Math.cos(angle) * d }
  const p3 = { x: bone.start.x - Math.sin(angle) * d, y: bone.end.y + Math.cos(angle) * d }
  const p4 = { x: bone.end.x - Math.sin(angle) * d, y: bone.end.y + Math.cos(angle) * d }

  const { corner: up_point_start, corner_index: up_point_start_index } = FP.getIntersection(
    { type: 'line', start: bone.start, end: p1 },
    { type: 'curve', points: discrete_points }
  )
  const { corner: up_point_end, corner_index: up_point_end_index } = FP.getIntersection(
    { type: 'line', start: bone.end, end: p3 },
    { type: 'curve', points: discrete_points }
  )
  const { corner: down_point_start, corner_index: down_point_start_index } = FP.getIntersection(
    { type: 'line', start: bone.start, end: p2 },
    { type: 'curve', points: discrete_points }
  )
  const { corner: down_point_end, corner_index: down_point_start_end } = FP.getIntersection(
    { type: 'line', start: bone.end, end: p4 },
    { type: 'curve', points: discrete_points }
  )

  return {
    avgWeight: (distance(up_point_start, up_point_end) + distance(down_point_start, down_point_end)) / 2,
    boneLength: distance(bone.start, bone.end),
  }
}

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
}

export {
  calculateGlyphWeight,
  updateGlyphWeight,
}