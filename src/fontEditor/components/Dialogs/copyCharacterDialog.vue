<script setup lang="ts">
  /**
	 * 复制字符窗口
	 */
	/**
	 * dialog for copying character file
	 */

  import { copyCharacterDialogVisible, setCopyCharacterDialogVisible, copiedCharacterUUID } from '../../stores/dialogs'
  import { addCharacterForCurrentFile, addCharacterTemplate, generateCharacterTemplate, selectedFile } from '../../stores/files'
  import { genUUID, toUnicode } from '../../../utils/string'
  import { ElMessage } from 'element-plus'
  import * as R from 'ramda'
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
import { emitter } from '@/fontEditor/Event/bus'
  const { tm, t } = useI18n()

  const text = ref('')

  const handleCancel = () => {
    setCopyCharacterDialogVisible(false)
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
		let character = null
		for (let i = 0; i < selectedFile.value.characterList.length; i++) {
			if (selectedFile.value.characterList[i].uuid === copiedCharacterUUID.value) {
				character = R.clone(selectedFile.value.characterList[i])
        const originUUID = character.uuid
				const uuid = genUUID()
				//@ts-ignore
				character.uuid = uuid
        character.script = character.script.replaceAll(originUUID.replaceAll('-', '_'), uuid.replaceAll('-', '_'))
				const characterComponent = {
					uuid: genUUID(),
					text: text.value,
					unicode: toUnicode(text.value),
					components: [],
				}
				//@ts-ignore
				character.character = characterComponent
				break
			}
		}
		addCharacterForCurrentFile(character)
		addCharacterTemplate(generateCharacterTemplate(character))
    emitter.emit('renderPreviewCanvasByUUID', character.uuid)
    text.value = ''
    setCopyCharacterDialogVisible(false)
  }

  const handleEnter = (e) => {
    e.preventDefault()
	  handleClick()
  }
</script>

<template>
  <el-dialog
    v-model="copyCharacterDialogVisible"
    :title="tm('dialogs.copyCharacterDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      <el-form-item :label="tm('dialogs.copyCharacterDialog.title')">
        <el-input v-model="text" @keyup.enter="handleEnter"/>
      </el-form-item>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">{{ t('dialogs.copyCharacterDialog.cancel') }}</el-button>
        <el-button type="primary" @click="handleClick">
          {{ t('dialogs.copyCharacterDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>