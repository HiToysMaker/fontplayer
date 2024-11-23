<script setup lang="ts">
  /**
   * 从图片中提取字符组件，编辑面板
   */
  /**
   * extracting character from picture, editing panel
   */

  import {
    previewStatus,
    listWidth,
    rThreshold,
    gThreshold,
    bThreshold,
    localRThreshold,
    localGThreshold,
    localBThreshold,
    localBrushSize,
    localBrushX,
    localBrushY,
    step,
    editCharacterPic,
    bitmap,
    contoursComponents,
    curvesComponents,
    resetEditPic,
    setEditStatus,
    setBitMap,
    enableLocalBrush,
    type IComponent,
    type IPenComponent,
    Status,
  } from '../../stores/font'
  import { addComponentsForCharacterFile, editCharacterFileUUID, selectedFile } from '../../stores/files'
  import { toBlackWhiteBitMap } from '../../../features/image'
  import { onMounted, ref, watch, nextTick, type Ref, onBeforeUnmount } from 'vue'
  import { renderCanvas, clearCanvas } from '../../canvas/canvas'
  import { ElMessage } from 'element-plus'
  import {
    mapCanvasWidth,
    mapCanvasHeight,
    mapCanvasX,
    mapCanvasY,
  } from '../../../utils/canvas'
  import * as R from 'ramda'
  import { emitter } from '../../Event/bus'
  import { ArrowLeftBold, ArrowRightBold } from '@element-plus/icons-vue'

  const previewCanvas1: Ref<HTMLCanvasElement | null> = ref(null)
  const previewCanvas2: Ref<HTMLCanvasElement | null> = ref(null)
  const thumbnailCanvas: Ref<HTMLCanvasElement | null> = ref(null)
  const bitmapCanvas: Ref<HTMLCanvasElement | null> = ref(null)
  const contoursCanvas: Ref<HTMLCanvasElement | null> = ref(null)
  const curvesCanvas: Ref<HTMLCanvasElement | null> = ref(null)
  
  const previewList = [
    'thumbnail',
    'bitmap',
    'contours',
    'curves',
    'preview',
  ]

  const updateStyle = () => {
    const wrapper = document.querySelector('.canvas-list-outer-wrapper') as HTMLElement
    const listWrapperWidth: number = wrapper.offsetWidth
    const listWrapperHeight: number = wrapper.offsetHeight
    listWidth.value = listWrapperWidth
    const characterWidth: number = selectedFile.value.width
    const characterHeight: number = selectedFile.value.height
    const wrappers = document.querySelectorAll('.canvas-wrapper') as NodeListOf<Element>
    wrappers.forEach((wrapper: Element) => {
      (wrapper as HTMLElement).style.width = `${listWrapperWidth / 2}px`
    })
    const picWidth = editCharacterPic.value.width
    const picHeight = editCharacterPic.value.height
    let charCanvasWidth = listWrapperWidth / 2 > characterWidth ? characterWidth : listWrapperWidth / 2;
    let charCanvasHeight = charCanvasWidth * characterHeight / characterWidth
    if (charCanvasHeight > listWrapperHeight) {
      charCanvasHeight = listWrapperHeight
      charCanvasWidth = charCanvasHeight * characterWidth / characterHeight
    }
    let picCanvasWidth = listWrapperWidth / 2 > characterWidth ? characterWidth : listWrapperWidth / 2;
    let picCanvasHeight = picCanvasWidth * picHeight / picWidth
    if (picCanvasHeight > listWrapperHeight) {
      picCanvasHeight = listWrapperHeight
      picCanvasWidth = picCanvasHeight * picWidth / picHeight
    }

    (previewCanvas1.value as HTMLCanvasElement).style.width = `${charCanvasWidth}px`;
    (previewCanvas1.value as HTMLCanvasElement).style.height = `${charCanvasHeight}px`;
    (previewCanvas2.value as HTMLCanvasElement).style.width = `${charCanvasWidth}px`;
    (previewCanvas2.value as HTMLCanvasElement).style.height = `${charCanvasHeight}px`;
    (contoursCanvas.value as HTMLCanvasElement).style.width = `${charCanvasWidth}px`;
    (contoursCanvas.value as HTMLCanvasElement).style.height = `${charCanvasHeight}px`;
    (curvesCanvas.value as HTMLCanvasElement).style.width = `${charCanvasWidth}px`;
    (curvesCanvas.value as HTMLCanvasElement).style.height = `${charCanvasHeight}px`;
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

  const moveLeft = () => {
    if (step.value === 1 && !!enableLocalBrush.value) {
      ElMessage('编辑中，请确认后再查看')
      return
    }
    previewStatus.value = previewStatus.value <= 0 ? previewList.length - 1 : previewStatus.value - 1
  }

  const moveRight = () => {
    if (step.value === 1 && !!enableLocalBrush.value) {
      ElMessage('编辑中，请确认后再查看')
      return
    }
    previewStatus.value = previewStatus.value >= previewList.length - 1 ? 0 : previewStatus.value + 1
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
    clearCanvas(previewCanvas1.value as HTMLCanvasElement)
    renderCanvas(curvesComponents.value, previewCanvas1.value as HTMLCanvasElement)
    clearCanvas(previewCanvas2.value as HTMLCanvasElement)
    renderCanvas(curvesComponents.value, previewCanvas2.value as HTMLCanvasElement, {
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
  const renderLocalBrushEditor = () => {
    renderThumbnailCanvas()
    // renderBitMapCanvas()
    const canvas1: HTMLCanvasElement = thumbnailCanvas.value as HTMLCanvasElement
    const ctx1: CanvasRenderingContext2D = canvas1.getContext('2d') as CanvasRenderingContext2D
    // const canvas2: HTMLCanvasElement = bitmapCanvas.value as HTMLCanvasElement
    // const ctx2: CanvasRenderingContext2D = canvas2.getContext('2d') as CanvasRenderingContext2D
    ctx1.strokeStyle = 'black'
    ctx1.strokeRect(
      mapCanvasX(localBrushX.value),
      mapCanvasY(localBrushY.value),
      mapCanvasWidth(localBrushSize.value),
      mapCanvasHeight(localBrushSize.value)
    )
    // ctx2.strokeStyle = 'black'
    // ctx2.strokeRect(
    //   mapCanvasX(localBrushX.value),
    //   mapCanvasY(localBrushY.value),
    //   mapCanvasWidth(localBrushSize.value),
    //   mapCanvasHeight(localBrushSize.value)
    // )
  }

  onMounted(() => {
    updateStyle()
    window.addEventListener('resize', updateStyle)
    render()
  })

  watch([editCharacterPic], () => {
    renderThumbnailCanvas()
  })
  watch([bitmap], () => {
    renderBitMapCanvas()
  })
  watch([contoursComponents], () => {
    renderContoursCanvas()
  })
  watch([
    curvesComponents,
  ], () => {
    renderCurvesCanvas()
    renderPreviewCanvas()
  })

  const onMouseMove = (e: MouseEvent) => {
    const canvas: HTMLCanvasElement = thumbnailCanvas.value as HTMLCanvasElement
    //if (e.target !== canvas) return
    const styleWidth = Number(canvas.style.width.split('px')[0])
    const styleHeight = Number(canvas.style.height.split('px')[0])
    const picWidth = editCharacterPic.value.width
    const picHeight = editCharacterPic.value.height
    localBrushX.value = Math.round(e.offsetX * picWidth / styleWidth)
    localBrushY.value = Math.round(e.offsetY * picHeight / styleHeight)
    const { thumbnailCanvas: _thumbnailCanvas, thumbnailPixels, processPixels } = editCharacterPic.value
    const width = (_thumbnailCanvas as HTMLCanvasElement).width
    const height = (_thumbnailCanvas as HTMLCanvasElement).height
    const pixels = toBlackWhiteBitMap(thumbnailPixels, {
      r: localRThreshold.value,
      g: localGThreshold.value,
      b: localBThreshold.value,
    }, {
      x: localBrushX.value,
      y: localBrushY.value,
      size: localBrushSize.value,
      width,
      height,
    })
    const _pixels = R.clone(processPixels)
    for (let i = localBrushX.value; i < localBrushX.value + localBrushSize.value; i++) {
      for (let j = localBrushY.value; j < localBrushY.value + localBrushSize.value; j++) {
        const index = (j * width + i) * 4
        _pixels[index] = pixels[index]
        _pixels[index + 1] = pixels[index + 1]
        _pixels[index + 2] = pixels[index + 2]
        _pixels[index + 3] = pixels[index + 3]
      }
    }
    setTimeout(() => {
      const ctx: CanvasRenderingContext2D = (bitmapCanvas.value as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          const index = (j * width + i) * 4
          const color = `rgba(${_pixels[index]}, ${_pixels[index + 1]}, ${_pixels[index] + 2}, ${_pixels[index + 3]})`
          ctx.fillStyle = color
          ctx.fillRect(mapCanvasX(i), mapCanvasY(j), mapCanvasWidth(1), mapCanvasHeight(1))
        }
      }
    }, 10)
    renderLocalBrushEditor()
    if (mousedown) {
      onMouseDown()
    }
  }

  const onMouseUp = () => {
    mousedown = false
    window.removeEventListener('mouseup', onMouseUp)
  }

  let mousedown = false
  const onMouseDown = () => {
    mousedown = true
    const { thumbnailCanvas, thumbnailPixels, processPixels } = editCharacterPic.value
    const width = (thumbnailCanvas as HTMLCanvasElement).width
    const height = (thumbnailCanvas as HTMLCanvasElement).height
    const pixels = toBlackWhiteBitMap(thumbnailPixels, {
      r: localRThreshold.value,
      g: localGThreshold.value,
      b: localBThreshold.value,
    }, {
      x: localBrushX.value,
      y: localBrushY.value,
      size: localBrushSize.value,
      width,
      height,
    })
    for (let i = localBrushX.value; i < localBrushX.value + localBrushSize.value; i++) {
      for (let j = localBrushY.value; j < localBrushY.value + localBrushSize.value; j++) {
        const index = (j * width + i) * 4
        processPixels[index] = pixels[index]
        processPixels[index + 1] = pixels[index + 1]
        processPixels[index + 2] = pixels[index + 2]
        processPixels[index + 3] = pixels[index + 3]
      }
    }
    setBitMap({
      data: processPixels,
      width,
      height,
    })
    window.addEventListener('mouseup', onMouseUp)
  }

  emitter.on('toggleLocalBrushEdit', (enable: boolean) => {
    const canvas: HTMLCanvasElement = thumbnailCanvas.value as HTMLCanvasElement
    if (!!enable) {
      document.addEventListener('mousemove', onMouseMove)
      canvas.addEventListener('mousedown', onMouseDown)
      render()
    } else {
      document.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      render()
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateStyle)
  })

  const confirm = async () => {
    const components = curvesComponents.value
    addComponentsForCharacterFile(editCharacterFileUUID.value, components)
    reset()
    setEditStatus(Status.Edit)
    await nextTick()
    resetEditPic()
  }

  const reset = () => {
    enableLocalBrush.value = false
    rThreshold.value = 128
    gThreshold.value = 128
    bThreshold.value = 128
    emitter.emit('resetEditFontPic', true)
  }

  const remove = () => {
    resetEditPic()
    setEditStatus(Status.Edit)
  }
</script>

<template>
  <div class="font-edit-pic-wrapper">
    <header class="top-bar">
      <el-button-group class="btn-group">
        <el-button class="btn delete-btn" @click="remove" size="small">删除</el-button>
        <el-button class="btn reset-btn" @click="reset" size="small">重置</el-button>
        <el-button
          type="primary"
          class="btn confitm-btn"
          @click="confirm"
          size="small"
        >确认</el-button>
      </el-button-group>
    </header>
    <main class="main">
      <div class="left-mover" @click="moveLeft">
        <el-icon><ArrowLeftBold /></el-icon>
      </div>
      <div class="canvas-list-outer-wrapper">
        <div class="canvas-list-wrapper" :style="{
          left: `${-previewStatus * listWidth / 2}px`
        }">
          <div class="canvas-wrapper">
            <canvas
              class="preview canvas"
              ref="previewCanvas1"
              :width="mapCanvasWidth(selectedFile.width)"
              :height="mapCanvasHeight(selectedFile.height)"
            ></canvas>
          </div>
          <div class="canvas-wrapper">
            <canvas
              class="thumbnail canvas"
              ref="thumbnailCanvas"
              :width="mapCanvasWidth(selectedFile.width)"
              :height="mapCanvasHeight(selectedFile.height)"
            ></canvas>
          </div>
          <div class="canvas-wrapper">
            <canvas
              class="bitmap canvas"
              ref="bitmapCanvas"
              :width="mapCanvasWidth(selectedFile.width)"
              :height="mapCanvasHeight(selectedFile.height)"
            ></canvas>
          </div>
          <div class="canvas-wrapper">
            <canvas
              class="contours canvas"
              ref="contoursCanvas"
              :width="mapCanvasWidth(selectedFile.width)"
              :height="mapCanvasHeight(selectedFile.height)"
            ></canvas>
          </div>
          <div class="canvas-wrapper">
            <canvas
              class="curves canvas"
              ref="curvesCanvas"
              :width="mapCanvasWidth(selectedFile.width)"
              :height="mapCanvasHeight(selectedFile.height)"
            ></canvas>
          </div>
          <div class="canvas-wrapper">
            <canvas
              class="preview canvas"
              ref="previewCanvas2"
              :width="mapCanvasWidth(selectedFile.width)"
              :height="mapCanvasHeight(selectedFile.height)"
            ></canvas>
          </div>
        </div>
      </div>
      <div class="right-mover" @click="moveRight">
        <el-icon><ArrowRightBold /></el-icon>
      </div>
    </main>
  </div>
</template>

<style scoped>
  .font-edit-pic-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    .top-bar {
      display: flex;
      align-items: center;
    }
  }
  .canvas-list-outer-wrapper {
    width: 100%;
    height: 100%;
    flex: auto;
    border-left: 1px solid #dcdfe6;
    border-right: 1px solid #dcdfe6;
    box-sizing: border-box;
    position: relative;
  }
  .canvas-wrapper:not(:first-child) {
    border-left: 1px solid #dcdfe6;
    box-sizing: border-box;
  }
  .left-mover, .right-mover {
    flex: 0 0 32px;
    background-color: white;
    z-index: 99;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  .left-mover:hover, .right-mover:hover {
    background-color: var(--light-0);
  }
  .canvas-list-wrapper {
    position: absolute;
    display: flex;
    flex-direction: row;
    height: 100%;
  }
  .main {
    display: flex;
    flex-direction: row;
    height: 100%;
    justify-content: center;
    align-items: center; 
  }
  .canvas-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
  .preview-edit-canvas, .preview-final-canvas {
    width: 100%;
  }
  .preview {
    flex: auto;
  }
  .thumbnail {
    flex: 0 0 200px;
  }
  .preview {
    flex: auto;
  }
  .btn {
    border-radius: 0;
    box-sizing: border-box;
  }
  .btn-group {
    position: absolute;
    right: 5px;
    box-sizing: border-box;
  }
  .top-bar {
    flex: 0 0 32px;
    border-bottom: 1px solid #dcdfe6;
    position: relative;
    background-color: white;
  }
</style>