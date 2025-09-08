<script setup lang="ts">
  /**
	 * 添加字形组件窗口
	 */
	/**
	 * dialog for adding glyph component
	 */

  import { glyphComponentsDialogVisible, setGlyphComponentsDialogVisible, glyphComponentsDialogVisible2 } from '../../stores/dialogs'
  import { addComponentForCurrentGlyph, addSelectionGlyphTemplate, editGlyph, executeScript, getGlyphByUUID, glyphs, ICustomGlyph, IGlyphComponent, selected_glyphs, multi_glyph_selection, stroke_glyphs, radical_glyphs, comp_glyphs, getParentInfo } from '../../stores/glyph'
  import { addComponentForCurrentCharacterFile, editCharacterFile, selectedFile } from '../../stores/files'
  import { genUUID } from '../../../utils/string'
  import * as R from 'ramda'
  import { onMounted, onUpdated, nextTick, ref } from 'vue'
  import type {
    ILine,
    ICubicBezierCurve,
    IQuadraticBezierCurve,
  } from '../../../fontManager'
	import {
		componentsToContours,
	} from '../../../features/font'
  import { useI18n } from 'vue-i18n'
  import { editStatus, Status } from '../../stores/font'
	import { emitter } from '../../Event/bus'
  import { renderPreview2 } from '../../canvas/canvas'
  import { loaded, loading, setTool, tool, total } from '../../stores/global'
  import { onStrokeReplacement, setReplacementStroke } from '../../stores/advancedEdit'
  const { tm, t } = useI18n()

	const selectedTab = ref(Status.StrokeGlyphList)

	const timerMap = new Map()

  // 挂载组件时，渲染预览画布
  // renderPreviewCanvas on mounted
  onMounted(async () => {
    await nextTick()
  })

	emitter.on('renderGlyphSelection', () => {
		renderPreviewCanvas(Status.GlyphList)
	})

	emitter.on('renderStrokeGlyphSelection', () => {
		renderPreviewCanvas(Status.StrokeGlyphList)
	})

	emitter.on('renderRadicalGlyphSelection', () => {
		renderPreviewCanvas(Status.RadicalGlyphList)
	})

	emitter.on('renderCompGlyphSelection', () => {
		renderPreviewCanvas(Status.CompGlyphList)
	})

	emitter.on('renderGlyphSelectionByUUID', (uuid: string) => {
		if (timerMap.get(uuid)) {
      clearTimeout(timerMap.get(uuid))
      timerMap.set(uuid, null)
    }
    const timer = setTimeout(async () => {
      await nextTick()
      renderGlyphPreviewCanvasByUUID(uuid, Status.GlyphList)
    }, 1000)
    timerMap.set(uuid, timer)
	})

	emitter.on('renderStrokeGlyphSelectionByUUID', (uuid: string) => {
		if (timerMap.get(uuid)) {
      clearTimeout(timerMap.get(uuid))
      timerMap.set(uuid, null)
    }
    const timer = setTimeout(async () => {
      await nextTick()
      renderGlyphPreviewCanvasByUUID(uuid, Status.StrokeGlyphList)
    }, 1000)
    timerMap.set(uuid, timer)
	})

	emitter.on('renderRadicalGlyphSelectionByUUID', (uuid: string) => {
		if (timerMap.get(uuid)) {
      clearTimeout(timerMap.get(uuid))
      timerMap.set(uuid, null)
    }
    const timer = setTimeout(async () => {
      await nextTick()
      renderGlyphPreviewCanvasByUUID(uuid, Status.RadicalGlyphList)
    }, 1000)
    timerMap.set(uuid, timer)
	})

	emitter.on('renderCompGlyphSelectionByUUID', (uuid: string) => {
		if (timerMap.get(uuid)) {
      clearTimeout(timerMap.get(uuid))
      timerMap.set(uuid, null)
    }
    const timer = setTimeout(async () => {
      await nextTick()
      renderGlyphPreviewCanvasByUUID(uuid, Status.CompGlyphList)
    }, 1000)
    timerMap.set(uuid, timer)
	})

  emitter.on('renderGlyphSelectionByUUIDOnEditing', (uuid: string) => {
		if (timerMap.get(uuid)) {
      clearTimeout(timerMap.get(uuid))
      timerMap.set(uuid, null)
    }
    const timer = setTimeout(async () => {
      await nextTick()
      renderGlyphPreviewCanvasByUUID(uuid, Status.GlyphList, true)
    }, 1000)
    timerMap.set(uuid, timer)
	})

	emitter.on('renderStrokeGlyphSelectionByUUIDOnEditing', (uuid: string) => {
		if (timerMap.get(uuid)) {
      clearTimeout(timerMap.get(uuid))
      timerMap.set(uuid, null)
    }
    const timer = setTimeout(async () => {
      await nextTick()
      renderGlyphPreviewCanvasByUUID(uuid, Status.StrokeGlyphList, true)
    }, 1000)
    timerMap.set(uuid, timer)
	})

	emitter.on('renderRadicalGlyphSelectionByUUIDOnEditing', (uuid: string) => {
		if (timerMap.get(uuid)) {
      clearTimeout(timerMap.get(uuid))
      timerMap.set(uuid, null)
    }
    const timer = setTimeout(async () => {
      await nextTick()
      renderGlyphPreviewCanvasByUUID(uuid, Status.RadicalGlyphList, true)
    }, 1000)
    timerMap.set(uuid, timer)
	})

	emitter.on('renderCompGlyphSelectionByUUIDOnEditing', (uuid: string) => {
		if (timerMap.get(uuid)) {
      clearTimeout(timerMap.get(uuid))
      timerMap.set(uuid, null)
    }
    const timer = setTimeout(async () => {
      await nextTick()
      renderGlyphPreviewCanvasByUUID(uuid, Status.CompGlyphList, true)
    }, 100)
    timerMap.set(uuid, timer)
	})


  const renderGlyphPreviewCanvasByUUID = (uuid: string, type: Status, editing: boolean = false) => {
    let glyph = null
    if (editing) {
      // 编辑时，使用editGlyph
			glyph = editGlyph.value
    } else {
      glyph = getGlyphByUUID(uuid)
    }
    executeScript(glyph)
    glyph?.components?.map(component => {
      if (component.type === 'glyph') {
        executeScript(component.value)
      }
    })
		let wrapper = null
		if (type === Status.GlyphList) {
			wrapper = document.getElementById('glyph-components-wrapper')
		} else if (type === Status.StrokeGlyphList) {
			wrapper = document.getElementById('stroke-glyph-components-wrapper')
		} else if (type === Status.RadicalGlyphList) {
			wrapper = document.getElementById('radical-glyph-components-wrapper')
		} else if (type === Status.CompGlyphList) {
			wrapper = document.getElementById('comp-glyph-components-wrapper')
		}
    const canvas: HTMLCanvasElement = wrapper.querySelector(`#preview-canvas-${glyph.uuid}`) as HTMLCanvasElement
    if (!canvas) return

    const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(glyph._o.components, {
      unitsPerEm: 1000,
      descender: -200,
      advanceWidth: 1000,
    }, {x: 0, y: 0}, true, true)
    renderPreview2(canvas, contours)
  }

  const renderPreviewCanvas = (type: Status) => {
    const renderGlyph = (glyph) => {
      if (!glyph._o) {
        executeScript(glyph)
        glyph?.components?.map(component => {
          if (component.type === 'glyph') {
            executeScript(component.value)
          }
        })
      }
			let wrapper = null
			if (type === Status.GlyphList) {
				wrapper = document.getElementById('glyph-components-wrapper')
			} else if (type === Status.StrokeGlyphList) {
				wrapper = document.getElementById('stroke-glyph-components-wrapper')
			} else if (type === Status.RadicalGlyphList) {
				wrapper = document.getElementById('radical-glyph-components-wrapper')
			} else if (type === Status.CompGlyphList) {
				wrapper = document.getElementById('comp-glyph-components-wrapper')
			}
			const canvas = wrapper.querySelector(`#preview-canvas-${glyph.uuid}`) as HTMLCanvasElement
      if (!canvas) return
      const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(glyph._o.components, {
        unitsPerEm: 1000,
        descender: -200,
        advanceWidth: 1000,
      }, {x: 0, y: 0}, true, true)
      renderPreview2(canvas, contours)
			if (loading.value) {
				loaded.value += 1
				if (loaded.value >= total.value) {
					loading.value = false
				}
			}
    }

    if (type === Status.GlyphList && glyphs.value && glyphs.value.length) {
      //for (let i = 0; i < glyphs.value.length; i++) {
      //  renderGlyph(glyphs.value[i])
      //}
      let i = 0
      const render = () => {
        renderGlyph(glyphs.value[i])
        i++
        if (i < glyphs.value.length) {
          requestAnimationFrame(render)
        }
      }
      requestAnimationFrame(render)
    } else if (type === Status.StrokeGlyphList && stroke_glyphs.value && stroke_glyphs.value.length) {
      //for (let i = 0; i < stroke_glyphs.value.length; i++) {
      //  renderGlyph(stroke_glyphs.value[i])
      //}
      let i = 0
      const render = () => {
        renderGlyph(stroke_glyphs.value[i])
        i++
        if (i < stroke_glyphs.value.length) {
          requestAnimationFrame(render)
        }
      }
      requestAnimationFrame(render)
    } else if (type === Status.RadicalGlyphList && radical_glyphs.value && radical_glyphs.value.length) {
      //for (let i = 0; i < radical_glyphs.value.length; i++) {
      //  renderGlyph(radical_glyphs.value[i])
      //}
      let i = 0
      const render = () => {
        renderGlyph(radical_glyphs.value[i])
        i++
        if (i < radical_glyphs.value.length) {
          requestAnimationFrame(render)
        }
      }
      requestAnimationFrame(render)
    } else if (type === Status.CompGlyphList && comp_glyphs.value && comp_glyphs.value.length) {
      //for (let i = 0; i < comp_glyphs.value.length; i++) {
      //  renderGlyph(comp_glyphs.value[i])
      //}
      let i = 0
      const render = () => {
        renderGlyph(comp_glyphs.value[i])
        i++
        if (i < comp_glyphs.value.length) {
          requestAnimationFrame(render)
        }
      }
      requestAnimationFrame(render)
    }
  }

  const handleCancel = () => {
    glyphComponentsDialogVisible2.value = false
  }

  const handleClose = () => {
    setGlyphComponentsDialogVisible(true)
  }

	const cancelSelect = (uuid) => {
		const index = selected_glyphs.value.findIndex(glyph => glyph.uuid === uuid)
		if (index !== -1) {
			selected_glyphs.value.splice(index, 1)
		}
	}
	
	const handleConfirm = () => {
    // 如果onStrokeReplacement为true，则设置替换笔画
    if (onStrokeReplacement.value) {
      setReplacementStroke(selected_glyphs.value[0].uuid)
      onStrokeReplacement.value = false
      glyphComponentsDialogVisible2.value = false
    } else {
      selected_glyphs.value.map(glyph => {
        addGlyph(glyph)
      })
      selected_glyphs.value = []
      glyphComponentsDialogVisible2.value = false
    }
	}


  const addGlyph = (glyph: ICustomGlyph) => {
    const _glyph = R.clone(glyph)
    //_glyph.parent = editStatus.value === Status.Edit ? editCharacterFile.value : editGlyph.value
    _glyph.parent_reference = getParentInfo(editStatus.value === Status.Edit ? editCharacterFile.value : editGlyph.value)
    _glyph.script = null
    _glyph.script_reference = _glyph.uuid
    const component: IGlyphComponent = {
      uuid: genUUID(),
      type: 'glyph',
      name: glyph.name + Date.now().toString().slice(9),
      lock: false,
      visible: true,
      value: _glyph,
      ox: selectedFile.value.width / 2 - 1000 / 2,
      oy: selectedFile.value.height / 2 - 1000 / 2,
      usedInCharacter: true,
    }
    executeScript(component.value)
    //component.value._o.getJoints().map((joint) => {
    //  joint.component = component
    //})

    if (editStatus.value === Status.Edit) {
      addComponentForCurrentCharacterFile(component)
    } else if (editStatus.value === Status.Glyph) {
      addComponentForCurrentGlyph(component)
    }
    //setGlyphComponentsDialogVisible(false)
    if (tool.value !== 'glyphDragger') {
      setTool('glyphDragger')
    }
  }
