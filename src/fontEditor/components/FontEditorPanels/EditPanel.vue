<script setup lang="ts">
  /**
	 * 字符编辑面板
	 */
	/**
	 * character editing panel
	 */

  import { editPanelDisplay } from '../../stores/font'
  import {
    selectedFile,
    selectedComponent,
    selectedComponentUUID,
    componentsForCurrentCharacterFile,
    orderedListWithItemsForCurrentCharacterFile,
    editCharacterFile,
    editCharacterFileUUID,
    modifyCharacterFile,
    selectedSubComponent,
    SubComponentsRoot,
    executeCharacterScript,
    resetEditCharacterFile,
    setEditCharacterFileByUUID,
    updateCharacterListFromEditFile,
  } from '../../stores/files'
  import { onMounted, ref, type Ref, watch, onUnmounted, computed } from 'vue'
  import {
    mapCanvasWidth,
    mapCanvasHeight,
  } from '../../../utils/canvas'
  import { tool, grid, background, setCanvas, canvas, fontRenderStyle, width, height, setTool, checkJoints, checkRefLines, gridChanged, loading } from '../../stores/global'
  import { initPen, renderPenEditor } from '../../tools/pen'
  import { initSelect, renderSelectEditor } from '../../tools/select/select'
  import { initEllipse, renderEllipseEditor } from '../../tools/ellipse'
  import { initRectangle, renderRectangleEditor } from '../../tools/rectangle'
  import { initPolygon, renderPolygonEditor } from '../../tools/polygon'
	import { initGlyphDragger, renderGlyphSelector } from '../../tools/glyphDragger'
  import { render as _render } from '../../canvas/canvas'
  import {
    selectControl,
    selectAnchor,
    selectPenPoint,
    hoverPenPoint,
    onPenEditMode,
  } from '../../stores/select'
  import {
    editing as penEditing,
    points as penPoints,
  } from '../../stores/pen'
  import {
    editing as polygonEditing,
    points as polygonPoints,
  } from '../../stores/polygon'
  import { radiusX, radiusY, ellipseX, ellipseY, editing as ellipseEditing } from '../../stores/ellipse'
  import { rectX, rectY, rectWidth, rectHeight, editing as rectangleEditing } from '../../stores/rectangle'
  import { editing as glyphEditing, draggingJoint, putAtCoord, movingJoint, editCharacterFileOnDragging, selectedSubComponentOnDragging, SubComponentsRootOnDragging, selectedComponentOnDragging } from '../../stores/glyphDragger'
  import { initTranslateMover } from '../../tools/translateMover'
  import { emitter } from '../../Event/bus'
  import { initCoordsViewer } from '../../tools/coordsViewer'
  import { nextTick } from 'vue'
  import GridController from '../../components/Widgets/GridController.vue'
  import MetricsController from '../../components/Widgets/MetricsController.vue'
  import { editing as editingLayout,  selectControl as selectLayoutControl } from '../../stores/glyphLayoutResizer'
  import { initLayoutResizer, renderLayoutEditor } from '../../tools/glyphLayoutResizer'
  import { clearState, OpType, redo, saveState, StoreType, undo } from '../../stores/edit'
  import { gridSettings } from '../../stores/global'
  import { scripts_map, tempScript } from '../../stores/glyph'
  import { renderJoints, renderRefLines } from '../../programming/Joint'

  const mounted: Ref<boolean> = ref(false)
  let closeTool: Function | null = null
  let closeLayoutResizer: Function | null = null
  const editCanvas: Ref<HTMLCanvasElement | null> = ref(null)
  const previewCanvas: Ref<HTMLCanvasElement | null> = ref(null)

  // onMounted初始化，需要执行当前编辑字符脚本，并渲染字符，初始化工具栏
  // onMounted initialization
  onMounted(async () => {
    document.addEventListener('keydown', onKeyDown)
    // 缓存字符中所有组件用到的脚本，以便executeScript时快速查找
    tempScript(editCharacterFile.value)
    executeCharacterScript(editCharacterFile.value)
    const _canvas = editCanvas.value as HTMLCanvasElement
    _canvas.style.width = `${width.value * editCharacterFile.value.view.zoom / 100}px`
    _canvas.style.height = `${height.value * editCharacterFile.value.view.zoom / 100}px`
    grid.precision = selectedFile.value.width / width.value * 10
		setCanvas(_canvas)
    checkJoints.value = true
    checkRefLines.value = true
    mounted.value = true
    initTool()
    await nextTick()
    render()
    // 监听渲染当前编辑字符事件
    // watch for render edting character
    emitter.on('renderCharacter', () => {
      render()
      renderRefComponents()
      tool.value === 'select' && renderSelectEditor(canvas.value)
      tool.value === 'pen' && renderPenEditor(canvas.value)
    })
    emitter.on('renderCharacter_forceUpdate', () => {
      _render(canvas.value as HTMLCanvasElement, true, true)
    })
    emitter.on('updateCharacterView', () => {
      const _canvas = canvas.value
      _canvas.style.width = `${500 * editCharacterFile.value.view.zoom / 100}px`
      _canvas.style.height = `${500 * editCharacterFile.value.view.zoom / 100}px`
    })
    await nextTick()
    if (selectedComponentUUID.value && selectedComponent.value.type === 'glyph') {
      setTool('glyphDragger')
    }
    loading.value = false
  })

  const onKeyDown = (event) => {
    const isMac = navigator.userAgent.includes("Mac")
    if ((isMac && event.metaKey && event.key === 'z') || (!isMac && event.ctrlKey && event.key === 'z')) {
      if (event.shiftKey) {
        // 重做 (Ctrl+Shift+Z 或 Command+Shift+Z)
        redo()
      } else {
        // 撤销 (Ctrl+Z 或 Command+Z)
        undo()
      }
      event.preventDefault()
    }
  }

  // onUnmounted关闭工具栏和布局编辑器
  // onUnmounted operation
  onUnmounted(() => {
    scripts_map.value = {}
    emitter.off('renderCharacter')
    emitter.off('renderCharacter_forceUpdate')
    emitter.off('updateCharacterView')
    document.removeEventListener('keydown', onKeyDown)
    clearState()
    if (closeTool) {
      closeTool()
    }
    if (closeLayoutResizer) {
      closeLayoutResizer()
    }
    setTool('')
    updateCharacterListFromEditFile()
    resetEditCharacterFile()
  })

  const onGridChange = (dx, dy, centerSquareSize) => {
    gridChanged.value = true
    gridSettings.value.dx = dx
    gridSettings.value.dy = dy
    gridSettings.value.centerSquareSize = centerSquareSize
    // const info = R.clone(editCharacterFile.value.info)
    // if (info.gridSettings) {
    //   info.gridSettings.dx = dx
    //   info.gridSettings.dy = dy
    //   info.gridSettings.centerSquareSize = centerSquareSize
    //   // const x1 = Math.round((info.gridSettings.size - centerSquareSize) / 2) + dx
    //   // const x2 =  Math.round((info.gridSettings.size - centerSquareSize) / 2 + centerSquareSize) + dx
    //   // const y1 = Math.round((info.gridSettings.size - centerSquareSize) / 2) + dy
    //   // const y2 = Math.round((info.gridSettings.size - centerSquareSize) / 2 + centerSquareSize) + dy
    //   // const l = info.gridSettings.size
    //   // formatLayout(
    //   //   info.layoutTree,
    //   //   { x: 0, y: 0, w: l, h: l, },
    //   //   1,
    //   //   { x1, x2, y1, y2, l },
    //   // )
    // }
    // modifyCharacterFile(editCharacterFileUUID.value, {
    //   info,
    // })
  }

	// 初始化工具，当切换工具时，调用对应工具的初始化方法
	// init tool, call initializer for each tool when switching tool
  const initTool = () => {
    closeTool && closeTool()
    switch(tool.value) {
      case 'pen':
        closeTool = initPen(canvas.value)
        break
      case 'select':
        closeTool = initSelect(canvas.value)
        break
      case 'ellipse':
        closeTool = initEllipse(canvas.value)
        break
      case 'rectangle':
        closeTool = initRectangle(canvas.value)
        break
      case 'polygon':
        closeTool = initPolygon(canvas.value)
        break
      case 'translateMover':
        closeTool = initTranslateMover(canvas.value)
        break
      case 'coordsViewer':
        closeTool = initCoordsViewer(canvas.value)
        break
			case 'glyphDragger':
				closeTool = initGlyphDragger(canvas.value)
				break
    }
  }

  // tool改变时，重新初始化工具栏，重新渲染
  // watch for tool change
  watch(tool, (newValue, oldValue) => {
    if (!mounted) return
    render()
    switch (tool.value) {
      case 'select':
        if (selectedComponentUUID.value) {
          renderSelectEditor(canvas.value)
        }
        break
      case 'glyphDragger':
        if (selectedComponentUUID.value) {
          closeTool = initGlyphDragger(canvas.value)
          renderGlyphSelector(canvas.value)
        }
        break
    }
		renderRefComponents()
    initTool()
  })

  // editingLayout改变时重置LayoutResizer
  // watch for editingLayout
  watch([editingLayout, () => editCharacterFile.value.selectedComponentsTree], () => {
    if (selectedSubComponent.value && closeLayoutResizer) {
      closeLayoutResizer()
      editingLayout.value = false
    } else if (editingLayout.value) {
      closeLayoutResizer = initLayoutResizer(canvas.value)
      renderLayoutEditor(canvas.value)
    }
  }, {
    deep: true
  })

  watch([() => selectedComponent.value?.value?.layout, () => SubComponentsRoot.value?.value?.layout], () => {
    render()
    if (editingLayout.value && (selectedComponent.value || SubComponentsRoot.value)) {
      renderLayoutEditor(canvas.value)
    }
    tool.value === 'select' && renderSelectEditor(canvas.value)
    tool.value === 'pen' && renderPenEditor(canvas.value)
		renderRefComponents()
    emitter.emit('renderPreviewCanvasByUUIDOnEditing', editCharacterFile.value.uuid)
  }, {
    deep: true,
  })

  watch([
    background,
    grid,
    fontRenderStyle,
  ], () => {
    render()
  })

  // 字符改变时，重新渲染
  // watch for editing character change
  watch([
    editCharacterFile,
    selectedFile,
  ], () => {
    if (!editCharacterFile.value) return
    if (!mounted) return
    const _canvas = canvas.value as HTMLCanvasElement
    _canvas.width = mapCanvasWidth(selectedFile.value.width)
    _canvas.height = mapCanvasHeight(selectedFile.value.height)
    _canvas.style.width = `${width.value * editCharacterFile.value.view.zoom / 100}px`
    _canvas.style.height = `${height.value * editCharacterFile.value.view.zoom / 100}px`
    setCanvas(_canvas)
    render()
		renderRefComponents()
    tool.value === 'select' && renderSelectEditor(canvas.value)
    tool.value === 'pen' && renderPenEditor(canvas.value)
    emitter.emit('renderPreviewCanvasByUUIDOnEditing', editCharacterFile.value.uuid)
  })

  watch([
    penPoints,
    penEditing,
  ], () => {
    render()
    tool.value === 'select' && renderSelectEditor(canvas.value)
    tool.value === 'pen' && renderPenEditor(canvas.value)
    if (!penEditing.value) return
    renderPenEditor(canvas.value)
  })

  watch([
    polygonPoints,
    polygonEditing,
  ], () => {
    render()
    tool.value === 'select' && renderSelectEditor(canvas.value)
    tool.value === 'pen' && renderPenEditor(canvas.value)
    if (!polygonEditing.value) return
    renderPolygonEditor(polygonPoints, canvas.value)
  })

  watch([
    ellipseX,
    ellipseY,
    radiusX,
    radiusY,
    ellipseEditing,
  ], () => {
    render()
    tool.value === 'select' && renderSelectEditor(canvas.value)
    tool.value === 'pen' && renderPenEditor(canvas.value)
    if (!ellipseEditing.value) return
    renderEllipseEditor(canvas.value)
  })

  watch([
    rectX,
    rectY,
    rectWidth,
    rectHeight,
    rectangleEditing,
  ], () => {
    render()
    tool.value === 'select' && renderSelectEditor(canvas.value)
    tool.value === 'pen' && renderPenEditor(canvas.value)
    if (!rectangleEditing.value) return
    renderRectangleEditor(canvas.value)
  })

  watch([
    glyphEditing,
    draggingJoint,
    putAtCoord,
		movingJoint,
  ], () => {
    render()
		renderRefComponents()
		renderGlyphSelector(canvas.value)
    if (!glyphEditing.value) return
  })

  watch([
    selectedComponentUUID,
    componentsForCurrentCharacterFile,
    selectedComponent,
  ], () => {
    editingLayout.value = false
    render()
    if (!selectedComponentUUID.value) return
    tool.value === 'select' && renderSelectEditor(canvas.value)
    tool.value === 'pen' && renderPenEditor(canvas.value)
    renderRefComponents()
    emitter.emit('renderPreviewCanvasByUUIDOnEditing', editCharacterFile.value.uuid)
  })

  // // 监听组件顺序变化，确保拖拽排序后界面能正确刷新
  // watch([
  //   orderedListWithItemsForCurrentCharacterFile,
  // ], () => {
  //   console.log('orderedListWithItemsForCurrentCharacterFile')
  //   render()
  //   renderRefComponents()
  //   tool.value === 'select' && renderSelectEditor(canvas.value)
  //   tool.value === 'pen' && renderPenEditor(canvas.value)
  //   emitter.emit('renderPreviewCanvasByUUIDOnEditing', editCharacterFile.value.uuid)
  // }, {
  //   deep: true,
  // })

  // 监听组件顺序变化，确保拖拽排序后界面能正确刷新
  watch([
    orderedListWithItemsForCurrentCharacterFile,
  ], () => {
    console.log('orderedListWithItemsForCurrentCharacterFile')
    render()
    renderRefComponents()
    tool.value === 'select' && renderSelectEditor(canvas.value)
    tool.value === 'pen' && renderPenEditor(canvas.value)
    emitter.emit('renderPreviewCanvasByUUIDOnEditing', editCharacterFile.value.uuid)
  })

  watch([
    onPenEditMode,
  ], () => {
    if (closeTool) {
      closeTool()
    }
    if (!!onPenEditMode) {
      tool.value === 'select' && initTool()
    }
  })

  watch([
    selectAnchor,
    selectPenPoint,
    hoverPenPoint,
  ], () => {
    if (tool.value === 'select') {
      render()
      renderSelectEditor(canvas.value)
    }
  })

  const render = () => {
    _render(canvas.value as HTMLCanvasElement)
  }

  // 渲染辅助信息
  // render ref components
	const renderRefComponents = () => {
    if (editCharacterFileOnDragging.value) {
      // 拖拽字形组件期间，使用临时变量
      if (checkJoints.value) {
        if (selectedSubComponentOnDragging.value) {
          renderJoints(selectedSubComponentOnDragging.value, canvas.value)
        } else if (SubComponentsRootOnDragging.value) {
          renderJoints(SubComponentsRootOnDragging.value, canvas.value)
        } else if (selectedComponentOnDragging.value) {
          renderJoints(selectedComponentOnDragging.value, canvas.value)
        }
      }
      if (checkRefLines.value) {
        if (selectedSubComponentOnDragging.value) {
          renderRefLines(selectedSubComponentOnDragging.value, canvas.value)
        } else if (SubComponentsRootOnDragging.value) {
          renderRefLines(SubComponentsRootOnDragging.value, canvas.value)
        } else if (selectedComponentOnDragging.value) {
          renderRefLines(selectedComponentOnDragging.value, canvas.value)
        }
      }
    } else {
      if (checkJoints.value) {
        if (selectedSubComponent.value) {
          renderJoints(selectedSubComponent.value, canvas.value)
        } else if (SubComponentsRoot.value) {
          renderJoints(SubComponentsRoot.value, canvas.value)
        } else if (selectedComponent.value && selectedComponent.value !== 'multi') {
          renderJoints(selectedComponent.value, canvas.value)
        }
      }
      if (checkRefLines.value) {
        if (selectedSubComponent.value) {
          renderRefLines(selectedSubComponent.value, canvas.value)
        } else if (SubComponentsRoot.value) {
          renderRefLines(SubComponentsRoot.value, canvas.value)
        } else if (selectedComponent.value && selectedComponent.value !== 'multi') {
          renderRefLines(selectedComponent.value, canvas.value)
        }
      }
    }
    if (draggingJoint.value) {
      renderGlyphSelector(canvas.value)
    }
  }
