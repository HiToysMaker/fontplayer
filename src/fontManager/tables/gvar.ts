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
  
  for (const contour of contours) {
    for (let i = 0; i < contour.length; i++) {
      const path = contour[i]
      
      // 只在第一个路径添加起点，后续路径的起点和前一个路径的终点是同一个点
      if (i === 0) {
        points.push({ x: path.start.x, y: path.start.y })
      }
      
      // 根据路径类型添加控制点
      if (path.type === PathType.QUADRATIC_BEZIER) {
        points.push({ x: path.control.x, y: path.control.y })
      } else if (path.type === PathType.CUBIC_BEZIER) {
        // ⚠️ 警告：gvar表应该使用二次贝塞尔曲线
        console.error('❌ ERROR: Cubic Bezier curve found in gvar table!')
        points.push({ x: path.control1.x, y: path.control1.y })
        points.push({ x: path.control2.x, y: path.control2.y })
      }
      
      // 添加终点（除了最后一个路径，因为轮廓是闭合的，最后一个终点 = 第一个起点）
      if (i < contour.length - 1) {
        points.push({ x: path.end.x, y: path.end.y })
      }
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
    console.error(`❌ Point count mismatch: default=${defaultPoints.length}, variant=${variantPoints.length}`)
    console.error(`   → This glyph's script generates different path counts at different parameter values`)
    console.error(`   → Skipping variation data for this glyph (it will not vary in the font)`)
    
    // 返回全零 deltas（字形不会变化）
    return new Array(defaultPoints.length).fill({ xDelta: 0, yDelta: 0 })
  }
  
  // 如果点数太多，打印警告
  if (defaultPoints.length > 500) {
    console.warn(`⚠️ Large glyph detected: ${defaultPoints.length} points. This may be slow.`)
  }
  
  const deltas: PointDelta[] = []
  let nonZeroCount = 0
  
  for (let i = 0; i < defaultPoints.length; i++) {
    const xDelta = Math.round(variantPoints[i].x - defaultPoints[i].x)
    const yDelta = Math.round(variantPoints[i].y - defaultPoints[i].y)
    
    if (xDelta !== 0 || yDelta !== 0) {
      nonZeroCount++
    }
    
    deltas.push({ xDelta, yDelta })
  }
  
  // 调试：报告非零 delta 数量（只在第一个字形或有问题时打印）
  if (nonZeroCount === 0 && defaultPoints.length > 0) {
    console.warn(`⚠️ All deltas are zero! (${defaultPoints.length} points checked)`)
    console.warn(`  First default point: (${defaultPoints[0]?.x.toFixed(2)}, ${defaultPoints[0]?.y.toFixed(2)})`)
    console.warn(`  First variant point: (${variantPoints[0]?.x.toFixed(2)}, ${variantPoints[0]?.y.toFixed(2)})`)
  }
  
  return deltas
}

/**
 * Encode packed deltas (OpenType format with control bytes)
 * @param deltas array of delta values (X or Y)
 * @returns encoded byte array
 */
