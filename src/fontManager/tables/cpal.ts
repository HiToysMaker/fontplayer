import { encoder } from '../encode'

/**
 * CPAL (Color Palette Table) 表接口
 * 定义彩色字体的调色板
 */
export interface ICPALTable {
  version: number; // 0 或 1
  numPaletteEntries: number; // 每个调色板中的颜色数
  numPalettes: number; // 调色板数量
  numColorRecords: number; // 总颜色记录数
  colorRecords: Array<IColorRecord>; // 颜色记录数组
  colorRecordIndices: Array<number>; // 每个调色板的起始索引
}

/**
 * 颜色记录接口
 */
export interface IColorRecord {
  blue: number;   // 0-255
  green: number;  // 0-255
  red: number;    // 0-255
  alpha: number;  // 0-255
}

/**
 * 解析 rgba 字符串为 ColorRecord
 * @param rgba 格式为 'rgba(r, g, b, a)' 或 'rgb(r, g, b)'
 * @returns ColorRecord
 */
export function parseRgba(rgba: string | undefined): IColorRecord {
  if (!rgba) {
    // 默认黑色
    return { red: 0, green: 0, blue: 0, alpha: 255 }
  }

  // 匹配 rgba(r, g, b, a) 或 rgb(r, g, b)
  const rgbaMatch = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1])
    const g = parseInt(rgbaMatch[2])
    const b = parseInt(rgbaMatch[3])
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0
    
    return {
      red: r,
      green: g,
      blue: b,
      alpha: Math.round(a * 255) // 将 0-1 转换为 0-255
    }
  }

  // 默认黑色
  return { red: 0, green: 0, blue: 0, alpha: 255 }
}

/**
 * 创建 CPAL 表数据
 * @param table CPAL 表对象
 * @returns 字节数组
 */
export function create(table: ICPALTable): number[] {
  let data: number[] = []

  // 版本号 (uint16)
  const versionBytes = encoder.uint16(table.version)
  if (versionBytes) data = data.concat(versionBytes)

  // numPaletteEntries (uint16) - 每个调色板的颜色数
  const numPaletteEntriesBytes = encoder.uint16(table.numPaletteEntries)
  if (numPaletteEntriesBytes) data = data.concat(numPaletteEntriesBytes)

  // numPalettes (uint16) - 调色板数量
  const numPalettesBytes = encoder.uint16(table.numPalettes)
  if (numPalettesBytes) data = data.concat(numPalettesBytes)

  // numColorRecords (uint16) - 总颜色数
  const numColorRecordsBytes = encoder.uint16(table.numColorRecords)
  if (numColorRecordsBytes) data = data.concat(numColorRecordsBytes)

  // offsetFirstColorRecord (Offset32) - 第一个颜色记录的偏移
  // 固定值：版本(2) + numPaletteEntries(2) + numPalettes(2) + numColorRecords(2) + offset(4) = 12
  // 再加上 colorRecordIndices 数组的大小：numPalettes * 2
  const offsetFirstColorRecord = 12 + table.numPalettes * 2
  const offsetBytes = encoder.uint32(offsetFirstColorRecord)
  if (offsetBytes) data = data.concat(offsetBytes)

  // colorRecordIndices[numPalettes] (uint16[])
  // 每个调色板的起始颜色索引
  for (let i = 0; i < table.colorRecordIndices.length; i++) {
    const indexBytes = encoder.uint16(table.colorRecordIndices[i])
    if (indexBytes) data = data.concat(indexBytes)
  }

  // ColorRecord[numColorRecords]
  // 按照 BGRA 顺序存储
  for (let i = 0; i < table.colorRecords.length; i++) {
    const color = table.colorRecords[i]
    const blueBytes = encoder.uint8(color.blue)
    const greenBytes = encoder.uint8(color.green)
    const redBytes = encoder.uint8(color.red)
    const alphaBytes = encoder.uint8(color.alpha)
    
    if (blueBytes) data = data.concat(blueBytes)
    if (greenBytes) data = data.concat(greenBytes)
    if (redBytes) data = data.concat(redBytes)
    if (alphaBytes) data = data.concat(alphaBytes)
  }

  return data
}

/**
 * 构建颜色映射表
 * @param characters 字符数组
 * @returns 颜色映射 Map 和颜色记录数组
 */
export function buildColorMap(characters: Array<any>): {
  colorMap: Map<string, number>
  colorRecords: IColorRecord[]
} {
  const colorMap = new Map<string, number>() // rgba字符串 -> 颜色索引
  const colorRecords: IColorRecord[] = []
  
  // 遍历所有字符的所有图层，收集唯一的颜色
  for (const char of characters) {
    if (!char.layers || char.layers.length === 0) continue
    
    for (const layer of char.layers) {
      const rgbaStr = layer.fillColor || 'rgba(0, 0, 0, 1)' // 默认黑色
      
      if (!colorMap.has(rgbaStr)) {
        const colorRecord = parseRgba(rgbaStr)
        colorMap.set(rgbaStr, colorRecords.length)
        colorRecords.push(colorRecord)
      }
    }
  }
  
  // 如果没有任何颜色，添加默认黑色
  if (colorRecords.length === 0) {
    colorRecords.push({ red: 0, green: 0, blue: 0, alpha: 255 })
  }
  
  return { colorMap, colorRecords }
}

/**
 * 从图层数组创建 CPAL 表
 * @param characters 字符数组，每个字符包含 layers
 * @returns CPAL 表对象
 */
export function createFromLayers(characters: Array<any>): ICPALTable {
  const { colorRecords } = buildColorMap(characters)
  
  // ⚠️ 重要：确保至少有一个颜色记录（Windows PS 可能要求）
  // 如果没有颜色，使用默认黑色
  const finalColorRecords = colorRecords.length > 0 ? colorRecords : [{ red: 0, green: 0, blue: 0, alpha: 255 }]
  
  // ⚠️ 重要：根据 OpenType 规范，numPaletteEntries 应该等于每个调色板的颜色数
  // 对于单个调色板，numPaletteEntries = numColorRecords
  const numPaletteEntries = finalColorRecords.length
  const numColorRecords = finalColorRecords.length
  
  // 验证：确保颜色值在有效范围内
  for (const color of finalColorRecords) {
    if (color.red < 0 || color.red > 255 ||
        color.green < 0 || color.green > 255 ||
        color.blue < 0 || color.blue > 255 ||
        color.alpha < 0 || color.alpha > 255) {
      console.warn(`⚠️ Warning: Color value out of range: rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`)
    }
  }
  
  return {
    version: 0,
    numPaletteEntries,
    numPalettes: 1, // 目前只支持一个调色板
    numColorRecords,
    colorRecords: finalColorRecords,
    colorRecordIndices: [0], // 第一个调色板从索引 0 开始
  }
}

