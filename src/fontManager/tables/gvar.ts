import type { IFont } from '../font'
import type { ILine, ICubicBezierCurve, IQuadraticBezierCurve, IPoint } from '../character'
import { PathType } from '../character'
import { encoder } from '../encode'
import * as decode from '../decode'

// gvar表格式
// gvar table format
interface IGvarTable {
  majorVersion?: number;
  minorVersion?: number;
  axisCount?: number;
  sharedTupleCount?: number;
  offsetToSharedTuples?: number;
  glyphCount?: number;
  flags?: number;
  offsetToGlyphVariationData?: number;
  glyphVariationDataArrayOffset?: number[];
  sharedTuples?: TupleVariationHeader[];
  glyphVariationData?: GlyphVariationData[];
}

// 元组变化头部
// Tuple Variation Header
interface TupleVariationHeader {
  tupleIndex?: number;
  peakTuple?: number[]; // 每个轴的峰值位置，范围 -1.0 到 1.0 (存储为F2DOT14)
  startTuple?: number[]; // 可选，变化开始的位置
  endTuple?: number[]; // 可选，变化结束的位置
}

// 字形变化数据
// Glyph Variation Data
interface GlyphVariationData {
  tupleVariationHeaders?: TupleVariationHeader[];
  serializedData?: number[]; // 序列化的delta数据
  pointDeltas?: PointDelta[][]; // 每个元组的点变化数组
}

// 点的变化（delta）
// Point Delta
interface PointDelta {
  xDelta: number;
  yDelta: number;
}

// gvar表数据类型
// gvar table data type
const types = {
  majorVersion: 'uint16',
  minorVersion: 'uint16',
  axisCount: 'uint16',
  sharedTupleCount: 'uint16',
  offsetToSharedTuples: 'Offset32',
  glyphCount: 'uint16',
  flags: 'uint16',
  offsetToGlyphVariationData: 'Offset32',
}

/**
 * 将浮点数转换为F2DOT14格式（定点数）
 * @param value 浮点数值，范围 -2.0 到 1.99994
 * @returns F2DOT14格式的整数
 */
/**
 * Convert float to F2DOT14 format (fixed point)
 * @param value float value, range -2.0 to 1.99994
 * @returns F2DOT14 format integer
 */
const floatToF2DOT14 = (value: number): number => {
  return Math.round(value * 16384)
}

/**
 * 将F2DOT14格式转换为浮点数
 * @param value F2DOT14格式的整数
 * @returns 浮点数值
 */
/**
 * Convert F2DOT14 format to float
 * @param value F2DOT14 format integer
 * @returns float value
 */
const f2DOT14ToFloat = (value: number): number => {
  // F2DOT14 是有符号的
  if (value & 0x8000) {
    value = value - 0x10000
  }
  return value / 16384
}

/**
 * 从contours格式提取所有点
 * @param contours 字形轮廓数据
 * @returns 点数组
 */
/**
 * Extract all points from contours format
 * @param contours glyph contours data
 * @returns points array
 */
const extractPointsFromContours = (
  contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>
): IPoint[] => {
  const points: IPoint[] = []
  console.log('contours', contours)
  for (const contour of contours) {
    for (const path of contour) {
      // 添加起点
      points.push({ x: path.start.x, y: path.start.y })
      
      // 根据路径类型添加控制点
      if (path.type === PathType.QUADRATIC_BEZIER) {
        points.push({ x: path.control.x, y: path.control.y })
      } else if (path.type === PathType.CUBIC_BEZIER) {
        points.push({ x: path.control1.x, y: path.control1.y })
        points.push({ x: path.control2.x, y: path.control2.y })
      }
      
      // 添加终点
      points.push({ x: path.end.x, y: path.end.y })
    }
  }
  
  return points
}

/**
 * 计算两个字形之间的点变化（deltas）
 * @param defaultContours 默认字形的轮廓
 * @param variantContours 变体字形的轮廓
 * @returns 点变化数组
 */
