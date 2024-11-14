<script setup lang="ts">
  /**
	 * 提示窗口
	 */
	/**
	 * dialog for tips
	 */

  import { useI18n } from 'vue-i18n'
  import { tips } from '../../stores/global'
  import { setTipsDialogVisible, tipsDialogVisible } from '../../stores/dialogs'
  const { tm, t } = useI18n()

  const handleCancel = () => {
    tips.value = ''
    setTipsDialogVisible(false)
  }

  const handleClick = () => {
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