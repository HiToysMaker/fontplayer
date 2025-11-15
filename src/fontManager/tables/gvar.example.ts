/**
 * gvar表使用示例
 * Example usage of gvar table
 */

import { PathType } from '../character'
import type { ILine, IQuadraticBezierCurve, ICubicBezierCurve } from '../character'
import {
  calculateDeltas,
  applyDeltas,
  createGlyphVariationData,
  type IGvarTable,
  type PointDelta,
} from './gvar'

/**
 * 示例1: 创建简单的粗细变化
 * Example 1: Create simple weight variation
 */
export function createWeightVariationExample() {
  // 定义默认字形（正常粗细）- 一个简单的"I"字形
  // Define default glyph (normal weight) - a simple "I" shape
  const defaultContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = [
    [
      {
        type: PathType.LINE,
        start: { x: 100, y: 0 },
        end: { x: 200, y: 0 },
      },
      {
        type: PathType.LINE,
        start: { x: 200, y: 0 },
        end: { x: 200, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 200, y: 700 },
        end: { x: 100, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 100, y: 700 },
        end: { x: 100, y: 0 },
      },
    ],
  ]

  // 定义粗体变体（wght轴最大值）
  // Define bold variant (wght axis maximum)
  const boldContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = [
    [
      {
        type: PathType.LINE,
        start: { x: 80, y: 0 },    // 向左扩展20
        end: { x: 220, y: 0 },      // 向右扩展20
      },
      {
        type: PathType.LINE,
        start: { x: 220, y: 0 },
        end: { x: 220, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 220, y: 700 },
        end: { x: 80, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 80, y: 700 },
        end: { x: 80, y: 0 },
      },
    ],
  ]

  // 计算deltas
  // Calculate deltas
  const deltas = calculateDeltas(defaultContours, boldContours)
  console.log('Weight variation deltas:', deltas)

  // 创建字形变化数据
  // Create glyph variation data
  const variationData = createGlyphVariationData(defaultContours, [
    {
      peakTuple: [1.0], // wght轴最大值
      contours: boldContours,
    },
  ])

  return { defaultContours, boldContours, deltas, variationData }
}

/**
 * 示例2: 应用插值生成中间状态
 * Example 2: Apply interpolation to generate intermediate states
 */
export function interpolationExample() {
  const { defaultContours, deltas } = createWeightVariationExample()

  // 生成wght=0.5的中间状态（半粗体）
  // Generate intermediate state at wght=0.5 (semi-bold)
  const semiBoldDeltas: PointDelta[] = deltas.map(delta => ({
    xDelta: Math.round(delta.xDelta * 0.5),
    yDelta: Math.round(delta.yDelta * 0.5),
  }))

  const semiBoldContours = applyDeltas(defaultContours, semiBoldDeltas)
  console.log('Semi-bold contours:', semiBoldContours)

  // 生成wght=0.25的状态（轻粗体）
  // Generate state at wght=0.25 (light-bold)
  const lightBoldDeltas: PointDelta[] = deltas.map(delta => ({
    xDelta: Math.round(delta.xDelta * 0.25),
    yDelta: Math.round(delta.yDelta * 0.25),
  }))

  const lightBoldContours = applyDeltas(defaultContours, lightBoldDeltas)
  console.log('Light-bold contours:', lightBoldContours)

  return { semiBoldContours, lightBoldContours }
}

/**
 * 示例3: 多轴变化（粗细+宽度）
 * Example 3: Multi-axis variation (weight + width)
 */
export function multiAxisVariationExample() {
  // 默认字形
  const defaultContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = [
    [
      {
        type: PathType.LINE,
        start: { x: 100, y: 0 },
        end: { x: 200, y: 0 },
      },
      {
        type: PathType.LINE,
        start: { x: 200, y: 0 },
        end: { x: 200, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 200, y: 700 },
        end: { x: 100, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 100, y: 700 },
        end: { x: 100, y: 0 },
      },
    ],
  ]

  // 只有粗细变化（wght=1.0, wdth=0.0）
  const boldContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = [
    [
      {
        type: PathType.LINE,
        start: { x: 80, y: 0 },
        end: { x: 220, y: 0 },
      },
      {
        type: PathType.LINE,
        start: { x: 220, y: 0 },
        end: { x: 220, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 220, y: 700 },
        end: { x: 80, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 80, y: 700 },
        end: { x: 80, y: 0 },
      },
    ],
  ]

  // 只有宽度变化（wght=0.0, wdth=1.0）
  const wideContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = [
    [
      {
        type: PathType.LINE,
        start: { x: 50, y: 0 },  // 更宽
        end: { x: 250, y: 0 },
      },
      {
        type: PathType.LINE,
        start: { x: 250, y: 0 },
        end: { x: 250, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 250, y: 700 },
        end: { x: 50, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 50, y: 700 },
        end: { x: 50, y: 0 },
      },
    ],
  ]

  // 粗细和宽度都变化（wght=1.0, wdth=1.0）
  const boldWideContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = [
    [
      {
        type: PathType.LINE,
        start: { x: 30, y: 0 },  // 又粗又宽
        end: { x: 270, y: 0 },
      },
      {
        type: PathType.LINE,
        start: { x: 270, y: 0 },
        end: { x: 270, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 270, y: 700 },
        end: { x: 30, y: 700 },
      },
      {
        type: PathType.LINE,
        start: { x: 30, y: 700 },
        end: { x: 30, y: 0 },
      },
    ],
  ]

  // 创建多轴变化数据
  const variationData = createGlyphVariationData(defaultContours, [
    {
      peakTuple: [1.0, 0.0], // 只有粗细
      contours: boldContours,
    },
    {
      peakTuple: [0.0, 1.0], // 只有宽度
      contours: wideContours,
    },
    {
      peakTuple: [1.0, 1.0], // 粗细+宽度
      contours: boldWideContours,
    },
  ])

  return { defaultContours, variationData }
}

