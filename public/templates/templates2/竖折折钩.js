const shu_length = glyph.getParam('竖-长度')
const zhe1_length = glyph.getParam('折1-长度')
const zhe2_horizonalSpan = glyph.getParam('折2-水平延伸')
const zhe2_verticalSpan = glyph.getParam('折2-竖直延伸')
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

// 竖
const shu_start = new FP.Joint(
  'shu_start',
  {
    x: ox - zhe1_length / 2,
    y: oy - (shu_length + zhe2_verticalSpan) / 2,
  },
)
const shu_end = new FP.Joint(
  'shu_end',
  {
    x: shu_start.x,
    y: shu_start.y + shu_length,
  },
)

// 折1
const zhe1_start = shu_end
const zhe1_end = new FP.Joint(
  'zhe1_end',
  {
    x: zhe1_start.x + zhe1_length,
    y: zhe1_start.y,
  },
)

// 折2
const zhe2_start = zhe1_end
const zhe2_end = new FP.Joint(
  'zhe2_end',
  {
    x: zhe2_start.x - zhe2_horizonalSpan,
    y: zhe2_start.y + zhe2_verticalSpan,
  },
)

// 钩
const gou_start = zhe2_end
const gou_end = new FP.Joint(
  'gou_end',
  {
    x: gou_start.x - gou_horizonalSpan,
    y: gou_start.y + gou_verticalSpan,
  },
)

glyph.addJoint(shu_start)
glyph.addJoint(shu_end)
glyph.addJoint(zhe1_start)
glyph.addJoint(zhe1_end)
glyph.addJoint(zhe2_start)
glyph.addJoint(zhe2_end)
glyph.addJoint(gou_start)
glyph.addJoint(gou_end)

const skeleton = {
  shu_start,
  shu_end,
  zhe1_start,
  zhe1_end,
  zhe2_start,
  zhe2_end,
  gou_start,
  gou_end,
}

glyph.addRefLine(refline(shu_start, shu_end))
glyph.addRefLine(refline(zhe1_start, zhe1_end))
glyph.addRefLine(refline(zhe2_start, zhe2_end))
glyph.addRefLine(refline(gou_start, gou_end))

