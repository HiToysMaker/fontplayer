import { ref, type Ref } from 'vue'

/**
 * 此store文件包含了ellipse编辑时需要的一些信息
 */
/**
 * this store file contains basic info used when ellipse editing
 */

// 是否正在编辑
// whether on editing
const editing: Ref<boolean> = ref(false)
const setEditing = (status: boolean) => {
	editing.value = status
}

// 椭圆起始位置x坐标
// ellipse x coord
const ellipseX: Ref<number> = ref(-1)
const setEllipseX = (value: number) => {
	ellipseX.value = value
}

// 椭圆起始位置y坐标
// ellipse y coord
const ellipseY: Ref<number> = ref(-1)
const setEllipseY = (value: number) => {
	ellipseY.value = value
}

// 椭圆x半径
// ellipse x radius
const radiusX: Ref<number> = ref(0)
const setRadiusX = (value: number) => {
	radiusX.value = value
}

// 椭圆y半径
// ellipse y radius
const radiusY: Ref<number> = ref(0)
const setRadiusY = (value: number) => {
	radiusY.value = value
}

export {
	editing,
	ellipseX,
	ellipseY,
	radiusX,
	radiusY,
	setEditing,
	setEllipseX,
	setEllipseY,
	setRadiusX,
	setRadiusY,
}
