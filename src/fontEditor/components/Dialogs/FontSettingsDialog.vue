<script setup lang="ts">
  /**
   * 字体设置窗口
   */
  /**
   * dialog for font setting
   */

  import { getEnName, name_data } from '../../stores/settings'
  import { fontSettingsDialogVisible, setFontSettings2DialogVisible, setFontSettingsDialogVisible } from '../../stores/dialogs'
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
    // 如果字体名称改变，需要更新name表信息
    let subFamily = '常规体'
    let subFamilyEn = 'Regular'
    if (name.value !== selectedFile.value.name) {
      for(let i = 0; i < name_data.value.length; i++) {
        const item = name_data.value[i]
        if (item.nameID === 1 && item.langID === 0x804) {
          item.value = name.value
        } else if (item.nameID === 1 && item.langID === 0x409) {
          item.value = getEnName(name.value)
        } else if (item.nameID === 2 && item.langID === 0x804) {
          subFamily = item.value
        } else if (item.nameID === 2 && item.langID === 0x409) {
          subFamilyEn = item.value
        } else if (item.nameID === 4 && item.langID === 0x804) {
          item.value = name.value + ' ' + subFamily
        } else if (item.nameID === 4 && item.langID === 0x409) {
          item.value = getEnName(name.value) + ' ' + subFamilyEn
        } else if (item.nameID === 6 && item.langID === 0x804) {
          item.value = (getEnName(name.value) + '-' + subFamilyEn).replace(/\s/g, '').slice(0, 63)
        } else if (item.nameID === 6 && item.langID === 0x409) {
          item.value =  (getEnName(name.value) + '-' + subFamilyEn).replace(/\s/g, '').slice(0, 63)
        }
      }
    }
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

  const moreSettings = () => {
    setFontSettings2DialogVisible(true)
    setFontSettingsDialogVisible(false)
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
        <el-button @pointerdown="moreSettings">更多设置</el-button>
        <el-button @pointerdown="setFontSettingsDialogVisible(false)">{{ t('dialogs.fontSettingsDialog.cancel') }}</el-button>
        <el-button
          type="primary"
          @pointerdown="() => updateFont()"
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