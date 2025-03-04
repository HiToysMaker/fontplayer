<script setup lang="ts">
	/**
	 * 字体结构编辑面板
	 */
	/**
	 * layout editing panel for character
	 */
	import { ElMessage } from 'element-plus'
  import { onMounted, ref } from 'vue'
  import type {
		ILine,
		ICubicBezierCurve,
		IQuadraticBezierCurve,
	} from '../../../fontManager'
  import { PathType } from '../../../fontManager/character'
	import {
		componentsToContours,
	} from '../../../features/font'
  import { editCharacterFile, orderedListWithItemsForCharacterFile, selectedFile } from '../../stores/files'
  import { metrics_data as data } from '../../stores/settings'

	const confirmMetricsChange = () => {
    selectedFile.value.fontSettings.metrics = {
      lsb: data.value.lsb,
      advanceWidth: data.value.advanceWidth,
      useDefaultValues: false,
    }
    ElMessage({
      type: 'success',
      message: '应用度量变换',
    })
	}
	const resetMetrics = () => {
    selectedFile.value.fontSettings.metrics = {
      advanceWidth: 1000,
      lsb: 0,
      default: true,
    }
    const metrics = getMetrics()
    data.value.lsb = metrics.lsb
    data.value.advanceWidth = metrics.advanceWidth
    data.value.xMin = metrics.xMin
    data.value.xMax = metrics.xMax
    data.value.yMin = metrics.yMin
    data.value.yMax = metrics.yMax
    selectedFile.value.fontSettings.metrics = {
      lsb: metrics.lsb,
      advanceWidth: metrics.advanceWidth,
      useDefaultValues: true,
    }
		ElMessage({
			type: 'success',
			message: '重置度量变换',
		})
	}
  const getMetrics = () => {
    const {
			unitsPerEm,
			descender,
      metrics: _metrics,
		} = selectedFile.value.fontSettings
    let {
      advanceWidth,
      lsb,
      useDefaultValues,
    } = _metrics ? _metrics : {
      advanceWidth: unitsPerEm,
      lsb: 0,
      useDefaultValues: true,
    }
    if (!_metrics) {
      useDefaultValues = true
      advanceWidth = unitsPerEm
      lsb = 0
    }
    if (useDefaultValues) {
      advanceWidth = unitsPerEm
    }
    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(editCharacterFile.value), {
      unitsPerEm,
      descender,
      advanceWidth: unitsPerEm,
    }, { x: 0, y: 0 }, false, false, true)
    const xCoords = []
    const yCoords = []
    for (let i = 0; i < contours.length; i += 1) {
      for (let j = 0; j < contours[i].length; j++) {
        const contour = contours[i][j]
        xCoords.push(contour.start.x)
        yCoords.push(contour.start.y)
        xCoords.push(contour.end.x)
        yCoords.push(contour.end.y)
        if (contour.type === PathType.QUADRATIC_BEZIER) {
          xCoords.push(contour.control.x)
          yCoords.push(contour.control.y)
        } else if (contour.type === PathType.CUBIC_BEZIER) {
          xCoords.push(contour.control1.x)
          yCoords.push(contour.control1.y)
          xCoords.push(contour.control2.x)
          yCoords.push(contour.control2.y)
        }
      }
    }

    const metrics: any = {
      xMin: Math.min.apply(null, xCoords),
      yMin: Math.min.apply(null, yCoords),
      xMax: Math.max.apply(null, xCoords),
      yMax: Math.max.apply(null, yCoords),
    }

    if (!isFinite(metrics.xMin)) {
      metrics.xMin = 0;
    }

    if (!isFinite(metrics.xMax)) {
      metrics.xMax = unitsPerEm || 0
    }

    if (!isFinite(metrics.yMin)) {
      metrics.yMin = 0
    }

    if (!isFinite(metrics.yMax)) {
      metrics.yMax = 0
    }

    metrics.advanceWidth = advanceWidth
    metrics.lsb = useDefaultValues ? metrics.xMin : lsb,
    metrics.rsb = advanceWidth - (metrics.lsb + metrics.xMax - metrics.xMin)
    return metrics
  }
  onMounted(() => {
    const metrics = getMetrics()
    data.value.lsb = metrics.lsb
    data.value.advanceWidth = metrics.advanceWidth
    data.value.rsb = metrics.rsb
    data.value.xMin = metrics.xMin
    data.value.xMax = metrics.xMax
    data.value.yMin = metrics.yMin
    data.value.yMax = metrics.yMax
  })
  const onDataChange = () => {
    data.value.rsb = data.value.advanceWidth - (data.value.lsb + data.value.xMax - data.value.xMin)
  }
</script>

<template>
  <div class="character-edit-panel">
    <el-form
      class="transfom-form"
      label-width="120px"
    >
      <el-form-item label="advanceWidth">
        <el-input-number
          v-model="data.advanceWidth"
          :controls="false"
          @change="onDataChange"
          :precision="0"
        />
      </el-form-item>
      <el-form-item label="lsb">
        <el-input-number
          v-model="data.lsb"
          :controls="false"
          @change="onDataChange"
          :precision="0"
        />
      </el-form-item>
      <el-form-item label="rsb">
        <el-input-number
          v-model="data.rsb"
          :controls="false"
          :precision="0"
          disabled
        />
      </el-form-item>
      <el-form-item label="xMin">
        <el-input-number
          v-model="data.xMin"
          :controls="false"
          :precision="0"
          disabled
        />
      </el-form-item>
      <el-form-item label="xMax">
        <el-input-number
          v-model="data.xMax"
          :controls="false"
          :precision="0"
          disabled
        />
      </el-form-item>
      <el-form-item label="yMin">
        <el-input-number
          v-model="data.yMin"
          :controls="false"
          :precision="0"
          disabled
        />
      </el-form-item>
      <el-form-item label="yMax">
        <el-input-number
          v-model="data.yMax"
          :controls="false"
          :precision="0"
          disabled
        />
      </el-form-item>
    </el-form>
		<div class="metrics-settings">
			<el-button class="metrics-confirm-btn" @click="confirmMetricsChange" type="primary">
				应用度量变换
			</el-button>
			<el-button class="metrics-reset-btn" @click="resetMetrics">
				重置度量变换
			</el-button>
		</div>
  </div>
</template>

<style scoped>
	.metrics-settings {
		.metrics-confirm-btn, .metrics-reset-btn {
			width: 100%;
			margin: 0 0 10px 0;
		}
	}
	.character-edit-panel {
		padding: 10px;
	}
</style>