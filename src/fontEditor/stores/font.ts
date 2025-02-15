import { ref, reactive, type Ref } from 'vue'

/**
 * 该store文件包含了从图片中提取文字时，编辑操作中所用到的一些基础信息
 */
/**
 * this store file contains some basic info for editor for 'extracting contour info from picture'.
 */

export interface ICharacter {
	uuid: string;
	text: string;
	unicode: string;
}

export interface IComponent {
	uuid: string;
	type: string;
	name: string;
	lock: boolean;
	visible: boolean;
	value: IComponentValue,
	x: number;
	y: number;
	w: number;
	h: number;
	rotation: number;
	flipX: boolean;
	flipY: boolean;
	usedInCharacter: boolean;
}

export enum IComponentValue {
	IPenComponent,
	IPolygonComponent,
	IRectangleComponent,
	IEllipseComponent,
	IPictureComponent,
}

export interface IPenComponent {
	points: any;
	strokeColor: string;
	fillColor: string;
	closePath: boolean;
	editMode: boolean;
}

export interface IPolygonComponent {
	points: any;
	strokeColor: string;
	fillColor: string;
	closePath: boolean;
}

export interface IRectangleComponent {
	rectX: number;
	rextY: number;
	rectWidth: number;
	rectHeight: number;
	strokeColor: string;
	fillColor: string;
	closePath: boolean;
}

export interface IEllipseComponent {
	ellipseX: number;
	ellipseY: number;
	radiusX: number;
	radiusY: number;
	strokeColor: string;
	fillColor: string;
	closePath: boolean;
}

export interface ICharacterPic {
	data: string;
	img: HTMLImageElement | null;
	thumbnailCanvas: HTMLCanvasElement | null;
	thumbnailPixels: Uint8ClampedArray | Array<number>;
	processPixels: Uint8ClampedArray | Array<number>;
	width: number;
	height: number;
}

export interface IBitMap {
	data: Uint8ClampedArray | Array<number>;
	width: number;
	height: number;
}

export interface ISection {
	img: HTMLImageElement | null;
	left: number;
	right: number;
	top: number;
	bottom: number;
	delta: number;
	rotation: number;
}

const width: Ref<number> = ref(500)
const height: Ref<number> = ref(500)
const thumbnailWidth: Ref<number> = ref(100)
const thumbnailHeight: Ref<number> = ref(100)

const section: ISection = reactive({
	img: null,
	left: 240,
	right: 320,
	top: 155,
	bottom: 290,
	delta: 215,
	rotation: 0,
})

const picZoom: Ref<number> = ref(100)

const step: Ref<number> = ref(0)
const rThreshold: Ref<number> = ref(128)
const gThreshold: Ref<number> = ref(128)
const bThreshold: Ref<number> = ref(128)
const localRThreshold: Ref<number> = ref(128)
const localGThreshold: Ref<number> = ref(128)
const localBThreshold: Ref<number> = ref(128)
const localBrushSize: Ref<number> = ref(10)
const localBrushX: Ref<number> = ref(0)
const localBrushY: Ref<number> = ref(0)
// const enableLocalBrush: Ref<boolean> = ref(false)
const maxError: Ref<number> = ref(2)
const dropThreshold: Ref<number> = ref(10)

const previewStatus: Ref<number> = ref(0)
const listWidth: Ref<number> = ref(0)

const editPanelDisplay: Ref<string> = ref('edit')
const picPanelDisplay: Ref<string> = ref('pic')
const editPanelCompFilter: Ref<string> = ref('all')
const glyphPanelCompFilter: Ref<string> = ref('all')
const picPanelCompFilter: Ref<string> = ref('all')

export enum Status {
	CharacterList,
	GlyphList,
	Edit,
	Pic,
	Glyph,
	SystemGlyphList,
	RadicalGlyphList,
	CompGlyphList,
	StrokeGlyphList,
}

const prevStatus: Ref<Status> = ref(Status.CharacterList)

const editStatus: Ref<Status> = ref(Status.CharacterList)

const prevEditStatus = ref(Status.Edit)

const coordsText: Ref<string> = ref('0, 0')

const enableLocalBrush: {
	value: boolean
} = reactive({
	value: false
})

const editCharacterPic: {
	value: ICharacterPic
} = reactive({
	value: {
		data: '',
		img: null,
		thumbnailCanvas: null,
		thumbnailPixels: [],
		processPixels: [],
		width: 0,
		height: 0,
	},
})
const contoursComponents: {
	value: Array<IComponent>,
} = reactive({
	value: []
})

const curvesComponents: {
	value: Array<IComponent>,
} = reactive({
	value: []
})

const bitmap: {
	value: IBitMap
} = reactive({
	value: {
		data: [],
		width: 0,
		height: 0,
	},
})

const setEnableLocalBrush = (value: boolean) => {
	enableLocalBrush.value = value
}

