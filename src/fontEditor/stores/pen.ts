import { ref, type Ref, reactive } from 'vue'

/**
 * 此store文件包含了钢笔工具需要的一些信息
 */
/**
 * this store file contains basic info used when pen editing
 */

// 点的数据结构
// point data struct
export interface IPoint {
	uuid: string;
	x: number;
	y: number;
	type: string;
	origin: string | null;
	isShow?: boolean;
}

export interface IPoints {
	value: Array<IPoint>;
}

// 是否正在编辑钢笔路径
// whether on editing
const editing: Ref<boolean> = ref(false)
const setEditing = (status: boolean) => {
	editing.value = status
}

// 钢笔路径包含的点
// points for pen path
const points: IPoints = reactive({
	value: []
})
const setPoints = (value: Array<IPoint>) => {
	points.value = value
}

const mousedown = ref(false)
const mousemove = ref(false)

export { editing, points, setEditing, setPoints, mousedown, mousemove }