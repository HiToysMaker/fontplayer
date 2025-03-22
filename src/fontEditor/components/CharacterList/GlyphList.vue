<script setup lang="ts">
	/**
	 * 字符列表
	 */
	/**
	 * character list
	 */

	import { Status } from '../../stores/font'
	import { glyphs, executeScript, addGlyphTemplate, clearGlyphRenderList, getGlyphType, getGlyphByUUID } from '../../stores/glyph'
	import { glyphComponentsDialogVisible, setGlyphComponentsDialogVisible } from '../../stores/dialogs'
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
	import { loaded, total, loading } from '../../stores/global'
	import { Close, Plus } from '@element-plus/icons-vue'

	const timerMap = new Map()

	// 渲染每个字符预览canvas
	// render preview canvas for each character
	const renderPreviewCanvas = () => {
		//loading.value = true
		//for (let i = 0; i < glyphs.value.length; i++) {
		//}
		//loading.value = false

		let i = 0

		const render = () => {
			if (i >= glyphs.value.length) return
			const glyph = glyphs.value[i]
			executeScript(glyph)
			const canvas: HTMLCanvasElement = document.getElementById(`preview-canvas-${glyph.uuid}`) as HTMLCanvasElement
			if (!canvas) return
			//renderGlyphPreview(glyph, canvas)
			const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(glyph._o.components, {
				unitsPerEm: 1000,
				descender: -200,
				advanceWidth: 1000,
			}, { x: 0, y: 0 }, true, true)
			renderPreview2(canvas, contours)
			if (loading.value) {
				loaded.value += 1
				if (loaded.value >= total.value) {
					loading.value = false
				}
			}
			i++
			if (i < glyphs.value.length) {
				requestAnimationFrame(render)
			}
		}
		requestAnimationFrame(render)
	}

	// 渲染指定uuid的字形预览
	// render glyph preview by uuid
	const renderGlyphPreviewCanvasByUUID = (uuid: string) => {
		let glyph
		for (let i = 0; i < glyphs.value.length; i++) {
			glyph = glyphs.value[i]
			if (glyph.uuid === uuid) {
				break
			}
		}
		executeScript(glyph)
		glyph?.components?.map(component => {
			if (component.type === 'glyph') {
				executeScript(component.value)
			}
		})
		const wrapper = document.getElementById('glyph-render-list')
		const canvas: HTMLCanvasElement = wrapper.querySelector(`#preview-canvas-${glyph.uuid}`) as HTMLCanvasElement
		if (!canvas) return
		//renderGlyphPreview(glyph, canvas)
		// loading.value = true
		const contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>> = componentsToContours(glyph._o.components, {
			unitsPerEm: 1000,
			descender: -200,
			advanceWidth: 1000,
		}, { x: 0, y: 0 }, true, true)
		renderPreview2(canvas, contours)
		// loading.value = false
	}

	// 挂载组件时，渲染预览画布
	// renderPreviewCanvas on mounted
	onMounted(async () => {
		// 监听renderGlyphPreviewCanvas事件，需要调用nextTick保证预览canvas节点已经在dom中
		// listen renderGlyphPreviewCanvas event, need to call nextTick to ensure that preview canvas is already added into dom
		emitter.on('renderGlyphPreviewCanvas', async () => {
			await nextTick()
			renderPreviewCanvas()
			emitter.emit('renderGlyphSelection')
		})

		// 监听渲染指定uuid字形预览事件
		// listen for render glyph preview by uuid
		emitter.on('renderGlyphPreviewCanvasByUUID', async (uuid: string) => {
			const type: Status = getGlyphType(uuid)

			if (type === Status.GlyphList) {
				// render glyph preview
				if (timerMap.get(uuid)) {
					clearTimeout(timerMap.get(uuid))
				}
				const timer = setTimeout(async () => {
					await nextTick()
					renderGlyphPreviewCanvasByUUID(uuid)
				}, 1000)
				timerMap.set(uuid, timer)
				emitter.emit('renderGlyphSelectionByUUID', uuid)
			} else if (type === Status.StrokeGlyphList) {
				emitter.emit('renderStrokeGlyphPreviewCanvasByUUID', uuid)
				emitter.emit('renderStrokeGlyphSelectionByUUID', uuid)
			} else if (type === Status.RadicalGlyphList) {
				emitter.emit('renderRadicalGlyphPreviewCanvasByUUID', uuid)
				emitter.emit('renderRadicalGlyphSelectionByUUID', uuid)
			} else if (type === Status.CompGlyphList) {
				emitter.emit('renderCompGlyphPreviewCanvasByUUID', uuid)
				emitter.emit('renderCompGlyphSelectionByUUID', uuid)
			}
		})

		// 监听更新指定uuid字形信息
		// listen for update glyph info by uuid
		emitter.on('updateGlyphInfoPreviewCanvasByUUID', async (uuid: string) => {
			const type: Status = getGlyphType(uuid)
			const glyph = getGlyphByUUID(uuid)

			if (type === Status.GlyphList) {
				const wrapper = document.getElementById('glyph-render-list')
				const root: HTMLElement = wrapper.querySelector(`.glyph-${uuid}`) as HTMLElement;
				(root as HTMLElement).querySelector('.name').innerHTML = `${glyph.name}`;

				const wrapper2 = document.getElementById('glyph-components-wrapper')
				const root2: HTMLElement = wrapper2.querySelector(`.glyph-${uuid}`) as HTMLElement;
				(root2 as HTMLElement).querySelector('.name').innerHTML = `${glyph.name}`;
			} else if (type === Status.StrokeGlyphList) {
				const wrapper = document.getElementById('stroke-glyph-render-list')
				const root: HTMLElement = wrapper.querySelector(`.glyph-${uuid}`) as HTMLElement;
				(root as HTMLElement).querySelector('.name').innerHTML = `${glyph.name}`;

				const wrapper2 = document.getElementById('stroke-glyph-components-wrapper')
				const root2: HTMLElement = wrapper2.querySelector(`.glyph-${uuid}`) as HTMLElement;
				(root2 as HTMLElement).querySelector('.name').innerHTML = `${glyph.name}`;
			} else if (type === Status.RadicalGlyphList) {
				const wrapper = document.getElementById('radical-glyph-render-list')
				const root: HTMLElement = wrapper.querySelector(`.glyph-${uuid}`) as HTMLElement;
				(root as HTMLElement).querySelector('.name').innerHTML = `${glyph.name}`;

				const wrapper2 = document.getElementById('radical-glyph-components-wrapper')
				const root2: HTMLElement = wrapper2.querySelector(`.glyph-${uuid}`) as HTMLElement;
				(root2 as HTMLElement).querySelector('.name').innerHTML = `${glyph.name}`;
			} else if (type === Status.CompGlyphList) {
				const wrapper = document.getElementById('comp-glyph-render-list')
				const root: HTMLElement = wrapper.querySelector(`.glyph-${uuid}`) as HTMLElement;
				(root as HTMLElement).querySelector('.name').innerHTML = `${glyph.name}`;

				const wrapper2 = document.getElementById('comp-glyph-components-wrapper')
				const root2: HTMLElement = wrapper2.querySelector(`.glyph-${uuid}`) as HTMLElement;
				(root2 as HTMLElement).querySelector('.name').innerHTML = `${glyph.name}`;
			}
		})
		!glyphComponentsDialogVisible.value && setGlyphComponentsDialogVisible(true)
		//glyphComponentsDialogVisible2.value = true
		await nextTick()
		clearGlyphRenderList(Status.GlyphList)
		glyphs.value.map((glyph) => {
			addGlyphTemplate(glyph, Status.GlyphList)
		})
		await nextTick()
		renderPreviewCanvas()
		emitter.emit('renderGlyphSelection')
		emitter.emit('renderStrokeGlyphSelection')
		emitter.emit('renderRadicalGlyphSelection')
		emitter.emit('renderCompGlyphSelection')
	})

	onUnmounted(() => {
		emitter.off('renderGlyphPreviewCanvas')
		emitter.off('renderGlyphPreviewCanvasByUUID')
		emitter.off('updateGlyphInfoPreviewCanvasByUUID')
	})

	// 更新组件时，渲染预览画布
	// renderPreviewCanvas on updated
	// onUpdated(async () => {
	//   await nextTick()
	//   renderPreviewCanvas()
	// })
