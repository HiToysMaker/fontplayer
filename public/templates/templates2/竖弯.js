const shu_horizonalSpan = glyph.getParam('竖-水平延伸')
const shu_verticalSpan = glyph.getParam('竖-竖直延伸')
const wan_length = glyph.getParam('弯-长度')
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
    x: ox - (shu_horizonalSpan + wan_length) / 2,
    y: oy - shu_verticalSpan / 2,
  },
)
const shu_end = new FP.Joint(
  'shu_end',
  {
    x: shu_start.x + shu_horizonalSpan,
    y: shu_start.y + shu_verticalSpan,
  },
)

// 弯
const wan_start = shu_end
const wan_end = new FP.Joint(
  'wan_end',
  {
    x: wan_start.x + wan_length,
    y: wan_start.y,
  },
)

glyph.addJoint(shu_start)
glyph.addJoint(shu_end)
glyph.addJoint(wan_start)
glyph.addJoint(wan_end)

const skeleton = {
  shu_start,
  shu_end,
  wan_start,
  wan_end,
}

glyph.addRefLine(refline(shu_start, shu_end))
glyph.addRefLine(refline(wan_start, wan_end))

const start_style_type = glyph.getParam('起笔风格')
const start_style_value = glyph.getParam('起笔数值')
const bending_degree = glyph.getParam('弯曲程度')

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
    shu_start,
    shu_end,
    wan_start,
    wan_end,
  } = skeleton

  // out指左侧（外侧）轮廓线
  // in指右侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start, shu_end }, weight, {
    unticlockwise: true,
  })
  const { out_wan_start, out_wan_end, in_wan_start, in_wan_end } = FP.getLineContours('wan', { wan_start, wan_end }, weight, {
    unticlockwise: true,
  })
  const { corner: in_corner_shu_wan } = FP.getIntersection(
    { type: 'line', start: in_shu_start, end: in_shu_end },
    { type: 'line', start: in_wan_start, end: in_wan_end },
  )
  const { corner: out_corner_shu_wan } = FP.getIntersection(
    { type: 'line', start: out_shu_start, end: out_shu_end },
    { type: 'line', start: out_wan_start, end: out_wan_end },
  )

  // 计算竖弯拐角处内外圆角相关的点与数据
  let in_radius_shu_wan = 60 * bending_degree
  let out_radius_shu_wan = 80 * bending_degree
  // 如果in_radius超出竖或弯长度，取竖或弯的最小长度
  const in_radius_min_length_shu_wan = Math.min(
    getDistance(in_corner_shu_wan, in_shu_start),
    getDistance(in_corner_shu_wan, in_wan_end),
  )
  const out_radius_min_length_shu_wan = Math.min(
    getDistance(out_wan_end, out_shu_start),
    getDistance(out_wan_start, out_wan_end),
  )
  if (in_radius_shu_wan >= in_radius_min_length_shu_wan) {
    in_radius_shu_wan = in_radius_min_length_shu_wan
  }
  if (out_radius_shu_wan >= out_radius_min_length_shu_wan) {
    out_radius_shu_wan = out_radius_min_length_shu_wan
  }
  const in_radius_start_shu_wan = {
    x: in_corner_shu_wan.x,
    y: in_corner_shu_wan.y - in_radius_shu_wan,
  }
  const in_radius_end_shu_wan = getRadiusPoint({
    start: in_corner_shu_wan,
    end: in_wan_end,
    radius: in_radius_shu_wan,
  })
  const out_radius_start_shu_wan = {
    x: out_corner_shu_wan.x,
    y: out_corner_shu_wan.y - out_radius_shu_wan,
  }
  const out_radius_end_shu_wan = getRadiusPoint({
    start: out_corner_shu_wan,
    end: out_wan_end,
    radius: out_radius_shu_wan,
  })

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
  // 绘制外侧竖弯圆角
  pen.lineTo(out_radius_start_shu_wan.x, out_radius_start_shu_wan.y)
  pen.quadraticBezierTo(out_corner_shu_wan.x, out_corner_shu_wan.y, out_radius_end_shu_wan.x, out_radius_end_shu_wan.y)
  // 绘制外侧弯
  pen.lineTo(out_wan_end.x, out_wan_end.y)

  // 绘制轮廓连接线
  pen.lineTo(in_wan_end.x, in_wan_end.y)

  // 绘制右侧（内侧）轮廓
  // 绘制内侧竖弯圆角
  pen.lineTo(in_radius_end_shu_wan.x, in_radius_end_shu_wan.y)
  pen.quadraticBezierTo(in_corner_shu_wan.x, in_corner_shu_wan.y, in_radius_start_shu_wan.x, in_radius_start_shu_wan.y)
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