/**
 * Calculate point deltas between two glyphs
 * @param defaultContours default glyph contours
 * @param variantContours variant glyph contours
 * @returns point deltas array
 */
const calculateDeltas = (
  defaultContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
  variantContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>
): PointDelta[] => {
  const defaultPoints = extractPointsFromContours(defaultContours)
  const variantPoints = extractPointsFromContours(variantContours)
  
  if (defaultPoints.length !== variantPoints.length) {
    throw new Error('Default and variant glyphs must have the same number of points')
  }
  
  const deltas: PointDelta[] = []
  for (let i = 0; i < defaultPoints.length; i++) {
    deltas.push({
      xDelta: Math.round(variantPoints[i].x - defaultPoints[i].x),
      yDelta: Math.round(variantPoints[i].y - defaultPoints[i].y),
    })
  }
  
  return deltas
}

/**
 * 编码点的delta数据（使用packed delta格式）
 * @param deltas 点变化数组
 * @returns 编码后的字节数组
 */
/**
 * Encode point deltas (using packed delta format)
 * @param deltas point deltas array
 * @returns encoded byte array
 */
const encodeDeltas = (deltas: PointDelta[]): number[] => {
  const data: number[] = []
  
  // 简化版本：假设所有点都有变化
  // 实际实现中应该优化，只编码有变化的点
  
  for (const delta of deltas) {
    // X delta
    if (delta.xDelta >= -128 && delta.xDelta <= 127) {
      // 使用1字节存储
      data.push(delta.xDelta & 0xFF)
    } else {
      // 使用2字节存储
      data.push((delta.xDelta >> 8) & 0xFF)
      data.push(delta.xDelta & 0xFF)
    }
    
    // Y delta
    if (delta.yDelta >= -128 && delta.yDelta <= 127) {
      // 使用1字节存储
      data.push(delta.yDelta & 0xFF)
    } else {
      // 使用2字节存储
      data.push((delta.yDelta >> 8) & 0xFF)
      data.push(delta.yDelta & 0xFF)
    }
  }
  
  return data
}

/**
 * 解码点的delta数据
 * @param data 编码的字节数组
 * @param pointCount 点的数量
 * @returns 点变化数组
 */
/**
 * Decode point deltas
 * @param data encoded byte array
 * @param pointCount number of points
 * @returns point deltas array
 */
const decodeDeltas = (data: number[], pointCount: number): PointDelta[] => {
  const deltas: PointDelta[] = []
  let offset = 0
  
  for (let i = 0; i < pointCount; i++) {
    let xDelta = 0
    let yDelta = 0
    
    // 解码 X delta (简化版本)
    if (offset < data.length) {
      xDelta = data[offset++]
      if (xDelta & 0x80) {
        xDelta = (xDelta << 8) | data[offset++]
        if (xDelta & 0x8000) {
          xDelta -= 0x10000
        }
      } else if (xDelta & 0x80) {
        xDelta -= 0x100
      }
    }
    
    // 解码 Y delta (简化版本)
    if (offset < data.length) {
      yDelta = data[offset++]
      if (yDelta & 0x80) {
        yDelta = (yDelta << 8) | data[offset++]
        if (yDelta & 0x8000) {
          yDelta -= 0x10000
        }
      } else if (yDelta & 0x80) {
        yDelta -= 0x100
      }
    }
    
    deltas.push({ xDelta, yDelta })
  }
  
  return deltas
}

/**
 * 应用deltas到默认字形，生成变体字形
 * @param defaultContours 默认字形的轮廓
 * @param deltas 点变化数组
 * @returns 变体字形的轮廓
 */
/**
 * Apply deltas to default glyph to generate variant glyph
 * @param defaultContours default glyph contours
 * @param deltas point deltas array
 * @returns variant glyph contours
 */
