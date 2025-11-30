import { encoder } from '../encode'
import { parseRgba, buildColorMap } from './cpal'

/**
 * COLR (Color Table) 表接口
 * 定义彩色字形的图层信息
 */
export interface ICOLRTable {
  version: number; // 0 或 1
  numBaseGlyphRecords: number; // 基础字形记录数
  baseGlyphRecords: Array<IBaseGlyphRecord>; // 基础字形记录数组
  layerRecords: Array<ILayerRecord>; // 图层记录数组
  numLayerRecords: number; // 图层记录数
}

/**
 * 基础字形记录
 * 记录每个彩色字形的第一个图层索引和图层数量
 */
export interface IBaseGlyphRecord {
  glyphID: number; // 字形 ID
  firstLayerIndex: number; // 第一个图层的索引
  numLayers: number; // 图层数量
}

/**
 * 图层记录
 * 记录每个图层的字形 ID 和调色板索引
 */
export interface ILayerRecord {
  glyphID: number; // 图层字形 ID
  paletteIndex: number; // 调色板中的颜色索引
}

/**
 * 创建 COLR 表数据
 * @param table COLR 表对象
 * @returns 字节数组
 */
export function create(table: ICOLRTable): number[] {
  let data: number[] = []

  // 版本号 (uint16)
  const versionBytes = encoder.uint16(table.version)
  if (versionBytes) data = data.concat(versionBytes)

  // numBaseGlyphRecords (uint16)
  const numBaseGlyphRecordsBytes = encoder.uint16(table.numBaseGlyphRecords)
  if (numBaseGlyphRecordsBytes) data = data.concat(numBaseGlyphRecordsBytes)

  // offsetBaseGlyphRecord (Offset32)
  // 固定偏移：version(2) + numBaseGlyphRecords(2) + offsetBaseGlyphRecord(4) + offsetLayerRecord(4) + numLayerRecords(2) = 14
  const offsetBaseGlyphRecord = 14
  const offsetBaseBytes = encoder.uint32(offsetBaseGlyphRecord)
  if (offsetBaseBytes) data = data.concat(offsetBaseBytes)

  // offsetLayerRecord (Offset32)
  // BaseGlyphRecord 大小：glyphID(2) + firstLayerIndex(2) + numLayers(2) = 6 bytes
  const offsetLayerRecord = offsetBaseGlyphRecord + table.numBaseGlyphRecords * 6
  const offsetLayerBytes = encoder.uint32(offsetLayerRecord)
  if (offsetLayerBytes) data = data.concat(offsetLayerBytes)

  // numLayerRecords (uint16)
  const numLayerRecordsBytes = encoder.uint16(table.numLayerRecords)
  if (numLayerRecordsBytes) data = data.concat(numLayerRecordsBytes)

  // BaseGlyphRecord[numBaseGlyphRecords]
  for (let i = 0; i < table.baseGlyphRecords.length; i++) {
    const record = table.baseGlyphRecords[i]
    const glyphIDBytes = encoder.uint16(record.glyphID)
    const firstLayerIndexBytes = encoder.uint16(record.firstLayerIndex)
    const numLayersBytes = encoder.uint16(record.numLayers)
    if (glyphIDBytes) data = data.concat(glyphIDBytes)
    if (firstLayerIndexBytes) data = data.concat(firstLayerIndexBytes)
    if (numLayersBytes) data = data.concat(numLayersBytes)
  }

  // LayerRecord[numLayerRecords]
  for (let i = 0; i < table.layerRecords.length; i++) {
    const record = table.layerRecords[i]
    const glyphIDBytes = encoder.uint16(record.glyphID)
    const paletteIndexBytes = encoder.uint16(record.paletteIndex)
    if (glyphIDBytes) data = data.concat(glyphIDBytes)
    if (paletteIndexBytes) data = data.concat(paletteIndexBytes)
  }

  return data
}

/**
 * 从字符数组创建 COLR 表
 * @param characters 字符数组，每个字符包含 layers
 * @returns COLR 表对象
 */
