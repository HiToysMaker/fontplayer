import { selectedFile } from '../stores/files'
import { width, height } from '../stores/global'
import { coordsText } from '../stores/font'

// 坐标查看工具初始化方法
// initializer for coords viewer tool
const initCoordsViewer = (canvas: HTMLCanvasElement, glyph: boolean = false) => {
	const onMouseMove = (e: MouseEvent) => {
		if (!glyph) {
			const unitsPerEm = selectedFile.value.fontSettings.unitsPerEm
			const coordX = e.offsetX / width.value * unitsPerEm
			const coordY = e.offsetY / height.value * unitsPerEm
			coordsText.value = `${coordX}, ${coordY}`
		} else {
			const unitsPerEm = 1000
			const coordX = e.offsetX / width.value * unitsPerEm
			const coordY = e.offsetY / height.value * unitsPerEm
			coordsText.value = `${coordX}, ${coordY}`
		}
	}
	canvas?.addEventListener('mousemove', onMouseMove)
	const closeMover = () => {
		canvas?.removeEventListener('mousemove', onMouseMove)
	}
	return closeMover
}

export {
	initCoordsViewer,
}