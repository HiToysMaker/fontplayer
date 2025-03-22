const weights_variation_power = glyph.getParam('字重变化')
const start_style_type = glyph.getParam('起笔风格')
const start_style_value = glyph.getParam('起笔数值')
const turn_style_type = glyph.getParam('转角风格')
const turn_style_value = glyph.getParam('转角数值')
const bending_degree = glyph.getParam('弯曲程度')
const heng_length = glyph.getParam('横-长度')
const zhe_horizonalSpan = glyph.getParam('折-水平延伸')
const zhe_verticalSpan = glyph.getParam('折-竖直延伸')
const zhe_bendCursor = glyph.getParam('折-弯曲游标')
const zhe_bendDegree = glyph.getParam('折-弯曲度') + 30 * bending_degree
const wan_length = glyph.getParam('弯-长度')
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
    x: ox - heng_length / 2,
    y: oy - zhe_verticalSpan / 2,
  },
)
const heng_end = new FP.Joint(
  'heng_end',
  {
    x: heng_start.x + heng_length,
    y: heng_start.y,
  },
)

// 折
const zhe_start = heng_end
const zhe_end = new FP.Joint(
  'zhe_end',
  {
    x: zhe_start.x - zhe_horizonalSpan,
    y: zhe_start.y + zhe_verticalSpan,
  },
)

const zhe_length = distance(zhe_start, zhe_end)
const zhe_cursor_x = zhe_start.x - zhe_bendCursor * zhe_horizonalSpan
const zhe_cursor_y = zhe_start.y + zhe_bendCursor * zhe_verticalSpan
const zhe_angle = Math.atan2(zhe_verticalSpan, zhe_horizonalSpan)

const zhe_bend = new FP.Joint(
  'zhe_bend',
  {
    x: zhe_cursor_x - zhe_bendDegree * Math.sin(zhe_angle),
    y: zhe_cursor_y - zhe_bendDegree * Math.cos(zhe_angle),
  },
)