export function createFromCharacters(characters: Array<any>): ICOLRTable {
  const baseGlyphRecords: IBaseGlyphRecord[] = []
  const layerRecords: ILayerRecord[] = []
  
  // 创建颜色映射表
  const colorMap = new Map<string, number>()
  let colorIndex = 0
  
  // 第一次遍历：建立颜色映射
  for (const char of characters) {
    if (!char.layers || char.layers.length === 0) continue
    
    for (const layer of char.layers) {
      const rgbaStr = layer.fillColor || 'rgba(0, 0, 0, 1)'
      if (!colorMap.has(rgbaStr)) {
        colorMap.set(rgbaStr, colorIndex++)
      }
    }
  }
  
  // 第二次遍历：创建字形和图层记录
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]
    
    // 如果字符有图层，创建彩色字形记录
    if (char.layers && char.layers.length > 0) {
      const firstLayerIndex = layerRecords.length
      
      // 为每个图层创建记录
      for (const layer of char.layers) {
        const rgbaStr = layer.fillColor || 'rgba(0, 0, 0, 1)'
        const paletteIndex = colorMap.get(rgbaStr) || 0
        
        layerRecords.push({
          glyphID: i, // 使用相同的字形 ID，但会在渲染时应用不同的颜色
          paletteIndex
        })
      }
      
      // 创建基础字形记录
      baseGlyphRecords.push({
        glyphID: i,
        firstLayerIndex,
        numLayers: char.layers.length
      })
    }
  }
  
  // ⚠️ 重要：根据 OpenType 规范，baseGlyphRecords 必须按照 glyphID 排序
  // 这对于二分查找至关重要，Windows PS 可能严格检查这一点
  baseGlyphRecords.sort((a, b) => a.glyphID - b.glyphID)
  
  // 验证：确保所有 baseGlyphRecords 的 glyphID 都在有效范围内
  for (const baseRecord of baseGlyphRecords) {
    if (baseRecord.glyphID < 0 || baseRecord.glyphID >= characters.length) {
      console.warn(`⚠️ Warning: BaseGlyphRecord glyphID ${baseRecord.glyphID} is out of range [0, ${characters.length - 1}]`)
    }
    // 验证 firstLayerIndex 和 numLayers
    if (baseRecord.firstLayerIndex < 0 || baseRecord.firstLayerIndex >= layerRecords.length) {
      console.warn(`⚠️ Warning: BaseGlyphRecord firstLayerIndex ${baseRecord.firstLayerIndex} is out of range [0, ${layerRecords.length - 1}]`)
    }
    if (baseRecord.firstLayerIndex + baseRecord.numLayers > layerRecords.length) {
      console.warn(`⚠️ Warning: BaseGlyphRecord layer range [${baseRecord.firstLayerIndex}, ${baseRecord.firstLayerIndex + baseRecord.numLayers}) exceeds layerRecords length ${layerRecords.length}`)
    }
  }
  
  return {
    version: 0,
    numBaseGlyphRecords: baseGlyphRecords.length,
    baseGlyphRecords,
    layerRecords,
    numLayerRecords: layerRecords.length
  }
}

/**
 * 创建 COLR 表（版本 0）
 * 这个版本将每个图层作为单独的字形
 * 
 * @param characters 字符数组
 * @param totalGlyphs 总字形数（包括原始字形和图层字形）
 * @returns COLR 表对象
 */
