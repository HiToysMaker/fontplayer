<script setup lang="ts">
	/**
	 * 字符列表
	 */
	/**
	 * character list
	 */

	import { visibleStartIndex, visibleEndIndex, itemHeight, selectedFile, orderedListWithItemsForCharacterFile, clearCharacterRenderList, characterList, addCharacterTemplate, generateCharacterTemplate, executeCharacterScript, editCharacterFile } from '../../stores/files'
	import { onMounted, nextTick, onUnmounted, ref } from 'vue'
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
	import { addLoaded } from '@/fontEditor/menus/handlers'

	const timerMap = new Map()
	
	// 虚拟滚动相关状态
	const containerRef = ref<HTMLElement>()
	
	// 渲染缓存
	const renderCache = new Map<string, boolean>()
	const renderQueue: string[] = []
	let isRendering = false
	
	// 内存管理
	const maxCacheSize = 1000 // 最大缓存1000个字符
	const canvasPool = new Map<string, HTMLCanvasElement>()
	
	// 清理过期的缓存
	const cleanupCache = () => {
		if (renderCache.size > maxCacheSize) {
			const keys = Array.from(renderCache.keys())
			const keysToDelete = keys.slice(0, keys.length - maxCacheSize)
			keysToDelete.forEach(key => renderCache.delete(key))
		}
	}
	
	// 获取或创建canvas
	const getCanvas = (uuid: string): HTMLCanvasElement | null => {
		// 先从池中获取
		if (canvasPool.has(uuid)) {
			return canvasPool.get(uuid)!
		}
		
		// 从DOM中获取
		const canvas = document.getElementById(`preview-canvas-${uuid}`) as HTMLCanvasElement
		if (canvas) {
			canvasPool.set(uuid, canvas)
		}
		
		return canvas
	}
	
	// 清理canvas池
	const cleanupCanvasPool = () => {
		// 只保留可见区域的canvas
		const visibleUUIDs = new Set<string>()
		const characters = selectedFile.value?.characterList || []
		
		for (let i = visibleStartIndex.value; i < Math.min(visibleEndIndex.value, characters.length); i++) {
			visibleUUIDs.add(characters[i].uuid)
		}
		
		// 删除不可见的canvas引用
		for (const [uuid, canvas] of canvasPool.entries()) {
			if (!visibleUUIDs.has(uuid)) {
				canvasPool.delete(uuid)
			}
		}
	}
	
	// 优化的渲染函数 - 只渲染可见区域的字符
	const renderVisibleCharacters = () => {
		const characters = selectedFile.value ? selectedFile.value.characterList : []
		if (!characters.length) {
			return
		}

		// 使用requestIdleCallback在空闲时间执行
		if ('requestIdleCallback' in window) {
			requestIdleCallback(() => {
				processVisibleCharacters(characters)
			}, { timeout: 1000 })
		} else {
			// 降级到setTimeout
			setTimeout(() => {
				processVisibleCharacters(characters)
			}, 0)
		}
	}
	
	// 处理可见字符
	const processVisibleCharacters = (characters: any[]) => {
		const { unitsPerEm, descender } = selectedFile.value.fontSettings
		
		// 如果正在滚动，延迟渲染
		if (isScrolling) {
			setTimeout(() => {
				processVisibleCharacters(characters)
			}, 100)
			return
		}

		// 只渲染可见区域的字符
		for (let i = visibleStartIndex.value; i < Math.min(visibleEndIndex.value, characters.length); i++) {
			addLoaded()
			const characterFile = characters[i]
			const cacheKey = `${characterFile.uuid}_${characterFile._o ? 'rendered' : 'pending'}`
			
			// 检查是否已经渲染过
			if (renderCache.has(cacheKey)) {
				continue
			}
			
			// 添加到渲染队列
			if (!renderQueue.includes(characterFile.uuid)) {
				renderQueue.push(characterFile.uuid)
			}
		}
		
		// 开始渲染队列
		if (!isRendering && renderQueue.length > 0) {
			processRenderQueue()
		}
	}
	
	// 处理渲染队列
	const processRenderQueue = async () => {
		if (isRendering || renderQueue.length === 0) {
			return
		}
		
		isRendering = true
		const characters = selectedFile.value ? selectedFile.value.characterList : []
		const { unitsPerEm, descender } = selectedFile.value.fontSettings
		
		let processedCount = 0
		while (renderQueue.length > 0) {
			const uuid = renderQueue.shift()!
			const characterFile = characters.find(c => c.uuid === uuid)
			
			if (!characterFile) {
				continue
			}
			
			// 使用canvas池获取canvas
			const canvas = getCanvas(uuid)
			if (!canvas) {
				continue
			}
			
			// 检查canvas状态
			
			
			try {
				// 执行字符脚本
				if (!characterFile._o) {
					executeCharacterScript(characterFile)
				}
				
				// 检查是否有内容需要渲染
				if (!characterFile.orderedList || !characterFile.orderedList.length) {
					renderCache.set(`${uuid}_pending`, true)
					continue
				}
				
				// 渲染字符
				const contours = componentsToContours(orderedListWithItemsForCharacterFile(characterFile), {
					unitsPerEm,
					descender,
					advanceWidth: unitsPerEm,
				}, { x: 0, y: 0 }, false, true)

				renderPreview2(canvas, contours)
				renderCache.set(`${uuid}_rendered`, true)
				processedCount++
				
				// 检查渲染后的canvas内容
				const ctx = canvas.getContext('2d')
				if (ctx) {
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
					const hasContent = imageData.data.some(pixel => pixel !== 0) // 检查是否有非透明像素
				}
				
				// 更新进度
				if (loading.value) {
					loaded.value += 1
					if (loaded.value >= total.value) {
						loading.value = false
					}
				}
				
			} catch (error) {
				console.error(`Error rendering character ${uuid}:`, error)
			}
			
			// 每渲染10个字符就让出主线程
			if (renderQueue.length % 10 === 0) {
				await new Promise(resolve => requestAnimationFrame(resolve))
			}
		}
		
		// 清理缓存和池
		cleanupCache()
		cleanupCanvasPool()

		isRendering = false
	}
	
	// 防抖的滚动处理
	let scrollTimeout: number | null = null
	let lastScrollTop = 0
	let isScrolling = false
	let scrollEndTimeout: number | null = null
	
	// 监听滚动事件，更新可见区域
	const handleScroll = () => {
		// 标记正在滚动
		isScrolling = true
		
		// 清除滚动结束定时器
		if (scrollEndTimeout) {
			clearTimeout(scrollEndTimeout)
		}
		
		// 防抖处理，避免频繁触发
		if (scrollTimeout) {
			clearTimeout(scrollTimeout)
		}
		
		scrollTimeout = window.setTimeout(() => {
			// 获取正确的滚动容器和位置
			const scrollContainer = containerRef.value?.closest('.el-scrollbar')?.querySelector('.el-scrollbar__wrap')
			if (!scrollContainer) return
			
			const scrollTop = scrollContainer.scrollTop
			const containerHeight = scrollContainer.clientHeight
			
			// 只有当滚动距离足够大时才更新
			if (Math.abs(scrollTop - lastScrollTop) < itemHeight / 2) return
			
			// 计算Grid布局的可见区域
			// 获取容器的实际宽度来计算每行的字符数
			const containerWidth = scrollContainer.clientWidth
			const itemWidth = 86 // grid-template-columns: repeat(auto-fill,86px)
			const itemsPerRow = Math.floor(containerWidth / itemWidth)
			
			if (itemsPerRow <= 0) return
			
			// 计算当前在第几行
			const currentRow = Math.floor(scrollTop / itemHeight)
			const visibleRows = Math.ceil(containerHeight / itemHeight)
			
			// 计算可见区域的字符索引
			const newStartIndex = Math.max(0, currentRow * itemsPerRow - itemsPerRow) // 提前一行开始渲染
			const newEndIndex = Math.min(
				(currentRow + visibleRows + 2) * itemsPerRow, // 额外渲染2行作为缓冲
				selectedFile.value?.characterList?.length || 0
			)
			
			// 如果可见区域发生变化，更新索引
			if (newStartIndex !== visibleStartIndex.value || newEndIndex !== visibleEndIndex.value) {
				visibleStartIndex.value = newStartIndex
				visibleEndIndex.value = newEndIndex
			}
			
			lastScrollTop = scrollTop
		}, 100) // 100ms防抖
		
		// 设置滚动结束检测
		scrollEndTimeout = window.setTimeout(() => {
			isScrolling = false
			// 滚动结束后开始渲染
			renderVisibleCharacters()
			
			// 强制刷新一次，确保所有可见字符都被渲染
			setTimeout(() => {
				forceRefreshVisibleCharacters()
			}, 100)
		}, 300) // 300ms后认为滚动结束
	}
	
	// 清理渲染缓存
	const clearRenderCache = () => {
		renderCache.clear()
		renderQueue.length = 0
		isRendering = false
		canvasPool.clear()
	}

	// 优化的渲染函数 - 替换原来的renderPreviewCanvas
	const renderPreviewCanvas = () => {
		clearRenderCache()
		renderVisibleCharacters()
	}
	
	// 调试函数：检查当前渲染状态
	const debugRenderState = () => {
		console.log('=== 渲染状态调试 ===')
		console.log(`可见区域: ${visibleStartIndex.value} - ${visibleEndIndex.value}`)
		console.log(`正在滚动: ${isScrolling}`)
		console.log(`正在渲染: ${isRendering}`)
		console.log(`渲染队列长度: ${renderQueue.length}`)
		console.log(`缓存大小: ${renderCache.size}`)
		console.log(`Canvas池大小: ${canvasPool.size}`)
		
		const characters = selectedFile.value?.characterList || []
		console.log(`总字符数: ${characters.length}`)
		
		// 检查可见区域的字符
		for (let i = visibleStartIndex.value; i < Math.min(visibleEndIndex.value, characters.length); i++) {
			const char = characters[i]
			const cacheKey = `${char.uuid}_${char._o ? 'rendered' : 'pending'}`
			console.log(`字符 ${i}: ${char.uuid}, 已缓存: ${renderCache.has(cacheKey)}`)
		}
		console.log('====================')
	}
	
	// 强制刷新可见字符
	const forceRefreshVisibleCharacters = () => {
		const characters = selectedFile.value?.characterList || []
		if (!characters.length) return
		
		// 清除可见区域的缓存，强制重新渲染
		for (let i = visibleStartIndex.value; i < Math.min(visibleEndIndex.value, characters.length); i++) {
			const characterFile = characters[i]
			const cacheKey = `${characterFile.uuid}_rendered`
			renderCache.delete(cacheKey)
			
			// 添加到渲染队列
			if (!renderQueue.includes(characterFile.uuid)) {
				renderQueue.push(characterFile.uuid)
			}
		}
		
		// 开始渲染
		if (!isRendering && renderQueue.length > 0) {
			processRenderQueue()
		}
	}
	
	// 暴露调试函数到全局
	if (typeof window !== 'undefined') {
		(window as any).debugRenderState = debugRenderState
		;(window as any).forceRefreshVisibleCharacters = forceRefreshVisibleCharacters
		;(window as any).checkVisibleCharacters = () => {
			const characters = selectedFile.value?.characterList || []
			
			// 检查实际的DOM元素高度
			const wrapper = document.getElementById('character-render-list')
			if (wrapper) {
				const firstChar = wrapper.querySelector('.character')
				if (firstChar) {
					const rect = firstChar.getBoundingClientRect()
				}
			}
			
			for (let i = visibleStartIndex.value; i < Math.min(visibleEndIndex.value, characters.length); i++) {
				const char = characters[i]
			}
		}
	}

	// 渲染指定uuid的字符预览
	// render preview canvas by uuid
	const renderPreviewCanvasByUUID = (uuid: string, editing: boolean = false) => {
		let characterFile
		const {
			unitsPerEm,
			descender,
		} = selectedFile.value.fontSettings
		const characters = selectedFile.value ? selectedFile.value.characterList : []
		if (!editing) {
			for (let i = 0; i < characters.length; i++) {
				if (characters[i].uuid === uuid) {
					characterFile = characters[i]
					break
				}
			}
		} else {
			// 编辑时，使用editCharacterFile
			characterFile = editCharacterFile.value
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
			useSkeletonGrid: characterFile.info?.useSkeletonGrid || false,
		}, { x: 0, y: 0 }, false, true, true)
		renderPreview2(canvas, contours)
		// loading.value = false
	}

	// 挂载组件时，渲染预览画布
	// renderPreviewCanvas on mounted
	onMounted(async () => {
		// 设置滚动监听 - 针对el-scrollbar
		await nextTick()
		containerRef.value = document.getElementById('character-render-list')
		
		// 对于el-scrollbar，需要监听其内部的滚动容器
		if (containerRef.value) {
			// 查找el-scrollbar内部的滚动容器
			const scrollContainer = containerRef.value.closest('.el-scrollbar')?.querySelector('.el-scrollbar__wrap')
			if (scrollContainer) {
				scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
			} else {
				// 如果找不到，回退到原来的方式
				containerRef.value.addEventListener('scroll', handleScroll, { passive: true })
			}
		}
		
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
				timerMap.set(uuid, null)
			}
			const fn = () => {
				renderPreviewCanvasByUUID(uuid)
			}
			const timer = setTimeout(fn, 1000)
			timerMap.set(uuid, timer)
		})

		// 编辑字符时，监听渲染预览字符事件
		// listen for render preview canvas by uuid on char editing
		emitter.on('renderPreviewCanvasByUUIDOnEditing', async (uuid: string) => {
			if (timerMap.get(uuid)) {
				clearTimeout(timerMap.get(uuid))
				timerMap.set(uuid, null)
			}
			const fn = () => {
				renderPreviewCanvasByUUID(uuid, true)
			}
			const timer = setTimeout(fn, 100)
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
		// 清理滚动监听
		if (containerRef.value) {
			const scrollContainer = containerRef.value.closest('.el-scrollbar')?.querySelector('.el-scrollbar__wrap')
			if (scrollContainer) {
				scrollContainer.removeEventListener('scroll', handleScroll)
			} else {
				containerRef.value.removeEventListener('scroll', handleScroll)
			}
		}
		
		// 清理所有定时器
		if (scrollTimeout) {
			clearTimeout(scrollTimeout)
		}
		if (scrollEndTimeout) {
			clearTimeout(scrollEndTimeout)
		}
		
		// 清理渲染缓存和队列
		clearRenderCache()
		
		// 清理事件监听
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
					@pointerdown="editCharacter(characterFile.uuid)"
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
					<span class="delete-icon" @pointerdown="(e) => deleteCharacter(e, characterFile.uuid)">
						<el-icon><Close /></el-icon>
					</span>
				</div>
				<div class="default-character" @pointerdown="setAddTextDialogVisible(true)">
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