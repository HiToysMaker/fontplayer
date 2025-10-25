import { Component, ICharacterFile, IComponent, addComponentForCurrentCharacterFile, editCharacterFile, selectedFile, selectedItemByUUID } from './files'
import { ref, computed, type Ref, nextTick } from 'vue'
import { loading, setTool, tool, total } from './global'
import * as R from 'ramda'
import { getBound } from '../../utils/math'
import type { IPoint } from './pen'
import { globalConstants } from '../programming/global_contants'
import { genUUID } from '../../utils/string'
import { ConstantsMap } from '../programming/ConstantsMap'
import { FP } from '../programming/FPUtils'
import { CustomGlyph } from '../programming/CustomGlyph'
import { Joint } from '../programming/Joint'
import { ParametersMap } from '../programming/ParametersMap'
import { instanceGlyph } from '../menus/handlers'
import { emitter } from '../Event/bus'
import { Status, editStatus, setEditStatus, setPrevStatus } from './font'
import { copiedGlyphUUID, editedGlyphUUID, glyphComponentsDialogVisible2, setAddGlyphDialogVisible, setCopyGlyphDialogVisible, setEditGlyphDialogVisible } from './dialogs'
import { enableMultiSelect } from './files'
import { strokeFnMap, updateSkeletonTransformation } from '../templates/strokeFnMap'
import { updateGlyphWeight } from '../../features/glyphWeight'
import { onStrokeReplacement, setReplacementStroke } from './advancedEdit'
import { componentsToContours } from '../../features/font'

// 字形组件数据结构
// custom component data struct
export interface ICustomGlyph {
	uuid: string;
	type: string;
	name: string;
	components: Array<Component>;
	groups: Array<{
		type: string,
		uuid: string,
	}>;
	orderedList: Array<{
		type: string,
		uuid: string,
	}>;
	selectedComponentsTree?: Array<string>;
	selectedComponentsUUIDs: Array<string>;
	view: {
		zoom: number;
		translateX: number;
		translateY: number;
	};
	parameters: ParametersMap;
	joints: Array<Joint>;
	reflines?: Array<IRefLine>;
	layout?: GlyphLayout | null;
	script: string;
	param_script?: Map<string, string>;
	system_script?: Map<string, string>;
	glyph_script?: Map<string, string>;
	parent?: ICustomGlyph | ICharacterFile;
	_o?: CustomGlyph;
	objData?: any;
	script_reference?: string;
	parent_reference?: ParentInfo;
	skeleton?: ISkeleton | null;
	style?: string;
}

interface ISkeleton {
	type: string;
	ox: number;
	oy: number;
	skeletonBindData?: any;
	onSkeletonBind?: boolean;
	originWeight?: number;
	dynamicWeight?: boolean;
}

const skeletonOptions = [
	// 基础笔画
	{
		label: '横',
		value: '横',
	},
	{
		label: '竖',
		value: '竖',
	},
	{
		label: '撇',
		value: '撇',
	},
	{
		label: '捺',
		value: '捺',
	},
	{
		label: '点',
		value: '点',
	},
	{
		label: '挑',
		value: '挑',
	},
	{
		label: '平捺',
		value: '平捺',
	},
	// 横类复合笔画
	{
		label: '横钩',
		value: '横钩',
	},
	{
		label: '横撇',
		value: '横撇',
	},
	{
		label: '横折',
		value: '横折',
	},
	{
		label: '横折2',
		value: '横折2',
	},
	{
		label: '横折钩',
		value: '横折钩',
	},
	{
		label: '横折弯',
		value: '横折弯',
	},
	{
		label: '横折弯钩',
		value: '横折弯钩',
	},
	{
		label: '横折挑',
		value: '横折挑',
	},
	{
		label: '横弯钩',
		value: '横弯钩',
	},
	{
		label: '横撇弯钩',
		value: '横撇弯钩',
	},
	{
		label: '横折折撇',
		value: '横折折撇',
	},
	{
		label: '横折折弯钩',
		value: '横折折弯钩',
	},
	// 竖类复合笔画
	{
		label: '竖钩',
		value: '竖钩',
	},
	{
		label: '竖弯',
		value: '竖弯',
	},
	{
		label: '竖弯钩',
		value: '竖弯钩',
	},
	{
		label: '竖折',
		value: '竖折',
	},
	{
		label: '竖撇',
		value: '竖撇',
	},
	{
		label: '竖挑',
		value: '竖挑',
	},
	{
		label: '竖折折钩',
		value: '竖折折钩',
	},
	// 撇捺类复合笔画
	{
		label: '撇挑',
		value: '撇挑',
	},
	{
		label: '撇点',
		value: '撇点',
	},
	{
		label: '挑捺',
		value: '挑捺',
	},
	// 其他复合笔画
	{
		label: '弯钩',
		value: '弯钩',
	},
	{
		label: '斜钩',
		value: '斜钩',
	},
	// 特殊复合笔画
	{
		label: '二横折',
		value: '二横折',
	},
]

interface ParentInfo {
	uuid: string;
	type: string;
}

const getParentInfo = (parent) => {
	return {
		uuid: parent.uuid,
		type: parent.type,
	}
}

// 辅助线
// ref line
export interface IRefLine {
	id?: string;
	name: string;
	start: string;
	end: string;
	type?: string;
}

// 关键点
// joint
export interface IJoint {
	id?: string;
	name: string;
	x: Function;
	y: Function;
}

// 字形组件
// glyph component
export interface IGlyphComponent {
	uuid: string;
	type: string;
	name: string;
	lock: boolean;
	visible: boolean;
	value: ICustomGlyph;
	ox: number;
	oy: number;
	usedInCharacter: boolean;
	opacity?: number;
}

// 字形布局
// glyph layout
export interface GlyphLayout {
	type: string;
	params: RectLayoutParams | {};
	ratioedMap?: any;//Map<string, string>;
}

// 矩形布局
// rect layout
export interface RectLayoutParams {
	width: number;
	height: number;
}

// 全局常量
// constant
export interface IConstant {
	uuid: string;
	value: number | string | IRingParameter;
	name: string;
	type: ParameterType;
	min?: number;
	max?: number;
	ratio?: string;
	ratioed?: boolean;
	options?: Array<IEnumOption>;
}

// 参数类型
// parameter type
export enum ParameterType {
	Number,
	Constant,
	RingController,
	Enum,
	PlaygroundConstant,
	AdvancedEditConstant,
}

const parameterCompKey = ref(0)
const selectedParam = ref(null)

const selectedParamType =ref('')

// 环形组件
// ring parameter
export interface IRingParameter {
	radius: IParameter2,
	degree: IParameter2,
	params: Array<IParameter2>,
}

export interface IParameter2 {
	name: string;
	value: number;
	min: number;
	max: number;
	ratio?: string;
	ratioed?: boolean;
}

export interface IEnumOption {
	value: number,
	label: string,
}

// 字形参数
// glyph parameter
export interface IParameter {
	uuid: string;
	name: string;
	type: ParameterType;
	value: number | string | IRingParameter;
	ratio?: string;
	ratioed?: boolean;
	min?: number;
	max?: number;
	options?: Array<IEnumOption>;
}

const constants: Ref<Array<IConstant>> = ref([])

