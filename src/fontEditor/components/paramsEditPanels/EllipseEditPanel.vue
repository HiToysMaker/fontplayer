<script setup lang="ts">
	/**
	 * 椭圆组件参数编辑面板
	 */
	/**
	 * params editing panel for ellipse component
	 */

  import { modifyComponentForCurrentCharacterFile, selectedComponent, selectedComponentUUID } from '../../stores/files'
  import {
    modifyComponentForCurrentGlyph,
    selectedComponent as selectedComponent_Glyph,
    selectedComponentUUID as selectedComponentUUID_Glyph
  } from '../../stores/glyph'
  import { editStatus, Status } from '../../stores/font'
  import { useI18n } from 'vue-i18n'
  import { OpType, saveState, StoreType } from '@/fontEditor/stores/edit'
  const { tm, t } = useI18n()

  const saveEllipseEditState = () => {
    // 保存状态
		saveState('编辑椭圆组件参数', [
			editStatus.value === Status.Glyph ? StoreType.EditGlyph : StoreType.EditCharacter
		],
			OpType.Undo,
		)
  }

  const handleChangeX = (x: number) => {
    saveEllipseEditState()
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
    saveEllipseEditState()
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
    saveEllipseEditState()
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
    saveEllipseEditState()
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
    saveEllipseEditState()
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
</script>

<template>
  <div class="ellipse-edit-panel">
    <div class="character-edit-panel" v-if="editStatus === Status.Edit">
      <div class="name-wrap">
        <div class="title">{{ t('panels.paramsPanel.componentName.title') }}</div>
        <el-form
          class="name-form"
          label-width="80px"
        >
          <el-form-item :label="tm('panels.paramsPanel.componentName.label')" prop="name">
            <el-input
              id="name"
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
          <el-form-item :label="tm('panels.paramsPanel.transform.x')" prop="x">
            <el-input-number
              id="x"
              :model-value="selectedComponent.x"
              :precision="1"
              @change="handleChangeX"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.y')" prop="y">
            <el-input-number
              id="y"
              :model-value="selectedComponent.y"
              :precision="1"
              @change="handleChangeY"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.w')" prop="w">
            <el-input-number
              id="w"
              :model-value="selectedComponent.w"
              :precision="1"
              @change="handleChangeW"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.h')" prop="h">
            <el-input-number
              id="h"
              :model-value="selectedComponent.h"
              :precision="1"
              @change="handleChangeH"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.rotation')" prop="rotation">
            <el-input-number
              id="rotation"
              :model-value="selectedComponent.rotation"
              :precision="1"
              @change="handleChangeRot"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="glyph-edit-panel" v-else-if="editStatus === Status.Glyph">
      <div class="name-wrap">
        <div class="title">{{ t('panels.paramsPanel.componentName.title') }}</div>
        <el-form
          class="name-form"
          label-width="80px"
        >
          <el-form-item :label="tm('panels.paramsPanel.componentName.label')" prop="name">
            <el-input
              id="name"
              v-model="selectedComponent_Glyph.name"
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
          <el-form-item :label="tm('panels.paramsPanel.transform.x')" prop="x">
            <el-input-number
              id="x"
              :model-value="selectedComponent_Glyph.x"
              :precision="1"
              @change="handleChangeX"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.y')" prop="y">
            <el-input-number
              id="y"
              :model-value="selectedComponent_Glyph.y"
              :precision="1"
              @change="handleChangeY"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.w')" prop="w">
            <el-input-number
              id="w"
              :model-value="selectedComponent_Glyph.w"
              :precision="1"
              @change="handleChangeW"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.h')" prop="h">
            <el-input-number
              id="h"
              :model-value="selectedComponent_Glyph.h"
              :precision="1"
              @change="handleChangeH"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.rotation')" prop="rotation">
            <el-input-number
              id="rotation"
              :model-value="selectedComponent_Glyph.rotation"
              :precision="1"
              @change="handleChangeRot"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .ellipse-edit-panel {
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
</style>