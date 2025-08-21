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
  const { tm, t, locale } = useI18n()

  const text = ref('')

  const handleCancel = () => {
    setAddTextDialogVisible(false)
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
    // 过滤掉.notdef字符
    const characters = text.value.split('').filter((character: string) => character !== '.notdef')
    
    if (characters.length !== text.value.split('').length) {
      ElMessage({
        message: '不能创建.notdef字符，该字符已自动添加',
        type: 'warning'
      })
    }
    
    characters.map((character: string) => {
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
            default: true,
          },
          useSkeletonGrid: false,
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
        <el-button @pointerdown="handleCancel">{{ t('dialogs.addTextDialog.cancel') }}</el-button>
        <el-button type="primary" @pointerdown="handleClick">
          {{ t('dialogs.addTextDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>