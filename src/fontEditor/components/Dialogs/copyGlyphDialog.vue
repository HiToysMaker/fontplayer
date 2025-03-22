<script setup lang="ts">
  /**
	 * 复制字形窗口
	 */
	/**
	 * dialog for copying glyph file
	 */

  import { copyGlyphDialogVisible, setCopyGlyphDialogVisible, copiedGlyphUUID } from '../../stores/dialogs'
	import { editStatus } from '../../stores/font'
  import { addGlyph, addGlyphTemplate, generateGlyphTemplate, glyphs, getGlyphByUUID } from '../../stores/glyph'
  import { genUUID } from '../../../utils/string'
  import { ElMessage } from 'element-plus'
	import * as R from 'ramda'
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
import { emitter } from '@/fontEditor/Event/bus'
  const { tm, t } = useI18n()

  const name = ref('')

  const handleCancel = () => {
    setCopyGlyphDialogVisible(false)
  }

  const handleClick = () => {
    if (!name.value) {
      ElMessage('请输入字形名称。')
      return
    }
		let glyph = R.clone(getGlyphByUUID(copiedGlyphUUID.value))
    const originUUID = glyph.uuid
    const uuid = genUUID()
    glyph.uuid = uuid
    glyph.name = name
    glyph.script = glyph.script.replaceAll(originUUID.replaceAll('-', '_'), uuid.replaceAll('-', '_'))

    addGlyph(glyph, editStatus.value)
    addGlyphTemplate(glyph, editStatus.value)
    emitter.emit('renderPreviewCanvasByUUID', glyph.uuid)

    name.value = ''
    setCopyGlyphDialogVisible(false)
  }

  const handleEnter = (e) => {
    e.preventDefault()
	  handleClick()
  }
</script>

<template>
  <el-dialog
    v-model="copyGlyphDialogVisible"
    :title="tm('dialogs.copyGlyphDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      <el-form-item :label="tm('dialogs.copyGlyphDialog.glyphName')">
        <el-input v-model="name" @keyup.enter="handleEnter" />
      </el-form-item>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @pointerdown="handleCancel">{{ t('dialogs.copyGlyphDialog.cancel') }}</el-button>
        <el-button type="primary" @pointerdown="handleClick">
          {{ t('dialogs.copyGlyphDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>