// const constants: Ref<Array<IConstant>> = ref<Array<IConstant>>([
//   {
//     uuid: genUUID(),
//     name: '起笔风格',
//     type: ParameterType.Enum,
//     value: 2,
//     options: [
//       {
//         value: 0,
//         label: '无起笔样式',
//       },
//       {
//         value: 1,
//         label: '凸笔起笔',
//       },
//       {
//         value: 2,
//         label: '凸笔圆角起笔',
//       }
//     ]
//   },
//   {
//     uuid: genUUID(),
//     name: '起笔数值',
//     type: ParameterType.Number,
//     value: 1,
//     min: 0,
//     max: 2,
//   },
//   {
//     uuid: genUUID(),
//     name: '转角风格',
//     type: ParameterType.Enum,
//     value: 1,
//     options: [
//       {
//         value: 0,
//         label: '默认转角样式',
//       },
//       {
//         value: 1,
//         label: '转角圆滑凸起',
//       }
//     ]
//   },
//   {
//     uuid: genUUID(),
//     name: '转角数值',
//     type: ParameterType.Number,
//     value: 1,
//     min: 1,
//     max: 2,
//   },
//   {
//     uuid: genUUID(),
//     name: '字重变化',
//     type: ParameterType.Number,
//     value: 0,
//     min: 0,
//     max: 2,
//   },
//   {
//     uuid: genUUID(),
//     name: '弯曲程度',
//     type: ParameterType.Number,
//     value: 1,
//     min: 0,
//     max: 2,
//   },
//   {
//     uuid: genUUID(),
//     name: '字重',
//     type: ParameterType.Number,
//     value: 50,
//     min: 40,
//     max: 100,
//   },
// ])
//const constants: Ref<Array<IConstant>> = ref(Object.keys(globalConstants).map((key) => {
//	return {
//		uuid: genUUID(),
//		value: globalConstants[key] as number,
//		name: key,
//		type: ParameterType.Number,//'system',
//		min: 0,
//		max: 1000,
//	}
//}))

const constantsMap = new ConstantsMap(constants.value)

const glyphs: Ref<Array<ICustomGlyph>> = ref([])
const radical_glyphs: Ref<Array<ICustomGlyph>> = ref([])
const stroke_glyphs: Ref<Array<ICustomGlyph>> = ref([])
const comp_glyphs: Ref<Array<ICustomGlyph>> = ref([])

export enum ConstantType {
	Component,
	Parameter,
}

export enum GlyphType {
	Char,
	StrokeGlyph,
	RadicalGlyph,
	CompGlyph,
	Glyph,
}

// 转换字形类型
// convert glyph type
export const convertGlyphType = (type: Status) => {
	if (type === Status.GlyphList) {
		return GlyphType.Glyph
	} else if (type === Status.StrokeGlyphList) {
		return GlyphType.StrokeGlyph
	} else if (type === Status.RadicalGlyphList) {
		return GlyphType.RadicalGlyph
	} else if (type === Status.CompGlyphList) {
		return GlyphType.CompGlyph
	} else if (type === Status.CharacterList) {
		return GlyphType.Char
	}

	return null
}

const constantGlyphMap: Map<string, Array<ConstantGlyphPair>> = new Map()

export interface ConstantGlyphPair {
	constantType: ConstantType;
	glyphType: GlyphType;
	glyphUUID: string;
	parameterUUID: string;
	parentUUID?: string;
}

const editGlyphUUID: Ref<string> = ref('')

// 是否支持多选
// whether enable multi select
// const enableMultiSelect: Ref<boolean> = ref(false)

// 初始化字形环境
// init glyph environment
const initGlyphEnvironment = async () => {
	window.FP = FP
}

// 获取指定uuid glyph，需要从四种字形类型中逐一遍历
// get glyph by uuid
const getGlyphByUUID = (uuid: string) => {
	let glyph = null
	for (let i = 0; i < glyphs.value.length; i++) {
		if (glyphs.value[i].uuid === uuid) {
			glyph = glyphs.value[i]
			return glyph
		}
	}
	for (let i = 0; i < radical_glyphs.value.length; i++) {
		if (radical_glyphs.value[i].uuid === uuid) {
			glyph = radical_glyphs.value[i]
			return glyph
		}
	}
	for (let i = 0; i < stroke_glyphs.value.length; i++) {
		if (stroke_glyphs.value[i].uuid === uuid) {
			glyph = stroke_glyphs.value[i]
			return glyph
		}
	}
	for (let i = 0; i < comp_glyphs.value.length; i++) {
		if (comp_glyphs.value[i].uuid === uuid) {
			glyph = comp_glyphs.value[i]
			return glyph
		}
	}
	return glyph
}

// 获取指定名称字形，需要从四种字形类型中逐一遍历
// get glyph by name
const getGlyphByName = (name: string) => {
	let glyph = null
	for (let i = 0; i < glyphs.value.length; i++) {
		if (glyphs.value[i].name === name) {
			glyph = glyphs.value[i]
			return glyph
		}
	}
	for (let i = 0; i < radical_glyphs.value.length; i++) {
		if (radical_glyphs.value[i].name === name) {
			glyph = radical_glyphs.value[i]
			return glyph
		}
	}
	for (let i = 0; i < stroke_glyphs.value.length; i++) {
		if (stroke_glyphs.value[i].name === name) {
			glyph = stroke_glyphs.value[i]
			return glyph
		}
	}
	for (let i = 0; i < comp_glyphs.value.length; i++) {
		if (comp_glyphs.value[i].name === name) {
			glyph = comp_glyphs.value[i]
			return glyph
		}
	}
	return glyph
}

// 获取字形类型，需要从四种字形类型中逐一遍历
// get glyph type
const getGlyphType = (uuid: string) => {
	for (let i = 0; i < glyphs.value.length; i++) {
		if (glyphs.value[i].uuid === uuid) {
			return Status.GlyphList
		}
	}
	for (let i = 0; i < radical_glyphs.value.length; i++) {
		if (radical_glyphs.value[i].uuid === uuid) {
			return Status.RadicalGlyphList
		}
	}
	for (let i = 0; i < stroke_glyphs.value.length; i++) {
		if (stroke_glyphs.value[i].uuid === uuid) {
			return Status.StrokeGlyphList
		}
	}
	for (let i = 0; i < comp_glyphs.value.length; i++) {
		if (comp_glyphs.value[i].uuid === uuid) {
			return Status.CompGlyphList
		}
	}
	return Status.Glyph
}

// // 当前编辑的字形
// // current edit glyph
// const editGlyph = computed(() => {
// 	if (!editGlyphUUID.value) return null
// 	// for (let i = 0; i < glyphs.value.length; i++) {
// 	//   if (editGlyphUUID.value === glyphs.value[i].uuid) {
// 	//     return glyphs.value[i]
// 	//   }
// 	// }
// 	// return null
// 	return getGlyphByUUID(editGlyphUUID.value)
// })

