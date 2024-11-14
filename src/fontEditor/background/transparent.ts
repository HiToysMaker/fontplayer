/**
 * 绘制透明背景
 * @param canvas 画布
 */

import { mapCanvasWidth } from "../../utils/canvas"
import { grid } from "../stores/global"

/**
 * paint transparent background
 * @param canvas canvas
 */
const transparent = (
  canvas: HTMLCanvasElement,
) => {
  const width = canvas.width
  const height = canvas.height
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D
  const d = mapCanvasWidth(grid.precision)
  for (let i = 0; i < width; i+=2*d) {
    for (let j = 0; j < height; j+=2*d) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(i, j, d, d)
      ctx.fillRect(i + d, j + d, d, d)
      ctx.fillStyle = '#EFEFEF'
      ctx.fillRect(i + d, j, d, d)
      ctx.fillRect(i, j + d, d, d)
    }
  }
}

export {
  transparent
}