</script>

<template>
  <section class="edit-panel-wrapper">
    <main class="canvas-wrapper">
      <div class="metrics" v-show="tool === 'metrics'">
        <metrics-controller></metrics-controller>
      </div>
      <div class="grid" v-show="tool === 'grid'">
        <grid-controller
          :size="gridSettings.size"
          :dx="gridSettings.dx"
          :dy="gridSettings.dy"
          :centerSquareSize="gridSettings.centerSquareSize"
          :onChange="onGridChange"
        ></grid-controller>
      </div>
      <div class="edit-canvas-wrapper" v-show="tool !== 'grid'" :style="{
        'display': (editPanelDisplay === 'edit' && tool !== 'grid') ? 'flex' : 'none',
      }">
        <canvas
          ref="editCanvas"
          v-show="tool !== 'grid'"
          :class="{
            'edit-canvas-panel': true,
            'pen-on-edit': tool === 'pen',
            'rectangle-on-edit': tool === 'rectangle',
            'ellipse-on-edit': tool === 'ellipse',
            'polygon-on-edit': tool === 'polygon',
            'rotate-left-top': selectControl === 'rotate-left-top',
            'rotate-right-top': selectControl === 'rotate-right-top',
            'rotate-left-bottom': selectControl === 'rotate-left-bottom',
            'rotate-right-bottom': selectControl === 'rotate-right-bottom',
            'scale-left-top': selectControl === 'scale-left-top' || selectLayoutControl === 'scale-left-top',
            'scale-right-top': selectControl === 'scale-right-top' || selectLayoutControl === 'scale-right-top',
            'scale-left-bottom': selectControl === 'scale-left-bottom' || selectLayoutControl === 'scale-left-bottom',
            'scale-right-bottom': selectControl === 'scale-right-bottom' || selectLayoutControl === 'scale-right-bottom',
            'on-translate-move': tool === 'translateMover',
          }"
          :style="{
            'transform': `translate3d(${editCharacterFile.view.translateX}px, ${editCharacterFile.view.translateY}px, 0px)`,
          }"
          :width="mapCanvasWidth(selectedFile.width)"
          :height="mapCanvasHeight(selectedFile.height)"
        ></canvas>
      </div>
      <div class="preview-canvas-wrapper" :style="{
        'display': editPanelDisplay === 'preview' ? 'flex' : 'none'
      }">
        <canvas
          ref="previewCanvas"
          class="preview-canvas-panel"
          :width="mapCanvasWidth(width)"
          :height="mapCanvasHeight(height)"
        ></canvas>
      </div>
    </main>
  </section>