const applyDeltas = (
  defaultContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
  deltas: PointDelta[]
): Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> => {
  const variantContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = []
  let deltaIndex = 0
  
  for (const contour of defaultContours) {
    const variantContour: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve> = []
    
    for (const path of contour) {
      if (path.type === PathType.LINE) {
        const startDelta = deltas[deltaIndex++]
        const endDelta = deltas[deltaIndex++]
        
        variantContour.push({
          type: PathType.LINE,
          start: {
            x: path.start.x + startDelta.xDelta,
            y: path.start.y + startDelta.yDelta,
          },
          end: {
            x: path.end.x + endDelta.xDelta,
            y: path.end.y + endDelta.yDelta,
          },
          fill: path.fill,
        })
      } else if (path.type === PathType.QUADRATIC_BEZIER) {
        const startDelta = deltas[deltaIndex++]
        const controlDelta = deltas[deltaIndex++]
        const endDelta = deltas[deltaIndex++]
        
        variantContour.push({
          type: PathType.QUADRATIC_BEZIER,
          start: {
            x: path.start.x + startDelta.xDelta,
            y: path.start.y + startDelta.yDelta,
          },
          control: {
            x: path.control.x + controlDelta.xDelta,
            y: path.control.y + controlDelta.yDelta,
          },
          end: {
            x: path.end.x + endDelta.xDelta,
            y: path.end.y + endDelta.yDelta,
          },
          fill: path.fill,
        })
      } else if (path.type === PathType.CUBIC_BEZIER) {
        const startDelta = deltas[deltaIndex++]
        const control1Delta = deltas[deltaIndex++]
        const control2Delta = deltas[deltaIndex++]
        const endDelta = deltas[deltaIndex++]
        
        variantContour.push({
          type: PathType.CUBIC_BEZIER,
          start: {
            x: path.start.x + startDelta.xDelta,
            y: path.start.y + startDelta.yDelta,
          },
          control1: {
            x: path.control1.x + control1Delta.xDelta,
            y: path.control1.y + control1Delta.yDelta,
          },
          control2: {
            x: path.control2.x + control2Delta.xDelta,
            y: path.control2.y + control2Delta.yDelta,
          },
          end: {
            x: path.end.x + endDelta.xDelta,
            y: path.end.y + endDelta.yDelta,
          },
          fill: path.fill,
        })
      }
    }
    
    variantContours.push(variantContour)
  }
  
  return variantContours
}

/**
 * 解析gvar表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns IGvarTable对象
 */
/**
 * Parse gvar table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns IGvarTable object
 */
const parse = (data: DataView, offset: number, font: IFont): IGvarTable => {
  const table: IGvarTable = {}
  
  // 启动decoder
  // start decoder
  decode.start(data, offset)
  
  // 解析表头
  // parse table header
  table.majorVersion = decode.decoder.uint16()
  table.minorVersion = decode.decoder.uint16()
  table.axisCount = decode.decoder.uint16()
  table.sharedTupleCount = decode.decoder.uint16()
  table.offsetToSharedTuples = decode.decoder.Offset32()
  table.glyphCount = decode.decoder.uint16()
  table.flags = decode.decoder.uint16()
  table.offsetToGlyphVariationData = decode.decoder.Offset32()
  
  // 解析字形变化数据偏移数组
  // parse glyph variation data offset array
  const offsetSize = (table.flags & 1) ? 4 : 2
  table.glyphVariationDataArrayOffset = []
  for (let i = 0; i <= table.glyphCount; i++) {
    if (offsetSize === 4) {
      table.glyphVariationDataArrayOffset.push(decode.decoder.Offset32())
    } else {
      table.glyphVariationDataArrayOffset.push(decode.decoder.Offset16() * 2)
    }
  }
  
  // 解析共享元组
  // parse shared tuples
  if (table.sharedTupleCount > 0) {
    decode.start(data, offset + table.offsetToSharedTuples)
    table.sharedTuples = []
    for (let i = 0; i < table.sharedTupleCount; i++) {
      const tuple: TupleVariationHeader = {
        peakTuple: [],
      }
      for (let j = 0; j < table.axisCount; j++) {
        const value = decode.decoder.int16()
        tuple.peakTuple.push(f2DOT14ToFloat(value))
      }
      table.sharedTuples.push(tuple)
    }
  }
  
  // 解析字形变化数据（简化版本，实际需要更复杂的解析）
  // parse glyph variation data (simplified version)
  table.glyphVariationData = []
  
  decode.end()
  
  return table
}

