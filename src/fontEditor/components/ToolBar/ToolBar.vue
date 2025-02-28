<script setup lang="ts">
  /**
   * 工具栏
   */
  /**
   * tool bar
   */

  import { tool, setTool } from '../../stores/global'
  import { glyphComponentsDialogVisible2, setGlyphComponentsDialogVisible } from '../../stores/dialogs'
  import { genPictureComponent } from '../../tools/picture'
  import { addComponentForCurrentCharacterFile, editCharacterFile, executeCharacterScript, selectedFile } from '../../stores/files'
  import { setEditStatus, Status, editStatus, prevStatus } from '../../stores/font'
  import { addComponentForCurrentGlyph, constants, editGlyph, executeScript } from '../../stores/glyph'
  import { emitter } from '../../Event/bus'
  import { ENV } from '../../stores/system'
  import { Grid } from '@element-plus/icons-vue'
  import { WebviewWindow } from "@tauri-apps/api/webviewWindow"
  import { emit, listen } from '@tauri-apps/api/event'
  import { onMounted, onUnmounted } from 'vue'
  import { OpType, saveState, StoreType } from '../../stores/edit'
  import { nativeImportFile } from '../../menus/handlers'
  import { ElMessageBox } from 'element-plus'

  // 切换工具
  // switch tool
  const switchTool = async (_tool: string) => {
    if (tool.value === 'grid' && _tool !== 'grid') {
			ElMessageBox.alert(
				'为方便用户进行组件编辑操作，离开布局编辑界面会恢复默认布局。如果您已经应用布局变换，预览及导出字体库会使用应用变换后的布局，但是在其他编辑操作时，界面仍使用默认布局。',
				'提示：您已经离开布局编辑界面', {
				confirmButtonText: '确定',
			})
		}
    if (_tool !== 'picture') {
      saveState('选择工具', [StoreType.Tools], OpType.Undo)
      setTool(_tool)
    }
    if (_tool === 'picture') {
      // 保存状态
      saveState('添加参考图', [
        editStatus.value === Status.Glyph ? StoreType.EditGlyph : StoreType.EditCharacter
      ],
        OpType.Undo,
      )
      if (ENV.value === 'tauri') {
        const options = await nativeImportFile(['jpg', 'png', 'jpeg'])
        const { name, uint8Array } = options
        if (!uint8Array) return
        let binary = ''
        uint8Array.forEach((byte) => {
          binary += String.fromCharCode(byte);
        })
        const base64str = btoa(binary)
        const type = name.split('.')[1] === 'png' ? 'imge/png' : 'image/jpeg'
        const dataUrl = `data:${type};base64,${base64str}`
        const component = await genPictureComponent(dataUrl, selectedFile.value.width, selectedFile.value.height)
        if (editStatus.value === Status.Edit) {
          addComponentForCurrentCharacterFile(component)
        } else if (editStatus.value === Status.Glyph) {
          addComponentForCurrentGlyph(component)
        }
      } else {
        const input = document.createElement('input')
        input.setAttribute('type', 'file')
        input.setAttribute('style', 'display: none')
        input.setAttribute('accept', 'image/*')
        input.addEventListener('change', async (e: Event) => {
          const el = e.currentTarget as HTMLInputElement
          const files = el.files as FileList
          for (let i = 0; i < files.length; i++) {
            const data = window.URL.createObjectURL(files[i])
            const component = await genPictureComponent(data, selectedFile.value.width, selectedFile.value.height)
            if (editStatus.value === Status.Edit) {
              addComponentForCurrentCharacterFile(component)
            } else if (editStatus.value === Status.Glyph) {
              addComponentForCurrentGlyph(component)
            }
          }
          document.body.removeChild(input)
        })
        document.body.appendChild(input)
        input.click()
      }
    }
  }

  // 跳转至字符列表
  // go to character list
  const toList = () => {
    //setEditStatus(Status.CharacterList)
    setEditStatus(prevStatus.value)
  }

  let glyph_window = null
  let char_window = null
  let hasShowWindow = false

  // const base = '/fontplayer_demo'
  const base = ''

  const showProgrammingWindow = async () => {
    if (hasShowWindow) return
    if (ENV.value === 'web') {
      if (editStatus.value === Status.Edit) {
        window.__constants = constants.value
        window.__script = editCharacterFile.value.script
        window.__is_web = ENV.value === 'web'
        window.addEventListener('message', onReceiveMessage)
        char_window = window.open(
          // `${location.origin}${base}/#/character-programming-editor`,
          `${location.origin}${location.pathname}#/character-programming-editor`,
          'character',
          `popup,width=${1280},height=${800},left=${(screen.width - 1280) / 2}`,
        )
      } else if (editStatus.value === Status.Glyph) {
        window.__constants = constants.value
        window.__parameters = editGlyph.value.parameters.parameters
        window.__script = editGlyph.value.script
        window.__is_web = ENV.value === 'web'
        window.addEventListener('message', onReceiveMessage)
        glyph_window = window.open(
          // `${location.origin}${base}/#/glyph-programming-editor`,
          `${location.origin}${location.pathname}#/glyph-programming-editor`,
          'custom-glyph',
          `popup,width=${1280},height=${800},left=${(screen.width - 1280) / 2}`,
        )
      }
    } else if (ENV.value === 'tauri') {
      if (editStatus.value === Status.Edit) {
        const windowOptions = {
          url: `${location.origin}${location.pathname}#/character-programming-editor`,
          width: 1280,
          height: 800,
          x: (screen.width - 1280) / 2,
          y: (screen.height - 800) / 2,
          //devtools: true,
        }
        const webview = new WebviewWindow('character-script', windowOptions)
        webview.once('tauri://created', async () => {
          console.log('webview created')
        })
        webview.once('tauri://error', function (e) {
          console.log('error creating webview', e)
        })
      } else if (editStatus.value === Status.Glyph) {
        const windowOptions = {
          url: `${location.origin}${location.pathname}#/glyph-programming-editor`,
          width: 1280,
          height: 800,
          x: (screen.width - 1280) / 2,
          y: (screen.height - 800) / 2,
          //devtools: true,
        }
        const webview = new WebviewWindow('glyph-script', windowOptions)
        webview.once('tauri://created', async () => {
          console.log('webview created')
        })
        webview.once('tauri://error', function (e) {
          console.log('error creating webview', e)
        })
      }
    }
  }

  let unlisten1 = null
  let unlisten2 = null
  let unlisten3 = null
  let unlisten4 = null
  let dataChanged = false

  onMounted(() => {
    if (ENV.value === 'tauri') {
      unlisten1 = listen('on-webview-mounted', async (e) => {
        if (editStatus.value === Status.Edit) {
          await emit('init-data', {
            __constants: constants.value,
            __script: editCharacterFile.value.script,
            __isWeb: ENV.value === 'web'
          })
        } else if (editStatus.value === Status.Glyph) {
          await emit('init-data', {
            __constants: constants.value,
            __parameters: editGlyph.value.parameters.parameters,
            __script: editGlyph.value.script,
            __isWeb: ENV.value === 'web'
          })
        }
      })
      unlisten2 = listen('sync-info', async (e) => {
        if (!dataChanged) {
          saveScriptState()
        }
        dataChanged = true
        const { __constants, __parameters, __script } = e.payload as any
        if (editStatus.value === Status.Glyph) {
          editGlyph.value.parameters.parameters = __parameters
          constants.value = __constants
          editGlyph.value.script = __script
        } else if (editStatus.value === Status.Edit) {
          constants.value = __constants
          editCharacterFile.value.script = __script
        }
      })
      unlisten3 = listen('execute-script', async (e) => {
        if (editStatus.value === Status.Glyph) {
          executeScript(editGlyph.value)
          emitter.emit('renderGlyphPreviewCanvasByUUID', editGlyph.value.uuid)
          emitter.emit('renderGlyph', true)
        } else if (editStatus.value === Status.Edit) {
          executeCharacterScript(editCharacterFile.value)
          emitter.emit('renderPreviewCanvasByUUID', editCharacterFile.value.uuid)
          emitter.emit('renderCharacter', true)
        }
      })
      unlisten4 = listen('on-webview-close', () => {
        onScriptWindowClose()
      })
    }
  })

  const onScriptWindowClose = () => {
    dataChanged = false
    hasShowWindow = false
  }

  const saveScriptState = () => {
    // 保存状态
		saveState('编辑脚本与变量', [
			editStatus.value === Status.Glyph ? StoreType.EditGlyph : StoreType.EditCharacter
		],
			OpType.Undo,
      {
        undoTip: '撤销编辑脚本与变量操作会将您上次在脚本编辑窗口的全部操作撤销，确认撤销？',
        redoTip: '重做编辑脚本与变量操作会将您上次在脚本编辑窗口的全部操作重做，确认重做？',
        newRecord: true,
      }
		)
  }

  onUnmounted(() => {
    unlisten1 && unlisten1()
    unlisten2 && unlisten2()
    unlisten3 && unlisten3()
    unlisten4 && unlisten4()
  })

  const onReceiveMessage = (e: MessageEvent) => {
    if (e.data === 'sync-info') {
      if (!dataChanged) {
        saveScriptState()
      }
      dataChanged = true
      if (editStatus.value === Status.Glyph) {
        editGlyph.value.parameters.parameters = JSON.parse(localStorage.getItem('parameters'))
        constants.value = JSON.parse(localStorage.getItem('constants'))
        editGlyph.value.script = localStorage.getItem('script')
      } else if (editStatus.value === Status.Edit) {
        constants.value = JSON.parse(localStorage.getItem('constants'))
        editCharacterFile.value.script = localStorage.getItem('script')
      }
    } else if (e.data === 'execute-script') {
      if (editStatus.value === Status.Glyph) {
        executeScript(editGlyph.value)
        emitter.emit('renderGlyphPreviewCanvasByUUID', editGlyph.value.uuid)
        emitter.emit('renderGlyph', true)
      } else if (editStatus.value === Status.Edit) {
        executeCharacterScript(editCharacterFile.value)
        emitter.emit('renderPreviewCanvasByUUID', editCharacterFile.value.uuid)
        emitter.emit('renderCharacter', true)
      }
    } else if (e.data === 'close-window') {
      onScriptWindowClose()
    }
  }
