import type { IComponent } from "../fontEditor/stores/files"
import type { IPoint as IPenPoint } from "../fontEditor/stores/pen"
import * as R from 'ramda'

interface IPoint {
  x: number;
  y: number;
}

interface IVector {
  x: number;
  y: number;
}

const isNearPoint = (x1: number, y1: number, x2: number, y2: number, d: number) => {
  return !!(distance(x1, y1, x2, y2) <= d)
}

const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1))
}

const leftTop = (x1: number, y1: number, x2: number, y2: number, d: number) => {
  if (distance(x1, y1, x2, y2) > 4 * d) return false
  if (distance(x1, y1, x2, y2) < 2 * d) return false
  if (x1 < x2 && y1 < y2) return true
  return false
}

const leftBottom = (x1: number, y1: number, x2: number, y2: number, d: number) => {
  if (distance(x1, y1, x2, y2) > 4 * d) return false
  if (distance(x1, y1, x2, y2) < 2 * d) return false
  if (x1 < x2 && y1 > y2) return true
  return false
}

const rightTop = (x1: number, y1: number, x2: number, y2: number, d: number) => {
  if (distance(x1, y1, x2, y2) > 4 * d) return false
  if (distance(x1, y1, x2, y2) < 2 * d) return false
  if (x1 > x2 && y1 < y2) return true
  return false
}

const rightBottom = (x1: number, y1: number, x2: number, y2: number, d: number) => {
  if (distance(x1, y1, x2, y2) > 4 * d) return false
  if (distance(x1, y1, x2, y2) < 2 * d) return false
  if (x1 > x2 && y1 > y2) return true
  return false
}

const angleBetween = (vec1: IVector, vec2: IVector) => {
  const angle1 = Math.atan(vec1.y / vec1.x)
  const angle2 = Math.atan(vec2.y / vec2.x)
  return Math.round((angle1 - angle2) * 180 / Math.PI)
}

const getBound = (points: Array<{x: number, y: number}>) => {
  let minx = Infinity
  let miny = Infinity
  let maxx = -Infinity
  let maxy = -Infinity
  for (let i = 0; i < points.length; i++) {
    if (points[i].x < minx) {
      minx = points[i].x
    }
    if (points[i].x > maxx) {
      maxx = points[i].x
    }
    if (points[i].y < miny) {
      miny = points[i].y
    }
    if (points[i].y > maxy) {
      maxy = points[i].y
    }
  }
  return {
    x: minx,
    y: miny,
    w: maxx - minx,
    h: maxy - miny,
  }
}

const rotatePoint = (point: IPoint, center: IPoint, angle: number) => {
  const _angle = angle * Math.PI / 180
  return {
    x: center.x + (point.x - center.x) * Math.cos(_angle) - (point.y - center.y) * Math.sin(_angle),
    y: center.y + (point.x - center.x) * Math.sin(_angle) + (point.y - center.y) * Math.cos(_angle),
  }
}

const inComponentBound = (
  point: {x: number, y: number},
  component: any,
  d=0,
) => {
  const { x, y, w, h, rotation } = component
  const { x: _x, y: _y } = rotatePoint(
    { x: point.x, y: point.y },
    { x: component.x + component.w / 2, y: component.y + component.h / 2 },
    -rotation,
  )
  if (_x >= x - d && _x <= x + w + d && _y >= y - d && _y <= y + h + d) {
    return true
  }
  return false
}

const transformPoints = (
  points: Array<{ x: number, y: number }>,
  transform: {
    x: number,
    y: number,
    w: number,
    h: number,
    rotation: number,
    flipX: boolean,
    flipY: boolean,
  },
) => {
  const { x: origin_x, y: origin_y, w: origin_w, h: origin_h } = getBound(points)
  const { x, y, w, h, rotation, flipX, flipY } = transform
  const _points: Array<{
    x: number,
    y: number,
  }> = points.map((point: {
    x: number,
    y: number,
  }) => {
    let _point = R.clone(point)
    if (flipX) {
      _point.x = x + w / 2 + ((x + w / 2) - _point.x)
    }
    if (flipY) {
      _point.y = y + h / 2 + ((y + h / 2) - _point.y)
    }
    _point = rotatePoint(_point, {
      x: origin_x + origin_w / 2,
      y: origin_y + origin_h / 2
    }, rotation)
    _point = {
      x: _point.x + (x - origin_x),
      y: _point.y + (y - origin_y),
    }
    _point = {
      x: x + (origin_w ? (_point.x - x) * w / origin_w : 0),
      y: y + (origin_h ? (_point.y - y) * h / origin_h : 0),
    }
    return _point
  })
  return _points
}

const getEllipsePoints = (
  radiusX: number,
  radiusY: number,
  n: number = 1000,
  originX : number = 0,
  originY: number = 0
) => {
  const points1 = []
  const points2 = []
  for (let i = 0; i < n / 2; i++) {
    const x = -radiusX + radiusX * 2 / (n / 2) * i
    const y = Math.sqrt((1 - (x * x) / (radiusX * radiusX)) * radiusY * radiusY)
    points1.push({
      x: originX + x,
      y: originY + y,
    })
    points2.push({
      x: originX + x,
      y: originY - y,
    })
  }
  return points1.concat(points2.reverse())
}

const getRectanglePoints = (
  rectX: number,
  rectY: number,
  originX: number,
  originY: number,
) => {
  return [{
    x: originX,
    y: originY,
  }, {
    x: originX + rectX,
    y: originY,
  }, {
    x: originX + rectX,
    y: originY + rectY,
  }, {
    x: originX,
    y: originY + rectY,
  }]
}

export {
  isNearPoint,
  distance,
  getBound,
  rotatePoint,
  inComponentBound,
  leftTop,
  leftBottom,
  rightTop,
  rightBottom,
  angleBetween,
  transformPoints,
  getEllipsePoints,
  getRectanglePoints,
}