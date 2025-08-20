<script setup lang="ts">
	/**
	 * 欢迎页面
	 */
	/**
	 * welcome page
	 */

	import CreateFileDialog from '../../fontEditor/components/Dialogs/CreateFileDialog.vue'
	import languageSettingsDialog from '../../fontEditor/components/Dialogs/LanguageSettingsDialog.vue'
	import { createFile, openFile, syncData, importTemplate1, importFont, openPlayground } from '../../fontEditor/menus/handlers'
	import { loading, loaded, total, loadingMsg } from '../../fontEditor/stores/global'
	import { initGlyphEnvironment } from '../../fontEditor/stores/glyph'
	import { onMounted } from 'vue'
	import { DocumentAdd, FolderOpened, Files, Switch } from '@element-plus/icons-vue'

	import { useI18n } from 'vue-i18n'
  const { t, locale } = useI18n()

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
        <el-progress :text-inside="true" :stroke-width="20" :percentage="Math.round(loaded / total * 100)" />
        <div>{{ loadingMsg? loadingMsg + `进度：${Math.round(loaded / total * 100)}%` : t('panels.paramsPanel.loadedMsg', { percent: Math.round(loaded / total * 100)}) }}</div>
      </div>
		<div class="main-panel">
			<div class="items-wrapper">
				<div class="item new-project-item" @pointerdown="createFile">
					<div class="item-icon"><el-icon><DocumentAdd /></el-icon></div>
					<div class="item-name">{{ t('welcome.new.name') }}</div>
					<div class="description">{{ t('welcome.new.description') }}</div>
				</div>
				<div class="item open-project-item" @pointerdown="openFile">
					<div class="item-icon"><el-icon><FolderOpened /></el-icon></div>
					<div class="item-name">{{ t('welcome.open.name') }}</div>
					<div class="description">{{ t('welcome.open.description') }}</div>
				</div>
				<div class="item import-font-item" @pointerdown="importFont">
					<div class="item-icon"><el-icon><Files /></el-icon></div>
					<div class="item-name">{{ t('welcome.import.name') }}</div>
					<div class="description">{{ t('welcome.import.description') }}</div>
				</div>
				<div class="item template-item" @pointerdown="importTemplate1">
					<div class="item-icon"><el-icon><Switch /></el-icon></div>
					<div class="item-name">{{ t('welcome.template.name') }}</div>
					<div class="description">{{ t('welcome.template.description') }}</div>
				</div>
			</div>
			<div class="playground-btn" @click="openPlayground">
				<div class="item-icon playground-icon">
					<el-icon><font-awesome-icon icon="fa-solid fa-gamepad" /></el-icon>
				</div>
				<div class="playground-main">
					<div class="playground-text">{{ t('welcome.playground.title') }}</div>
					<div class="playground-description">{{ t('welcome.playground.description') }}</div>
				</div>
			</div>
		</div>
		<div class="language-settings">
			<div class="language-choice-item" :class="{
				selected: locale === 'zh'
			}" @click="locale = 'zh'">中文</div>
			<div class="language-choice-item" :class="{
				selected: locale === 'en'
			}" @click="locale = 'en'">English</div>
		</div>
		<create-file-dialog></create-file-dialog>
		<language-settings-dialog></language-settings-dialog>
	</div>
</template>

<style scoped>
	.welcome {
		.language-settings {
			position: fixed;
			top: 20px;
			right: 20px;
			width: 160px;
			height: 32px;
			color: var(--light-0);
			font-weight: bold;
			display: flex;
			flex-direction: row;
			gap: 10px;
			.language-choice-item {
				flex: auto;
				text-align: center;
				line-height: 32px;
				cursor: pointer;
				&.selected {
					background-color: var(--primary-0);
					border-radius: 20px;
				}
				&:not(.selected):hover {
					background-color: var(--dark-3);
					border-radius: 20px;
				}
			}
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
		width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
		background-color: var(--dark-0);
		.main-panel {
			display: flex;
			flex-direction: column;
			.playground-btn {
				width: 360px;
				background-color: var(--primary-0);
				margin-top: 50px;
				border: 1px solid var(--light-5);
				color: var(--light-0);
				border-radius: 50px;
				display: flex;
				flex-direction: row;
				height: 68px;
				&:hover {
					background-color: var(--primary-1);
					cursor: pointer;
				}
				.playground-icon {
					display: flex;
					flex-direction: row;
					justify-content: center;
					align-items: center;
					flex: 0 0 80px;
					font-size: 48px;
				}
				.playground-main {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					flex: 0 0 250px;
				}
				.playground-text {
					font-size: 18px;
					text-align: center;
					font-weight: bold;
				}
				.playground-description {
					color: var(--light-2);
					font-size: 14px;
					text-align: center;
				}
			}
		}
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