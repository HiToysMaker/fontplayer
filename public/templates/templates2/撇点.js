const weights_variation_power = glyph.getParam('字重变化')
const start_style_type = glyph.getParam('起笔风格')
const start_style_value = glyph.getParam('起笔数值')
const turn_style_type = glyph.getParam('转角风格')
const turn_style_value = glyph.getParam('转角数值')
const bending_degree = glyph.getParam('弯曲程度')
const pie_horizonalSpan = glyph.getParam('撇-水平延伸')
const pie_verticalSpan = glyph.getParam('撇-竖直延伸')
const pie_bendCursor = glyph.getParam('撇-弯曲游标')
const pie_bendDegree = glyph.getParam('撇-弯曲度') + 30 * bending_degree
const dian_horizonalSpan = glyph.getParam('点-水平延伸')
const dian_verticalSpan = glyph.getParam('点-竖直延伸')
const dian_bendCursor = glyph.getParam('点-弯曲游标')
const dian_bendDegree = glyph.getParam('点-弯曲度') + 30 * bending_degree
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

// 撇
const pie_start = new FP.Joint(
  'start',
  {
    x: ox + pie_horizonalSpan / 2,
    y: oy - (pie_verticalSpan + dian_verticalSpan) / 2,
  },
)
const pie_end = new FP.Joint(
  'end',
  {
    x: ox - pie_horizonalSpan / 2,
    y: pie_start.y + pie_verticalSpan,
  },
)

const pie_length = distance(pie_start, pie_end)
const pie_cursor_x = pie_start.x - pie_bendCursor * pie_horizonalSpan
const pie_cursor_y = pie_start.y + pie_bendCursor * pie_verticalSpan
const pie_angle = Math.atan2(pie_verticalSpan, pie_horizonalSpan)

const pie_bend = new FP.Joint(
  'pie_bend',
  {
    x: pie_cursor_x + pie_bendDegree * Math.sin(pie_angle),
    y: pie_cursor_y + pie_bendDegree * Math.cos(pie_angle),
  },
)

// 点
const dian_start = pie_end
const dian_end = new FP.Joint(
  'dian_end',
  {
    x: dian_start.x + dian_horizonalSpan,
    y: dian_start.y + dian_verticalSpan,
  },
)

const dian_length = distance(dian_start, dian_end)
const dian_cursor_x = dian_start.x + dian_bendCursor * dian_horizonalSpan
const dian_cursor_y = dian_start.y + dian_bendCursor * dian_verticalSpan
const dian_angle = Math.atan2(dian_verticalSpan, dian_horizonalSpan)

const dian_bend = new FP.Joint(
  'dian_bend',
  {
    x: dian_cursor_x + dian_bendDegree * Math.sin(dian_angle),
    y: dian_cursor_y - dian_bendDegree * Math.cos(dian_angle),
  },
)

glyph.addJoint(pie_start)
glyph.addJoint(pie_bend)
glyph.addJoint(pie_end)
glyph.addJoint(dian_start)
glyph.addJoint(dian_bend)
glyph.addJoint(dian_end)

const skeleton = {
  pie_start,
  pie_bend,
  pie_end,
  dian_start,
  dian_bend,
  dian_end,
}

glyph.addRefLine(refline(pie_start, pie_bend))
glyph.addRefLine(refline(pie_bend, pie_end))
glyph.addRefLine(refline(dian_start, dian_bend))
glyph.addRefLine(refline(dian_bend, dian_end))

const getComponents = (skeleton) => {
  // 根据骨架计算轮廓关键点

  const {
    pie_start,
    pie_bend,
    pie_end,
    dian_start,
    dian_bend,
    dian_end,
  } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_pie_curves, out_pie_points, in_pie_curves, in_pie_points } = FP.getCurveContours('pie', { pie_start, pie_bend, pie_end }, weight, {
    unticlockwise: true,
  })
  const { out_dian_curves, out_dian_points, in_dian_curves, in_dian_points } = FP.getCurveContours('dian', { dian_start, dian_bend, dian_end }, weight, {
    unticlockwise: true,
  })
  const { corner: out_corner_pie_dian } = FP.getIntersection(
    { type: 'line', start: out_pie_curves[out_pie_curves.length - 1].control2, end: out_pie_curves[out_pie_curves.length - 1].end },
    { type: 'line', start: out_dian_curves[0].start, end: out_dian_curves[0].control1 }
  )
  const { corner: in_corner_pie_dian, corner_index: in_corner_index_pie_dian } = FP.getIntersection(
    { type: 'curve', points: in_pie_points },
    { type: 'curve', points: in_dian_points },
  )
  const { curves: in_pie_curves_final } = FP.fitCurvesByPoints(in_pie_points.slice(0, in_corner_index_pie_dian[0]))
  const { curves: in_dian_curves_final } = FP.fitCurvesByPoints(in_dian_points.slice(in_corner_index_pie_dian[1]))

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制横的左侧（外侧）轮廓
  pen.moveTo(out_pie_curves[0].start.x, out_pie_curves[0].start.y)
  for (let i = 0; i < out_pie_curves.length; i++) {
    const curve = out_pie_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  pen.lineTo(out_corner_pie_dian.x, out_corner_pie_dian.y)
  for (let i = 0; i < out_dian_curves.length; i++) {
    const curve = out_dian_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(in_dian_curves_final[in_dian_curves_final.length - 1].end.x, in_dian_curves_final[in_dian_curves_final.length - 1].end.y)

  // 绘制横的右侧（内侧）轮廓
  for (let i = in_dian_curves_final.length - 1; i >= 0; i--) {
    const curve = in_dian_curves_final[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  for (let i = in_pie_curves_final.length - 1; i >= 0; i--) {
    const curve = in_pie_curves_final[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(out_pie_curves[0].start.x, out_pie_curves[0].start.y)

  pen.closePath()
  return [ pen ]
}

const components = getComponents(skeleton)
for (let i = 0; i < components.length; i++) {
  glyph.addComponent(components[i])
}