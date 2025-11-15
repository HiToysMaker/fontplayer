<script setup lang="ts">
  /**
   * 字体编辑器
   */
  /**
   * font editor
   */

  import TopBar from '../../fontEditor/components/TopBar/TopBar.vue'
  import SideBar from '../../fontEditor/components/SideBar/SideBar.vue'
  import ToolBar from '../../fontEditor/components/ToolBar/ToolBar.vue'
  import LeftPanel from '../../fontEditor/components/LeftPanel/LeftPanel.vue'
  import RightPanel from '../../fontEditor/components/RightPanel/RightPanel.vue'
  import FilesBar from '../../fontEditor/components/FilesBar/FilesBar.vue'
  import BottomBar from '../../fontEditor/components/BottomBar/BottomBar.vue'
  import GlyphBottomBar from '../../fontEditor/components/BottomBar/GlyphBottomBar.vue'
  import FontPanel from '../../fontEditor/components/FontMainPanel/FontMainPanel.vue'
  import CreateFileDialog from '../../fontEditor/components/Dialogs/CreateFileDialog.vue'
  import addTextDialog from '../../fontEditor/components/Dialogs/AddTextDialog.vue'
  import editGlyphDialog from '../../fontEditor/components/Dialogs/editGlyphDialog.vue'
  import copyGlyphDialog from '../../fontEditor/components/Dialogs/copyGlyphDialog.vue'
  import editCharacterDialog from '../../fontEditor/components/Dialogs/editCharacterDialog.vue'
  import copyCharacterDialog from '../../fontEditor/components/Dialogs/copyCharacterDialog.vue' 
  import addGlyphDialog from '../../fontEditor/components/Dialogs/AddGlyphDialog.vue'
  import addIconDialog from '../../fontEditor/components/Dialogs/AddIconDialog.vue'
  import glyphComponentsDialog from '../../fontEditor/components/Dialogs/GlyphComponentsDialog.vue'
  import fontSettingsDialog from '../../fontEditor/components/Dialogs/FontSettingsDialog.vue'
  import fontSettings2Dialog from '../../fontEditor/components/Dialogs/fontSettings/FontSettingsDialog.vue'
  import languageSettingsDialog from '../../fontEditor/components/Dialogs/LanguageSettingsDialog.vue'
  import preferenceSettingsDialog from '../../fontEditor/components/Dialogs/PreferenceSettingsDialog.vue'
  import setAsGlobalParamDialog from '../../fontEditor/components/Dialogs/SetAsGlobalParamDialog.vue'
  import selectGlobalParamDialog from '../../fontEditor/components/Dialogs/SelectGlobalParamDialog.vue'
  import tipsDialog from '../../fontEditor/components/Dialogs/TipsDialog.vue'
  import closeFileTipDialog from '../../fontEditor/components/Dialogs/CloseFileTipDialog.vue'
  import saveFileTipDialog from '../../fontEditor/components/Dialogs/SaveFileTipDialog.vue'
  import saveDialog from '../../fontEditor/components/Dialogs/SaveDialog.vue'
  import saveAsDialog from '../../fontEditor/components/Dialogs/SaveAsDialog.vue'
  import exportFileDialog from '../../fontEditor/components/Dialogs/ExportFileDialog.vue'
  import exportFontDialog from '../../fontEditor/components/Dialogs/ExportFontDialog.vue'
  import exportFontTauriDialog from '../components/Dialogs/ExportFontDialog_tauri.vue'
  import exportVarFontDialog from '../components/Dialogs/ExportVarFontDialog.vue'
  import exportVarFontTauriDialog from '../components/Dialogs/ExportVarFontDialog_tauri.vue'
  import exportColorFontDialog from '../components/Dialogs/ExportColorFontDialog.vue'
  import exportColorFontTauriDialog from '../components/Dialogs/ExportColorFontDialog_tauri.vue'
  import AdvancedEditPanel from './AdvancedEditPanel/AdvancedEditPanel.vue'
  import { editStatus, Status } from '../../fontEditor/stores/font'
  import { ENV } from '../../fontEditor/stores/system'
  import { loading, loaded, total, loadingMsg } from '../../fontEditor/stores/global'
  import { ref, onMounted, onUnmounted } from 'vue'
  import { onBeforeRouteLeave } from 'vue-router'
  import { initGlyphEnvironment } from '../stores/glyph'
  import {
    editing as penEditing,
  } from '../stores/pen'
  import {
    editing as polygonEditing,
  } from '../stores/polygon'
  import { editing as ellipseEditing } from '../stores/ellipse'
  import { editing as rectangleEditing } from '../stores/rectangle'
  import { enableMultiSelect } from '../stores/files'
  import { useI18n } from 'vue-i18n'
  const { tm, t, locale } = useI18n()

  const svg = `
    <path class="path" d="" style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
  `

  onBeforeRouteLeave((to, from, next) => {
    let msg = '你确定要离开吗？未保存的更改将丢失。'
    if (locale.value === 'zh') {
      msg = '你确定要离开吗？未保存的更改将丢失。'
    } else if (locale.value === 'en') {
      msg = 'Exit without saving? Your changes will be lost.'
    }
    const answer = window.confirm(msg)
    if (answer) {
      next(); // 允许离开
    } else {
      next(false); // 阻止离开
    }
  })

  const handleBeforeUnload = (e) => {
    if (ENV.value === 'web') {
      // 取消默认事件
      e.preventDefault(); // 这行代码在某些情况下是冗余的
      let msg = '你确定要离开吗？未保存的更改将丢失。'
      if (locale.value === 'zh') {
        msg = '你确定要离开吗？未保存的更改将丢失。'
      } else if (locale.value === 'en') {
        msg = 'Exit without saving? Your changes will be lost.'
      }
      // 设置 returnValue 属性，提示用户
      e.returnValue = msg // 现代浏览器会使用默认提示
      return ''; // 在某些老旧浏览器中可能需要返回值
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Shift') {
			if (penEditing.value || polygonEditing.value || ellipseEditing.value || rectangleEditing.value) {
				return
			}
			e.preventDefault()
			enableMultiSelect.value = true
		}
	}
	const onKeyUp = (e: KeyboardEvent) => {
		if (e.key === 'Shift') {
			if (penEditing.value || polygonEditing.value || ellipseEditing.value || rectangleEditing.value) {
				return
			}
			e.preventDefault()
			enableMultiSelect.value = false
		}
	}

  onMounted(async () => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    await initGlyphEnvironment()
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
  })
