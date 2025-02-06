<script setup lang="ts">
	/**
	 * 多边形组件参数编辑面板
	 */
	/**
	 * params editing panel for polygon component
	 */

  import { modifyComponentForCurrentCharacterFile, selectedComponent, selectedComponentUUID } from '../../stores/files'
  import type { IPoint } from '../../stores/polygon'
  import type { IPoint as IPenPoint } from '../../stores/pen'
  import { fitCurve } from '../../../features/fitCurve'
  import { genUUID } from '../../../utils/string'
  import { getBound, transformPoints } from '../../../utils/math'
  import {
    modifyComponentForCurrentGlyph,
    selectedComponent as selectedComponent_Glyph,
    selectedComponentUUID as selectedComponentUUID_Glyph
  } from '../../stores/glyph'
  import { editStatus, Status } from '../../stores/font'
  import { OpType, saveState, StoreType } from '../../stores/edit'
  import { useI18n } from 'vue-i18n'
  import paper from 'paper'
  const { tm, t } = useI18n()

  const savePolygonEditState = () => {
    // 保存状态
		saveState('编辑多边形组件参数', [
			editStatus.value === Status.Glyph ? StoreType.EditGlyph : StoreType.EditCharacter
		],
			OpType.Undo,
		)
  }

  const handleChangeX = (x: number) => {
    savePolygonEditState()
    if (editStatus.value === Status.Edit) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
        x,
      })
    } else if (editStatus.value === Status.Glyph) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID_Glyph.value, {
        x,
      })
    }
  }

  const handleChangeY = (y: number) => {
    savePolygonEditState()
    if (editStatus.value === Status.Edit) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
        y,
      })
    } else if (editStatus.value === Status.Glyph) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID_Glyph.value, {
        y,
      })
    }
  }

  const handleChangeW = (w: number) => {
    savePolygonEditState()
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
    savePolygonEditState()
    if (editStatus.value === Status.Edit) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
        h,
      })
    } else if (editStatus.value === Status.Glyph) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID_Glyph.value, {
        h,
      })
    }
  }

  const handleChangeRot = (rotation: number) => {
    savePolygonEditState()
    if (editStatus.value === Status.Edit) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
        rotation,
      })
    } else if (editStatus.value === Status.Glyph) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID_Glyph.value, {
        rotation,
      })
    }
  }

  const transformToPath = () => {
    savePolygonEditState()
    const polygonComponent = selectedComponent.value.value
    const { x, y, w, h, rotation, flipX, flipY } = selectedComponent.value
    const points: Array<{
      x: number,
      y: number,
    }> = transformPoints(polygonComponent.points.map((point: IPoint) => {
      return {
        x: point.x,
        y: point.y,
      }
    }), {
      x, y, w, h, rotation, flipX, flipY,
    })
    let penPoints: Array<IPenPoint> = []

    // 创建一个闭合多边形
    const segments = []
    for(let i = 0; i < points.length - 1; i++) {
      segments.push([points[i].x, points[i].y])
    }
    // 如果收尾节点和起始节点重合，则不添加
    if (points[points.length - 1].x !== points[0].x || points[points.length - 1].y !== points[0].y) {
      segments.push([points[points.length - 1].x, points[points.length - 1].y])
    }

    let path = new paper.Path({
      segments,
      closed: true,
    })
    path.smooth()
    let uuid1 = genUUID()
    for (let i = 0; i < path.curves.length; i++) {
      const curve = path.curves[i]
      const uuid2 = genUUID()
      const uuid3 = genUUID()
      penPoints.push({
        uuid: uuid1,
        x: curve.points[0].x,
        y: curve.points[0].y,
        type: 'anchor',
        origin: null,
        isShow: true,
      })
      penPoints.push({
        uuid: uuid2,
        x: curve.points[1].x,
        y: curve.points[1].y,
        type: 'control',
        origin: uuid1,
        isShow: false,
      })
      uuid1 = genUUID()
      penPoints.push({
        uuid: uuid3,
        x: curve.points[2].x,
        y: curve.points[2].y,
        type: 'control',
        origin: uuid1,
        isShow: false,
      })
      if (i >= path.curves.length - 1) {
        penPoints.push({
          uuid: uuid1,
          x: curve.points[3].x,
          y: curve.points[3].y,
          type: 'anchor',
          origin: null,
          isShow: true,
        })
      }
    }

    const { x: penX, y: penY, w: penW, h: penH } = getBound(penPoints)
    if (editStatus.value === Status.Edit) {
      modifyComponentForCurrentCharacterFile(selectedComponentUUID.value, {
        value: {
          points: penPoints,
          editMode: false,
        },
        type: 'pen',
        x: penX,
        y: penY,
        w: penW,
        h: penH,
        rotation: 0,
      })
    } else if (editStatus.value === Status.Glyph) {
      modifyComponentForCurrentGlyph(selectedComponentUUID_Glyph.value, {
        value: {
          points: penPoints,
          editMode: false,
        },
        type: 'pen',
        x: penX,
        y: penY,
        w: penW,
        h: penH,
        rotation: 0,
      })
    }
  }
</script>

<template>
  <div class="polygon-edit-panel">
    <div class="character-edit-panel" v-if="editStatus === Status.Edit">
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
      <div
        class="transform-to-curve-wrap"
        v-if="selectedComponent.type === 'polygon'"
      >
        <div class="title">{{ t('panels.paramsPanel.transformToCurve.title') }}</div>
        <el-button
          @click="transformToPath"
        >{{ t('panels.paramsPanel.transformToCurve.label') }}</el-button>
      </div>
    </div>
    <div class="glyph-edit-panel" v-else-if="editStatus === Status.Glyph">
      <div class="name-wrap">
      <div class="title">{{ t('panels.paramsPanel.componentName.title') }}</div>
        <el-form
          class="name-form"
          label-width="80px"
        >
          <el-form-item :label="tm('panels.paramsPanel.componentName.label')">
            <el-input
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
          <el-form-item :label="tm('panels.paramsPanel.transform.x')">
            <el-input-number
              :model-value="selectedComponent_Glyph.x"
              :precision="1"
              @change="handleChangeX"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.y')">
            <el-input-number
              :model-value="selectedComponent_Glyph.y"
              :precision="1"
              @change="handleChangeY"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.w')">
            <el-input-number
              :model-value="selectedComponent_Glyph.w"
              :precision="1"
              @change="handleChangeW"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.h')">
            <el-input-number
              :model-value="selectedComponent_Glyph.h"
              :precision="1"
              @change="handleChangeH"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.paramsPanel.transform.rotation')">
            <el-input-number
              :model-value="selectedComponent_Glyph.rotation"
              :precision="1"
              @change="handleChangeRot"
            />
          </el-form-item>
        </el-form>
      </div>
      <div
        class="transform-to-curve-wrap"
        v-if="selectedComponent_Glyph.type === 'polygon'"
      >
        <div class="title">{{ t('panels.paramsPanel.transformToCurve.title') }}</div>
        <el-button
          @click="transformToPath"
        >{{ t('panels.paramsPanel.transformToCurve.label') }}</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .polygon-edit-panel {
    width: 100%;
    height: 100%;
    overflow: hidden;
    .el-input {
      width: 150px;
    }
    .transform-to-curve-wrap {
      .el-button {
        margin: 10px;
        width: calc(100% - 20px);
      }
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