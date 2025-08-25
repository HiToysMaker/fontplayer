<script setup lang="ts">
  /**
   * 字体设置窗口
   */
  /**
   * dialog for font setting
   */

  import { fontSettings2DialogVisible, setFontSettings2DialogVisible } from '../../../stores/dialogs'
  import { onMounted, onUnmounted, ref, type Ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import HeadPanel from './head.vue'
  import HheaPanel from './hhea.vue'
  import NamePanel from './name.vue'
  import PostPanel from './post.vue'
  import Os2Panel from './os_2.vue'
  import { head_data, hhea_data, os2_data, name_data, post_data } from '../../../stores/settings'
  import { selectedFile } from '@/fontEditor/stores/files'
  const { tm, t } = useI18n()

  onMounted(() => {
  })

  const close = () => {
    setFontSettings2DialogVisible(false)
  }

  const updateFont = () => {
    if (selectedFile.value.fontSettings) {
      selectedFile.value.fontSettings.tables = {
        head: head_data.value,
        hhea: hhea_data.value,
        os2: os2_data.value,
        name: name_data.value,
        post: post_data.value,
      }
    }
    setFontSettings2DialogVisible(false)
  }
</script>

<template>
  <el-dialog
    :model-value="fontSettings2DialogVisible"
    class="font-settings-dialog"
    :title="tm('dialogs.fontSettingsDialog.title')"
    width="800px"
    :style="{
      height: '640px',
    }"
    :before-close="close"
  >
    <el-tabs tab-position="left" style="height: 460px" class="table-tabs">
      <el-tab-pane label="head"><head-panel></head-panel></el-tab-pane>
      <el-tab-pane label="hhea"><hhea-panel></hhea-panel></el-tab-pane>
      <el-tab-pane label="name"><name-panel></name-panel></el-tab-pane>
      <el-tab-pane label="os_2"><os2-panel></os2-panel></el-tab-pane>
      <el-tab-pane label="post"><post-panel></post-panel></el-tab-pane>
    </el-tabs>
    <template #footer>
      <span class="dialog-footer">
        <el-button @pointerdown="setFontSettings2DialogVisible(false)">{{ t('dialogs.fontSettingsDialog.cancel') }}</el-button>
        <el-button
          type="primary"
          @pointerdown="() => updateFont()"
        >
          {{ t('dialogs.fontSettingsDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
  .font-settings-dialog {
    .el-input {
      width: 180px;
    }
    .el-input-number {
      width: 180px;
    }
  }
  .font-settings-dialog {
    .el-tabs__item {
      color: var(--light-3);
    }
    .el-tabs__item:hover {
      color: var(--primary-3);
    }
    .el-tabs__active-bar {
      background-color: var(--primary-3);
    }
    .el-tabs__item.is-active {
      color: var(--primary-3);
    }
  }
</style>