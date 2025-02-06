<script setup lang="ts">
	/**
	 * 字符列表
	 */
	/**
	 * character list
	 */

	import { selectedFile, orderedListWithItemsForCharacterFile, clearCharacterRenderList, characterList, addCharacterTemplate, generateCharacterTemplate, executeCharacterScript } from '../../stores/files'
	import { onMounted, nextTick, onUnmounted } from 'vue'
	import type {
		ILine,
		ICubicBezierCurve,
		IQuadraticBezierCurve,
	} from '../../../fontManager'
	import {
		componentsToContours,
	} from '../../../features/font'
	import { emitter } from '../../Event/bus'
	import { renderPreview2 } from '../../canvas/canvas'
	import { executeScript } from '../../stores/glyph'
	import { loaded, loading, total } from '../../stores/global'
	import { Close, Plus } from '@element-plus/icons-vue'

	const timerMap = new Map()

	// 渲染每个字符预览canvas
	// render preview canvas for each character
	const renderPreviewCanvas = () => {
		const characters = selectedFile.value ? selectedFile.value.characterList : []
		if (!selectedFile.value) return
		const {
			unitsPerEm,
			descender,
		} = selectedFile.value.fontSettings
		if (!characters.length) return
		//loading.value = true

		let i = 0

		const render = () => {
			// i 超过 length，渲染完毕
			if (i >= characters.length) return
			// 渲染第i个字符
			const characterFile = characters[i]
			if (!characterFile._o) {
				// 执行字符脚本
				executeCharacterScript(characterFile)
			}
			// 获取字符预览canvas
			const canvas: HTMLCanvasElement = document.getElementById(`preview-canvas-${characterFile.uuid}`) as HTMLCanvasElement
			if (!canvas) return
			// 将字符数据处理成预览模式
			const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(characterFile), {
				unitsPerEm,
				descender,
				advanceWidth: unitsPerEm,
			}, { x: 0, y: 0 }, false, true)
			// 渲染字符
			renderPreview2(canvas, contours)
			// 更新进度条
			if (loading.value) {
				loaded.value += 1
				if (loaded.value >= total.value) {
					loading.value = false
				}
			}
			// i递增
			i++
			// 如果没有渲染完毕，调用requestAnimationFrame对下一个字符渲染进行回调
			if (i < characters.length) {
				requestAnimationFrame(render)
			}
		}
		// 调用requestAnimationFrame渲染第一个字符
		requestAnimationFrame(render)
	}

	// 渲染指定uuid的字符预览
	// render preview canvas by uuid
	const renderPreviewCanvasByUUID = (uuid: string) => {
		let characterFile
		const {
			unitsPerEm,
			descender,
		} = selectedFile.value.fontSettings
		const characters = selectedFile.value ? selectedFile.value.characterList : []
		for (let i = 0; i < characters.length; i++) {
			if (characters[i].uuid === uuid) {
				characterFile = characters[i]
				break
			}
		}
		if (!characterFile) return
		executeCharacterScript(characterFile)
		characterFile?.components?.map((component) => {
			if (component.type === 'glyph') {
				executeScript(component.value)
			}
		})
		const wrapper = document.getElementById('character-render-list')
		const canvas: HTMLCanvasElement = wrapper.querySelector(`#preview-canvas-${characterFile.uuid}`) as HTMLCanvasElement
		if (!canvas) return
		//renderPreview(characterFile, canvas)
		// loading.value = true
		let defaultGrid = true
		if (characterFile && characterFile.info && characterFile.info.gridSettings) {
			defaultGrid = characterFile.info.gridSettings.default
		}
		const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(orderedListWithItemsForCharacterFile(characterFile), {
			unitsPerEm,
			descender,
			advanceWidth: unitsPerEm,
			grid: defaultGrid ? null : characterFile.info.gridSettings,
		}, { x: 0, y: 0 }, false, true, true)
		renderPreview2(canvas, contours)
		// loading.value = false
	}

	// 挂载组件时，渲染预览画布
	// renderPreviewCanvas on mounted
	onMounted(async () => {
		// 监听renderPreviewCanvas事件，需要调用nextTick保证预览canvas节点已经在dom中
		// listen renderPreviewCanvas event, need to call nextTick to ensure that preview canvas is already added into dom
		emitter.on('renderPreviewCanvas', async () => {
			await nextTick()
			renderPreviewCanvas()
		})

		// 监听渲染预览字符事件
		// listen for render preview canvas by uuid
		emitter.on('renderPreviewCanvasByUUID', async (uuid: string) => {
			if (timerMap.get(uuid)) {
				clearTimeout(timerMap.get(uuid))
			}
			const fn = () => {
				renderPreviewCanvasByUUID(uuid)
			}
			const timer = setTimeout(fn, 1000)
			timerMap.set(uuid, timer)
		})

		// 监听更新字符信息事件
		// listen for update character info by uuid
		emitter.on('updateCharacterInfoPreviewCanvasByUUID', async (uuid: string) => {
			let characterFile
			const characters = selectedFile.value ? selectedFile.value.characterList : []
			for (let i = 0; i < characters.length; i++) {
				characterFile = characters[i]
				if (characterFile.uuid === uuid) {
					break
				}
			}
			const wrapper = document.getElementById('character-render-list')
			const root: HTMLElement = wrapper.querySelector(`.character-${uuid}`) as HTMLElement;
			(root as HTMLElement).querySelector('.info').querySelector('.text').innerHTML = `${characterFile.character.text}`;
			if (characterFile.type === 'text') {
				(root as HTMLElement).querySelector('.unicode').innerHTML = `0x${characterFile.character.unicode.toString(16)}`;
			}
		})
		clearCharacterRenderList()
		characterList.value?.map((characterFile) => {
			addCharacterTemplate(generateCharacterTemplate(characterFile))
		})
		await nextTick()
		renderPreviewCanvas()
	})

	onUnmounted(() => {
		emitter.off('updateCharacterInfoPreviewCanvasByUUID')
		emitter.off('renderPreviewCanvasByUUID')
		emitter.off('renderPreviewCanvas')
	})
	// 更新组件时，渲染预览画布
	// renderPreviewCanvas on updated
	// onUpdated(async () => {
	//   await nextTick()
	//   renderPreviewCanvas()
	// })