// 由于列表中有大量字符时，computed属性计算过慢，editCharacterFile改用手动赋值，不使用computed
const editGlyph = ref(null)
// 将列表中指定uuid的字符数据设置为editCharacterFile
const setEditGlyphByUUID = (uuid: string) => {
	let glyph = getGlyphByUUID(editGlyphUUID.value)
	editGlyph.value = R.clone(glyph)
}
const resetEditGlyph = () => {
	editGlyph.value = null
}
const updateGlyphListFromEditFile = () => {
	const glyphType = getGlyphType(editGlyph.value.uuid)
	let _glyphs = null
	if (glyphType === Status.GlyphList) {
		_glyphs = glyphs.value
	} else if (glyphType === Status.RadicalGlyphList) {
		_glyphs = radical_glyphs.value
	} else if (glyphType === Status.StrokeGlyphList) {
		_glyphs = stroke_glyphs.value
	} else if (glyphType === Status.CompGlyphList) {
		_glyphs = comp_glyphs.value
	}
	if (!_glyphs) return
	for (let i = 0; i < _glyphs.length; i++) {
		if (editGlyph.value.uuid === _glyphs[i].uuid) {
			_glyphs[i] = R.clone(editGlyph.value)
			componentsToContours(orderedListWithItemsForGlyph(_glyphs[i]), {
				unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
				descender: selectedFile.value.fontSettings.descender,
				advanceWidth: selectedFile.value.fontSettings.unitsPerEm,
			}, { x: 0, y: 0 }, false, false, true)
			break
		}
	}
}

// 当前选择的组件
// selected component, return null for no component selected, 'multi' for multi-selection.
const selectedComponent = computed(() => {
	if (!selectedComponents.value) return null
	if (selectedComponents.value.length === 0) {
		return null
	}
	if (selectedComponents.value.length === 1) {
		return selectedComponents.value[0]
	}
	return 'multi'
})

// 当前选择的组件uuid
// selected component uuid, return '' for no component selected, 'multi' for multi-selection.
const selectedComponentUUID = computed(() => {
	if (!selectedComponents.value) return ''
	if (selectedComponents.value.length === 0) {
		return ''
	}
	if (selectedComponents.value.length === 1) {
		return selectedComponents.value[0].uuid
	}
	return 'multi'
})

// 用在字符中的组件列表
// components list used for character
const usedComponents = computed(() => {
	const components = componentsForCurrentGlyph.value.filter((component: Component) => {
		return component.usedInCharacter === true
	})
	return components
})


// 选中的组件列表
// selected components
const selectedComponents = computed(() => {
	if (!editGlyphUUID.value) return null
	const components = editGlyph.value?.selectedComponentsUUIDs.map((uuid: string) => {
		// return selectedItemByUUID(editGlyph.value.components, uuid)
		return traverseComponents(editGlyph.value.components, uuid)
	})
	return components
})

// 遍历选择子组件
// recursively select sub components
const traverseComponents = (components, uuid) => {
	for (let i = 0; i < components.length; i++) {
		const comp = components[i]
		if (comp.uuid === uuid) {
			return comp
		} else if (comp.value.components && comp.value.components.length) {
			const sub_comp = traverseComponents(comp.value.components, uuid)
			if (sub_comp) {
				return sub_comp
			}
		}
	}
	return null
}


// 子组件列表
// sub components list
const SubComponents = computed(() => {
	if (!editGlyphUUID.value) return null
	if (!editGlyph.value?.selectedComponentsTree || !editGlyph.value?.selectedComponentsTree.length) return null
	let rootComponent = null
	for (let i = 0; i < editGlyph.value?.selectedComponentsTree.length - 1; i++) {
		const rootUUID = editGlyph.value?.selectedComponentsTree[i]
		if (!rootComponent) {
			rootComponent = selectedItemByUUID(editGlyph.value.components, rootUUID)
		} else {
			rootComponent = selectedItemByUUID(rootComponent.value.components, rootUUID)
		}
	}
	const components = rootComponent.value.components.map((item: {
		type: string,
		uuid: string,
	}) => {
		return selectedItemByUUID(rootComponent.value.components, item.uuid)
	})
	return components
})

// 子组件列表根组件
// root for sub components list
const SubComponentsRoot = computed(() => {
	if (!editGlyphUUID.value) return null
	if (!editGlyph.value?.selectedComponentsTree || !editGlyph.value?.selectedComponentsTree.length) return null
	let rootComponent = null
	for (let i = 0; i < editGlyph.value?.selectedComponentsTree.length - 1; i++) {
		const rootUUID = editGlyph.value?.selectedComponentsTree[i]
		if (!rootComponent) {
			rootComponent = selectedItemByUUID(editGlyph.value.components, rootUUID)
		} else {
			rootComponent = selectedItemByUUID(rootComponent.value.components, rootUUID)
		}
	}
	return rootComponent
})

// 子组件列表中选中的组件
// selected sub component
const selectedSubComponent = computed(() => {
	let rs = null
	if (!editGlyphUUID.value) {
		rs = null
	} else {
		if (!editGlyph.value?.selectedComponentsTree || !editGlyph.value?.selectedComponentsTree.length) {
			rs = null
		} else {
			let rootComponent = null
			for (let i = 0; i < editGlyph.value?.selectedComponentsTree.length - 1; i++) {
				const rootUUID = editGlyph.value?.selectedComponentsTree[i]
				if (!rootComponent) {
					rootComponent = selectedItemByUUID(editGlyph.value.components, rootUUID)
				} else {
					rootComponent = selectedItemByUUID(rootComponent.value.components, rootUUID)
				}
			}
			const componentUUID = editGlyph.value?.selectedComponentsTree[editGlyph.value?.selectedComponentsTree.length - 1]
			if (componentUUID !== 'null') {
				const component = selectedItemByUUID(rootComponent.value.components, componentUUID)
				rs = component
			}
		}
	}
	return rs
})

// 当前字符文件中包含的组件列表
// components for current glyph
const componentsForCurrentGlyph = computed(() => {
	if (!editGlyphUUID.value) return []
	return editGlyph.value.components
})

// 当前字形文件的排序组件（包含组件本身）列表
// ordered component list (with component itself) for current glyph file
const orderedListWithItemsForCurrentGlyph = computed(() => {
	if (!editGlyphUUID.value) return []
	return editGlyph.value.orderedList.map((item: {
		type: string,
		uuid: string,
	}) => {
		if (item.type === 'group') {
			return selectedItemByUUID(editGlyph.value.groups, item.uuid)
		}
		return selectedItemByUUID(editGlyph.value.components, item.uuid)
	})
})

// 指定字形文件的排序组件（包含组件本身）列表
// ordered component list (with component itself) for certain glyph file
const orderedListWithItemsForGlyph = (glyph) => {
	return glyph.orderedList.map((item: {
		type: string,
		uuid: string,
	}) => {
		if (item.type === 'group') {
			return selectedItemByUUID(glyph.groups, item.uuid)
		}
		return selectedItemByUUID(glyph.components, item.uuid)
	})
}

// 当前字符文件的排序组件（不包含组件本身）列表
// ordered component list (with NO component itself) for current character file
const orderedListForCurrentGlyph = computed(() => {
	if (!editGlyphUUID.value) return []
	return editGlyph.value.orderedList
})

// 选中的所有组件uuid列表
// selected components' uuids
const selectedComponentsUUIDs = computed(() => {
	if (!editGlyphUUID.value) return ''
	return editGlyph.value.selectedComponentsUUIDs
})

const getConstant = (uuid: string) => {
	let _constant = null
	constants.value.forEach((constant) => {
		if (constant.uuid === uuid) {
			_constant = constant
		}
	})
	return _constant
}

