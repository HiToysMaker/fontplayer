const tiao_horizonalSpan = glyph.getParam('挑-水平延伸')
const tiao_verticalSpan = glyph.getParam('挑-竖直延伸')
const na_horizonalSpan = glyph.getParam('捺-水平延伸')
const na_verticalSpan = glyph.getParam('捺-竖直延伸')
const na_bendCursor = glyph.getParam('捺-弯曲游标')
const na_bendDegree = glyph.getParam('捺-弯曲度')
const weight = glyph.getParam('字重') || 40
const ox = 500
const oy = 500

const refline = (p1, p2) => {
  return {
    name: `${p1.name}-${p2.name}`,
    start: p1.name,
    end: p2.name,
  }
}

const distance = (p1, p2) => {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}

// 挑
const tiao_start = new FP.Joint(
  'tiao_start',
  {
    x: ox - (na_horizonalSpan + tiao_horizonalSpan) / 2,
    y: oy + na_verticalSpan / 2,
  },
)
const tiao_end = new FP.Joint(
  'tiao_end',
  {
    x: tiao_start.x + tiao_horizonalSpan,
    y: tiao_start.y - tiao_verticalSpan,
  },
)

// 捺
const na_start = tiao_end
const na_end = new FP.Joint(
  'na_end',
  {
    x: na_start.x + na_horizonalSpan,
    y: na_start.y + na_verticalSpan,
  },
)

const na_bend = new FP.Joint(
  'na_bend',
  {
    x: na_start.x + na_horizonalSpan * na_bendCursor,
    y: na_start.y + na_bendDegree,
  },
)

glyph.addJoint(tiao_start)
glyph.addJoint(tiao_end)
glyph.addJoint(na_start)
glyph.addJoint(na_end)
glyph.addJoint(na_bend)

const skeleton = {
  tiao_start,
  tiao_end,
  na_start,
  na_bend,
  na_end,
}

glyph.addRefLine(refline(tiao_start, tiao_end))
glyph.addRefLine(refline(na_start, na_bend))
glyph.addRefLine(refline(na_bend, na_end))

const getComponents = (skeleton) => {
  // 根据骨架计算轮廓关键点

  const {
    tiao_start,
    tiao_end,
    na_start,
    na_bend,
    na_end,
  } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_tiao_start, out_tiao_end, in_tiao_start, in_tiao_end } = FP.getLineContours('tiao', { tiao_start, tiao_end }, weight, {
    unticlockwise: true,
  })
  const { out_na_curves, out_na_points, in_na_curves, in_na_points } = FP.getCurveContours('na', { na_start, na_bend, na_end }, weight, {
    unticlockwise: true,
  })
  const { corner: in_corner_tiao_na } = FP.getIntersection(
    { type: 'line', start: in_tiao_start, end: in_tiao_end },
    { type: 'line', start: in_na_curves[0].start, end: in_na_curves[0].control1 },
  )
  const { corner: out_corner_tiao_na, corner_index: out_corner_index_tiao_na } = FP.getIntersection(
    { type: 'curve', points: out_na_points },
    { type: 'line', start: out_tiao_start, end: out_tiao_end },
  )
  const { curves: out_na_curves_final } = FP.fitCurvesByPoints(out_na_points.slice(out_corner_index_tiao_na))

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制左侧（外侧）轮廓
  pen.moveTo(out_tiao_start.x, out_tiao_start.y)
  pen.lineTo(out_corner_tiao_na.x, out_corner_tiao_na.y)
  for (let i = 0; i < out_na_curves_final.length; i++) {
    const curve = out_na_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(in_na_curves[in_na_curves.length - 1].end.x, in_na_curves[in_na_curves.length - 1].end.y)

  // 绘制横的右侧（内侧）轮廓
  for (let i = in_na_curves.length - 1; i >= 0; i--) {
    const curve = in_na_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  pen.lineTo(in_corner_tiao_na.x, in_corner_tiao_na.y)
  pen.lineTo(in_tiao_start.x, in_tiao_start.y)

  // 绘制轮廓连接线
  pen.lineTo(out_tiao_start.x, out_tiao_start.y)

  pen.closePath()
  return [ pen ]
}

const components = getComponents(skeleton)
for (let i = 0; i < components.length; i++) {
  glyph.addComponent(components[i])
}