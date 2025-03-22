const weights_variation_power = glyph.getParam('字重变化')
const start_style_type = glyph.getParam('起笔风格')
const start_style_value = glyph.getParam('起笔数值')
const turn_style_type = glyph.getParam('转角风格')
const turn_style_value = glyph.getParam('转角数值')
const bending_degree = glyph.getParam('弯曲程度')
const horizonalSpan = glyph.getParam('水平延伸')
const verticalSpan = glyph.getParam('竖直延伸')
const bendCursor = glyph.getParam('弯曲游标')
const bendDegree = glyph.getParam('弯曲度') + 10 * bending_degree
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

const start = new FP.Joint(
  'start',
  {
    x: ox - horizonalSpan / 2,
    y: oy - verticalSpan / 2,
  },
)
const end = new FP.Joint(
  'end',
  {
    x: ox + horizonalSpan / 2,
    y: oy + verticalSpan / 2,
  },
)

const length = distance(start, end)
const cursor_x = start.x + bendCursor * horizonalSpan
const cursor_y = start.y + bendCursor * verticalSpan
const angle = Math.atan2(verticalSpan, horizonalSpan)

const bend = new FP.Joint(
  'bend',
  {
    x: cursor_x + bendDegree * Math.sin(angle),
    y: cursor_y - bendDegree * Math.cos(angle),
  },
)

const skeleton = { start, bend, end }

glyph.addJoint(start)
glyph.addJoint(end)
glyph.addJoint(bend)

glyph.addRefLine(refline(start, bend))
glyph.addRefLine(refline(bend, end))

const getComponents = (skeleton) => {
  // 根据骨架计算轮廓关键点

  const { start, bend, end } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_dian_curves, out_dian_points, in_dian_curves, in_dian_points } = FP.getCurveContours('dian', { dian_start: start, dian_bend: bend, dian_end: end }, weight)

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制右侧（外侧）轮廓
  pen.moveTo(out_dian_curves[0].start.x, out_dian_curves[0].start.y)
  for (let i = 0; i < out_dian_curves.length; i++) {
    const curve = out_dian_curves[i]
    pen.bezierTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(in_dian_curves[in_dian_curves.length - 1].end.x, in_dian_curves[in_dian_curves.length - 1].end.y)

  // 绘制左侧（内侧）轮廓
  for (let i = in_dian_curves.length - 1; i >= 0; i--) {
    const curve = in_dian_curves[i]
    pen.bezierTo(curve.control2.x, curve.control2.y, curve.control1.x, curve.control1.y, curve.start.x, curve.start.y)
  }

  // 绘制轮廓连接线
  pen.lineTo(out_dian_curves[0].start.x, out_dian_curves[0].start.y)

  pen.closePath()
  return [ pen ]
}

const components = getComponents(skeleton)
for (let i = 0; i < components.length; i++) {
  glyph.addComponent(components[i])
}