</template>

<style scoped>
  .edit-canvas-panel {
    position: absolute;
  }
  .edit-panel-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .top-bar {
    flex: 0 0 32px;
    border-bottom: 1px solid var(--dark-4);
    position: relative;
    background-color: white;
    z-index: 99;
  }
  .canvas-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
  }
  .grid, .metrics {
    position: absolute;
    display: flex;
    height: 100%;
    width: 100%;
    align-items: center;
    justify-content: center;
    background-color: var(--dark-1);
  }
  .edit-canvas-wrapper {
    flex: 0 0 1;
    display: flex;
    height: 100%;
    width: 100%;
    align-items: center;
    justify-content: center;
    background-color: var(--dark-1);
  }
  .preview-canvas-wrapper {
    flex: 0 0 1;
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
  }
  canvas {
    width: 100%;
  }
  .list-btn {
    border-radius: 0;
    border: none;
    border-bottom: 1px solid #dcdfe6;
    border-left: 1px solid #dcdfe6;
    box-sizing: border-box;
    height: 32px;
  }
  .pic-btn {
    border-radius: 0;
    box-sizing: border-box;
    border: none;
    border-left: 1px solid #dcdfe6;
    border-bottom: 1px solid #dcdfe6;
    height: 32px;
  }
  .btn-group {
    position: absolute;
    right: 0;
    border-bottom: 1px solid #dcdfe6;
    box-sizing: border-box;
    height: 32px;
  }
  /* .pen-on-edit, .mirror-on-edit {
    cursor: url('@/assets/icons/pen-nib-solid.svg') 0 16, pointer;
  } */
  .pen-on-edit, .mirror-on-edit {
    cursor: url('@/assets/icons/pen-cursor.cur'), pointer;
  }
  .rectangle-on-edit, .ellipse-on-edit {
    cursor: crosshair;
  }
  .polygon-on-edit {
    cursor: url('@/assets/icons/square-solid.svg'), pointer;
  }
  .rotate-left-top, .rotate-left-bottom {
    cursor: url('@/assets/icons/rotate-right-solid.svg'), pointer;
  }
  .rotate-right-top, .rotate-right-bottom {
    cursor: url('@/assets/icons/rotate-left-solid.svg'), pointer;
  }
  .scale-left-top, .scale-right-bottom {
    cursor: nwse-resize;
  }
  .scale-left-bottom, .scale-right-top {
    cursor: nesw-resize;
  }
  .on-translate-move {
    cursor: pointer;
  }
  .on-fill-color {
    cursor: url('@/assets/icons/fill-drip-solid.svg'), pointer;
  }
</style>