<script setup lang="ts">
  /**
   * 从图片中提取字符，编辑时左侧栏，分阶段预览图
   */
  /**
   * left panel during extracting character from picture, preview for each step
   */
  import {
    editCharacterPic,
    bitmap,
    contoursComponents,
    curvesComponents,
    previewStatus,
    type IComponent,
    type IPenComponent,
  } from '../../stores/font'
  import { onMounted, ref, watch, type Ref, onBeforeUnmount } from 'vue'
  import { selectedFile } from '../../stores/files'
  import {
    mapCanvasWidth,
    mapCanvasHeight,
    mapCanvasX,
    mapCanvasY,
  } from '../../../utils/canvas'
  import { renderCanvas, clearCanvas } from '../../canvas/canvas'
  import * as R from 'ramda'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const thumbnailCanvas: Ref<HTMLCanvasElement | null> = ref(null)
  const bitmapCanvas: Ref<HTMLCanvasElement | null> = ref(null)
  const contoursCanvas: Ref<HTMLCanvasElement | null> = ref(null)
  const curvesCanvas: Ref<HTMLCanvasElement | null> = ref(null)
  const previewCanvas: Ref<HTMLCanvasElement | null> = ref(null)

  const updateStyle = () => {
    const picWidth = editCharacterPic.value.width
    const picHeight = editCharacterPic.value.height
    let picCanvasWidth = 68
    let picCanvasHeight = picCanvasWidth * picHeight / picWidth
    if (picCanvasHeight > 68) {
      picCanvasHeight = 68
      picCanvasWidth = picCanvasHeight * picWidth / picHeight
    }
    (thumbnailCanvas.value as HTMLCanvasElement).width = mapCanvasWidth(picWidth);
    (thumbnailCanvas.value as HTMLCanvasElement).height = mapCanvasHeight(picHeight);
    (thumbnailCanvas.value as HTMLCanvasElement).style.width = `${picCanvasWidth}px`;
    (thumbnailCanvas.value as HTMLCanvasElement).style.height = `${picCanvasHeight}px`;
    (thumbnailCanvas.value as HTMLCanvasElement).height = mapCanvasHeight(picHeight);
    (bitmapCanvas.value as HTMLCanvasElement).width = mapCanvasWidth(picWidth);
    (bitmapCanvas.value as HTMLCanvasElement).height = mapCanvasHeight(picHeight);
    (bitmapCanvas.value as HTMLCanvasElement).style.width = `${picCanvasWidth}px`;
    (bitmapCanvas.value as HTMLCanvasElement).style.height = `${picCanvasHeight}px`;
  }

  const renderThumbnailCanvas = () => {
    const ctx: CanvasRenderingContext2D = (thumbnailCanvas.value as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
    const { img, width, height } = editCharacterPic.value
    const image = img as HTMLImageElement
    ctx.drawImage(image as HTMLImageElement, 0, 0, image.width, image.height, 0, 0, mapCanvasWidth(width), mapCanvasWidth(height))
  }
  const renderBitMapCanvas = () => {
    const ctx: CanvasRenderingContext2D = (bitmapCanvas.value as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
    const { data, width, height } = bitmap.value
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const index = (j * width + i) * 4
        const color = `rgba(${data[index]}, ${data[index + 1]}, ${data[index] + 2}, ${data[index + 3]})`
        ctx.fillStyle = color
        ctx.fillRect(mapCanvasX(i), mapCanvasY(j), mapCanvasWidth(1), mapCanvasHeight(1))
      }
    }
  }
  const renderContoursCanvas = () => {
    const components = contoursComponents.value.map((contourComponent: IComponent) => {
      const _component = R.clone(contourComponent);
      (_component.value as unknown as IPenComponent).fillColor = 'rgba(1, 1, 1, 0)';
      return _component
    })
    clearCanvas(contoursCanvas.value as HTMLCanvasElement)
    renderCanvas(components, contoursCanvas.value as HTMLCanvasElement)
  }
  const renderCurvesCanvas = () => {
    const components = curvesComponents.value.map((curveComponent: IComponent) => {
      const _component = R.clone(curveComponent);
      (_component.value as unknown as IPenComponent).fillColor = 'rgba(1, 1, 1, 0)';
      return _component
    })
    clearCanvas(curvesCanvas.value as HTMLCanvasElement)
    renderCanvas(components, curvesCanvas.value as HTMLCanvasElement)
  }
  const renderPreviewCanvas = () => {
    clearCanvas(previewCanvas.value as HTMLCanvasElement)
    renderCanvas(curvesComponents.value, previewCanvas.value as HTMLCanvasElement, {
      fill: true,
      offset: { x: 0, y: 0 },
      scale: 1,
      forceUpdate: false,
    })
  }
  const render = () => {
    renderPreviewCanvas()
    renderThumbnailCanvas()
    renderBitMapCanvas()
    renderContoursCanvas()
    renderCurvesCanvas()
  }

  onMounted(() => {
    updateStyle()
    window.addEventListener('resize', updateStyle)
    render()
  })

  watch([
    editCharacterPic,
    bitmap,
    contoursComponents,
    curvesComponents,
  ], () => {
    render()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateStyle)
  })