/**
 * 删除排序列表中的项目
 * @param uuid 要删除的组件项目uuid
 */
/**
 * remove item in ordered list
 * @param uuid uuid of component to be removed
 */
const removeOrderedItemForCurrentGlyph = (uuid: string) => {
	const index = (() => {
		for (let i = 0; i < editGlyph.value.orderedList.length; i++) {
			if (editGlyph.value.orderedList[i].uuid === uuid)
			return i
		}
		return -1
	})()
	if (index >= 0) {
		editGlyph.value.orderedList.splice(index, 1)
	}
}

/**
 * 删除组件
 * @param uuid 要被删除的组件uuid
 */
/**
 * remove component
 * @param uuid uuid of component to be removed
 */
const removeComponentForCurrentGlyph = (uuid: string) => {
	const index = (() => {
		for (let i = 0; i < editGlyph.value.components.length; i++) {
			if (editGlyph.value.components[i].uuid === uuid)
			return i
		}
		return -1
	})()
	removeOrderedItemForCurrentGlyph(uuid)
	if (editGlyph.value.glyph_script && editGlyph.value.glyph_script[uuid]) {
		delete editGlyph.value.glyph_script[uuid]
	}
	editGlyph.value.components.splice(index, 1)
}

/**
 * 插入组件
 * @param component 要被插入的组件
 * @param options 配置选项
 */
/**
 * 插入组件
 * @param component 要被插入的组件
 * @param options 配置选项
 */
const insertComponentForCurrentGlyph = (component: Component, options: { uuid: string, pos: string }) => {
	editGlyph.value.components.push(component)
	insertOrderedItemForCurrentGlyph({
		type: 'component',
		uuid: component.uuid,
	}, options)
	// setTool('select')
	// setSelectionForCurrentGlyph(component.uuid)
}

/**
 * 组件选择
 * @param uuid 被选中的组件uuid
 */
/**
 * component selection
 * @param uuid uuid of component to be selected
 */
const setSelectionForCurrentGlyph = (uuid: string) => {
	if (uuid) {
		if (enableMultiSelect.value) {
			const index = editGlyph.value.selectedComponentsUUIDs.indexOf(uuid)
			if (index === -1) {
				editGlyph.value.selectedComponentsUUIDs.push(uuid)
			} else {
				editGlyph.value.selectedComponentsUUIDs.splice(index, 1)
			}
		} else {
			editGlyph.value.selectedComponentsUUIDs = [uuid]
		}
	} else {
		editGlyph.value.selectedComponentsUUIDs = []
	}
}

/**
 * 修改子组件
 * @param uuid 被修改的组件uuid
 * @param options 配置选项
 */
/**
 * modify sub component
 * @param uuid uuid of component to be modified
 * @param options options
 */
const modifySubComponent = (options) => {
	if (!editGlyph.value?.selectedComponentsTree || !editGlyph.value?.selectedComponentsTree.length) {
		return
	} else {
		let rootComponent = null
		let subComp = null
		const components = R.clone(editGlyph.value?.components)
		for (let i = 0; i < editGlyph.value?.selectedComponentsTree.length - 1; i++) {
			const rootUUID = editGlyph.value?.selectedComponentsTree[i]
			if (!rootComponent) {
				rootComponent = selectedItemByUUID(components, rootUUID)
			} else {
				rootComponent = selectedItemByUUID(rootComponent.value.components, rootUUID)
			}
		}
		const componentUUID = editGlyph.value?.selectedComponentsTree[editGlyph.value?.selectedComponentsTree.length - 1]
		if (componentUUID !== 'null') {
			const component = selectedItemByUUID(rootComponent.value.components, componentUUID)
			subComp = component
		}
		const keys = Object.keys(options)
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]
			subComp[key] = options[key]
		}
		editGlyph.value.components = components
	}
}

/**
 * 更新指定字形的属性
 * @param uuid 要被更新的字形uuid
 * @param options 包含指定属性的配置选项
 */
/**
 * modify attrs of certain glyph
 * @param uuid uuid of glyph to be modified
 * @param options options contain attrs to be changed
 */
const modifyGlyph = (uuid: string, options: any) => {
	const glyph: ICustomGlyph = getGlyphByUUID(uuid)
	Object.keys(options).map((key: string) => {
		if (key === 'view') {
			Object.keys(options.view).map((viewKey: string) => {
				// @ts-ignore
				glyph.view[viewKey] = options.view[viewKey]
			})
		} else {
			// @ts-ignore
			glyph[key] = options[key]
		}
	})
	emitter.emit('renderGlyphPreviewCanvasByUUID', uuid)
}

/**
 * 修改组件
 * @param uuid 被修改的组件uuid
 * @param options 配置选项
 */
/**
 * modify components
 * @param uuid uuid of component to be modified
 * @param options options
 */
const modifyComponentForCurrentGlyph = (uuid: string, options: any) => {
	const components = R.clone(editGlyph.value.components)
	components.forEach((component: Component) => {
		if (component.uuid === uuid) {
			Object.keys(options).map((key: string) => {
				switch (key) {
					case 'type':
						component.type = options['type'] as string
						break
					case 'name':
						component.name = options['name'] as string
						break
					case 'lock':
						component.lock = options['lock'] as boolean
						break
					case 'visible':
						component.visible = options['visible'] as boolean
						break
					case 'x':
						(component as IComponent).x = options['x'] as number
						break
					case 'y':
						(component as IComponent).y = options['y'] as number
						break
					case 'w':
						(component as IComponent).w = options['w'] as number
						break
					case 'h':
						(component as IComponent).h = options['h'] as number
						break;
					case 'rotation':
						(component as IComponent).rotation = options['rotation'] as number
						break
					case 'flipX':
						(component as IComponent).flipX = options['flipX'] as boolean
						break
					case 'flipY':
						(component as IComponent).flipY = options['flipY'] as boolean
						break
					case 'usedInCharacter':
						(component as IComponent).usedInCharacter = options['usedInCharacter'] as boolean
						break
					case 'ox':
						(component as IGlyphComponent).ox = options['ox'] as number
						break
					case 'oy':
						(component as IGlyphComponent).oy = options['oy'] as number
						break
					case 'opacity':
						component.opacity = options['opacity'] as number
						break
					case 'value':
						Object.keys(options['value']).map((sub_key: string) => {
							//@ts-ignore
							component.value[sub_key] = options['value'][sub_key]
							if (sub_key === 'points') {
								const { x, y, w, h } = getBound(options['value'][sub_key].reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
									arr.push({
										x: point.x,
										y: point.y,
									})
									return arr
								}, []));
								(component as IComponent).x = x;
								(component as IComponent).y = y;
								(component as IComponent).w = w;
								(component as IComponent).h = h
							}
						})
						break
				}
			})
		}
		editGlyph.value.components = components
	})
	emitter.emit('renderGlyphPreviewCanvasByUUID', uuid)
}

/**
 * 修改组件
 * @param uuid 被修改的组件uuid
 * @param options 配置选项
 * @param glyphUUID glyph uuid
 */
/**
 * modify components
 * @param uuid uuid of component to be modified
 * @param options options
 * @param glyphUUID glyph uuid
 */
