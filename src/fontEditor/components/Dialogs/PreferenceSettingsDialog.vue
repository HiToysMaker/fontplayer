<script setup lang="ts">
  /**
   * 偏好设置窗口
   */
  /**
   * dialog for preference setting
   */

  import { preferenceSettingsDialogVisible, setPreferenceSettingsDialogVisible } from '../../stores/dialogs'
  import {
    setBackgroundType,
    setBackgroundColor,
    setGridType,
    setGridPrecision,
    BackgroundType,
    GridType,
    fontRenderStyle,
  } from '../../stores/global'
  import { type Ref, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { tm, t } = useI18n()

  const updatePreference = () => {
    switch(gridStyle.value) {
      case 'none':
        setGridType(GridType.None)
        break
      case 'mesh':
        setGridType(GridType.Mesh)
        break
      case 'mi':
        setGridType(GridType.Mi)
        break
      case 'layout':
        setGridType(GridType.LayoutGrid)
        break
    }
    switch(backgroundStyle.value) {
      case 'color':
        setBackgroundType(BackgroundType.Color)
        break
      case 'transparent':
        setBackgroundType(BackgroundType.Transparent)
        break
    }
    if (backgroundColor.value) {
      setBackgroundColor(backgroundColor.value)
    }
    if (gridPrecision.value && gridStyle.value === 'mesh') {
      setGridPrecision(gridPrecision.value)
    }
    setPreferenceSettingsDialogVisible(false)
  }

  const close = () => {
    setPreferenceSettingsDialogVisible(false)
  }
  
  const backgroundStyle: Ref<string> = ref('transparent')
  const backgroundColor: Ref<string> = ref('#FFFFFF')
  const gridStyle: Ref<string> = ref('none')
  const gridPrecision: Ref<number> = ref(10)
</script>

<template>
  <el-dialog
    :model-value="preferenceSettingsDialogVisible"
    class="preference-settings-dialog"
    :title="tm('dialogs.preferenceDialog.title')"
    width="360px"
    :before-close="close"
  >
    <div class="settings-panel">
      <div class="background-style-wrap">
        <div class="title">{{ t('panels.settingsPanel.background.background') }}</div>
        <el-form
          class="background-form"
          label-width="80px"
        >
          <div class="form-item">
            <div class="form-label"> {{ t('panels.settingsPanel.background.style') }} </div>
            <el-radio-group v-model="backgroundStyle">
              <el-radio label="color">{{ t('panels.settingsPanel.background.color') }}</el-radio>
              <el-radio label="transparent">{{ t('panels.settingsPanel.background.transparent') }}</el-radio>
            </el-radio-group>
          </div>
          <div class="form-item" v-show="backgroundStyle === 'color'">
            <div class="form-label"> {{ t('panels.settingsPanel.background.color') }} </div>
            <el-color-picker v-model="backgroundColor" id="backgroundColor" />
          </div>
        </el-form>
      </div>
      <div class="grid-style-wrap">
        <div class="title">{{ t('panels.settingsPanel.mesh.mesh') }}</div>
        <el-form
          class="grid-form"
          label-width="80px"
        >
          <div class="form-item">
            <div class="form-label"> {{ t('panels.settingsPanel.mesh.style') }} </div>
            <el-radio-group v-model="gridStyle" id="gridStyle">
              <el-radio label="none">{{ t('panels.settingsPanel.mesh.none') }}</el-radio>
              <el-radio label="mesh">{{ t('panels.settingsPanel.mesh.mesh') }}</el-radio>
              <el-radio label="mi">{{ t('panels.settingsPanel.mesh.mi') }}</el-radio>
              <el-radio label="layout">{{ t('panels.settingsPanel.mesh.layout') }}</el-radio>
            </el-radio-group>
          </div>
          <div class="form-item" v-show="gridStyle === 'mesh'">
            <div class="form-label"> {{ t('panels.settingsPanel.mesh.precision') }} </div>
            <el-input-number v-model="gridPrecision" :min="10" :max="50" />
          </div>
        </el-form>
      </div>
      <div class="font-render-style-wrap">
        <div class="title">{{ t('panels.settingsPanel.render.render') }}</div>
        <el-form
          class="font-render-form"
          label-width="80px"
        >
          <div class="form-item">
            <div class="form-label"> {{ t('panels.settingsPanel.render.style') }} </div>
            <el-radio-group v-model="fontRenderStyle" id="renderStyle">
              <el-radio label="contour">{{ t('panels.settingsPanel.render.contour') }}</el-radio>
              <el-radio label="color">{{ t('panels.settingsPanel.render.color') }}</el-radio>
            </el-radio-group>
          </div>
        </el-form>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="setPreferenceSettingsDialogVisible(false)">{{ tm('dialogs.preferenceDialog.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="() => updatePreference()"
        >
          {{ tm('dialogs.preferenceDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
  .preference-settings-dialog {
    .title {
      background-color: var(--primary-0);
      padding: 5px;
      color: var(--light-2);
    }
    :deep(.el-dialog__body) {
      padding: 5px 20px 10px 20px;
    }
    .form-item {
      display: flex;
      flex-direction: row;
      padding: 10px 0;
      .form-label {
        width: 80px;
        text-align: right;
        padding-right: 10px;
        color: var(--light-3);
        font-size: 14px;
        line-height: 32px;
      }
    }
  }
</style>