/**
 * 根据IGvarTable对象创建该表的原始数据
 * @param table IGvarTable table
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * Generate raw data from IGvarTable table
 * @param table IGvarTable table
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (table: IGvarTable): number[] => {
  // ===== 步骤1: 设置默认值 =====
  const majorVersion = table.majorVersion || 1
  const minorVersion = table.minorVersion || 0
  const axisCount = table.axisCount || 0
  const sharedTupleCount = table.sharedTupleCount || 0
  const glyphCount = table.glyphCount || 0
  const flags = table.flags || 1 // 使用32位偏移
  
  // ===== 步骤2: 构建所有数据段 =====
  
  // 2.1 构建共享元组数据
  const sharedTuplesData: number[] = []
  if (table.sharedTuples && table.sharedTuples.length > 0) {
    for (const tuple of table.sharedTuples) {
      if (tuple.peakTuple) {
        for (const value of tuple.peakTuple) {
          const f2dot14 = floatToF2DOT14(value)
          const bytes = encoder.int16(f2dot14)
          if (bytes) sharedTuplesData.push(...bytes)
        }
      }
    }
  }
  
  // 2.2 构建每个字形的变化数据
  const glyphVariationDataArray: number[][] = []
  if (table.glyphVariationData) {
    for (let i = 0; i < glyphCount; i++) {
      if (i < table.glyphVariationData.length && table.glyphVariationData[i].serializedData) {
        glyphVariationDataArray.push(table.glyphVariationData[i].serializedData!)
      } else {
        glyphVariationDataArray.push([]) // 该字形无变化数据
      }
    }
  } else {
    // 填充空数据
    for (let i = 0; i < glyphCount; i++) {
      glyphVariationDataArray.push([])
    }
  }
  
  // ===== 步骤3: 自动计算所有offset =====
  
  const HEADER_SIZE = 20
  const offsetSize = (flags & 1) ? 4 : 2
  const offsetArraySize = (glyphCount + 1) * offsetSize
  
  // 各个区域的起始offset
  const offsetToSharedTuples = HEADER_SIZE + offsetArraySize
  const offsetToGlyphVariationData = offsetToSharedTuples + sharedTuplesData.length
  
  // 计算每个字形数据的相对offset（相对于glyphVariationData区域起始）
  const glyphDataOffsets: number[] = [0]
  let cumulativeOffset = 0
  for (const gvData of glyphVariationDataArray) {
    cumulativeOffset += gvData.length
    glyphDataOffsets.push(cumulativeOffset)
  }
  
  // ===== 步骤4: 组装最终数据 =====
  
  const data: number[] = []
  
  // 4.1 写入表头（20字节）
  const headerBytes = [
    ...encoder.uint16(majorVersion) || [],
    ...encoder.uint16(minorVersion) || [],
    ...encoder.uint16(axisCount) || [],
    ...encoder.uint16(sharedTupleCount) || [],
    ...encoder.Offset32(offsetToSharedTuples) || [],
    ...encoder.uint16(glyphCount) || [],
    ...encoder.uint16(flags) || [],
    ...encoder.Offset32(offsetToGlyphVariationData) || []
  ]
  data.push(...headerBytes)
  
  // 4.2 写入offset数组
  for (const offset of glyphDataOffsets) {
    if (offsetSize === 4) {
      const bytes = encoder.Offset32(offset)
      if (bytes) data.push(...bytes)
    } else {
      // 16位offset需要除以2（字偏移）
      const bytes = encoder.Offset16(offset / 2)
      if (bytes) data.push(...bytes)
    }
  }
  
  // 4.3 写入共享元组
  data.push(...sharedTuplesData)
  
  // 4.4 写入字形变化数据
  for (const gvData of glyphVariationDataArray) {
    data.push(...gvData)
  }
  
  return data
}

/**
 * 创建字形变化数据
 * @param defaultContours 默认字形轮廓
 * @param variants 变体数组，每个变体包含元组坐标和对应的轮廓
 * @returns 字形变化数据
 */