const modifyComponentForGlyph = (uuid: string, options: any, glyphUUID: string) => {
	const glyph = getGlyphByUUID(glyphUUID)
	const components = R.clone(glyph.components)
	components.forEach((component: Component) => {
		if (component.uuid === uuid) {
			Object.keys(options).map((key: string) => {
				switch (key) {
					case 'type':
						component.type = options['type'] as string
						break
					case 'name':
						component.name = options['name'] as string
						break
					case 'lock':
						component.lock = options['lock'] as boolean
						break
					case 'visible':
						component.visible = options['visible'] as boolean
						break
					case 'x':
						(component as IComponent).x = options['x'] as number
						break
					case 'y':
						(component as IComponent).y = options['y'] as number
						break
					case 'w':
						(component as IComponent).w = options['w'] as number
						break
					case 'h':
						(component as IComponent).h = options['h'] as number
						break;
					case 'rotation':
						(component as IComponent).rotation = options['rotation'] as number
						break
					case 'flipX':
						(component as IComponent).flipX = options['flipX'] as boolean
						break
					case 'flipY':
						(component as IComponent).flipY = options['flipY'] as boolean
						break
					case 'usedInCharacter':
						(component as IComponent).usedInCharacter = options['usedInCharacter'] as boolean
						break
					case 'ox':
						(component as IGlyphComponent).ox = options['ox'] as number
						break
					case 'oy':
						(component as IGlyphComponent).oy = options['oy'] as number
						break
					case 'value':
						Object.keys(options['value']).map((sub_key: string) => {
							//@ts-ignore
							component.value[sub_key] = options['value'][sub_key]
							if (sub_key === 'points') {
								const { x, y, w, h } = getBound(options['value'][sub_key].reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
									arr.push({
										x: point.x,
										y: point.y,
									})
									return arr
								}, []));
								(component as IComponent).x = x;
								(component as IComponent).y = y;
								(component as IComponent).w = w;
								(component as IComponent).h = h
							}
						})
						break
				}
			})
		}
		glyph.components = components
	})
	// emitter.emit('renderGlyphPreviewCanvasByUUID', uuid)
}

/**
 * 添加组
 * @param group 组
 */
/**
 * add group
 * @param group components group
 */
const addGroupForCurrentGlyph = (group: { type: string, uuid: string }) => {
	editGlyph.value.groups.push(group)
}

/**
 * 在指定字形的排序列表中添加项目
 * @param item 要被添加的项目
 */
/**
 * add ordered item into ordered list for certain glyph
 * @param item ordered item
 */
const addOrderedItemForGlyph = (glyphUUID: string, item: { type: string, uuid: string }) => {
	const glyph = getGlyphByUUID(glyphUUID)
	glyph.orderedList.push(item)
}

/**
 * 在当前字形的排序列表中添加项目
 * @param item 要被添加的项目
 */
/**
 * add ordered item into ordered list for current glyph
 * @param item ordered item
 */
const addOrderedItemForCurrentGlyph = (item: { type: string, uuid: string }) => {
	editGlyph.value.orderedList.push(item)
}


/**
 * 在指定字符文件的排序列表中插入项目
 * @param item 要被插入的项目
 * @param options 配置选项，包含插入位置信息
 */
/**
 * insert ordered item into ordered list
 * @param item ordered item
 * @param options options contain insert position
 */
const insertOrderedItemForCurrentGlyph = (
	item: { type: string, uuid: string },
	options: { uuid: string, pos: string },
) => {
	const index = (() => {
		for(let i = 0; i < editGlyph.value.orderedList.length; i++) {
			if (editGlyph.value.orderedList[i].uuid === options.uuid) return i
		}
	})()
	if (options.pos === 'prev') {
		editGlyph.value.orderedList.splice(index, 0, item)
	}
	if (options.pos === 'next') {
		editGlyph.value.orderedList.splice(index as number + 1, 0, item)
	}
}

/**
 * 设置排序列表
 * @param list 排序列表
 */
/**
 * set ordered list
 * @param list ordered list
 */
const setOrderedListForCurrentGlyph = (list: Array<{ type: string, uuid: string }>) => {
	editGlyph.value.orderedList = list
}

/**
 * 设置当前正在编辑的字形
 * @param uuid 字符文件uuid
 */
/**
 * set editing glyph
 * @param uuid uuid of editing glyph
 */
const setEditGlyphUUID = (uuid: string) => {
	editGlyphUUID.value = uuid
}

/**
 * 在当前字体文件中添加字符文件
 * @param character 字符文件
 */
/**
 * add character for current font file
 * @param character character file
 */
const addGlyph = (glyph: ICustomGlyph, type: Status) => {
	if (type === Status.GlyphList) {
		glyphs.value.push(glyph)
	} else if (type === Status.StrokeGlyphList) {
		stroke_glyphs.value.push(glyph)
	} else if (type === Status.RadicalGlyphList) {
		radical_glyphs.value.push(glyph)
	} else if (type === Status.CompGlyphList) {
		comp_glyphs.value.push(glyph)
	}
}

/**
 * 删除字形
 * @param uuid 字形uuid
 */
/**
 * remove glyph
 * @param uuid glyph's uuid
 */
const removeGlyph = (uuid: string, type: Status) => {
	if (type === Status.GlyphList) {
		for (let i = 0; i < glyphs.value.length; i++) {
			if (glyphs.value[i].uuid === uuid) {
				glyphs.value.splice(i, 1)
				return
			}
		}
	} else if (type === Status.StrokeGlyphList) {
		for (let i = 0; i < stroke_glyphs.value.length; i++) {
			if (stroke_glyphs.value[i].uuid === uuid) {
				stroke_glyphs.value.splice(i, 1)
				return
			}
		}
	} else if (type === Status.RadicalGlyphList) {
		for (let i = 0; i < radical_glyphs.value.length; i++) {
			if (radical_glyphs.value[i].uuid === uuid) {
				radical_glyphs.value.splice(i, 1)
				return
			}
		}
	} else if (type === Status.CompGlyphList) {
		for (let i = 0; i < comp_glyphs.value.length; i++) {
			if (comp_glyphs.value[i].uuid === uuid) {
				comp_glyphs.value.splice(i, 1)
				return
			}
		}
	}
}

/**
 * 在指定字形文件中添加组件列表
 * @param glyphUUID 字形文件uuid
 * @param components 要被添加的组件列表
 */
/**
 * add components to certain glyph
 * @param glyphUUID uuid for glyph
 * @param components components to be added
 */
const addComponentsForGlyph = (glyphUUID: string, components: Array<IComponent>) => {
	const glyph = getGlyphByUUID(glyphUUID)
	components.forEach((component) => {
		addComponentForGlyph(glyphUUID, component)
	})
}

/**
 * 在当前字形文件中添加组件列表
 * @param components 要被添加的组件列表
 */
/**
 * add components to current glyph
 * @param components components to be added
 */
const addComponentsForCurrentGlyph = (components: Array<IComponent>) => {
	components.forEach((component) => {
		addComponentForCurrentGlyph(component)
	})
}

/**
 * 在指定字形中添加组件
 * @param glyphUUID uuid for glyph
 * @param component 要被添加的组件
 */
/**
 * add component for certain glyph
 * @param glyphUUID uuid for glyph
 * @param component component to be added
 */
