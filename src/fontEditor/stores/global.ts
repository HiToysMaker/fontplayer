import { ref, reactive, type Ref } from 'vue'

export enum GridType {
	None,
	Mesh,
	Mi,
	LayoutGrid,
}

export enum BackgroundType {
	Transparent,
	Color,
}

export interface IGrid {
	precision: number;
	type: GridType,
}

export interface IBackground {
	type: BackgroundType,
	color: string,
}

const base = ''//'/fontplayer_demo'

const useSkeletonGrid = ref(false)

const jointsCheckedMap = ref({})

const draggable = ref(true)
const dragOption = ref('default')
const checkJoints = ref(false)
const checkRefLines = ref(false)

const fontRenderStyle: Ref<string> = ref('contour')

const tips = ref('')

const tool: Ref<string> = ref('')
const width: Ref<number> = ref(500)
const height: Ref<number> = ref(500)
const canvas: Ref<HTMLCanvasElement | null> = ref(null)

let grid: IGrid = reactive({
	type: GridType.None,
	precision: 20,
})

let background: IBackground = reactive({
	type: BackgroundType.Transparent,
	color: '',
})

const gridSettings = ref({
	dx: 0,
	dy: 0,
	centerSquareSize: 1000 / 3,
	size: 1000,
	default: true,
})

const layoutOptions = ref([
	{
		value: '左右',
		label: '左右',
		layout: '左<0,x1+0.5*(x2-x1)>右<x1+0.5*(x2-x1),l>',
		subLayout: '左<x,x+0.5*w>右<x+0.5*w,x+w>',
	},
	{
		value: '左中右',
		label: '左中右',
		layout: '左<0,l/3)>中<l/3,2*l/3>右<2*l/3,l>',
		subLayout: '左<x,x+0.33*w>中<x+0.33*w,x+0.66w>右<x+0.66w,x+w>',
	},
	{
		value: '上下',
		label: '上下',
		layout: '上<0,x1+0.5*(y2-y1)>下<x1+0.5*(y2-y1),l>',
		subLayout: '上<y,y+0.5*h>右<y+0.5*h,y+h>',
	},
	{
		value: '上中下',
		label: '上中下',
		layout: '上<0,l/3)>中<l/3,2*l/3>下<2*l/3,l>',
		subLayout: '上<y,x+0.33*h>中<y+0.33*h,y+0.66h>下<y+0.66h,y+h>',
	},
	{
		value: '独体字',
		label: '独体字',
		layout: '独体字',
		subLayout: '独体字',
	},
])

const templates = [
	{
		name: '春晓',
		path: '/templates/chun_xiao.json'
	}
]

const setTool = (item: string) => {
	tool.value = item
}
const setWidth = (value: number) => {
	width.value = value
}
const setHeight = (value: number) => {
	height.value = value
}
const setBackgroundType = (type: BackgroundType) => {
	background.type = type
}
const setBackgroundColor = (color: string) => {
	background.color = color
}
const setGridType = (type: GridType) => {
	grid.type = type
}
const setGridPrecision = (precision: number) => {
	grid.precision = precision
}
const setCanvas = (value: HTMLCanvasElement) => {
	canvas.value = value
}

const loading = ref(false)
const loaded = ref(0)
const total = ref(100)

const gridChanged = ref(false)

export {
	tool,
	grid,
	canvas,
	width,
	height,
	background,
	setTool,
	setWidth,
	setHeight,
	setBackgroundType,
	setBackgroundColor,
	setGridType,
	setGridPrecision,
	setCanvas,
	fontRenderStyle,
	loading,
	gridSettings,
	layoutOptions,
	templates,
	draggable,
	dragOption,
	checkJoints,
	checkRefLines,
	loaded,
	total,
	tips,
	jointsCheckedMap,
	gridChanged,
	useSkeletonGrid,
	base,
}