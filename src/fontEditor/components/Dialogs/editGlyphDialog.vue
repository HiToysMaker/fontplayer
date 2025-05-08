<script setup lang="ts">
  /**
	 * 编辑字形名称窗口
	 */
	/**
	 * dialog for editing glyph name
	 */

  import { emitter } from '../../Event/bus';
  import { editGlyphDialogVisible, setEditGlyphDialogVisible, editedGlyphUUID } from '../../stores/dialogs'
  import { modifyGlyph } from '../../stores/glyph'
  import { ElMessage } from 'element-plus';
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { tm, t, locale } = useI18n()

  const name = ref('')

  const handleCancel = () => {
    setEditGlyphDialogVisible(false)
  }

  const handleClick = () => {
    if (!name.value) {
      let msg = '请输入字形名称。'
      if (locale.value === 'zh') {
        msg = '请输入字形名称。'
      } else if (locale.value === 'en') {
        msg = 'Please input glyph\'s name.'
      }
      ElMessage(msg)
      return
    }
		modifyGlyph(editedGlyphUUID.value, {
			name: name.value,
		})
    emitter.emit('updateGlyphInfoPreviewCanvasByUUID', editedGlyphUUID.value)
    name.value = ''
    setEditGlyphDialogVisible(false)
  }

  const handleEnter = (e) => {
    e.preventDefault()
	  handleClick()
  }
</script>

<template>
	<el-dialog
    v-model="editGlyphDialogVisible"
    :title="tm('dialogs.editGlyphDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
    <el-form-item :label="tm('dialogs.editGlyphDialog.glyphName')">
      <el-input v-model="name" @keyup.enter="handleEnter" />
    </el-form-item>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @pointerdown="handleCancel">{{ t('dialogs.editGlyphDialog.cancel') }}</el-button>
        <el-button type="primary" @pointerdown="handleClick">
          {{ t('dialogs.copyGlyphDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>