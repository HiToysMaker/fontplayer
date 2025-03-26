<script setup lang="ts">
  /**
	 * 字形编辑面板
	 */
	/**
	 * character editing panel
	 */

  import { Status, editPanelDisplay, editStatus } from '../../stores/font'
  import {
    selectedComponent,
    selectedComponentUUID,
    componentsForCurrentGlyph,
    editGlyph,
    orderedListWithItemsForCurrentGlyph,
    executeScript,
    selectedSubComponent,
    SubComponentsRoot,
    tempScript,
    scripts_map,
  } from '../../stores/glyph'
  import { onMounted, ref, type Ref, watch, onUnmounted, nextTick } from 'vue'
  import {
    mapCanvasWidth,
    mapCanvasHeight,
  } from '../../../utils/canvas'
  import { tool, grid, background, setCanvas, canvas, fontRenderStyle, setTool, checkJoints, checkRefLines } from '../../stores/global'
  import { initPen, renderPenEditor } from '../../tools/pen'
  import { initSelect, renderSelectEditor } from '../../tools/select/select'
  import { initEllipse, renderEllipseEditor } from '../../tools/ellipse'
  import { initRectangle, renderRectangleEditor } from '../../tools/rectangle'
  import { initPolygon, renderPolygonEditor } from '../../tools/polygon'
  import { renderGlyph, renderGlyph as _render } from '../../canvas/canvas'
  import { editing as editingLayout,  selectControl as selectLayoutControl } from '../../stores/glyphLayoutResizer_glyph'
  import { initLayoutResizer, renderLayoutEditor } from '../../tools/glyphLayoutResizer_glyph'
  import { initGlyphDragger, renderGlyphSelector } from '../../tools/glyphDragger_glyph'
  import { editing as glyphEditing, draggingJoint, putAtCoord, movingJoint } from '../../stores/glyphDragger_glyph'
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
  import { initTranslateMover } from '../../tools/translateMover'
	import { CustomGlyph } from '../../programming/CustomGlyph'
	import { emitter } from '../../Event/bus'
  import { initCoordsViewer } from '../../tools/coordsViewer'
  import { clearState, OpType, redo, saveState, StoreType, undo } from '../../stores/edit'
  import { renderJoints, renderRefLines } from '../../programming/Joint'

  const mounted: Ref<boolean> = ref(false)
  let closeTool: Function | null = null
  let closeLayoutResizer: Function | null = null
  const editCanvas: Ref<HTMLCanvasElement | null> = ref(null)
  const previewCanvas: Ref<HTMLCanvasElement | null> = ref(null)
  
  const width = 1000
  const height = 1000

  // onMounted初始化，需要执行当前编辑字形脚本，并渲染字形，初始化工具栏
  // onMounted initialization
  onMounted(async () => {
    document.addEventListener('keydown', onKeyDown)
    // 缓存字符中所有组件用到的脚本，以便executeScript时快速查找
    tempScript(editGlyph.value)
    editStatus.value = Status.Glyph
    executeScript(editGlyph.value)
    const _canvas = editCanvas.value as HTMLCanvasElement
    _canvas.style.width = `${500 * editGlyph.value.view.zoom / 100}px`
    _canvas.style.height = `${500 * editGlyph.value.view.zoom / 100}px`
    grid.precision = 20
		setCanvas(_canvas)
    mounted.value = true
    initTool()
    render()
    emitter.on('renderGlyph', () => {
      render()
      renderRefComponents()
    })
    emitter.on('renderGlyph_forceUpdate', () => {
      const glyph = editGlyph.value._o ? editGlyph.value._o : new CustomGlyph(editGlyph.value)
      renderGlyph(glyph, canvas.value, true, false, false, true)
    })
    emitter.on('updateGlyphView', () => {
      const _canvas = canvas.value
      _canvas.style.width = `${500 * editGlyph.value.view.zoom / 100}px`
      _canvas.style.height = `${500 * editGlyph.value.view.zoom / 100}px`
    })
    await nextTick()
    if (selectedComponentUUID.value && selectedComponent.value.type === 'glyph') {
      setTool('glyphDragger')
    }
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
    emitter.off('renderGlyph')
    emitter.off('renderGlyph_forceUpdate')
    emitter.off('updateGlyphView')
    document.removeEventListener('keydown', onKeyDown)
    clearState()
    editingLayout.value = false
    if (closeTool) {
      closeTool()
    }
    if (closeLayoutResizer) {
      closeLayoutResizer()
    }
    setTool('')
  })

  // 渲染辅助信息
  // render ref components
  const renderRefComponents = () => {
    if (editGlyph.value.layout && editingLayout.value) {
      renderLayoutEditor(canvas.value)
    }
    if (!selectedComponentUUID.value) return
    if (checkJoints.value) {
      if (selectedSubComponent.value) {
        renderJoints(selectedSubComponent.value, canvas.value)
      } else if (SubComponentsRoot.value) {
        renderJoints(SubComponentsRoot.value, canvas.value)
      } else if (selectedComponent.value) {
        renderJoints(selectedComponent.value, canvas.value)
      }
    }
    if (checkRefLines.value) {
      if (selectedSubComponent.value) {
        renderRefLines(selectedSubComponent.value, canvas.value)
      } else if (SubComponentsRoot.value) {
        renderRefLines(SubComponentsRoot.value, canvas.value)
      } else if (selectedComponent.value) {
        renderRefLines(selectedComponent.value, canvas.value)
      }
    }
    // if (checkJoints.value) {
    //   if (selectedSubComponent.value) {
    //     selectedSubComponent.value.value._o.renderJoints(canvas.value)
    //   } else if (SubComponentsRoot.value) {
    //     SubComponentsRoot.value.value._o.renderJoints(canvas.value)
    //   } else {
    //     selectedComponent.value.value._o.renderJoints(canvas.value)
    //   }
    // }
    // if (checkRefLines.value) {
    //   if (selectedSubComponent.value) {
    //     selectedSubComponent.value.value._o.renderRefLines(canvas.value)
    //   } else if (SubComponentsRoot.value) {
    //     SubComponentsRoot.value.value._o.renderRefLines(canvas.value)
    //   } else {
    //     selectedComponent.value.value._o.renderRefLines(canvas.value)
    //   }
    // }
    if (draggingJoint.value) {
      renderGlyphSelector(canvas.value)
    }
  }

	// 初始化工具，当切换工具时，调用对应工具的初始化方法
	// init tool, call initializer for each tool when switching tool
  const initTool = () => {
    closeTool && closeTool()
    switch(tool.value) {
      case 'pen':
        closeTool = initPen(canvas.value, true)
        break
      case 'select':
        closeTool = initSelect(canvas.value, 10, true)
        break
      case 'ellipse':
        closeTool = initEllipse(canvas.value, true)
        break
      case 'rectangle':
        closeTool = initRectangle(canvas.value, true)
        break
      case 'polygon':
        closeTool = initPolygon(canvas.value, true)
        break
      case 'translateMover':
        closeTool = initTranslateMover(canvas.value, true)
        break
      case 'coordsViewer':
        closeTool = initCoordsViewer(canvas.value, true)
        break
      case 'glyphDragger':
				closeTool = initGlyphDragger(canvas.value)
				break
    }
  }

  watch([editingLayout, tool], () => {
    if (closeLayoutResizer) {
      closeLayoutResizer()
      render()
    }
    if (editingLayout.value && tool.value === 'params') {
      // 最顶层glyph编辑结构
      closeLayoutResizer = initLayoutResizer(canvas.value)
      renderLayoutEditor(canvas.value)
    }
    renderRefComponents()
    // else if (editingLayout.value && selectedComponent.value) {
    //   closeLayoutResizer = initLayoutResizer(canvas.value, selectedComponent.value.value, selectedComponent.value.ox, selectedComponent.value.oy)
    //   renderLayoutEditor(canvas.value, selectedComponent.value.value, selectedComponent.value.ox, selectedComponent.value.oy)
    // }
  }, {
    deep: true,
  })

  watch(() => editGlyph.value.selectedComponentsTree, () => {
    if (selectedSubComponent.value && closeLayoutResizer) {
      closeLayoutResizer()
      editingLayout.value = false
    } else if (editingLayout.value) {
      closeLayoutResizer = initLayoutResizer(canvas.value)
      renderLayoutEditor(canvas.value)
    }
  }, {
    deep: true,
  })

  watch([() => editGlyph.value.layout], () => {
    render()
    if (editingLayout.value && tool.value === 'params') {
      renderLayoutEditor(canvas.value)
    }
    // else if (editingLayout.value && selectedComponent.value) {
    //   renderLayoutEditor(canvas.value, selectedComponent.value.value, selectedComponent.value.ox, selectedComponent.value.oy)
    // }
    renderRefComponents()
    emitter.emit('renderGlyphPreviewCanvasByUUID', editGlyph.value.uuid)
  }, {
    deep: true,
  })

  watch([() => selectedComponent.value?.value?.layout, () => SubComponentsRoot.value?.value?.layout], () => {
    render()
    if (editingLayout.value && (selectedComponent.value || SubComponentsRoot.value)) {
      renderLayoutEditor(canvas.value)
    }
    tool.value === 'select' && renderSelectEditor(canvas.value, 10, true)
    tool.value === 'pen' && renderPenEditor(canvas.value)
		renderRefComponents()
    emitter.emit('renderPreviewCanvasByUUID', editGlyph.value.uuid)
  }, {
    deep: true,
  })

  watch([
    glyphEditing,
    draggingJoint,
    movingJoint,
    putAtCoord,
  ], () => {
    render()
    renderRefComponents()
    renderGlyphSelector(canvas.value)
    if (!glyphEditing.value) return
  })

  watch(tool, (newValue, oldValue) => {
    saveState('选择工具', [StoreType.Tools], OpType.Undo, {
      tool: oldValue,
      newRecord: true,
    })
    if (!mounted) return
    render()
    switch (tool.value) {
      case 'select':
        if (selectedComponentUUID.value) {
          renderSelectEditor(canvas.value, 10, true)
        }
        break
      case 'glyphDragger':
        if (selectedComponentUUID.value) {
          closeTool && closeTool()
          closeTool = initGlyphDragger(canvas.value)
          renderGlyphSelector(canvas.value)
        }
        break
    }
    renderRefComponents()
    initTool()
  })

  watch([
    background,
    grid,
    fontRenderStyle,
  ], () => {
    render()
    renderRefComponents()
  })

  watch([
    orderedListWithItemsForCurrentGlyph,
    componentsForCurrentGlyph,
  ], () => {
    if (!editGlyph.value) return
    if (!mounted) return
    const _canvas = canvas.value
    _canvas.width = mapCanvasWidth(width)
    _canvas.height = mapCanvasHeight(height)
    _canvas.style.width = `${500 * editGlyph.value.view.zoom / 100}px`
    _canvas.style.height = `${500 * editGlyph.value.view.zoom / 100}px`
    render()
    if (selectedComponentUUID.value) {
      tool.value === 'select' && renderSelectEditor(canvas.value, 10, true)
      tool.value === 'pen' && renderPenEditor(canvas.value)
    }
    renderRefComponents()
		emitter.emit('renderGlyphPreviewCanvasByUUID', editGlyph.value.uuid)
  })

  watch([
    penPoints,
    penEditing,
  ], () => {
    render()
    tool.value === 'select' && renderSelectEditor(canvas.value, 10, true)
    tool.value === 'pen' && renderPenEditor(canvas.value)
    if (!penEditing.value) return
    renderPenEditor(canvas.value)
  })

  watch([
    polygonPoints,
    polygonEditing,
  ], () => {
    render()
    tool.value === 'select' && renderSelectEditor(canvas.value, 10, true)
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
    tool.value === 'select' && renderSelectEditor(canvas.value, 10, true)
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
    tool.value === 'select' && renderSelectEditor(canvas.value, 10, true)
    tool.value === 'pen' && renderPenEditor(canvas.value)
    if (!rectangleEditing.value) return
    renderRectangleEditor(canvas.value)
  })

  watch([
    selectedComponentUUID,
    componentsForCurrentGlyph,
    selectedComponent,
  ], () => {
    render()
    renderRefComponents()
    if (!selectedComponentUUID.value) return
    tool.value === 'select' && renderSelectEditor(canvas.value, 10, true)
    tool.value === 'pen' && renderPenEditor(canvas.value)
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
      renderSelectEditor(canvas.value, 10, true)
    }
  })

  const render = () => {
    //_render(canvas.value as HTMLCanvasElement)
    const glyph = editGlyph.value._o ? editGlyph.value._o : new CustomGlyph(editGlyph.value)
    renderGlyph(glyph, canvas.value, true, false, false)
  }
</script>

<template>
  <section class="edit-panel-wrapper">
    <main class="canvas-wrapper">
      <div class="edit-canvas-wrapper" :style="{
        'display': editPanelDisplay === 'edit' ? 'flex' : 'none',
      }">
        <canvas
          ref="editCanvas"
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
            'transform': `translate3d(${editGlyph.view.translateX}px, ${editGlyph.view.translateY}px, 0px)`,
          }"
          :width="mapCanvasWidth(width)"
          :height="mapCanvasHeight(height)"
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
  .pen-on-edit, .mirror-on-edit {
    cursor: url('@/assets/icons/pen-nib-solid.svg') 0 16, pointer;
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