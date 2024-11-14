import {
  mapCanvasWidth,
  mapCanvasHeight,
} from '../../utils/canvas'
import { selectedFile } from '../stores/files'

/**
 * 绘制网格背景
 * @param canvas 画布
 * @param precision 精度
 */
/**
 * paint mesh background
 * @param canvas canvas
 * @param precision precision
 */
const mesh = (
  canvas: HTMLCanvasElement,
  precision: number,
) => {
  const {
    unitsPerEm,
    descender,
  } = selectedFile.value.fontSettings

  const fontWidth = 0.8 * unitsPerEm
  const fontHeight = 0.6 * unitsPerEm
  const gaps = 16

  const width = canvas.width
  const height = canvas.height
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.fillStyle = '#dcdfe6'
  const deltaX = mapCanvasWidth(precision)
  const deltaY = mapCanvasHeight(precision)
  ctx.fillRect(0, 0, width, height)
  // for (let i = 0; i <= width; i += deltaX) {
  //   ctx.beginPath()
  //   ctx.moveTo(i, 0)
  //   ctx.lineTo(i, height)
  //   ctx.closePath()
  //   ctx.stroke()
  // }
  // for (let i = 0; i <= height; i += deltaY) {
  //   ctx.beginPath()
  //   ctx.moveTo(0, i)
  //   ctx.lineTo(width, i)
  //   ctx.closePath()
  //   ctx.stroke()
  // }

  const left = (width - mapCanvasWidth(fontWidth)) / 2
  const right = left + mapCanvasWidth(fontWidth)
  const top = height + mapCanvasHeight(descender) - mapCanvasHeight(fontHeight)
  const bold = [0, 8, 16]
  const bottom = top + mapCanvasHeight(fontHeight)
  for (let i = 0; i <= gaps; i++) {
    const x = left + mapCanvasWidth(fontWidth) / gaps * i
    ctx.strokeStyle = bold.indexOf(i) !== -1 ? '#811616' : '#cda2a2'
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.closePath()
    ctx.stroke()
  }
  for (let i = 0; i <= gaps; i++) {
    const y = top + mapCanvasHeight(fontHeight) / gaps * i
    ctx.strokeStyle = bold.indexOf(i) !== -1 ? '#811616' : '#cda2a2'
    ctx.beginPath()
    ctx.moveTo(left, y)
    ctx.lineTo(right, y)
    ctx.closePath()
    ctx.stroke()
  }
}

export {
  mesh
}