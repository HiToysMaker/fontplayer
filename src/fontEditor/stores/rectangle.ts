import { ref, type Ref } from 'vue'

/**
 * 此store文件包含了长方形工具需要的一些信息
 */
/**
 * this store file contains basic info used when rectangle editing
 */

// 是否正在编辑长方形
// whether on editing
const editing: Ref<boolean> = ref(false)
const setEditing = (status: boolean) => {
	editing.value = status
}

// 长方形起始位置x坐标
// rectangle x coord
const rectX: Ref<number> = ref(-1)
const setRectX = (value: number) => {
	rectX.value = value
}

// 长方形起始位置y坐标
// rectangle y coord
const rectY: Ref<number> = ref(-1)
const setRectY = (value: number) => {
	rectY.value = value
}

// 长方形宽度
// rectangle width
const rectWidth: Ref<number> = ref(0)
const setRectWidth = (value: number) => {
	rectWidth.value = value
}

// 长方形高度
// rectangle height
const rectHeight: Ref<number> = ref(0)
const setRectHeight= (value: number) => {
	rectHeight.value = value
}

export {
	editing,
	rectX,
	rectY,
	rectWidth,
	rectHeight,
	setEditing,
	setRectX,
	setRectY,
	setRectWidth,
	setRectHeight,
}