const start_style_type = glyph.getParam('起笔风格')
const start_style_value = glyph.getParam('起笔数值')
const bending_degree = glyph.getParam('弯曲程度')
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
    zhe1_start,
    zhe1_end,
    zhe2_start,
    zhe2_end,
    gou_start,
    gou_end,
  } = skeleton

  // out指右侧（外侧）轮廓线
  // in指左侧（内侧）轮廓线
  const { out_shu_start, out_shu_end, in_shu_start, in_shu_end } = FP.getLineContours('shu', { shu_start, shu_end }, weight)
  const { out_zhe1_start, out_zhe1_end, in_zhe1_start, in_zhe1_end } = FP.getLineContours('zhe1', { zhe1_start, zhe1_end }, weight)
  const { out_zhe2_start, out_zhe2_end, in_zhe2_start, in_zhe2_end } = FP.getLineContours('zhe2', { zhe2_start, zhe2_end }, weight)
  const { out_gou_start, out_gou_end, in_gou_start, in_gou_end } = FP.getLineContours('gou', { gou_start, gou_end }, weight)
  const { corner: in_corner_shu_zhe1 } = FP.getIntersection(
    { type: 'line', start: in_shu_start, end: in_shu_end },
    { type: 'line', start: in_zhe1_start, end: in_zhe1_end },
  )
  const { corner: out_corner_shu_zhe1 } = FP.getIntersection(
    { type: 'line', start: out_shu_start, end: out_shu_end },
    { type: 'line', start: out_zhe1_start, end: out_zhe1_end },
  )
  const { corner: in_corner_zhe1_zhe2 } = FP.getIntersection(
    { type: 'line', start: in_zhe1_start, end: in_zhe1_end },
    { type: 'line', start: in_zhe2_start, end: in_zhe2_end },
  )
  const { corner: out_corner_zhe1_zhe2 } = FP.getIntersection(
    { type: 'line', start: out_zhe1_start, end: out_zhe1_end },
    { type: 'line', start: out_zhe2_start, end: out_zhe2_end },
  )
  const { corner: in_corner_zhe2_gou } = FP.getIntersection(
    { type: 'line', start: in_zhe2_start, end: in_zhe2_end },
    { type: 'line', start: in_gou_start, end: in_gou_end },
  )
  const { corner: out_corner_zhe2_gou } = FP.getIntersection(
    { type: 'line', start: out_zhe2_start, end: out_zhe2_end },
    { type: 'line', start: out_gou_start, end: out_gou_end },
  )

  // 计算折1折2拐角处内外圆角相关的点与数据
  let in_radius_zhe1_zhe2 = 60 * bending_degree
  let out_radius_zhe1_zhe2 = 80 * bending_degree
  // 如果in_radius超出折1或折2长度，取折1或折2的最小长度
  const in_radius_min_length_zhe1_zhe2 = Math.min(
    getDistance(in_corner_zhe1_zhe2, in_corner_shu_zhe1),
    getDistance(in_corner_zhe1_zhe2, in_corner_zhe2_gou),
  )
  const out_radius_min_length_zhe1_zhe2 = Math.min(
    getDistance(out_zhe1_end, out_corner_shu_zhe1),
    getDistance(out_zhe2_start, out_zhe2_end),
  )
  if (in_radius_zhe1_zhe2 >= in_radius_min_length_zhe1_zhe2) {
    in_radius_zhe1_zhe2 = in_radius_min_length_zhe1_zhe2
  }
  if (out_radius_zhe1_zhe2 >= out_radius_min_length_zhe1_zhe2) {
    out_radius_zhe1_zhe2 = out_radius_min_length_zhe1_zhe2
  }
  const in_radius_start_zhe1_zhe2= {
    x: in_corner_zhe1_zhe2.x - in_radius_zhe1_zhe2,
    y: in_corner_zhe1_zhe2.y,
  }
  const in_radius_end_zhe1_zhe2 = getRadiusPoint({
    start: in_corner_zhe1_zhe2,
    end: in_corner_zhe2_gou,
    radius: in_radius_zhe1_zhe2,
  })
  const out_radius_start_zhe1_zhe2 = {
    x: out_corner_zhe1_zhe2.x - out_radius_zhe1_zhe2,
    y: out_corner_zhe1_zhe2.y,
  }
  const out_radius_end_zhe1_zhe2 = getRadiusPoint({
    start: out_corner_zhe1_zhe2,
    end: out_corner_zhe2_gou,
    radius: out_radius_zhe1_zhe2,
  })

  // 计算折2钩拐角处内外圆角相关的点与数据
  let in_radius_zhe2_gou = 30 * bending_degree
  let out_radius_zhe2_gou = 30 * bending_degree
  // 如果in_radius超出折2或钩的长度，取折2或钩的最小长度
  const in_radius_min_length_zhe2_gou = Math.min(
    getDistance(in_corner_zhe2_gou, in_gou_end),
    getDistance(in_corner_zhe2_gou, in_radius_end_zhe1_zhe2),
  )
  const out_radius_min_length_zhe2_gou = Math.min(
    getLength(gou_horizonalSpan, gou_verticalSpan),
    getDistance(out_zhe2_end, out_radius_end_zhe1_zhe2),
  )
  if (in_radius_zhe2_gou >= in_radius_min_length_zhe2_gou) {
    in_radius_zhe2_gou = in_radius_min_length_zhe2_gou
  }
  if (out_radius_zhe2_gou >= out_radius_min_length_zhe2_gou) {
    out_radius_zhe2_gou = out_radius_min_length_zhe2_gou
  }
  const in_radius_start_zhe2_gou = getRadiusPoint({
    start: in_corner_zhe2_gou,
    end: in_corner_zhe1_zhe2,
    radius: in_radius_zhe2_gou,
  })
  const in_radius_end_zhe2_gou = getRadiusPoint({
    start: in_corner_zhe2_gou,
    end: in_gou_end,
    radius: in_radius_zhe2_gou,
  })
  const out_radius_start_zhe2_gou = getRadiusPoint({
    start: out_zhe2_end,
    end: out_radius_end_zhe1_zhe2,
    radius: out_radius_zhe2_gou,
  })
  const out_radius_end_zhe2_gou = getRadiusPoint({
    start: out_gou_start,
    end: out_gou_end,
    radius: out_radius_zhe2_gou,
  })

  let turn_data = {}
  if (turn_style_type === 1) {
    // 计算转角风格1（凸起，圆滑连接）所需要的数据
    const turn_length = 20 * turn_style_value
    const { inner_angle, mid_angle, angle1, angle2 } = FP.getTurnAngles(out_zhe1_start, out_corner_zhe1_zhe2, out_zhe2_end)
    const inner_corner_length = weight
    const corner_radius = (inner_corner_length / 2) / Math.sin(inner_angle / 2)
    const turn_control_1 = {
      x: out_corner_zhe1_zhe2.x - corner_radius,
      y: out_corner_zhe1_zhe2.y,
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
      start: out_corner_zhe1_zhe2,
      end: out_zhe2_end,
      radius: corner_radius,
    })
    const turn_start_2 = getRadiusPoint({
      start: turn_control_2,
      end: out_zhe2_end,
      radius: corner_radius,
    })
    const turn_end_2 = {
      x: turn_control_2.x + turn_length * Math.cos(mid_angle),
      y: turn_control_2.y - turn_length * Math.sin(mid_angle),
    }
    turn_data = {
      turn_start_1,
      turn_control_1,
      turn_end_1,
      turn_start_2,
      turn_control_2,
      turn_end_2,
    }
  }

  // 创建钢笔组件
  const pen = new FP.PenComponent()
  pen.beginPath()

  // 绘制右侧（外侧）轮廓
  if (start_style_type === 0) {
    // 无起笔样式
    pen.moveTo(out_shu_start.x, out_shu_start.y)
  } else if (start_style_type === 1) {
    // 起笔左右凸起长方形
    pen.moveTo(out_shu_start.x + start_style.start_style_decorator_width, out_shu_start.y)
    pen.lineTo(out_shu_start.x + start_style.start_style_decorator_width, out_shu_start.y + start_style.start_style_decorator_height)
    pen.lineTo(out_shu_start.x, out_shu_start.y + start_style.start_style_decorator_height)
  } else if (start_style_type === 2) {
    // 起笔左右凸起长方形，长方形内侧转角为圆角
    pen.moveTo(out_shu_start.x + start_style.start_style_decorator_width, out_shu_start.y)
    pen.lineTo(out_shu_start.x + start_style.start_style_decorator_width, out_shu_start.y + start_style.start_style_decorator_height)
    pen.quadraticBezierTo(
      out_shu_start.x,
      out_shu_start.y + start_style.start_style_decorator_height,
      out_shu_start.x,
      out_shu_start.y + start_style.start_style_decorator_height + start_style.start_style_decorator_radius,
    )
  }
  pen.lineTo(out_corner_shu_zhe1.x, out_corner_shu_zhe1.y)
  if (turn_style_type === 0) {
    // 默认转角样式
    // 绘制外侧折1折2圆角
    pen.lineTo(out_radius_start_zhe1_zhe2.x, out_radius_start_zhe1_zhe2.y)
    pen.quadraticBezierTo(out_corner_zhe1_zhe2.x, out_corner_zhe1_zhe2.y, out_radius_end_zhe1_zhe2.x, out_radius_end_zhe1_zhe2.y)
  } else if (turn_style_type === 1) {
    // 转角样式1
    pen.lineTo(turn_data.turn_start_1.x, turn_data.turn_start_1.y)
    pen.quadraticBezierTo(turn_data.turn_control_1.x, turn_data.turn_control_1.y, turn_data.turn_end_1.x, turn_data.turn_end_1.y)
    pen.lineTo(turn_data.turn_end_2.x, turn_data.turn_end_2.y)
    pen.quadraticBezierTo(turn_data.turn_control_2.x, turn_data.turn_control_2.y, turn_data.turn_start_2.x, turn_data.turn_start_2.y)
  }
  // 绘制外侧折2钩圆角
  pen.lineTo(out_radius_start_zhe2_gou.x, out_radius_start_zhe2_gou.y)
  pen.quadraticBezierTo(out_corner_zhe2_gou.x, out_corner_zhe2_gou.y, out_radius_end_zhe2_gou.x, out_radius_end_zhe2_gou.y)
  pen.lineTo(out_gou_end.x, out_gou_end.y)

  // 绘制轮廓连接线
  pen.lineTo(in_gou_end.x, in_gou_end.y)

  // 绘制左侧（内侧）轮廓
  // 绘制内侧折2钩圆角
  pen.lineTo(in_radius_end_zhe2_gou.x, in_radius_end_zhe2_gou.y)
  pen.quadraticBezierTo(in_corner_zhe2_gou.x, in_corner_zhe2_gou.y, in_radius_start_zhe2_gou.x, in_radius_start_zhe2_gou.y)
  // 绘制内侧折1折2圆角
  pen.lineTo(in_radius_end_zhe1_zhe2.x, in_radius_end_zhe1_zhe2.y)
  pen.quadraticBezierTo(in_corner_zhe1_zhe2.x, in_corner_zhe1_zhe2.y, in_radius_start_zhe1_zhe2.x, in_radius_start_zhe1_zhe2.y)
  pen.lineTo(in_corner_shu_zhe1.x, in_corner_shu_zhe1.y)
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(in_shu_start.x, in_shu_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(in_shu_start.x, in_shu_start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_shu_start.x - start_style.start_style_decorator_width, in_shu_start.y + start_style.start_style_decorator_height)
    pen.lineTo(in_shu_start.x - start_style.start_style_decorator_width, in_shu_start.y)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(
      in_shu_start.x,
      in_shu_start.y + start_style.start_style_decorator_height + start_style.start_style_decorator_radius,
    )
    pen.quadraticBezierTo(
      in_shu_start.x,
      in_shu_start.y + start_style.start_style_decorator_height,
      in_shu_start.x - start_style.start_style_decorator_width,
      in_shu_start.y + start_style.start_style_decorator_height,
    )
    pen.lineTo(in_shu_start.x - start_style.start_style_decorator_width, in_shu_start.y)
  }

  // 绘制轮廓连接线
  if (start_style_type === 0) {
    // 无起笔样式
    pen.lineTo(out_shu_start.x, out_shu_start.y)
  } else if (start_style_type === 1) {
    // 起笔上下凸起长方形
    pen.lineTo(out_shu_start.x + start_style.start_style_decorator_width, out_shu_start.y)
  } else if (start_style_type === 2) {
    // 起笔上下凸起长方形，长方形内侧转角为圆角
    pen.lineTo(out_shu_start.x + start_style.start_style_decorator_width, out_shu_start.y)
  }

  pen.closePath()
  return [ pen ]
}

const components = getComponents(skeleton)
for (let i = 0; i < components.length; i++) {
  glyph.addComponent(components[i])
}