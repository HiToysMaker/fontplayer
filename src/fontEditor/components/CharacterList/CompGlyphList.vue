<script setup lang="ts">
	/**
	 * 组件字形列表
	 */
	/**
	 * comp glyph list
	 */

	import { Status } from '../../stores/font'
	import { executeScript, addGlyphTemplate, clearGlyphRenderList, comp_glyphs } from '../../stores/glyph'
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

	const timerMap = new Map()

	// 渲染每个字符预览canvas
	// render preview canvas for each character
	const renderPreviewCanvas = () => {
		//loading.value = true
		//for (let i = 0; i < comp_glyphs.value.length; i++) {
		//}
		//loading.value = false

		let i = 0
		const render = () => {
			if (i >= comp_glyphs.value.length) return
			const glyph = comp_glyphs.value[i]
			if (!glyph._o) {
				executeScript(glyph)
			}
			const wrapper = document.getElementById('comp-glyph-render-list')
			if (!wrapper) return
			const canvas: HTMLCanvasElement = wrapper.querySelector(`#preview-canvas-${glyph.uuid}`) as HTMLCanvasElement
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
			if (i < comp_glyphs.value.length) {
				requestAnimationFrame(render)
			}
		}
		requestAnimationFrame(render)
	}

	// 渲染指定uuid的字形预览
	// render glyph preview by uuid
	const renderGlyphPreviewCanvasByUUID = (uuid: string) => {
		let glyph
		for (let i = 0; i < comp_glyphs.value.length; i++) {
			glyph = comp_glyphs.value[i]
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
		const wrapper = document.getElementById('comp-glyph-render-list')
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
		emitter.on('renderCompGlyphPreviewCanvas', async () => {
			await nextTick()
			renderPreviewCanvas()
			emitter.emit('renderCompGlyphSelection')
		})

		// 监听渲染字形预览事件
		// listen for render glyph preview by uuid
		emitter.on('renderCompGlyphPreviewCanvasByUUID', async (uuid: string) => {
			if (timerMap.get(uuid)) {
				clearTimeout(timerMap.get(uuid))
			}
			const timer = setTimeout(async () => {
				await nextTick()
				renderGlyphPreviewCanvasByUUID(uuid)
			}, 1000)
			timerMap.set(uuid, timer)
		})
		!glyphComponentsDialogVisible.value && setGlyphComponentsDialogVisible(true)
		//glyphComponentsDialogVisible2.value = true
		await nextTick()
		clearGlyphRenderList(Status.CompGlyphList)
		comp_glyphs.value.map((glyph) => {
			addGlyphTemplate(glyph, Status.CompGlyphList)
		})
		await nextTick()
		renderPreviewCanvas()
	})

	onUnmounted(() => {
		emitter.off('renderCompGlyphPreviewCanvas')
		emitter.off('renderCompGlyphPreviewCanvasByUUID')
	})

	// 更新组件时，渲染预览画布
	// renderPreviewCanvas on updated
	// onUpdated(async () => {
	//   await nextTick()
	//   renderPreviewCanvas()
	// })
</script>

<template>
	<section class="comp-glyph-list-wrapper">
		<el-scrollbar>
			<main class="list" id="comp-glyph-render-list">
			</main>
		</el-scrollbar>
	</section>
</template>

<style>
	.comp-glyph-list-wrapper {
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