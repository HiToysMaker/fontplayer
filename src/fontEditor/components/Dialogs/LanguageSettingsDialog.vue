<script setup lang="ts">
  /**
	 * 添加web图标窗口
	 */
	/**
	 * dialog for adding character(icon) file
	 */

  import { languageSettingsDialogVisible, setLanguageSettingsDialogVisible } from '../../stores/dialogs'
  import { ENV } from '../../stores/system'
	import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { tm, t, locale } = useI18n()

  const language = ref(locale.value)

  const handleCancel = () => {
    setLanguageSettingsDialogVisible(false)
  }

  const handleClick = () => {
		locale.value = language.value
    setLanguageSettingsDialogVisible(false)
  }

  const languageOptions = [
    {
      value: 'cn',
      label: '中文',
    },
    {
      value: 'en',
      label: '英语',
    },
  ]
</script>

<template>
  <el-dialog
    v-model="languageSettingsDialogVisible"
    :title="tm('dialogs.languageSettingsDialog.title')"
    width="320px"
  >
    <div class="form-wrapper">
      <el-form label-width="80px">
        <el-form-item :label="tm('dialogs.languageSettingsDialog.label')">
          <el-select
              v-model="language"
              class="edit-filter-select"
              :placeholder="tm('dialogs.languageSettingsDialog.label')"
          >
              <el-option
                  v-for="item in languageOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">{{ t('dialogs.languageSettingsDialog.cancel') }}</el-button>
        <el-button type="primary" @click="handleClick">
          {{ t('dialogs.languageSettingsDialog.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>