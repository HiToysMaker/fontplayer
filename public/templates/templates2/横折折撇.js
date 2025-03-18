const heng_length = glyph.getParam('横-长度')
const zhe1_horizonalSpan = glyph.getParam('折1-水平延伸')
const zhe1_verticalSpan = glyph.getParam('折1-竖直延伸')
const zhe2_length = glyph.getParam('折2-长度')
const pie_horizonalSpan = glyph.getParam('撇-水平延伸')
const pie_verticalSpan = glyph.getParam('撇-竖直延伸')
const pie_bendCursor = glyph.getParam('撇-弯曲游标')
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
    y: oy - (pie_verticalSpan + zhe1_verticalSpan) / 2,
  },
)
const heng_end = new FP.Joint(
  'heng_end',
  {
    x: ox + heng_length / 2,
    y: oy - (pie_verticalSpan + zhe1_verticalSpan) / 2,
  },
)

// 折1
const zhe1_start = heng_end
const zhe1_end = new FP.Joint(
  'zhe1_end',
  {
    x: zhe1_start.x - zhe1_horizonalSpan,
    y: zhe1_start.y + zhe1_verticalSpan,
  },
)

// 折2
const zhe2_start = zhe1_end
const zhe2_end = new FP.Joint(
  'zhe2_end',
  {
    x: zhe2_start.x + zhe2_length,
    y: zhe2_start.y,
  },
)

// 撇
const pie_start = zhe2_end
const pie_end = new FP.Joint(
  'pie_end',
  {
    x: pie_start.x - pie_horizonalSpan,
    y: pie_start.y + pie_verticalSpan,
  },
)

const pie_bend = new FP.Joint(
  'pie_bend',
  {
    x: pie_start.x,
    y: pie_start.y + pie_bendCursor * pie_verticalSpan,
  },
)

glyph.addJoint(heng_start)
glyph.addJoint(heng_end)
glyph.addJoint(zhe1_start)
glyph.addJoint(zhe1_end)
glyph.addJoint(zhe2_start)
glyph.addJoint(zhe2_end)
glyph.addJoint(pie_start)
glyph.addJoint(pie_end)
glyph.addJoint(pie_bend)

const skeleton = {
  heng_start,
  heng_end,
  zhe1_start,
  zhe1_end,
  zhe2_start,
  zhe2_end,
  pie_start,
  pie_end,
  pie_bend,
}

glyph.addRefLine(refline(heng_start, heng_end))
glyph.addRefLine(refline(zhe1_start, zhe1_end))
glyph.addRefLine(refline(zhe2_start, zhe2_end))
glyph.addRefLine(refline(pie_start, pie_bend))
glyph.addRefLine(refline(pie_bend, pie_end))

