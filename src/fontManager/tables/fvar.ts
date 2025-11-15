import type { IFont } from '../font'
import { encoder } from '../encode'
import * as decode from '../decode'

// head表格式
// head table format
interface IFvarTable {
	majorVersion?: number;
	minorVersion?: number;
  axesArrayOffset?: number;
  reserved?: number;
  axisCount?: number;
  axisSize?: number;
  instanceCount?: number;
  instanceSize?: number;
  axes?: Array<VariationAxisRecord>;
  instances?: Array<InstanceRecord>;
}

interface VariationAxisRecord {
  axisTag?: string | {
    tagArr: Array<number>;
    tagStr: string;
  };
  minValue?: number;
  defaultValue?: number;
  maxValue?: number;
  flags?: number;
  axisNameID?: number;
}

interface InstanceRecord {
  subfamilyNameID?: number;
  flags?: number;
  coordinates?: number | Array<number>;
  postScriptNameID?: number;
}

// head表数据类型
// head table data type
const types = {
  majorVersion: 'uint16',
  minorVersion: 'uint16',
  axesArrayOffset: 'Offset16',
  reserved: 'uint16',
  axisCount: 'uint16',
  axisSize: 'uint16',
  instanceCount: 'uint16',
  instanceSize: 'uint16',
  axisTag: 'Tag',
  minValue: 'Fixed',
  defaultValue: 'Fixed',
  maxValue: 'Fixed',
  flags: 'uint16',
  axisNameID: 'uint16',
  subfamilyNameID: 'uint16',
  coordinates: 'Fixed',
  postScriptNameID: 'uint16',
}

const tableTypes = {
  majorVersion: 'uint16',
  minorVersion: 'uint16',
  axesArrayOffset: 'Offset16',
  reserved: 'uint16',
  axisCount: 'uint16',
  axisSize: 'uint16',
  instanceCount: 'uint16',
  instanceSize: 'uint16',
}

const tableFieldOrder = [
	'majorVersion',
	'minorVersion',
	'axesArrayOffset',
	'reserved',
	'axisCount',
	'axisSize',
	'instanceCount',
	'instanceSize',
] as const

const axisTypes = {
  axisTag: 'Tag',
  minValue: 'Fixed',
  defaultValue: 'Fixed',
  maxValue: 'Fixed',
  flags: 'uint16',
  axisNameID: 'uint16',
}

const axisFieldOrder = [
	'axisTag',
	'minValue',
	'defaultValue',
	'maxValue',
	'flags',
	'axisNameID',
] as const

const instanceTypes = {
  subfamilyNameID: 'uint16',
  flags: 'uint16',
  coordinates: 'Fixed',
  postScriptNameID: 'uint16',
}

const instanceFieldOrder = [
	'subfamilyNameID',
	'flags',
	'coordinates',
	'postScriptNameID',
] as const

const getMacStyle = (macStyle: number) => {

}

/**
 * 解析head表
 * @param data 字体文件DataView数据
 * @param offset 当前表的位置
 * @param font 字体对象
 * @returns IHeadTable对象
 */
/**
 * parse head table
 * @param data font data, type of DataView
 * @param offset offset of current table
 * @param font font object
 * @returns IHeadTable object
 */
const parse = (data: DataView, offset: number, font: IFont) => {
	const table: IFvarTable = {
		axes: [],
		instances: [],
	}

	// 启动一个新的decoder
	// start a new decoder
	decode.start(data, offset)
	for (const key of tableFieldOrder) {
		(table as any)[key] = decode.decoder[tableTypes[key] as keyof typeof decode.decoder]() as number
	}

	const axisCount = table.axisCount || 0
	for (let i = 0; i < axisCount; i++) {
		const axis: VariationAxisRecord = {}
		for (const key of axisFieldOrder) {
			(axis as any)[key] = decode.decoder[axisTypes[key] as keyof typeof decode.decoder]() as number
		}
		table.axes?.push(axis)
	}

	const instanceCount = table.instanceCount || 0
	for (let i = 0; i < instanceCount; i++) {
		const instance: InstanceRecord = {}
		for (const key of instanceFieldOrder) {
			(instance as any)[key] = decode.decoder[instanceTypes[key] as keyof typeof decode.decoder]() as number
		}
		table.instances?.push(instance)
	}
	decode.end()

	return table
}

/**
 * 根据IHeadTable对象创建该表的原始数据
 * @param table IHeadTable table
 * @returns 原始数据数组，每项类型是8-bit数字
 */
/**
 * generate raw data from IHeadTable table
 * @param table IHeadTable table
 * @returns raw data array, each entry is type of 8-bit number
 */
