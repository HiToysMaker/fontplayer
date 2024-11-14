<script setup lang="ts">
  /**
	 * 添加字符窗口
	 */
	/**
	 * dialog for adding character file
	 */

  import { addTextDialogVisible, setAddTextDialogVisible } from '../../stores/dialogs'
  import { addCharacterForCurrentFile, addCharacterTemplate, generateCharacterTemplate, selectedFile } from '../../stores/files'
  import { genUUID, toUnicode } from '../../../utils/string'
  import { ElMessage } from 'element-plus'
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { tm, t } = useI18n()

  const text = ref('')

  const handleCancel = () => {
    setAddTextDialogVisible(false)
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
    text.value.split('').map((character: string) => {
      const characterComponent = {
        uuid: genUUID(),
        text: character,
        unicode: toUnicode(character),
        components: [],
      }
			const uuid = genUUID()
      const characterFile = {
        uuid,
        type: 'text',
        character: characterComponent,
        components: [],
        groups: [],
        orderedList: [],
        selectedComponentsUUIDs: [],
        view: {
          zoom: 100,
          translateX: 0,
          translateY: 0,
        },
        info: {
          gridSettings: {
            dx: 0,
            dy: 0,
            centerSquareSize: selectedFile.value.width / 3,
            size: selectedFile.value.width,
          },
          layout: '',
          layoutTree: [],
        },
				script: `function script_${uuid.replaceAll('-', '_')} (character, constants, FP) {\n\t//Todo something\n}`,
      }
      addCharacterForCurrentFile(characterFile)
			addCharacterTemplate(generateCharacterTemplate(characterFile))
    })
    text.value = ''
    setAddTextDialogVisible(false)
  }

  const handleEnter = (e) => {
    e.preventDefault()
	  handleClick()
  }
</script>

<template>
  <el-dialog
    v-model="addTextDialogVisible"
    :title="tm('dialogs.addTextDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      <el-form-item :label="tm('dialogs.addTextDialog.title')">
        <el-input v-model="text" @keyup.enter="handleEnter" />
      </el-form-item>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">{{ t('dialogs.addTextDialog.cancel') }}</el-button>
        <el-button type="primary" @click="handleClick">
          {{ t('dialogs.addTextDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>