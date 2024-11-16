<script setup lang="ts">
	/**
	 * 欢迎页面
	 */
	/**
	 * welcome page
	 */

	import CreateFileDialog from '../../fontEditor/components/Dialogs/CreateFileDialog.vue'
	import languageSettingsDialog from '../../fontEditor/components/Dialogs/LanguageSettingsDialog.vue'
	import { createFile, openFile, syncData, importTemplate1, importFont } from '../../fontEditor/menus/handlers'
	import { loading, loaded, total } from '../../fontEditor/stores/global'
	import { initGlyphEnvironment } from '../../fontEditor/stores/glyph'
	import { onMounted } from 'vue'
	import { DocumentAdd, FolderOpened, Files, Switch } from '@element-plus/icons-vue'

	import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

	onMounted(async () => {
		await initGlyphEnvironment()
	})

	const svg = `
    <path class="path" d="" style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
  `
</script>

<template>
	<div
		class="welcome"
		v-loading="loading"
		:element-loading-text="`加载中，请稍候……`"
		element-loading-background="rgba(122, 122, 122, 0.8)"
	>
		<!--<div v-show="loading" class="loading-text">
			<el-progress :text-inside="true" :stroke-width="20" :percentage="Math.round(loaded / total * 100)" />
			<div>{{ `加载中，请稍候……已加载${Math.round(loaded / total * 100)}%` }}</div>
		</div>-->
		<div class="items-wrapper">
			<div class="item new-project-item" @click="createFile">
				<div class="item-icon"><el-icon><DocumentAdd /></el-icon></div>
				<div class="item-name">{{ t('welcome.new.name') }}</div>
				<div class="description">{{ t('welcome.new.description') }}</div>
			</div>
			<div class="item open-project-item" @click="openFile">
				<div class="item-icon"><el-icon><FolderOpened /></el-icon></div>
				<div class="item-name">{{ t('welcome.open.name') }}</div>
				<div class="description">{{ t('welcome.open.description') }}</div>
			</div>
			<div class="item import-font-item" @click="importFont">
				<div class="item-icon"><el-icon><Files /></el-icon></div>
				<div class="item-name">{{ t('welcome.import.name') }}</div>
				<div class="description">{{ t('welcome.import.description') }}</div>
			</div>
			<div class="item template-item" @click="importTemplate1">
				<div class="item-icon"><el-icon><Switch /></el-icon></div>
				<div class="item-name">{{ t('welcome.template.name') }}</div>
				<div class="description">{{ t('welcome.template.description') }}</div>
			</div>
		</div>
		<create-file-dialog></create-file-dialog>
		<language-settings-dialog></language-settings-dialog>
	</div>
</template>

<style scoped>
	.welcome {
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
		width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
		background-color: var(--dark-0);
		.items-wrapper {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 30px;
			width: 360px;
			height: 360px;
			.item {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				border: 1px solid var(--light-5);
				cursor: pointer;
				background-color: var(--primary-0);
				&:hover {
					background-color: var(--primary-1);
					.item-icon {
						color: var(--light-0);
					}
					.item-name {
						color: var(--light-0);
					}
					.description {
						color: var(--light-2);
					}
				}
				.item-icon {
					flex: 0 0 60px;
					font-size: 32px;
					color: var(--light-2);
				}
				.item-name {
					font-weight: bold;
   				font-size: 18px;
					 color: var(--light-2);
				}
				.description {
					font-size: 10px;
					padding: 8px;
					color: var(--light-3);
				}
			}
		}
	}
</style>