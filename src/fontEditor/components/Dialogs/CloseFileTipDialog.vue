<script setup lang="ts">
  /**
	 * 关闭文件提示窗口
	 */
	/**
	 * dialog for close file tips
	 */

  import { useI18n } from 'vue-i18n'
  import { setCloseFileTipDialogVisible, closeFileTipDialogVisible } from '../../stores/dialogs'
  import { removeFile, files, clearCharacterRenderList } from '../../stores/files'
  import { glyphs, stroke_glyphs, comp_glyphs, radical_glyphs, clearGlyphRenderList, clearSelectionGlyphRenderList } from '../../stores/glyph'
  import { Status } from '../../stores/font'
  const { tm, t } = useI18n()

  const handleCancel = () => {
    setCloseFileTipDialogVisible(false)
  }

  const handleClick = () => {
    removeFile(files.value[0].uuid)
    clearCharacterRenderList()
    clearGlyphRenderList(Status.GlyphList)
    clearGlyphRenderList(Status.StrokeGlyphList)
    clearGlyphRenderList(Status.RadicalGlyphList)
    clearGlyphRenderList(Status.CompGlyphList)
    clearSelectionGlyphRenderList(Status.GlyphList)
		clearSelectionGlyphRenderList(Status.StrokeGlyphList)
    clearSelectionGlyphRenderList(Status.RadicalGlyphList)
    clearSelectionGlyphRenderList(Status.CompGlyphList)
    glyphs.value = []
    stroke_glyphs.value = []
    radical_glyphs.value = []
    comp_glyphs.value = []
    setCloseFileTipDialogVisible(false)
  }
</script>

<template>
  <el-dialog
    v-model="closeFileTipDialogVisible"
    :title="tm('dialogs.tipsDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      {{ t('dialogs.tipsDialog.tip1') }}
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">{{ t('dialogs.tipsDialog.cancel') }}</el-button>
        <el-button type="primary" @click="handleClick">
          {{ t('dialogs.tipsDialog.confirm') }}
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