</script>

<template>
  <div :style="{
    zIndex: glyphComponentsDialogVisible2 ? 2000 : -999
  }" ref="dialogContainer">
    <el-dialog
      v-model="glyphComponentsDialogVisible"
      :title="tm('dialogs.glyphComponentDialog.title')"
      class="glyph-components-dialog"
      @close="handleClose"
      width="800px"
    >
      <div class="dialog-content">
        <div class="glyph-header">
          <div class="list-switch">
            <span
              class="stroke-glyph-list"
              @pointerdown="selectedTab = Status.StrokeGlyphList"
              :class="{
                selected: selectedTab === Status.StrokeGlyphList
              }"
            >{{ t('programming.stroke') }}</span>
            <span
              class="radical-glyph-list"
              @pointerdown="selectedTab = Status.RadicalGlyphList"
              :class="{
                selected: selectedTab === Status.RadicalGlyphList
              }"
            >{{ t('programming.radical') }}</span>
            <span
              class="comp-glyph-list"
              @pointerdown="selectedTab = Status.CompGlyphList"
              :class="{
                selected: selectedTab === Status.CompGlyphList
              }"
            >{{ t('programming.comp') }}</span>
            <span
              class="glyph-list"
              @pointerdown="selectedTab = Status.GlyphList"
              :class="{
                selected: selectedTab === Status.GlyphList
              }"
            >{{ t('programming.glyph_comp') }}</span>
          </div>
        </div>
        <el-scrollbar height="300px">
          <main class="list" id="glyph-components-wrapper" :style="{
            zIndex: selectedTab === Status.GlyphList ? 2999 : -1000
          }"></main>
          <main class="list" id="stroke-glyph-components-wrapper" :style="{
            zIndex: selectedTab === Status.StrokeGlyphList ? 2999 : -1000
          }"></main>
          <main class="list" id="radical-glyph-components-wrapper" :style="{
            zIndex: selectedTab === Status.RadicalGlyphList ? 2999 : -1000
          }"></main>
          <main class="list" id="comp-glyph-components-wrapper" :style="{
            zIndex: selectedTab === Status.CompGlyphList ? 2999 : -1000
          }"></main>
          <!-- <main class="list">
            <div
              class="glyph"
              v-for="glyph in glyphs"
              :key="glyph.uuid"
              @pointerdown="addGlyph(glyph)"
            >
              <span class="preview">
                <div class="empty-line-1"></div>
                <div class="empty-line-2"></div>
                <canvas
                  :id="`preview-canvas-${glyph.uuid}`"
                  class="preview-canvas" 
                  :width="100"
                  :height="100"
                ></canvas>
              </span>
              <span class="info">
                <span class="name">{{ glyph.name }}</span>
              </span>
            </div>
          </main> -->
        </el-scrollbar>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-switch
            v-model="multi_glyph_selection"
            :active-text="tm('dialogs.glyphComponentDialog.multiSelection')"
            :inactive-text="tm('dialogs.glyphComponentDialog.singleSelection')"
          />
          <div class="selected-glyphs-wrapper">
            <el-button v-for="glyph in selected_glyphs" @pointerdown="cancelSelect(glyph.uuid)">{{ glyph.name }}</el-button>
          </div>
          <el-button :disabled="!glyphComponentsDialogVisible2" @pointerdown="handleCancel">{{ t('dialogs.glyphComponentDialog.cancel') }}</el-button>
          <el-button :disabled="!glyphComponentsDialogVisible2" type="primary" @pointerdown="handleConfirm">{{ t('dialogs.glyphComponentDialog.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style>
  .glyph-components-dialog {
    .el-dialog__headerbtn {
      display: none;
    }
    .list {
      position: absolute;
    }
		.dialog-footer {
			width: 100%;
			display: block;
      position: relative;
      .selected-glyphs-wrapper {
        width: 480px;
        position: absolute;
        left: 130px;
        height: 32px;
        overflow-x: scroll;
        white-space: nowrap;
      }
			.el-switch {
				position: absolute;
				left: 5px;
				color: white;
			}
		}
		.el-switch__label {
			color: white !important;
		}
    .dialog-content {
      position: relative;
      height: 360px;
      .list {
				max-height: 300px;
        width: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fill,86px);
        gap: 10px;
        .glyph {
          width: 80px;
          height: 112px;
          display: flex;
          flex-direction: column;
          border: 3px solid var(--primary-0);
          box-sizing: content-box;
          cursor: pointer;
          &:hover {
            border: 3px solid var(--primary-1);
            .info {
              background-color: var(--primary-1);
              .unicode {
                background-color: var(--primary-1);
              }
            }
          }
					.icon-group {
						display: none;
					}
          .preview {
            display: inline-block;
            width: 80px;
            height: 80px;
            flex: 0 0 80px;
            background-color: white;
            .empty-line-1 {
              position: absolute;
              top: 0;
              left: -10px;
              right: 0;
              width: 100px;
              transform: translateY(40px) rotate(-45deg);
              border-bottom: 2px solid #bd6565;
            }
            .empty-line-2 {
              position: absolute;
              top: 0;
              left: -10px;
              right: 0;
              width: 100px;
              transform: translateY(40px) rotate(45deg);
              border-bottom: 2px solid #bd6565;
            }
            .preview-canvas {
              width: 100%;
              height: 100%;
            }
          }
          .info {
            display: flex;
            flex-direction: row;
            flex: 0 0 32px;
            line-height: 32px;
            background-color: var(--primary-0);
            color: var(--primary-5);
            justify-content: center;
            text-align: center;
            .name {
              font-size: 18px;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: 100%;
              overflow: hidden;
              font-weight: bold;
              line-height: 30px;
              text-align: center;
            }
          }
        }
      }
    }
  }

	.glyph-header {
		height: 60px;
		.list-switch {
			/* background-color: var(--light-2); */
			/* border-radius: 20px; */
			display: flex;
			flex-direction: row;
			cursor: pointer;
			line-height: 40px;
			gap: 5px;
			position: absolute;
			top: 5px;
			right: 5px;
			.glyph-list, .radical-glyph-list, .stroke-glyph-list, .comp-glyph-list {
				flex: 1;
				text-align: center;
				width: auto;
				height: 40px;
				padding: 0 20px;
				box-sizing: border-box;
				color: white;
				border: 1px solid var(--primary-1);
				line-height: 40px;
				background: var(--primary-0);
				&:hover {
					color: var(--primary-1);
				}
				&.selected {
					font-weight: bold;
					color: var(--primary-0);
					border: 1px solid var(--primary-1);
					line-height: 40px;
					background: var(--primary-5);
					/* &.character-list {
						border-radius: 20px 0 0 20px;
					}
					&.glyph-list {
						border-radius: 0 20px 20px 0;
					} */
				}
			}
		}
	}

	.glyph-components-dialog .el-dialog__body {
		padding-top: 0;
	}
</style>