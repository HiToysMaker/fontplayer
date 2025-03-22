const weights_variation_power = glyph.getParam('字重变化')
const start_style_type = glyph.getParam('起笔风格')
const start_style_value = glyph.getParam('起笔数值')
const turn_style_type = glyph.getParam('转角风格')
const turn_style_value = glyph.getParam('转角数值')
const bending_degree = glyph.getParam('弯曲程度')
const pie_horizonalSpan = glyph.getParam('撇-水平延伸')
const pie_verticalSpan = glyph.getParam('撇-竖直延伸')
const pie_bendCursor = glyph.getParam('撇-弯曲游标')
const pie_bendDegree = glyph.getParam('撇-弯曲度') + 10 * bending_degree
const tiao_horizonalSpan = glyph.getParam('挑-水平延伸')
const tiao_verticalSpan = glyph.getParam('挑-竖直延伸')
const tiao_bendCursor = glyph.getParam('挑-弯曲游标')
const tiao_bendDegree = glyph.getParam('挑-弯曲度') + 10 * bending_degree
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
  'pie_start',
  {
    x: ox + pie_horizonalSpan / 2,
    y: oy - pie_verticalSpan / 2,
  },
)
const pie_end = new FP.Joint(
  'pie_end',
  {
    x: pie_start.x - pie_horizonalSpan,
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

// 挑
const tiao_start = pie_end
const tiao_end = new FP.Joint(
  'tiao_end',
  {
    x: tiao_start.x + tiao_horizonalSpan,
    y: tiao_start.y - tiao_verticalSpan,
  },
)

const tiao_length = distance(tiao_start, tiao_end)
const tiao_cursor_x = tiao_start.x + tiao_bendCursor * tiao_horizonalSpan
const tiao_cursor_y = tiao_start.y - tiao_bendCursor * tiao_verticalSpan
const tiao_angle = Math.atan2(tiao_verticalSpan, tiao_horizonalSpan)

const tiao_bend = new FP.Joint(
  'tiao_bend',
  {
    x: tiao_cursor_x - tiao_bendDegree * Math.sin(tiao_angle),
    y: tiao_cursor_y - tiao_bendDegree * Math.cos(tiao_angle),
  },
)

glyph.addJoint(pie_start)
glyph.addJoint(pie_bend)
glyph.addJoint(pie_end)
glyph.addJoint(tiao_start)
glyph.addJoint(tiao_bend)
glyph.addJoint(tiao_end)

const skeleton = {
  pie_start,
  pie_bend,
  pie_end,
  tiao_start,
  tiao_bend,
  tiao_end,
}

glyph.addRefLine(refline(pie_start, pie_bend))
glyph.addRefLine(refline(pie_bend, pie_end))
glyph.addRefLine(refline(tiao_start, tiao_bend))
glyph.addRefLine(refline(tiao_bend, tiao_end))

const getComponents = (skeleton) => {
  // 根据骨架计算轮廓关键点

  const {
    pie_start,
    pie_bend,
    pie_end,
    tiao_start,
    tiao_bend,
    tiao_end,
  } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_pie_curves, out_pie_points, in_pie_curves, in_pie_points } = FP.getCurveContours('pie', { pie_start, pie_bend, pie_end }, weight, {
    unticlockwise: true,
  })
  const { out_tiao_curves, out_tiao_points, in_tiao_curves, in_tiao_points } = FP.getCurveContours('tiao', { tiao_start, tiao_bend, tiao_end }, weight, {
    unticlockwise: true,
  })
  let { corner: out_corner_pie_tiao, corner_index: out_corner_index_pie_tiao } = FP.getIntersection(
    { type: 'curve', points: out_pie_points },
    { type: 'curve', points: in_tiao_points },
  )
  if (!out_corner_pie_tiao) {
    out_corner_pie_tiao = out_pie_curves[out_pie_curves.length - 1].end
    out_corner_index_pie_tiao = [out_pie_points.length, 0]
  }
  const { corner: in_corner_pie_tiao, corner_index: in_corner_index_pie_tiao } = FP.getIntersection(
    { type: 'curve', points: in_pie_points },
    { type: 'curve', points: in_tiao_points },
  )
  const { curves: out_pie_curves_final } = FP.fitCurvesByPoints(out_pie_points.slice(0, out_corner_index_pie_tiao[0]))
  const { curves: in_pie_curves_final } = FP.fitCurvesByPoints(in_pie_points.slice(0, in_corner_index_pie_tiao[0]))
  let in_tiao_curves_final_1 = []
  if (out_corner_index_pie_tiao[1]) {
    let { curves } = FP.fitCurvesByPoints(in_tiao_points.slice(0, out_corner_index_pie_tiao[1]))
    in_tiao_curves_final_1 = curves
  }
  const { curves: in_tiao_curves_final_2 } = FP.fitCurvesByPoints(in_tiao_points.slice(in_corner_index_pie_tiao[1]))

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // pen.moveTo(out_pie_curves[0].start.x, out_pie_curves[0].start.y)
  // pen.bezierTo(out_pie_curves[0].control1.x, out_pie_curves[0].control1.y, out_pie_curves[0].control2.x, out_pie_curves[0].control2.y, out_pie_curves[0].end.x, out_pie_curves[0].end.y)
  // pen.lineTo(in_pie_curves[0].end.x, in_pie_curves[0].end.y)
  // pen.bezierTo(in_pie_curves[0].control2.x, in_pie_curves[0].control2.y, in_pie_curves[0].control1.x, in_pie_curves[0].control1.y, in_pie_curves[0].start.x, in_pie_curves[0].start.y)
  // pen.moveTo(out_pie_curves[0].start.x, out_pie_curves[0].start.y)
  // pen.closePath()

  // const pen2 = new FP.PenComponent()
  // pen2.beginPath()
  // pen2.moveTo(out_tiao_curves[0].start.x, out_tiao_curves[0].start.y)
  // pen2.bezierTo(out_tiao_curves[0].control1.x, out_tiao_curves[0].control1.y, out_tiao_curves[0].control2.x, out_tiao_curves[0].control2.y, out_tiao_curves[0].end.x, out_tiao_curves[0].end.y)
  // pen2.lineTo(in_tiao_curves[0].end.x, in_tiao_curves[0].end.y)
  // pen2.bezierTo(in_tiao_curves[0].control2.x, in_tiao_curves[0].control2.y, in_tiao_curves[0].control1.x, in_tiao_curves[0].control1.y, in_tiao_curves[0].start.x, in_tiao_curves[0].start.y)
  // pen2.moveTo(out_tiao_curves[0].start.x, out_tiao_curves[0].start.y)
  // pen2.closePath()

  // 绘制左侧（外侧）轮廓
  pen.moveTo(out_pie_curves[0].start.x, out_pie_curves[0].start.y)
  for (let i = 0; i < out_pie_curves_final.length; i++) {
    const curve = out_pie_curves_final[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }
  for (let i = in_tiao_curves_final_1.length - 1; i >= 0; i--) {
    const curve = in_tiao_curves_final_1[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }
  pen.lineTo(out_tiao_curves[0].start.x, out_tiao_curves[0].start.y)
  for (let i = 0; i < out_tiao_curves.length; i++) {
    const curve = out_tiao_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(in_tiao_curves_final_2[in_tiao_curves_final_2.length - 1].end.x, in_tiao_curves_final_2[in_tiao_curves_final_2.length - 1].end.y)

  // 绘制右侧（内侧）轮廓
  for (let i = in_tiao_curves_final_2.length - 1; i >= 0; i--) {
    const curve = in_tiao_curves_final_2[i]
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