</script>

<template>
	<section class="glyph-list-wrapper">
		<el-scrollbar>
			<main class="list" id="glyph-render-list">
				<!-- <div
					class="glyph"
					v-for="glyph in glyphs"
					:key="glyph.uuid"
					@pointerdown="editGlyph(glyph.uuid)"
				>
					<span class="preview">
						<div class="empty-line-1"></div>
						<div class="empty-line-2"></div>
						<canvas
							:id="`preview-canvas-${glyph.uuid}`"
							class="preview-canvas" 
							:width="100"
							:height="100"
						></canvas>
					</span>
					<span class="info">
						<span class="name">{{ glyph.name }}</span>
					</span>
					<span class="delete-icon" @pointerdown="(e) => deleteCharacter(e, glyph.uuid)">
						<el-icon><Close /></el-icon>
					</span>
				</div> -->
				<!-- <div class="default-glyph" @pointerdown="setAddGlyphDialogVisible(true)">
					<div class="add-glyph-btn-wrapper">
						<el-icon><Plus /></el-icon>
					</div>
				</div> -->
			</main>
		</el-scrollbar>
	</section>
</template>

<style>
	.glyph-list-wrapper {
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
			.glyph, .default-glyph {
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
				.add-glyph-btn-wrapper {
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
					justify-content: center;
					text-align: center;
					.name {
						font-size: 18px;
						text-overflow: ellipsis;
						white-space: nowrap;
						width: 100%;
						overflow: hidden;
						font-weight: bold;
						line-height: 30px;
						text-align: center;
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
		.add-glyph-btn-wrapper {
			height: 36px;
			width: 36px;
			background-image: url('@/assets/icons/add-icon.svg');
			background-repeat: no-repeat;
			background-size: cover;
		}
		.default-glyph {
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: var(--primary-0);
		}
	}
</style>