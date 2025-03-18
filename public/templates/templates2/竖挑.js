const shu_length = glyph.getParam('竖-长度')
const tiao_horizonalSpan = glyph.getParam('挑-水平延伸')
const tiao_verticalSpan = glyph.getParam('挑-竖直延伸')
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

// 竖
const shu_start = new FP.Joint(
  'shu_start',
  {
    x: ox - tiao_horizonalSpan / 2,
    y: oy - shu_length / 2,
  },
)
const shu_end = new FP.Joint(
  'shu_end',
  {
    x: shu_start.x,
    y: shu_start.y + shu_length,
  },
)

// 挑
const tiao_start = shu_end
const tiao_end = new FP.Joint(
  'tiao_end',
  {
    x: tiao_start.x + tiao_horizonalSpan,
    y: tiao_start.y - tiao_verticalSpan,
  },
)

glyph.addJoint(shu_start)
glyph.addJoint(shu_end)
glyph.addJoint(tiao_start)
glyph.addJoint(tiao_end)

const skeleton = {
  shu_start,
  shu_end,
  tiao_start,
  tiao_end,
}

glyph.addRefLine(refline(shu_start, shu_end))
glyph.addRefLine(refline(tiao_start, tiao_end))

const start_style_type = glyph.getParam('起笔风格')
const start_style_value = glyph.getParam('起笔数值')
const turn_style_type = glyph.getParam('转角风格')
const turn_style_value = glyph.getParam('转角数值')

const getStartStyle = (start_style_type, start_style_value) => {
  if (start_style_type === 1) {
    // 起笔上下凸起长方形
    return {
      start_style_decorator_height: start_style_value * 20,
      start_style_decorator_width: weight * 0.25,
    }
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    return {
      start_style_decorator_height: start_style_value * 20,
      start_style_decorator_width: weight * 0.25,
      start_style_decorator_radius: 20,
    }
  }
  return {}
}

const start_style = getStartStyle(start_style_type, start_style_value)

const getComponents = (skeleton) => {
  // 根据骨架计算轮廓关键点

  const {
    shu_start,
    shu_end,
    tiao_start,
    tiao_end,
  } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start, shu_end }, weight, {
    unticlockwise: true,
  })
  const { out_tiao_start, out_tiao_end, in_tiao_start, in_tiao_end } = FP.getLineContours('tiao', { tiao_start, tiao_end }, weight, {
    unticlockwise: true,
  })
  const { corner: out_corner_shu_tiao } = FP.getIntersection(
    { type: 'line', start: out_shu_start, end: out_shu_end },
    { type: 'line', start: out_tiao_start, end: out_tiao_end },
  )
  const { corner: in_corner_shu_tiao } = FP.getIntersection(
    { type: 'line', start: in_shu_start, end: in_shu_end },
    { type: 'line', start: in_tiao_start, end: in_tiao_end },
  )
  const tiao_angle = Math.atan2(tiao_start.y - tiao_end.y, tiao_end.x - tiao_start.x)
  const out_corner_shu_tiao_1 = {
    x: out_corner_shu_tiao.x - weight * Math.sin(tiao_angle),
    y: out_corner_shu_tiao.y - weight * Math.cos(tiao_angle)
  }
  const { corner: out_corner_shu_tiao_2 } = FP.getIntersection(
    { type: 'line', start: out_shu_start, end: out_shu_end },
    { type: 'line', start: in_tiao_start, end: in_tiao_end },
  )

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制左侧（外侧）轮廓
  if (start_style_type === 0) {
    // 无起笔样式
    pen.moveTo(out_shu_start.x, out_shu_start.y)
  } else if (start_style_type === 1) {
    // 起笔左右凸起长方形
    pen.moveTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y)
    pen.lineTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y + start_style.start_style_decorator_height)
    pen.lineTo(out_shu_start.x, out_shu_start.y + start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔左右凸起长方形，长方形内侧转角为圆角
    pen.moveTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y)
    pen.lineTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y + start_style.start_style_decorator_height)
    pen.quadraticBezierTo(
      out_shu_start.x,
      out_shu_start.y + start_style.start_style_decorator_height,
      out_shu_start.x,
      out_shu_start.y + start_style.start_style_decorator_height + start_style.start_style_decorator_radius,
    )
  }
  pen.lineTo(out_corner_shu_tiao_2.x, out_corner_shu_tiao_2.y)
  pen.lineTo(out_corner_shu_tiao_1.x, out_corner_shu_tiao_1.y)
  pen.lineTo(out_corner_shu_tiao.x, out_corner_shu_tiao.y)
  pen.lineTo(out_tiao_end.x, out_tiao_end.y)

  // 绘制轮廓连接线
  pen.lineTo(in_tiao_end.x, in_tiao_end.y)

  // 绘制右侧（内侧）轮廓
  pen.lineTo(in_corner_shu_tiao.x, in_corner_shu_tiao.y)
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(in_shu_start.x, in_shu_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(in_shu_start.x, in_shu_start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(
      in_shu_start.x,
      in_shu_start.y + start_style.start_style_decorator_height + start_style.start_style_decorator_radius,
    )
    pen.quadraticBezierTo(
      in_shu_start.x,
      in_shu_start.y + start_style.start_style_decorator_height,
      in_shu_start.x + start_style.start_style_decorator_width,
      in_shu_start.y + start_style.start_style_decorator_height,
    )
    pen.lineTo(in_shu_start.x + start_style.start_style_decorator_width, in_shu_start.y)
  }

  // 绘制轮廓连接线
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(out_shu_start.x, out_shu_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(out_shu_start.x - start_style.start_style_decorator_width, out_shu_start.y)
  }

  pen.closePath()
  return [ pen ]
}

const components = getComponents(skeleton)
for (let i = 0; i < components.length; i++) {
  glyph.addComponent(components[i])
}