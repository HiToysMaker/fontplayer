import { toPixels } from '../../features/image'
import type { IComponent } from '../../fontEditor/stores/files'
import { genUUID } from "../../utils/string"


// 生成图片组件
// generate picture component
const genPictureComponent = async (data: string, maxWidth: number, maxHeight: number): Promise<IComponent> => {
	return new Promise((resolve, reject) => {
		const originImg = document.createElement('img')
		originImg.onload = () => {
			let w = originImg.width
			let h = originImg.height
			if (w > maxWidth || h > maxHeight) {
				if (h / maxHeight > w / maxWidth) {
					h = maxHeight
					w = originImg.width / originImg.height * h
				} else {
					w = maxWidth
					h= originImg.height / originImg.width * w
				}
			}
			const canvas = document.createElement('canvas')
			canvas.width = w
			canvas.height = h
			const ctx =canvas.getContext('2d') as CanvasRenderingContext2D
			ctx.drawImage(originImg, 0, 0, originImg.width, originImg.height, 0, 0, w, h)
			const img = document.createElement('img')
			const imgData = canvas.toDataURL()
			img.onload = () => {
				const pixels = toPixels(img)
				const component = {
					uuid: genUUID(),
					type: 'picture',
					name: 'picture',
					lock: false,
					visible: true,
					value: {
						data: imgData,
						img,
						pixels,
						originImg,
						pixelMode: false,
					},
					x: 0,
					y: 0,
					w,
					h,
					rotation: 0,
					flipX: false,
					flipY: false,
					opacity: 0.5,
					usedInCharacter: false,
				}
				//@ts-ignore
				resolve(component)
			}
			img.src = imgData
		}
		originImg.src = data
	})
}

export {
	genPictureComponent,
}