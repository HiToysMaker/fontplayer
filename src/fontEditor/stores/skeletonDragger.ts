import { computed, ref, type Ref } from 'vue'
import { editGlyph } from './glyph'

/**
 * 此store文件包含了字形骨架拖拽时需要的一些信息
 */
/**
 * this store file contains basic info used when glyph skeleton dragging
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

const editGlyphOnDragging = ref(null)

const onSkeletonSelect = ref(false)
const onSkeletonBind = computed(() => {
  return editGlyph.value?.skeleton?.onSkeletonBind
})

const onSkeletonDragging = ref(false)

// 刷权重
const onSelectBone = ref(false)
const selectedBone = ref(null)
const onWeightSetting = ref(false)
const weightValue = ref(0.5)
const brushSize = ref(100)

export {
	editing,
	setEditing,
	draggingJoint,
	putAtCoord,
	movingJoint,
  editGlyphOnDragging,
  onSkeletonSelect,
  onSkeletonBind,
  onSkeletonDragging,
  onSelectBone,
  selectedBone,
  onWeightSetting,
  weightValue,
  brushSize,
}