<script lang="ts" setup>
  import { selectedFile } from '@/fontEditor/stores/files'
  import { metrics_data as data } from '../../stores/settings'
  
  let lastX = 0
  let lastValue = 0
  let mousedown = false
  const mapCanvasWidth = (coord) => {
    const scale = selectedFile.value.fontSettings.unitsPerEm / 500
    return coord * scale
  }
  const unmapCanvasWidth = (coord) => {
    const scale = selectedFile.value.fontSettings.unitsPerEm / 500
    return coord / scale
  }
  const onAdvanceWidthMoverMouseDown = (e: MouseEvent) => {
    mousedown = true
    lastValue = data.value.advanceWidth
    lastX = e.clientX
    document.addEventListener('mousemove', onAdvanceWidthMoverMouseMove)
    document.addEventListener('mouseup', onAdvanceWidthMoverMouseUp)
  }
  const onAdvanceWidthMoverMouseMove = (e: MouseEvent) => {
    if (!mousedown) return
    data.value.advanceWidth = lastValue + mapCanvasWidth(e.clientX - lastX)
    data.value.rsb = data.value.advanceWidth - (data.value.lsb + data.value.xMax - data.value.xMin)
  }
  const onAdvanceWidthMoverMouseUp = (e: MouseEvent) => {
    mousedown = false
    lastX = 0
    lastValue = 0
    document.removeEventListener('mousemove', onAdvanceWidthMoverMouseMove)
    document.removeEventListener('mouseup', onAdvanceWidthMoverMouseUp)
  }
  const onLsbMoverMouseDown = (e: MouseEvent) => {
    mousedown = true
    lastX = e.clientX
    lastValue = data.value.lsb
    document.addEventListener('mousemove', onLsbMoverMouseMove)
    document.addEventListener('mouseup', onLsbMoverMouseUp)
  }
  const onLsbMoverMouseMove = (e: MouseEvent) => {
    if (!mousedown) return
    data.value.lsb = lastValue - mapCanvasWidth(e.clientX - lastX)
    data.value.rsb = data.value.advanceWidth - (data.value.lsb + data.value.xMax - data.value.xMin)
  }
  const onLsbMoverMouseUp = (e: MouseEvent) => {
    mousedown = false
    lastX = 0
    lastValue = 0
    document.removeEventListener('mousemove', onLsbMoverMouseMove)
    document.removeEventListener('mouseup', onLsbMoverMouseUp)
  }
</script>

<template>
	<div class="widget metrics-controller">
    <div class="canvas">
      <div class="advance-width-controller" :style="{
        width: `${ unmapCanvasWidth(data.advanceWidth) }px`,
        left: `${ unmapCanvasWidth(data.xMin - data.lsb) }px`,
      }">
        <div class="label">advanceWidth</div>
        <div
          class="advance-width-mover mover"
          @mousedown="onAdvanceWidthMoverMouseDown"
        ></div>
      </div>
      <div class="lsb-controller" :style="{
        width: `${ unmapCanvasWidth(data.lsb) }px`,
        left: `${ unmapCanvasWidth(data.xMin - data.lsb) }px`,
      }">
        <div class="label">lsb</div>
        <div
          class="lsb-mover mover"
          @mousedown="onLsbMoverMouseDown"
        ></div>
      </div>
      <div class="rsb-controller" :style="{
        width: `${ unmapCanvasWidth(data.rsb) }px`,
        left: `${ unmapCanvasWidth(data.xMax) }px`,
      }">
        <div class="label">rsb</div>
      </div>
    </div>
	</div>
</template>

<style scoped>
	.metrics-controller {
		background-color: white;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .canvas {
      position: relative;
      width: 500px;
      height: 500px;
      z-index: 999;
    }
    .mover {
      border-right: 2px solid var(--primary-0);
      cursor: col-resize;
      position: absolute;
      top: 0;
      bottom: 0;
      height: 100%;
    }
    .lsb-mover {
      left: 0;
      z-index: 999;
      border-color: red;
    }
    .advance-width-mover {
      right: 0;
      z-index: 999;
      border-color: red;
    }
    .advance-width-controller, .lsb-controller, .rsb-controller {
      position: absolute;
      text-align: center;
      height: 100%;
      background-color: rgba(255, 0, 0, .2);
      color: red;
    }
	}
</style>