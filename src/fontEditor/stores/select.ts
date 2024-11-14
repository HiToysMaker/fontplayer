import { ref, type Ref } from 'vue'

/**
 * 该store文件包含一些编辑字符图形时，尤其是选择操作（包括选择控制点、区域等）时所用的信息
 */
/**
 * this store file contain some basic info for select operation on editing
 */

const selectControl: Ref<string> = ref('null')
const setSelectControl = (value: string) => {
	selectControl.value = value
}

const selectAnchor: Ref<string> = ref('')
const setSelectAnchor = (uuid: string) => {
	selectAnchor.value = uuid
}

const selectPenPoint: Ref<string> = ref('')
const setSelectPenPoint = (uuid: string) => {
	selectPenPoint.value = uuid
}

const hoverPenPoint: Ref<string> = ref('')
const setHoverPenPoint = (uuid: string) => {
	hoverPenPoint.value = uuid
}

const onPenEditMode: Ref<boolean> = ref(false)
const setOnPenEditMode = (onEdit: boolean) => {
	onPenEditMode.value = onEdit
}

export {
	selectControl,
	selectAnchor,
	selectPenPoint,
	hoverPenPoint,
	onPenEditMode,
	setSelectControl,
	setSelectPenPoint,
	setSelectAnchor,
	setHoverPenPoint,
	setOnPenEditMode,
}
