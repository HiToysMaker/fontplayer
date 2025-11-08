import { gridSettings, loaded, loading, setGlyphDraggerTool, setTool, total } from './global'
import { ElMessage } from 'element-plus'
import * as R from 'ramda'
import { ref, computed, type Ref, reactive, nextTick } from 'vue'
import localForage from 'localforage'
import { getBound } from '../../utils/math'
import type { IPoint } from './pen'
import { ICustomGlyph, IGlyphComponent, constants, constantsMap, executeScript } from './glyph'
import { Character } from '../programming/Character'
import { emitter } from '../Event/bus'
import { CustomGlyph } from '../programming/CustomGlyph'
import { Status, editStatus, setEditStatus, setPrevStatus } from './font'
import { copiedCharacterUUID, editedCharacterUUID, setAddTextDialogVisible, setCopyCharacterDialogVisible, setEditCharacterDialogVisible } from './dialogs'
import type {
	ILine,
	ICubicBezierCurve,
	IQuadraticBezierCurve,
} from '../../fontManager'
import { componentsToContours } from '../../features/font'

// 字体文件列表数据结构
// font files list data struct
export interface IFiles {
	value: Array<IFile>;
}

// 字体文件数据结构
// font file data struct
export interface IFile {
	uuid: string;
	characterList: Array<ICharacterFile>;
	name: string;
	width: number;
	height: number;
	saved: boolean;
	iconsCount: number;
	fontSettings?: IFontSettings;
	glyphs?: Array<ICustomGlyph>;
	stroke_glyphs?: Array<ICustomGlyph>;
	radical_glyphs?: Array<ICustomGlyph>;
	comp_glyphs?: Array<ICustomGlyph>;
	variants?: IVariants;
}

interface IVariants {
	axes: Array<IVariationAxis>;
	instances: Array<IInstance>;
}

interface IVariationAxis {
	axisTag: string;
	minValue: number;
	defaultValue: number;
	maxValue: number;
	flags: number;
	name: string;
	nameID?: number;
	uuid: string;
}

interface IInstance {
	subfamilyNameID?: number;
	subfamilyName?: string;
	flags: number;
	coordinates: number;
	postScriptNameID?: number;
}

// 字体设置数据结构
// font settings data struct
export interface IFontSettings {
	unitsPerEm: number;
	ascender: number;
	descender: number;
	tables?: any;
}

// 字符文件数据结构
// character file data struct
export interface ICharacterFile {
	uuid: string;
	type: string;
	character: ICharacter;
	fontPic?: HTMLCanvasElement | null;
	components: Array<Component>;
	groups: Array<{
		type: string,
		uuid: string,
	}>;
	orderedList: Array<{
		type: string,
		uuid: string,
	}>;
	// selectedComponentsTree为当前选择树，比如[部首uuid, 笔画uuid]
	selectedComponentsTree?: Array<string>;
	selectedComponentsUUIDs?: Array<string>;
	view: {
		zoom: number;
		translateX: number;
		translateY: number;
	};
	script?: string;
	glyph_script?: any;//Map<string, string>;
	info?: {
		gridSettings?: {
			dx: number;
			dy: number;
			centerSquareSize: number;
			size: number;
			default?: boolean;
		};
		useSkeletonGrid?: boolean;
		layout?: string;
		layoutTree?: any;
		metrics?: {
			lsb?: number;
			advanceWidth?: number;
			useDefaultValues?: boolean;
		};
	};
	_o?: Character;
	objData?: any;
	overlap_removed_contours?: any;
	final_components?: Array<IComponent>;
}

// 字符信息
// character info
export interface ICharacter {
	uuid: string;
	text: string;
	unicode: string;
}

// 字符组件数据结构，包含变换等基础信息，与包含图形信息的IComponentValue不同
// component data struct, contains transform info, etc, different with IComponentValue
export interface IComponent {
	uuid: string;
	type: string;
	name: string;
	lock: boolean;
	visible: boolean;
	value: IComponentValue;
	x: number;
	y: number;
	w: number;
	h: number;
	rotation: number;
	flipX: boolean;
	flipY: boolean;
	usedInCharacter: boolean;
	opacity?: number;
	fillColor?: string;
}

// 字符图形组件信息枚举
// enum of basic element info for component
export enum IComponentValue {
	IPenComponent,
	IPolygonComponent,
	IRectangleComponent,
	IEllipseComponent,
	IPictureComponent,
	ICustomGlyph,
}

// 钢笔组件
// pen component
export interface IPenComponent {
	points: any;
	strokeColor: string;
	fillColor: string;
	closePath: boolean;
	editMode: boolean;
	contour?: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>;
	preview?: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>;
}

// 多边形组件
// polygon component
export interface IPolygonComponent {
	points: any;
	strokeColor: string;
	fillColor: string;
	closePath: boolean;
	contour?: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>;
	preview?: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>;
}

