<script setup lang="ts">
  /**
   * 从图片中提取字符，编辑右侧栏
   */
  /**
   * right panel during extracting character from picture
   */

  import { toBlackWhiteBitMap, reversePixels } from '../../../features/image'
  // import cv from "@techstark/opencv-js"
  import { genUUID } from '../../../utils/string'
  import { getBound, transformPoints } from '../../../utils/math'
  import {
    type IComponent,
    type IPenComponent,
    type IComponentValue,
    editCharacterPic,
    setStep,
    clearContoursComponent,
    clearCurvesComponent,
    addContoursComponent,
    addCurvesComponent,
    setBitMap,
    bitmap,
    contoursComponents,
    setEnableLocalBrush,
    enableLocalBrush,
    step,
    rThreshold,
    gThreshold,
    bThreshold,
    maxError,
    dropThreshold,
    previewStatus,
    localRThreshold,
    localGThreshold,
    localBThreshold,
    localBrushSize,
  } from '../../stores/font'
  import * as R from 'ramda'
  import { fitCurve } from '../../../features/fitCurve'
  import type { IPoint as IPenPoint } from '../../stores/pen'
  import type { IPoint } from '../../stores/polygon'
  import { emitter } from '../../Event/bus'
  import { useI18n } from 'vue-i18n'

  const { tm, t } = useI18n()

  let _rThreshold = rThreshold.value
  let _gThreshold = gThreshold.value
  let _bThreshold = bThreshold.value
  let _maxError = maxError.value
  const toStep = (value: number) => {
    setStep(value)
    if (step.value === 1) {
      previewStatus.value = 1
      _rThreshold = rThreshold.value
      _gThreshold = gThreshold.value
      _bThreshold = bThreshold.value
    }
    if (step.value === 3) {
      previewStatus.value = 3
      _maxError = maxError.value
    }
  }
  const handleBitMap = () => {
    if (!enableLocalBrush.value) {
      _rThreshold = rThreshold.value
      _gThreshold = gThreshold.value
      _bThreshold = bThreshold.value
      step.value = 0
      setAllElements()
    } else {
      enableLocalBrush.value = false
      emitter.emit('toggleLocalBrushEdit', false)
      setAllElements()
    }
  }
  const onThresholdsChange = () => {
    setAllElements()
  }
  const onLocalBrushSizeChange = () => {

  }
  const onLocalThresholdsChange = () => {

  }
  const cancelBitMap = () => {
    if (!enableLocalBrush.value) {
      rThreshold.value = _rThreshold
      gThreshold.value = _gThreshold
      bThreshold.value = _bThreshold
      step.value = 0
      setAllElements()
    } else {
      enableLocalBrush.value = false
      emitter.emit('toggleLocalBrushEdit', false)
    }
  }
  const handleFitCurve = () => {
    _maxError = maxError.value
    step.value = 0
    setCurves()
  }
  const cancelFitCurve = () => {
    maxError.value = _maxError
    step.value = 0
    setCurves()
  }
  const onMaxErrorChange = () => {
    setCurves()
  }
  const onDropThresholdChange = () => {
    setCurves()
  }

  const useLocalBrush = () => {
    const { thumbnailCanvas, thumbnailPixels } = editCharacterPic.value
    const pixels = toBlackWhiteBitMap(thumbnailPixels, {
      r: rThreshold.value,
      g: gThreshold.value,
      b: bThreshold.value,
    }, {
      x: 0,
      y: 0,
      size: -1,
      width: (thumbnailCanvas as HTMLCanvasElement).width,
      height: (thumbnailCanvas as HTMLCanvasElement).height,
    })
    setBitMap({
      data: pixels,
      width: (thumbnailCanvas as HTMLCanvasElement).width,
      height: (thumbnailCanvas as HTMLCanvasElement).height,
    })
    editCharacterPic.value.processPixels = pixels
    localRThreshold.value = rThreshold.value
    localGThreshold.value = gThreshold.value
    localBThreshold.value = bThreshold.value
    
    setEnableLocalBrush(true)
    emitter.emit('toggleLocalBrushEdit', true)
  }

  const setAllElements = () => {
    clearContoursComponent()
    clearCurvesComponent()
    const { thumbnailCanvas, processPixels } = editCharacterPic.value
    /**
     * bitmap
     */
    let pixels: Array<number> = []
    if (!enableLocalBrush.value) {
      pixels = toBlackWhiteBitMap(processPixels, {
        r: rThreshold.value,
        g: gThreshold.value,
        b: bThreshold.value,
      }, {
        x: 0,
        y: 0,
        size: -1,
        width: (thumbnailCanvas as HTMLCanvasElement).width,
        height: (thumbnailCanvas as HTMLCanvasElement).height,
      }) as Array<number>
    } else {
      pixels = processPixels as Array<number>
    }
    setBitMap({
      data: pixels,
      width: (thumbnailCanvas as HTMLCanvasElement).width,
      height: (thumbnailCanvas as HTMLCanvasElement).height,
    })
    /**
      * contours
      */
    const { canvas: reversedCanvas } = reversePixels(
      pixels,
      bitmap.value.width,
      bitmap.value.height,
    )
    const reversedCtx: CanvasRenderingContext2D = reversedCanvas.getContext('2d') as CanvasRenderingContext2D
    const width = reversedCanvas.width
    const height = reversedCanvas.height
    const imgData = reversedCtx.getImageData(0, 0, width, height)
    // @ts-ignore
    let src = cv.matFromImageData(imgData)
    // @ts-ignore
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0)
    // @ts-ignore
    cv.threshold(src, src, 120, 200, cv.THRESH_BINARY)
    // @ts-ignore
    let contours = new cv.MatVector()
    // @ts-ignore
    let hierarchy = new cv.Mat()
    // @ts-ignore
    cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_NONE)

    const allPoints = []
    // @ts-ignore
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i)
      for (let row = 0; row < contour.rows; row++) {
        allPoints.push({
          x: contour.data32S[row * 2],
          y: contour.data32S[row * 2 + 1],
        })
      }
    }
    const { x: allX, y: allY, w: allW, h: allH } = getBound(allPoints)
    let adjustW, adjustH
    const size = 500
    if (allW > allH) {
      adjustW = size
      adjustH = allH / allW * adjustW
    } else {
      adjustH = size
      adjustW = allW / allH * adjustH
    }
    const scaleW = adjustW / allW
    const scaleH = adjustH / allH

    // @ts-ignore
    for (let i = 0; i < contours.size(); i++) {
      const points = []
      const contour = contours.get(i)
      for (let row = 0; row < contour.rows; row++) {
        points.push({
          uuid: genUUID(),
          x: contour.data32S[row * 2],
          y: contour.data32S[row * 2 + 1],
        })
      }
      points.push({
        uuid: genUUID(),
        x: contour.data32S[0],
        y: contour.data32S[1],
      })
      const { x, y, w, h } = getBound(points)
      const _points = transformPoints(points, {
        x: (x - allX) * scaleW, y: (y - allY) * scaleH, w: w * scaleW, h: h * scaleH, rotation: 0, flipX: false, flipY: false,
      }).map((_point: {x: number, y: number}) => {
        return {
          uuid: genUUID(),
          ..._point,
        }
      })
      const { x: _x, y: _y, w: _w, h: _h } = getBound(_points.reduce((arr: Array<{x: number, y: number }>, point: IPoint) => {
        arr.push({
          x: point.x,
          y: point.y,
        })
        return arr
      }, []))
      const contoursComponent: IComponent = {
        uuid: genUUID(),
        type: 'polygon',
        name: 'polygon',
        lock: false,
        visible: true,
        value: {
          points: _points,
          fillColor: hierarchy.data32S[i * 4 + 3] === -1 ? '#000' : '#fff',
          strokeColor: '#000',
          closePath: true,
        } as unknown as IComponentValue,
        x: _x,
        y: _y,
        w: _w,
        h: _h,
        rotation: 0,
        flipX: false,
        flipY: false,
        usedInCharacter: false,
      }
      addContoursComponent(contoursComponent)
    }
    /**
      * curves
      */
    contoursComponents.value.map((contourComponent: IComponent) => {
      if (contourComponent.type === 'polygon') {
        const points = (contourComponent.value as unknown as IPenComponent).points
        const beziers: Array<any> = fitCurve(points, maxError.value)
        let penPoints: Array<IPenPoint> = []
        beziers.map((bezier: Array<{ x: number, y: number }>, index) => {
          const uuid1 = genUUID()
          const uuid2 = genUUID()
          const uuid3 = genUUID()
          const uuid4 = genUUID()
          penPoints.push({
            uuid: uuid1,
            x: bezier[0].x,
            y: bezier[0].y,
            type: 'anchor',
            origin: null,
            isShow: true,
          })
          penPoints.push({
            uuid: uuid2,
            x: bezier[1].x,
            y: bezier[1].y,
            type: 'control',
            origin: uuid1,
            isShow: false,
          })
          penPoints.push({
            uuid: uuid3,
            x: bezier[2].x,
            y: bezier[2].y,
            type: 'control',
            origin: uuid4,
            isShow: false,
          })
          if (index >= beziers.length - 1) {
            penPoints.push({
              uuid: uuid4,
              x: bezier[3].x,
              y: bezier[3].y,
              type: 'anchor',
              origin: null,
              isShow: true,
            })
          }
        })
        const { x: penX, y: penY, w: penW, h: penH } = getBound(penPoints)
        const curveComponent = R.clone(contourComponent)
        curveComponent.uuid = genUUID();
        (curveComponent.value as unknown as IPenComponent).points = penPoints;
        (curveComponent.value as unknown as IPenComponent).editMode = false;
        curveComponent.type = 'pen'
        curveComponent.name = 'pic-contour'
        curveComponent.x = penX
        curveComponent.y = penY
        curveComponent.w = penW
        curveComponent.h = penH
        curveComponent.rotation = 0
        curveComponent.usedInCharacter = true
        addCurvesComponent(curveComponent)
      }
    })
  }
  const setCurves = () => {
    /**
    * curves
    */
    clearCurvesComponent()
    contoursComponents.value.filter((contourComponent) => {
      const points = (contourComponent.value as unknown as IPenComponent).points
      return points.length >= dropThreshold.value
    }).map((contourComponent: IComponent) => {
      if (contourComponent.type === 'polygon') {
        const points = (contourComponent.value as unknown as IPenComponent).points
        const beziers: Array<any> = fitCurve(points, maxError.value)
        let penPoints: Array<IPenPoint> = []
        if (!beziers.length) return
        penPoints.push({
          uuid: genUUID(),
          x: beziers[0][0].x,
          y: beziers[0][0].y,
          type: 'anchor',
          origin: null,
          isShow: true,
        })
        beziers.map((bezier: Array<{ x: number, y: number }>, index) => {
          const uuid2 = genUUID()
          const uuid3 = genUUID()
          const uuid4 = genUUID()
          penPoints.push({
            uuid: uuid2,
            x: bezier[1].x,
            y: bezier[1].y,
            type: 'control',
            origin: penPoints[penPoints.length - 1].uuid,
            isShow: false,
          })
          penPoints.push({
            uuid: uuid3,
            x: bezier[2].x,
            y: bezier[2].y,
            type: 'control',
            origin: uuid4,
            isShow: false,
          })
          penPoints.push({
            uuid: uuid4,
            x: bezier[3].x,
            y: bezier[3].y,
            type: 'anchor',
            origin: null,
            isShow: true,
          })
        })
        const { x: penX, y: penY, w: penW, h: penH } = getBound(penPoints)
        const curveComponent = R.clone(contourComponent)
        curveComponent.uuid = genUUID();
        (curveComponent.value as unknown as IPenComponent).points = penPoints;
        (curveComponent.value as unknown as IPenComponent).editMode = false;
        curveComponent.type = 'pen'
        curveComponent.name = 'pic-contour'
        curveComponent.x = penX,
        curveComponent.y = penY,
        curveComponent.w = penW,
        curveComponent.h = penH,
        curveComponent.rotation = 0,
        curveComponent.usedInCharacter = true,
        addCurvesComponent(curveComponent)
      }
    })
  }

  emitter.on('resetEditFontPic', () => {
    setAllElements()
  })