/**
 * 示例4: 创建完整的gvar表
 * Example 4: Create complete gvar table
 */
export function createCompleteGvarTable(
  glyphContours: Array<{
    default: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
    variants: Array<{
      peakTuple: number[],
      contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>
    }>
  }>,
  axisCount: number
): IGvarTable {
  // 为每个字形创建变化数据
  const glyphVariationData = glyphContours.map(glyph => 
    createGlyphVariationData(glyph.default, glyph.variants)
  )

  // 计算偏移量
  const offsets: number[] = [0]
  let currentOffset = 0
  for (const gvData of glyphVariationData) {
    if (gvData.serializedData) {
      currentOffset += gvData.serializedData.length
    }
    offsets.push(currentOffset)
  }

  const gvarTable: IGvarTable = {
    majorVersion: 1,
    minorVersion: 0,
    axisCount,
    sharedTupleCount: 0,
    glyphCount: glyphContours.length,
    flags: 1, // 使用32位偏移
    offsetToSharedTuples: 0,
    offsetToGlyphVariationData: 0,
    glyphVariationDataArrayOffset: offsets,
    glyphVariationData,
  }

  return gvarTable
}

/**
 * 示例5: 使用曲线的变化
 * Example 5: Variation with curves
 */
export function curveVariationExample() {
  // 默认字形 - 使用三次贝塞尔曲线
  const defaultContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = [
    [
      {
        type: PathType.LINE,
        start: { x: 100, y: 0 },
        end: { x: 100, y: 300 },
      },
      {
        type: PathType.CUBIC_BEZIER,
        start: { x: 100, y: 300 },
        control1: { x: 100, y: 450 },
        control2: { x: 150, y: 500 },
        end: { x: 200, y: 500 },
      },
      {
        type: PathType.LINE,
        start: { x: 200, y: 500 },
        end: { x: 200, y: 0 },
      },
    ],
  ]

  // 粗体变体 - 曲线更圆润
  const boldContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = [
    [
      {
        type: PathType.LINE,
        start: { x: 80, y: 0 },
        end: { x: 80, y: 300 },
      },
      {
        type: PathType.CUBIC_BEZIER,
        start: { x: 80, y: 300 },
        control1: { x: 80, y: 480 },   // 控制点变化
        control2: { x: 140, y: 520 },  // 控制点变化
        end: { x: 220, y: 520 },
      },
      {
        type: PathType.LINE,
        start: { x: 220, y: 520 },
        end: { x: 220, y: 0 },
      },
    ],
  ]

  const deltas = calculateDeltas(defaultContours, boldContours)
  const variationData = createGlyphVariationData(defaultContours, [
    {
      peakTuple: [1.0],
      contours: boldContours,
    },
  ])

  return { defaultContours, boldContours, deltas, variationData }
}

/**
 * 工具函数: 获取指定轴位置的字形
 * Utility: Get glyph at specific axis position
 */
export function getGlyphAtPosition(
  defaultContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
  deltas: PointDelta[],
  position: number // 0.0 到 1.0
): Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> {
  const scaledDeltas = deltas.map(delta => ({
    xDelta: Math.round(delta.xDelta * position),
    yDelta: Math.round(delta.yDelta * position),
  }))
  
  return applyDeltas(defaultContours, scaledDeltas)
}

/**
 * 工具函数: 多轴位置插值
 * Utility: Multi-axis position interpolation
 */
export function getGlyphAtMultiAxisPosition(
  defaultContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
  axisDeltas: PointDelta[][],  // 每个轴的deltas
  positions: number[]           // 每个轴的位置（0.0到1.0）
): Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> {
  // 计算组合deltas
  const combinedDeltas: PointDelta[] = []
  
  if (axisDeltas.length === 0 || axisDeltas[0].length === 0) {
    throw new Error('No deltas provided')
  }
  
  const pointCount = axisDeltas[0].length
  
  for (let i = 0; i < pointCount; i++) {
    let xDelta = 0
    let yDelta = 0
    
    for (let axis = 0; axis < axisDeltas.length; axis++) {
      if (axis < positions.length) {
        xDelta += axisDeltas[axis][i].xDelta * positions[axis]
        yDelta += axisDeltas[axis][i].yDelta * positions[axis]
      }
    }
    
    combinedDeltas.push({
      xDelta: Math.round(xDelta),
      yDelta: Math.round(yDelta),
    })
  }
  
  return applyDeltas(defaultContours, combinedDeltas)
}

