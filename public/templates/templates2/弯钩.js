const wan_length = glyph.getParam('弯-长度')
const wan_bendDegree = glyph.getParam('弯-弯曲度')
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

// 弯
const wan_start = new FP.Joint(
  'wan_start',
  {
    x: ox,
    y: oy - wan_length / 2,
  },
)
const wan_end = new FP.Joint(
  'wan_end',
  {
    x: ox,
    y: wan_start.y + wan_length,
  },
)
const wan_bend = new FP.Joint(
  'wan_bend',
  {
    x: ox + wan_bendDegree,
    y: wan_start.y + wan_length / 2,
  },
)

// 钩
const gou_start = wan_end
const gou_end = new FP.Joint(
  'gou_end',
  {
    x: gou_start.x - gou_horizonalSpan,
    y: gou_start.y + gou_verticalSpan,
  },
)

glyph.addJoint(wan_start)
glyph.addJoint(wan_bend)
glyph.addJoint(wan_end)
glyph.addJoint(gou_start)
glyph.addJoint(gou_end)

const skeleton = {
  wan_start,
  wan_bend,
  wan_end,
  gou_start,
  gou_end,
}

glyph.addRefLine(refline(wan_start, wan_bend))
glyph.addRefLine(refline(wan_bend, wan_end))
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
    wan_start,
    wan_bend,
    wan_end,
    gou_start,
    gou_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_wan_curves, out_wan_points, in_wan_curves, in_wan_points } = FP.getCurveContours('wan', { wan_start, wan_bend, wan_end }, weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight)
  const { corner: in_corner_wan_gou } = FP.getIntersection(
    { type: 'line', start: in_wan_curves[in_wan_curves.length - 1].control2, end: in_wan_curves[in_wan_curves.length - 1].end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_wan_gou } = FP.getIntersection(
    { type: 'line', start: out_wan_curves[out_wan_curves.length - 1].control2, end: out_wan_curves[out_wan_curves.length - 1].end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )
  // 内侧弯曲线最后一个控制点使用in_corner_wan_gou
  in_wan_curves[in_wan_curves.length - 1].end = in_corner_wan_gou

  // 计算弯钩拐角处内外圆角相关的点与数据
  let in_radius = 30 * bending_degree
  let out_radius = 30 * bending_degree
  // 如果in_radius超出钩或弯的长度，取钩或弯的最小长度
  const in_radius_min_length = Math.min(
    getDistance(in_corner_wan_gou, in_gou_end),
    getDistance(in_corner_wan_gou, in_wan_curves[0].start),
  )
  const out_radius_min_length = Math.min(
    getLength(gou_horizonalSpan, gou_verticalSpan),
    getDistance(out_wan_curves[0].start, out_wan_curves[out_wan_curves.length - 1].end),
  )
  if (in_radius >= in_radius_min_length) {
    in_radius = in_radius_min_length
  }
  if (out_radius >= out_radius_min_length) {
    out_radius = out_radius_min_length
  }
  const in_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(in_wan_curves), in_radius, true)
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
  const out_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(out_wan_curves), out_radius, true)
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
  const in_wan_curves_final = in_radius_data.final_curves
  const out_wan_curves_final = out_radius_data.final_curves

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制右侧（外侧）侧轮廓
  pen.moveTo(out_wan_curves_final[0].start.x, out_wan_curves_final[0].start.y)
  for (let i = 0; i < out_wan_curves_final.length; i++) {
    const curve = out_wan_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  // 绘制外侧圆角
  pen.quadraticBezierTo(out_radius_control.x, out_radius_control.y, out_radius_end.x, out_radius_end.y)
  pen.lineTo(out_gou_end.x, out_gou_end.y)

  // 绘制轮廓连接线
  pen.lineTo(in_gou_end.x, in_gou_end.y)

  // 绘制左侧（内侧）侧轮廓
  // 绘制内侧圆角
  pen.lineTo(in_radius_end.x, in_radius_end.y)
  pen.quadraticBezierTo(in_radius_control.x, in_radius_control.y, in_radius_start.x, in_radius_start.y)
  for (let i = in_wan_curves_final.length - 1; i >= 0; i--) {
    const curve = in_wan_curves_final[i]
    pen.bezierTo(curve.control2.x, curve.control2.x, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(out_wan_curves[0].start.x, out_wan_curves[0].start.y)

  pen.closePath()
  return [ pen ]
}

const components = getComponents(skeleton)
for (let i = 0; i < components.length; i++) {
  glyph.addComponent(components[i])
}