const addComponentForGlyph = (glyphUUID: string, component: Component) => {
	const glyph = getGlyphByUUID(glyphUUID)
	glyph.components.push(component)
	addOrderedItemForGlyph(glyphUUID, {
		type: 'component',
		uuid: component.uuid,
	})
	// if (component.type === 'glyph') {
	// 	setTool('glyphDragger')
	// } else {
	// 	setTool('select')
	// }
	// setSelectionForCurrentGlyph(component.uuid)
}

/**
 * 在当前字形中添加组件
 * @param component 要被添加的组件
 */
/**
 * add component for current glyph
 * @param component component to be added
 */
const addComponentForCurrentGlyph = (component: Component) => {
	editGlyph.value.components.push(component)
	addOrderedItemForCurrentGlyph({
		type: 'component',
		uuid: component.uuid,
	})
	// if (component.type === 'glyph') {
	// 	setTool('glyphDragger')
	// } else {
	// 	setTool('select')
	// }
	setSelectionForCurrentGlyph(component.uuid)
}

const scripts_map = ref({})

// 缓存常用字形组件脚本
const tempScript = (glyph) => {
	if (glyph.type !== 'text' && glyph.type !== 'icon') {
		// 不是字符或图标，是字形组件
		if (glyph.script_reference) {
			const origin_glyph = getGlyphByUUID(glyph.script_reference)
			if (origin_glyph && origin_glyph.script) {
				scripts_map.value[glyph.script_reference] = origin_glyph.script
			}
		}
	}
	for (let i = 0; i < glyph.components.length; i++) {
		const component = glyph.components[i]
		if (component.type === 'glyph') {
			// 组件类型为glyph
			tempScript(component.value)
		}
	}
}

const getScript = (glyph) => {
	if (glyph.script) return glyph.script
	else if (glyph.script_reference) {
		if (scripts_map[glyph.script_reference]) return scripts_map[glyph.script_reference]
		else {
			const origin_glyph = getGlyphByUUID(glyph.script_reference)
			if (origin_glyph.script) return origin_glyph.script
		}
	}
	return null
}

// 执行字形脚本
// execute glyph script
const executeScript = (targetGlyph) => {
	try {
		// 字形实例缓存了数据，表示字形正在拖拽编辑中，则返回不执行脚本运行操作
		if (targetGlyph._o && targetGlyph._o.tempData) return

		if (targetGlyph.skeleton) {
			const strokeFn = strokeFnMap[targetGlyph.skeleton.type]
			if (strokeFn) {
				strokeFn.instanceBasicGlyph(targetGlyph)
				if (targetGlyph.skeleton.onSkeletonBind) {
					strokeFn.updateSkeletonListenerBeforeBind(targetGlyph._o)
				} else {
					strokeFn.updateSkeletonListenerAfterBind(targetGlyph._o)
				}
				updateSkeletonTransformation(targetGlyph._o)
				// updateGlyphWeight(targetGlyph)
				return
			}
		}

		const glyphInstance = new CustomGlyph(targetGlyph)
		const _glyph = glyphInstance._glyph
		for (let i = 0; i < targetGlyph.components.length; i++) {
			if (targetGlyph.components[i].type === 'glyph') {
				executeScript(targetGlyph.components[i].value)
			}
		}
		window.glyph = glyphInstance
		constantsMap.update(constants.value)
		window.constantsMap = constantsMap
		try {
			const script = getScript(targetGlyph)
			if (script) {
				//const fn = new Function(`${targetGlyph.script}\nscript_${targetGlyph.uuid.replaceAll('-', '_')} (glyph, constantsMap, FP)`)
				const fn = new Function(`${script}\nscript_${targetGlyph.uuid.replaceAll('-', '_')} (glyph, constantsMap, FP)`)
				fn()
			}
		} catch (e) {
			console.error(e)
		}
		// glyph_script是一个map，key为glyph的component uuid，用于对component的操作
		// let script = `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').ox = (${unitsPerEm} - window.glyph.getRatioLayout('width')) / 2 + window.glyph.getRatioLayout('width') * ${ratio_width}; }`
		// script += `if (window.glyph.getComponent('${comp.name}')) { window.glyph.getComponent('${comp.name}').oy = (${unitsPerEm} - window.glyph.getRatioLayout('height')) / 2 + window.glyph.getRatioLayout('height') * ${ratio_height}; }`
		if (targetGlyph && targetGlyph.glyph_script) {
			const keys = Object.keys(targetGlyph.glyph_script)
			for (let i = 0; i < keys.length; i++) {
				const script = targetGlyph.glyph_script[keys[i]]
				const fn = new Function(`${script}`)
				fn()
			}
		}

		// param_script是对glyph本身参数的操作，是一个map，key值为parameter name
		// `window.glyph.setParam('${parameter.name}',window.glyph.getRatioLayout('${value}') / ${layout} * ${parameter.value});`
		if (targetGlyph && targetGlyph.param_script) {
			const keys = Object.keys(targetGlyph.param_script)
			for (let i = 0; i < keys.length; i++) {
				const script = targetGlyph.param_script[keys[i]]
				const fn = new Function(`${script}`)
				fn()
			}
		}

		// system_script编辑window.comp_glyph参数
		// `window.comp_glyph.setParam('${parameter.name}',window.glyph.getRatioLayout('${parameter.ratio}') / ${layout} * ${value});`
		targetGlyph?.components?.map(component => {
			// @ts-ignore
			window.comp_glyph = new CustomGlyph(component.value)
			if (component.value && (component.value as ICustomGlyph).system_script) {
				const keys = Object.keys((component.value as ICustomGlyph).system_script)
				for (let i = 0; i < keys.length; i++) {
					const script = (component.value as ICustomGlyph).system_script[keys[i]]
					window.glyph = glyphInstance
					const fn = new Function(`${script}`)
					fn()
				}
			}
			window.comp_glyph = null
		})

		window.glyph = null
		window.constantsMap = null
	} catch (e) {
		console.warn(e)
	}
}

// 获取参数绑定选项
// get ratio option
const getRatioOptions = (glyph: ICustomGlyph) => {
	const options: Array<{
		key: number | string,
		value: string,
		label: string,
		uuid: string,
		type: string,
	}> = [{
		key: 0,
		value: 'DEFAULT',
		label: 'DEFAULT',
		uuid: '',
		type: '',
	}]
	if (glyph.layout) {
		if (glyph.layout.type === 'rect') {
			options.push({
				key: 1,
				value: 'width',
				label: 'width',
				uuid: glyph.uuid,
				type: glyph.type,
			})
			options.push({
				key: 2,
				value: 'height',
				label: 'height',
				uuid: glyph.uuid,
				type: glyph.type,
			})
		}
	} else if (glyph.parent && glyph.parent.type === 'system' && (glyph.parent as ICustomGlyph).layout) {
		if ((glyph.parent as ICustomGlyph).layout.type === 'rect') {
			options.push({
				key: 1,
				value: 'width',
				label: 'width',
				uuid: glyph.parent.uuid,
				type: glyph.parent.type,
			})
			options.push({
				key: 2,
				value: 'height',
				label: 'height',
				uuid: glyph.parent.uuid,
				type: glyph.parent.type,
			})
		}
	} else if (glyph.parent && (glyph.parent.type === 'text' || glyph.parent.type === 'icon') && (glyph.parent as ICharacterFile).info && (glyph.parent as ICharacterFile).info.layoutTree) {
		const layouts = findLeafNodes((glyph.parent as ICharacterFile).info?.layoutTree)
		layouts.map((layout, index) => {
			options.push({
				key: `${index}-1`,
				value: `${layout.id}-w`,
				label: `${layout.id}-w`,
				uuid: glyph.parent.uuid,
				type: glyph.parent.type,
			})
			options.push({
				key: `${index}-2`,
				value: `${layout.id}-h`,
				label: `${layout.id}-h`,
				uuid: glyph.parent.uuid,
				type: glyph.parent.type,
			})
		})
	}
	return options
}

