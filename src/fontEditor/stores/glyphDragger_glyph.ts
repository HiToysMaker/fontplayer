import { computed, ref, type Ref } from 'vue'

/**
 * 此store文件包含了字形拖拽时需要的一些信息
 */
/**
 * this store file contains basic info used when glyph dragging
 */

// 是否正在编辑
// whether on editing
const editing: Ref<boolean> = ref(false)
const setEditing = (status: boolean) => {
	editing.value = status
}

const draggingJoint = ref(null)

const putAtCoord = ref(null)

const movingJoint = ref(null)

export {
	editing,
	setEditing,
	draggingJoint,
	putAtCoord,
	movingJoint,
}