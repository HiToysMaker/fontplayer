<script lang="ts" setup>
	import { ref, type Ref, toRefs, onMounted, watch, computed, onUnmounted, onBeforeUnmount } from 'vue'
	import { renderLayout } from '../../../features/layout'
  import { editCharacterFile, orderedListWithItemsForCurrentCharacterFile, renderPreview } from '../../stores/playground'
	import { emitter } from '../../Event/bus'
	import { renderCanvas as renderCharacter, renderGridCanvas } from '../../canvas/canvas'
	import { ElMessageBox } from 'element-plus'
	import { OpType, saveState, StoreType } from '../../stores/edit'
	const props = defineProps({
		dx: {
			type: Number,
			default: 0,
		},
		dy: {
			type: Number,
			default: 0,
		},
		centerSquareSize: {
			type: Number,
			default: 500 / 3,
		},
		size: {
			type: Number,
			default: 500,
		},
		onChange: Function,
	})
	const { dx, dy, centerSquareSize, size, onChange } = toRefs(props)

	const barycenter = computed(() => [mapCanvas(size.value / 2) + mapCanvas(dx.value), mapCanvas(size.value / 2) + mapCanvas(dy.value)])
	const canvas: Ref<HTMLCanvasElement> = ref(null)
	const distance = (x1, y1, x2, y2) => {
		return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
	}

	const mapCanvas = (n) => n / size.value * 500

	const x1 = computed(() => Math.round((size.value - centerSquareSize.value) / 2) + dx.value)
	const x2 = computed(() => Math.round((size.value - centerSquareSize.value) / 2 + centerSquareSize.value) + dx.value)
	const y1 = computed(() => Math.round((size.value - centerSquareSize.value) / 2) + dy.value)
	const y2 = computed(() => Math.round((size.value - centerSquareSize.value) / 2 + centerSquareSize.value) + dy.value)

	onMounted(() => {
		canvas.value.addEventListener('mousedown', onMouseDown)
		canvas.value.addEventListener('mousemove', onMouseMove)
	})
	onBeforeUnmount(() => {
		canvas.value.removeEventListener('mousedown', onMouseDown)
		canvas.value.removeEventListener('mousemove', onMouseMove)
	})
	const status = ref('none')
	const style = ref('default')
	const onMouseDown = (e: MouseEvent) => {
		if (distance(
			e.offsetX, e.offsetY,
			barycenter.value[0],
			barycenter.value[1],
		) <= 20) {
			//document.body.addEventListener('mousemove', onMouseMove)
			document.body.addEventListener('mouseup', onMouseUp)
			status.value = 'inner-move'
		} else if (distance(
			e.offsetX, e.offsetY,
			mapCanvas(size.value / 2 - centerSquareSize.value / 4), mapCanvas(size.value / 2 - centerSquareSize.value / 4),
		) <= 20) {
			// 左上角
			//document.body.addEventListener('mousemove', onMouseMove)
			document.body.addEventListener('mouseup', onMouseUp)
			status.value = 'left-top'
			style.value = 'left-top'
		} else if (distance(
			e.offsetX, e.offsetY,
			mapCanvas(size.value / 2 + centerSquareSize.value / 4), mapCanvas(size.value / 2 - centerSquareSize.value / 4),
		) <= 20) {
			// 右上角
			//document.body.addEventListener('mousemove', onMouseMove)
			document.body.addEventListener('mouseup', onMouseUp)
			status.value = 'right-top'
			style.value = 'right-top'
		} else if (distance(
			e.offsetX, e.offsetY,
			mapCanvas(size.value / 2 - centerSquareSize.value / 4), mapCanvas(size.value / 2 + centerSquareSize.value / 4),
		) <= 20) {
			// 左下角
			//document.body.addEventListener('mousemove', onMouseMove)
			document.body.addEventListener('mouseup', onMouseUp)
			status.value = 'left-bottom'
			style.value = 'left-bottom'
		} else if (distance(
			e.offsetX, e.offsetY,
			mapCanvas(size.value / 2 + centerSquareSize.value / 4), mapCanvas(size.value / 2 + centerSquareSize.value / 4),
		) <= 20) {
			// 右下角
			//document.body.addEventListener('mousemove', onMouseMove)
			document.body.addEventListener('mouseup', onMouseUp)
			status.value = 'right-bottom'
			style.value = 'right-bottom'
		}
	}
	const onMouseMove = (e: MouseEvent) => {
		switch (status.value) {
			case 'inner-move': {
				const _dx = e.offsetX / 500 * size.value - size.value / 2
				const _dy = e.offsetY / 500 * size.value - size.value / 2
				if (Math.abs(_dx) <= size.value / 12 && Math.abs(_dy) <= size.value / 12) {
					onChange.value(_dx, _dy, centerSquareSize.value)
				}
				break
			}
			case 'none': {
				if (distance(
					e.offsetX, e.offsetY,
					mapCanvas(size.value / 2 - centerSquareSize.value / 4), mapCanvas(size.value / 2 - centerSquareSize.value / 4),
				) <= 20) {
					// 左上角
					style.value = 'left-top'
				} else if (distance(
					e.offsetX, e.offsetY,
					mapCanvas(size.value / 2 + centerSquareSize.value / 4), mapCanvas(size.value / 2 - centerSquareSize.value / 4),
				) <= 20) {
					// 右上角
					style.value = 'right-top'
				} else if (distance(
					e.offsetX, e.offsetY,
					mapCanvas(size.value / 2 - centerSquareSize.value / 4), mapCanvas(size.value / 2 + centerSquareSize.value / 4),
				) <= 20) {
					// 左下角
					style.value = 'left-bottom'
				} else if (distance(
					e.offsetX, e.offsetY,
					mapCanvas(size.value / 2 + centerSquareSize.value / 4), mapCanvas(size.value / 2 + centerSquareSize.value / 4),
				) <= 20) {
					// 右下角
					style.value = 'right-bottom'
				} else {
					style.value = 'default'
				}
				break
			}
			default: {
				const _dx = e.offsetX / 500 * size.value - size.value / 2
				const _dy = e.offsetY / 500 * size.value - size.value / 2
				let d = 0
				if (status.value === 'left-top') {
					d = Math.min(-_dx, -_dy)
				}	else if (status.value === 'right-top') {
					d = Math.min(_dx, -_dy)
				} else if (status.value === 'left-bottom') {
					d = Math.min(-_dx, _dy)
				} else if (status.value === 'right-bottom') {
					d = Math.min(_dx, _dy)
				}
				d = Math.abs(d)
				if (d <= size.value / 6 && d >= size.value / 24) {
					const _centerSquareSize = d * 4
					const __dx = dx.value / centerSquareSize.value * _centerSquareSize
					const __dy = dy.value / centerSquareSize.value * _centerSquareSize
					onChange.value(__dx, __dy, _centerSquareSize)
				} else if (d >= size.value / 6) {
					const _centerSquareSize = size.value / 3 * 2
					const __dx = dx.value / centerSquareSize.value * _centerSquareSize
					const __dy = dy.value / centerSquareSize.value * _centerSquareSize
					onChange.value(__dx, __dy, _centerSquareSize)
				} else if (d <= size.value / 24) {
					const _centerSquareSize = size.value / 6
					const __dx = dx.value / centerSquareSize.value * _centerSquareSize
					const __dy = dy.value / centerSquareSize.value * _centerSquareSize
					onChange.value(__dx, __dy, _centerSquareSize)
				}
				break
			}
		}
	}
	const onMouseUp = () => {
		status.value = 'none'
		document.body.removeEventListener('mouseup', onMouseUp)
	}

  emitter.on('refreshPlaygroundGridController', () => {
    render()
		renderGridCanvas(orderedListWithItemsForCurrentCharacterFile.value, canvas.value as unknown as HTMLCanvasElement, {
			scale: 0.5,
			forceUpdate: false,
			fill: false,
    	offset: { x: 0, y: 0 },
			grid: {
				dx: dx.value,
				dy: dy.value,
				size: size.value,
				centerSquareSize: centerSquareSize.value,
				x1: x1.value,
				x2: x2.value,
				y1: y1.value,
				y2: y2.value,
			},
			useSkeletonGrid: false,
		})
  })

	watch([dx, dy, size, centerSquareSize], (newValue, oldValue) => {
		render()
		renderGridCanvas(orderedListWithItemsForCurrentCharacterFile.value, canvas.value as unknown as HTMLCanvasElement, {
			scale: 0.5,
			forceUpdate: false,
			fill: false,
    	offset: { x: 0, y: 0 },
			grid: {
				dx: dx.value,
				dy: dy.value,
				size: size.value,
				centerSquareSize: centerSquareSize.value,
				x1: x1.value,
				x2: x2.value,
				y1: y1.value,
				y2: y2.value,
			},
			useSkeletonGrid: true,
		})
	}, {
		deep: true,
	})

	const render = () => {
		const ctx = (canvas.value as unknown as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
		ctx.clearRect(0, 0, size.value, size.value)
	
		ctx.strokeStyle = '#811616'
		ctx.lineWidth = 2
		
		// grid
		ctx.beginPath()
		ctx.moveTo(0, y1.value)
		ctx.lineTo(size.value, y1.value)
		ctx.stroke()
		ctx.closePath()

		ctx.beginPath()
		ctx.moveTo(0, y2.value)
		ctx.lineTo(size.value, y2.value)
		ctx.stroke()
		ctx.closePath()

		ctx.beginPath()
		ctx.moveTo(x1.value, 0)
		ctx.lineTo(x1.value, size.value)
		ctx.stroke()
		ctx.closePath()

		ctx.beginPath()
		ctx.moveTo(x2.value, 0)
		ctx.lineTo(x2.value, size.value)
		ctx.stroke()
		ctx.closePath()

		// center
		ctx.beginPath()
		ctx.strokeStyle = '#153063'
		ctx.rect(size.value / 2 - centerSquareSize.value / 4, size.value / 2 - centerSquareSize.value / 4, centerSquareSize.value / 2, centerSquareSize.value / 2)
		ctx.stroke()
		ctx.closePath()

		// barycenter
		ctx.fillStyle = '#153063'
		ctx.lineWidth = 0
		ctx.beginPath()
		ctx.arc(
			barycenter.value[0] / 500 * size.value,
			barycenter.value[1] / 500 * size.value,
			20, 0, 2 * Math.PI
		)
		ctx.closePath()
		ctx.fill()
	}
</script>

<template>
	<div class="widget grid-controller">
		<canvas ref="canvas" :width="size" :height="size" :style="{
			width: '500px',
			height: '500px',
		}" :class="{
			'left-top': style === 'left-top',
			'right-top': style === 'right-top',
			'left-bottom': style === 'left-bottom',
			'right-bottom': style === 'right-bottom',
		}"></canvas>
	</div>
</template>

<style scoped>
  .left-top, .right-bottom {
    cursor: nwse-resize;
  }
  .left-bottom, .right-top {
    cursor: nesw-resize;
  }
	.grid-controller {
		background-color: white;
	}
</style>