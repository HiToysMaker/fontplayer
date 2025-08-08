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
  import { total, loaded, loading } from '../../stores/global'
  const { tm, t } = useI18n()

  const options = ref({
    remove_overlap: false,
  })

  const handleCancel = () => {
    setExportFontTauriDialogVisible(false)
  }

  const handleClick = async () => {
    total.value = selectedFile.value.characterList.length * 4
    loaded.value = 0
    loading.value = true
    await computeOverlapRemovedContours()
    await exportFont_tauri(options.value)
    setExportFontTauriDialogVisible(false)
  }
</script>

<template>
  <el-dialog
    v-model="exportFontTauriDialogVisible"
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