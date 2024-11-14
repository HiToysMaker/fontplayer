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
  import { constants, editGlyph, executeScript } from '../../stores/glyph'
  import { emitter } from '../../Event/bus'
  import { ENV } from '../../stores/system'

  // 切换工具
  // switch tool
  const switchTool = (tool: string) => {
    setTool(tool)
    if (tool === 'picture') {
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.setAttribute('style', 'display: none')
      input.addEventListener('change', async (e: Event) => {
        const el = e.currentTarget as HTMLInputElement
        const files = el.files as FileList
        for (let i = 0; i < files.length; i++) {
          const data = window.URL.createObjectURL(files[i])
          const component = await genPictureComponent(data, selectedFile.value.width, selectedFile.value.height)
          addComponentForCurrentCharacterFile(component)
        }
        document.body.removeChild(input)
      })
      document.body.appendChild(input)
      input.click()
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

  const showProgrammingWindow = () => {
    if (editStatus.value === Status.Edit) {
      window.__constants = constants.value
      window.__script = editCharacterFile.value.script
      window.__is_web = ENV.value === 'web'
      window.addEventListener('message', onReceiveMessage)
      char_window = window.open(
        `${location.origin}/character-programming-editor`,
        'character',
        `popup,width=${screen.width * 0.8},height=${screen.width * 0.8 * 0.6},left=${screen.width * 0.1}`,
      )
    } else if (editStatus.value === Status.Glyph) {
      window.__constants = constants.value
      window.__parameters = editGlyph.value.parameters.parameters
      window.__script = editGlyph.value.script
      window.__is_web = ENV.value === 'web'
      window.addEventListener('message', onReceiveMessage)
      glyph_window = window.open(
        `${location.origin}/glyph-programming-editor`,
        'custom-glyph',
        `popup,width=${screen.width * 0.8},height=${screen.width * 0.8 * 0.6},left=${screen.width * 0.1}`,
      )
    }
  }

  const onReceiveMessage = (e: MessageEvent) => {
    if (e.data === 'sync-info') {
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
    } else if (e.data === 'copy' && ENV.value === 'electron') {
      const text = localStorage.getItem('clipboard')
      // 复制到剪贴板
			window.electronAPI.copyToClipboard(text)
    } else if (e.data === 'paste' && ENV.value === 'electron') {
      window.electronAPI.pasteFromClipboard().then((text) => {
        localStorage.setItem('clipboard', text)
        if (editStatus.value === Status.Edit) {
          char_window && char_window.postMessage('paste-ready', location.origin)
        } else if (editStatus.value === Status.Glyph) {
          glyph_window && glyph_window.postMessage('paste-ready', location.origin)
        }
      });
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
      <!--<el-icon
        :class="{
          'tool-icon': true,
          'selected': tool === 'grid',
        }"
        @click="switchTool('grid')"
      >
        <font-awesome-icon :icon="['fas', 'table-cells']" />
      </el-icon>-->
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