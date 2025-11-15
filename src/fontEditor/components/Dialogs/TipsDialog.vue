<script setup lang="ts">
  /**
	 * 提示窗口
	 */
	/**
	 * dialog for tips
	 */

  import { useI18n } from 'vue-i18n'
  import { tips } from '../../stores/global'
  import { setTipsDialogVisible, tipsDialogVisible, tipsDialogConfirmCallback } from '../../stores/dialogs'
  const { tm, t } = useI18n()

  const handleCancel = () => {
    tips.value = ''
    setTipsDialogVisible(false)
  }

  const handleClick = () => {
    if (tipsDialogConfirmCallback.value) {
      tipsDialogConfirmCallback.value()
    }
    tips.value = ''
    setTipsDialogVisible(false)
  }
</script>

<template>
  <el-dialog
    v-model="tipsDialogVisible"
    :title="tm('dialogs.tipsDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      {{ tips }}
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @pointerdown="handleCancel">{{ t('dialogs.tipsDialog.cancel') }}</el-button>
        <el-button type="primary" @pointerdown="handleClick">
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