/**
 * glyf和loca表构建器
 * Builder for glyf and loca tables
 * 
 * 用于可变字体：从ICharacter数组构建IGlyfTable和ILocaTable
 * For variable fonts: Build IGlyfTable and ILocaTable from ICharacter array
 */

import { loaded, loading, total } from '../../fontEditor/stores/global'
import type { ICharacter } from '../character'
import { PathType } from '../character'
import type { IGlyfTable } from '../tables/glyf'
import type { ILocaTable } from '../tables/loca'

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

interface IContour {
	xCoordinates: Array<number>
	yCoordinates: Array<number>
	points: Array<IPoint>
	paths: Array<any>
}

interface IPoint {
	x?: number
	y?: number
	onCurve?: boolean
}

/**
 * 计算字形的边界框
 */
function calculateBoundingBox(character: ICharacter): {
	xMin: number
	yMin: number
	xMax: number
	yMax: number
} {
	let xMin = Infinity
	let yMin = Infinity
	let xMax = -Infinity
	let yMax = -Infinity
	
	// 如果没有轮廓，返回默认值
	if (!character.contours || character.contours.length === 0) {
		return { xMin: 0, yMin: 0, xMax: 0, yMax: 0 }
	}
	
	for (const contour of character.contours) {
		for (const segment of contour) {
			// 检查起点
			if (segment.start) {
				xMin = Math.min(xMin, segment.start.x)
				xMax = Math.max(xMax, segment.start.x)
				yMin = Math.min(yMin, segment.start.y)
				yMax = Math.max(yMax, segment.start.y)
			}
			
			// 检查终点
			if (segment.end) {
				xMin = Math.min(xMin, segment.end.x)
				xMax = Math.max(xMax, segment.end.x)
				yMin = Math.min(yMin, segment.end.y)
				yMax = Math.max(yMax, segment.end.y)
			}
			
			// 检查控制点
			if (segment.type === PathType.QUADRATIC_BEZIER && segment.control) {
				xMin = Math.min(xMin, segment.control.x)
				xMax = Math.max(xMax, segment.control.x)
				yMin = Math.min(yMin, segment.control.y)
				yMax = Math.max(yMax, segment.control.y)
			} else if (segment.type === PathType.CUBIC_BEZIER) {
				if (segment.control1) {
					xMin = Math.min(xMin, segment.control1.x)
					xMax = Math.max(xMax, segment.control1.x)
					yMin = Math.min(yMin, segment.control1.y)
					yMax = Math.max(yMax, segment.control1.y)
				}
				if (segment.control2) {
					xMin = Math.min(xMin, segment.control2.x)
					xMax = Math.max(xMax, segment.control2.x)
					yMin = Math.min(yMin, segment.control2.y)
					yMax = Math.max(yMax, segment.control2.y)
				}
			}
		}
	}
	
	// 如果没有找到有效的点，返回默认值
	if (!isFinite(xMin)) {
		return { xMin: 0, yMin: 0, xMax: 0, yMax: 0 }
	}
	
	return {
		xMin: Math.round(xMin),
		yMin: Math.round(yMin),
		xMax: Math.round(xMax),
		yMax: Math.round(yMax),
	}
}

/**
 * 将轮廓转换为glyf格式的contour
 * 注意：必须是二次贝塞尔曲线（已通过convertContoursToQuadratic转换）
 */
function convertContourToGlyfFormat(contour: any[]): IContour {
	const points: IPoint[] = []
	const xCoordinates: number[] = []
	const yCoordinates: number[] = []
	
	for (const segment of contour) {
		// 添加起点（on-curve point）
		points.push({
			x: Math.round(segment.start.x),
			y: Math.round(segment.start.y),
			onCurve: true,
		})
		xCoordinates.push(Math.round(segment.start.x))
		yCoordinates.push(Math.round(segment.start.y))
		
		// 如果是二次贝塞尔曲线，添加控制点（off-curve point）
		if (segment.type === PathType.QUADRATIC_BEZIER && segment.control) {
			points.push({
				x: Math.round(segment.control.x),
				y: Math.round(segment.control.y),
				onCurve: false,
			})
			xCoordinates.push(Math.round(segment.control.x))
			yCoordinates.push(Math.round(segment.control.y))
		} else if (segment.type === PathType.CUBIC_BEZIER) {
			// 三次贝塞尔曲线不应该出现在这里
			// 应该已经通过convertContoursToQuadratic转换了
			console.error('❌ ERROR: Cubic Bezier curve found in glyf conversion!')
			console.error('   All curves should be converted to quadratic first')
		}
	}
	
	return {
		points,
		xCoordinates,
		yCoordinates,
		paths: contour,
	}
}

/**
 * 从ICharacter数组构建IGlyfTable
 * 
 * @param characters 字符数组（轮廓必须已转换为二次贝塞尔）
 * @returns IGlyfTable
 */
