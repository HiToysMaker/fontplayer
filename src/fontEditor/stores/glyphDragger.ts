import { computed, ref, type Ref } from 'vue'
import { editCharacterFile, selectedItemByUUID, traverseComponents } from './files'

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

const editCharacterFileOnDragging = ref(null)

// 子组件列表
// sub components list
const SubComponentsOnDragging = computed(() => {
	if (!editCharacterFileOnDragging.value) return null
	const characterFile = editCharacterFileOnDragging.value
	if (!editCharacterFile.value?.selectedComponentsTree || !editCharacterFile?.selectedComponentsTree.length) return null
	let rootComponent = null
	for (let i = 0; i < editCharacterFile.value?.selectedComponentsTree.length - 1; i++) {
		const rootUUID = editCharacterFile.value?.selectedComponentsTree[i]
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
const SubComponentsRootOnDragging = computed(() => {
	if (!editCharacterFileOnDragging.value) return null
	const characterFile = editCharacterFileOnDragging.value
	if (!editCharacterFile.value?.selectedComponentsTree || !editCharacterFile.value?.selectedComponentsTree.length) return null
	let rootComponent = null
	for (let i = 0; i < editCharacterFile.value?.selectedComponentsTree.length - 1; i++) {
		const rootUUID = editCharacterFile.value?.selectedComponentsTree[i]
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
const selectedSubComponentOnDragging = computed(() => {
	let rs = null
	if (!editCharacterFileOnDragging.value) {
		rs = null
	} else {
		const characterFile = editCharacterFileOnDragging.value
		if (!editCharacterFile.value?.selectedComponentsTree || !editCharacterFile.value?.selectedComponentsTree.length) {
			rs = null
		} else {
			let rootComponent = null
			for (let i = 0; i < editCharacterFile.value?.selectedComponentsTree.length - 1; i++) {
				const rootUUID = editCharacterFile.value?.selectedComponentsTree[i]
				if (!rootComponent) {
					rootComponent = selectedItemByUUID(characterFile.components, rootUUID)
				} else {
					rootComponent = selectedItemByUUID(rootComponent.value.components, rootUUID)
				}
			}
			const componentUUID = editCharacterFile.value?.selectedComponentsTree[editCharacterFile.value?.selectedComponentsTree.length - 1]
			if (componentUUID !== 'null') {
				const component = selectedItemByUUID(rootComponent.value.components, componentUUID)
				rs = component
			}
		}
	}
	return rs
})

const selectedComponentsOnDragging = computed(() => {
	if (!editCharacterFileOnDragging.value) return null
	const characterFile = editCharacterFileOnDragging.value
	const components = editCharacterFile.value?.selectedComponentsUUIDs.map((uuid: string) => {
		// return selectedItemByUUID(characterFile.components, uuid)
		return traverseComponents(characterFile.components, uuid)
	})
	return components
})

const selectedComponentOnDragging = computed(() => {
	if (!selectedComponentsOnDragging.value) return null
	if (selectedComponentsOnDragging.value.length === 0) {
		return null
	}
	if (selectedComponentsOnDragging.value.length === 1) {
		return selectedComponentsOnDragging.value[0]
	}
	return 'multi'
})

export {
	editing,
	setEditing,
	draggingJoint,
	putAtCoord,
	movingJoint,
	editCharacterFileOnDragging,
	selectedSubComponentOnDragging,
	SubComponentsOnDragging,
	SubComponentsRootOnDragging,
	selectedComponentsOnDragging,
	selectedComponentOnDragging
}