const xie_horizonalSpan = glyph.getParam('斜-水平延伸')
const xie_verticalSpan = glyph.getParam('斜-竖直延伸')
const xie_bendCursor = glyph.getParam('斜-弯曲游标')
const xie_bendDegree = glyph.getParam('斜-弯曲度')
const gou_horizonalSpan = glyph.getParam('钩-水平延伸')
const gou_verticalSpan = glyph.getParam('钩-竖直延伸')
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

// 斜
const xie_start = new FP.Joint(
  'xie_start',
  {
    x: ox - xie_horizonalSpan / 2,
    y: oy - xie_verticalSpan / 2,
  },
)
const xie_end = new FP.Joint(
  'xie_end',
  {
    x: ox + xie_horizonalSpan / 2,
    y: oy + xie_verticalSpan / 2,
  },
)

const xie_length = distance(xie_start, xie_end)
const xie_cursor_x = xie_start.x + xie_bendCursor * xie_horizonalSpan
const xie_cursor_y = xie_start.y + xie_bendCursor * xie_verticalSpan
const xie_angle = Math.atan2(xie_verticalSpan, xie_horizonalSpan)

const xie_bend = new FP.Joint(
  'xie_bend',
  {
    x: xie_cursor_x - xie_bendDegree * Math.sin(xie_angle),
    y: xie_cursor_y + xie_bendDegree * Math.cos(xie_angle),
  },
)

// 钩
const gou_start = xie_end
const gou_end = new FP.Joint(
  'gou_end',
  {
    x: gou_start.x + gou_horizonalSpan,
    y: gou_start.y - gou_verticalSpan,
  },
)

glyph.addJoint(xie_start)
glyph.addJoint(xie_end)
glyph.addJoint(xie_bend)
glyph.addJoint(gou_start)
glyph.addJoint(gou_end)

const skeleton = {
  xie_start,
  xie_bend,
  xie_end,
  gou_start,
  gou_end,
}

glyph.addRefLine(refline(xie_start, xie_bend))
glyph.addRefLine(refline(xie_bend, xie_end))
glyph.addRefLine(refline(gou_start, gou_end))

const bending_degree = glyph.getParam('弯曲程度')

const getLength = (horizonalSpan, verticalSpan) => {
  return Math.sqrt(horizonalSpan * horizonalSpan + verticalSpan * verticalSpan)
}

const getDistance = (p1, p2) => {
  if(!p1 || !p2) return 0
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
}

const getRadiusPoint = (options) => {
  const { start, end, radius } = options
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const point = {
    x: start.x + Math.cos(angle) * radius,
    y: start.y + Math.sin(angle) * radius,
  }
  return point
}

const getComponents = (skeleton) => {
  // 根据骨架计算轮廓关键点

  const {
    xie_start,
    xie_bend,
    xie_end,
    gou_start,
    gou_end,
  } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_xie_curves, out_xie_points, in_xie_curves, in_xie_points } = FP.getCurveContours('xie', { xie_start, xie_bend, xie_end }, weight, {
    unticlockwise: true,   
  })
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight, {
    unticlockwise: true,
  })
  const { corner: in_corner_xie_gou, corner_index: in_corner_index_xie_gou } = FP.getIntersection(
    { type: 'curve', points: in_xie_points },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_xie_gou } = FP.getIntersection(
    { type: 'line', start: out_xie_curves[out_xie_curves.length - 1].control2, end: out_xie_curves[out_xie_curves.length - 1].end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )
  let { curves: in_xie_curves_final } = FP.fitCurvesByPoints(in_xie_points.slice(0, in_corner_index_xie_gou))

  // 计算弯钩拐角处内外圆角相关的点与数据
  let in_radius = 30 * bending_degree
  let out_radius = 30 * bending_degree
  // 如果in_radius超出钩或弯的长度，取钩或弯的最小长度
  const in_radius_min_length = Math.min(
    getDistance(in_corner_index_xie_gou, in_gou_end),
    getDistance(in_corner_index_xie_gou, in_xie_curves_final[0].start),
  )
  const out_radius_min_length = Math.min(
    getLength(gou_horizonalSpan, gou_verticalSpan),
    getDistance(out_xie_curves[0].start, out_xie_curves[out_xie_curves.length - 1].end),
  )
  if (in_radius >= in_radius_min_length) {
    in_radius = in_radius_min_length
  }
  if (out_radius >= out_radius_min_length) {
    out_radius = out_radius_min_length
  }
  const in_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(in_xie_curves_final), in_radius, true)
  const in_radius_control = FP.getIntersection(
    { type: 'line', start: in_radius_data.tangent.start, end: in_radius_data.tangent.end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  ).corner
  const in_radius_start = in_radius_data.point
  const in_radius_end = getRadiusPoint({
    start: in_radius_control,
    end: in_gou_end,
    radius: in_radius,
  })
  const out_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(out_xie_curves), out_radius, true)
  const out_radius_control = FP.getIntersection(
    { type: 'line', start: out_radius_data.tangent.start, end: out_radius_data.tangent.end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  ).corner
  const out_radius_start = out_radius_data.point
  const out_radius_end = getRadiusPoint({
    start: out_radius_control,
    end: out_gou_end,
    radius: out_radius,
  })
  in_xie_curves_final = in_radius_data.final_curves
  const out_xie_curves_final = out_radius_data.final_curves

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制左侧（外侧）侧轮廓
  pen.moveTo(out_xie_curves_final[0].start.x, out_xie_curves_final[0].start.y)
  for (let i = 0; i < out_xie_curves_final.length; i++) {
    const curve = out_xie_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  // 绘制外侧圆角
  pen.quadraticBezierTo(out_radius_control.x, out_radius_control.y, out_radius_end.x, out_radius_end.y)
  pen.lineTo(out_gou_end.x, out_gou_end.y)

  // 绘制轮廓连接线
  pen.lineTo(in_gou_end.x, in_gou_end.y)

  // 绘制右侧（内侧）侧轮廓
  // 绘制内侧圆角
  pen.lineTo(in_radius_end.x, in_radius_end.y)
  pen.quadraticBezierTo(in_radius_control.x, in_radius_control.y, in_radius_start.x, in_radius_start.y)
  for (let i = in_xie_curves_final.length - 1; i >= 0; i--) {
    const curve = in_xie_curves_final[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(out_xie_curves[0].start.x, out_xie_curves[0].start.y)

  pen.closePath()
  return [ pen ]
}

const components = getComponents(skeleton)
for (let i = 0; i < components.length; i++) {
  glyph.addComponent(components[i])
}