export async function buildGlyfTable(characters: ICharacter[]): Promise<IGlyfTable> {
	console.log('\n=== Building glyf Table ===')
	console.log(`Processing ${characters.length} glyphs...`)
	
	const glyphTables: IGlyphTable[] = []
	
	for (let i = 0; i < characters.length; i++) {
		loaded.value++
		if (i % 50 === 0) {
			await new Promise(resolve => requestAnimationFrame(resolve))
		}

		const char = characters[i]
		const bbox = calculateBoundingBox(char)
		
		// 处理空字形（如空格）
		if (!char.contours || char.contours.length === 0 || char.contourNum === 0) {
			glyphTables.push({
				numberOfContours: 0,
				xMin: 0,
				yMin: 0,
				xMax: 0,
				yMax: 0,
				endPtsOfContours: [],
				instructionLength: 0,
				instructions: [],
				contours: [],
			})
			continue
		}
		
		// 转换每个轮廓
		const contours: IContour[] = []
		const endPtsOfContours: number[] = []
		let pointCount = 0
		
		for (const contour of char.contours) {
			const glyfContour = convertContourToGlyfFormat(contour)
			contours.push(glyfContour)
			pointCount += glyfContour.points.length
			endPtsOfContours.push(pointCount - 1) // 累积点数 - 1
		}
		
		glyphTables.push({
			numberOfContours: char.contourNum,
			xMin: bbox.xMin,
			yMin: bbox.yMin,
			xMax: bbox.xMax,
			yMax: bbox.yMax,
			endPtsOfContours,
			instructionLength: 0,
			instructions: [],
			contours,
			isComposite: false,
		})
		
		if (i === 0 || i === characters.length - 1) {
			console.log(`  Glyph ${i} (${char.name || 'unnamed'}): ${char.contourNum} contours, ${pointCount} points`)
		} else if (i === 1) {
			console.log(`  ...`)
		}
	}
	
	console.log(`✅ Built glyf table with ${glyphTables.length} glyphs`)
	console.log('===========================\n')
	
	return {
		glyphTables,
	}
}

/**
 * 计算单个字形的精确数据大小（用于loca表）
 * 必须与glyf.create()的实现保持一致
 */
function calculateGlyphDataSize(glyph: IGlyphTable): number {
	// 空字形
	if (glyph.numberOfContours === 0) {
		return 0
	}
	
	let size = 0
	
	// 1. 头部：10字节
	size += 10 // numberOfContours(2) + xMin(2) + yMin(2) + xMax(2) + yMax(2)
	
	// 2. endPtsOfContours：每个轮廓2字节
	size += glyph.endPtsOfContours.length * 2
	
	// 3. instructionLength：2字节
	size += 2
	
	// 4. instructions：instructionLength字节
	size += glyph.instructionLength || 0
	
	// 5. 计算总点数
	let totalPoints = 0
	for (const contour of glyph.contours) {
		totalPoints += contour.points.length
	}
	
	// 6. flags：每个点1字节（简化实现，不压缩）
	size += totalPoints
	
	// 7. x坐标：每个点2字节（int16，简化实现）
	size += totalPoints * 2
	
	// 8. y坐标：每个点2字节（int16，简化实现）
	size += totalPoints * 2
	
	// 9. 4字节对齐
	while (size % 4 !== 0) {
		size++
	}
	
	return size
}

/**
 * 从IGlyfTable构建ILocaTable
 * 
 * @param glyfTable glyf表
 * @param version 0=short格式（Offset16），1=long格式（Offset32）
 * @returns ILocaTable
 */
export function buildLocaTable(
	glyfTable: IGlyfTable,
	version: number = 1
): ILocaTable {
	console.log('\n=== Building loca Table ===')
	console.log(`Version: ${version} (${version === 0 ? 'short/Offset16' : 'long/Offset32'})`)
	
	const offsets: number[] = []
	let currentOffset = 0
	
	// 计算每个字形的偏移量
	for (let i = 0; i < glyfTable.glyphTables.length; i++) {
		offsets.push(currentOffset)
		
		const glyph = glyfTable.glyphTables[i]
		const glyphSize = calculateGlyphDataSize(glyph)
		currentOffset += glyphSize
	}
	
	// 最后一个offset（指向glyf表的末尾）
	offsets.push(currentOffset)
	
	console.log(`Total glyphs: ${glyfTable.glyphTables.length}`)
	console.log(`Total glyf data size: ${currentOffset} bytes`)
	console.log(`Offsets array length: ${offsets.length}`)
	
	// 显示前几个和后几个offset
	console.log(`First offsets: [${offsets.slice(0, 5).join(', ')}...]`)
	console.log(`Last offsets: [...${offsets.slice(-5).join(', ')}]`)
	
	// 检查是否可以使用short格式
	const maxOffset = currentOffset
	const canUseShortFormat = maxOffset / 2 < 65536
	
	if (version === 0 && !canUseShortFormat) {
		console.warn(`⚠️ WARNING: Version 0 (short) requested but offsets too large!`)
		console.warn(`   Max offset: ${maxOffset}, max for short: ${65536 * 2}`)
		console.warn(`   Consider using version 1 (long) instead`)
	}
	
	console.log(`✅ Built loca table with ${offsets.length} offsets`)
	console.log('===========================\n')
	
	return {
		offsets,
	}
}

/**
 * 便捷函数：同时构建glyf和loca表
 */
export async function buildGlyfAndLocaTables(
	characters: ICharacter[],
	locaVersion: number = 1
): Promise<{ glyfTable: IGlyfTable; locaTable: ILocaTable }> {
	const glyfTable = await buildGlyfTable(characters)
	const locaTable = buildLocaTable(glyfTable, locaVersion)
	
	return {
		glyfTable,
		locaTable,
	}
}