// 获取指定布局绑定选项
// get ratio layout
const getRatioLayout = (glyph, option) => {
	let rs = null
	if (!glyph.parent && glyph.layout) {
		rs = glyph.layout.params[option]
	} else if (glyph.parent && glyph.parent.type === 'system' && (glyph.parent as ICustomGlyph).layout) {
		rs = (glyph.parent as ICustomGlyph).layout.params[option]
	}
	else if (glyph.parent && (glyph.parent.type === 'text' || glyph.parent.type === 'icon') && (glyph.parent as ICharacterFile).info && (glyph.parent as ICharacterFile).info.layoutTree) {
		const option_values = option.split('-')
		const layoutValue = option_values.splice(option_values.length - 1, 1)[0]
		const layoutID = option_values.join('-')
		const layouts = findLeafNodes((glyph.parent as ICharacterFile).info?.layoutTree)
		layouts.map((layout) => {
			if (layout.id === layoutID) {
				rs = layout.rect[layoutValue]
			}
		})
	}
	return rs
}

// 获取指定布局绑定选项
// get ratio layout
const getRatioLayout2 = (glyph, option) => {
	let rs = null
	if (glyph.layout) {
		rs = glyph.layout.params[option]
	}
	return rs
}

const findLeafNodes = (tree) => {
	const leafNodes = []

	const traverse = (node) => {
		if (!node.children || node.children.length === 0) {
			leafNodes.push(node)
		} else {
			node.children.forEach(child => traverse(child))
		}
	}

	tree.forEach(node => traverse(node))
	return leafNodes
}

// 删除字符
// delete character
const deleteCharacter = (e: MouseEvent, uuid: string) => {
	e.stopPropagation()
	removeGlyph(uuid, getGlyphType(uuid))
	deleteGlyphTemplate(uuid, editStatus.value)
}

// 编辑字符，进入字符编辑器
// go to glyph editor
const editGlyphFile = async (uuid: string) => {
	// setEditGlyphUUID(uuid)
	// setPrevStatus(editStatus.value)
	// setEditStatus(Status.Glyph)
	loading.value = true
	total.value = 0
	await nextTick()
	setTimeout(() => {
		setEditGlyphUUID(uuid)
		setEditGlyphByUUID(editGlyphUUID.value)
		setPrevStatus(editStatus.value)
		setEditStatus(Status.Glyph)
		loading.value = false
	}, 500)
}

// 重命名字形
// rename character
const renameCharacter = (e: MouseEvent, uuid: string) => {
	e.stopPropagation()
	editedGlyphUUID.value = uuid
	setEditGlyphDialogVisible(true)
}

// 复制字形
// rename character
const copyCharacter = (e: MouseEvent, uuid: string) => {
	e.stopPropagation()
	copiedGlyphUUID.value = uuid
	setCopyGlyphDialogVisible(true)
}

// 生成字形模板
// generate glyph template
const generateGlyphTemplate = (glyph) => {
	const root = document.getElementById('glyph-template').querySelector('.glyph').cloneNode(true);
	(root as HTMLElement).className = `glyph glyph-${glyph.uuid}`;
	(root as HTMLElement).querySelector('.preview-canvas').id = `preview-canvas-${glyph.uuid}`;
	(root as HTMLElement).querySelector('.name').innerHTML = `${glyph.name}`;
	//@ts-ignore
	(root as HTMLElement).querySelector('.edit-icon').addEventListener('click', (e) => renameCharacter(e, glyph.uuid));
	//@ts-ignore
	(root as HTMLElement).querySelector('.copy-icon').addEventListener('click', (e) => copyCharacter(e, glyph.uuid));
	//@ts-ignore
	(root as HTMLElement).querySelector('.delete-icon').addEventListener('click', (e) => deleteCharacter(e, glyph.uuid));
	(root as HTMLElement).addEventListener('click', () => editGlyphFile(glyph.uuid))
	return root
}

const selected_glyphs: Ref<Array<ICustomGlyph>> = ref([])
const multi_glyph_selection: Ref<Boolean> = ref(false)

// 添加选中字形
// add selected glyph
const addSelectedGlyph = (glyph: ICustomGlyph) => {
	if (onStrokeReplacement.value) {
		setReplacementStroke(glyph.uuid)
		onStrokeReplacement.value = false
		glyphComponentsDialogVisible2.value = false
	} else {
		const _glyph = R.clone(glyph)
		//_glyph.parent = editStatus.value === Status.Edit ? editCharacterFile.value : editGlyph.value
		_glyph.parent_reference = getParentInfo(editStatus.value === Status.Edit ? editCharacterFile.value : editGlyph.value)
		_glyph.script = null
		_glyph.script_reference = _glyph.uuid
		const component: IGlyphComponent = {
			uuid: genUUID(),
			type: 'glyph',
			name: glyph.name + Date.now().toString().slice(9),
			lock: false,
			visible: true,
			value: _glyph,
			ox: selectedFile.value.width / 2 - 1000 / 2,
			oy: selectedFile.value.height / 2 - 1000 / 2,
			usedInCharacter: true,
		}
		executeScript(component.value)
		if (editStatus.value === Status.Edit) {
			addComponentForCurrentCharacterFile(component)
		} else if (editStatus.value === Status.Glyph) {
			addComponentForCurrentGlyph(component)
		}
		if (tool.value !== 'glyphDragger') {
			setTool('glyphDragger')
		}
		glyphComponentsDialogVisible2.value = false
	}
}

// 选择字形
// select glyph
const selectGlyph = (uuid: string) => {
	if (!glyphComponentsDialogVisible2.value) return
	const glyph = getGlyphByUUID(uuid)
	if (multi_glyph_selection.value) {
		selected_glyphs.value.push(glyph)
	} else {
		addSelectedGlyph(glyph)
	}
}

// 生成选择字形列表中的字形模板
// generate glyph selection template
const generateGlyphSelectionTemplate = (glyph) => {
	const root = document.getElementById('glyph-template').querySelector('.glyph').cloneNode(true);
	(root as HTMLElement).className = `glyph glyph-${glyph.uuid}`;
	(root as HTMLElement).querySelector('.preview-canvas').id = `preview-canvas-${glyph.uuid}`;
	(root as HTMLElement).querySelector('.name').innerHTML = `${glyph.name}`;
	(root as HTMLElement).addEventListener('click', () => selectGlyph(glyph.uuid))
	return root
}

