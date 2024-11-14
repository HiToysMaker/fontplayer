/**
 * 图像处理相关的一些基础方法
 */
/**
 * some methods for image processing
 */

import * as R from 'ramda'

const toPixels = (image: HTMLImageElement) => {
	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
	canvas.width = image.width
	canvas.height = image.height
	ctx?.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height)
	const pixels: Uint8ClampedArray = ctx?.getImageData(0, 0, canvas.width, canvas.height).data as Uint8ClampedArray
	return pixels
}

const reversePixels = (pixels: Uint8ClampedArray | Array<number>, width: number, height: number) => {
	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
	canvas.width = width
	canvas.height = height
	for (let i = 0; i < width; i++) {
		for (let j = 0; j < height; j++) {
			const index = (j * width + i) * 4
			ctx.fillStyle = `rgba(${255 - pixels[index]}, ${255 - pixels[index + 1]}, ${255 - pixels[index + 2]}, ${255 - pixels[index + 3]})`
			ctx.fillRect(i, j, 1, 1)
		}
	}
	const _pixels: Uint8ClampedArray = ctx?.getImageData(0, 0, canvas.width, canvas.height).data as Uint8ClampedArray
	return {
		pixels: _pixels,
		canvas,
	}
}

const toBlackWhiteBitMap = (data: Uint8ClampedArray | Array<number>, thresholds: {
	r: number,
	g: number,
	b: number,
}, options: {
	x: number,
	y: number,
	size: number,
	width: number,
	height: number,
}) => {
	const pixels = R.clone(data)
	const { x, y, width, height, size } = options
	let w = size
	let h = size
	if (size < 0) {
		w = width
		h = height
	}
	for (let i = x; i < x + w; i++) {
		for (let j = y; j < y + h; j++) {
			if (i > width || i < 0) continue
			if (j > height || j < 0) continue
			const { r, g, b, a }: {
				r: number, g: number, b: number, a: number
			} = {
				r: data[(j * width + i) * 4],
				g: data[(j * width + i) * 4 + 1],
				b: data[(j * width + i) * 4 + 2],
				a: data[(j * width + i) * 4 + 3],
			}
			if (r > thresholds.r || g > thresholds.g || b > thresholds.b) {
				pixels[(j * width + i) * 4] = 255
				pixels[(j * width + i) * 4 + 1] = 255
				pixels[(j * width + i) * 4 + 2] = 255
				pixels[(j * width + i) * 4 + 3] = 1
			} else {
				pixels[(j * width + i) * 4] = 0
				pixels[(j * width + i) * 4 + 1] = 0
				pixels[(j * width + i) * 4 + 2] = 0
				pixels[(j * width + i) * 4 + 3] = 1
			}
		}
	}
	return pixels
}

const pixelsToCanvas = (pixels: Uint8ClampedArray | Array<number>, width: number, height: number) => {
	const canvas: HTMLCanvasElement = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
	for (let i = 0; i < width; i++) {
		for (let j = 0; j < height; j++) {
			const index = (j * width + i) * 4
			ctx.fillStyle = `rgba(${pixels[index]}, ${pixels[index + 1]}, ${pixels[index + 2]}, ${pixels[index + 3]})`
			ctx.fillRect(i, j, 1, 1)
		}
	}
	return canvas
}

const pixelsToImage = async (pixels: Uint8ClampedArray | Array<number>, width: number, height: number) => {
	return new Promise((resolve, reject) => {
		const canvas: HTMLCanvasElement = document.createElement('canvas')
		canvas.width = width
		canvas.height = height
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
		for (let i = 0; i < width; i++) {
			for (let j = 0; j < height; j++) {
				const index = (j * width + i) * 4
				ctx.fillStyle = `rgba(${pixels[index]}, ${pixels[index + 1]}, ${pixels[index + 2]}, ${pixels[index + 3]})`
				ctx.fillRect(i, j, 1, 1)
			}
		}
		const data = canvas.toDataURL()
		const img = document.createElement('img')
		img.onload = () => {
			resolve({
				image: img, data,
			})
		}
		img.src = data
	})
}

export {
	toPixels,
	toBlackWhiteBitMap,
	pixelsToImage,
	pixelsToCanvas,
	reversePixels,
}