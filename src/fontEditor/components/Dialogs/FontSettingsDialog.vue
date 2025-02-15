<script setup lang="ts">
  /**
   * 字体设置窗口
   */
  /**
   * dialog for font setting
   */

  import { fontSettingsDialogVisible, setFontSettingsDialogVisible } from '../../stores/dialogs'
  import { selectedFile, updateFontSettings } from '../../stores/files'
  import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { tm, t } = useI18n()

  const name: Ref<string> = ref('untitled')
  const unitsPerEm: Ref<number> = ref(1000)
  const ascender: Ref<number> = ref(800)
  const descender: Ref<number> = ref(-200)

  onMounted(() => {
    name.value = selectedFile.value.name
    unitsPerEm.value = selectedFile.value.fontSettings.unitsPerEm
    ascender.value = selectedFile.value.fontSettings.ascender
    descender.value = selectedFile.value.fontSettings.descender
  })

  watch(selectedFile, () => {
    if (!selectedFile.value) return
    name.value = selectedFile.value.name
    unitsPerEm.value = selectedFile.value.fontSettings.unitsPerEm
    ascender.value = selectedFile.value.fontSettings.ascender
    descender.value = selectedFile.value.fontSettings.descender
  }, {
    deep: true,
  })

  const updateFont = () => {
    updateFontSettings({
      name: name.value,
      unitsPerEm: unitsPerEm.value,
      ascender: ascender.value,
      descender: descender.value,
    })
    setFontSettingsDialogVisible(false)
  }

  const close = () => {
    setFontSettingsDialogVisible(false)
  }

	const onAscenderChange = () => {
		descender.value =  ascender.value - unitsPerEm.value
	}

	const onDescenderChange = () => {
		ascender.value = (unitsPerEm.value + descender.value)
	}
</script>

<template>
  <el-dialog
    :model-value="fontSettingsDialogVisible"
    class="font-settings-dialog"
    :title="tm('dialogs.fontSettingsDialog.title')"
    width="320px"
    :before-close="close"
  >
    <el-form
      class="create-file-form"
      label-width="80px"
    >
      <el-form-item :label="tm('dialogs.fontSettingsDialog.fontName')">
        <el-input
          v-model="name"
        />
      </el-form-item>
      <el-form-item label="unitsPerEm">
        <el-input-number
          v-model="unitsPerEm"
          :precision="0"
        />
      </el-form-item>
      <el-form-item label="ascender">
        <el-input-number
          v-model="ascender"
          :precision="0"
          @change="onAscenderChange"
        />
      </el-form-item>
      <el-form-item label="descender">
        <el-input-number
          v-model="descender"
          :precision="0"
          @change="onDescenderChange"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="setFontSettingsDialogVisible(false)">{{ t('dialogs.fontSettingsDialog.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="() => updateFont()"
        >
          {{ t('dialogs.fontSettingsDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
  .font-settings-dialog {
    .el-input {
      width: 180px;
    }
    .el-input-number {
      width: 180px;
    }
  }
</style>