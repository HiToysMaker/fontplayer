import { editCharacterFile, modifyCharacterFile } from '../../fontEditor/stores/files'
import { editGlyph, modifyGlyph } from '../../fontEditor/stores/glyph'
import { getCoord } from '../../utils/canvas'

// 画布移动工具初始化方法
// initializer for canvas moving tool
const initTranslateMover = (canvas: HTMLCanvasElement, glyph: boolean = false) => {
	const { translateX, translateY } = glyph ? editGlyph.value.view : editCharacterFile.value.view
	let mouseDownX = -1
	let mouseDownY = -1
	const onMouseDown = (e: MouseEvent) => {
		mouseDownX = e.clientX
		mouseDownY = e.clientY
		document.addEventListener('mousemove', onMouseMove)
		document.addEventListener('mouseup', onMouseUp)
	}
	const onMouseMove = (e: MouseEvent) => {
		if (!glyph) {
			modifyCharacterFile(editCharacterFile.value.uuid, {
				view: {
					translateX: translateX + getCoord(e.clientX - mouseDownX),
					translateY: translateY + getCoord(e.clientY - mouseDownY),
				}
			})
		} else {
			modifyGlyph(editGlyph.value.uuid, {
				view: {
					translateX: translateX + getCoord(e.clientX - mouseDownX),
					translateY: translateY + getCoord(e.clientY - mouseDownY),
				}
			})
		}
	}
	const onMouseUp = (e: MouseEvent) => {
		document.removeEventListener('mousemove', onMouseMove)
		document.removeEventListener('mouseup', onMouseUp)
	}
	canvas?.addEventListener('mousedown', onMouseDown)
	const closeMover = () => {
		canvas?.removeEventListener('mousedown', onMouseDown)
	}
	return closeMover
}

export {
	initTranslateMover,
}