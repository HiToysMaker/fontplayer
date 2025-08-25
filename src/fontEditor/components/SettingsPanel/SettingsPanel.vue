<script setup lang="ts">
  /**
   * 设置面板
   */
  /**
   * setting panel
   */

  import {
    setBackgroundType,
    setBackgroundColor,
    setGridType,
    setGridPrecision,
    BackgroundType,
    GridType,
    fontRenderStyle
  } from '../../stores/global'
  import { type Ref, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  
  const backgroundStyle: Ref<string> = ref('transparent')
  const backgroundColor: Ref<string> = ref('#FFFFFF')
  const gridStyle: Ref<string> = ref('none')
  const gridPrecision: Ref<number> = ref(20)
  
  watch([
    backgroundStyle,
    backgroundColor,
    gridStyle,
    gridPrecision,
  ], () => {
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
  })
</script>

<template>
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
          <el-input-number v-model="gridPrecision" :min="10" :max="50" :precision="2" />
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
</template>

<style scoped>
  .settings-panel {
    width: 100%;
    height: 100%;
    overflow: hidden;
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
      }
    }
    .title {
      height: 36px;
      line-height: 36px;
      padding: 0 10px;
      border-bottom: 1px solid #dcdfe6;
    }
    .grid-style-wrap {
      border-top: 1px solid #dcdfe6;
    }
    .el-form {
      margin: 10px 0;
    }
    .el-radio-group {
      display: flex;
      flex-direction: column;
      align-items: start;
    }
    .el-radio {
      margin: 0;
      flex: 1;
    }
  }
</style>