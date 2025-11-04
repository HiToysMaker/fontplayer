/**
 * OpenType glyf表序列化器
 * 完整实现OpenType规范的glyf表序列化
 * 
 * 参考：https://learn.microsoft.com/en-us/typography/opentype/spec/glyf
 */

import { encoder } from '../encode'

interface IPoint {
	x?: number
	y?: number
	onCurve?: boolean
}

interface IContour {
	points: Array<IPoint>
	xCoordinates: Array<number>
	yCoordinates: Array<number>
	paths: Array<any>
}

interface IGlyphTable {
	numberOfContours: number
	xMin: number
	yMin: number
	xMax: number
	yMax: number
	endPtsOfContours: Array<number>
	instructionLength: number
	instructions: Array<number>
	contours: Array<IContour>
	flags?: Array<number>
	isComposite?: boolean
	components?: Array<any>
}

// 标志位定义
const FLAGS = {
	ON_CURVE_POINT: 0x01,    // 点在曲线上（非控制点）
	X_SHORT_VECTOR: 0x02,    // x坐标用1字节（int8）
	Y_SHORT_VECTOR: 0x04,    // y坐标用1字节（int8）
	REPEAT_FLAG: 0x08,       // 后续标志重复
	X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR: 0x10, // x相同或x为正（与X_SHORT_VECTOR配合）
	Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR: 0x20, // y相同或y为正（与Y_SHORT_VECTOR配合）
}

/**
 * 计算两点之间的delta
 */
function calculateDelta(current: number, previous: number): number {
	return Math.round(current - previous)
}

/**
 * 根据delta值确定标志位和字节数
 */
function getFlagForCoordinate(delta: number, isX: boolean): {
	flag: number
	bytes: number[]
} {
	const FLAG_SHORT = isX ? FLAGS.X_SHORT_VECTOR : FLAGS.Y_SHORT_VECTOR
	const FLAG_SAME_OR_POSITIVE = isX 
		? FLAGS.X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR 
		: FLAGS.Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR
	
	if (delta === 0) {
		// delta为0：设置SAME标志，不输出字节
		return {
			flag: FLAG_SAME_OR_POSITIVE,
			bytes: []
		}
	} else if (delta >= -255 && delta <= 255) {
		// delta在-255到255之间：使用1字节
		if (delta > 0) {
			// 正数：设置SHORT和POSITIVE标志
			return {
				flag: FLAG_SHORT | FLAG_SAME_OR_POSITIVE,
				bytes: [delta]
			}
		} else {
			// 负数：只设置SHORT标志
			return {
				flag: FLAG_SHORT,
				bytes: [-delta] // 注意：存储的是绝对值
			}
		}
	} else {
		// delta超出范围：使用2字节（int16）
		const bytes = encoder.int16(delta)
		return {
			flag: 0,
			bytes: bytes ? Array.from(bytes) : []
		}
	}
}

/**
 * 压缩标志数组
 * 将连续相同的标志压缩为 [flag, REPEAT_FLAG, count]
 */
function compressFlags(flags: number[]): number[] {
	const compressed: number[] = []
	let i = 0
	
	while (i < flags.length) {
		const currentFlag = flags[i]
		let repeatCount = 0
		
		// 查找连续相同的标志
		while (i + repeatCount + 1 < flags.length && 
		       flags[i + repeatCount + 1] === currentFlag && 
		       repeatCount < 255) {
			repeatCount++
		}
		
		if (repeatCount > 0) {
			// 有重复：输出 flag | REPEAT_FLAG, repeatCount
			compressed.push(currentFlag | FLAGS.REPEAT_FLAG)
			compressed.push(repeatCount)
			i += repeatCount + 1
		} else {
			// 无重复：直接输出flag
			compressed.push(currentFlag)
			i++
		}
	}
	
	return compressed
}

/**
 * 序列化单个简单字形（simple glyph）
 */
