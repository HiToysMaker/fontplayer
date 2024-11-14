<script lang="ts" setup>
	import { ref, type Ref, toRefs, onMounted, watch, computed } from 'vue'
	const props = defineProps({
		radius: Object({
			min: Number,
			max: Number,
			value: Number,
			name: String,
		}),
		degree: Object({
			min: Number,
			max: Number,
			value: Number,
			name: String,
		}),
		params: Array<{
			name: string,
			value: Number,
			min: Number,
			max: Number,
		}>,
		size: {
			type: Number,
			default: 50,
		},
		onChange: Function,
	})
	const { radius, degree, params, size, onChange } = toRefs(props)
	const canvas: Ref<HTMLCanvasElement> = ref(null)
	const outerSize = 12
	const innerSize = size.value - outerSize * 2//size.value > outerSize * 2 + 50 ? size.value - outerSize * 2 : 50
	const toRadian = (degree) => Math.PI / 180 * degree
	const toDegree = (radian) => radian / Math.PI * 180
	onMounted(() => {
		render()
		canvas.value.addEventListener('mousedown', onMouseDown)
	})
	const distance = (x1, y1, x2, y2) => {
		return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
	}
	const _radius = computed(() => {
		return innerSize / 2 / (radius.value.max - radius.value.min) * (radius.value.value - radius.value.min)
	})
	const status = ref('defualt')
	let paramIndex = -1
	let lastX = -1
	let lastY = -1
	const onMouseDown = (e: MouseEvent) => {
		if (distance(
			e.offsetX, e.offsetY,
			size.value / 2 + (_radius?.value as number) * Math.cos(toRadian(degree?.value.value)),
			size.value / 2 - (_radius?.value as number) * Math.sin(toRadian(degree?.value.value)),
		) <= 5) {
			document.body.addEventListener('mousemove', onMouseMove)
			document.body.addEventListener('mouseup', onMouseUp)
			lastX = e.offsetX
			lastY = e.offsetY
			status.value = 'inner-move'
		}
		for (let i = 0; i < (params?.value as any).length; i++) {
			const data = (params?.value as any)[i]
			const start = 2 * Math.PI * i / (params?.value as any).length
			const end = start + 2 * Math.PI / (params?.value as any).length

			const R = size.value / 2 - outerSize / 2
			const angle = start + (end - start) / (data.max - data.min) * (data.value - data.min)

			if (distance(
				e.offsetX, e.offsetY,
				size.value / 2 + R * Math.cos(angle),
				size.value / 2 + R * Math.sin(angle),
			) <= 5) {
				document.body.addEventListener('mousemove', onMouseMove)
				document.body.addEventListener('mouseup', onMouseUp)
				lastX = e.offsetX
				lastY = e.offsetY
				paramIndex = i
				status.value = 'outer-move'
			}
		}
	}
	const onMouseMove = (e: MouseEvent) => {
		switch (status.value) {
			case 'inner-move': {
				const r = distance(
					e.offsetX, e.offsetY,
					size.value / 2,
					size.value / 2,
				)
				const radius_value = radius.value.min + r / (innerSize / 2) * (radius.value.max - radius.value.min)
				if (r <= innerSize / 2) {
					let _angle = Math.atan2(-(e.offsetY - size.value / 2), (e.offsetX - size.value / 2))
					if (_angle < 0 && degree.value.max > 180) _angle += Math.PI * 2
					const _degree = toDegree(_angle)
					let degree_value = degree.value.value
					if (_degree >= degree.value.min && _degree <= degree.value.max) {
						degree_value = _degree
					}
					// degree.value = _degree
					// radius.value = _radius
					onChange.value(radius_value, degree_value, Object.assign([], params.value))
					lastX = e.offsetX
					lastY = e.offsetY
					status.value = 'inner-move'
				}
				break
			}
			case 'outer-move': {
				let _angle = Math.atan2((e.offsetY - size.value / 2), (e.offsetX - size.value / 2))
				if (_angle < 0) _angle += Math.PI * 2
				const param = params.value[paramIndex]
				const start = 2 * Math.PI * paramIndex / (params?.value as any).length
				const end = start + 2 * Math.PI / (params?.value as any).length
				const _degree = toDegree(_angle)
				const _value = (param.min as number) + (_degree - toDegree(start)) / (toDegree(end) - toDegree(start)) * ((param.max as number) - (param.min as number))
				if ((_value as Number) >= param.min && (_value as Number) <= param.max) {
					const _params = Object.assign([], params.value)
					_params[paramIndex].value = _value
					onChange.value(radius.value.value, degree.value.value, _params)
					lastX = e.offsetX
					lastY = e.offsetY
					status.value = 'outer-move'
				}
				break
			}
		}
	}
	const onMouseUp = () => {
		status.value = 'defualt'
		lastX = -1
		lastY = -1
		paramIndex = -1
		document.body.removeEventListener('mousemove', onMouseMove)
		document.body.removeEventListener('mouseup', onMouseUp)
	}
	watch([radius, degree, params, size], () => {
		render()
	}, {
		deep: true,
	})
	const render = () => {
		const ctx = (canvas.value as unknown as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
		
		// outer ring
		// 外环
		for (let i = 0; i < (params?.value as any).length; i++) {
			const data = (params?.value as any)[i]
			const start = 2 * Math.PI * i / (params?.value as any).length
			const end = start + 2 * Math.PI / (params?.value as any).length

			const R = size.value / 2 - outerSize / 2
			const angle = start + (end - start) / (data.max - data.min) * (data.value - data.min)

			ctx.fillStyle = '#153063'
			ctx.beginPath()
			ctx.arc(size.value / 2, size.value / 2, size.value / 2, start, end)
			ctx.lineTo(size.value / 2, size.value / 2)
			ctx.closePath()
			ctx.fill()

			ctx.fillStyle = 'white'
			ctx.beginPath()
			ctx.arc(size.value / 2, size.value / 2, size.value / 2, start + toRadian(2), end - toRadian(2))
			ctx.lineTo(size.value / 2, size.value / 2)
			ctx.closePath()
			ctx.fill()

			// outer ring value mark
			// 外环数值标注
			ctx.fillStyle = '#153063'
			ctx.beginPath()
			ctx.arc(
				size.value / 2 + R * Math.cos(angle),
				size.value / 2 + R * Math.sin(angle),
				5, 0, 2 * Math.PI
			)
			ctx.closePath()
			ctx.fill()
		}

		// inner ring
		// 内环
		ctx.fillStyle = '#153063'
		ctx.beginPath()
		ctx.arc(size.value / 2, size.value / 2, innerSize / 2, 0, 2 * Math.PI)
		ctx.closePath()
		ctx.fill()
		ctx.fillStyle = 'white'
		ctx.beginPath()
		ctx.arc(size.value / 2, size.value / 2, innerSize / 2, -toRadian(degree.value.min), -toRadian(degree.value.min) - toRadian(degree.value.max - degree.value.min), true)
		ctx.lineTo(size.value / 2, size.value / 2)
		ctx.closePath()
		ctx.fill()
		ctx.strokeStyle = '#153063'
		ctx.lineWidth = 2
		ctx.beginPath()
		ctx.arc(size.value / 2, size.value / 2, innerSize / 2, 0, 2 * Math.PI)
		ctx.closePath()
		ctx.stroke()


		if (degree.value.min === 0 && degree.value.max === 360) {
			// start degree mark
			// 起始标注
			ctx.beginPath()
			ctx.moveTo(size.value / 2, size.value / 2)
			ctx.lineTo(size.value, size.value / 2)
			ctx.closePath()
			ctx.stroke()
		}


		// inner ring value mark
		// 内环数值标注
		ctx.fillStyle = '#153063'
		ctx.beginPath()
		ctx.arc(
			size.value / 2 + (_radius?.value as number) * Math.cos(toRadian(degree?.value.value)),
			size.value / 2 - (_radius?.value as number) * Math.sin(toRadian(degree?.value.value)),
			5, 0, 2 * Math.PI
		)
		ctx.closePath()
		ctx.fill()
	}
</script>

<template>
	<div class="widget ringController">
		<canvas ref="canvas" :width="size" :height="size"></canvas>
	</div>
</template>