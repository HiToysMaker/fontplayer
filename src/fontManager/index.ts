import type { IOption } from './font'
import { parseFont, createFont, toArrayBuffer, hasChar } from './font'
import type { ITable } from './table'
import { PathType, drawByOption } from './character'
import type {
	ICharacter,
	ILine,
	ICubicBezierCurve,
	IQuadraticBezierCurve,
	IPoint,
} from './character'

/**
 * 通过指定url解析字体
 * @param url 字体文件对应的url
 * @returns font对象
 */
/**
 * parse font data by url
 * @param url font url
 * @returns font object
 */
const parseUrl = async (url: string) => {
	const res = await fetch(url)
	const buffer = await res.arrayBuffer()
	return parse(buffer)
}

/**
 * 通过ArrayBuffer解析字体数据
 * @param buffer ArrayBuffer
 * @returns font对象
 */
/**
 * parse font data by ArrayBuffer
 * @param buffer ArrayBuffer
 * @returns font object
 */
const parse = (buffer: ArrayBuffer) => {
	return parseFont(buffer)
}

const getBytes = (data: ArrayBuffer | Array<number>, tables: Array<ITable>) => {
	return tables.map((table) => {
		return {
			name: table.name,
			bytes: data.slice(table.config.offset, table.config.offset + table.config.length)
		}
	})
}

/**
 * 创建字体
 * @param characters 字符数组
 * @param options 配置选项
 * @returns font对象
 */
const create = (characters: Array<ICharacter>, options: IOption) => {
  return createFont(characters, options)
}

export {
  parse,
	parseUrl,
  create,
	toArrayBuffer,
	hasChar,
	getBytes,
	PathType,
	drawByOption
}

export type {
	ITable,
	ICharacter,
	ILine,
	ICubicBezierCurve,
	IQuadraticBezierCurve,
	IPoint,
}