export function serializeSimpleGlyph(glyph: IGlyphTable): number[] {
	const data: number[] = []
	
	// === 1. 字形头部（10字节）===
	const numContoursBytes = encoder.int16(glyph.numberOfContours)
	const xMinBytes = encoder.int16(glyph.xMin)
	const yMinBytes = encoder.int16(glyph.yMin)
	const xMaxBytes = encoder.int16(glyph.xMax)
	const yMaxBytes = encoder.int16(glyph.yMax)
	
	if (numContoursBytes) data.push(...numContoursBytes)
	if (xMinBytes) data.push(...xMinBytes)
	if (yMinBytes) data.push(...yMinBytes)
	if (xMaxBytes) data.push(...xMaxBytes)
	if (yMaxBytes) data.push(...yMaxBytes)
	
	// === 2. endPtsOfContours数组 ===
	for (const endPt of glyph.endPtsOfContours) {
		const bytes = encoder.uint16(endPt)
		if (bytes) data.push(...bytes)
	}
	
	// === 3. instructionLength ===
	const instructionLength = glyph.instructionLength || 0
	const instrLenBytes = encoder.uint16(instructionLength)
	if (instrLenBytes) data.push(...instrLenBytes)
	
	// === 4. instructions ===
	if (instructionLength > 0 && glyph.instructions) {
		data.push(...glyph.instructions)
	}
	
	// === 5. 收集所有点 ===
	const allPoints: IPoint[] = []
	for (const contour of glyph.contours) {
		for (const point of contour.points) {
			allPoints.push(point)
		}
	}
	
	if (allPoints.length === 0) {
		console.warn('⚠️ Glyph has contours but no points!')
		return data
	}
	
	// === 6. 计算标志和坐标 ===
	const flags: number[] = []
	const xBytes: number[] = []
	const yBytes: number[] = []
	
	let prevX = 0
	let prevY = 0
	
	for (let i = 0; i < allPoints.length; i++) {
		const point = allPoints[i]
		const x = Math.round(point.x || 0)
		const y = Math.round(point.y || 0)
		
		// 计算delta
		const deltaX = calculateDelta(x, prevX)
		const deltaY = calculateDelta(y, prevY)
		
		// 获取x的标志和字节
		const xInfo = getFlagForCoordinate(deltaX, true)
		// 获取y的标志和字节
		const yInfo = getFlagForCoordinate(deltaY, false)
		
		// 合并标志
		let flag = xInfo.flag | yInfo.flag
		
		// 添加ON_CURVE标志
		if (point.onCurve) {
			flag |= FLAGS.ON_CURVE_POINT
		}
		
		flags.push(flag)
		xBytes.push(...xInfo.bytes)
		yBytes.push(...yInfo.bytes)
		
		// 更新previous值
		prevX = x
		prevY = y
	}
	
	// === 7. 压缩标志 ===
	const compressedFlags = compressFlags(flags)
	data.push(...compressedFlags)
	
	// === 8. x坐标数据 ===
	data.push(...xBytes)
	
	// === 9. y坐标数据 ===
	data.push(...yBytes)
	
	return data
}

/**
 * 序列化整个glyf表
 */
export function serializeGlyfTable(glyphTables: IGlyphTable[]): {
	data: number[]
	offsets: number[]
} {
	console.log('\n=== Serializing glyf Table (OpenType compliant) ===')
	console.log(`Processing ${glyphTables.length} glyphs...`)
	
	const allData: number[] = []
	const offsets: number[] = []
	let currentOffset = 0
	
	for (let i = 0; i < glyphTables.length; i++) {
		const glyph = glyphTables[i]
		
		// 记录当前字形的offset
		offsets.push(currentOffset)
		
		// 空字形（如空格）
		if (glyph.numberOfContours === 0) {
			// 空字形不添加数据，offset保持不变
			if (i < 3 || i >= glyphTables.length - 1) {
				console.log(`  Glyph ${i}: empty (0 bytes)`)
			} else if (i === 3) {
				console.log(`  ...`)
			}
			continue
		}
		
		// 序列化字形数据
		const glyphData = serializeSimpleGlyph(glyph)
		
		// 4字节对齐
		while (glyphData.length % 4 !== 0) {
			glyphData.push(0)
		}
		
		if (i < 3 || i >= glyphTables.length - 1) {
			const totalPoints = glyph.contours.reduce((sum, c) => sum + c.points.length, 0)
			console.log(`  Glyph ${i}: ${glyphData.length} bytes, ${totalPoints} points, offset ${currentOffset}`)
		}
		
		allData.push(...glyphData)
		currentOffset += glyphData.length
	}
	
	// 最后一个offset（指向表末尾）
	offsets.push(currentOffset)
	
	console.log(`✅ glyf table serialized: ${allData.length} bytes total`)
	console.log(`   Offsets: ${offsets.length} entries`)
	console.log(`   First offsets: [${offsets.slice(0, 5).join(', ')}...]`)
	console.log(`   Last offsets: [...${offsets.slice(-5).join(', ')}]`)
	console.log('==============================================\n')
	
	return {
		data: allData,
		offsets: offsets
	}
}