</script>

<template>
  <div class="picture-edit-panel">
    <div class="effect-wrapper step-1-wrapper">
      <div class="title">{{ t('panels.picEditPanel.step1.title') }}</div>
      <el-form
        class="bitmap-form form"
        label-width="40px"
      >
        <div class="global-effect" v-if="!enableLocalBrush.value">
          <el-form-item label="r">
            <el-slider
              v-model="rThreshold"
              show-input size="small"
              :min="0"
              :max="255"
              :disabled="step !== 1"
              @change="onThresholdsChange"
            />
          </el-form-item>
          <el-form-item label="g">
            <el-slider
              v-model="gThreshold"
              show-input
              size="small"
              :min="0"
              :max="255"
              :disabled="step !== 1"
              @change="onThresholdsChange"
            />
          </el-form-item>
          <el-form-item label="b">
            <el-slider
              v-model="bThreshold"
              show-input
              size="small"
              :min="0"
              :max="255"
              :disabled="step !== 1"
              @change="onThresholdsChange"
            />
          </el-form-item>
          <div class="tip" v-if="step === 1">
            {{ t('panels.picEditPanel.step1.tip') }}<el-button type="primary" text @pointerdown="useLocalBrush">{{ t('panels.picEditPanel.step1.localBrush') }}</el-button>
          </div>
        </div>
        <div class="local-brush" v-if="!!enableLocalBrush.value && step === 1">
          <el-form-item label="r">
            <el-slider
              v-model="localRThreshold"
              show-input size="small"
              :min="0"
              :max="255"
              :disabled="step !== 1"
              @change="onLocalThresholdsChange"
            />
          </el-form-item>
          <el-form-item label="g">
            <el-slider
              v-model="localGThreshold"
              show-input
              size="small"
              :min="0"
              :max="255"
              :disabled="step !== 1"
              @change="onLocalThresholdsChange"
            />
          </el-form-item>
          <el-form-item label="b">
            <el-slider
              v-model="localBThreshold"
              show-input
              size="small"
              :min="0"
              :max="255"
              :disabled="step !== 1"
              @change="onLocalThresholdsChange"
            />
          </el-form-item>
          <el-form-item :label="tm('panels.picEditPanel.step1.brush')">
            <el-slider
              v-model="localBrushSize"
              show-input
              size="small"
              :min="1"
              :max="50"
              :disabled="step !== 1"
              @change="onLocalBrushSizeChange"
            />
          </el-form-item>
        </div>
        <el-button-group class="step-button-group">
          <el-button :disabled="step !== 1" @pointerdown="handleBitMap" size="small">{{ t('panels.picEditPanel.confirm') }}</el-button>
          <el-button :disabled="step !== 1" @pointerdown="cancelBitMap" size="small">{{ t('panels.picEditPanel.cancel') }}</el-button>
          <el-button type="primary" :disabled="step === 1" @pointerdown="toStep(1)" size="small">{{ t('panels.picEditPanel.edit') }}</el-button>
        </el-button-group>
      </el-form>
    </div>
    <div class="effect-wrapper">
      <div class="title">{{ t('panels.picEditPanel.step2.title') }}</div>
      <div class="content">{{ t('panels.picEditPanel.step2.content') }}</div>
    </div>
    <div class="effect-wrapper step-3-wrapper">
      <div class="title">{{ t('panels.picEditPanel.step3.title') }}</div>
      <el-form
        class="fit-curve-form form"
        label-width="50px"
      >
        <el-form-item label="平滑">
                      <el-input-number v-model="maxError" :min="1" :max="10" :disabled="step!==3" @input="onMaxErrorChange" :precision="2"/>
        </el-form-item>
        <el-form-item label="过滤">
                      <el-input-number v-model="dropThreshold" :min="0" :max="100" :disabled="step!==3" @input="onDropThresholdChange" :precision="2"/>
        </el-form-item>
        <el-button-group class="step-button-group">
          <el-button :disabled="step !== 3" @pointerdown="handleFitCurve" size="small">{{ t('panels.picEditPanel.confirm') }}</el-button>
          <el-button :disabled="step !== 3" @pointerdown="cancelFitCurve" size="small">{{ t('panels.picEditPanel.cancel') }}</el-button>
          <el-button type="primary" :disabled="step === 3" @pointerdown="toStep(3)" size="small">{{ t('panels.picEditPanel.edit') }}</el-button>
        </el-button-group>
      </el-form>
    </div>
    <div class="effect-wrapper">
      <div class="title">{{ t('panels.picEditPanel.step4.title') }}</div>
      <div class="content">{{ t('panels.picEditPanel.step4.content') }}</div>
    </div>
  </div>
</template>

<style scoped>
  .picture-edit-panel {
    width: 100%;
    height: 100%;
    .tip {
      margin-left: 50px;
      color: var(--light-4);
      display: flex;
      align-items: center;
      .el-button {
        color: var(--primary-4);
        background-color: var(--dark-2);
        /* padding: 2px; */
        height: 22px;
        border-radius: 5px;
        margin-left: 5px;
      }
    }
    .el-form {
      padding-top: 20px;
    }
  }
  .title {
    height: 36px;
    line-height: 36px;
    padding: 0 10px;
    border-bottom: 1px solid #dcdfe6;
  }
  .form {
    padding: 5px;
  }
  .effect-wrapper {
    margin-bottom: 20px;
  }
  .step-1-wrapper, .step-3-wrapper {
    margin-bottom: 50px;
  }
  .step-button-group {
    position: absolute;
    right: 10px;
    margin-top: 16px;
  }
  .content {
    padding: 20px;
    color: var(--light-4);
  }
</style>
<style>
  .global-effect {
    .el-form-item__label {
      width: 40px !important;
    }
    .el-input-number {
      width: 120px !important;
    }
  }
</style>