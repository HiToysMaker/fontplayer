<script setup lang="ts">
  /**
	 * 编辑字符窗口
	 */
	/**
	 * dialog for editing character file
	 */

  import { emitter } from '../../Event/bus'
  import { editCharacterDialogVisible, setEditCharacterDialogVisible, editedCharacterUUID } from '../../stores/dialogs'
  import { modifyCharacterFile, selectedFile } from '../../stores/files'
  import { genUUID, toUnicode } from '../../../utils/string'
  import { ElMessage } from 'element-plus'
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { tm, t } = useI18n()

  const text = ref('')

  const handleCancel = () => {
    setEditCharacterDialogVisible(false)
  }

  const handleClick = () => {
    if (!text.value) {
      ElMessage('请输入图标名称。')
      return
    }
    if (text.value && text.value.length > 1) {
      ElMessage('请输入单个字符。')
      return
    }
		const characterComponent = {
			uuid: genUUID(),
			text: text.value,
			unicode: toUnicode(text.value),
			components: [],
		}
		modifyCharacterFile(editedCharacterUUID.value, {
			character: characterComponent,
		})
    emitter.emit('updateCharacterInfoPreviewCanvasByUUID', editedCharacterUUID.value)
    text.value = ''
    setEditCharacterDialogVisible(false)
  }

  const handleEnter = (e) => {
    e.preventDefault()
	  handleClick()
  }
</script>

<template>
  <el-dialog
    v-model="editCharacterDialogVisible"
    :title="tm('dialogs.editCharacterDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      <el-form-item :label="tm('dialogs.editCharacterDialog.title')">
        <el-input v-model="text" @keyup.enter="handleEnter" />
      </el-form-item>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">{{ t('dialogs.editCharacterDialog.cancel') }}</el-button>
        <el-button type="primary" @click="handleClick">
          {{ t('dialogs.editCharacterDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>