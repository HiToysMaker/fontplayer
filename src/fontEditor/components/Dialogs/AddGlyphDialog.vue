<script setup lang="ts">
  /**
	 * 添加字形窗口
	 */
	/**
	 * dialog for adding glyph file
	 */

  import { ParametersMap } from '../../programming/ParametersMap'
  import { addGlyphDialogVisible, setAddGlyphDialogVisible } from '../../stores/dialogs'
  import { Status, editStatus } from '../../stores/font'
  import { addGlyph, addGlyphTemplate, generateGlyphTemplate } from '../../stores/glyph'
  import { genUUID } from '../../../utils/string'
  import { ElMessage } from 'element-plus'
  import { onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { tm, t, locale } = useI18n()

  const name = ref('')

  const handleCancel = () => {
    setAddGlyphDialogVisible(false)
  }

  const handleClick = () => {
    if (!name.value) {
      let msg = '请输入字形名称。'
      if (locale.value === 'zh') {
        msg = '请输入字形名称。'
      } else if (locale.value === 'en') {
        msg = 'Please input glyph\'s name.'
      }
      ElMessage(msg)
      return
    }
    const uuid = genUUID()
    const glyph = {
      uuid,
      type: 'system',
      name: name.value,
      components: [],
      groups: [],
      orderedList: [],
      selectedComponentsUUIDs: [],
      view: {
        zoom: 100,
        translateX: 0,
        translateY: 0,
      },
      parameters: new ParametersMap([]),
      joints: [],
      script: `function script_${uuid.replaceAll('-', '_')} (glyph, constants, FP) {\n\t//Todo something\n}`,
    }
    addGlyph(glyph, editStatus.value)
    addGlyphTemplate(glyph, editStatus.value)
    name.value = ''
    setAddGlyphDialogVisible(false)
  }

  const handleEnter = (e) => {
    e.preventDefault()
	  handleClick()
  }
</script>

<template>
  <el-dialog
    v-model="addGlyphDialogVisible"
    :title="tm('dialogs.addGlyphDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      <el-form-item :label="tm('dialogs.addGlyphDialog.glyphName')">
        <el-input v-model="name" @keyup.enter="handleEnter" />
      </el-form-item>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @pointerdown="handleCancel">{{ t('dialogs.addGlyphDialog.cancel') }}</el-button>
        <el-button type="primary" @pointerdown="handleClick">
          {{ t('dialogs.addGlyphDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>