const setBitMap = (value: IBitMap) => {
	bitmap.value = value
}
const setEditCharacterPic = (value: ICharacterPic) => {
	editCharacterPic.value = value
}
const setEditPanelDisplay = (value: string) => {
	editPanelDisplay.value = value
}
const setPicPanelDisplay = (value: string) => {
	picPanelDisplay.value = value
}
const setEditPanelCompFilter = (value: string) => {
	editPanelCompFilter.value = value
}
const setGlyphPanelCompFilter = (value: string) => {
	glyphPanelCompFilter.value = value
}
const setPicPanelCompFilter = (value: string) => {
	picPanelCompFilter.value = value
}
const setWidth = (value: number) => {
	width.value = value
}
const setHeight = (value: number) => {
	height.value = value
}
const setPicZoom = (value: number) => {
	picZoom.value = value
}
const setThumbnailWidth = (value: number) => {
	thumbnailWidth.value = value
}
const setThumbnailHeight = (value: number) => {
	thumbnailHeight.value = value
}
const setEditStatus = (value: Status) => {
	editStatus.value = value
}
const setPrevStatus = (value: Status) => {
	prevStatus.value = value
}
const setStep = (value: number) => {
	step.value = value
}
const clearContoursComponent = () => {
	contoursComponents.value = []
}
const clearCurvesComponent = () => {
	curvesComponents.value = []
}
const addContoursComponent = (component: IComponent) => {
	contoursComponents.value.push(component)
}
const modifyContoursComponent = (uuid: string, options: any) => {
	for (let i = 0; i < contoursComponents.value.length; i++) {
		const component = contoursComponents.value[i]
		if (component.uuid === uuid) {
			Object.keys(options).map((key: string) => {
				switch (key) {
					case 'type':
						component.type = options['type'] as string
						break
					case 'lock':
						component.lock = options['lock'] as boolean
						break
					case 'visible':
						component.visible = options['visible'] as boolean
						break
					case 'x':
						component.x = options['x'] as number
						break
					case 'y':
						component.y = options['y'] as number
						break
					case 'w':
						component.w = options['w'] as number
						break
					case 'h':
						component.h = options['h'] as number
						break;
					case 'rotation':
						component.rotation = options['rotation'] as number
						break
					case 'flipX':
						component.flipX = options['flipX'] as boolean
						break
					case 'flipY':
						component.flipY = options['flipY'] as boolean
						break
					case 'usedInCharacter':
						component.usedInCharacter = options['usedInCharacter'] as boolean
						break
					case 'value':
						Object.keys(options['value']).map((sub_key: string) => {
							//@ts-ignore
							component.value[sub_key] = options['value'][sub_key]
						})
						break
				}
			})
		}
	}
}
const addCurvesComponent = (component: IComponent) => {
	curvesComponents.value.push(component)
}
const modifyCurvesComponent = (uuid: string, options: any) => {
	for (let i = 0; i < curvesComponents.value.length; i++) {
		const component = curvesComponents.value[i]
		if (component.uuid === uuid) {
			Object.keys(options).map((key: string) => {
				switch (key) {
					case 'type':
						component.type = options['type'] as string
						break
					case 'lock':
						component.lock = options['lock'] as boolean
						break
					case 'visible':
						component.visible = options['visible'] as boolean
						break
					case 'x':
						component.x = options['x'] as number
						break
					case 'y':
						component.y = options['y'] as number
						break
					case 'w':
						component.w = options['w'] as number
						break
					case 'h':
						component.h = options['h'] as number
						break;
					case 'rotation':
						component.rotation = options['rotation'] as number
						break
					case 'flipX':
						component.flipX = options['flipX'] as boolean
						break
					case 'flipY':
						component.flipY = options['flipY'] as boolean
						break
					case 'usedInCharacter':
						component.usedInCharacter = options['usedInCharacter'] as boolean
						break
					case 'value':
						Object.keys(options['value']).map((sub_key: string) => {
							//@ts-ignore
							component.value[sub_key] = options['value'][sub_key]
						})
						break
				}
			})
		}
	}
}
const resetEditPic = () => {
	editCharacterPic.value = {
		data: '',
		img: null,
		thumbnailCanvas: null,
		thumbnailPixels: [],
		processPixels: [],
		width: 0,
		height: 0,
	}
}

export {
	width,
	height,
	thumbnailWidth,
	thumbnailHeight,
	editStatus,
	editCharacterPic,
	editPanelDisplay,
	picPanelDisplay,
	editPanelCompFilter,
	glyphPanelCompFilter,
	picPanelCompFilter,
	picZoom,
	step,
	rThreshold,
	gThreshold,
	bThreshold,
	maxError,
	contoursComponents,
	curvesComponents,
	previewStatus,
	listWidth,
	bitmap,
	enableLocalBrush,
	localRThreshold,
	localGThreshold,
	localBThreshold,
	localBrushSize,
	localBrushX,
	localBrushY,
	section,
	dropThreshold,
	setEnableLocalBrush,
	clearContoursComponent,
	clearCurvesComponent,
	setBitMap,
	setStep,
	setPicZoom,
	setEditPanelCompFilter,
	setGlyphPanelCompFilter,
	setPicPanelCompFilter,
	setEditPanelDisplay,
	setPicPanelDisplay,
	setWidth,
	setHeight,
	setThumbnailWidth,
	setThumbnailHeight,
	setEditStatus,
	setEditCharacterPic,
	addContoursComponent,
	modifyContoursComponent,
	addCurvesComponent,
	modifyCurvesComponent,
	resetEditPic,
	coordsText,
	prevStatus,
	setPrevStatus,
	prevEditStatus,
}