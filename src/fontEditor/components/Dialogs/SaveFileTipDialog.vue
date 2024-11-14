<script setup lang="ts">
  /**
	 * 关闭文件提示窗口
	 */
	/**
	 * dialog for close file tips
	 */

  import { useI18n } from 'vue-i18n'
  import { tips } from '../../stores/global'
  import { setSaveFileTipDialogVisible, saveFileTipDialogVisible } from '../../stores/dialogs'
  import { saveFile } from '../../menus/handlers'
  const { tm, t } = useI18n()

  const handleCancel = () => {
    setSaveFileTipDialogVisible(false)
  }

  const handleClick = () => {
    saveFile()
    setSaveFileTipDialogVisible(false)
  }
</script>

<template>
  <el-dialog
    v-model="saveFileTipDialogVisible"
    :title="tm('dialogs.tipsDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      {{ t('dialogs.tipsDialog.tip2') }}
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">{{ t('dialogs.tipsDialog.cancel') }}</el-button>
        <el-button type="primary" @click="handleClick">
          {{ t('dialogs.tipsDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
  .form-wrapper {
    color: var(--light-2) !important
  }
</style>