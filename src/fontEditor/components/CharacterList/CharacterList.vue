<script setup lang="ts">
	/**
	 * 字符列表
	 */
	/**
	 * character list
	 */

	import { visibleStartIndex, visibleEndIndex, visibleCount, itemHeight, selectedFile, orderedListWithItemsForCharacterFile, clearCharacterRenderList, characterList, addCharacterTemplate, generateCharacterTemplate, executeCharacterScript, editCharacterFile } from '../../stores/files'
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
	import { executeScript, ICustomGlyph } from '../../stores/glyph'
	import { loaded, loading, total } from '../../stores/global'
	import { addLoaded } from '../../menus/handlers'
	import { CustomGlyph } from '../../programming/CustomGlyph'

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
			}, 50)
			return
		}

		// 安全检查：确保可见区域有效
		if (visibleStartIndex.value >= characters.length) {
			// 如果可见区域超出范围，重置到最后几行
			const scrollContainer = containerRef.value?.closest('.el-scrollbar')?.querySelector('.el-scrollbar__wrap')
			if (scrollContainer) {
				const containerHeight = scrollContainer.clientHeight
				const containerWidth = scrollContainer.clientWidth
				const itemWidth = 86 + 10
				const itemTotalHeight = itemHeight + 10
				const itemsPerRow = Math.ceil(containerWidth / itemWidth)
				
				// 由于Grid布局可能没有占满宽度，增加容错
				const actualItemsPerRow = Math.max(1, itemsPerRow - 1) // 减少1个作为容错
				
				if (actualItemsPerRow > 0) {
					const visibleRows = Math.ceil(containerHeight / itemTotalHeight)
					const lastRowStart = Math.max(0, characters.length - (visibleRows + 5) * actualItemsPerRow)
					visibleStartIndex.value = lastRowStart
					visibleEndIndex.value = characters.length
				}
			}
		}

		// 清空渲染队列，重新计算可见区域
		renderQueue.length = 0
		
		// 只渲染可见区域的字符
		for (let i = visibleStartIndex.value; i < Math.min(visibleEndIndex.value, characters.length); i++) {
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
		if (renderQueue.length > 0) {
			if (!isRendering) {
				processRenderQueue()
			} else {
				// 如果正在渲染，等待一小段时间后再尝试
				setTimeout(() => {
					if (renderQueue.length > 0 && !isRendering) {
						processRenderQueue()
					}
				}, 100)
			}
		}
	}
	
	// 处理渲染队列
	const processRenderQueue = async () => {
		if (isRendering) {
			return
		}
		
		if (renderQueue.length === 0) {
			isRendering = false
			return
		}
		
		isRendering = true
		
		try {
			const characters = selectedFile.value ? selectedFile.value.characterList : []
			const { unitsPerEm, descender } = selectedFile.value.fontSettings
			
			let processedCount = 0
			let errorCount = 0
			const maxErrors = 10 // 最大错误次数，防止无限循环
			const startTime = Date.now()
			const maxProcessingTime = 5000 // 最大处理时间5秒
			
			while (renderQueue.length > 0 && errorCount < maxErrors) {
				addLoaded()
				// 检查是否超时
				if (Date.now() - startTime > maxProcessingTime) {
					break
				}
				const uuid = renderQueue.shift()!
				const characterFile = characters.find(c => c.uuid === uuid)
				const characterFileIndex = characters.findIndex(c => c.uuid === uuid)
				
				if (!characterFile) {
					continue
				}

				// 使用canvas池获取canvas
				const canvas = getCanvas(uuid)
				if (!canvas) {
					errorCount++
					continue
				}
				
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

					const fillColors = []
					orderedListWithItemsForCharacterFile(characterFile).map((component) => {
						if (component.type === 'glyph') {
							const glyph = (component.value as unknown as ICustomGlyph)._o ? (component.value as unknown as ICustomGlyph)._o : new CustomGlyph((component.value as unknown as ICustomGlyph))
							const _components = glyph.components
							_components.forEach((_component) => {
								fillColors.push(component.value.fillColor || '#000')
							})
						} else {
							fillColors.push(component.value.fillColor || '#000')
						}
					})

					renderPreview2(canvas, contours, fillColors)
					renderCache.set(`${uuid}_rendered`, true)
					processedCount++
					
					// 更新进度
					if (loading.value) {
						loaded.value += 1
						if (loaded.value >= total.value) {
							loading.value = false
						}
					}
					
				} catch (error) {
					console.error(`Error rendering character ${uuid}:`, error)
					errorCount++
				}
				
				// 每渲染5个字符就让出主线程，提高响应性
				if (processedCount % 5 === 0) {
					await new Promise(resolve => requestAnimationFrame(resolve))
				}
			}
			
			
			// 清理缓存和池
			cleanupCache()
			cleanupCanvasPool()
			
		} catch (error) {
		} finally {
			// 确保渲染状态被重置
			isRendering = false
		}
	}
	
	// 防抖的滚动处理
	let scrollTimeout: number | null = null
	let lastScrollTop = 0
	let isScrolling = false
	let scrollEndTimeout: number | null = null
	let scrollCheckInterval: number | null = null
	
	// 定期检查滚动位置，确保拖拽scrollbar时也能更新可见区域
	const checkScrollPosition = () => {
		const scrollContainer = containerRef.value?.closest('.el-scrollbar')?.querySelector('.el-scrollbar__wrap')
		if (!scrollContainer) return
		
		const scrollTop = scrollContainer.scrollTop
		
		// 如果滚动位置发生变化，强制更新可见区域
		if (Math.abs(scrollTop - lastScrollTop) > 5) { // 5px的阈值
			lastScrollTop = scrollTop
			updateVisibleArea(scrollContainer)
		}
	}
	
	// 更新可见区域的函数
	const updateVisibleArea = (scrollContainer: Element) => {
		const scrollTop = scrollContainer.scrollTop
		const containerHeight = scrollContainer.clientHeight
		const containerWidth = scrollContainer.clientWidth
		const itemWidth = 86 + 10
		const itemTotalHeight = itemHeight + 10
		const itemsPerRow = Math.ceil(containerWidth / itemWidth)
		
		// 由于Grid布局可能没有占满宽度，增加容错
		const actualItemsPerRow = Math.max(1, itemsPerRow - 1) // 减少1个作为容错
		
		if (actualItemsPerRow <= 0) return
		
		// 计算当前在第几行（考虑itemHeight + gap）
		const currentRow = Math.floor(scrollTop / itemTotalHeight)
		const totalVisibleRows = Math.ceil(containerHeight / itemTotalHeight)
		
		// 更精确的可见区域计算
		// 直接基于滚动位置计算，不使用行数转换
		const exactStartIndex = Math.floor(scrollTop / itemTotalHeight) * actualItemsPerRow
		const exactEndIndex = Math.ceil((scrollTop + containerHeight) / itemTotalHeight) * actualItemsPerRow
		
		// 添加调试：检查实际DOM中的字符位置
		const debugFirstVisibleChar = () => {
			const wrapper = document.getElementById('character-render-list')
			if (wrapper) {
				const firstChar = wrapper.querySelector('.character') as HTMLElement
				if (firstChar) {
					const rect = firstChar.getBoundingClientRect()
					const containerRect = wrapper.getBoundingClientRect()
					const relativeTop = rect.top - containerRect.top
				}
			}
		}
		
		// 执行DOM调试
		debugFirstVisibleChar()
		
		// 计算总行数和最大滚动位置
		const totalCharacters = selectedFile.value?.characterList?.length || 0
		
		// 添加一个更直接的调试：检查实际应该显示的第一个字符
		const debugExpectedFirstChar = () => {
			// 根据滚动位置计算应该显示的第一个字符
			const expectedFirstCharIndex = Math.floor(scrollTop / itemTotalHeight) * actualItemsPerRow

			// 检查这个索引的字符是否存在
			if (expectedFirstCharIndex < totalCharacters) {
				const expectedChar = selectedFile.value?.characterList[expectedFirstCharIndex]
			}
		}
		
		debugExpectedFirstChar()
		const totalRows = Math.ceil(totalCharacters / actualItemsPerRow)
		const maxScrollTop = totalRows * itemTotalHeight - containerHeight
		
		// 检查是否滚动到底部（使用更直接的方法）
		// 计算实际的总内容高度
		const actualTotalHeight = totalRows * itemTotalHeight
		const scrollPercentage = scrollTop / (actualTotalHeight - containerHeight)
		const isAtBottom = scrollPercentage >= 0.90 // 当滚动到90%以上时认为到底部，更早触发
		
		// 计算实际滚动位置对应的可见区域（无论是否在底部模式）
		// 使用更精确的计算方式，考虑实际的滚动偏移
		
		// 计算当前滚动位置对应的字符索引
		const currentCharIndex = Math.floor(scrollTop / itemTotalHeight) * actualItemsPerRow
		
		// 计算可见区域大小（以字符数量为单位）
		const visibleCharCount = totalVisibleRows * actualItemsPerRow
		
		// 计算缓冲区域大小
		const bufferCharCount = Math.max(visibleCount.value / 2, Math.ceil(visibleCharCount * 0.5)) // 前后各显示visibleCount.value/2个字符或可见字符数的一半
		
		// 计算可见区域的起始和结束索引
		const actualStartIndex = Math.max(0, currentCharIndex - bufferCharCount)
		const actualEndIndex = Math.min(
			currentCharIndex + visibleCharCount + bufferCharCount,
			totalCharacters
		)

		if (isAtBottom) {
			// 底部模式：同时渲染底部区域和实际可见区域
			const bufferSize = Math.min(totalVisibleRows * actualItemsPerRow * 3, totalCharacters) // 显示最后3倍可见行数的字符
			const lastRowStart = Math.max(0, totalCharacters - bufferSize)
			
			// 合并底部区域和实际可见区域
			const mergedStartIndex = Math.min(lastRowStart, actualStartIndex)
			const mergedEndIndex = Math.max(totalCharacters, actualEndIndex)
			
			visibleStartIndex.value = mergedStartIndex
			visibleEndIndex.value = mergedEndIndex
		} else {
			// 正常滚动时的可见区域计算
			visibleStartIndex.value = actualStartIndex
			visibleEndIndex.value = actualEndIndex
		}
		
		// 强制刷新可见区域
		forceRefreshVisibleCharacters()
	}
	
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
			
			// 只有当滚动距离足够大时才更新
			if (Math.abs(scrollTop - lastScrollTop) < itemHeight / 2) return
			
			// 使用统一的更新函数
			updateVisibleArea(scrollContainer)
			lastScrollTop = scrollTop
		}, 50) // 减少防抖时间到50ms，提高响应性
		
		// 设置滚动结束检测
		scrollEndTimeout = window.setTimeout(() => {
			isScrolling = false
			
			// 滚动结束后重新计算可见区域并开始渲染
			const scrollContainer = containerRef.value?.closest('.el-scrollbar')?.querySelector('.el-scrollbar__wrap')
			if (scrollContainer) {
				// 使用统一的更新函数
				updateVisibleArea(scrollContainer)
			}
			
			// 开始渲染
			renderVisibleCharacters()
			
			// 强制刷新一次，确保所有可见字符都被渲染
			setTimeout(() => {
				forceRefreshVisibleCharacters()
			}, 50)
		}, 200) // 减少滚动结束检测时间到200ms
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
		// renderAllCharacters()
		renderVisibleCharacters()
	}

	const renderAllCharacters = async () => {
		const characters = selectedFile.value ? selectedFile.value.characterList : []
		let processedCount = 0
		for (let i = 0; i < characters.length; i++) {
			const characterFile = characters[i]
			try {
				// 执行字符脚本
				if (!characterFile._o) {
					executeCharacterScript(characterFile)
				}

				// 渲染字符
				const contours = componentsToContours(orderedListWithItemsForCharacterFile(characterFile), {
					unitsPerEm: 1000,
					descender: -200,
					advanceWidth: 1000,
				}, { x: 0, y: 0 }, false, true)

				const canvas = getCanvas(characterFile.uuid)
				if (!canvas) return
				renderPreview2(canvas, contours)
				processedCount++
				
				// 更新进度
				if (loading.value) {
					loaded.value += 1
					if (loaded.value >= total.value) {
						loading.value = false
					}
				}
				
			} catch (error) {
				console.error(`Error rendering character:`, error)
			}
			
			// 每渲染5个字符就让出主线程，提高响应性
			if (processedCount % 5 === 0) {
				await new Promise(resolve => requestAnimationFrame(resolve))
			}
		}
	}
	
	// 强制刷新可见字符
	const forceRefreshVisibleCharacters = () => {
		const characters = selectedFile.value?.characterList || []
		if (!characters.length) return
		
		// 使用已经计算好的可见区域，不再重新计算
		
		// 强制清空渲染队列，优先处理可见区域
		const oldQueueLength = renderQueue.length
		renderQueue.length = 0
		
		// 清除所有缓存，强制重新渲染
		const oldCacheSize = renderCache.size
		renderCache.clear()
		
		// 添加可见区域的字符到渲染队列
		let queuedCount = 0
		
		for (let i = visibleStartIndex.value; i < Math.min(visibleEndIndex.value, characters.length); i++) {
			const characterFile = characters[i]
			
			// 添加到渲染队列
			renderQueue.push(characterFile.uuid)
			queuedCount++
		}
		
		// 开始渲染
		if (renderQueue.length > 0) {
			if (!isRendering) {
				processRenderQueue()
			} else {
				// 等待当前渲染完成后再处理新队列
				const checkRendering = () => {
					if (!isRendering && renderQueue.length > 0) {
						processRenderQueue()
					} else if (isRendering) {
						// 继续等待
						requestAnimationFrame(checkRendering)
					}
				}
				requestAnimationFrame(checkRendering)
			}
		} else {
		}
		
	}
	
	// 暴露调试函数到全局
	if (typeof window !== 'undefined') {
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
		
		// 测试函数：直接设置底部可见区域
		;(window as any).testBottomArea = () => {
			const characters = selectedFile.value?.characterList || []
			if (characters.length > 0) {
				// 直接显示最后200个字符
				const startIndex = Math.max(0, characters.length - 200)
				visibleStartIndex.value = startIndex
				visibleEndIndex.value = characters.length
				forceRefreshVisibleCharacters()
			}
		}
		
		// 检查DOM中的字符显示
		;(window as any).checkDOMCharacters = () => {
			const characters = selectedFile.value?.characterList || []
			
			// 检查最后几个字符是否在DOM中
			for (let i = Math.max(0, characters.length - 10); i < characters.length; i++) {
				const char = characters[i]
				const canvas = document.getElementById(`preview-canvas-${char.uuid}`)
				const wrapper = document.querySelector(`.character-${char.uuid}`)
			}
			
			// 检查可见区域的字符
			for (let i = visibleStartIndex.value; i < Math.min(visibleEndIndex.value, characters.length); i++) {
				const char = characters[i]
				const canvas = document.getElementById(`preview-canvas-${char.uuid}`)
				const wrapper = document.querySelector(`.character-${char.uuid}`)
				const cacheKey = `${char.uuid}_rendered`
				const isCached = renderCache.has(cacheKey)
			}
		}
		
		// 添加底部滚动调试函数
		;(window as any).debugBottomScrollInfo = () => {
			const characters = selectedFile.value?.characterList || []
			const scrollContainer = containerRef.value?.closest('.el-scrollbar')?.querySelector('.el-scrollbar__wrap')
			
			if (scrollContainer) {
				const scrollTop = scrollContainer.scrollTop
				const containerHeight = scrollContainer.clientHeight
				const containerWidth = scrollContainer.clientWidth
				const itemWidth = 86 + 10
				const itemTotalHeight = itemHeight + 10
				const itemsPerRow = Math.ceil(containerWidth / itemWidth)
				
				// 由于Grid布局可能没有占满宽度，增加容错
				const actualItemsPerRow = Math.max(1, itemsPerRow - 1) // 减少1个作为容错
				
				
				
				const currentRow = Math.floor(scrollTop / itemTotalHeight)
				const visibleRows = Math.ceil(containerHeight / itemTotalHeight)
				
				// 计算理论上的可见区域
				const theoreticalStart = Math.max(0, currentRow * actualItemsPerRow - actualItemsPerRow * 2)
				const theoreticalEnd = Math.min(
					(currentRow + visibleRows + 5) * actualItemsPerRow,
					characters.length
				)
				
				// 计算总行数
				const totalRows = Math.ceil(characters.length / actualItemsPerRow)
				
				// 计算最大滚动位置
				const maxScrollTop = totalRows * itemTotalHeight - containerHeight
				
				// 如果滚动到底部，计算应该显示的字符
				if (scrollTop >= maxScrollTop - 50) {
					const bottomStartIndex = Math.max(0, characters.length - (visibleRows + 5) * actualItemsPerRow)
				}
			}
		}
		
		// 强制重新处理渲染队列
		;(window as any).forceProcessRenderQueue = () => {
			
			// 强制重置渲染状态
			isRendering = false
			
			// 重新处理队列
			if (renderQueue.length > 0) {
				processRenderQueue()
			}
		}
		
		// 强制重置并重新渲染
		;(window as any).forceResetAndRender = () => {
			
			// 强制重置所有状态
			isRendering = false
			renderQueue.length = 0
			renderCache.clear()
			canvasPool.clear()
			
			
			// 强制重新计算可见区域并渲染
			const scrollContainer = containerRef.value?.closest('.el-scrollbar')?.querySelector('.el-scrollbar__wrap')
			if (scrollContainer) {
				updateVisibleArea(scrollContainer)
				forceRefreshVisibleCharacters()
			}
			
		}
		
		// 检查canvas元素是否存在
		;(window as any).checkCanvasElements = () => {
			const characters = selectedFile.value?.characterList || []
			
			// 检查可见区域的canvas
			for (let i = visibleStartIndex.value; i < Math.min(visibleEndIndex.value, characters.length); i++) {
				const char = characters[i]
				const canvas = document.getElementById(`preview-canvas-${char.uuid}`)
				const wrapper = document.querySelector(`.character-${char.uuid}`)
				
				if (canvas) {
					const canvasElement = canvas as HTMLCanvasElement
				}
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

		const fillColors = orderedListWithItemsForCharacterFile(characterFile).map((component) => {
			return component.value.fillColor || '#000'
		})

		renderPreview2(canvas, contours, fillColors)
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
		
		// 启动定期检查滚动位置，确保拖拽scrollbar时也能更新可见区域
		scrollCheckInterval = window.setInterval(checkScrollPosition, 100) // 每100ms检查一次
		
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
		if (scrollCheckInterval) {
			clearInterval(scrollCheckInterval)
		}
		
		// 清理渲染缓存和队列
		clearRenderCache()
		
		// 清理事件监听
		emitter.off('updateCharacterInfoPreviewCanvasByUUID')
		emitter.off('renderPreviewCanvasByUUID')
		emitter.off('renderPreviewCanvas')
		emitter.off('renderPreviewCanvasByUUIDOnEditing')
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
		background-color: var(--dark-1);
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