export function createFromCharactersV0(
  characters: Array<any>,
  totalGlyphs: number
): ICOLRTable {
  const baseGlyphRecords: IBaseGlyphRecord[] = []
  const layerRecords: ILayerRecord[] = []
  
  // 使用与 CPAL 表相同的颜色映射逻辑
  const { colorMap } = buildColorMap(characters)
  
  // layerGlyphStartIndex: 图层字形从这个索引开始
  // 原始字符占用 0 到 characters.length - 1
  // 图层字形从 characters.length 开始
  let layerGlyphID = characters.length
  
  // 遍历创建字形和图层记录
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]
    
    // 如果字符有图层，创建彩色字形记录
    if (char.layers && char.layers.length > 0) {
      const firstLayerIndex = layerRecords.length
      
      // 为每个图层创建记录
      for (const layer of char.layers) {
        const rgbaStr = layer.fillColor || 'rgba(0, 0, 0, 1)'
        const paletteIndex = colorMap.get(rgbaStr) || 0
        
        layerRecords.push({
          glyphID: layerGlyphID++, // 每个图层使用独立的字形 ID
          paletteIndex
        })
      }
      
      // 创建基础字形记录
      baseGlyphRecords.push({
        glyphID: i,
        firstLayerIndex,
        numLayers: char.layers.length
      })
    }
  }
  
  // ⚠️ 重要：根据 OpenType 规范，baseGlyphRecords 必须按照 glyphID 排序
  // 这对于二分查找至关重要，Windows PS 可能严格检查这一点
  baseGlyphRecords.sort((a, b) => a.glyphID - b.glyphID)
  
  // 验证：确保所有 layerRecords 的 glyphID 都在有效范围内
  // 图层字形应该从 characters.length 开始，到 totalGlyphs - 1 结束
  const minLayerGlyphID = characters.length
  const maxLayerGlyphID = totalGlyphs - 1
  
  console.log(`\n🔍 COLR Table Validation:`)
  console.log(`   Base glyphs: ${characters.length} (IDs: 0-${characters.length - 1})`)
  console.log(`   Layer glyphs: ${layerRecords.length} (IDs: ${minLayerGlyphID}-${maxLayerGlyphID})`)
  console.log(`   BaseGlyphRecords: ${baseGlyphRecords.length}`)
  
  for (let i = 0; i < baseGlyphRecords.length; i++) {
    const baseRecord = baseGlyphRecords[i]
    console.log(`   BaseGlyph[${i}]: glyphID=${baseRecord.glyphID}, firstLayerIndex=${baseRecord.firstLayerIndex}, numLayers=${baseRecord.numLayers}`)
    
    if (baseRecord.glyphID < 0 || baseRecord.glyphID >= characters.length) {
      console.warn(`   ⚠️ Warning: BaseGlyphRecord[${i}] glyphID ${baseRecord.glyphID} is out of range [0, ${characters.length - 1}]`)
    }
    // 验证 firstLayerIndex 和 numLayers
    if (baseRecord.firstLayerIndex < 0 || baseRecord.firstLayerIndex >= layerRecords.length) {
      console.warn(`   ⚠️ Warning: BaseGlyphRecord[${i}] firstLayerIndex ${baseRecord.firstLayerIndex} is out of range [0, ${layerRecords.length - 1}]`)
    }
    if (baseRecord.firstLayerIndex + baseRecord.numLayers > layerRecords.length) {
      console.warn(`   ⚠️ Warning: BaseGlyphRecord[${i}] layer range [${baseRecord.firstLayerIndex}, ${baseRecord.firstLayerIndex + baseRecord.numLayers}) exceeds layerRecords length ${layerRecords.length}`)
    }
    
    // 显示该 base glyph 的所有 layer records
    for (let j = 0; j < baseRecord.numLayers; j++) {
      const layerIdx = baseRecord.firstLayerIndex + j
      if (layerIdx < layerRecords.length) {
        const layerRecord = layerRecords[layerIdx]
        console.log(`     Layer[${j}]: glyphID=${layerRecord.glyphID}, paletteIndex=${layerRecord.paletteIndex}`)
        if (layerRecord.glyphID < minLayerGlyphID || layerRecord.glyphID > maxLayerGlyphID) {
          console.warn(`       ⚠️ Warning: LayerRecord glyphID ${layerRecord.glyphID} is out of range [${minLayerGlyphID}, ${maxLayerGlyphID}]`)
        }
      }
    }
  }
  console.log(`\n`)
  
  return {
    version: 0,
    numBaseGlyphRecords: baseGlyphRecords.length,
    baseGlyphRecords,
    layerRecords,
    numLayerRecords: layerRecords.length
  }
}