// 长方形组件
// rectangle component
export interface IRectangleComponent {
	width: number;
	height: number;
	strokeColor: string;
	fillColor: string;
	closePath: boolean;
	contour?: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>;
	preview?: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>;
}

// 椭圆组件
// ellipse component
export interface IEllipseComponent {
	radiusX: number;
	radiusY: number;
	strokeColor: string;
	fillColor: string;
	closePath: boolean;
	contour?: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>;
	preview?: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>;
}

// 图形组件
// picture component
export interface IPictureComponent {
	data: string;
	img: HTMLImageElement;
	pixels: Array<number> | Uint8ClampedArray;
	originImg: HTMLImageElement;
	pixelMode: boolean;
	contour?: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>;
	preview?: Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>;
}

// 组件列表
// component list
export interface IComponents {
	value: Array<IComponent>;
}

// 顺序排列组件列表，仅包含type与uuid
// ordered component list, but only contains type and uuid for convenience, user can change the order by dragging components.
export interface IOrderedList {
	value: Array<{
		type: string,
		uuid: string,
	}>
}

// 分组列表
// groups
export interface IGroups {
	value: Array<{
		uuid: string,
		items: Array<string>,
	}>
}

// 剪贴板
// clipboard
export interface IClipBoard {
	value: Array<Component>;
}

export type Component = IComponent | IGlyphComponent

/**
 * 实用方法，从数组中选择指定uuid的项目
 * @param arr 数组
 * @param uuid uuid
 * @returns 指定项目
 */
/**
 * util method for select certain item by id from an array
 * @param arr array
 * @param uuid uuid
 * @returns certain item
 */
const selectedItemByUUID = (arr: Array<any>, uuid: string) => {
	let item = null
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].uuid === uuid) {
			item = arr[i]
		}
	}
	return item
}


/**
 * state
 */

// 字体文件列表
// font file list
const files: any = reactive({
	value: [] as Array<IFile>,
})

// 当前选择的字体文件uuid
// selected font file uuid
const selectedFileUUID: Ref<string> = ref('')

// 剪贴板
// clipboard
const clipBoard: any = reactive({
	value: [] as Array<Component>,
})

// 当前编辑的字符文件uuid
// current edting character file uuid
const editCharacterFileUUID: Ref<string> = ref('')

// 是否支持多选
// whether enable multi select
const enableMultiSelect: Ref<boolean> = ref(false)


/**
 * getters
 */

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
	const components = orderedListWithItemsForCurrentCharacterFile.value.filter((component: Component) => {
		return !!component.usedInCharacter
	})
	return components
})

// 当前编辑的字符文件
// current edit character file
// const editCharacterFile = computed(() => {
// 	if (!selectedFileUUID.value) return null
// 	const characters = selectedFile.value.characterList
// 	for (let i = 0; i < characters.length; i++) {
// 		if (editCharacterFileUUID.value === characters[i].uuid) {
// 			return characters[i]
// 		}
// 	}
// 	return null
// })
// 由于列表中有大量字符时，computed属性计算过慢，editCharacterFile改用手动赋值，不使用computed
const editCharacterFile = ref(null)
// 将列表中指定uuid的字符数据设置为editCharacterFile
const setEditCharacterFileByUUID = (uuid: string) => {
	let character = null
	const characters = selectedFile.value.characterList
	for (let i = 0; i < characters.length; i++) {
		if (editCharacterFileUUID.value === characters[i].uuid) {
			character = characters[i]
			break
		}
	}
	editCharacterFile.value = R.clone(character)
}
const resetEditCharacterFile = () => {
	editCharacterFile.value = null
}
const updateCharacterListFromEditFile = () => {
	const characters = selectedFile.value.characterList
	for (let i = 0; i < characters.length; i++) {
		if (editCharacterFileUUID.value === characters[i].uuid) {
			characters[i] = R.clone(editCharacterFile.value)
			componentsToContours(orderedListWithItemsForCharacterFile(characters[i]), {
				unitsPerEm: selectedFile.value.fontSettings.unitsPerEm,
				descender: selectedFile.value.fontSettings.descender,
				advanceWidth: selectedFile.value.fontSettings.unitsPerEm,
			}, { x: 0, y: 0 }, false, false, true)
			break
		}
	}
}

// 当前选择的字体文件
// selected font file
const selectedFile = computed(() => {
	if (!selectedFileUUID.value) return null
	return selectedItemByUUID(files.value, selectedFileUUID.value)
})

// 当前选择的字体文件中的字符列表
// character file list
const characterList = computed(() => {
	if (!selectedFileUUID.value) return null
	const file = selectedItemByUUID(files.value, selectedFileUUID.value)
	return file.characterList
})

