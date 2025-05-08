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
  const { tm, t, locale } = useI18n()

  const text = ref('')

  const handleCancel = () => {
    setEditCharacterDialogVisible(false)
  }

  const handleClick = () => {
    if (!text.value) {
      let msg = '请输入字符名称。'
      if (locale.value === 'zh') {
        msg = '请输入字符名称。'
      } else if (locale.value === 'en') {
        msg = 'Please input character\'s name.'
      }
      ElMessage(msg)
      return
    }
    if (text.value && text.value.length > 1) {
      let msg = '请输入单个字符。'
      if (locale.value === 'zh') {
        msg = '请输入单个字符。'
      } else if (locale.value === 'en') {
        msg = 'Please input a single character.'
      }
      ElMessage(msg)
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
        <el-button @pointerdown="handleCancel">{{ t('dialogs.editCharacterDialog.cancel') }}</el-button>
        <el-button type="primary" @pointerdown="handleClick">
          {{ t('dialogs.editCharacterDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>