const create = (table: IFvarTable) => {
	let data: Array<number> = []
	
	// fvar表必须按照严格的顺序写入数据
	// fvar table must be written in strict order
	
	// 1. 写入表头
	// Write table header
	const majorVersionBytes = encoder.uint16(table.majorVersion || 1)
	const minorVersionBytes = encoder.uint16(table.minorVersion || 0)
	const axesArrayOffsetBytes = encoder.Offset16(table.axesArrayOffset || 16)
	const reservedBytes = encoder.uint16(table.reserved || 2)
	const axisCountBytes = encoder.uint16(table.axisCount || 0)
	const axisSizeBytes = encoder.uint16(table.axisSize || 20)
	const instanceCountBytes = encoder.uint16(table.instanceCount || 0)
	// instanceSize = subfamilyNameID(2) + flags(2) + coordinates(axisCount*4) + postScriptNameID(2)
	const calculatedInstanceSize = 2 + 2 + (table.axisCount || 0) * 4 + 2
	const instanceSizeBytes = encoder.uint16(table.instanceSize || calculatedInstanceSize)
	
	if (majorVersionBytes) data = data.concat(majorVersionBytes)
	if (minorVersionBytes) data = data.concat(minorVersionBytes)
	if (axesArrayOffsetBytes) data = data.concat(axesArrayOffsetBytes)
	if (reservedBytes) data = data.concat(reservedBytes)
	if (axisCountBytes) data = data.concat(axisCountBytes)
	if (axisSizeBytes) data = data.concat(axisSizeBytes)
	if (instanceCountBytes) data = data.concat(instanceCountBytes)
	if (instanceSizeBytes) data = data.concat(instanceSizeBytes)
	
	// 2. 写入axes数组
	// Write axes array
	if (table.axes) {
		for (let i = 0; i < table.axes.length; i++) {
			const axis = table.axes[i]
			
			// 按固定顺序写入每个axis的字段
			const axisTagBytes = encoder.Tag(axis.axisTag)
			const minValueBytes = encoder.Fixed(axis.minValue || 0)
			const defaultValueBytes = encoder.Fixed(axis.defaultValue || 0)
			const maxValueBytes = encoder.Fixed(axis.maxValue || 0)
			const flagsBytes = encoder.uint16(axis.flags || 0)
			const axisNameIDBytes = encoder.uint16(axis.axisNameID || 0)
			
			if (axisTagBytes) data = data.concat(axisTagBytes)
			if (minValueBytes) data = data.concat(minValueBytes)
			if (defaultValueBytes) data = data.concat(defaultValueBytes)
			if (maxValueBytes) data = data.concat(maxValueBytes)
			if (flagsBytes) data = data.concat(flagsBytes)
			if (axisNameIDBytes) data = data.concat(axisNameIDBytes)
		}
	}
	
	// 3. 写入instances数组
	// Write instances array
	if (table.instances) {
		for (let i = 0; i < table.instances.length; i++) {
			const instance = table.instances[i]
			
			// 按固定顺序写入每个instance的字段
			const subfamilyNameIDBytes = encoder.uint16(instance.subfamilyNameID || 0)
			const flagsBytes = encoder.uint16(instance.flags || 0)
			
			if (subfamilyNameIDBytes) data = data.concat(subfamilyNameIDBytes)
			if (flagsBytes) data = data.concat(flagsBytes)
			
			// 写入coordinates数组（每个轴一个Fixed值）
			if (instance.coordinates) {
				if (Array.isArray(instance.coordinates)) {
					for (const coord of instance.coordinates) {
						const coordBytes = encoder.Fixed(coord)
						if (coordBytes) data = data.concat(coordBytes)
					}
				} else {
					// 兼容旧的单个coordinates值
					const coordBytes = encoder.Fixed(instance.coordinates)
					if (coordBytes) data = data.concat(coordBytes)
				}
			}
			
			// 写入postScriptNameID（如果有）
			if (instance.postScriptNameID !== undefined) {
				const postScriptNameIDBytes = encoder.uint16(instance.postScriptNameID)
				if (postScriptNameIDBytes) data = data.concat(postScriptNameIDBytes)
			}
		}
	}

	return data
}

const createFvarTable = (variants: any) => {
  const table: IFvarTable = {}
  table.majorVersion = 1
  table.minorVersion = 0
  table.axisCount = variants.axes ? variants.axes.length : 0
  
  // 处理axes
  if (variants.axes) {
    table.axes = variants.axes.map((axis: any) => {
      return {
        axisTag: axis.tag || axis.axisTag,  // 支持tag和axisTag两种字段名
        minValue: axis.minValue,
        defaultValue: axis.defaultValue,
        maxValue: axis.maxValue,
        flags: axis.flags || 0,
        axisNameID: axis.nameID,
      }
    })
  }
  
  // 处理instances
  table.instances = []
  
  if (variants.instances && variants.instances.length > 0) {
    // 用户提供了instances，使用用户提供的
    table.instances = variants.instances.map((instance: any) => {
      return {
        subfamilyNameID: instance.subfamilyNameID,
        flags: instance.flags || 0,
        coordinates: instance.coordinates,
        postScriptNameID: instance.postScriptNameID,
      }
    })
  } else {
    // 用户没有提供instances，自动创建一个默认实例
    // Adobe应用（如Photoshop）需要至少一个instance才能显示可变字体
    console.warn('⚠️ No instances provided. Creating default instance for Adobe app compatibility.')
    
    if (table.axes && table.axes.length > 0) {
      // 创建指向所有轴默认值的实例
      const defaultCoordinates: number[] = table.axes.map(axis => axis.defaultValue || 0)
      
      table.instances = [{
        subfamilyNameID: 2,  // nameID 2 通常是 "Regular"
        flags: 0,
        coordinates: defaultCoordinates,  // 所有轴的默认值（数组）
        postScriptNameID: 6,  // nameID 6 是 PostScript name
      }]
      
      console.log(`✅ Created default instance: subfamilyNameID=2, coordinates=[${defaultCoordinates.join(', ')}], postScriptNameID=6`)
    }
  }
  
  table.instanceCount = table.instances.length
  
  return table
}

export {
	parse,
	create,
	createFvarTable,
}

export type {
	IFvarTable,
}