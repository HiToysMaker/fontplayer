import type { IFont } from '../font'
import { encoder } from '../encode'
import * as decode from '../decode'

// hmtx表格式
// hmtx table format
interface IHmtxTable {
	hMetrics: Array<ILongHorMetric>;
	leftSideBearings?: Array<number>;
}

// hMetrics数据类型
// hMetrics data type
interface ILongHorMetric {
	advanceWidth: number;
	lsb: number;
}

// hmtx表数据类型
// hmtx table data type
const types = {
	advanceWidth: 'uint16',
	lsb: 'int16',
	leftSideBearings: 'int16',
}

/**
 * 解析hmtx表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns IHmtxTable对象
 */
/**
 * parse hmtx table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns IHmtxTable object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	const numberOfHMetrics = font.settings.numberOfHMetrics as number
	const numGlyphs = font.settings.numGlyphs as number
	
	const hMetrics = []
	const leftSideBearings = []

	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)

	for (let i = 0; i < numberOfHMetrics; i++) {
		const advanceWidth = decode.decoder[types['advanceWidth'] as keyof typeof decode.decoder]() as number
		const lsb = decode.decoder[types['lsb'] as keyof typeof decode.decoder]() as number
		hMetrics.push({
			advanceWidth,
			lsb,
		})
	}

	for (let i = 0; i < (numGlyphs - numberOfHMetrics); i++) {
		leftSideBearings.push(decode.decoder[types['leftSideBearings'] as keyof typeof decode.decoder]() as number)
	}
	
	const table: IHmtxTable = {
		hMetrics,
		leftSideBearings,
	}

	decode.end()

	return table
}

/**
 * 根据IHtmxTable对象创建该表的原始数据
 * @param table IHtmxTable table
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * generate raw data from IHheaTable table
 * @param table IHtmxTable table
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (table: IHmtxTable) => {
	let bytes: Array<number> = []
	const hMetrics = table.hMetrics as Array<ILongHorMetric>
	for (let i = 0; i < hMetrics.length; i++) {
		const hMetric = hMetrics[i]
		Object.keys(hMetric).forEach((key) => {
			const type = types[key as keyof typeof types]
			const value = hMetric[key as keyof typeof hMetric]
			bytes = bytes.concat(encoder[type as keyof typeof encoder](value) as Array<number>)
		})
	}
	const leftSideBearings = table.leftSideBearings as Array<number>
	if (leftSideBearings) {
		for (let i = 0; i < leftSideBearings.length; i++) {
			bytes = bytes.concat(encoder[types['leftSideBearings'] as keyof typeof encoder](leftSideBearings[i]) as Array<number>)
		}
	}
	return bytes
}

export {
	parse,
	create,
}

export type {
	IHmtxTable,
}