</script>

<template>
  <div class="view-list-wrapper">
    <div class="view-item-wrapper" @click="previewStatus = 0">
      <span class="view-thumbnail">
        <canvas class="view-canvas" ref="thumbnailCanvas"></canvas>
      </span>
      <span class="view-info">
        <span class="view-title">{{ t('panels.viewList.thumbnail.title') }}</span>
        <span class="view-description">{{ t('panels.viewList.thumbnail.description') }}</span>
      </span>
    </div>
    <div class="view-item-wrapper" @click="previewStatus = 1">
      <span class="view-thumbnail">
        <canvas class="view-canvas" ref="bitmapCanvas"></canvas>
      </span>
      <span class="view-info">
        <span class="view-title">{{ t('panels.viewList.bitmap.title') }}</span>
        <span class="view-description">{{ t('panels.viewList.bitmap.description') }}</span>
      </span>
    </div>
    <div class="view-item-wrapper" @click="previewStatus = 2">
      <span class="view-thumbnail">
        <canvas
          class="view-canvas"
          ref="contoursCanvas"
          :width="mapCanvasWidth(selectedFile.width)"
          :height="mapCanvasHeight(selectedFile.height)"
        ></canvas>
      </span>
      <span class="view-info">
        <span class="view-title">{{ t('panels.viewList.contours.title') }}</span>
        <span class="view-description">{{ t('panels.viewList.contours.description') }}</span>
      </span>
    </div>
    <div class="view-item-wrapper" @click="previewStatus = 3">
      <span class="view-thumbnail">
        <canvas
          class="view-canvas"
          ref="curvesCanvas"
          :width="mapCanvasWidth(selectedFile.width)"
          :height="mapCanvasHeight(selectedFile.height)"
        ></canvas>
      </span>
      <span class="view-info">
        <span class="view-title">{{ t('panels.viewList.curves.title') }}</span>
        <span class="view-description">{{ t('panels.viewList.curves.description') }}</span>
      </span>
    </div>
    <div class="view-item-wrapper" @click="previewStatus = 4">
      <span class="view-thumbnail">
        <canvas
          class="view-canvas"
          ref="previewCanvas"
          :width="mapCanvasWidth(selectedFile.width)"
          :height="mapCanvasHeight(selectedFile.height)"
        ></canvas>
      </span>
      <span class="view-info">
        <span class="view-title">{{ t('panels.viewList.preview.title') }}</span>
        <span class="view-description">{{ t('panels.viewList.preview.description') }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
  .view-item-wrapper {
    height: 80px;
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid var(--dark-4);
    cursor: pointer;
    color: var(--primary-5);
  }
  .view-item-wrapper:hover {
    background-color: var(--primary-0);
  }
  .view-thumbnail {
    display: inline-block;
    height: 68px;
    width: 68px;
    flex: 0 0 68px;
    background-color: white;
    margin: 5px;
  }
  .view-info {
    flex: auto;
    display: flex;
    flex-direction: column;
    padding: 0 10px;
    .view-description {
      color: var(--light-4);
    }
  }
  .view-title {
    font-weight: bold;
  }
  .view-canvas {
    width: 68px;
    height: 68px;
  }
</style>