/**
 * Create glyph variation data
 * @param defaultContours default glyph contours
 * @param variants variants array, each variant contains tuple coordinates and corresponding contours
 * @returns glyph variation data
 */
const createGlyphVariationData = (
  defaultContours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>,
  variants: Array<{
    peakTuple: number[]; // 元组坐标，如 [1.0, 0.0] 表示第一个轴最大值，第二个轴默认值
    contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>;
  }>
): GlyphVariationData => {
  const gvData: GlyphVariationData = {
    tupleVariationHeaders: [],
    pointDeltas: [],
  }
  
  // 为每个变体创建元组变化头部和点deltas
  for (const variant of variants) {
    // 创建元组头部
    gvData.tupleVariationHeaders!.push({
      peakTuple: variant.peakTuple,
    })
    
    // 计算deltas
    const deltas = calculateDeltas(defaultContours, variant.contours)
    gvData.pointDeltas!.push(deltas)
  }
  
  // 序列化数据（简化版本）
  gvData.serializedData = []
  for (const deltas of gvData.pointDeltas!) {
    const encoded = encodeDeltas(deltas)
    gvData.serializedData = gvData.serializedData.concat(encoded)
  }
  
  return gvData
}

const createGvarTable = (_variants, characters) => {
  const table: IGvarTable = {}
  table.majorVersion = 1
  table.minorVersion = 0
  table.axisCount = _variants.axes ? _variants.axes.length : 0
  table.sharedTupleCount = 0
  table.glyphCount = characters.length
  table.glyphVariationData = []
  
  // 检查是否有combinations数据
  if (!_variants.combinations || _variants.combinations.length === 0) {
    // 如果没有combinations，返回空的gvar表
    console.warn('No variation combinations provided, creating empty gvar table')
    return table
  }
  
  // 为每个字符创建variation data
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i]
    const defaultContours = character.contours
    
    // 从combinations中提取该字符的变体轮廓
    const variants = _variants.combinations.map((combination) => {
      // 检查数据完整性
      if (!combination.overlapRemovedContours || 
          !combination.overlapRemovedContours[i] ||
          !combination.overlapRemovedContours[i].contours) {
        console.error(`Missing contours for character ${i} in combination`, combination)
        return null
      }
      
      return {
        peakTuple: combination.tuple,
        contours: combination.overlapRemovedContours[i].contours,
      }
    }).filter(v => v !== null)  // 过滤掉null值
    
    if (variants.length > 0) {
      table.glyphVariationData.push(createGlyphVariationData(
        defaultContours,
        variants,
      ))
    } else {
      // 该字符没有变化数据，添加空数据
      table.glyphVariationData.push({
        tupleVariationHeaders: [],
        pointDeltas: [],
        serializedData: []
      })
    }
  }
  
  return table
}

export {
  parse,
  create,
  calculateDeltas,
  applyDeltas,
  extractPointsFromContours,
  createGlyphVariationData,
  floatToF2DOT14,
  f2DOT14ToFloat,
  encodeDeltas,
  decodeDeltas,
  createGvarTable,
}

export type {
  IGvarTable,
  TupleVariationHeader,
  GlyphVariationData,
  PointDelta,
}