</script>

<template>
	<section class="characters-list-wrapper">
		<el-scrollbar>
			<main class="list" id="character-render-list">
				<!-- <div
					class="character"
					v-for="characterFile in selectedFile?.characterList"
					:key="characterFile.uuid"
					@click="editCharacter(characterFile.uuid)"
				>
					<span class="preview">
						<div class="empty-line-1"></div>
						<div class="empty-line-2"></div>
						<canvas
							:id="`preview-canvas-${characterFile.uuid}`"
							class="preview-canvas" 
							:width="100"
							:height="100"
						></canvas>
					</span>
					<span class="info">
						<span class="text">{{ characterFile.character.text }}</span>
						<span class="unicode" v-if="characterFile.type === 'text'">{{ `0x${characterFile.character.unicode.toString(16)}` }}</span>
					</span>
					<span class="delete-icon" @click="(e) => deleteCharacter(e, characterFile.uuid)">
						<el-icon><Close /></el-icon>
					</span>
				</div>
				<div class="default-character" @click="setAddTextDialogVisible(true)">
					<div class="add-text-btn-wrapper">
						<el-icon><Plus /></el-icon>
					</div>
				</div> -->
			</main>
		</el-scrollbar>
	</section>
</template>

<style>
	.characters-list-wrapper {
		display: flex;
		flex-direction: column;
		background-color: white;
		height: 100%;
		position: relative;
		padding: 10px;
		background-color: var(--dark-0);
		.list {
			width: 100%;
			display: grid;
			grid-template-columns: repeat(auto-fill,86px);
			gap: 10px;
			.character, .default-character {
				width: 80px;
				height: 112px;
				display: flex;
				flex-direction: column;
				border: 3px solid var(--primary-0);
				box-sizing: content-box;
				cursor: pointer;
				&:hover {
					border: 3px solid var(--primary-1);
					.info {
						background-color: var(--primary-1);
						.unicode {
							background-color: var(--primary-1);
						}
					}
					.delete-icon, .copy-icon, .edit-icon {
						display: inline-flex;
					}
					.icon-group {
						display: inline-flex;
					}
				}
				.icon-group {
					display: none;
					position: absolute;
					right: 5px;
					top: 5px;
					align-items: center;
					justify-content: center;
					gap: 5px;
				}
				.delete-icon, .copy-icon, .edit-icon {
					width: 18px;
					height: 18px;
					align-items: center;
					justify-content: center;
					background-color: var(--primary-0);
					color: white;
				}
				.add-text-btn-wrapper {
					background-color: var(--primary-0);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 36px;
					color: white;
				}
				.preview {
					display: inline-block;
					width: 80px;
					height: 80px;
					flex: 0 0 80px;
					background-color: white;
					.empty-line-1 {
						position: absolute;
						top: 0;
						left: -10px;
						right: 0;
						width: 100px;
						transform: translateY(40px) rotate(-45deg);
						border-bottom: 2px solid #bd6565;
					}
					.empty-line-2 {
						position: absolute;
						top: 0;
						left: -10px;
						right: 0;
						width: 100px;
						transform: translateY(40px) rotate(45deg);
						border-bottom: 2px solid #bd6565;
					}
					.preview-canvas {
						width: 100%;
						height: 100%;
					}
				}
				.info {
					display: flex;
					flex-direction: row;
					flex: 0 0 32px;
					line-height: 32px;
					background-color: var(--primary-0);
					color: var(--primary-5);
					.text {
						flex: 0 0 32px;
						justify-content: center;
						text-align: center;
						align-items: center;
						font-size: 18px;
						font-weight: bold;
						line-height: 30px;
					}
					.unicode {
						line-height: 32px;
						font-size: 12px;
						background-color: var(--primary-0);
						color: var(--primary-5);
					}
				}
			}
		}
		.delete-icon {
			background-image: url('@/assets/icons/delete-icon.svg');
			background-repeat: no-repeat;
			background-size: cover;
		}
		.edit-icon {
			background-image: url('@/assets/icons/edit-icon.svg');
			background-repeat: no-repeat;
			background-size: cover;
		}
		.copy-icon {
			background-image: url('@/assets/icons/copy-icon.svg');
			background-repeat: no-repeat;
			background-size: cover;
		}
		.add-text-btn-wrapper {
			height: 36px;
			width: 36px;
			background-image: url('@/assets/icons/add-icon.svg');
			background-repeat: no-repeat;
			background-size: cover;
		}
		.default-character {
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: var(--primary-0);
		}
	}
</style>