// 弯
const wan_start = zhe_end
const wan_end = new FP.Joint(
  'wan_end',
  {
    x: wan_start.x + wan_length,
    y: wan_start.y,
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
glyph.addJoint(zhe_start)
glyph.addJoint(zhe_bend)
glyph.addJoint(zhe_end)
glyph.addJoint(wan_start)
glyph.addJoint(wan_end)
glyph.addJoint(gou_start)
glyph.addJoint(gou_end)

const skeleton = {
  heng_start,
  heng_end,
  zhe_start,
  zhe_bend,
  zhe_end,
  wan_start,
  wan_end,
  gou_start,
  gou_end,
}

glyph.addRefLine(refline(heng_start, heng_end))
glyph.addRefLine(refline(zhe_start, zhe_bend))
glyph.addRefLine(refline(zhe_bend, zhe_end))
glyph.addRefLine(refline(wan_start, wan_end))
glyph.addRefLine(refline(gou_start, gou_end))

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
    zhe_start,
    zhe_bend,
    zhe_end,
    wan_start,
    wan_end,
    gou_start,
    gou_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, weight)
  const { out_zhe_curves, out_zhe_points, in_zhe_curves, in_zhe_points } = FP.getCurveContours('zhe', { zhe_start, zhe_bend, zhe_end }, weight)
  const { out_wan_start, out_wan_end, in_wan_start, in_wan_end } = FP.getLineContours('wan', { wan_start, wan_end }, weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight)
  const { corner: in_corner_heng_zhe, corner_index: in_corner_index_heng_zhe } = FP.getIntersection(
    { type: 'curve', points: in_zhe_points },
    { type: 'line', start: in_heng_start, end: in_heng_end },
  )
  const { corner: out_corner_zhe_wan, corner_index: out_corner_index_zhe_wan } = FP.getIntersection(
    { type: 'curve', points: out_zhe_points },
    { type: 'line', start: out_wan_start, end: out_wan_end },
  )
  const { corner: in_corner_zhe_wan } = FP.getIntersection(
    { type: 'line', start: in_zhe_curves[in_zhe_curves.length - 1].control2, end: in_zhe_curves[in_zhe_curves.length - 1].end },
    { type: 'line', start: in_wan_start, end: in_wan_end },
  )
  const { corner: in_corner_wan_gou } = FP.getIntersection(
    { type: 'line', start: in_wan_start, end: in_wan_end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_wan_gou } = FP.getIntersection(
    { type: 'line', start: out_wan_start, end: out_wan_end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )
  let { curves: in_zhe_curves_final } = FP.fitCurvesByPoints(in_zhe_points.slice(in_corner_index_heng_zhe))
  let { curves: out_zhe_curves_final } = FP.fitCurvesByPoints(out_zhe_points.slice(0, out_corner_index_zhe_wan))

  // 计算折弯拐角处内外圆角相关的点与数据
  let in_radius = 80 * bending_degree
  let out_radius = 80 * bending_degree
  // 如果in_radius超出折或弯的长度，取折或弯的最小长度
  const in_radius_min_length = Math.min(
    getDistance(in_zhe_curves_final[in_zhe_curves_final.length - 1].end, in_corner_heng_zhe),
    getDistance(in_wan_start, in_wan_end),
  )
  const out_radius_min_length = Math.min(
    getDistance(out_zhe_curves_final[out_zhe_curves_final.length - 1].end, out_corner_wan_gou),
    getDistance(out_zhe_curves_final[0].start, out_zhe_curves_final[out_zhe_curves_final.length - 1].end),
  )
  if (in_radius >= in_radius_min_length) {
    in_radius = in_radius_min_length
  }
  if (out_radius >= out_radius_min_length) {
    out_radius = out_radius_min_length
  }
  const in_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(in_zhe_curves_final), in_radius, true)
  const in_radius_control = FP.getIntersection(
    { type: 'line', start: in_radius_data.tangent.start, end: in_radius_data.tangent.end },
    { type: 'line', start: in_wan_start, end: in_wan_end },
  ).corner
  const in_radius_start = in_radius_data.point
  const in_radius_end = {
    x: in_wan_start.x + in_radius,
    y: in_wan_start.y,
  }
  const out_radius_data = FP.getRadiusPointsOnCurve(FP.getCurvesPoints(out_zhe_curves_final), out_radius, true)
  const out_radius_control = FP.getIntersection(
    { type: 'line', start: out_radius_data.tangent.start, end: out_radius_data.tangent.end },
    { type: 'line', start: out_wan_start, end: out_wan_end },
  ).corner
  const out_radius_start = out_radius_data.point
  const out_radius_end = {
    x: out_zhe_curves_final[out_zhe_curves_final.length - 1].end.x + out_radius,
    y: out_zhe_curves_final[out_zhe_curves_final.length - 1].end.y,
  }
  in_zhe_curves_final = in_radius_data.final_curves
  out_zhe_curves_final = out_radius_data.final_curves

  // 计算弯钩拐角处内外圆角相关的点与数据
  let in_radius_wan_gou = 30 * bending_degree
  let out_radius_wan_gou = 30 * bending_degree
  // 如果in_radius超出弯或钩的长度，取弯或钩的最小长度
  const in_radius_min_length_zhe_gou = Math.min(
    getDistance(in_gou_start, in_gou_end),
    getDistance(in_wan_end, in_radius_end),
  )
  const out_radius_min_length_zhe_gou = Math.min(
    getDistance(out_corner_wan_gou, out_gou_end),
    getDistance(out_corner_wan_gou, out_radius_end),
  )
  if (in_radius_wan_gou >= in_radius_min_length_zhe_gou) {
    in_radius_wan_gou = in_radius_min_length_zhe_gou
  }
  if (out_radius_wan_gou >= out_radius_min_length_zhe_gou) {
    out_radius_wan_gou = out_radius_min_length_zhe_gou
  }
  const in_radius_start_wan_gou = {
    x: in_wan_end.x - in_radius_wan_gou,
    y: in_wan_end.y,
  }
  const in_radius_end_wan_gou = getRadiusPoint({
    start: in_gou_start,
    end: in_gou_end,
    radius: in_radius_wan_gou,
  })
  const out_radius_start_wan_gou = {
    x: out_corner_wan_gou.x - out_radius_wan_gou,
    y: out_corner_wan_gou.y,
  }
  const out_radius_end_wan_gou = getRadiusPoint({
    start: out_corner_wan_gou,
    end: out_gou_end,
    radius: out_radius_wan_gou,
  })

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制右侧（外侧）轮廓
  if (start_style_type === 0) {
    // 无起笔样式
    pen.moveTo(out_heng_start.x, out_zhe_curves_final[0].start.y - weight)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.moveTo(out_heng_start.x, out_zhe_curves_final[0].start.y - weight - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_zhe_curves_final[0].start.y - weight - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_zhe_curves_final[0].start.y - weight)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.moveTo(out_heng_start.x, out_zhe_curves_final[0].start.y - weight - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_zhe_curves_final[0].start.y - weight - start_style.start_style_decorator_height)
    pen.quadraticBezierTo(
      out_heng_start.x + start_style.start_style_decorator_width,
      out_zhe_curves_final[0].start.y - weight,
      out_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      out_zhe_curves_final[0].start.y - weight,
    )
  }
  pen.lineTo(out_zhe_curves_final[0].start.x, out_zhe_curves_final[0].start.y - weight)
  pen.lineTo(out_zhe_curves_final[0].start.x, out_zhe_curves_final[0].start.y)
  for (let i = 0; i < out_zhe_curves_final.length; i++) {
    const curve = out_zhe_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  // 绘制外侧折弯圆角
  pen.quadraticBezierTo(out_radius_control.x, out_radius_control.y, out_radius_end.x, out_radius_end.y)
  pen.lineTo(out_radius_start_wan_gou.x, out_radius_start_wan_gou.y)
  pen.quadraticBezierTo(out_corner_wan_gou.x, out_corner_wan_gou.y, out_radius_end_wan_gou.x, out_radius_end_wan_gou.y)
  pen.lineTo(out_gou_end.x, out_gou_end.y)

  // 绘制轮廓连接线
  pen.lineTo(in_gou_end.x, in_gou_end.y)

  // 绘制左侧（内侧）轮廓
  pen.lineTo(in_radius_end_wan_gou.x, in_radius_end_wan_gou.y)
  pen.quadraticBezierTo(in_corner_wan_gou.x, in_corner_wan_gou.y, in_radius_start_wan_gou.x, in_radius_start_wan_gou.y)
  // 绘制内侧折弯圆角
  pen.lineTo(in_radius_end.x, in_radius_end.y)
  pen.quadraticBezierTo(in_radius_control.x, in_radius_control.y, in_radius_start.x, in_radius_start.y)
  for (let i = in_zhe_curves_final.length - 1; i >= 0; i--) {
    const curve = in_zhe_curves_final[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(in_heng_start.x, in_zhe_curves_final[0].start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_zhe_curves_final[0].start.y)
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_zhe_curves_final[0].start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_heng_start.x, in_zhe_curves_final[0].start.y + start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(
      in_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      in_zhe_curves_final[0].start.y,
    )
    pen.quadraticBezierTo(
      in_heng_start.x + start_style.start_style_decorator_width,
      in_zhe_curves_final[0].start.y,
      in_heng_start.x + start_style.start_style_decorator_width,
      in_zhe_curves_final[0].start.y + start_style.start_style_decorator_height,
    )
    pen.lineTo(in_heng_start.x, in_zhe_curves_final[0].start.y + start_style.start_style_decorator_height)
  }

  // 绘制轮廓连接线
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(out_heng_start.x, out_zhe_curves_final[0].start.y - weight)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(out_heng_start.x, out_zhe_curves_final[0].start.y - weight - start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(out_heng_start.x, out_zhe_curves_final[0].start.y - weight - start_style.start_style_decorator_height)
  }

  pen.closePath()
  return [ pen ]
}

const components = getComponents(skeleton)
for (let i = 0; i < components.length; i++) {
  glyph.addComponent(components[i])
}