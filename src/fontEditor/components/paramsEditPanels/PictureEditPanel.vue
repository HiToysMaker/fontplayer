<script setup lang="ts">
	/**
	 * 图片组件参数编辑面板
	 */
	/**
	 * params editing panel for picture component
	 */

  import { Status, editStatus } from '../../stores/font'
  import { modifyComponentForCurrentCharacterFile, selectedComponent, selectedComponentUUID } from '../../stores/files'
  import { useI18n } from 'vue-i18n'
  import {
    modifyComponentForCurrentGlyph,
    selectedComponent as selectedComponent_Glyph,
    selectedComponentUUID as selectedComponentUUID_Glyph
  } from '../../stores/glyph'
  const { tm, t } = useI18n()

  const handleChangeX = (x: number) => {
    if (editStatus.value === Status.Edit) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
        x,
      })
    } else if (editStatus.value === Status.Glyph) {
      modifyComponentForCurrentGlyph(selectedComponentUUID_Glyph.value, {
        x,
      })
    }
  }

  const handleChangeY = (y: number) => {
    if (editStatus.value === Status.Edit) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
        y,
      })
    } else if (editStatus.value === Status.Glyph) {
      modifyComponentForCurrentGlyph(selectedComponentUUID_Glyph.value, {
        y,
      })
    }
  }

  const handleChangeW = (w: number) => {
    if (editStatus.value === Status.Edit) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
        w,
      })
    } else if (editStatus.value === Status.Glyph) {
      modifyComponentForCurrentGlyph(selectedComponentUUID_Glyph.value, {
        w,
      })
    }
  }

  const handleChangeH = (h: number) => {
    if (editStatus.value === Status.Edit) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
        h,
      })
    } else if (editStatus.value === Status.Glyph) {
      modifyComponentForCurrentGlyph(selectedComponentUUID_Glyph.value, {
        h,
      })
    }
  }

  const handleChangeRot = (rotation: number) => {
    if (editStatus.value === Status.Edit) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
        rotation,
      })
    } else if (editStatus.value === Status.Glyph) {
      modifyComponentForCurrentGlyph(selectedComponentUUID_Glyph.value, {
        rotation,
      })
    }
  }

  const handleChangeOpacity = (opacity: number) => {
    if (editStatus.value === Status.Edit) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
        opacity,
      })
    } else if (editStatus.value === Status.Glyph) {
      modifyComponentForCurrentGlyph(selectedComponentUUID_Glyph.value, {
        opacity,
      })
    }
  }
</script>

<template>
  <div class="picture-edit-panel">
    <div class="name-wrap">
      <div class="title">{{ t('panels.paramsPanel.componentName.title') }}</div>
      <el-form
        class="name-form"
        label-width="80px"
      >
        <el-form-item :label="tm('panels.paramsPanel.componentName.label')">
          <el-input
            v-model="selectedComponent.name"
          />
        </el-form-item>
      </el-form>
    </div>
    <div class="transform-wrap">
      <div class="title">{{ t('panels.paramsPanel.transform.title') }}</div>
      <el-form
        class="transfom-form"
        label-width="80px"
      >
        <el-form-item :label="tm('panels.paramsPanel.transform.x')">
          <el-input-number
            :model-value="selectedComponent.x"
            :precision="1"
            @change="handleChangeX"
          />
        </el-form-item>
        <el-form-item :label="tm('panels.paramsPanel.transform.y')">
          <el-input-number
            :model-value="selectedComponent.y"
            :precision="1"
            @change="handleChangeY"
          />
        </el-form-item>
        <el-form-item :label="tm('panels.paramsPanel.transform.w')">
          <el-input-number
            :model-value="selectedComponent.w"
            :precision="1"
            @change="handleChangeW"
          />
        </el-form-item>
        <el-form-item :label="tm('panels.paramsPanel.transform.h')">
          <el-input-number
            :model-value="selectedComponent.h"
            :precision="1"
            @change="handleChangeH"
          />
        </el-form-item>
        <el-form-item :label="tm('panels.paramsPanel.transform.rotation')">
          <el-input-number
            :model-value="selectedComponent.rotation"
            :precision="1"
            @change="handleChangeRot"
          />
        </el-form-item>
      </el-form>
    </div>
    <div class="opacity-wrap">
      <div class="title">{{ tm('panels.paramsPanel.opacity.title') }}</div>
      <el-form
        class="opacitym-form"
        label-width="80px"
      >
        <el-form-item :label="tm('panels.paramsPanel.opacity.opacity')">
          <el-input-number
            :model-value="selectedComponent.opacity"
            :min="0.0"
            :max="1.0"
            :step="0.05"
            @change="handleChangeOpacity"
          />
          <el-slider
            :model-value="selectedComponent.opacity"
            :precision="0.01"
            :min="0.0"
            :max="1.0"
            :step="0.05"
            @input="handleChangeOpacity"
          >
          </el-slider>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
  .picture-edit-panel {
    width: 100%;
    height: 100%;
    overflow: hidden;
    .el-input {
      width: 150px;
    }
  }

  .title {
    height: 36px;
    line-height: 36px;
    padding: 0 10px;
    border-bottom: 1px solid #dcdfe6;
  }

  .el-form {
    margin: 10px 0;
  }

  .el-slider {
    width: 150px;
  }
</style>