/**
 * STAT (Style Attributes Table)
 * 
 * 可变字体的样式属性表，用于定义字体的设计轴和样式
 * macOS 和某些应用（如 Photoshop）可能需要此表来正确识别和显示可变字体
 * 
 * OpenType spec: https://docs.microsoft.com/en-us/typography/opentype/spec/stat
 */

import { encoder } from '../encode'
import type { ITable } from '../font'
import type { IFvarTable } from './fvar'

/**
 * STAT 表版本 1.2（推荐用于可变字体）
 * 
 * 格式：
 * - uint16: majorVersion (1)
 * - uint16: minorVersion (2)
 * - uint16: designAxisSize (8 bytes per axis)
 * - uint16: designAxisCount
 * - Offset32: designAxesOffset
 * - uint16: axisValueCount
 * - Offset32: offsetToAxisValueOffsets
 * - uint16: elidedFallbackNameID
 */

export interface ISTATTable extends ITable {
	majorVersion: number
	minorVersion: number
	designAxisSize: number
	designAxisCount: number
	designAxesOffset: number
	axisValueCount: number
	offsetToAxisValueOffsets: number
	elidedFallbackNameID: number
	
	// Design axes (从 fvar 复制)
	axes: Array<{
		axisTag: string
		axisNameID: number
		axisOrdering: number
	}>
	
	// Axis values
	axisValues: Array<{
		format: number
		axisIndex: number
		flags: number
		valueNameID: number
		value: number
	}>
}

/**
 * 创建 STAT 表
 * 
 * @param fvarTable fvar 表（用于获取轴信息）
 * @param options 可选配置
 * @returns STAT 表对象
 */
export function createStatTable(
	fvarTable: IFvarTable,
	options: {
		elidedFallbackNameID?: number
	} = {}
): ISTATTable {
	const axes: ISTATTable['axes'] = []
	const axisValues: ISTATTable['axisValues'] = []
	
	// 从 fvar 表复制轴信息
	fvarTable.axes.forEach((axis, index) => {
		axes.push({
			axisTag: axis.axisTag,
			axisNameID: axis.axisNameID,
			axisOrdering: index,
		})
		
		// 为每个轴创建一个默认值（指向轴的默认值）
		axisValues.push({
			format: 1, // Format 1: Axis Value without linked value
			axisIndex: index,
			flags: 0,
			valueNameID: axis.axisNameID, // 使用轴名称作为值名称
			value: axis.defaultValue,
		})
	})
	
	return {
		tag: 'STAT',
		majorVersion: 1,
		minorVersion: 2,
		designAxisSize: 8, // 每个轴记录 8 字节
		designAxisCount: axes.length,
		designAxesOffset: 20, // 头部大小（version 1.2）
		axisValueCount: axisValues.length,
		offsetToAxisValueOffsets: 20 + axes.length * 8, // 头部 + 轴数据
		elidedFallbackNameID: options.elidedFallbackNameID || 2, // 默认使用 subfamily name
		
		axes,
		axisValues,
	}
}

/**
 * 序列化 STAT 表
 * 返回 number[] 以保持与其他表一致
 */
export function create(table: ISTATTable, options?: any): number[] {
	const data: number[] = []
	
	// === 表头（Version 1.2: 20 bytes）===
	data.push(...encoder.uint16(table.majorVersion)) // 0
	data.push(...encoder.uint16(table.minorVersion)) // 2
	data.push(...encoder.uint16(table.designAxisSize)) // 4
	data.push(...encoder.uint16(table.designAxisCount)) // 6
	data.push(...encoder.uint32(table.designAxesOffset)) // 8
	data.push(...encoder.uint16(table.axisValueCount)) // 12
	data.push(...encoder.uint32(table.offsetToAxisValueOffsets)) // 14
	data.push(...encoder.uint16(table.elidedFallbackNameID)) // 18
	
	// === Design Axes Array（每个 8 bytes）===
	for (const axis of table.axes) {
		data.push(...encoder.Tag(axis.axisTag)) // 0-3: axisTag
		data.push(...encoder.uint16(axis.axisNameID)) // 4-5: axisNameID
		data.push(...encoder.uint16(axis.axisOrdering)) // 6-7: axisOrdering
	}
	
	// === Axis Value Offsets Array（每个 2 bytes）===
	// 计算每个 axis value 记录的偏移量
	const axisValueTableStart = table.offsetToAxisValueOffsets + table.axisValueCount * 2
	
	for (let i = 0; i < table.axisValueCount; i++) {
		// Format 1 记录: format(2) + axisIndex(2) + flags(2) + valueNameID(2) + value(4) = 12 bytes
		const offset = axisValueTableStart + i * 12
		data.push(...encoder.uint16(offset - table.offsetToAxisValueOffsets))
	}
	
	// === Axis Value Tables（Format 1: 每个 12 bytes）===
	for (const axisValue of table.axisValues) {
		data.push(...encoder.uint16(axisValue.format)) // 0-1: format
		data.push(...encoder.uint16(axisValue.axisIndex)) // 2-3: axisIndex
		data.push(...encoder.uint16(axisValue.flags)) // 4-5: flags
		data.push(...encoder.uint16(axisValue.valueNameID)) // 6-7: valueNameID
		data.push(...encoder.Fixed(axisValue.value)) // 8-11: value (4 bytes)
	}
	
	console.log(`📊 STAT table created:`)
	console.log(`   Version: ${table.majorVersion}.${table.minorVersion}`)
	console.log(`   Design axes: ${table.designAxisCount}`)
	console.log(`   Axis values: ${table.axisValueCount}`)
	console.log(`   Table size: ${data.length} bytes`)
	
	return data
}

export default {
	create,
	createStatTable,
}

