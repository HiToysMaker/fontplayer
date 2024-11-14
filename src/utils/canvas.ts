import { selectedFile } from '../fontEditor/stores/files'
import { editStatus, Status } from '../fontEditor/stores/font'
import { width } from '../fontEditor/stores/global'

const ratio = 2
const default_unitsPerEm = 1000

export const mapCanvasCoords = (point: { x: number, y: number }) => {
  return {
    x: ratio * point.x,
    y: ratio * point.y,
  }
}

export const mapCanvasX = (x: number) => {
  return ratio * x
}

export const mapCanvasY = (y: number) => {
  return ratio * y
}

export const mapCanvasWidth = (width: number) => {
  return ratio * width
}

export const mapCanvasHeight = (height: number) => {
  return ratio * height
}

export const unMapCanvasWidth = (width: number) => {
  return width / ratio
}

export const unMapCanvasHeight = (height: number) => {
  return height / ratio
}

export const getCoord = (coord: number) => {
  if (editStatus.value === Status.Edit) {
    return coord / width.value * selectedFile.value.width
  } else if (editStatus.value === Status.Glyph) {
    return coord / width.value * default_unitsPerEm
  }
  return coord
}