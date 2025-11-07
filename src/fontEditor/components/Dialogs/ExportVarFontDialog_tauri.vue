<script setup lang="ts">
  /**
	 * 导出可变字体窗口
	 */
	/**
	 * dialog for export font
	 */

  import { useI18n } from 'vue-i18n'
  import { setExportVarFontDialogVisible, exportVarFontDialogVisible, setExportVarFontTauriDialogVisible, exportVarFontTauriDialogVisible } from '../../stores/dialogs'
  import { ref } from 'vue'
  import saveAs from 'file-saver'
  import { IFile, selectedFile } from '../../stores/files'
  import { computeOverlapRemovedContours, exportFont, exportVarFont_tauri, mapToObject, plainFile, plainGlyph } from '../../menus/handlers'
  import { ICustomGlyph, comp_glyphs, constantGlyphMap, constants, glyphs, radical_glyphs, stroke_glyphs } from '../../stores/glyph'
  import { total, loaded, loading, loadingMsg } from '../../stores/global'
  const { tm, t } = useI18n()

  const onSelectConstant = ref(false)
  const selectedConstant = ref('')
  const axes = ref([])
  const options = ref({
    remove_overlap: false,
  })

  const handleCancel = () => {
    setExportVarFontTauriDialogVisible(false)
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
      selectedFile.value.variants = {
        axes: axes.value,
        instances: [],
      }
      if (options.value.remove_overlap) {
        await computeOverlapRemovedContours()
      }
      setTimeout(() => exportVarFont_tauri(options.value), 100)
      setExportVarFontTauriDialogVisible(false)
    }, 100)
  }

  const addAxis = () => {
    onSelectConstant.value = true
  }
  const onSelectConstantChange = (value) => {
    selectedConstant.value = value
    const constant = constants.value.find((constant) => constant.uuid === value)
    if (constant) {
      axes.value.push({
        uuid: constant.uuid,
        name: constant.name,
        defaultValue: constant.value,
        minValue: constant.min,
        maxValue: constant.max,
        axisTag: '',
      })
    }
    onSelectConstant.value = false
  }
</script>

<template>
  <el-dialog
    v-model="exportVarFontTauriDialogVisible"
    title="导出可变字体"
    width="360px"
  >
    <el-scrollbar height="300px">
      <div class="form-wrapper">
        <el-button v-if="!onSelectConstant" class="add-axis-button" @pointerdown="addAxis">添加可变轴</el-button>
        <el-select
          class="constant-select"
          v-if="onSelectConstant" v-model="selectedConstant" placeholder="选择全局变量"
          @change="onSelectConstantChange"
        >
          <el-option v-for="parameter in constants" :key="parameter.uuid" :label="parameter.name" :value="parameter.uuid"></el-option>
        </el-select>
        <div class="axis-item" v-for="axis in axes">
          <el-form-item label="axisTag">
            <el-input v-model="axis.axisTag" />
          </el-form-item>
          <el-form-item label="axisName">
            <el-input v-model="axis.name" />
          </el-form-item>
          <el-form-item label="defaultValue">
            <el-input-number v-model="axis.defaultValue" />
          </el-form-item>
          <el-form-item label="minValue">
            <el-input-number v-model="axis.minValue" />
          </el-form-item>
          <el-form-item label="maxValue">
            <el-input-number v-model="axis.maxValue" />
          </el-form-item>
        </div>
      </div>
    </el-scrollbar>
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
    color: var(--light-2) !important;
    min-height: 300px;
    .constant-select {
      width: 100% !important;
    }
    .add-axis-button {
      width: 100%;
      margin-bottom: 10px;
    }
    .axis-item {
      margin-bottom: 20px;
      border-bottom: 1px solid var(--light-5);
    }
  }
</style>