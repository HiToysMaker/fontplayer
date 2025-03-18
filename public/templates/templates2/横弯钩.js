const heng_length = glyph.getParam('横-长度')
const wan_horizonalSpan = glyph.getParam('弯-水平延伸')
const wan_verticalSpan = glyph.getParam('弯-竖直延伸')
const wan_bendCursor = glyph.getParam('弯-弯曲游标')
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

// 横
const heng_start = new FP.Joint(
  'heng_start',
  {
    x: ox - (heng_length + wan_horizonalSpan) / 2,
    y: oy - wan_verticalSpan / 2,
  },
)
const heng_end = new FP.Joint(
  'heng_end',
  {
    x: heng_start.x + heng_length,
    y: heng_start.y,
  },
)

// 弯
const wan_start = heng_end
const wan_end = new FP.Joint(
  'wan_end',
  {
    x: wan_start.x + wan_horizonalSpan,
    y: wan_start.y + wan_verticalSpan,
  },
)

const wan_length = distance(wan_start, wan_end)
const wan_cursor_x = wan_start.x + wan_bendCursor * wan_horizonalSpan
const wan_cursor_y = wan_start.y + wan_bendCursor * wan_verticalSpan
const wan_angle = Math.atan2(wan_verticalSpan, wan_horizonalSpan)

const wan_bend = new FP.Joint(
  'wan_bend',
  {
    x: wan_cursor_x - wan_bendDegree * Math.sin(wan_angle),
    y: wan_cursor_y + wan_bendDegree * Math.cos(wan_angle),
  },
)

// 钩
const gou_start = wan_end
const gou_end = new FP.Joint(
  'gou_end',
  {
    x: gou_start.x + gou_horizonalSpan,
    y: gou_start.y - gou_verticalSpan,
  },
)

glyph.addJoint(heng_start)
glyph.addJoint(heng_end)
glyph.addJoint(wan_start)
glyph.addJoint(wan_bend)
glyph.addJoint(wan_end)
glyph.addJoint(gou_start)
glyph.addJoint(gou_end)

const skeleton = {
  heng_start,
  heng_end,
  wan_start,
  wan_bend,
  wan_end,
  gou_start,
  gou_end,
}

glyph.addRefLine(refline(heng_start, heng_end))
glyph.addRefLine(refline(wan_start, wan_bend))
glyph.addRefLine(refline(wan_bend, wan_end))
glyph.addRefLine(refline(gou_start, gou_end))

const start_style_type = glyph.getParam('起笔风格')
const start_style_value = glyph.getParam('起笔数值')
const bending_degree = glyph.getParam('弯曲程度')

const getStartStyle = (start_style_type, start_style_value) => {
  if (start_style_type === 1) {
    // 起笔上下凸起长方形
    return {
      start_style_decorator_width: start_style_value * 20,
      start_style_decorator_height: weight * 0.25,
    }
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    return {
      start_style_decorator_width: start_style_value * 20,
      start_style_decorator_height: weight * 0.25,
      start_style_decorator_radius: 20,
    }
  }
  return {}
}

const start_style = getStartStyle(start_style_type, start_style_value)

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
    heng_start,
    heng_end,
    wan_start,
    wan_bend,
    wan_end,
    gou_start,
    gou_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, weight)
  const { out_wan_curves, out_wan_points, in_wan_curves, in_wan_points } = FP.getCurveContours('wan', { wan_start, wan_bend, wan_end }, weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight)
  const { corner: in_corner_heng_wan, corner_index: in_corner_index_heng_wan } = FP.getIntersection(
    { type: 'curve', points: in_wan_points },
    { type: 'line', start: in_heng_start, end: in_heng_end },
  )
  const { corner: out_corner_heng_wan } = FP.getIntersection(
    { type: 'line', start: out_wan_curves[0].start, end: out_wan_curves[0].control1 },
    { type: 'line', start: out_heng_start, end: out_heng_end },
  )
  const { corner: in_corner_wan_gou } = FP.getIntersection(
    { type: 'line', start: in_wan_curves[in_wan_curves.length - 1].control2, end: in_wan_curves[in_wan_curves.length - 1].end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_wan_gou, corner_index: out_corner_index_wan_gou } = FP.getIntersection(
    { type: 'curve', points: out_wan_points },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )
  let { curves: in_wan_curves_final } = FP.fitCurvesByPoints(in_wan_points.slice(in_corner_index_heng_wan))
  let { curves: out_wan_curves_final } = FP.fitCurvesByPoints(out_wan_points.slice(0, out_corner_index_wan_gou))

  // 计算弯钩拐角处内外圆角相关的点与数据
  let in_radius = 30 * bending_degree
  let out_radius = 30 * bending_degree
  // 如果in_radius超出钩或弯的长度，取钩或弯的最小长度
  const in_radius_min_length = Math.min(
    getDistance(in_gou_start, in_gou_end),
    getDistance(in_wan_curves_final[0].start, in_wan_curves_final[in_wan_curves_final.length - 1].end),
  )
  const out_radius_min_length = Math.min(
    getDistance(out_wan_curves_final[out_wan_curves_final.length - 1].end, out_gou_end),
    getDistance(out_wan_curves_final[0].start, out_wan_curves_final[out_wan_curves_final.length - 1].end),
  )
  if (in_radius >= in_radius_min_length) {
    in_radius = in_radius_min_length
  }
  if (out_radius >= out_radius_min_length) {
    out_radius = out_radius_min_length
  }
  const in_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(in_wan_curves_final), in_radius, true)
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
  const out_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(out_wan_curves_final), out_radius, true)
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
  in_wan_curves_final = in_radius_data.final_curves
  out_wan_curves_final = out_radius_data.final_curves

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制右侧（外侧）侧轮廓
  if (start_style_type === 0) {
    // 无起笔样式
    pen.moveTo(out_heng_start.x, out_corner_heng_wan.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.moveTo(out_heng_start.x, out_corner_heng_wan.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_corner_heng_wan.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_corner_heng_wan.y)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.moveTo(out_heng_start.x, out_corner_heng_wan.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_corner_heng_wan.y - start_style.start_style_decorator_height)
    pen.quadraticBezierTo(
      out_heng_start.x + start_style.start_style_decorator_width,
      out_corner_heng_wan.y,
      out_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      out_corner_heng_wan.y,
    )
  }
  pen.lineTo(out_corner_heng_wan.x, out_corner_heng_wan.y)
  pen.lineTo(out_wan_curves_final[0].start.x, out_wan_curves_final[0].start.y)
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
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(in_heng_start.x, in_wan_curves_final[0].start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_wan_curves_final[0].start.y)
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_wan_curves_final[0].start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_heng_start.x, in_wan_curves_final[0].start.y + start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(
      in_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      in_wan_curves_final[0].start.y,
    )
    pen.quadraticBezierTo(
      in_heng_start.x + start_style.start_style_decorator_width,
      in_wan_curves_final[0].start.y,
      in_heng_start.x + start_style.start_style_decorator_width,
      in_wan_curves_final[0].start.y + start_style.start_style_decorator_height,
    )
    pen.lineTo(in_heng_start.x, in_wan_curves_final[0].start.y + start_style.start_style_decorator_height)
  }

  // 绘制轮廓连接线
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(out_heng_start.x, out_corner_heng_wan.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(out_heng_start.x, out_corner_heng_wan.y - start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(out_heng_start.x, out_corner_heng_wan.y - start_style.start_style_decorator_height)
  }

  pen.closePath()
  return [ pen ]
}

const components = getComponents(skeleton)
for (let i = 0; i < components.length; i++) {
  glyph.addComponent(components[i])
}