// 选中的组件列表
// selected components
const selectedComponents = computed(() => {
	if (!selectedFileUUID.value) return null
	const characterFile = editCharacterFile.value
	const components = characterFile?.selectedComponentsUUIDs.map((uuid: string) => {
		// return selectedItemByUUID(characterFile.components, uuid)
		return traverseComponents(characterFile.components, uuid)
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
	if (!selectedFileUUID.value) return null
	const characterFile = editCharacterFile.value
	if (!characterFile?.selectedComponentsTree || !characterFile?.selectedComponentsTree.length) return null
	let rootComponent = null
	for (let i = 0; i < characterFile?.selectedComponentsTree.length - 1; i++) {
		const rootUUID = characterFile?.selectedComponentsTree[i]
		if (!rootComponent) {
			rootComponent = selectedItemByUUID(characterFile.components, rootUUID)
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
	if (!selectedFileUUID.value) return null
	const characterFile = editCharacterFile.value
	if (!characterFile?.selectedComponentsTree || !characterFile?.selectedComponentsTree.length) return null
	let rootComponent = null
	for (let i = 0; i < characterFile?.selectedComponentsTree.length - 1; i++) {
		const rootUUID = characterFile?.selectedComponentsTree[i]
		if (!rootComponent) {
			rootComponent = selectedItemByUUID(characterFile.components, rootUUID)
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
	if (!selectedFileUUID.value) {
		rs = null
	} else {
		const characterFile = editCharacterFile.value
		if (!characterFile?.selectedComponentsTree || !characterFile?.selectedComponentsTree.length) {
			rs = null
		} else {
			let rootComponent = null
			for (let i = 0; i < characterFile?.selectedComponentsTree.length - 1; i++) {
				const rootUUID = characterFile?.selectedComponentsTree[i]
				if (!rootComponent) {
					rootComponent = selectedItemByUUID(characterFile.components, rootUUID)
				} else {
					rootComponent = selectedItemByUUID(rootComponent.value.components, rootUUID)
				}
			}
			const componentUUID = characterFile?.selectedComponentsTree[characterFile?.selectedComponentsTree.length - 1]
			if (componentUUID !== 'null') {
				const component = selectedItemByUUID(rootComponent.value.components, componentUUID)
				rs = component
			}
		}
	}
	return rs
})

// 当前字符文件中包含的组件列表
// components for current character file
const componentsForCurrentCharacterFile = computed(() => {
	if (!selectedFileUUID.value) return []
	const characterFile = editCharacterFile.value
	return characterFile.components
})

// 当前字符文件的排序组件（包含组件本身）列表
// ordered component list (with component itself) for current character file
const orderedListWithItemsForCurrentCharacterFile = computed(() => {
	if (!selectedFileUUID.value || !editCharacterFileUUID.value) return []
	const characterFile = editCharacterFile.value
	return characterFile.orderedList.map((item: {
		type: string,
		uuid: string,
	}) => {
		if (item.type === 'group') {
			return selectedItemByUUID(characterFile.groups, item.uuid)
		}
		return selectedItemByUUID(characterFile.components, item.uuid)
	})
})

// 指定字符文件的排序组件（包含组件本身）列表
// ordered component list (with component itself) for certain character file
const orderedListWithItemsForCharacterFile = (characterFile: ICharacterFile) => {
	return characterFile.orderedList.map((item: {
		type: string,
		uuid: string,
	}) => {
		if (item.type === 'group') {
			return selectedItemByUUID(characterFile.groups, item.uuid)
		}
		return selectedItemByUUID(characterFile.components, item.uuid)
	})
}

// 当前字符文件的排序组件（不包含组件本身）列表
// ordered component list (with NO component itself) for current character file
const orderedListForCurrentCharacterFile = computed(() => {
	if (!selectedFileUUID.value) return []
	const characterFile = editCharacterFile.value
	return characterFile.orderedList
})

// 选中的所有组件uuid列表
// selected components' uuids
const selectedComponentsUUIDs = computed(() => {
	if (!selectedFileUUID.value) return ''
	const characterFile = editCharacterFile.value
	return characterFile.selectedComponentsUUIDs
})


/**
 * actions
 */

/**
 * 设置当前选中文件
 * @param uuid uuid
 */
/**
 * set selected file uuid
 * @param uuid uuid
 */
const setSelectedFileUUID = (uuid: string) => {
	selectedFileUUID.value = uuid
	if (uuid) {
		gridSettings.value.centerSquareSize = selectedFile.value.width / 3
		gridSettings.value.size = selectedFile.value.width
	}
}

/**
 * 添加新的字体文件
 * @param file 字体文件
 */
/**
 * add new font file
 * @param file font file
 */
const addFile = (file: IFile) => {
	files.value.push(file)
}

/**
 * 删除字体文件
 * @param uuid 要被删除的字体文件uuid
 */
/**
 * remove font file
 * @param uuid uuid of font file need to be removed
 */
const removeFile = (uuid: string) => {
	if(selectedFileUUID.value === uuid) {
		setSelectedFileUUID('')
	}
	editCharacterFileUUID.value = ''
	const index = (() => {
		for (let i = 0; i < files.value.length; i++) {
			if (files.value[i].uuid === uuid)
			return i
		}
		return -1
	})()
	if (index >= 0) {
		files.value.splice(index, 1)
	}
}

/**
 * 更新字体设置
 * @param options 配置选项
 */
/**
 * update font settings
 * @param options options
 */
const updateFontSettings = (options: {
	name?: string,
	unitsPerEm: number,
	ascender: number,
	descender: number,
}) => {
	const file = selectedFile.value
	const {
		name,
		unitsPerEm,
		ascender,
		descender,
	} = options
	name && (file.name = name)
	if (
		unitsPerEm !== selectedFile.value.fontSettings.unitsPerEm ||
		ascender !== selectedFile.value.fontSettings.ascender ||
		descender !== selectedFile.value.fontSettings.descender
	) {
		file.fontSettings = {
			unitsPerEm,
			ascender,
			descender,
		}
		file.width = unitsPerEm
		file.height = unitsPerEm
		total.value = file.characterList.length
		loaded.value = 0
		loading.value = true
		for (let i = 0; i < file.characterList.length; i++) {
			const characterFile = file.characterList[i]
			if (!characterFile._o) {
				executeCharacterScript(characterFile)
			}
			const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(characterFile), {
				unitsPerEm,
				descender,
				advanceWidth: unitsPerEm,
			}, { x: 0, y: 0 }, false, false, true)
			loaded.value += 1
		}
		loading.value = false
	}
}

/**
 * 更新指定字符文件的属性
 * @param uuid 要被更新的字符文件uuid
 * @param options 包含指定属性的配置选项
 */
/**
 * modify attrs of certain character file
 * @param uuid uuid of character file to be modified
 * @param options options contain attrs to be changed
 */
const modifyCharacterFile = (uuid: string, options: any) => {
	//files.value = R.clone(files.value)
	const file: IFile = selectedItemByUUID(files.value, selectedFileUUID.value)
	let characterFile: ICharacterFile = selectedItemByUUID(file.characterList, uuid)
	Object.keys(options).map((key: string) => {
		if (key === 'view') {
			Object.keys(options.view).map((viewKey: string) => {
				// @ts-ignore
				characterFile.view[viewKey] = options.view[viewKey]
			})
		} else {
			// @ts-ignore
			characterFile[key] = options[key]
		}
	})
	emitter.emit('renderPreviewCanvasByUUID', uuid)
}

/**
 * 删除排序列表中的项目
 * @param uuid 要删除的组件项目uuid
 */
/**
 * remove item in ordered list
 * @param uuid uuid of component to be removed
 */
const removeOrderedItemForCurrentCharacterFile = (uuid: string) => {
	const characterFile = editCharacterFile.value
	const index = (() => {
		for (let i = 0; i < characterFile.orderedList.length; i++) {
			if (characterFile.orderedList[i].uuid === uuid)
			return i
		}
		return -1
	})()
	if (index >= 0) {
		characterFile.orderedList.splice(index, 1)
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
const removeComponentForCurrentCharacterFile = (uuid: string) => {
	const characterFile = editCharacterFile.value
	const index = (() => {
		for (let i = 0; i < characterFile.components.length; i++) {
			if (characterFile.components[i].uuid === uuid)
			return i
		}
		return -1
	})()
	removeOrderedItemForCurrentCharacterFile(uuid)
	if (characterFile.glyph_script && characterFile.glyph_script[uuid]) {
		delete characterFile.glyph_script[uuid]
	}
	characterFile.components.splice(index, 1)
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
const insertComponentForCurrentCharacterFile = (component: Component, options: { uuid: string, pos: string }) => {
	const characterFile = editCharacterFile.value
	characterFile.components.push(component)
	insertOrderedItemForCurrentCharacterFile({
		type: 'component',
		uuid: component.uuid,
	}, options)
	// setTool('select')
	// setSelectionForCurrentCharacterFile(component.uuid)
}

/**
 * 组件选择
 * @param uuid 被选中的组件uuid
 */
/**
 * component selection
 * @param uuid uuid of component to be selected
 */
const setSelectionForCurrentCharacterFile = (uuid: string) => {
	const characterFile = editCharacterFile.value
	if (uuid) {
		if (enableMultiSelect.value) {
			const index = characterFile.selectedComponentsUUIDs.indexOf(uuid)
			if (index === -1) {
				characterFile.selectedComponentsUUIDs.push(uuid)
			} else {
				characterFile.selectedComponentsUUIDs.splice(index, 1)
			}
		} else {
			characterFile.selectedComponentsUUIDs = [uuid]
			if (selectedComponent.value.type === 'glyph') {
				setGlyphDraggerTool('glyphDragger')
			}
		}
	} else {
		characterFile.selectedComponentsUUIDs = []
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
	const characterFile = editCharacterFile.value
	if (!characterFile?.selectedComponentsTree || !characterFile?.selectedComponentsTree.length) {
		return
	} else {
		let rootComponent = null
		let subComp = null
		const components = R.clone(characterFile.components)
		for (let i = 0; i < characterFile?.selectedComponentsTree.length - 1; i++) {
			const rootUUID = characterFile?.selectedComponentsTree[i]
			if (!rootComponent) {
				rootComponent = selectedItemByUUID(components, rootUUID)
			} else {
				rootComponent = selectedItemByUUID(rootComponent.value.components, rootUUID)
			}
		}
		const componentUUID = characterFile?.selectedComponentsTree[characterFile?.selectedComponentsTree.length - 1]
		if (componentUUID !== 'null') {
			const component = selectedItemByUUID(rootComponent.value.components, componentUUID)
			subComp = component
		}
		const keys = Object.keys(options)
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]
			subComp[key] = options[key]
		}
		characterFile.components = components
	}
}

/**
 * 修改组件
 * @param uuid 被修改的组件uuid
 * @param options 配置选项
 */
/**
 * modify component
 * @param uuid uuid of component to be modified
 * @param options options
 */
const modifyComponentForCurrentCharacterFile = (uuid: string, options: any) => {
	const characterFile = editCharacterFile.value
	const components = R.clone(characterFile.components)
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
					case 'ox':
						(component as IGlyphComponent).ox = options['ox'] as number
						break
					case 'oy':
						(component as IGlyphComponent).oy = options['oy'] as number
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
						component.usedInCharacter = options['usedInCharacter'] as boolean
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
		characterFile.components = components
	})
	emitter.emit('renderPreviewCanvasByUUIDOnEditing', editCharacterFileUUID.value)
}

/**
 * 修改组件
 * @param uuid 被修改的组件uuid
 * @param options 配置选项
 * @param characterUUID character uuid
 */
/**
 * modify components
 * @param uuid uuid of component to be modified
 * @param options options
 * @param characterUUID character uuid
 */
const modifyComponentForCharacterFile = (uuid: string, options: any, characterUUID: string) => {
	const file = selectedFile.value
	const characterFile = selectedItemByUUID(file.characterList, characterUUID)
	const components = R.clone(characterFile.components)
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
					case 'ox':
						(component as IGlyphComponent).ox = options['ox'] as number
						break
					case 'oy':
						(component as IGlyphComponent).oy = options['oy'] as number
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
						component.usedInCharacter = options['usedInCharacter'] as boolean
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
		characterFile.components = components
	})
	// emitter.emit('renderPreviewCanvasByUUID', uuid)
}

/**
 * 添加组
 * @param group 组
 */
/**
 * add group
 * @param group components group
 */
const addGroupForCurrentCharacterFile = (group: { type: string, uuid: string }) => {
	const characterFile = editCharacterFile.value	
	characterFile.groups.push(group)
}

/**
 * 在当前字符文件的排序列表中添加项目
 * @param item 要被添加的项目
 */
/**
 * add ordered item into ordered list for current character file
 * @param item ordered item
 */
const addOrderedItemForCurrentCharacterFile = (item: { type: string, uuid: string }) => {
	const characterFile = editCharacterFile.value
	characterFile.orderedList.push(item)
}

/**
 * 在指定字符文件的排序列表中添加项目
 * @param item 要被添加的项目
 * @param characterFileUUID 字符文件uuid
 */
/**
 * add ordered item into ordered list for certain character file
 * @param item ordered item
 * @param characterFileUUID character file uuid
 */
const addOrderedItemForCharacterFile = (item: { type: string, uuid: string }, characterFileUUID: string) => {
	const file = selectedFile.value
	const characterFile = selectedItemByUUID(file.characterList, characterFileUUID)
	characterFile.orderedList.push(item)
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
const insertOrderedItemForCurrentCharacterFile = (
	item: { type: string, uuid: string },
	options: { uuid: string, pos: string },
) => {
	const characterFile = editCharacterFile.value
	const index = (() => {
		for(let i = 0; i < characterFile.orderedList.length; i++) {
			if (characterFile.orderedList[i].uuid === options.uuid) return i
		}
	})()
	if (options.pos === 'prev') {
		characterFile.orderedList.splice(index, 0, item)
	}
	if (options.pos === 'next') {
		characterFile.orderedList.splice(index as number + 1, 0, item)
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
const setOrderedListForCurrentCharacterFile = (list: Array<{ type: string, uuid: string }>) => {
	const characterFile = editCharacterFile.value
	characterFile.orderedList = list
}

/**
 * 将组件添加至剪贴板
 * @param components 组件
 */
/**
 * put components into clip board
 * @param components components
 */
const setClipBoard = (components: Array<IComponent>) => {
	clipBoard.value = components
}

/**
 * 初始化
 */
/**
 * init workspace by sync local cache
 */
const init = async () => {
	const list: Array<string> = await localForage.getItem('fileList') as Array<string>
	if (!!list) {
		list.map(async (uuid: string) => {
			const data: string = await localForage.getItem(uuid) as string
			const file: IFile = await JSON.parse(data) as IFile
			addFile(file)
		})
	}
}

/**
 * 设置当前正在编辑的字符文件
 * @param uuid 字符文件uuid
 */
/**
 * set editing character file uuid
 * @param uuid uuid of editing character file
 */
const setEditCharacterFileUUID = (uuid: string) => {
	editCharacterFileUUID.value = uuid
}

/**
 * 在当前字体文件中添加字符文件
 * @param character 字符文件
 */
/**
 * add character for current font file
 * @param character character file
 */
const addCharacterForCurrentFile = (character: ICharacterFile) => {
	const characters = selectedFile.value.characterList
	characters.push(character)
}

/**
 * 在当前字体文件中删除字符文件
 * @param uuid 字符文件uuid
 */
/**
 * remove character for current font file
 * @param uuid character file's uuid
 */
const removeCharacterForCurrentFile = (uuid: string) => {
	const characters = selectedFile.value.characterList
	for (let i = 0; i < characters.length; i++) {
		if (characters[i].uuid === uuid) {
			characters.splice(i, 1)
			return
		}
	}
}

/**
 * 在当前字符文件中添加组件
 * @param component 要被添加的组件
 */
/**
 * add component for current character file
 * @param component component to be added
 */
const addComponentForCurrentCharacterFile = (component: Component) => {
	const characterFile = editCharacterFile.value
	characterFile.components.push(component)
	addOrderedItemForCurrentCharacterFile({
		type: 'component',
		uuid: component.uuid,
	})
	setSelectionForCurrentCharacterFile(component.uuid)
}

/**
 * 在指定字符文件中添加组件
 * @param characterFileUUID 字符文件uuid
 * @param component 要被添加的组件
 */
/**
 * add component into certain character file
 * @param characterFileUUID character file's uuid
 * @param component component to be added
 */
const addComponentForCharacterFile = (characterFileUUID: string, component: Component) => {
	const characters = selectedFile.value.characterList
	characters.map((character: ICharacterFile) => {
		if (character.uuid === characterFileUUID) {
			character.components.push(component)
			addOrderedItemForCharacterFile({
				type: 'component',
				uuid: component.uuid,
			}, characterFileUUID)
		}
	})
}

/**
 * 在指定字符文件中添加组件列表
 * @param characterFileUUID 字符文件uuid
 * @param components 要被添加的组件列表
 */
/**
 * add components to certain character file
 * @param characterFileUUID uuid for character file
 * @param components components to be added
 */
const addComponentsForCharacterFile = (characterFileUUID: string, components: Array<IComponent>) => {
	const characters = selectedFile.value.characterList
	characters.map((character: ICharacterFile) => {
		if (character.uuid === characterFileUUID) {
			components.forEach((component) => {
				character.components.push(component)
				addOrderedItemForCharacterFile({
					type: 'component',
					uuid: component.uuid,
				}, characterFileUUID)
			})
		}
	})
}

/**
 * 在当前字符文件中添加组件列表
 * @param components 要被添加的组件列表
 */
/**
 * add components to current character file
 * @param components components to be added
 */
const addComponentsForCurrentCharacterFile = (components: Array<IComponent>) => {
	const character = editCharacterFile.value
	components.forEach((component) => {
		character.components.push(component)
		addOrderedItemForCurrentCharacterFile({
			type: 'component',
			uuid: component.uuid,
		})
	})
}

/**
 * 执行字符脚本
 * @param character 字符文件
 */
/**
 * execute script for character
 * @param character character file
 */
const executeCharacterScript = (character: ICharacterFile) => {
	window.character = new Character(character)
	constantsMap.update(constants.value)
	window.constantsMap = constantsMap
	const fn = new Function(`${character.script}\nscript_${character.uuid.replaceAll('-', '_')} (character, constantsMap, FP)`)
	fn()
	if (window.character._character && window.character._character.glyph_script) {
		const keys = Object.keys(window.character._character.glyph_script)
		for (let i = 0; i < keys.length; i++) {
			const script = window.character._character.glyph_script[keys[i]]
			const fn = new Function(`${script}`)
			fn()
		}
	}
	window.character._character?.components?.map(component => {
		if (component.value.system_script) {
			const keys = Object.keys(component.value.system_script)
			for (let i = 0; i < keys.length; i++) {
				const script = component.value.system_script[keys[i]]
				window.comp_glyph = new CustomGlyph(component.value)
				const fn = new Function(`${script}`)
				fn()
				window.comp_glyph = null
			}
		}
	})
}

/**
 * 遍历字符中包含的字形组件，并且运行脚本
 */
const executeCharactersGlyphsScript = (character: ICharacterFile | ICustomGlyph) => {
	const components = character.components
	for (let i = 0; i < components.length; i++) {
		const comp = components[i]
		if (comp.type === 'glyph') {
			const glyph = comp.value
			executeScript(glyph)
		}
	}
}

// 获取字符布局
// get character ratio layout
const getCharacterRatioLayout = (character, option) => {
	let rs = null
	if ((character.type === 'text' || character.type === 'icon') && (character as ICharacterFile).info && (character as ICharacterFile).info.layoutTree) {
		const option_values = option.split('-')
		const layoutValue = option_values.splice(option_values.length - 1, 1)[0]
		const layoutID = option_values.join('-')
		const layouts = findLeafNodes((character as ICharacterFile).info?.layoutTree)
		layouts.map((layout) => {
			if (layout.id === layoutID) {
				rs = layout.rect[layoutValue]
			}
		})
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

// 编辑字符，进入字符编辑器
// go to character editor
const editCharacter = async (uuid: string) => {
	loading.value = true
	total.value = 0
	await nextTick()
	setTimeout(() => {
		setEditCharacterFileUUID(uuid)
		setEditCharacterFileByUUID(editCharacterFileUUID.value)
		setPrevStatus(editStatus.value)
		setEditStatus(Status.Edit)
	}, 500)
}

// 删除字符
// delete character
const deleteCharacter = (e: MouseEvent, uuid: string) => {
	e.stopPropagation()
	
	// 检查是否为.notdef字符，如果是则不允许删除
	const character = selectedFile.value.characterList.find(char => char.uuid === uuid)
	if (character && character.character.text === '.notdef') {
		ElMessage({
			message: '.notdef字符不能被删除',
			type: 'warning'
		})
		return
	}
	
	removeCharacterForCurrentFile(uuid)
	deleteCharacterTemplate(uuid)
}

// 重命名字符
// rename character
const renameCharacter = (e: MouseEvent, uuid: string) => {
	e.stopPropagation()
	
	// 检查是否为.notdef字符，如果是则不允许编辑名称
	const character = selectedFile.value.characterList.find(char => char.uuid === uuid)
	if (character && character.character.text === '.notdef') {
		ElMessage({
			message: '.notdef字符的名称不能被编辑',
			type: 'warning'
		})
		return
	}
	
	editedCharacterUUID.value = uuid
	setEditCharacterDialogVisible(true)
}

// 复制字符
// rename character
const copyCharacter = (e: MouseEvent, uuid: string) => {
	e.stopPropagation()
	copiedCharacterUUID.value = uuid
	setCopyCharacterDialogVisible(true)
}

// 生成字符渲染模板
// generate character template
const generateCharacterTemplate = (characterFile) => {
	const root = document.getElementById('character-template').querySelector('.character').cloneNode(true);
	(root as HTMLElement).className = `character character-${characterFile.uuid}`;
	(root as HTMLElement).querySelector('.preview-canvas').id = `preview-canvas-${characterFile.uuid}`;
	(root as HTMLElement).querySelector('.text').innerHTML = `${characterFile.character.text}`;
	if (characterFile.type === 'text') {
		(root as HTMLElement).querySelector('.unicode').innerHTML = `0x${characterFile.character.unicode.toString(16)}`;
	}
	//@ts-ignore
	(root as HTMLElement).querySelector('.edit-icon').addEventListener('click', (e) => renameCharacter(e, characterFile.uuid));
	//@ts-ignore
	(root as HTMLElement).querySelector('.copy-icon').addEventListener('click', (e) => copyCharacter(e, characterFile.uuid));
	//@ts-ignore
	(root as HTMLElement).querySelector('.delete-icon').addEventListener('click', (e) => deleteCharacter(e, characterFile.uuid));
	(root as HTMLElement).addEventListener('click', () => editCharacter(characterFile.uuid))
	return root
}

// 删除字符模板
// delete character template
const deleteCharacterTemplate = (uuid) => {
	const wrapper = document.getElementById('character-render-list')
	const root = wrapper.querySelector(`.character-${uuid}`)
	wrapper.removeChild(root)
}

// 添加字符模板
// add character template
const addCharacterTemplate = (el) => {
	const wrapper = document.getElementById('character-render-list')
	const defaultEl = wrapper.querySelector('.default-character')
	if (defaultEl) {
		wrapper.insertBefore(el, defaultEl)
	}
}

// 批量添加字符模板 - 性能优化版本
// batch add character templates for better performance
const batchAddCharacterTemplates = (elements: (HTMLElement | Node)[]) => {
	const wrapper = document.getElementById('character-render-list')
	const defaultEl = wrapper.querySelector('.default-character')
	
	if (!defaultEl) return
	
	// 使用DocumentFragment来批量操作DOM
	const fragment = document.createDocumentFragment()
	
	// 将所有元素添加到fragment中
	elements.forEach(el => {
		fragment.appendChild(el)
	})
	
	// 一次性插入所有元素
	wrapper.insertBefore(fragment, defaultEl)
}

// 清空字符列表
// clear character rander list
const clearCharacterRenderList = () => {
	const wrapper = document.getElementById('character-render-list')
	const defaultEl = document.getElementById('default-character-template').querySelector('.default-character').cloneNode(true)
	defaultEl.addEventListener('click', () => setAddTextDialogVisible(true))
	wrapper.innerHTML = ''
	wrapper.appendChild(defaultEl)
}

// 虚拟滚动字符模板管理器
// virtual scrolling character template manager
class VirtualCharacterList {
	private container: HTMLElement
	private items: any[] = []
	private itemHeight: number = 60 // 每个字符项的高度
	private visibleCount: number = 20 // 可见字符数量
	private scrollTop: number = 0
	private startIndex: number = 0
	private endIndex: number = 0
	
	constructor(containerId: string) {
		this.container = document.getElementById(containerId)!
		this.setupContainer()
	}
	
	private setupContainer() {
		// 设置容器样式
		this.container.style.position = 'relative'
		this.container.style.overflow = 'auto'
		this.container.style.height = '100%'
		
		// 添加滚动监听
		this.container.addEventListener('scroll', this.handleScroll.bind(this))
	}
	
	setItems(items: any[]) {
		this.items = items
		this.updateScrollHeight()
		this.renderVisibleItems()
	}
	
	private updateScrollHeight() {
		// 设置总高度以支持滚动
		const totalHeight = this.items.length * this.itemHeight
		this.container.style.height = `${totalHeight}px`
	}
	
	private handleScroll() {
		this.scrollTop = this.container.scrollTop
		this.renderVisibleItems()
	}
	
	private renderVisibleItems() {
		// 计算可见范围
		this.startIndex = Math.floor(this.scrollTop / this.itemHeight)
		this.endIndex = Math.min(
			this.startIndex + this.visibleCount,
			this.items.length
		)
		
		// 清空容器
		this.container.innerHTML = ''
		
		// 添加顶部占位符
		const topSpacer = document.createElement('div')
		topSpacer.style.height = `${this.startIndex * this.itemHeight}px`
		this.container.appendChild(topSpacer)
		
		// 渲染可见项
		for (let i = this.startIndex; i < this.endIndex; i++) {
			const item = this.items[i]
			const element = generateCharacterTemplate(item) as HTMLElement
			element.style.position = 'absolute'
			element.style.top = `${i * this.itemHeight}px`
			this.container.appendChild(element)
		}
		
		// 添加底部占位符
		const bottomSpacer = document.createElement('div')
		bottomSpacer.style.height = `${(this.items.length - this.endIndex) * this.itemHeight}px`
		this.container.appendChild(bottomSpacer)
	}
}

// 创建虚拟滚动实例
let virtualList: VirtualCharacterList | null = null

// 初始化虚拟滚动
const initVirtualCharacterList = () => {
	if (!virtualList) {
		virtualList = new VirtualCharacterList('character-render-list')
	}
}

// 使用虚拟滚动添加字符
const addCharactersWithVirtualScroll = (characterList: any[]) => {
	if (!virtualList) {
		initVirtualCharacterList()
	}
	virtualList!.setItems(characterList)
}

const visibleStartIndex = ref(0)
const visibleEndIndex = ref(500) // 增加默认渲染字符数量
const visibleCount = ref(500) // 增加默认渲染字符数量
const itemHeight = 122 // 每个字符项的实际高度：112px(内容) + 10px(gap间距)

export {
	visibleStartIndex,
	visibleEndIndex,
	visibleCount,
	itemHeight,
	files,
	editCharacterFileUUID,
	selectedFileUUID,
	selectedFile,
	enableMultiSelect,
	selectedComponents,
	componentsForCurrentCharacterFile,
	orderedListWithItemsForCurrentCharacterFile,
	orderedListWithItemsForCharacterFile,
	orderedListForCurrentCharacterFile,
	selectedComponentsUUIDs,
	clipBoard,
	editCharacterFile,
	usedComponents,
	characterList,
	selectedComponent,
	selectedComponentUUID,
	selectedItemByUUID,
	setEditCharacterFileUUID,
	setSelectedFileUUID,
	addOrderedItemForCharacterFile,
	addFile,
	removeFile,
	updateFontSettings,
	modifyCharacterFile,
	addComponentForCurrentCharacterFile,
	setSelectionForCurrentCharacterFile,
	modifyComponentForCurrentCharacterFile,
	addGroupForCurrentCharacterFile,
	addOrderedItemForCurrentCharacterFile,
	setOrderedListForCurrentCharacterFile,
	setClipBoard,
	removeComponentForCurrentCharacterFile,
	insertComponentForCurrentCharacterFile,
	insertOrderedItemForCurrentCharacterFile,
	addCharacterForCurrentFile,
	removeCharacterForCurrentFile,
	addComponentForCharacterFile,
	addComponentsForCharacterFile,
	init,
	executeCharacterScript,
	getCharacterRatioLayout,
	generateCharacterTemplate,
	deleteCharacterTemplate,
	addCharacterTemplate,
	batchAddCharacterTemplates,
	clearCharacterRenderList,
	modifyComponentForCharacterFile,
	SubComponents,
	SubComponentsRoot,
	selectedSubComponent,
	modifySubComponent,
	executeCharactersGlyphsScript,
	setEditCharacterFileByUUID,
	resetEditCharacterFile,
	updateCharacterListFromEditFile,
	traverseComponents,
	addCharactersWithVirtualScroll,
	addComponentsForCurrentCharacterFile,
}