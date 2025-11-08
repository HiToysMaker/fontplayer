<script setup lang="ts">
  /**
	 * 导出字体窗口
	 */
	/**
	 * dialog for export font
	 */

  import { useI18n } from 'vue-i18n'
  import { setExportFontTauriDialogVisible, exportFontTauriDialogVisible } from '../../stores/dialogs'
  import { ref } from 'vue'
  import saveAs from 'file-saver'
  import { IFile, selectedFile } from '../../stores/files'
  import { computeOverlapRemovedContours, exportFont_tauri, mapToObject, plainFile, plainGlyph } from '../../menus/handlers'
  import { ICustomGlyph, comp_glyphs, constantGlyphMap, constants, glyphs, radical_glyphs, stroke_glyphs } from '../../stores/glyph'
  import { total, loaded, loading, loadingMsg } from '../../stores/global'
  const { tm, t } = useI18n()

  const options = ref({
    contour_storage: 'cff',
    remove_overlap: false,
  })

  const handleCancel = () => {
    setExportFontTauriDialogVisible(false)
  }

  const handleClick = async () => {
    if (options.value.remove_overlap) {
      total.value = selectedFile.value.characterList.length * 4
    } else {
      total.value = selectedFile.value.characterList.length * 3
    }
    loaded.value = 0
    loading.value = true
    loadingMsg.value = '正在对字符进行处理，请稍候...'
    setTimeout(async () => {
      if (options.value.remove_overlap) {
        await computeOverlapRemovedContours()
      }
      setTimeout(() => exportFont_tauri(options.value), 100)
      setExportFontTauriDialogVisible(false)
    }, 100)
  }
</script>

<template>
  <el-dialog
    v-model="exportFontTauriDialogVisible"
    :title="tm('dialogs.exportFontDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      <div class="contour-group">
        <div class="group-title">{{ t('dialogs.exportFontDialog.contourStorageTitle') }}</div>
        <el-radio-group v-model="options.contour_storage">
          <el-radio class="contour-radio" label="glyf">
            <span>{{ t('dialogs.exportFontDialog.contourStorageTrueTypeLabel') }}</span>
            <el-tooltip :content="t('dialogs.exportFontDialog.contourStorageTrueTypeTooltip')" placement="top">
              <el-icon class="help-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </el-radio>
          <el-radio class="contour-radio" label="cff">
            <span>{{ t('dialogs.exportFontDialog.contourStorageCffLabel') }}</span>
            <el-tooltip :content="t('dialogs.exportFontDialog.contourStorageCffTooltip')" placement="top">
              <el-icon class="help-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </el-radio>
        </el-radio-group>
      </div>
      <el-checkbox
        v-model="options.remove_overlap"
        class="item-check"
      >
        {{ t('menus.tools.remove_overlap') }}
      </el-checkbox>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @pointerdown="handleCancel">{{ t('dialogs.exportDialog.cancel') }}</el-button>
        <el-button type="primary" @pointerdown="handleClick">
          {{ t('dialogs.exportDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
  .form-wrapper {
    color: var(--light-2) !important
  }
</style>