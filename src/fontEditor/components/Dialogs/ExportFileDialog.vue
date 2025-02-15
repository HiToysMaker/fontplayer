<script setup lang="ts">
  /**
	 * 导出工程窗口
	 */
	/**
	 * dialog for export project
	 */

  import { useI18n } from 'vue-i18n'
  import { setExportDialogVisible, exportDialogVisible } from '../../stores/dialogs'
  import { ref } from 'vue'
  import saveAs from 'file-saver'
  import { IFile, selectedFile } from '../../stores/files'
  import { mapToObject, plainFile, plainGlyph } from '../../menus/handlers'
  import { ICustomGlyph, comp_glyphs, constantGlyphMap, constants, glyphs, radical_glyphs, stroke_glyphs } from '../../stores/glyph'
  import { total, loaded, loading } from '../../stores/global'
  const { tm, t } = useI18n()

  const exportItems = ref({
    characters: true,
    stroke_glyphs: true,
    radical_glyphs: true,
    comp_glyphs: true,
    glyphs: true,
  })

  const handleCancel = () => {
    setExportDialogVisible(false)
  }

  const handleClick = () => {
    total.value = 0
    loaded.value = 0
    loading.value = true
    const file = plainFile(selectedFile.value as unknown as IFile)
    let _glyphs: any = []
    let _stroke_glyphs : any = []
    let _radical_glyphs : any = []
    let _comp_glyphs : any = []
    if (exportItems.value.glyphs) {
      _glyphs = glyphs.value.map((glyph: ICustomGlyph) => {
        return plainGlyph(glyph)
      })
    }
    if (exportItems.value.stroke_glyphs) {
      _stroke_glyphs = stroke_glyphs.value.map((glyph: ICustomGlyph) => {
        return plainGlyph(glyph)
      })
    }
    if (exportItems.value.radical_glyphs) {
      _radical_glyphs = radical_glyphs.value.map((glyph: ICustomGlyph) => {
        return plainGlyph(glyph)
      })
    }
    if (exportItems.value.comp_glyphs) {
      _comp_glyphs = comp_glyphs.value.map((glyph: ICustomGlyph) => {
        return plainGlyph(glyph)
      })
    }
    const content = JSON.stringify({
      file,
      constants: constants.value,
      constantGlyphMap: mapToObject(constantGlyphMap),
      version: 1.0,
      glyphs: _glyphs,
      stroke_glyphs: _stroke_glyphs,
      radical_glyphs: _radical_glyphs,
      comp_glyphs: _comp_glyphs,
    })
	  const blob = new Blob([content], {type: "text/plain;charset=utf-8"})
	  saveAs(blob, `${(selectedFile.value as unknown as IFile).name}.json`)
    loading.value = false
    setExportDialogVisible(false)
  }
</script>

<template>
  <el-dialog
    v-model="exportDialogVisible"
    :title="tm('dialogs.exportDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      <div class="text">请选择需要包含的项目：</div>
      <el-checkbox
        v-model="exportItems.characters"
        class="item-check"
        disabled
      >
        字符
      </el-checkbox>
      <el-checkbox
        v-model="exportItems.stroke_glyphs"
        class="item-check"
      >
        笔画
      </el-checkbox>
      <el-checkbox
        v-model="exportItems.radical_glyphs"
        class="item-check"
      >
        部首
      </el-checkbox>
      <el-checkbox
        v-model="exportItems.comp_glyphs"
        class="item-check"
      >
        字形
      </el-checkbox>
      <el-checkbox
        v-model="exportItems.glyphs"
        class="item-check"
      >
        组件
      </el-checkbox>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">{{ t('dialogs.exportDialog.cancel') }}</el-button>
        <el-button type="primary" @click="handleClick">
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