const start_style_type = glyph.getParam('起笔风格')
const start_style_value = glyph.getParam('起笔数值')
const weights_variation_power = glyph.getParam('字重变化')
const turn_style_type = glyph.getParam('转角风格')
const turn_style_value = glyph.getParam('转角数值')

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
    zhe1_start,
    zhe1_end,
    zhe2_start,
    zhe2_end,
    pie_start,
    pie_end,
    pie_bend,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_heng_start, out_heng_end, in_heng_start, in_heng_end } = FP.getLineContours('heng', { heng_start, heng_end }, weight)
  const { out_zhe1_start, out_zhe1_end, in_zhe1_start, in_zhe1_end } = FP.getLineContours('zhe1', { zhe1_start, zhe1_end }, weight)
  const { out_zhe2_start, out_zhe2_end, in_zhe2_start, in_zhe2_end } = FP.getLineContours('zhe2', { zhe2_start, zhe2_end }, weight)
  const { out_pie_curves, out_pie_points, in_pie_curves, in_pie_points } = FP.getCurveContours('pie', { pie_start, pie_bend, pie_end }, weight, {
    weightsVariation: 'pow',
    weightsVariationDir: 'reverse',
    weightsVariationPower: weights_variation_power,
  })
  const { corner: in_corner_heng_zhe1 } = FP.getIntersection(
    { type: 'line', start: in_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: in_heng_start, end: in_heng_end }
  )
  const { corner: out_corner_heng_zhe1 } = FP.getIntersection(
    { type: 'line', start: out_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: out_heng_start, end: out_heng_end }
  )
  const { corner: in_corner_1_zhe1_zhe2 } = FP.getIntersection(
    { type: 'line', start: in_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: out_zhe2_start, end: out_zhe2_end }
  )
  const in_corner_2_zhe1_zhe2 = {
    x: in_corner_1_zhe1_zhe2.x,
    y: in_corner_1_zhe1_zhe2.y + weight
  }
  const { corner: out_corner_zhe1_zhe2 } = FP.getIntersection(
    { type: 'line', start: out_zhe1_start, end: out_zhe1_end },
    { type: 'line', start: out_zhe2_start, end: out_zhe2_end }
  )
  const { corner: in_corner_zhe2_pie, corner_index: in_corner_index_zhe2_pie } = FP.getIntersection(
    { type: 'line', start: in_zhe2_start, end: in_zhe2_end },
    { type: 'curve', points: in_pie_points }
  )
  const { corner: out_corner_zhe2_pie, corner_index: out_corner_index_zhe2_pie } = FP.getIntersection(
    { type: 'line', start: out_zhe2_start, end: out_zhe2_end },
    { type: 'line', start: out_pie_curves[0].start, end: out_pie_curves[0].control1 }
  )
  let { curves: out_pie_curves_final } = FP.fitCurvesByPoints(out_pie_points.slice(out_corner_index_zhe2_pie))
  let { curves: in_pie_curves_final } = FP.fitCurvesByPoints(in_pie_points.slice(in_corner_index_zhe2_pie))
  const { corner: out_corner_heng_zhe1_down } = FP.getIntersection(
    { type: 'line', start: out_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: in_heng_start, end: in_heng_end }
  )
  const out_corner_heng_zhe1_up = {
    x: out_corner_heng_zhe1_down.x,
    y: out_corner_heng_zhe1_down.y - weight,
  }

  let turn_data_heng_zhe1 = {}
  let turn_data_zhe2_pie = {}
  if (turn_style_type === 1) {
    // 计算转角风格1（凸起，圆滑连接）所需要的数据
    {
      const turn_length = 20 * turn_style_value
      const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(out_heng_start, out_corner_heng_zhe1, out_zhe1_end)
      const inner_corner_length = weight
      const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
      const turn_control_1 = {
        x: out_corner_heng_zhe1.x - corner_radius,
        y: out_corner_heng_zhe1.y,
      }
      const turn_start_1 = {
        x: turn_control_1.x - corner_radius,
        y: turn_control_1.y,
      }
      const turn_end_1 = {
        x: turn_control_1.x + turn_length * Math.cos(mid_angle),
        y: turn_control_1.y - turn_length * Math.sin(mid_angle),
      }
      const turn_control_2 = getRadiusPoint({
        start: out_corner_heng_zhe1,
        end: out_zhe1_end,
        radius: corner_radius,
      })
      const turn_start_2 = getRadiusPoint({
        start: turn_control_2,
        end: out_zhe1_end,
        radius: corner_radius,
      })
      const turn_end_2 = {
        x: turn_control_2.x + turn_length * Math.cos(mid_angle),
        y: turn_control_2.y - turn_length * Math.sin(mid_angle),
      }
      turn_data_heng_zhe1 = {
        turn_start_1,
        turn_control_1,
        turn_end_1,
        turn_start_2,
        turn_control_2,
        turn_end_2,
      }
    }
    {
      const turn_length = 20 * turn_style_value
      const inner_angle = Math.PI / 2
      const mid_angle = Math.PI / 4
      const inner_corner_length = weight
      const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
      const turn_control_1 = {
        x: out_corner_zhe2_pie.x - corner_radius,
        y: out_corner_zhe2_pie.y,
      }
      const turn_start_1 = {
        x: turn_control_1.x - corner_radius,
        y: turn_control_1.y,
      }
      const turn_end_1 = {
        x: turn_control_1.x + turn_length * Math.cos(mid_angle),
        y: turn_control_1.y - turn_length * Math.sin(mid_angle),
      }
      const turn_control_2_data = FP.getRadiusPointsOnCurve(
        FP.getCurvesPoints(out_pie_curves_final),
        corner_radius - weight / 2,
      )
      const turn_control_2 = turn_control_2_data.point
      const turn_start_2_data = FP.getRadiusPointsOnCurve(
        FP.getCurvesPoints(turn_control_2_data.final_curves),
        corner_radius,
      )
      const turn_start_2 = turn_start_2_data.point
      const turn_end_2 = {
        x: turn_control_2.x + turn_length * Math.cos(mid_angle),
        y: turn_control_2.y - turn_length * Math.sin(mid_angle),
      }
      out_pie_curves_final = turn_start_2_data.final_curves
      turn_data_zhe2_pie = {
        turn_start_1,
        turn_control_1,
        turn_end_1,
        turn_start_2,
        turn_control_2,
        turn_end_2,
      }
    }
  }

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制右侧（外侧）轮廓
  if (start_style_type === 0) {
    // 无起笔样式
    pen.moveTo(out_heng_start.x, out_heng_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.moveTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_heng_start.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_heng_start.y)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.moveTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
    pen.lineTo(out_heng_start.x + start_style.start_style_decorator_width, out_heng_start.y - start_style.start_style_decorator_height)
    pen.quadraticBezierTo(
      out_heng_start.x + start_style.start_style_decorator_width,
      out_heng_start.y,
      out_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      out_heng_start.y,
    )
  }
  if (turn_style_type === 0) {
    // 默认转角样式
    pen.lineTo(out_corner_heng_zhe1_up.x, out_corner_heng_zhe1_up.y)
    pen.lineTo(out_corner_heng_zhe1_down.x, out_corner_heng_zhe1_down.y)
    pen.lineTo(out_corner_zhe1_zhe2.x, out_corner_zhe1_zhe2.y)
    pen.lineTo(out_corner_zhe2_pie.x, out_corner_zhe2_pie.y)
    pen.lineTo(out_pie_curves_final[0].start.x, out_pie_curves_final[0].start.y)
  } else if (turn_style_type === 1) {
    // 转角样式1
    // 绘制横折1转角
    pen.lineTo(turn_data_heng_zhe1.turn_start_1.x, turn_data_heng_zhe1.turn_start_1.y)
    pen.quadraticBezierTo(turn_data_heng_zhe1.turn_control_1.x, turn_data_heng_zhe1.turn_control_1.y, turn_data_heng_zhe1.turn_end_1.x, turn_data_heng_zhe1.turn_end_1.y)
    pen.lineTo(turn_data_heng_zhe1.turn_end_2.x, turn_data_heng_zhe1.turn_end_2.y)
    pen.quadraticBezierTo(turn_data_heng_zhe1.turn_control_2.x, turn_data_heng_zhe1.turn_control_2.y, turn_data_heng_zhe1.turn_start_2.x, turn_data_heng_zhe1.turn_start_2.y)
    // 绘制外侧折1
    pen.lineTo(out_corner_zhe1_zhe2.x, out_corner_zhe1_zhe2.y)
    // 绘制折2撇转角
    pen.lineTo(turn_data_zhe2_pie.turn_start_1.x, turn_data_zhe2_pie.turn_start_1.y)
    pen.quadraticBezierTo(turn_data_zhe2_pie.turn_control_1.x, turn_data_zhe2_pie.turn_control_1.y, turn_data_zhe2_pie.turn_end_1.x, turn_data_zhe2_pie.turn_end_1.y)
    pen.lineTo(turn_data_zhe2_pie.turn_end_2.x, turn_data_zhe2_pie.turn_end_2.y)
    pen.quadraticBezierTo(turn_data_zhe2_pie.turn_control_2.x, turn_data_zhe2_pie.turn_control_2.y, turn_data_zhe2_pie.turn_start_2.x, turn_data_zhe2_pie.turn_start_2.y)
  }
  for (let i = 0; i < out_pie_curves_final.length; i++) {
    const curve = out_pie_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(in_pie_curves_final[in_pie_curves_final.length - 1].end.x, in_pie_curves_final[in_pie_curves_final.length - 1].end.y)

  // 绘制左侧（内侧）轮廓
  for (let i = in_pie_curves_final.length - 1; i >= 0; i--) {
    const curve = in_pie_curves_final[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  pen.lineTo(in_corner_2_zhe1_zhe2.x, in_corner_2_zhe1_zhe2.y)
  pen.lineTo(in_corner_1_zhe1_zhe2.x, in_corner_1_zhe1_zhe2.y)
  pen.lineTo(in_corner_heng_zhe1.x, in_corner_heng_zhe1.y)
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(in_heng_start.x, in_heng_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_heng_start.y)
    pen.lineTo(in_heng_start.x + start_style.start_style_decorator_width, in_heng_start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_heng_start.x, in_heng_start.y + start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(
      in_heng_start.x + start_style.start_style_decorator_width + start_style.start_style_decorator_radius,
      in_heng_start.y,
    )
    pen.quadraticBezierTo(
      in_heng_start.x + start_style.start_style_decorator_width,
      in_heng_start.y,
      in_heng_start.x + start_style.start_style_decorator_width,
      in_heng_start.y + start_style.start_style_decorator_height,
    )
    pen.lineTo(in_heng_start.x, in_heng_start.y + start_style.start_style_decorator_height)
  }

  // 绘制轮廓连接线
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(out_heng_start.x, out_heng_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(out_heng_start.x, out_heng_start.y - start_style.start_style_decorator_height)
  }

  pen.closePath()
  return [ pen ]
}

const components = getComponents(skeleton)
for (let i = 0; i < components.length; i++) {
  glyph.addComponent(components[i])
}