</script>

<template>
  <div class="tool-bar">
    <el-row class="tool-bar-row">
      <el-icon
        :class="{
          'tool-icon': true,
          'selected': tool === 'select',
        }"
        @click="switchTool('select')"
      >
        <font-awesome-icon icon="fa-solid fa-arrow-pointer" />
      </el-icon>
      <el-icon
        :class="{
          'tool-icon': true,
          'selected': tool === 'pen',
        }"
        @click="switchTool('pen')"
      >
        <font-awesome-icon icon="fa-solid fa-pen-nib" />
      </el-icon>
      <el-icon
        :class="{
          'tool-icon': true,
          'selected': tool === 'ellipse',
        }"
        @click="switchTool('ellipse')"
      >
        <font-awesome-icon icon="fa-regular fa-circle" />
      </el-icon>
      <el-icon
        :class="{
          'tool-icon': true,
          'selected': tool === 'rectangle',
        }"
        @click="switchTool('rectangle')"
      >
        <font-awesome-icon icon="fa-regular fa-square" />
      </el-icon>
      <el-icon
        :class="{
          'tool-icon': true,
          'selected': tool === 'polygon',
        }"
        @click="switchTool('polygon')"
      >
        <font-awesome-icon icon="fa-solid fa-draw-polygon" />
      </el-icon>
      <el-icon
        :class="{
          'tool-icon': true,
          'selected': tool === 'picture',
        }"
        @click="switchTool('picture')"
        v-show="editStatus === Status.Edit"
      >
        <font-awesome-icon icon="fa-solid fa-image" />
      </el-icon>
      <el-icon
        :class="{
          'tool-icon': true,
          'selected': tool === 'glyph',
        }"
        @click="glyphComponentsDialogVisible2 = true"
        v-show="editStatus === Status.Edit || editStatus === Status.Glyph"
      >
        <font-awesome-icon :icon="['fas', 'font']" />
      </el-icon>
      <el-icon
        class="code-icon"
        @click="showProgrammingWindow"
        v-show="editStatus === Status.Edit || editStatus === Status.Glyph"
      >
        <font-awesome-icon :icon="['fas', 'terminal']" />
      </el-icon>
      <el-icon
        :class="{
          'tool-icon': true,
          'selected': tool === 'params',
        }"
        @click="switchTool('params')"
        v-show="editStatus === Status.Glyph"
      >
        <font-awesome-icon :icon="['fas', 'sliders']" />
      </el-icon>
      <el-icon
        v-show="editStatus === Status.Edit"
        :class="{
          'tool-icon': true,
          'selected': tool === 'grid',
        }"
        @click="switchTool('grid')"
      >
        <font-awesome-icon :icon="['fas', 'table-cells']" />
      </el-icon>
      <el-icon
        v-show="editStatus === Status.Edit"
        :class="{
          'tool-icon': true,
          'selected': tool === 'metrics',
        }"
        @click="switchTool('metrics')"
      >
        <font-awesome-icon :icon="['fas', 'text-width']" />
      </el-icon>
      <div class="to-list" @click="toList">
        <el-icon class="to-list-icon"><Grid /></el-icon>
        <span class="to-list-label">字符列表</span>
      </div>
    </el-row>
  </div>
</template>

<style scoped>
  .tool-bar-row {
    background-color: white;
    border-bottom: 1px solid #dcdfe6;
    .to-list {
      margin: 5px;
      margin-left: auto;
      line-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 100px;
      cursor: pointer;
      background-color: var(--primary-5);
      &:hover {
        background-color: var(--primary-4);
      }
      .el-icon {
        flex: 0 0 32px;
      }
    }
    .tool-icon {
      width: 40px;
      height: 40px;
      cursor: pointer;
      margin: 5px 0 5px 5px;
      &:hover {
        background-color:var(--primary-5);
      }
      &.selected {
        background-color:var(--primary-5);
      }
    }
    .code-icon {
      width: 40px;
      height: 40px;
      cursor: pointer;
      margin: 5px 0 5px 5px;
      background-color: var(--dark-2);
      color: var(--light-0);
      border-radius: 5px;
    }
  }
</style>