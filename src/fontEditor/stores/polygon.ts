import { ref, type Ref, reactive } from 'vue'

/**
 * 此store文件包含了多边形工具需要的一些信息
 */
/**
 * this store file contains basic info used when polygon editing
 */

// 点的数据结构
// point data struct
export interface IPoint {
	uuid: string;
	x: number;
	y: number;
}

export interface IPoints {
	value: Array<IPoint>;
}

// 是否正在编辑多边形
// whether on editing
const editing: Ref<boolean> = ref(false)
const setEditing = (status: boolean) => {
	editing.value = status
}

// 多边形路径包含的点
// points for polygon path
const points: IPoints = reactive({
	value: []
})
const setPoints = (value: Array<IPoint>) => {
	points.value = value
}

export { editing, points, setEditing, setPoints }