// 删除字形模板
// delete glyph template
const deleteGlyphTemplate = (uuid, type: Status) => {
	let wrapper = document.getElementById('glyph-render-list')
	let selection_wrapper = document.getElementById('glyph-components-wrapper')
	if (type === Status.StrokeGlyphList) {
		wrapper = document.getElementById('stroke-glyph-render-list')
		selection_wrapper = document.getElementById('stroke-glyph-components-wrapper')
	} else if (type === Status.RadicalGlyphList) {
		wrapper = document.getElementById('radical-glyph-render-list')
		selection_wrapper = document.getElementById('radical-glyph-components-wrapper')
	} else if (type === Status.CompGlyphList) {
		wrapper = document.getElementById('comp-glyph-render-list')
		selection_wrapper = document.getElementById('comp-glyph-components-wrapper')
	}
	const root = wrapper.querySelector(`.glyph-${uuid}`)
	wrapper.removeChild(root)
	const root2 = selection_wrapper.querySelector(`.glyph-${uuid}`)
	selection_wrapper.removeChild(root2)
}

// 在选择字形列表中添加字形模板
// add selection glyph template
const addSelectionGlyphTemplate = (glyph, type: Status) => {
	const selection_el = generateGlyphSelectionTemplate(glyph)
	let selection_wrapper = document.getElementById('glyph-components-wrapper')
	if (type === Status.StrokeGlyphList) {
		selection_wrapper = document.getElementById('stroke-glyph-components-wrapper')
	} else if (type === Status.RadicalGlyphList) {
		selection_wrapper = document.getElementById('radical-glyph-components-wrapper')
	} else if (type === Status.CompGlyphList) {
		selection_wrapper = document.getElementById('comp-glyph-components-wrapper')
	}
	selection_wrapper.appendChild(selection_el)
}

// 在选择字形列表中删除字形模板
// delete selection glyph template
const deleteSelectionGlyphTemplate = (uuid, type: Status) => {
	let selection_wrapper = document.getElementById('glyph-components-wrapper')
	if (type === Status.StrokeGlyphList) {
		selection_wrapper = document.getElementById('stroke-glyph-components-wrapper')
	} else if (type === Status.RadicalGlyphList) {
		selection_wrapper = document.getElementById('radical-glyph-components-wrapper')
	} else if (type === Status.CompGlyphList) {
		selection_wrapper = document.getElementById('comp-glyph-components-wrapper')
	}
	const selection_el = selection_wrapper.querySelector(`.glyph-${uuid}`)
	selection_wrapper.removeChild(selection_el)
}

// 添加字形模板
// add glyph template
const addGlyphTemplate = (glyph, type: Status) => {
	const el = generateGlyphTemplate(glyph)
	const selection_el = generateGlyphSelectionTemplate(glyph)
	let selection_wrapper = document.getElementById('glyph-components-wrapper')
	let wrapper = document.getElementById('glyph-render-list')
	if (type === Status.StrokeGlyphList) {
		wrapper = document.getElementById('stroke-glyph-render-list')
		selection_wrapper = document.getElementById('stroke-glyph-components-wrapper')
	} else if (type === Status.RadicalGlyphList) {
		wrapper = document.getElementById('radical-glyph-render-list')
		selection_wrapper = document.getElementById('radical-glyph-components-wrapper')
	} else if (type === Status.CompGlyphList) {
		wrapper = document.getElementById('comp-glyph-render-list')
		selection_wrapper = document.getElementById('comp-glyph-components-wrapper')
	}
	const defaultEl = wrapper.querySelector('.default-glyph')
	if (defaultEl) {
		wrapper.insertBefore(el, defaultEl)
	}
	selection_wrapper.appendChild(selection_el)
}

// 清除字形列表
// clear glyph render list
const clearGlyphRenderList = (type: Status) => {
	let wrapper = document.getElementById('glyph-render-list')
	if (type === Status.StrokeGlyphList) {
		wrapper = document.getElementById('stroke-glyph-render-list')
	} else if (type === Status.RadicalGlyphList) {
		wrapper = document.getElementById('radical-glyph-render-list')
	} else if (type === Status.CompGlyphList) {
		wrapper = document.getElementById('comp-glyph-render-list')
	}
	if (!wrapper) return
	const defaultEl = document.getElementById('default-glyph-template').querySelector('.default-glyph').cloneNode(true)
	defaultEl.addEventListener('click', () => setAddGlyphDialogVisible(true))
	wrapper.innerHTML = ''
	wrapper.appendChild(defaultEl)
}

// 清除选择字形列表
// clear selection glyph render list
const clearSelectionGlyphRenderList = (type?: Status) => {
	let selection_wrapper = document.getElementById('glyph-components-wrapper')
	if (type === Status.StrokeGlyphList) {
		selection_wrapper = document.getElementById('stroke-glyph-components-wrapper')
	} else if (type === Status.RadicalGlyphList) {
		selection_wrapper = document.getElementById('radical-glyph-components-wrapper')
	} else if (type === Status.CompGlyphList) {
		selection_wrapper = document.getElementById('comp-glyph-components-wrapper')
	}
	if (!type) {
		clearSelectionGlyphRenderList(Status.GlyphList)
		clearSelectionGlyphRenderList(Status.StrokeGlyphList)
    clearSelectionGlyphRenderList(Status.RadicalGlyphList)
    clearSelectionGlyphRenderList(Status.CompGlyphList)
		return
	}
	selection_wrapper.innerHTML = ''
}

export {
	glyphs,
	constants,
	editGlyphUUID,
	editGlyph,
	selectedComponent,
	selectedComponents,
	selectedComponentUUID,
	usedComponents,
	componentsForCurrentGlyph,
	orderedListWithItemsForCurrentGlyph,
	orderedListWithItemsForGlyph,
	orderedListForCurrentGlyph,
	selectedComponentsUUIDs,
	removeComponentForCurrentGlyph,
	insertComponentForCurrentGlyph,
	modifyComponentForCurrentGlyph,
	addGroupForCurrentGlyph,
	setOrderedListForCurrentGlyph,
	setSelectionForCurrentGlyph,
	setEditGlyphUUID,
	addGlyph,
	removeGlyph,
	addComponentForCurrentGlyph,
	modifyGlyph,
	getConstant,
	constantsMap,
	initGlyphEnvironment,
	executeScript,
	getRatioOptions,
	getRatioLayout,
	getRatioLayout2,
	generateGlyphTemplate,
	deleteGlyphTemplate,
	addGlyphTemplate,
	clearGlyphRenderList,
	stroke_glyphs,
	radical_glyphs,
	comp_glyphs,
	getGlyphByUUID,
	getGlyphType,
	generateGlyphSelectionTemplate,
	multi_glyph_selection,
	selected_glyphs,
	deleteSelectionGlyphTemplate,
	addSelectionGlyphTemplate,
	selectedParam,
	parameterCompKey,
	selectedParamType,
	constantGlyphMap,
	modifyComponentForGlyph,
	SubComponents,
	SubComponentsRoot,
	selectedSubComponent,
	modifySubComponent,
	getGlyphByName,
	clearSelectionGlyphRenderList,
	addComponentsForGlyph,
	getParentInfo,
	scripts_map,
	tempScript,
	skeletonOptions,
	updateGlyphListFromEditFile ,
	resetEditGlyph,
	addComponentsForCurrentGlyph,
}