</script>

<template>
  <div class="root-wrapper">
    <save-file-tip-dialog></save-file-tip-dialog>
    <close-file-tip-dialog></close-file-tip-dialog>
    <tips-dialog></tips-dialog>
    <set-as-global-param-dialog></set-as-global-param-dialog>
    <select-global-param-dialog></select-global-param-dialog>
    <create-file-dialog></create-file-dialog>
    <add-text-dialog></add-text-dialog>
    <add-icon-dialog></add-icon-dialog>
    <add-glyph-dialog></add-glyph-dialog>
    <edit-glyph-dialog></edit-glyph-dialog>
    <copy-glyph-dialog></copy-glyph-dialog>
    <edit-character-dialog></edit-character-dialog>
    <copy-character-dialog></copy-character-dialog>
    <glyph-components-dialog></glyph-components-dialog>
    <font-settings-dialog></font-settings-dialog>
    <font-settings-2-dialog></font-settings-2-dialog>
    <preference-settings-dialog></preference-settings-dialog>
    <language-settings-dialog></language-settings-dialog>
    <save-dialog></save-dialog>
    <save-as-dialog></save-as-dialog>
    <export-file-dialog></export-file-dialog>
    <export-font-dialog></export-font-dialog>
    <export-font-tauri-dialog></export-font-tauri-dialog>
    <export-var-font-dialog></export-var-font-dialog>
    <export-var-font-tauri-dialog></export-var-font-tauri-dialog>
    <export-color-font-dialog></export-color-font-dialog>
    <export-color-font-tauri-dialog></export-color-font-tauri-dialog>
    <div class="outer-wrapper"
      v-loading="loading"
      :element-loading-text="``"
      :element-loading-spinner="svg"
		  element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    >
      <div class="el-loading-spinner" v-show="loading && total === 0">
        <svg class="circular" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none"></circle></svg>
        <div>{{loadingMsg || t('panels.paramsPanel.loadingMsg') }}</div>
      </div>
      <div v-show="loading && total != 0" class="loading-text">
        <el-progress :text-inside="true" :stroke-width="20" :percentage="Math.round(loaded / total * 100) >= 100 ? 100 : Math.round(loaded / total * 100)" />
        <div>{{ loadingMsg? loadingMsg + `进度：${Math.round(loaded / total * 100)}%` : t('panels.paramsPanel.loadedMsg', { percent: Math.round(loaded / total * 100)}) }}</div>
      </div>
      <div class="side-bar-wrap" :style="{
        flex: ENV === 'web' ? '0 0 80px': '0 0 80px',
        borderRight: ENV === 'web' ? '1px solid var(--light-5)': '1px solid var(--light-5)'
      }">
        <side-bar></side-bar>
      </div>
      <div class="main-panel">
        <header class="header-wrapper" :style="{
          flex: ENV === 'web' ? ((editStatus === Status.CharacterList || editStatus === Status.GlyphList || editStatus === Status.StrokeGlyphList || editStatus === Status.RadicalGlyphList || editStatus === Status.CompGlyphList || editStatus === Status.Pic || editStatus === Status.AdvancedEdit) ? '0 0 0px' : '0 0 50px') : ((editStatus === Status.CharacterList || editStatus === Status.GlyphList|| editStatus === Status.StrokeGlyphList || editStatus === Status.RadicalGlyphList || editStatus === Status.CompGlyphList || editStatus === Status.Pic || editStatus === Status.AdvancedEdit) ? '0 0 0px' : '0 0 50px')
        }">
          <!--<top-bar></top-bar>-->
          <tool-bar v-show="editStatus === Status.Edit || editStatus === Status.Glyph"></tool-bar>
        </header>
        <main class="advanced-edit-panel-wrapper" v-if="editStatus === Status.AdvancedEdit">
          <advanced-edit-panel></advanced-edit-panel>
        </main>
        <main class="inner-wrapper" v-show="editStatus !== Status.AdvancedEdit">
          <aside class="left-panel-wrapper" v-show="editStatus !== Status.CharacterList && editStatus !== Status.GlyphList && editStatus !== Status.StrokeGlyphList && editStatus !== Status.RadicalGlyphList && editStatus !== Status.CompGlyphList && editStatus !== Status.AdvancedEdit">
            <left-panel></left-panel>
          </aside>
          <main class="main-wrapper">
            <header class="files-bar-wrapper" v-show="editStatus !== Status.Pic && editStatus !== Status.AdvancedEdit">
              <files-bar></files-bar>
            </header>
            <main class="canvas-panel-wrapper" v-show="editStatus !== Status.AdvancedEdit" :style="{
              height: (editStatus === Status.Edit || editStatus === Status.Pic) ? 'calc(100% - 72px)' : 'calc(100% - 36px)'
            }">
              <font-panel></font-panel>
            </main>
            <footer class="zoom-bar-wrapper" v-show="editStatus !== Status.CharacterList && editStatus !== Status.GlyphList && editStatus !== Status.StrokeGlyphList && editStatus !== Status.RadicalGlyphList && editStatus !== Status.CompGlyphList && editStatus !== Status.AdvancedEdit">
              <bottom-bar v-if="editStatus === Status.Edit"></bottom-bar>
              <glyph-bottom-bar v-else-if="editStatus === Status.Glyph"></glyph-bottom-bar>
            </footer>
          </main>
          <aside class="right-panel-wrapper" v-show="editStatus !== Status.CharacterList && editStatus !== Status.GlyphList && editStatus !== Status.StrokeGlyphList && editStatus !== Status.RadicalGlyphList && editStatus !== Status.CompGlyphList && editStatus !== Status.AdvancedEdit">
            <right-panel></right-panel>
          </aside>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .el-loading-spinner {
    top: 50%;
    margin-top: calc((0px - var(--el-loading-spinner-size)) / 2);
    width: 100%;
    text-align: center;
    position: absolute;
    z-index: 999999999;
    color: #409EFF;
    .circular .path {
      stroke: #409EFF !important;  /* 强制将颜色设置为红色 */
    }
  }
  .outer-wrapper, .root-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .outer-wrapper {
    display: flex;
    /*flex-direction: column;*/
    flex-direction: row;
  }
  .side-bar-wrap {
    flex: 0 0 36px;
    background-color: var(--dark-0);
    border-right: 1px solid var(--primary-2);
  }
  .main-panel {
    flex: auto;
    display: flex;
    flex-direction: column;
  }
  .header-wrapper {
    flex: 0 0 110px;
    /* border-bottom: 1px solid #dcdfe6; */
    box-sizing: border-box;
  }
  .inner-wrapper {
    flex: 1;
    display: flex;
    flex-direction: row;
    height: 0;
  }
  .left-panel-wrapper {
    height: 100%;
    flex: 0 0 200px;
  }
  .right-panel-wrapper {
    height: 100%;
    flex: 0 0 300px;
  }
  .main-wrapper {
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .files-bar-wrapper {
    flex: 0 0 36px;
    background: white;
  }
  .canvas-panel-wrapper {
    flex: 1;
  }
  .zoom-bar-wrapper {
    flex: 0 0 36px;
    border-top: 1px solid var(--dark-4);
    background-color: white;
  }
  .loading-text {
    z-index: 9999999999;
    position: fixed;
    width: 100%;
    display: flex;
    flex-direction: column;
    height: 100%;
    text-align: center;
    justify-content: center;
    align-items: center;
    color: #409EFF;
  }
  .el-progress {
    width: 300px;
  }
  .advanced-edit-panel-wrapper {
    height: 100%;
    width: 100%;
  }
</style>