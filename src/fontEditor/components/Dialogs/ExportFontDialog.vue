<script setup lang="ts">
  /**
	 * 导出字体窗口
	 */
	/**
	 * dialog for export font
	 */

  import { useI18n } from 'vue-i18n'
  import { setExportFontDialogVisible, exportFontDialogVisible } from '../../stores/dialogs'
  import { ref } from 'vue'
  import saveAs from 'file-saver'
  import { IFile, selectedFile } from '../../stores/files'
  import { computeOverlapRemovedContours, exportFont, mapToObject, plainFile, plainGlyph } from '../../menus/handlers'
  import { ICustomGlyph, comp_glyphs, constantGlyphMap, constants, glyphs, radical_glyphs, stroke_glyphs } from '../../stores/glyph'
  import { total, loaded, loading, loadingMsg } from '../../stores/global'
  const { tm, t } = useI18n()

  const options = ref({
    remove_overlap: false,
  })

  const handleCancel = () => {
    setExportFontDialogVisible(false)
  }

  const handleClick = () => {
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
      setTimeout(() => exportFont(options.value), 100)
      setExportFontDialogVisible(false)
    }, 100)
  }
</script>

<template>
  <el-dialog
    v-model="exportFontDialogVisible"
    :title="tm('dialogs.exportFontDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
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