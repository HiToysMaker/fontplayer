<script setup lang="ts">
  /**
   * 添加web图标窗口
   */
  /**
   * dialog for adding web icon file
   */

  import { addIconDialogVisible, setAddIconDialogVisible } from '../../stores/dialogs'
  import { selectedFile, addCharacterForCurrentFile, generateCharacterTemplate, addCharacterTemplate } from '../../stores/files'
  import { genUUID, toIconUnicode } from '../../../utils/string'
  import { ElMessage } from 'element-plus'
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { tm, t } = useI18n()

  const text = ref('')

  const handleCancel = () => {
    setAddIconDialogVisible(false)
  }

  const handleClick = () => {
    if (!text.value) {
      ElMessage('请输入图标名称。')
      return
    }
    const count = selectedFile.value.iconsCount

    const iconComponent = {
      uuid: genUUID(),
      text: text.value,
      unicode: toIconUnicode(count),
      components: [],
    }

    const uuid = genUUID()
    const iconFile = {
      uuid,
      type: 'icon',
      character: iconComponent,
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

    text.value = ''
    selectedFile.value.iconsCount++
    addCharacterForCurrentFile(iconFile)
    addCharacterTemplate(generateCharacterTemplate(iconFile))
    setAddIconDialogVisible(false)
  }

  const handleEnter = (e) => {
    e.preventDefault()
	  handleClick()
  }
</script>

<template>
  <el-dialog
    v-model="addIconDialogVisible"
    :title="tm('dialogs.addIconDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      <el-form-item :label="tm('dialogs.addIconDialog.iconName')">
        <el-input v-model="text" @keyup.enter="handleEnter" />
      </el-form-item>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @pointerdown="handleCancel">{{ t('dialogs.addIconDialog.cancel') }}</el-button>
        <el-button type="primary" @pointerdown="handleClick">
          {{ t('dialogs.addIconDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>