const encodePackedDeltas = (deltas: number[]): number[] => {
  const data: number[] = []
  
  // OpenType run-based encoding (fontTools format)
  // Run header: bit 7-6 = type, bit 5-0 = count-1
  //   00xxxxxx = int8 (bytes)
  //   01xxxxxx = int16 (words)
  //   10xxxxxx = zeros
  //   11xxxxxx = int32 (longs, rarely used)
  
  const DELTAS_ARE_ZERO = 0x80   // 10xxxxxx
  const DELTAS_ARE_WORDS = 0x40  // 01xxxxxx  (int16)
  const DELTAS_ARE_BYTES = 0x00  // 00xxxxxx  (int8, default)
  
  let i = 0
  while (i < deltas.length) {
    const startDelta = deltas[i]
    
    // 判断这个 delta 的类型
    let deltaFlag: number
    if (startDelta === 0) {
      deltaFlag = DELTAS_ARE_ZERO
    } else if (startDelta >= -128 && startDelta <= 127) {
      deltaFlag = DELTAS_ARE_BYTES
    } else {
      deltaFlag = DELTAS_ARE_WORDS
    }
    
    // 找出连续的相同类型的 deltas
    let runLength = 1
    while (i + runLength < deltas.length && runLength < 64) {
      const nextDelta = deltas[i + runLength]
      let nextFlag: number
      
      if (nextDelta === 0) {
        nextFlag = DELTAS_ARE_ZERO
      } else if (nextDelta >= -128 && nextDelta <= 127) {
        nextFlag = DELTAS_ARE_BYTES
      } else {
        nextFlag = DELTAS_ARE_WORDS
      }
      
      if (nextFlag !== deltaFlag) break
      runLength++
    }
    
    // 写入 run header
    const runHeader = deltaFlag | (runLength - 1)
    data.push(runHeader)
    
    // 写入 deltas
    if (deltaFlag !== DELTAS_ARE_ZERO) {
      for (let j = 0; j < runLength; j++) {
        const delta = deltas[i + j]
        if (deltaFlag === DELTAS_ARE_BYTES) {
          // int8
          data.push(delta >= 0 ? delta : 256 + delta)
        } else {
          // int16
          const bytes = encoder.int16(delta)
          if (bytes) data.push(...bytes)
        }
      }
    }
    
    i += runLength
  }
  
  return data
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
  if (deltas.length === 0) return []
  
  // TrueType 字形有 4 个 phantom points（用于 metrics）
  // 需要为它们添加 zero deltas
  const xDeltas = deltas.map(d => Math.round(d.xDelta))
  const yDeltas = deltas.map(d => Math.round(d.yDelta))
  
  // 添加 4 个 phantom points 的 zero deltas
  xDeltas.push(0, 0, 0, 0)
  yDeltas.push(0, 0, 0, 0)
  
  // 使用 OpenType run-based packed deltas 格式
  // 不设置 PRIVATE_POINT_NUMBERS flag，不编码 point numbers
  // FontTools 会使用 sharedPoints=[] 并推断所有点都有 delta
  const data: number[] = []
  
  const xDeltasEncoded = encodePackedDeltas(xDeltas)
  data.push(...xDeltasEncoded)
  
  const yDeltasEncoded = encodePackedDeltas(yDeltas)
  data.push(...yDeltasEncoded)
  
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
  // 空字形直接返回空数据
  if (!defaultContours || defaultContours.length === 0) {
    return {
      tupleVariationHeaders: [],
      pointDeltas: [],
      serializedData: []
    }
  }
  
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
  
  // ===== 完整的 TupleVariationStore 序列化 =====
  // 参考: https://docs.microsoft.com/en-us/typography/opentype/spec/gvar#tuplevariationstore
  
  if (!gvData.tupleVariationHeaders || gvData.tupleVariationHeaders.length === 0) {
    gvData.serializedData = []
    return gvData
  }
  
  const tupleCount = gvData.tupleVariationHeaders.length
  const axisCount = gvData.tupleVariationHeaders[0].peakTuple?.length || 0
  
  // 1. 计算每个 tuple 的序列化数据
  const tuplesSerializedData: number[][] = []
  for (let i = 0; i < gvData.pointDeltas!.length; i++) {
    const deltas = gvData.pointDeltas![i]
    const encoded = encodeDeltas(deltas)
    tuplesSerializedData.push(encoded)
  }
  
  // 2. 计算头部大小
  // TupleVariationStore header: 4 bytes
  // Each TupleVariationHeader: 4 + axisCount * 2 bytes (embedded peak tuple)
  const headerSize = 4 + tupleCount * (4 + axisCount * 2)
  
  // 3. 构建序列化数据
  const data: number[] = []
  
  // 3.1 TupleVariationStore header
  // tupleVariationCount (uint16): 高4位是flag，低12位是count
  // 0x8000 = TUPLES_SHARE_POINT_NUMBERS (所有 tuples 共享 point numbers)
  const TUPLES_SHARE_POINT_NUMBERS = 0x8000
  const tupleVariationCount = (tupleCount & 0x0FFF) | TUPLES_SHARE_POINT_NUMBERS
  const tupleCountBytes = encoder.uint16(tupleVariationCount)
  if (tupleCountBytes) data.push(...tupleCountBytes)
  
  // dataOffset (uint16): SerializedData（包括 sharedPointNumbers）相对于 TupleVariationStore 起始位置的偏移
  // = 4 (header) + tupleCount * (4 + axisCount * 2) (TupleVariationHeaders)
  // dataOffset 指向 sharedPointNumbers，fonttools 会先读取它，然后读取 deltas
  const dataOffset = headerSize
  const dataOffsetBytes = encoder.uint16(dataOffset)
  if (dataOffsetBytes) data.push(...dataOffsetBytes)
  
  // 3.2 TupleVariationHeader (每个变体)
  let currentOffset = 0
  for (let i = 0; i < tupleCount; i++) {
    const header = gvData.tupleVariationHeaders[i]
    const tupleData = tuplesSerializedData[i]
    
    // variationDataSize (uint16): 此 tuple 的序列化数据大小
    const sizeBytes = encoder.uint16(tupleData.length)
    if (sizeBytes) data.push(...sizeBytes)
    
    // tupleIndex (uint16): 高4位是flag，低12位是索引
    // 0x8000 = EMBEDDED_PEAK_TUPLE (peak tuple 嵌入在此处)
    // 不设置 PRIVATE_POINT_NUMBERS，fonttools 会使用 sharedPoints=[] 并应用到所有点
    const tupleIndex = 0x8000  // 只有 EMBEDDED_PEAK_TUPLE
    const tupleIndexBytes = encoder.uint16(tupleIndex)
    if (tupleIndexBytes) data.push(...tupleIndexBytes)
    
    // peakTuple (F2DOT14[axisCount]): 嵌入的 peak tuple
    if (header.peakTuple) {
      for (const value of header.peakTuple) {
        const f2dot14 = floatToF2DOT14(value)
        const bytes = encoder.int16(f2dot14)
        if (bytes) data.push(...bytes)
      }
    }
    
    currentOffset += tupleData.length
  }
  
  // 3.3 Shared Point Numbers
  // count = 0 表示所有点都有 delta（范围 0 到 pointCount-1）
  data.push(0)
  
  // 3.4 SerializedData (每个 tuple 的 delta 数据)
  for (const tupleData of tuplesSerializedData) {
    data.push(...tupleData)
  }
  
  gvData.serializedData = data
  
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
  
  // 调试：检查接收到的数据
  console.log('🔍 createGvarTable received:')
  console.log(`  _variants: ${!!_variants}`)
  console.log(`  _variants.combinations: ${!!_variants?.combinations}`)
  console.log(`  _variants.combinations.length: ${_variants?.combinations?.length || 0}`)
  
  // 检查是否有combinations数据
  if (!_variants.combinations || _variants.combinations.length === 0) {
    // 如果没有combinations，返回空的gvar表
    console.warn('⚠️ No variation combinations provided, creating empty gvar table')
    return table
  }
  
  // 为每个字符创建variation data
  console.log(`📝 Processing ${characters.length} glyphs for gvar table...`)
  for (let i = 0; i < characters.length; i++) {
    if (i % 5 === 0) {
      console.log(`  Processing glyph ${i}/${characters.length}...`)
    }
    
    const character = characters[i]
    const defaultContours = character.contours
    
    // 空字形（没有轮廓或所有轮廓都是空的）跳过 variation data
    // 检查是否为空：无轮廓、零个轮廓、或所有轮廓都没有点
    const isEmpty = !defaultContours || 
                    defaultContours.length === 0 || 
                    defaultContours.every(contour => !contour || contour.length === 0)
    
    if (isEmpty) {
      console.log(`  ⏭️  Glyph ${i} (${characters[i]?.name || 'unnamed'}): Empty glyph, skipping variation data`)
      table.glyphVariationData.push({
        tupleVariationHeaders: [],
        pointDeltas: [],
        serializedData: []
      })
      continue
    }
    
    // 调试：检查默认轮廓
    if (i === 2) {
      console.log(`  📍 Glyph ${i}: defaultContours has ${defaultContours?.length || 0} contours`)
      if (defaultContours && defaultContours.length > 0) {
        const totalPaths = defaultContours.reduce((sum, contour) => sum + contour.length, 0)
        console.log(`     Total paths: ${totalPaths}`)
      }
    }
    
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
  console.log(`✅ Processed all ${characters.length} glyphs`)
  
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

