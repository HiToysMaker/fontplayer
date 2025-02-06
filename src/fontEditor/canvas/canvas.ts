import {
  IPenComponent,
  IPolygonComponent,
  IRectangleComponent,
  IEllipseComponent,
  IPictureComponent,
  orderedListWithItemsForCurrentCharacterFile,
  Component,
  IComponent,
  ICharacterFile,
  orderedListWithItemsForCharacterFile,
  selectedFile,
} from '../stores/files'
import { type IBackground, type IGrid, BackgroundType, GridType, background, grid } from '../stores/global'
import type { IPoint } from '../stores/pen'
import {
  mapCanvasCoords,
  mapCanvasX,
  mapCanvasY,
  mapCanvasWidth,
  mapCanvasHeight,
} from '../../utils/canvas'
import {
  getEllipsePoints,
  getRectanglePoints,
  transformPoints,
} from '../../utils/math'
import { mesh } from '../background/mesh'
import { transparent } from '../background/transparent'
import { fontRenderStyle } from '../stores/global'
import { ICustomGlyph, IGlyphComponent, editGlyph, executeScript, orderedListWithItemsForCurrentGlyph } from '../stores/glyph'
import { CustomGlyph } from '../programming/CustomGlyph'
import { layoutGrid } from '../background/layoutGrid'
import { PathType } from '../../fontManager'
import type {
	ILine,
	ICubicBezierCurve,
	IQuadraticBezierCurve,
} from '../../fontManager'
import { editStatus, Status } from '../stores/font'

/**
 * 清空画布
 * @param canvas 要被清空的画布
 */
/**
 * clear canvas
 * @param canvas canvas to be cleared
 */
