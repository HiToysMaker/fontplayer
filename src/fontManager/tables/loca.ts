import type { IFont } from '../font'
import { encoder } from '../encode'
import * as decode from '../decode'

// loca表格式
// loca table format
interface ILocaTable {
	offsets: Array<number>;
}

/**
 * 解析loca表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns ILocaTable对象
 */
/**
 * parse loca table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns ILocaTable object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	const version = font.settings.indexToLocFormat as number
	const numGlyphs = font.settings.numGlyphs as number
	const table: ILocaTable = {
		offsets: []
	}
	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	if (version === 0) {
		for (let i = 0; i < numGlyphs; i++) {
			table.offsets.push(decode.decoder['Offset16']() * 2)
		}
	} else if (version === 1) {
		for (let i = 0; i < numGlyphs; i++) {
			table.offsets.push(decode.decoder['Offset32']())
		}
	}
	decode.end()
	return table
}

/**
 * 根据ILocaTable对象创建该表的原始数据
 * @param table ILocaTable table
 * @param options 配置项
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * generate raw data from ILocaTable table
 * @param table ILocaTable table
 * @param options options
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (table: ILocaTable, options: { version: number }) => {
	let data: Array<number> = []
	for (let i = 0; i < table.offsets.length; i++) {
		if (options.version === 0) {
			const bytes = encoder['Offset16'](table.offsets[i] as number) as Array<number>
			if (bytes) {
				data = data.concat(bytes)
			}
		} else if (options.version === 1) {
			const bytes = encoder['Offset32'](table.offsets[i] as number) as Array<number>
			if (bytes) {
				data = data.concat(bytes)
			}
		}
	}
	return data
}

export {
	parse,
	create,
}

export type {
	ILocaTable,
}