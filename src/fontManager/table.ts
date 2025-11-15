import type { IHeadTable } from './tables/head'
import type { IHheaTable } from './tables/hhea'
import type { IOS2Table } from './tables/os_2'
import type { IMaxpTable } from './tables/maxp'
import type { INameTable } from './tables/name'
import type { IPostTable } from './tables/post'
import type { ICmapTable } from './tables/cmap'
import type { IHmtxTable } from './tables/hmtx'
import type { IGlyfTable } from './tables/glyf'
import type { ILocaTable } from './tables/loca'
import type { ICffTable } from './tables/cff'
import * as headTable from './tables/head'
import * as hheaTable from './tables/hhea'
import * as os2Table from './tables/os_2'
import * as maxpTable from './tables/maxp'
import * as nameTable from './tables/name'
import * as postTable from './tables/post'
import * as cmapTable from './tables/cmap'
import * as hmtxTable from './tables/hmtx'
import * as glyfTable from './tables/glyf'
import * as locaTable from './tables/loca'
import * as cffTable from './tables/cff'
import * as fvarTable from './tables/fvar'
import * as gvarTable from './tables/gvar'
import * as STATTable from './tables/STAT'
import * as colrTable from './tables/colr'
import * as cpalTable from './tables/cpal'

/**
 * 所有表的工具（通常包含parse和create方法）集合
 */
/**
 * set for all table tool
 */
const tableTool: any = {
	'head': headTable,
	'hhea': hheaTable,
	'OS/2': os2Table,
	'maxp': maxpTable,
	'name': nameTable,
	'post': postTable,
	'cmap': cmapTable,
	'hmtx': hmtxTable,
	'glyf': glyfTable,
	'loca': locaTable,
	'CFF ': cffTable,
	'fvar': fvarTable,
	'gvar': gvarTable,
	'STAT': STATTable,
	'COLR': colrTable,
	'CPAL': cpalTable,
}

type ITableType = 'IHeadTable | IHheaTable | IOS2Table | IMaxpTable | INameTable | IPostTable | ICmapTable | IHmtxTable | IGlyfTable | ILocaTable | ICffTable' | null

// table 数据类型
// table data type
interface ITable {
  name: string;
	table: ITableType,
	config: ITableConfig;
}

interface ITableConfig {
	tableTag: {
		tagArr?: Array<number>,
		tagStr: string,
	};
	checkSum: number;
	offset: number;
	length: number;
}

export {
	tableTool,
}

export type {
	ITable,
}