import { computed, ref, type Ref } from 'vue'

/**
 * 此store文件包含了字形结构变换时需要的一些信息
 */
/**
 * this store file contains basic info used when glyph layout resizing
 */

// 是否正在编辑
// whether on editing
const editing: Ref<boolean> = ref(false)
const setEditing = (status: boolean) => {
	editing.value = status
}

const selectControl = ref('')

export {
	editing,
	setEditing,
	selectControl,
}