const clearCanvas = (canvas: HTMLCanvasElement) => {
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

/**
 * 填充背景
 * @param canvas 画布
 * @param background 背景
 * @param grid 网格
 */
/**
 * fill background
 * @param canvas canvas
 * @param background background
 * @param grid grid
 */
const fillBackground = (canvas: HTMLCanvasElement, background: IBackground, grid: IGrid) => {
  const width = canvas.width
  const height = canvas.height
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D
  if (background.type === BackgroundType.Color) {
    ctx.fillStyle = background.color
    ctx.fillRect(0, 0, width, height)
  }
  if (background.type === BackgroundType.Transparent) {
    transparent(canvas)
  }
  if (grid.type === GridType.Mesh) {
    mesh(canvas, grid.precision)
  } else if (grid.type === GridType.LayoutGrid) {
    layoutGrid(canvas)
  }
}

interface IOption {
  fill?: boolean;
  offset?: {
    x: number,
    y: number,
  };
  scale?: number,
  forceUpdate?: boolean,
  grid?: any,
}

/**
 * 渲染画布
 * @param components 要被渲染在画布中的组件
 * @param canvas 画布
 * @param options 配置选项
 */
/**
 * render canvas
 * @param components components to be rendered
 * @param canvas canvas
 * @param options option
 */
const renderCanvas = (components: Array<Component>, canvas: HTMLCanvasElement, options: IOption = {
  fill: false,
  offset: { x: 0, y: 0 },
  scale: 1,
  forceUpdate: false,
}) => {
  const scale = options.scale//canvas.width / (selectedFile.value.fontSettings.unitsPerEm as number)
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D
  //ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.beginPath()
  components.map((component, index) => {
		// 如果组件不可见则跳过
		// skip if in-visible
    if (!component.visible) {
      return
    }

		// 渲染钢笔组件
		// render pen component
    if (component.type === 'pen') {
      const { x, y, w, h, rotation, flipX, flipY } = component as IComponent
      const _x = mapCanvasX(x) * scale
      const _y = mapCanvasY(y) * scale
      const _w = mapCanvasWidth(w) * scale
      const _h = mapCanvasHeight(h) * scale
      const {
        strokeColor,
        fillColor,
        points,
        closePath,
      } = component.value as unknown as IPenComponent
      ctx.strokeStyle = strokeColor || '#000'
      ctx.fillStyle = fillColor || 'rgba(0, 0, 0, 0)'
      if (fillColor === 'none') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      }
      // let _points = transformPoints(points, {
      //   x, y, w, h, rotation, flipX, flipY,
      // })
      let _points = transformPoints(points, {
        x, y, w, h, rotation: 0, flipX, flipY,
      })
      _points = _points.map((point: IPoint) => {
        return mapCanvasCoords({
          x: point.x * scale,
          y: point.y * scale,
        })
      })
      ctx.translate(mapCanvasX(options.offset.x), mapCanvasY(options.offset.y))
      ctx.translate(_x + _w / 2, _y + _h / 2)
      ctx.rotate(rotation * Math.PI / 180)
      ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
      ctx.moveTo(_points[0].x, _points[0].y)
      if (_points.length >= 4) {
        ctx.bezierCurveTo(_points[1].x, _points[1].y, _points[2].x, _points[2].y, _points[3].x, _points[3].y)
      }
      for (let i = 3; i < _points.length - 1; i += 3) {
        if (i + 3 >= _points.length) break
        ctx.bezierCurveTo(_points[i + 1].x, _points[i + 1].y, _points[i + 2].x, _points[i + 2].y, _points[i + 3].x, _points[i + 3].y)
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

		// 渲染多边形组件
		// render polygon component
    if (component.type === 'polygon') {
      const { x, y, w, h, rotation, flipX, flipY } = component as IComponent
      const _x = mapCanvasX(x) * scale
      const _y = mapCanvasY(y) * scale
      const _w = mapCanvasWidth(w) * scale
      const _h = mapCanvasHeight(h) * scale
      const {
        strokeColor,
        fillColor,
        points,
        closePath,
      } = component.value as unknown as IPolygonComponent
      ctx.strokeStyle = strokeColor || '#000'
      ctx.fillStyle = fillColor || 'rgba(0, 0, 0, 0)'
      let _points = transformPoints(points, {
        x, y, w, h, rotation: 0, flipX, flipY,
      })
      _points = _points.map((point: IPoint) => {
        return mapCanvasCoords({
          x: point.x * scale,
          y: point.y * scale,
        })
      })
      ctx.translate(mapCanvasX(options.offset.x), mapCanvasY(options.offset.y))
      ctx.translate(_x + _w / 2, _y + _h / 2)
      ctx.rotate(rotation * Math.PI / 180)
      ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
      // ctx.beginPath()
      ctx.moveTo(_points[0].x, _points[0].y)
      for (let i = 1; i < _points.length; i ++) {
        ctx.lineTo(_points[i].x, _points[i].y)
      }
      // if (closePath && fillColor) {
      //   ctx.fill()
      // }
      // ctx.stroke()
      // ctx.closePath()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

		// 渲染椭圆组件
		// render ellipse component
    if (component.type === 'ellipse') {
      const { x, y, w, h, rotation } = component as IComponent
      const _x = mapCanvasX(x) * scale
      const _y = mapCanvasY(y) * scale
      const _w = mapCanvasWidth(w) * scale
      const _h = mapCanvasHeight(h) * scale
      const {
        strokeColor,
        fillColor,
        closePath,
      } = component.value as unknown as IEllipseComponent
      const radiusX = _w / 2
      const radiusY = _h / 2
      const ellipseX = _x
      const ellipseY = _y
      ctx.strokeStyle = strokeColor || '#000'
      ctx.fillStyle = fillColor || 'rgba(0, 0, 0, 0)'
      ctx.translate(mapCanvasX(options.offset.x), mapCanvasY(options.offset.y))
      ctx.translate(_x + _w / 2, _y + _h / 2)
      ctx.rotate(rotation * Math.PI / 180)
      ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
      // ctx.beginPath()
      ctx.moveTo(ellipseX + 2 * radiusX, ellipseY + radiusY)
      ctx.ellipse(ellipseX + radiusX, ellipseY + radiusY, radiusX, radiusY, 0, 0, 2 * Math.PI)
      // ctx.fill()
      // ctx.stroke()
      // ctx.closePath()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

		// 渲染长方形组件
		// render rectangle component
    if (component.type === 'rectangle') {
      const { x, y, w, h, rotation } = component as IComponent
      const _x = mapCanvasX(x) * scale
      const _y = mapCanvasY(y) * scale
      const _w = mapCanvasWidth(w) * scale
      const _h = mapCanvasHeight(h) * scale
      const {
        strokeColor,
        fillColor,
        closePath,
      } = component.value as unknown as IRectangleComponent
      const rectWidth = _w
      const rectHeight = _h
      const rectX = _x
      const rectY = _y
      ctx.strokeStyle = strokeColor || '#000'
      ctx.fillStyle = fillColor || 'rgba(0, 0, 0, 0)'
      ctx.translate(mapCanvasX(options.offset.x), mapCanvasY(options.offset.y))
      ctx.translate(_x + _w / 2, _y + _h / 2)
      ctx.rotate(rotation * Math.PI / 180)
      ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
      // ctx.beginPath()
      ctx.rect(rectX, rectY, rectWidth, rectHeight)
      // if (fillColor) {
      //   ctx.fill()
      // }
      // ctx.stroke()
      // ctx.closePath()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

		// 渲染图片组件
		// render picture component
    if (component.type === 'picture') {
      const { x, y, w, h, rotation } = component as IComponent
      const _x = mapCanvasX(x) * scale
      const _y = mapCanvasY(y) * scale
      const _w = mapCanvasWidth(w) * scale
      const _h = mapCanvasHeight(h) * scale
      const {
        img,
        pixelMode,
        pixels,
      } = component.value as unknown as IPictureComponent
      if (!pixelMode) {
        if (component.opacity) {
          ctx.globalAlpha = component.opacity
        }
        ctx.translate(mapCanvasX(options.offset.x), mapCanvasY(options.offset.y))
        ctx.translate(_x + _w / 2, _y + _h / 2)
        ctx.rotate(rotation * Math.PI / 180)
        ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
        ctx.drawImage(img, _x, _y, _w, _h)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        if (component.opacity) {
          ctx.globalAlpha = 1.0
        }
      } else {
        if (component.opacity) {
          ctx.globalAlpha = component.opacity
        }
        ctx.translate(mapCanvasX(options.offset.x), mapCanvasY(options.offset.y))
        ctx.translate(_x + _w / 2, _y + _h / 2)
        ctx.rotate(rotation * Math.PI / 180)
        ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
        for (let i = 0; i < _w; i++) {
          for (let j = 0; j < _h; j++) {
            const originWidth = img.width
            const originHeight = img.height
            const col = Math.floor(i * originWidth / _w) 
            const row = Math.floor(j * originHeight / _h)
            const index = (row * originWidth + col) * 4
            ctx.fillStyle = `rgba(${pixels[index]}, ${pixels[index + 1]}, ${pixels[index + 2]}, ${pixels[index + 3]})`
            ctx.fillRect(i, j, 1, 1)
          }
        }
        if (component.opacity) {
          ctx.globalAlpha = 1.0
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0)
      }
    }

    // 渲染字形组件
		// render glyph component
    if (component.type === 'glyph') {
      if (
        !(component.value as unknown as ICustomGlyph)._o ||
        !(component.value as unknown as ICustomGlyph)._o.components ||
        !(component.value as unknown as ICustomGlyph)._o.components.length ||
        options.forceUpdate
      ) {
        executeScript(component.value as unknown as ICustomGlyph)
      }
			//executeScript(component.value as unknown as ICustomGlyph)
			const glyph = (component.value as unknown as ICustomGlyph)._o ? (component.value as unknown as ICustomGlyph)._o : new CustomGlyph((component.value as unknown as ICustomGlyph))
      if (options.forceUpdate) {
        glyph.render_forceUpdate(canvas, true, {
          x: options.offset.x + (component as IGlyphComponent).ox,
          y: options.offset.y + (component as IGlyphComponent).oy,
        }, false, scale)
      } else {
        glyph.render(canvas, true, {
          x: options.offset.x + (component as IGlyphComponent).ox,
          y: options.offset.y + (component as IGlyphComponent).oy,
        }, false, scale)
      }
    }
  })
  ctx.closePath()

	// 填充颜色
	// fill color
  if (fontRenderStyle.value === 'color' || options.fill) {
    ctx.fillStyle = '#000'
    //ctx.fill('evenodd')
    ctx.fill("nonzero")
  }
  ctx.stroke()
}

const computeCoords = (grid, point) => {
  let { dx, dy, size, centerSquareSize, x1, x2, y1, y2 } = grid
  if (!x1 || !x2 || !y1 || !y2) {
    x1 = Math.round((size - centerSquareSize) / 2) + dx
    x2 = Math.round((size - centerSquareSize) / 2 + centerSquareSize) + dx
    y1 = Math.round((size - centerSquareSize) / 2) + dy
    y2 = Math.round((size - centerSquareSize) / 2 + centerSquareSize) + dy
  }
  const { x, y } = point
  let _x = x
  let _y = y
  if (x < size / 3) {
    _x = x * x1 / (size / 3)
  } else if (x >= size / 3 && x < size * 2 / 3) {
    _x = x1 + (x - size / 3) * (x2 - x1) / (size / 3)
  } else {
    _x = x2 + (x - size * 2 / 3) * (size - x2) / (size / 3)
  }
  if (y < size / 3) {
    _y = y * y1 / (size / 3)
  } else if (y >= size / 3 && y < size * 2 / 3) {
    _y = y1 + (y - size / 3) * (y2 - y1) / (size / 3)
  } else {
    _y = y2 + (y - size * 2 / 3) * (size - y2) / (size / 3)
  }
  return {
    x: _x,
    y: _y,
  }
}

/**
 * 渲染Grid画布
 * @param components 要被渲染在画布中的组件
 * @param canvas 画布
 * @param options 配置选项
 */
/**
 * render grid canvas
 * @param components components to be rendered
 * @param canvas canvas
 * @param options option
 */
const renderGridCanvas = (components: Array<Component>, canvas: HTMLCanvasElement, options: IOption = {
  fill: false,
  offset: { x: 0, y: 0 },
  scale: 1,
  forceUpdate: false,
  grid: null
}) => {
  if (!options.grid) return
  const translate = (point) => {
    return {
      x: options.offset.x + point.x,
      y: options.offset.y + point.y,
    }
  }
  const grid = options.grid
  const scale = options.scale//canvas.width / (selectedFile.value.fontSettings.unitsPerEm as number)
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D
  //ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.beginPath()
  components.map((component, index) => {
		// 如果组件不可见则跳过
		// skip if in-visible
    if (!component.visible) {
      return
    }

		// 渲染钢笔组件
		// render pen component
    if (component.type === 'pen') {
      const { x, y, w, h, rotation, flipX, flipY } = component as IComponent
      const _x = mapCanvasX(x) * scale
      const _y = mapCanvasY(y) * scale
      const _w = mapCanvasWidth(w) * scale
      const _h = mapCanvasHeight(h) * scale
      const {
        strokeColor,
        fillColor,
        points,
        closePath,
      } = component.value as unknown as IPenComponent
      ctx.strokeStyle = strokeColor || '#000'
      ctx.fillStyle = fillColor || 'rgba(0, 0, 0, 0)'
      if (fillColor === 'none') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      }
      let _points = transformPoints(points, {
        x, y, w, h, rotation, flipX, flipY,
      })
      _points = _points.map((point: IPoint) => {
        const { x, y } = computeCoords(grid, translate(point))
        return mapCanvasCoords({
          x: x * scale,
          y: y * scale,
        })
      })
      // ctx.translate(mapCanvasX(options.offset.x), mapCanvasY(options.offset.y))
      // ctx.translate(_x + _w / 2, _y + _h / 2)
      // ctx.rotate(rotation * Math.PI / 180)
      // ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
			ctx.moveTo(_points[0].x, _points[0].y)
			for (let i = 1; i < _points.length - 2; i += 3) {
				ctx.bezierCurveTo(
					_points[i].x, _points[i].y,
					_points[i + 1].x, _points[i + 1].y,
					_points[i + 2].x, _points[i + 2].y,
				)
			}
      ctx.stroke()
			ctx.closePath()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

		// 渲染多边形组件
		// render polygon component
    if (component.type === 'polygon') {
      const { x, y, w, h, rotation, flipX, flipY } = component as IComponent
      const _x = mapCanvasX(x) * scale
      const _y = mapCanvasY(y) * scale
      const _w = mapCanvasWidth(w) * scale
      const _h = mapCanvasHeight(h) * scale
      const {
        strokeColor,
        fillColor,
        points,
        closePath,
      } = component.value as unknown as IPolygonComponent
      ctx.strokeStyle = strokeColor || '#000'
      ctx.fillStyle = fillColor || 'rgba(0, 0, 0, 0)'
      let _points = transformPoints(points, {
        x, y, w, h, rotation, flipX, flipY,
      })
      _points = _points.map((point: IPoint) => {
        const { x, y } = computeCoords(grid, translate(point))
        return mapCanvasCoords({
          x: x * scale,
          y: y * scale,
        })
      })
      // ctx.translate(mapCanvasX(options.offset.x), mapCanvasY(options.offset.y))
      // ctx.translate(_x + _w / 2, _y + _h / 2)
      // ctx.rotate(rotation * Math.PI / 180)
      // ctx.translate(-(_x + _w / 2), -(_y + _h / 2))
      ctx.beginPath()
			ctx.moveTo(_points[0].x, _points[0].y)
      for (let i = 1; i < _points.length; i ++) {
        ctx.lineTo(_points[i].x, _points[i].y)
      }
      // if (closePath && fillColor) {
      //   ctx.fill()
      // }
      ctx.stroke()
      ctx.closePath()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

		// 渲染椭圆组件
		// render ellipse component
    if (component.type === 'ellipse') {
      const { x, y, w, h, rotation } = component as IComponent
      const radiusX = w / 2
      const radiusY = h / 2
      const ellipseX = x
      const ellipseY = y
      let points = getEllipsePoints(
        radiusX,
        radiusY,
        1000,
        ellipseX + radiusX,
        ellipseY + radiusY,
      )
      let _points = transformPoints(points, {
        x, y, w, h, rotation, flipX: false, flipY: false,
      })
      _points = _points.map((point: IPoint) => {
        const { x, y } = computeCoords(grid, translate(point))
        return mapCanvasCoords({
          x: x * scale,
          y: y * scale,
        })
      })
      const {
        strokeColor,
        fillColor,
        closePath,
      } = component.value as unknown as IEllipseComponent
      ctx.beginPath()
			ctx.moveTo(_points[0].x, _points[0].y)
      for (let i = 1; i < _points.length; i ++) {
        ctx.lineTo(_points[i].x, _points[i].y)
      }
      ctx.lineTo(_points[0].x, _points[0].y)
      ctx.stroke()
      ctx.closePath()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

		// 渲染长方形组件
		// render rectangle component
    if (component.type === 'rectangle') {
      const { x, y, w, h, rotation } = component as IComponent
      const points = getRectanglePoints(
        w,
        h,
        x,
        y,
      )
      let _points = transformPoints(points, {
        x, y, w, h, rotation, flipX: false, flipY: false,
      })
      _points = _points.map((point: IPoint) => {
        const { x, y } = computeCoords(grid, translate(point))
        return mapCanvasCoords({
          x: x * scale,
          y: y * scale,
        })
      })
      const scale = options.scale
      const {
        strokeColor,
        fillColor,
        closePath,
      } = component.value as unknown as IRectangleComponent
      ctx.strokeStyle = strokeColor || '#000'
      ctx.fillStyle = fillColor || 'rgba(0, 0, 0, 0)'
      ctx.translate(mapCanvasX(options.offset.x) * scale, mapCanvasY(options.offset.y) * scale)
      ctx.beginPath()
			ctx.moveTo(_points[0].x, _points[0].y)
      for (let i = 1; i < _points.length; i ++) {
        ctx.lineTo(_points[i].x, _points[i].y)
      }
      ctx.lineTo(_points[0].x, _points[0].y)
      ctx.stroke()
      ctx.closePath()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

    // 渲染字形组件
		// render glyph component
    if (component.type === 'glyph') {
      if (
        !(component.value as unknown as ICustomGlyph)._o ||
        !(component.value as unknown as ICustomGlyph)._o.components ||
        !(component.value as unknown as ICustomGlyph)._o.components.length ||
        options.forceUpdate
      ) {
        executeScript(component.value as unknown as ICustomGlyph)
      }
			//executeScript(component.value as unknown as ICustomGlyph)
			const glyph = (component.value as unknown as ICustomGlyph)._o ? (component.value as unknown as ICustomGlyph)._o : new CustomGlyph((component.value as unknown as ICustomGlyph))
      if (options.forceUpdate) {
        glyph.render_grid_forceUpdate(canvas, true, {
          x: options.offset.x + (component as IGlyphComponent).ox,
          y: options.offset.y + (component as IGlyphComponent).oy,
        }, false, scale, grid)
      } else {
        glyph.render_grid(canvas, true, {
          x: options.offset.x + (component as IGlyphComponent).ox,
          y: options.offset.y + (component as IGlyphComponent).oy,
        }, false, scale, grid)
      }
    }
  })
  ctx.closePath()

	// 填充颜色
	// fill color
  if (fontRenderStyle.value === 'color' || options.fill) {
    ctx.fillStyle = '#000'
    //ctx.fill('evenodd')
    ctx.fill("nonzero")
  }
  ctx.stroke()
}

const render = (canvas: HTMLCanvasElement, renderBackground: Boolean = true, forceUpdate: boolean = false) => {
  clearCanvas(canvas as HTMLCanvasElement)
  if (renderBackground) {
    fillBackground(canvas as HTMLCanvasElement, background, grid)
  } else if (background.color) {
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = background.color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  if (editStatus.value === Status.Edit) {
    renderCanvas(orderedListWithItemsForCurrentCharacterFile.value, canvas as HTMLCanvasElement, {
      forceUpdate,
      fill: false,
      offset: { x: 0, y: 0 },
      scale: 1,
    })
  } else if (editStatus.value === Status.Glyph) {
    const glyph = editGlyph.value._o ? editGlyph.value._o : new CustomGlyph(editGlyph.value)
    renderGlyph(glyph, canvas, renderBackground, false, false)
  }
}

const renderPreview = (character: ICharacterFile, canvas: HTMLCanvasElement) => {
  clearCanvas(canvas as HTMLCanvasElement)
  renderCanvas(orderedListWithItemsForCharacterFile(character), canvas as HTMLCanvasElement, { fill: true })
}

const renderGlyphPreview = (glyph: ICustomGlyph, canvas: HTMLCanvasElement) => {
  const _glyph = glyph._o ? glyph._o : new CustomGlyph(glyph)
  _glyph.render(canvas, true, {
    x: 0,
    y: 0,
  }, true)
}

const renderGlyph = (
  glyph: CustomGlyph,
  canvas: HTMLCanvasElement,
  renderBackground: Boolean = true,
  renderJoints: Boolean = true,
  renderRefLines: Boolean = true,
  forceUpdate: boolean = false
) => {
  clearCanvas(canvas as HTMLCanvasElement)
  if (renderBackground) {
    fillBackground(canvas as HTMLCanvasElement, background, grid)
  } else if (background.color) {
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = background.color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  glyph.render_forceUpdate(canvas as HTMLCanvasElement)
  renderJoints && glyph.renderJoints(canvas as HTMLCanvasElement)
  renderRefLines && glyph.renderJoints(canvas as HTMLCanvasElement)
}

const renderPreview2 = (canvas: HTMLCanvasElement, contours: Array<Array<ILine | IQuadraticBezierCurve | ICubicBezierCurve>>) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.beginPath()
  for (let i = 0; i < contours.length; i++) {
    const contour = contours[i]
    if (!contour || !contour.length) continue
    ctx.moveTo(contour[0].start.x, contour[0].start.y)
    for (let j = 0; j < contour.length; j++) {
      const path = contour[j]
      if (path.type === PathType.LINE) {
        ctx.lineTo(path.end.x, path.end.y)
      } else if (path.type === PathType.CUBIC_BEZIER) {
        ctx.bezierCurveTo(
          path.control1.x, path.control1.y,
          path.control2.x, path.control2.y,
          path.end.x, path.end.y
        )
      }
    }
    // ctx.closePath()
    //ctx.fillStyle = '#000'
    //ctx.fill()
  }
  ctx.closePath()
  ctx.fillStyle = '#000'
  ctx.fill("nonzero")
}

export {
  clearCanvas,
  renderCanvas,
  fillBackground,
  render,
  renderGlyph,
  renderPreview,
  renderPreview2,
  renderGlyphPreview,
  renderGridCanvas,
  computeCoords,
}